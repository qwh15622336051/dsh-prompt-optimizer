import { DESCRIPTORS, NAMESPACE, PACKAGE } from './contract.js';
import { CONFIG_KEYS, Config, SETTINGS_NAMESPACE, SETTINGS_SCHEMA, materializeConfig } from './config.js';

/**
 * Plugin name; must equal the Loader entry id so the configuration form and
 * the `plugins.row.config` key line up.
 */
export const name = 'prompt-optimizer';

/** The Typert registry is the only hard dependency; everything else is read optionally. */
export const inject = ['typert'];

export { Config };

/**
 * Marker key read by `remoteMethods()`. The protocol stores method markers
 * under this exact string property, so plain JavaScript can publish the same
 * metadata the `@Remote` decorator would without needing decorator syntax.
 */
const REMOTE_METHOD_DESCRIPTOR = '@deepseek-ai/dsh-typert-protocol/remote-methods';

/** Longest delay a single `setTimeout` accepts. */
const MAX_TIMER_DELAY_MS = 2147483647;

/** Utf-8 decoder reused for every truncated file read. */
const utf8 = new TextDecoder('utf-8', { fatal: false });

/** Strip the `@` / `@"…"` mention wrapper to recover the referenced path. */
function mentionToPath(ref) {
  if (typeof ref !== 'string') return '';
  if (ref.startsWith('@"') && ref.endsWith('"')) return ref.slice(2, -1);
  return ref.startsWith('@') ? ref.slice(1) : ref;
}

/** Read one directory-entry name without assuming a single entry shape. */
function entryName(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const value = entry.name ?? entry.path ?? entry.target;
    if (typeof value === 'string') return value.endsWith('/') ? value : value;
  }
  return '';
}

/**
 * Reduce raw model output to the rewritten prompt alone.
 *
 * Models occasionally wrap the answer in a fenced block or prefix a label even
 * though the instruction forbids both; removing those two shapes here keeps a
 * good answer from being rejected.
 * @param {unknown} raw - assembled model text.
 * @returns {string} the rewritten prompt, or an empty string.
 */
function extractPrompt(raw) {
  let out = typeof raw === 'string' ? raw.trim() : '';
  if (out === '') return '';
  const fenced = /^```[A-Za-z0-9_-]*[ \t]*\r?\n([\s\S]*?)\r?\n?```$/.exec(out);
  if (fenced) out = fenced[1].trim();
  out = out.replace(
    /^(?:优化后的?提示词|改写后的?提示词|优化结果|优化后的?描述|Optimized prompt|Rewritten prompt|Optimized request)\s*[:：]\s*/i,
    '',
  );
  return out.trim();
}

/** Keep only known configuration keys from an untrusted patch. */
function sanitizePatch(patch) {
  if (!patch || typeof patch !== 'object') return {};
  const known = new Set(CONFIG_KEYS);
  const out = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!known.has(key)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Host half of the prompt optimizer.
 *
 * Owns the model call and the settings surface; the browser half owns the
 * button and the form. Every method is reachable only through the Typert
 * Gateway for this package's own namespace.
 */
class PromptOptimizerRemote {
  /**
   * @param {object} ctx - owning Cordis context (already injects `typert`).
   * @param {() => object | undefined} readConfig - reads the live configuration.
   */
  constructor(ctx, readConfig) {
    this.ctx = ctx;
    this.readConfig = readConfig;
  }

  /** Current configuration, default-filled. */
  #config() {
    const config = this.readConfig();
    if (!config) throw new Error('提示词优化配置尚未就绪，请稍后重试。');
    return config;
  }

  /** Resolve the model route: explicit setting, then the Session's logged route, then the deployment default. */
  #route(session, config) {
    if (config.provider && config.model) return { provider: config.provider, model: config.model };
    const header = typeof session?.requestHeader === 'function' ? session.requestHeader() : undefined;
    const logged = header?.config;
    if (logged?.provider && logged?.model) return { provider: logged.provider, model: logged.model };
    const fallback = this.ctx.get('agentDefaultModel')?.currentSelection?.();
    if (fallback?.provider && fallback?.model) {
      return { provider: fallback.provider, model: fallback.model };
    }
    throw new Error('无法确定优化用的模型。请在插件设置中选择一个模型。');
  }

  /**
   * Read the content behind the draft's reference chips.
   *
   * Reads stay inside the Session working directory, are truncated per file and
   * in total, and never fail the whole optimization: an unreadable reference
   * contributes its label only.
   * @returns {Promise<{ block: string, warnings: string[] }>}
   */
  async #referenceContext(agent, references, config) {
    const entries = Array.isArray(references) ? references : [];
    if (entries.length === 0) return { block: '', warnings: [] };
    if (!config.includeReferenceContent) return { block: '', warnings: [] };
    if (config.maxReferenceFileChars === 0 || config.maxReferenceTotalChars === 0) {
      return { block: '', warnings: [] };
    }
    const fs = this.ctx.get('fs');
    const workingDirectory = this.ctx.get('workingDirectory');
    if (!fs || !workingDirectory) return { block: '', warnings: [] };

    let root;
    try {
      root = await fs.resolve(workingDirectory.get(agent.session));
    } catch {
      return { block: '', warnings: [] };
    }

    const sections = [];
    const warnings = [];
    let used = 0;

    for (const entry of entries) {
      if (used >= config.maxReferenceTotalChars) {
        warnings.push('引用内容已达总量上限，其余引用未读取。');
        break;
      }
      const kind = typeof entry?.kind === 'string' ? entry.kind : '';
      const label = typeof entry?.label === 'string' && entry.label !== '' ? entry.label : String(entry?.ref ?? '');

      if (kind === 'session') {
        const snapshot = await this.#sessionReference(agent, entry, warnings);
        if (snapshot === '') continue;
        const room = Math.min(snapshot.length, config.maxReferenceTotalChars - used);
        sections.push(`### 引用会话：${label}\n${snapshot.slice(0, room)}`);
        used += room;
        continue;
      }
      if (kind !== 'file' && kind !== 'folder') continue;

      const relative = mentionToPath(entry?.ref);
      if (relative === '') continue;
      try {
        const target = await fs.resolve(relative, { cwd: workingDirectory.get(agent.session) });
        if (!fs.contains(root, target)) {
          warnings.push(`引用 ${label} 位于会话目录之外，已跳过。`);
          continue;
        }
        if (kind === 'folder') {
          const listing = await fs.listDir(target);
          const names = (listing ?? []).map(entryName).filter((value) => value !== '');
          const body = names.length === 0 ? '（空目录）' : names.join('\n');
          const room = Math.min(body.length, config.maxReferenceTotalChars - used);
          sections.push(`### 引用文件夹：${relative}\n${body.slice(0, room)}`);
          used += room;
          continue;
        }
        if (config.maxReferenceFileChars === 0) continue;
        const room = Math.min(config.maxReferenceFileChars, config.maxReferenceTotalChars - used);
        const capBytes = Math.max(64, room * 4);
        const info = await fs.stat(target);
        const bytes = await fs.readBytes(target, undefined, capBytes);
        let body = utf8.decode(bytes);
        let truncated = false;
        if (typeof info?.size === 'number' && info.size > bytes.length) truncated = true;
        if (body.length > room) {
          body = body.slice(0, room);
          truncated = true;
        }
        sections.push(
          `### 引用文件：${relative}${truncated ? '（已截断）' : ''}\n${body}`,
        );
        used += body.length;
      } catch (error) {
        warnings.push(`引用 ${label} 读取失败：${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (sections.length === 0) return { block: '', warnings };
    return { block: sections.join('\n\n'), warnings };
  }

  /** Snapshot one referenced Session through the Host resolver; degrade to nothing on failure. */
  async #sessionReference(agent, entry, warnings) {
    const resolver = this.ctx.get('sessionReferenceResolver');
    const sessionId = mentionToPath(entry?.ref);
    if (!resolver || sessionId === '') {
      warnings.push(`引用会话 ${entry?.label ?? ''} 无法读取，已仅保留标签。`);
      return '';
    }
    try {
      const prepared = await resolver.prepare(agent, [], [{ sessionId }], undefined);
      const message = prepared?.additionalContext;
      const blocks = Array.isArray(message?.content) ? message.content : [];
      return blocks
        .filter((block) => block?.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n');
    } catch (error) {
      warnings.push(
        `引用会话 ${entry?.label ?? ''} 读取失败：${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    }
  }

  /** Compose the optimizer's user turn. */
  #userInput(text, referenceBlock) {
    if (referenceBlock === '') {
      return `请改写下面这段需求描述：\n\n${text}`;
    }
    return [
      '请改写下面这段需求描述。',
      '',
      '【原始描述】',
      text,
      '',
      '【引用内容（仅供你理解上下文，不要在改写结果中复述）】',
      referenceBlock,
    ].join('\n');
  }

  /** Run one auxiliary model call and assemble its text. */
  async #callModel(config, route, userInput, sessionId) {
    const llm = this.ctx.get('llm');
    if (!llm) throw new Error('宿主未提供 llm 服务，无法调用模型。');

    const controller = new AbortController();
    const delay = Math.min(Math.max(1000, config.timeoutMs), MAX_TIMER_DELAY_MS);
    const timer = setTimeout(() => controller.abort(), delay);
    try {
      const call = await llm.prepareCall(
        { provider: route.provider, model: route.model, maxTokens: config.maxTokens },
        controller.signal,
        (controls, model) => {
          const effort = model?.reasoning?.efforts?.[0]?.id;
          return effort === undefined ? controls : { ...controls, reasoningEffort: effort };
        },
      );
      const options = {
        ...call.config,
        messages: [{ role: 'user', content: [{ type: 'text', text: userInput }] }],
        system: config.systemPrompt,
        sessionId,
        signal: controller.signal,
      };
      let raw = '';
      let finish;
      for await (const chunk of call.stream(options)) {
        if (chunk?.type === 'text-delta') raw += chunk.text;
        else if (chunk?.type === 'finish') finish = chunk.reason;
      }
      if (finish?.kind === 'error') {
        throw new Error(finish.failure?.message ?? '模型调用失败。');
      }
      if (finish?.kind === 'aborted') {
        throw new Error(controller.signal.aborted ? `优化超时（${config.timeoutMs} 毫秒）。` : '优化已取消。');
      }
      return raw;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Rewrite one draft into a clearer prompt.
   * @param {string} sessionId - addressed Session.
   * @param {string} text - current draft text.
   * @param {Array<object>} references - structured reference chips.
   * @returns {Promise<object>} the rewritten prompt and the route actually used.
   */
  async optimize(sessionId, text, references) {
    const config = this.#config();
    if (!config.enabled) throw new Error('提示词优化已关闭。');
    if (typeof text !== 'string' || text.trim() === '') throw new Error('输入框为空，没有可优化的内容。');
    if (text.length > config.maxInputChars) {
      throw new Error(`草稿超过 ${config.maxInputChars} 字上限，请缩短后再试。`);
    }
    const agent = this.ctx.get('agents')?.get(sessionId);
    if (!agent) throw new Error('会话尚未加载或已关闭，请重新打开会话后重试。');

    const route = this.#route(agent.session, config);
    const context = await this.#referenceContext(agent, references, config);
    const raw = await this.#callModel(
      config,
      route,
      this.#userInput(text, context.block),
      agent.session.id,
    );
    const optimized = extractPrompt(raw);
    if (optimized === '') throw new Error('模型没有返回可用的提示词，请重试。');
    return {
      text: optimized,
      provider: route.provider,
      model: route.model,
      referenceChars: context.block.length,
      warnings: context.warnings,
    };
  }

  /** Enumerate every currently routable model, grouped by provider. */
  async #modelCatalog() {
    const llm = this.ctx.get('llm');
    const providers = [];
    const failures = [];
    let list = [];
    try {
      list = llm?.listProviders?.() ?? [];
    } catch (error) {
      failures.push({
        id: 'llm',
        name: 'llm',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    for (const info of list) {
      try {
        const models = await llm.listModels(info.id);
        providers.push({
          id: info.id,
          name: info.name ?? info.id,
          models: (models ?? []).map((model) => ({ id: model.id, name: model.name ?? model.id })),
        });
      } catch (error) {
        failures.push({
          id: info.id,
          name: info.name ?? info.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const selection = this.ctx.get('agentDefaultModel')?.currentSelection?.();
    return {
      providers,
      failures,
      defaultModel: selection ? { provider: selection.provider, model: selection.model } : undefined,
    };
  }

  /**
   * Read the configuration form's values, defaults and revision.
   * @returns {Promise<object>} settings plus the routable model directory.
   */
  async getSettings() {
    const defaults = SETTINGS_SCHEMA({});
    const values = this.readConfig() ?? defaults;
    const descriptor = this.ctx
      .get('settings')
      ?.describe()
      ?.find((item) => item.ns === SETTINGS_NAMESPACE);
    const catalog = await this.#modelCatalog();
    return {
      values,
      defaults,
      revision: typeof descriptor?.revision === 'number' ? descriptor.revision : 0,
      providers: catalog.providers,
      failures: catalog.failures,
      defaultModel: catalog.defaultModel,
    };
  }

  /**
   * Merge changed fields into this entry's configuration.
   * @param {object} patch - changed fields only.
   * @param {number} revision - revision returned by `getSettings`.
   * @returns {Promise<object>} the settings after the write.
   */
  async setSettings(patch, revision) {
    const settings = this.ctx.get('settings');
    if (!settings) throw new Error('宿主未提供设置服务，请改为编辑 cordis.patch.yml。');
    const clean = sanitizePatch(patch);
    if (Object.keys(clean).length === 0) throw new Error('没有需要保存的修改。');
    let validated;
    try {
      validated = SETTINGS_SCHEMA({ ...(this.readConfig() ?? SETTINGS_SCHEMA({})), ...clean });
    } catch (error) {
      throw new Error(`配置无效：${error instanceof Error ? error.message : String(error)}`);
    }
    await settings.update(
      SETTINGS_NAMESPACE,
      validated,
      Number.isInteger(revision) && revision >= 0 ? revision : undefined,
    );
    return this.getSettings();
  }
}

// Publish the same method markers the `@Remote()` decorator would install.
Object.defineProperty(PromptOptimizerRemote.prototype, REMOTE_METHOD_DESCRIPTOR, {
  configurable: true,
  value: Object.freeze({
    version: 1,
    methods: Object.freeze(
      ['optimize', 'getSettings', 'setSettings'].map((method) =>
        Object.freeze({ method, invocation: Object.freeze({ kind: 'direct' }) }),
      ),
    ),
  }),
});

/**
 * Host entry point.
 * @param {object} ctx - plugin context.
 * @param {object} config - live `Config` reference.
 */
export function apply(ctx, config) {
  const readConfig = () => materializeConfig(config);
  const service = new PromptOptimizerRemote(ctx, readConfig);
  // The Typert Gateway resolves a namespace's receiver by reading this exact
  // binding off the registered Service, so a plain provided object must carry
  // the same shape `TypertRemoteService` would have installed. Doing it by hand
  // keeps this half free of any `@deepseek-ai/*` runtime import.
  service.typertRemote = Object.freeze({
    service,
    serviceKey: NAMESPACE,
    namespace: NAMESPACE,
  });
  ctx.provide(NAMESPACE, service);
  ctx.effect(() =>
    ctx.typert.register({
      package: PACKAGE,
      face: 'host',
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: DESCRIPTORS,
    }),
  );
  // This plugin renders its own configuration page, so suppress the generated one.
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
  });
}
