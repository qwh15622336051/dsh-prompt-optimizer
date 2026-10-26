/**
 * Browser half of the prompt optimizer.
 *
 * Dependency-free on purpose: the Client module table only resolves platform
 * seed words and registered packages, so this file imports nothing but `react`
 * and inlines its own copy of the Remote descriptors and its dictionaries.
 * Keep `DESCRIPTORS` in sync with `contract.js` (package, namespace, method
 * names, parameter wire names and order).
 */
window.__ModuleLoader__.load({
  id: '@huanhuan123/dsh-prompt-optimizer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    // A portal escapes the transcript's clipping. Absent react-dom, the dialog
    // degrades to inline fixed positioning instead of failing to render.

    /** Package identity; must equal package.json `name`. */
    const PACKAGE = '@huanhuan123/dsh-prompt-optimizer';
    /** Wire namespace; also the Cordis Service key of the Host Remote service. */
    const NAMESPACE = 'promptOptimizer';
    /** Loader row id declared by cordis.patch.yml. */
    const ROW_ID = 'prompt-optimizer';

    /** Permissive codec stand-in; the Gateway only requires `mode: 'strict'`. */
    function stubSchema() {
      const schema = {
        optional: () => schema,
        nonoptional: () => schema,
        parse: (value) => value,
        safeParse: (value) => ({ success: true, data: value }),
        jsonSchema: { type: 'object', additionalProperties: true },
      };
      return schema;
    }
    function codec(typeSymbol) {
      return { mode: 'strict', typeSymbol, create: stubSchema };
    }
    function parameter(name) {
      return { name, wire: name, source: 'json', codec: codec(name) };
    }

    const DESCRIPTORS = [
      {
        id: `${PACKAGE}#${NAMESPACE}/optimize`,
        namespace: NAMESPACE,
        service: NAMESPACE,
        method: 'optimize',
        invocation: { kind: 'direct' },
        parameters: [parameter('sessionId'), parameter('text'), parameter('references')],
        result: codec('PromptOptimizeResult'),
      },
      {
        id: `${PACKAGE}#${NAMESPACE}/getSettings`,
        namespace: NAMESPACE,
        service: NAMESPACE,
        method: 'getSettings',
        invocation: { kind: 'direct' },
        parameters: [],
        result: codec('PromptOptimizerSettings'),
      },
      {
        id: `${PACKAGE}#${NAMESPACE}/setSettings`,
        namespace: NAMESPACE,
        service: NAMESPACE,
        method: 'setSettings',
        invocation: { kind: 'direct' },
        parameters: [parameter('patch'), parameter('revision')],
        result: codec('PromptOptimizerSettings'),
      },
    ];

    const TYPERT_REMOTE = { package: PACKAGE, descriptors: DESCRIPTORS };

    /**
     * Interface copy. Values are plain strings or functions of one argument;
     * this plugin resolves them itself rather than registering with the locale
     * service, whose dictionaries are flat string maps.
     */
    const DICTS = {
      zh: {
        buttonTitle: '优化提示词',
        buttonBusy: '正在优化提示词…',
        buttonEmpty: '先输入内容，再点优化',
        buttonTooLong: (n) => `草稿超过 ${n} 字上限`,
        buttonLocked: '当前输入状态不支持优化',
        failed: '优化失败',
        droppedReference: '优化完成，但有引用标记未被保留，已按纯文本填回。',
        chipsNotPreserved: '优化结果首次未能写入输入框，已按纯文本重试（引用标记可能丢失）。',
        settingsTitle: '提示词优化',
        settingsSummary: '在输入框发送键旁提供一键优化提示词的按钮。',
        model: '优化用的模型',
        follow: '跟随当前会话',
        modelHint: '只能选择 DeepSeek Harness 中已配置好的模型。',
        failures: '以下厂商当前不可用',
        prompt: '改写指令（系统提示词）',
        promptHint: '这段文字会作为系统提示词发给优化模型。可整段改成你自己的风格。',
        limits: '请求限制',
        enabled: '启用优化按钮',
        includeReferences: '读取 @ 引用指向的内容',
        includeReferencesHint: '开启后会读取被引用文件/文件夹/会话的内容，交给优化模型参考。读取范围限于当前会话工作目录。',
        maxTokens: '最大输出 token',
        timeoutMs: '超时（毫秒）',
        maxInputChars: '草稿字数上限',
        maxReferenceFileChars: '单文件读取上限（字符）',
        maxReferenceTotalChars: '引用内容总量上限（字符）',
        save: '保存',
        saving: '保存中…',
        discard: '放弃修改',
        restore: '全部恢复默认',
        loading: '正在读取配置…',
        saved: '已保存',
        dirty: '有未保存的修改',
        synced: '配置已同步',
        loadFailed: '无法读取配置，请检查连接后重试。',
        beta: 'BETA',
        retractSection: '消息撤回与编辑',
        betaNote: '标有 BETA 的功能为测试版，会改写对话记录。两项默认关闭。',
        enableRetract: '允许撤回已发送的消息',
        enableEdit: '允许编辑最后一条消息',
        rollbackRefillDraft: '撤回 / 编辑后把原文回填输入框',
        recallRetract: '撤回',
        recallRetractHint: '撤回这条消息：对话回到它发送之前，原会话归档保留',
        recallEdit: '编辑',
        recallEditHint: '编辑最后一条消息：对话回到它发送之前，原文回填输入框',
        recallConfirm: '确定要撤回这条消息吗？\n\n对话会回到这条消息发送之前，被替换的原会话会归档保留（可在会话列表找回）。此操作不可撤销。',
        recallRunning: '当前回合正在运行，请先停止再撤回。',
        recallFailed: '撤回失败',
        recallCannotFork: '这是会话的第一条消息，没有更早的切点可以回退。',
        recallNoAnchor: '无法确认这条消息在会话中的位置，已取消撤回（不会盲目回退）。',
        copy: '复制',
        copied: '已复制',
        editHint: '改完按 Enter 或点「保存并重发」：对话回到这条之前，然后用新内容重新发送。Esc 取消。',
        cancelEdit: '取消',
        saveAndResend: '保存并重发',
        saving: '处理中…',
        editSendFailed: '已回退对话，但重新发送失败，请手动发送。',
        editEmpty: '内容为空，无法重发。',
        model: '模型',
        reasoning: '推理等级',
        permission: '权限',
        permissionFailed: '切换权限失败。',
        permissionUnavailable: '宿主没有提供 /permission 命令。',
        permissionNoSession: '会话尚未就绪，无法切换权限。',
        permissionRisk: '「完全访问」会放开沙箱限制。确定切换吗？',
        permissionConfirm: '确认切换',
        attach: '附件',
        followSession: '跟随当前会话',
        modelUnavailable: '模型目录不可用',
        attachmentsCarried: (n) => `${n} 个附件会一并带入新会话`,
        filesNotCarried: '文件附件不会带入新会话（官方接口只支持图片），请重新选择。',
        editSeeded: '对话已回退，改后的内容与图片已放进新会话的输入框，按回车发送即可。',
        confirm: '确定撤回',
        cancel: '取消',
        recallRefillFailed: '原文未能自动回填输入框，请手动重新输入（原会话已归档，可在会话列表找回）。',
        recallImagesNotRestored: '图片附件未能自动恢复，请重新添加。',
        recallFilesNotRestored: '文件附件无法自动恢复（DSH 官方接口只支持读回图片），请重新选择文件。',
        recallArchiveFailed: '对话已回退，但原会话归档失败——会话列表里会同时看到新旧两个会话。',
      },
      en: {
        buttonTitle: 'Optimize prompt',
        buttonBusy: 'Optimizing prompt…',
        buttonEmpty: 'Type something first',
        buttonTooLong: (n) => `Draft exceeds the ${n} character limit`,
        buttonLocked: 'Optimizing is unavailable in the current input state',
        failed: 'Optimization failed',
        droppedReference: 'Optimized, but a reference marker was not preserved; the draft was replaced as plain text.',
        settingsTitle: 'Prompt optimizer',
        settingsSummary: 'Adds a one-click prompt-rewriting button beside the composer send control.',
        model: 'Model used for optimization',
        follow: 'Follow the current session',
        modelHint: 'Only models already configured in DeepSeek Harness can be selected.',
        failures: 'Currently unavailable providers',
        prompt: 'Rewriting instruction (system prompt)',
        promptHint: 'Sent as the system prompt of the optimization call. Replace it wholesale if you like.',
        limits: 'Request limits',
        enabled: 'Enable the optimize button',
        includeReferences: 'Read the content behind @ references',
        includeReferencesHint: 'Reads referenced files, folders and sessions for the optimizer. Reads stay inside the session working directory.',
        maxTokens: 'Max output tokens',
        timeoutMs: 'Timeout (ms)',
        maxInputChars: 'Draft character limit',
        maxReferenceFileChars: 'Per-file read limit (characters)',
        maxReferenceTotalChars: 'Total reference content limit (characters)',
        save: 'Save',
        saving: 'Saving…',
        discard: 'Discard',
        restore: 'Restore all defaults',
        loading: 'Loading configuration…',
        saved: 'Saved',
        dirty: 'Unsaved changes',
        synced: 'Configuration synced',
        loadFailed: 'Could not read the configuration. Check the connection and retry.',
        beta: 'BETA',
        retractSection: 'Message retract and edit',
        betaNote: 'Entries marked BETA are experimental and rewrite the conversation record. Both are off by default.',
        enableRetract: 'Allow retracting sent messages',
        enableEdit: 'Allow editing the last message',
        rollbackRefillDraft: 'Put the original text back into the composer',
        recallRetract: 'Retract',
        recallRetractHint: 'Retract this message: the conversation returns to before it was sent, and the replaced session is archived',
        recallEdit: 'Edit',
        recallEditHint: 'Edit the last message: the conversation returns to before it was sent and the text returns to the composer',
        recallConfirm: 'Retract this message?\n\nThe conversation returns to before it was sent and the replaced session is archived (recoverable from the session list). This cannot be undone.',
        recallRunning: 'The current turn is running. Stop it before retracting.',
        recallFailed: 'Retract failed',
        recallCannotFork: 'This is the first message of the session, so there is no earlier point to return to.',
      },
    };

    /**
     * Interface language for this plugin's own copy.
     *
     * Pinned to Chinese by the plugin owner's request, so the settings page and
     * the message actions read Chinese regardless of the host UI language. The
     * English dictionary above is kept intact: to follow the host language
     * again, resolve this per call from `ctx.get('locale')`.
     */
    const UI_LANG = 'zh';

    /** Composer button glyph: a wand with a spark. */
    function WandIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
        h('path', {
          d: 'M9.6 1.6 8.9 3.4 7.1 4.1l1.8.7.7 1.8.7-1.8 1.8-.7-1.8-.7-.7-1.8Z',
          fill: 'currentColor',
        }),
        h('path', {
          d: 'M11.05 7.4 6.2 12.25a1.3 1.3 0 0 1-1.84 0l-.61-.61a1.3 1.3 0 0 1 0-1.84L8.6 4.95l2.45 2.45Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M2.2 13.8 3.6 12.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinecap: 'round',
        }),
      );
    }

    /** Indeterminate busy ring. */
    function Spinner() {
      return h('span', { className: 'dspo-spinner', 'aria-hidden': true });
    }

    /**
     * Restore an optimized draft together with its reference chips.
     *
     * `setDraft` with a plain string clears inline reference chips, so the
     * semantic-document form is used whenever every chip's clipboard text
     * survived the rewrite. Any chip the model dropped falls back to a plain
     * text replacement rather than silently losing the reference.
     * @param {object} inputActions - the composer's public action face.
     * @param {string} optimized - rewritten draft text.
     * @param {Array<object>} occurrences - reference chips of the pre-edit draft.
     * @returns {{ dropped: string[] }} labels that could not be preserved.
     */
    function writeBack(inputActions, optimized, occurrences) {
      const list = Array.isArray(occurrences) ? occurrences : [];
      if (list.length === 0) {
        inputActions.setDraft(optimized);
        return { dropped: [] };
      }
      const references = [];
      const dropped = [];
      let cursor = 0;
      for (const occurrence of list) {
        const marker = typeof occurrence.clipboardText === 'string' ? occurrence.clipboardText : '';
        if (marker === '') {
          dropped.push(String(occurrence.label ?? ''));
          continue;
        }
        const at = optimized.indexOf(marker, cursor);
        if (at < 0) {
          dropped.push(String(occurrence.label || marker));
          continue;
        }
        references.push({
          source: occurrence.source,
          ref: occurrence.ref,
          offset: at,
          length: marker.length,
          label: occurrence.label,
          clipboardText: marker,
          ...(occurrence.appearance === undefined ? {} : { appearance: occurrence.appearance }),
          ...(occurrence.invalid === true ? { invalid: true } : {}),
        });
        cursor = at + marker.length;
      }
      if (dropped.length > 0) {
        inputActions.setDraft(optimized);
        return { dropped };
      }
      try {
        inputActions.setDraft({ text: optimized, references });
        return { dropped: [] };
      } catch {
        inputActions.setDraft(optimized);
        return { dropped: list.map((occurrence) => String(occurrence.label ?? '')) };
      }
    }

    /**
     * The composer button, rendered in `conversation.input.right` immediately
     * left of the model selector and the send control.
     */
    function OptimizeButton(props) {
      const { useInput, inputActions, sessionId, remote, t } = props;
      const draft = useInput((state) => state.draft);
      const phase = useInput((state) => state.phase);
      const occurrences = useInput((state) => state.occurrences);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [limits, setLimits] = React.useState(null);
      const [pending, setPending] = React.useState(null);

      React.useEffect(() => {
        let live = true;
        remote
          .getSettings()
          .then((result) => {
            if (live && result.ok) setLimits(result.value.values);
          })
          .catch(() => {});
        return () => {
          live = false;
        };
      }, [remote]);

      const text = typeof draft === 'string' ? draft : '';
      const textRef = React.useRef(text);
      textRef.current = text;

      // Verify the write landed. Reference chips are restored through the
      // semantic-document form of `setDraft`, which the public type does not
      // advertise, so a silent no-op must not look like success.
      React.useEffect(() => {
        if (pending === null) return undefined;
        const timer = setTimeout(() => {
          if (textRef.current === pending) {
            setPending(null);
            return;
          }
          setPending(null);
          inputActions.setDraft(pending);
          setError(t('chipsNotPreserved'));
        }, 150);
        return () => clearTimeout(timer);
      }, [pending, inputActions, t]);
      const cap = limits !== null && Number.isInteger(limits.maxInputChars) ? limits.maxInputChars : null;
      const tooLong = cap !== null && text.length > cap;
      const hidden = limits !== null && limits.enabled === false;
      const disabled = busy || text.trim() === '' || phase !== 'plain' || tooLong;

      let title = t('buttonTitle');
      if (busy) title = t('buttonBusy');
      else if (text.trim() === '') title = t('buttonEmpty');
      else if (tooLong) title = t('buttonTooLong', cap);
      else if (phase !== 'plain') title = t('buttonLocked');

      async function onClick() {
        setError('');
        setBusy(true);
        try {
          const references = (Array.isArray(occurrences) ? occurrences : []).map((occurrence) => ({
            kind: typeof occurrence.appearance === 'string' ? occurrence.appearance : '',
            ref: occurrence.ref,
            label: occurrence.label,
          }));
          const result = await remote.optimize(sessionId, text, references);
          if (!result.ok) throw new Error(result.error?.message ?? t('failed'));
          const warnings = Array.isArray(result.value.warnings) ? result.value.warnings : [];
          const outcome = writeBack(inputActions, result.value.text, occurrences);
          setPending(result.value.text);
          if (outcome.dropped.length > 0) setError(t('droppedReference'));
          else if (warnings.length > 0) setError(warnings.join(' '));
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : String(caught));
        } finally {
          setBusy(false);
        }
      }

      if (hidden) return null;

      return h(
        'div',
        { className: 'dspo-slot' },
        h(
          'button',
          {
            type: 'button',
            className: 'dspo-trigger',
            'data-busy': busy,
            'aria-busy': busy,
            'aria-label': t('buttonTitle'),
            title,
            disabled,
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => void onClick(),
          },
          busy ? h(Spinner) : h(WandIcon),
        ),
        error !== '' ? h('p', { className: 'dspo-error', role: 'alert' }, error) : null,
      );
    }

    /** Build the grouped option list for the model picker. */
    function modelOptions(settings) {
      const groups = [];
      for (const provider of Array.isArray(settings?.providers) ? settings.providers : []) {
        const models = Array.isArray(provider.models) ? provider.models : [];
        if (models.length === 0) continue;
        groups.push(
          h(
            'optgroup',
            { key: provider.id, label: provider.name ?? provider.id },
            models.map((model) =>
              h(
                'option',
                { key: `${provider.id}/${model.id}`, value: `${provider.id}\u0000${model.id}` },
                model.name ?? model.id,
              ),
            ),
          ),
        );
      }
      return groups;
    }

    /** One labelled numeric field. */
    function NumberField(props) {
      const { id, label, value, min, max, disabled, onChange } = props;
      return h(
        'div',
        { className: 'dspo-field' },
        h('label', { htmlFor: id }, label),
        h('input', {
          id,
          type: 'number',
          min,
          max,
          step: 1,
          value: Number.isFinite(value) ? value : '',
          disabled,
          onChange: (event) => onChange(event.target.value === '' ? '' : Number(event.target.value)),
        }),
      );
    }

    /** One labelled checkbox row, optionally tagged as experimental. */
    function ToggleField(props) {
      const { id, label, hint, checked, disabled, onChange, beta, betaLabel } = props;
      return h(
        'div',
        { className: 'dspo-field' },
        h(
          'label',
          { className: 'dspo-toggle', htmlFor: id },
          h('input', {
            id,
            type: 'checkbox',
            checked: checked === true,
            disabled,
            onChange: (event) => onChange(event.target.checked),
          }),
          h('span', null, label),
          beta === true ? h('span', { className: 'dspo-beta' }, betaLabel) : null,
        ),
        hint === undefined ? null : h('small', null, hint),
      );
    }

    /**
     * The configuration page. Registered both on the plugin's row in the
     * Plugins page and as its own Settings section.
     */
    function SettingsPage(props) {
      const { view, remote, t } = props;
      const [saved, setSaved] = React.useState(null);
      const [values, setValues] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');

      const load = React.useCallback(() => {
        let live = true;
        remote
          .getSettings()
          .then((result) => {
            if (!live) return;
            if (!result.ok) {
              setError(result.error?.message ?? t('loadFailed'));
              return;
            }
            setSaved(result.value);
            setValues(result.value.values);
            setError('');
          })
          .catch((caught) => {
            if (live) setError(caught instanceof Error ? caught.message : String(caught));
          });
        return () => {
          live = false;
        };
      }, [remote, t]);

      React.useEffect(() => load(), [load]);

      if (view === 'summary') return t('settingsSummary');
      if (saved === null || values === null) {
        return error !== ''
          ? h(
              'div',
              { className: 'dspo-page' },
              h('p', { className: 'dspo-error', role: 'alert' }, error),
              h('button', { type: 'button', className: 'dspo-btn', onClick: () => load() }, t('discard')),
            )
          : h('p', { className: 'dspo-muted' }, t('loading'));
      }

      const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
      const dirty = Object.keys(values).some((key) => values[key] !== saved.values[key]);
      const route = `${values.provider ?? ''}\u0000${values.model ?? ''}`;

      async function save() {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          const patch = Object.fromEntries(
            Object.entries(values).filter(([key, value]) => value !== saved.values[key]),
          );
          if (Object.keys(patch).length === 0) return;
          const result = await remote.setSettings(patch, saved.revision);
          if (!result.ok) throw new Error(result.error?.message ?? t('loadFailed'));
          setSaved(result.value);
          setValues(result.value.values);
          setNotice(t('saved'));
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : String(caught));
        } finally {
          setBusy(false);
        }
      }

      const failures = Array.isArray(saved.failures) ? saved.failures : [];

      return h(
        'div',
        { className: 'dspo-page' },
        h('h2', { className: 'dspo-title' }, t('settingsTitle')),

        h(
          'div',
          { className: 'dspo-field' },
          h('label', { htmlFor: 'dspo-model' }, t('model')),
          h(
            'select',
            {
              id: 'dspo-model',
              value: route,
              disabled: busy,
              onChange: (event) => {
                const [provider, model] = String(event.target.value).split('\u0000');
                setValues((current) => ({ ...current, provider: provider ?? '', model: model ?? '' }));
              },
            },
            h('option', { value: '\u0000' }, t('follow')),
            modelOptions(saved),
          ),
          h('small', null, t('modelHint')),
        ),
        failures.length > 0
          ? h(
              'div',
              { className: 'dspo-warn' },
              h('strong', null, t('failures')),
              h(
                'ul',
                null,
                failures.map((failure) => h('li', { key: failure.id }, `${failure.name}: ${failure.message}`)),
              ),
            )
          : null,

        h(
          'div',
          { className: 'dspo-field' },
          h('label', { htmlFor: 'dspo-prompt' }, t('prompt')),
          h('textarea', {
            id: 'dspo-prompt',
            rows: 12,
            value: String(values.systemPrompt ?? ''),
            disabled: busy,
            onChange: (event) => set('systemPrompt', event.target.value),
          }),
          h('small', null, t('promptHint')),
        ),

        h('h3', { className: 'dspo-subtitle' }, t('limits')),
        h(ToggleField, {
          id: 'dspo-enabled',
          label: t('enabled'),
          checked: values.enabled,
          disabled: busy,
          onChange: (value) => set('enabled', value),
        }),
        h(ToggleField, {
          id: 'dspo-refs',
          label: t('includeReferences'),
          hint: t('includeReferencesHint'),
          checked: values.includeReferenceContent,
          disabled: busy,
          onChange: (value) => set('includeReferenceContent', value),
        }),
        h(NumberField, { id: 'dspo-maxtokens', label: t('maxTokens'), value: values.maxTokens, min: 64, max: 32000, disabled: busy, onChange: (value) => set('maxTokens', value) }),
        h(NumberField, { id: 'dspo-timeout', label: t('timeoutMs'), value: values.timeoutMs, min: 1000, max: 600000, disabled: busy, onChange: (value) => set('timeoutMs', value) }),
        h(NumberField, { id: 'dspo-maxinput', label: t('maxInputChars'), value: values.maxInputChars, min: 1, max: 100000, disabled: busy, onChange: (value) => set('maxInputChars', value) }),
        h(NumberField, { id: 'dspo-reffile', label: t('maxReferenceFileChars'), value: values.maxReferenceFileChars, min: 0, max: 200000, disabled: busy, onChange: (value) => set('maxReferenceFileChars', value) }),
        h(NumberField, { id: 'dspo-reftotal', label: t('maxReferenceTotalChars'), value: values.maxReferenceTotalChars, min: 0, max: 400000, disabled: busy, onChange: (value) => set('maxReferenceTotalChars', value) }),

        error !== '' ? h('p', { className: 'dspo-error', role: 'alert' }, error) : null,
        notice !== '' ? h('p', { className: 'dspo-notice', role: 'status' }, notice) : null,

        h(
          'div',
          { className: 'dspo-actions' },
          h('span', { className: 'dspo-muted' }, dirty ? t('dirty') : t('synced')),
          h(
            'button',
            { type: 'button', className: 'dspo-btn', disabled: busy || !dirty, onClick: () => setValues(saved.values) },
            t('discard'),
          ),
          h(
            'button',
            { type: 'button', className: 'dspo-btn', disabled: busy, onClick: () => setValues({ ...saved.defaults }) },
            t('restore'),
          ),
          h(
            'button',
            { type: 'button', className: 'dspo-btn dspo-btn-primary', disabled: busy || !dirty, onClick: () => void save() },
            busy ? t('saving') : t('save'),
          ),
        ),
      );
    }


    const CSS = `
.dspo-slot{display:inline-flex;align-items:center;gap:6px;flex:none}
.dspo-trigger{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;min-height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none;transition:background-color 120ms ease,color 120ms ease}
.dspo-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dspo-trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dspo-trigger:disabled{cursor:default;color:var(--dsw-alias-state-idle-primary);opacity:.55}
.dspo-trigger[data-busy=true]{color:var(--dsw-alias-brand-primary);opacity:1}
.dspo-spinner{display:block;width:14px;height:14px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);animation:dspo-spin 700ms linear infinite}
@keyframes dspo-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.dspo-spinner{animation-duration:2000ms}.dspo-trigger{transition:none}}
.dspo-error{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:6px 0 0;max-width:280px}
.dspo-notice{color:var(--dsw-alias-state-success-primary);font-size:12px;margin:6px 0 0}
.dspo-muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6}
.dspo-warn{color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:1.6;margin:6px 0}
.dspo-warn ul{margin:4px 0 0;padding-left:18px}
.dspo-page{max-width:680px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}
.dspo-title{font-size:19px;margin:0 0 10px}
.dspo-subtitle{font-size:15px;margin:18px 0 6px;color:var(--dsw-alias-label-primary)}
.dspo-field{margin:0 0 14px;display:flex;flex-direction:column;gap:6px}
.dspo-field>label{font-size:13px;color:var(--dsw-alias-label-primary)}
.dspo-field>small{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dspo-toggle{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer}
.dspo-page input[type=number],.dspo-page select,.dspo-page textarea{box-sizing:border-box;width:100%;min-height:34px;padding:7px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit}
.dspo-page textarea{resize:vertical}
.dspo-page input[type=checkbox]{width:auto;min-height:0}
.dspo-page :focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dspo-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:14px;margin-top:6px;border-top:1px solid var(--dsw-alias-border-l1)}
.dspo-actions .dspo-muted{margin-right:auto}
.dspo-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 14px;font:inherit;font-size:13px;background:none;color:var(--dsw-alias-label-primary);cursor:pointer}
.dspo-btn:hover:not(:disabled){border-color:var(--dsw-alias-label-secondary)}
.dspo-btn:disabled{opacity:.4;cursor:default}
.dspo-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-1)}
`;

    /** Required Client services. */
    const inject = ['slots', 'remote'];

    /**
     * Mount the composer button, the configuration pages, and the Remote bridge.
     * @param {object} ctx - browser plugin context.
     */
    async function apply(ctx) {
      // Resolved per call, so both a locale switch and a locale service that
      // arrives after this plugin does take effect without re-registering.
      const t = (key, arg) => {
        const dict = DICTS[UI_LANG] ?? DICTS.zh;
        const found = dict[key] ?? DICTS.zh[key];
        if (typeof found === 'function') return found(arg);
        return typeof found === 'string' ? found : key;
      };

      ctx.effect(() => {
        const tag = document.createElement('style');
        tag.setAttribute('data-plugin', PACKAGE);
        tag.textContent = CSS;
        document.head.append(tag);
        return () => tag.remove();
      }, 'prompt-optimizer: styles');

      const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
      ctx.effect(() => () => void disposeRemote(), 'prompt-optimizer: remote');
      const remote = ctx.get(`remote.${NAMESPACE}`);
      if (!remote) throw new Error('提示词优化：Remote 未就绪。');

      const face = () => ({ remote, t });

      ctx.slots.inject('conversation.input.right', () =>
        ctx.slots.register(
          { name: 'conversation.input.right', id: ROW_ID, order: 40, inject: face },
          OptimizeButton,
        ),
      );

      ctx.slots.inject('plugins.row.config', () =>
        ctx.slots.register(
          { name: 'plugins.row.config', key: `${PACKAGE}#${ROW_ID}`, inject: face },
          SettingsPage,
        ),
      );

      // The bundle's own page gets the same configuration surface, not just the row.
      ctx.slots.inject('plugins.bundle.config', () =>
        ctx.slots.register(
          { name: 'plugins.bundle.config', key: PACKAGE, inject: face },
          SettingsPage,
        ),
      );

      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          { name: 'settings.section', id: ROW_ID, order: 60, label: () => t('settingsTitle'), inject: face },
          SettingsPage,
        ),
      );

    }

    // Pure helpers exposed for the Node test suite. The module loader ignores
    // extra keys, so this costs nothing at runtime.
    return {
      inject,
      apply,
      __internals: {
        DESCRIPTORS,
      },
    };
  },
});
