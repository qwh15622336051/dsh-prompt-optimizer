import Schema from '@deepseek-ai/schemastery';

/**
 * Configuration namespace. Equal to the Loader entry id declared in
 * `cordis.patch.yml`, because `ctx.settings.describe()` keys forms by entry id.
 */
export const SETTINGS_NAMESPACE = 'prompt-optimizer';

/** Default rewriting instruction. Users replace this wholesale in the settings page. */
export const DEFAULT_SYSTEM_PROMPT = [
  '你是一个提示词优化器。用户会给你一段口语化的需求描述，其中可能包含 @ 引用标记（如 @src/index.ts）以及被引用内容的摘录。',
  '你的任务是把它改写成一条清晰、具体、可执行的提示词，供 AI 编程助手使用。',
  '',
  '要求：',
  '1. 保留用户的原始意图。不要增加用户没有提出的需求，不要替用户做技术选型决定。',
  '2. 输出语言与用户输入保持一致。',
  '3. 补齐表述中缺失的关键信息：明确的目标、必要的约束、期望的输出形式。信息不足时用中性表述，不要编造具体事实（不要杜撰文件名、版本号、接口名）。',
  '4. 如果提供了「引用内容」，用它让提示词更具体（例如点出实际涉及的函数、类型、文件），但不要大段复述引用内容。',
  '5. 必须原样保留所有 @ 引用标记，不要改写、翻译、拆分或删除它们。',
  '6. 不要回答问题，不要执行用户的请求，只做改写。',
  '7. 直接输出改写后的提示词正文。不要输出前言、解释、总结、引号或 Markdown 代码块围栏。',
].join('\n');

/** Editable preference fields; the Host validates and fills defaults through this schema. */
export const SETTINGS_SCHEMA = Schema.object({
  enabled: Schema.boolean()
    .default(true)
    .description('总开关。关闭后输入框旁的优化按钮隐藏。'),
  provider: Schema.string()
    .default('')
    .description('优化用模型的厂商。留空表示跟随当前会话使用的模型。'),
  model: Schema.string()
    .default('')
    .description('优化用的模型 ID。留空表示跟随当前会话使用的模型。'),
  systemPrompt: Schema.string()
    .default(DEFAULT_SYSTEM_PROMPT)
    .description('改写指令（系统提示词）。整段可自由修改。'),
  maxTokens: Schema.number()
    .min(64)
    .max(32000)
    .step(1)
    .default(2000)
    .description('改写结果的最大输出 token 数。'),
  timeoutMs: Schema.number()
    .min(1000)
    .max(600000)
    .step(1)
    .default(30000)
    .description('单次优化请求的超时时间（毫秒）。'),
  maxInputChars: Schema.number()
    .min(1)
    .max(100000)
    .step(1)
    .default(4000)
    .description('允许提交改写的草稿最大字符数，超出时按钮不可用。'),
  includeReferenceContent: Schema.boolean()
    .default(true)
    .description('是否读取 @文件 / @文件夹 / @会话 引用指向的内容并交给优化模型参考。'),
  maxReferenceFileChars: Schema.number()
    .min(0)
    .max(200000)
    .step(1)
    .default(8000)
    .description('单个被引用文件最多读取的字符数。0 表示不读文件内容。'),
  maxReferenceTotalChars: Schema.number()
    .min(0)
    .max(400000)
    .step(1)
    .default(32000)
    .description('所有引用内容合计的最大字符数。'),
});

/** Live configuration reference injected into the plugin entry. */
export const Config = SETTINGS_SCHEMA.volatile();

/** Every editable configuration key, in form order. */
export const CONFIG_KEYS = [
  'enabled',
  'provider',
  'model',
  'systemPrompt',
  'maxTokens',
  'timeoutMs',
  'maxInputChars',
  'includeReferenceContent',
  'maxReferenceFileChars',
  'maxReferenceTotalChars',
];

/** Unwrap a schemastery volatile reference into its current plain value. */
function unwrap(value) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    return value.get();
  }
  return value;
}

/**
 * Read the current configuration as plain, default-filled values.
 * @param {unknown} config - the `Config` reference or a plain object.
 * @returns {object | undefined} validated values, or undefined before the settings service is ready.
 */
export function materializeConfig(config) {
  const root = unwrap(config);
  if (!root || typeof root !== 'object') return undefined;
  const plain = Object.fromEntries(Object.entries(root).map(([key, value]) => [key, unwrap(value)]));
  try {
    return SETTINGS_SCHEMA(plain);
  } catch {
    return undefined;
  }
}
