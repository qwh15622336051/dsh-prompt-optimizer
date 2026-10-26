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
  id: 'dsh-prompt-optimizer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    // A portal escapes the transcript's clipping. Absent react-dom, the dialog
    // degrades to inline fixed positioning instead of failing to render.
    let createPortal = null;
    try {
      createPortal = require('react-dom')?.createPortal ?? null;
    } catch {
      createPortal = null;
    }

    /** Package identity; must equal package.json `name`. */
    const PACKAGE = 'dsh-prompt-optimizer';
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
        rollbackLogTitle: '最近一次撤回 / 编辑的问题',
        rollbackLogClear: '清除记录',
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

        h('h3', { className: 'dspo-subtitle' }, t('retractSection')),
        h(ToggleField, {
          id: 'dspo-retract',
          label: t('enableRetract'),
          beta: true,
          betaLabel: t('beta'),
          checked: values.enableRetract,
          disabled: busy,
          onChange: (value) => set('enableRetract', value),
        }),
        h(ToggleField, {
          id: 'dspo-edit',
          label: t('enableEdit'),
          beta: true,
          betaLabel: t('beta'),
          checked: values.enableEdit,
          disabled: busy,
          onChange: (value) => set('enableEdit', value),
        }),
        h(ToggleField, {
          id: 'dspo-refill',
          label: t('rollbackRefillDraft'),
          checked: values.rollbackRefillDraft,
          disabled: busy,
          onChange: (value) => set('rollbackRefillDraft', value),
        }),
        h('p', { className: 'dspo-muted' }, t('betaNote')),

        rollbackLog.length > 0
          ? h(
              'div',
              { className: 'dspo-warn' },
              h('strong', null, t('rollbackLogTitle')),
              h(
                'ul',
                null,
                rollbackLog.map((entry, index) =>
                  h('li', { key: `${entry.time}-${index}` }, entry.message),
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dspo-btn',
                  onClick: () => {
                    rollbackLog.length = 0;
                    setNotice(t('rollbackLogClear'));
                  },
                },
                t('rollbackLogClear'),
              ),
            )
          : null,

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

    /* ------------------------------------------------------------------ *
     * Message retract / edit (BETA)
     *
     * Rolling the conversation back uses the official `sessions.fork`: the
     * Host cuts a new session at the exact event prefix that precedes the
     * target message, so the event log of the replaced session is never
     * mutated and stays recoverable from the session list.
     *
     * The shipped user-message renderer hard-codes its action icons and
     * exposes no plugin seat, so this shadows `conversation.chat.node` key
     * `user` and re-renders the bubble through the official content Factory
     * instead of copying its markup.
     * ------------------------------------------------------------------ */

    /**
     * Split a user message's blocks the way the shipped bubble does.
     *
     * `conversation.chat.user.content` does NOT receive the raw content-block
     * array: the shipped renderer first folds it into `{ text, attachments,
     * extraBlocks }`. Passing the raw array renders an empty bubble.
     * @param {unknown} content - `node.data.content` blocks.
     * @returns {{ text: string, attachments: object[], rest: object[] }}
     */
    function contentParts(content) {
      const texts = [];
      const attachments = [];
      const rest = [];
      for (const block of Array.isArray(content) ? content : []) {
        if (block?.type === 'text' && typeof block.text === 'string') texts.push(block.text);
        else if (block?.type === 'image' && block.attachment !== undefined) {
          attachments.push({ type: 'image', image: { attachment: block.attachment } });
        } else if (block?.type === 'file' && block.attachment !== undefined) {
          attachments.push({ type: 'file', file: block.attachment });
        } else rest.push(block);
      }
      return { text: texts.join(''), attachments, rest };
    }

    /** Concatenated text of a message's content blocks. */
    function messageText(content) {
      return contentParts(content).text;
    }

    /**
     * Seq of the newest appended user message in the loaded event window.
     *
     * The live tail is always loaded, so this stays authoritative even when the
     * transcript is virtualized or scrolled away (the mounted node set would not).
     * @returns {number | undefined} the seq, or undefined when it cannot be read.
     */
    function latestUserSeq(binding) {
      return userSeqInfo(binding).latest;
    }

    /**
     * Shadow priority that outranks every existing registration of one key.
     *
     * Ranking is ascending and the lowest renders, so one below the current
     * minimum wins. `entryKey` scopes the comparison to a single key so one
     * plugin key cannot drag another key's priority further down each reload.
     */
    function nextShadowPriority(slots, key, entryKey) {
      try {
        const entries = slots?.entries?.(key);
        const list = Array.isArray(entries) ? entries : [];
        const scoped = entryKey === undefined ? list : list.filter((entry) => entry?.key === entryKey);
        const priorities = scoped.map((entry) => (typeof entry?.priority === 'number' ? entry.priority : 0));
        return (priorities.length === 0 ? 0 : Math.min(...priorities)) - 1;
      } catch {
        return -1;
      }
    }

    /**
     * Session event seq a Chat node anchors at.
     *
     * A `ConversationViewNode` carries no `seq`: its render anchor is
     * `anchorSeq`, derived from the node's own first event. `data.seq` and a bare
     * `seq` are tried afterwards for node kinds that do expose one.
     * @returns {number | undefined} the seq, or undefined when the node has none.
     */
    function nodeSeq(node) {
      const candidates = [node?.anchorSeq, node?.data?.seq, node?.seq];
      for (const value of candidates) {
        if (typeof value === 'number') return value;
      }
      return undefined;
    }

    /**
     * Confirm a seq really is an appended user message before forking on it.
     *
     * `sessions.fork` cuts the log at exactly the seq it is handed, so an
     * unverified seq would truncate the conversation somewhere unintended.
     * @returns {boolean} whether the loaded window shows an appended user message there.
     */
    function isUserMessageSeq(binding, seq) {
      let source;
      try {
        source = binding?.eventSource?.getSnapshot?.();
      } catch {
        return false;
      }
      const entries = Array.isArray(source?.entries) ? source.entries : [];
      for (const entry of entries) {
        if (entry?.type !== 'event') continue;
        const event = entry.event;
        if (event?.seq !== seq) continue;
        if (event.type !== 'user/message') return false;
        return event.surfaceOp === undefined || event.surfaceOp === 'append';
      }
      return false;
    }

    /**
     * Loaded-window facts about the user's own messages.
     *
     * `hasMore` says whether older events exist outside the window, which is what
     * decides if the earliest loaded user message really is the session's first.
     * @returns {{ latest: number|undefined, first: number|undefined, hasMore: boolean }}
     */
    function userSeqInfo(binding) {
      let source;
      try {
        source = binding?.eventSource?.getSnapshot?.();
      } catch {
        return { latest: undefined, first: undefined, hasMore: false };
      }
      const entries = Array.isArray(source?.entries) ? source.entries : [];
      let latest;
      let first;
      for (const entry of entries) {
        if (entry?.type !== 'event') continue;
        const event = entry.event;
        if (event?.type !== 'user/message') continue;
        if (event.surfaceOp !== undefined && event.surfaceOp !== 'append') continue;
        if (typeof event.seq !== 'number') continue;
        latest = event.seq;
        if (first === undefined) first = event.seq;
      }
      return { latest, first, hasMore: source?.hasMore === true };
    }

    /**
     * Per-session shared state for the message actions.
     *
     * Settings and the newest user-message seq are identical for every message of
     * a session, so they are fetched and subscribed once per session and shared by
     * reference count rather than once per rendered message.
     */
    const sessionHubs = new Map();

    function acquireSessionHub(sessionId, create) {
      let hub = sessionHubs.get(sessionId);
      if (hub === undefined) {
        hub = create();
        sessionHubs.set(sessionId, hub);
      }
      hub.refs += 1;
      return hub;
    }

    function releaseSessionHub(sessionId) {
      const hub = sessionHubs.get(sessionId);
      if (hub === undefined) return;
      hub.refs -= 1;
      if (hub.refs > 0) return;
      sessionHubs.delete(sessionId);
      try {
        hub.dispose();
      } catch {
        /* best effort */
      }
    }

    /** Rollback problems, surfaced in the settings page so nothing fails silently. */
    const rollbackLog = [];

    function recordRollbackError(message) {
      rollbackLog.unshift({ message, time: Date.now() });
      if (rollbackLog.length > 5) rollbackLog.length = 5;
    }

    /** Build the shared per-session state object. */
    function createSessionHub(sessions, remote, sessionId) {
      let state = {
        settings: null,
        permission: undefined,
        seqs: { latest: undefined, first: undefined, hasMore: false },
      };
      const listeners = new Set();
      let disposed = false;

      const publish = (patch) => {
        if (disposed) return;
        state = { ...state, ...patch };
        for (const listener of [...listeners]) {
          try {
            listener(state);
          } catch {
            /* one bad listener must not break the rest */
          }
        }
      };

      remote
        .getSettings()
        .then((result) => {
          if (result?.ok) publish({ settings: result.value.values });
        })
        .catch(() => {});

      let binding;
      try {
        binding = sessions?.binding?.(sessionId);
      } catch {
        binding = undefined;
      }
      const read = () => publish({ seqs: userSeqInfo(binding) });
      let disposeEvents;
      if (binding) {
        read();
        try {
          disposeEvents = binding.eventSource?.subscribe?.(read);
        } catch {
          disposeEvents = undefined;
        }
      }

      // The active permission preset is a Session projection, exactly as the
      // shipped picker reads it.
      let disposePermission;
      try {
        const projection = binding?.session?.projections?.faceOf?.('permissions');
        const readPermission = () => {
          const snapshot = projection?.getSnapshot?.();
          publish({ permission: snapshot?.currentValue });
        };
        if (projection) {
          readPermission();
          disposePermission = projection.subscribe?.(readPermission);
        }
      } catch {
        disposePermission = undefined;
      }

      return {
        refs: 0,
        subscribe(listener) {
          listeners.add(listener);
          listener(state);
          return () => listeners.delete(listener);
        },
        dispose() {
          disposed = true;
          listeners.clear();
          try {
            disposePermission?.();
          } catch {
            /* already detached */
          }
          try {
            disposeEvents?.();
          } catch {
            /* already detached */
          }
        },
      };
    }

    /** Confirmation dialog matching the host's modal affordances (Escape, backdrop). */
    function ConfirmDialog(props) {
      const { message, confirmLabel, cancelLabel, onConfirm, onCancel } = props;
      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onCancel();
          }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
      }, [onCancel]);

      const dialog = h(
        'div',
        {
          className: 'dspo-modal-backdrop',
          onClick: (event) => {
            if (event.target === event.currentTarget) onCancel();
          },
        },
        h(
          'div',
          { className: 'dspo-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': confirmLabel },
          h('p', { className: 'dspo-modal-text' }, message),
          h(
            'div',
            { className: 'dspo-modal-actions' },
            h('button', { type: 'button', className: 'dspo-btn', onClick: onCancel }, cancelLabel),
            h('button', { type: 'button', className: 'dspo-btn dspo-btn-primary', onClick: onConfirm }, confirmLabel),
          ),
        ),
      );
      // A portal escapes the transcript's clipping; inline fixed positioning is
      // the fallback when react-dom is not part of the browser module table.
      return createPortal && typeof document !== 'undefined' ? createPortal(dialog, document.body) : dialog;
    }

    /** Copy glyph for the message action row. */
    function CopyIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
        h('rect', { x: 5.5, y: 5.5, width: 8, height: 8, rx: 1.8, fill: 'none', stroke: 'currentColor', strokeWidth: '1.2' }),
        h('path', {
          d: 'M10.5 5.5V4.3a1.8 1.8 0 0 0-1.8-1.8H4.3a1.8 1.8 0 0 0-1.8 1.8v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinecap: 'round',
        }),
      );
    }

    /** Success glyph shown briefly after copying. */
    function CheckIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
        h('path', {
          d: 'M3 8.5 6.2 11.7 13 5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.6',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /** Retract glyph: an arrow curving back on itself. */
    function UndoIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
        h('path', {
          d: 'M3 7.5h6.2a3.3 3.3 0 0 1 0 6.6H6.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.3',
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M5.4 4.6 2.5 7.5l2.9 2.9',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.3',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /** Edit glyph. */
    function EditIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
        h('path', {
          d: 'M11.1 2.6a1.6 1.6 0 0 1 2.3 2.3l-7 7-3 .7.7-3 7-7Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinejoin: 'round',
        }),
      );
    }

    /** Write text to the clipboard, degrading to the legacy selection path. */
    async function writeClipboard(text) {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch {
        /* fall through to the legacy path */
      }
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.append(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
      } catch {
        return false;
      }
    }

    /** Local `HH:MM` label for a message timestamp. */
    function formatClock(time) {
      try {
        const date = new Date(time);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (value) => String(value).padStart(2, '0');
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      } catch {
        return '';
      }
    }

    /**
     * Whether one Chat node key is the FIRST user message of the rendered timeline.
     *
     * Read from `ChatSnapshot.order` (nodes in render order) rather than the
     * session event window, which may be paged or not yet delivered.
     * @returns {boolean} true only when that key is the earliest `user` node.
     */
    function isFirstUserNode(snapshot, key) {
      const order = snapshot?.order;
      const store = snapshot?.nodes;
      if (typeof key !== 'string' || !Array.isArray(order) || !store || typeof store.get !== 'function') return false;
      for (const candidateKey of order) {
        const candidate = store.get(candidateKey);
        if (candidate?.kind === 'user') return candidate.key === key;
      }
      return false;
    }

    /** Whether one Chat node key is the LAST user message of the rendered timeline. */
    function isLastUserNode(snapshot, key) {
      const order = snapshot?.order;
      const store = snapshot?.nodes;
      if (typeof key !== 'string' || !Array.isArray(order) || !store || typeof store.get !== 'function') return false;
      for (let index = order.length - 1; index >= 0; index -= 1) {
        const candidate = store.get(order[index]);
        if (candidate?.kind === 'user') return candidate.key === key;
      }
      return false;
    }

    /**
     * In-place editor grown at the message's own position.
     *
     * Editing a sent message must not borrow the bottom composer: the pending
     * text there belongs to a different intent, and the user needs to see the
     * original wording next to what they are rewriting.
     */
    /**
     * Chinese labels for the conventional permission presets.
     *
     * The shipped picker maps preset VALUES to its own locale keys and only falls
     * back to the host-supplied name, so the same mapping is applied here. A
     * custom preset declared by the host keeps its own name.
     */
    const PERMISSION_LABELS = {
      'read-only': '仅可查看',
      'workspace-write': '工作区内修改',
      'danger-full-access': '完全权限',
      auto: '自动审查（EXP）',
    };

    /** Display label for one catalog preset option. */
    function permissionLabel(option) {
      const value = typeof option?.value === 'string' ? option.value : '';
      const mapped = PERMISSION_LABELS[value];
      if (mapped !== undefined) return mapped;
      const name = typeof option?.name === 'string' ? option.name : '';
      return name !== '' ? name : value;
    }

    /**
     * Provider-grouped options for the model picker.
     *
     * The routed catalog is already grouped by provider, and a large catalog is
     * only navigable when that grouping is preserved in the control itself.
     * @returns {Array<{ id: string, name: string, models: Array<{ key: string, label: string }> }>}
     */
    function modelGroups(catalog) {
      const groups = [];
      for (const group of Array.isArray(catalog?.groups) ? catalog.groups : []) {
        const models = (Array.isArray(group.models) ? group.models : []).map((model) => ({
          key: `${group.id}\u0000${model.id}`,
          label: model.name ?? model.id,
        }));
        if (models.length === 0) continue;
        groups.push({ id: group.id, name: group.name ?? group.id, models });
      }
      return groups;
    }

    function modelChoices(catalog) {
      const rows = [];
      for (const group of Array.isArray(catalog?.groups) ? catalog.groups : []) {
        for (const model of Array.isArray(group.models) ? group.models : []) {
          rows.push({
            key: `${group.id}\u0000${model.id}`,
            provider: group.id,
            model: model.id,
            label: `${group.name ?? group.id} · ${model.name ?? model.id}`,
            efforts: Array.isArray(model.reasoning?.efforts) ? model.reasoning.efforts : [],
            defaultEffort: model.reasoning?.defaultEffort,
          });
        }
      }
      return rows;
    }

    function EditCard(props) {
      const {
        initialText,
        attachments,
        imageIds,
        sessionId,
        sessionRemote,
        permissionRemote,
        permissionValue,
        onSelectPermission,
        busy,
        onCancel,
        onSend,
        t,
      } = props;
      const [value, setValue] = React.useState(initialText);
      const [catalog, setCatalog] = React.useState(null);
      const [route, setRoute] = React.useState('');
      const [effort, setEffort] = React.useState('');
      const [removed, setRemoved] = React.useState(() => new Set());
      const [notice, setNotice] = React.useState('');
      const [permCatalog, setPermCatalog] = React.useState(null);
      const [permPending, setPermPending] = React.useState(null);
      const [permNotice, setPermNotice] = React.useState('');
      const areaRef = React.useRef(null);

      React.useEffect(() => {
        const area = areaRef.current;
        if (!area) return;
        area.focus();
        area.setSelectionRange(area.value.length, area.value.length);
      }, []);

      // The model directory is only fetched while the card is open.
      React.useEffect(() => {
        let live = true;
        const api = sessionRemote;
        if (typeof api?.modelCatalog !== 'function') return undefined;
        api
          .modelCatalog()
          .then((result) => {
            if (!live || result?.ok !== true) return;
            setCatalog(result.value);
            const current = result.value?.default;
            if (current?.provider && current?.model) {
              setRoute(`${current.provider}\u0000${current.model}`);
              setEffort(current.reasoningEffort ?? '');
            }
          })
          .catch(() => {});
        return () => {
          live = false;
        };
      }, [sessionRemote]);

      const choices = React.useMemo(() => modelChoices(catalog), [catalog]);
      const active = choices.find((choice) => choice.key === route);
      const efforts = active?.efforts ?? [];

      // The shipped picker reads its options from this same process catalog.
      React.useEffect(() => {
        let live = true;
        const api = permissionRemote;
        if (typeof api?.catalog !== 'function') return undefined;
        api
          .catalog()
          .then((result) => {
            if (live && result?.ok === true) setPermCatalog(result.value);
          })
          .catch(() => {});
        return () => {
          live = false;
        };
      }, [permissionRemote]);

      const permOptions = Array.isArray(permCatalog?.options) ? permCatalog.options : [];

      /** Presets the shipped UI gates behind an explicit acknowledgement. */
      const RISKY_PRESETS = new Set(['danger-full-access', 'auto']);

      async function commitPermission(preset) {
        setPermPending(null);
        setPermNotice('');
        const failure = await onSelectPermission(preset);
        if (typeof failure === 'string' && failure !== '') setPermNotice(failure);
      }

      function choosePermission(preset) {
        if (preset === permissionValue) return;
        if (RISKY_PRESETS.has(preset)) {
          setPermPending(preset);
          return;
        }
        void commitPermission(preset);
      }

      /** Apply a model or reasoning change through the official session selection. */
      async function applyRoute(nextKey, nextEffort) {
        setRoute(nextKey);
        setEffort(nextEffort);
        const target = choices.find((choice) => choice.key === nextKey);
        if (!target || typeof sessionRemote?.selectModel !== 'function') return;
        try {
          const result = await sessionRemote.selectModel({
            sessionId,
            provider: target.provider,
            model: target.model,
            ...(nextEffort === '' ? {} : { reasoningEffort: nextEffort }),
          });
          setNotice(result?.ok === true ? '' : (result?.error?.message ?? t('modelUnavailable')));
        } catch (caught) {
          setNotice(caught instanceof Error ? caught.message : String(caught));
        }
      }


      // Grow with the content, up to a ceiling, like the shipped composer.
      React.useEffect(() => {
        const area = areaRef.current;
        if (!area) return;
        area.style.height = 'auto';
        area.style.height = `${Math.min(area.scrollHeight, 360)}px`;
      }, [value]);

      function onKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
          return;
        }
        if (event.key === 'Enter' && event.shiftKey !== true && event.nativeEvent?.isComposing !== true) {
          event.preventDefault();
          if (value.trim() !== '') onSend(value);
        }
      }

      return h(
        'div',
        { className: 'dspo-edit-card' },
        h('textarea', {
          ref: areaRef,
          className: 'dspo-edit-area',
          value,
          rows: 1,
          disabled: busy,
          'aria-label': t('recallEdit'),
          onChange: (event) => setValue(event.target.value),
          onKeyDown,
        }),
        h(
          'div',
          { className: 'dspo-edit-meta' },
          h(
            'label',
            { className: 'dspo-edit-field' },
            h('span', null, t('model')),
            choices.length > 0
              ? h(
                  'select',
                  {
                    value: route,
                    disabled: busy,
                    onChange: (event) =>
                      void applyRoute(
                        event.target.value,
                        efforts.some((level) => level.id === effort) ? effort : '',
                      ),
                  },
                  modelGroups(catalog).map((group) =>
                    h(
                      'optgroup',
                      { key: group.id, label: group.name },
                      group.models.map((model) =>
                        h('option', { key: model.key, value: model.key }, model.label),
                      ),
                    ),
                  ),
                )
              : h('span', { className: 'dspo-muted' }, catalog === null ? '…' : t('modelUnavailable')),
          ),
          efforts.length > 0
            ? h(
                'label',
                { className: 'dspo-edit-field' },
                h('span', null, t('reasoning')),
                h(
                  'select',
                  { value: effort, disabled: busy, onChange: (event) => void applyRoute(route, event.target.value) },
                  h('option', { value: '' }, t('followSession')),
                  efforts.map((level) => h('option', { key: level.id, value: level.id }, level.name ?? level.id)),
                ),
              )
            : null,
          permOptions.length > 0
            ? h(
                'label',
                { className: 'dspo-edit-field' },
                h('span', null, t('permission')),
                h(
                  'select',
                  {
                    value: permissionValue ?? '',
                    disabled: busy,
                    onChange: (event) => choosePermission(event.target.value),
                  },
                  permissionValue === undefined ? h('option', { value: '' }, '…') : null,
                  permOptions.map((option) =>
                    h('option', { key: option.value, value: option.value }, permissionLabel(option)),
                  ),
                ),
              )
            : null,
          permPending !== null
            ? h(
                'div',
                { className: 'dspo-edit-field' },
                h('span', { className: 'dspo-warn' }, t('permissionRisk')),
                h(
                  'button',
                  { type: 'button', className: 'dspo-btn', onClick: () => setPermPending(null) },
                  t('cancel'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dspo-btn dspo-btn-primary',
                    onClick: () => void commitPermission(permPending),
                  },
                  t('permissionConfirm'),
                ),
              )
            : null,
          permNotice !== '' ? h('p', { className: 'dspo-error', role: 'alert' }, permNotice) : null,
        ),
        attachments.length > 0
          ? h(
              'div',
              { className: 'dspo-edit-atts' },
              h('span', { className: 'dspo-muted' }, t('attach')),
              attachments.map((item, index) => {
                const isImage = item.type === 'image';
                const attachmentId = isImage ? item.image?.attachment?.attachmentId : undefined;
                const label = isImage
                  ? (item.image?.attachment?.name ?? `图片 ${index + 1}`)
                  : (item.file?.name ?? `文件 ${index + 1}`);
                const isRemoved = isImage && attachmentId !== undefined && removed.has(attachmentId);
                return h(
                  'span',
                  {
                    key: `${item.type}-${index}`,
                    className: 'dspo-edit-chip',
                    'data-removed': isRemoved ? 'true' : undefined,
                  },
                  label,
                  isImage && attachmentId !== undefined && !isRemoved
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'dspo-edit-chip-x',
                          'aria-label': `${t('attach')}: ${label}`,
                          onClick: () =>
                            setRemoved((previous) => {
                              const next = new Set(previous);
                              next.add(attachmentId);
                              return next;
                            }),
                        },
                        '×',
                      )
                    : null,
                );
              }),
            )
          : null,
        notice !== '' ? h('p', { className: 'dspo-error', role: 'alert' }, notice) : null,
        h(
          'div',
          { className: 'dspo-edit-actions' },
          h(
            'span',
            { className: 'dspo-muted' },
            attachments.some((item) => item.type === 'file') ? t('filesNotCarried') : t('editHint'),
          ),
          h(
            'button',
            { type: 'button', className: 'dspo-btn', disabled: busy, onClick: onCancel },
            t('cancelEdit'),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dspo-btn dspo-btn-primary',
              disabled: busy || value.trim() === '',
              onClick: () => onSend(value, imageIds.filter((id) => !removed.has(id))),
            },
            busy ? t('saving') : t('saveAndResend'),
          ),
        ),
      );
    }

    /** Retract / edit controls attached to one of the user's own messages. */
    function UserMessageWithRecall(props) {
      const { node, renderFactorySlot, loadImage, sessionId, sessions, uiWorkspace, conversationInput, remote, sessionRemote, permissionRemote, tr, useChat } = props;
      // This slot also carries the Chat locale's own `t`, which would shadow the
      // plugin's translator, so the inject face names it `tr`.
      const t = typeof tr === 'function' ? tr : (key) => key;
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [asking, setAsking] = React.useState(false);
      const [editing, setEditing] = React.useState(false);
      const [shared, setShared] = React.useState({ settings: null, permission: undefined, seqs: {} });

      React.useEffect(() => {
        const hub = acquireSessionHub(sessionId, () => createSessionHub(sessions, remote, sessionId));
        const unsubscribe = hub.subscribe(setShared);
        return () => {
          unsubscribe();
          releaseSessionHub(sessionId);
        };
      }, [sessionId, sessions, remote]);

      const seq = nodeSeq(node);
      const data = node?.data ?? {};
      const parts = React.useMemo(() => contentParts(data.content), [data.content]);
      // Match the shipped renderer's Factory currency exactly.
      const prepared = React.useMemo(
        () => ({
          text: parts.text,
          attachments: parts.attachments,
          extraBlocks: parts.rest,
          ...(data.referenceLabels === undefined ? {} : { referenceLabels: data.referenceLabels }),
        }),
        [parts, data.referenceLabels],
      );
      const facts = React.useMemo(
        () => ({
          ...(data.referenceLabels === undefined ? {} : { sessionLabels: data.referenceLabels }),
          ...(data.skillNames === undefined ? {} : { skillNames: data.skillNames }),
        }),
        [data.referenceLabels, data.skillNames],
      );
      const settings = shared.settings;
      const seqs = shared.seqs ?? {};
      const permissionValue = typeof shared.permission === 'string' ? shared.permission : undefined;

      /**
       * Switch the session's permission preset through the official command
       * writer — the same single path the shipped composer chip uses.
       * @returns {Promise<string | null>} a failure message, or null on success.
       */
      async function selectPermission(preset) {
        const live = sessions.binding(sessionId)?.session;
        if (live === undefined) return t('permissionNoSession');
        try {
          const result = await live.command(`/permission ${preset}`);
          if (result?.ok !== true) return result?.error?.message ?? t('permissionFailed');
          if (result.value?.matched !== true) return t('permissionUnavailable');
          return null;
        } catch (caught) {
          return caught instanceof Error ? caught.message : String(caught);
        }
      }
      // Position comes from the Chat snapshot's render order, which is
      // authoritative. The event-window reading is only a cross-check for
      // whether older history exists outside the loaded timeline.
      const nodeKey = node?.key;
      // `useChat` is a documented standard prop of this slot, so its presence is
      // constant across renders and the guard keeps hook order stable. Guarding
      // matters: calling a missing hook would crash the row and hide every user
      // message, which is far worse than a missing icon.
      const canReadChat = typeof useChat === 'function';
      const firstInTimeline = canReadChat ? useChat((snapshot) => isFirstUserNode(snapshot, nodeKey)) : false;
      const lastInTimeline = canReadChat ? useChat((snapshot) => isLastUserNode(snapshot, nodeKey)) : false;
      const olderOutsideTimeline = seqs.hasMore === true;
      const isLatest = lastInTimeline || (seq === undefined ? false : seq === seqs.latest);
      // A fork needs an earlier boundary, so the session's first user message has
      // no rollback point. Hide it only when both sources agree nothing is older.
      const isFirst = firstInTimeline && !olderOutsideTimeline;
      const canAct = settings?.enabled !== false && seq !== undefined && !isFirst;
      const showEdit = canAct && settings?.enableEdit === true && isLatest;
      const showRetract = canAct && settings?.enableRetract === true;

      /**
       * Archive the session this one replaced.
       *
       * Retries once: a lingering copy would sit beside the new session in the
       * sidebar, which reads as "a new chat was created" rather than "the same
       * conversation continued".
       * @returns {Promise<boolean>} whether it was archived.
       */
      async function archiveReplaced() {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            await uiWorkspace?.archiveSession?.(sessionId);
            return true;
          } catch (archiveError) {
            if (attempt === 1) {
              console.warn('[prompt-optimizer] archiving the replaced session failed:', archiveError);
              recordRollbackError(t('recallArchiveFailed'));
            }
          }
        }
        return false;
      }

      /**
       * Read the message's images into prompt content parts.
       *
       * `PromptContentPart` carries image bytes rather than attachment ids, so the
       * originals are read back from the source session while it is still live.
       * @returns {Promise<object[]>} the image parts that could be read.
       */
      async function readImageParts(ids) {
        const parts = [];
        if (!Array.isArray(ids) || ids.length === 0 || typeof sessionRemote?.attachment !== 'function') return parts;
        for (const attachmentId of ids) {
          try {
            const read = await sessionRemote.attachment({ sessionId, attachmentId });
            if (read?.ok !== true) continue;
            const ref = read.value?.attachment ?? {};
            if (typeof read.value?.data !== 'string' || typeof ref.mediaType !== 'string') continue;
            parts.push({
              type: 'image',
              mediaType: ref.mediaType,
              data: read.value.data,
              ...(typeof ref.name === 'string' ? { name: ref.name } : {}),
            });
          } catch {
            /* one unreadable image must not block the resend */
          }
        }
        return parts;
      }

      async function performEditSend(text, images) {
        if (typeof text !== 'string' || text.trim() === '') {
          setError(t('editEmpty'));
          return;
        }
        setBusy(true);
        setError('');
        try {
          const binding = sessions.binding(sessionId);
          if (binding?.session?.getSnapshot?.()?.running) throw new Error(t('recallRunning'));
          if (seq === undefined || !isUserMessageSeq(binding, seq)) throw new Error(t('recallNoAnchor'));

          const imageParts = await readImageParts(images);
          if (Array.isArray(images) && images.length > 0 && imageParts.length === 0) {
            recordRollbackError(t('recallImagesNotRestored'));
          }

          const childId = await sessions.fork({ sessionId, atSeq: seq - 1 });
          const reference = sessions.retain(childId, { source: 'controllerOperation' });
          try {
            const settled = await reference.ready;
            // Send the rewritten turn right away. Seating it in the composer would
            // make "save and resend" need a second, manual send.
            const result = await settled.session.prompt([{ type: 'text', text }, ...imageParts], 'queue');
            if (result?.ok !== true) {
              const reason = result?.error?.message ?? t('editSendFailed');
              // Never lose what the user typed: park it in the child's composer.
              try {
                conversationInput?.requestDraftInitialization?.(settled, {
                  prompt: text,
                  whenDraftExists: 'replace',
                });
              } catch {
                /* the reported failure below is the actionable one */
              }
              setError(reason);
              recordRollbackError(reason);
            }
          } finally {
            reference.release?.();
          }

          setEditing(false);
          uiWorkspace?.openSession?.(childId);
          await archiveReplaced();
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : String(caught);
          setError(message);
          recordRollbackError(message);
        } finally {
          setBusy(false);
        }
      }

      /** Durable image attachment ids carried by this message. */
      function imageIds() {
        return parts.attachments
          .filter((item) => item.type === 'image' && item.image?.attachment?.attachmentId !== undefined)
          .map((item) => item.image.attachment.attachmentId);
      }

      /** Whether this message carries non-image attachments, which cannot be restored. */
      function hasFileAttachments() {
        return parts.attachments.some((item) => item.type === 'file');
      }

      async function performRollback() {
        setAsking(false);
        setBusy(true);
        setError('');
        const warnings = [];
        try {
          const binding = sessions.binding(sessionId);
          if (binding?.session?.getSnapshot?.()?.running) throw new Error(t('recallRunning'));
          if (seq === undefined) throw new Error(t('recallCannotFork'));
          // Never fork on an unverified seq: fork cuts the log exactly there.
          if (!isUserMessageSeq(binding, seq)) throw new Error(t('recallNoAnchor'));

          const text = prepared.text;
          const images = imageIds();
          const childId = await sessions.fork({ sessionId, atSeq: seq - 1 });

          const refill = settings?.rollbackRefillDraft !== false;
          if (refill && text !== '') {
            try {
              // Seed the child's draft before navigation publishes it, so the
              // editor mounts already holding the text.
              const reference = sessions.retain(childId, { source: 'controllerOperation' });
              try {
                const outcome = conversationInput?.requestDraftInitialization?.(reference.binding, {
                  prompt: text,
                  whenDraftExists: 'replace',
                });
                if (outcome !== 'applied') warnings.push(t('recallRefillFailed'));
                // Images are the only attachment kind the official surface reads back.
                if (images.length > 0 && typeof conversationInput?.for === 'function') {
                  const input = conversationInput.for(reference.binding.ctx);
                  const added = input?.addAttachments?.(images);
                  if (added === false) warnings.push(t('recallImagesNotRestored'));
                } else if (images.length > 0) {
                  warnings.push(t('recallImagesNotRestored'));
                }
              } finally {
                reference.release?.();
              }
            } catch (seedError) {
              console.warn('[prompt-optimizer] draft refill failed:', seedError);
              warnings.push(t('recallRefillFailed'));
            }
          }
          if (hasFileAttachments()) warnings.push(t('recallFilesNotRestored'));

          uiWorkspace?.openSession?.(childId);
          await archiveReplaced();
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : String(caught);
          setError(message);
          recordRollbackError(message);
        } finally {
          setBusy(false);
        }
        if (warnings.length > 0) recordRollbackError(warnings.join(' '));
      }

      const [copied, setCopied] = React.useState(false);
      const copyTimer = React.useRef(null);
      React.useEffect(
        () => () => {
          if (copyTimer.current !== null) clearTimeout(copyTimer.current);
        },
        [],
      );

      async function onCopy() {
        if (copied || prepared.text === '') return;
        const ok = await writeClipboard(prepared.text);
        if (!ok) return;
        setCopied(true);
        if (copyTimer.current !== null) clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => {
          copyTimer.current = null;
          setCopied(false);
        }, 1000);
      }

      function iconButton(key, label, onClick, icon) {
        return h(
          'button',
          {
            key,
            type: 'button',
            className: 'dspo-recall-btn',
            title: label,
            'aria-label': label,
            disabled: busy,
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => void onClick(),
          },
          icon,
        );
      }

      return h(
        'div',
        { className: 'dspo-recall-row', 'data-editing': editing ? 'true' : undefined },
        // Editing replaces the bubble in place: the pending text belongs at this
        // message's position, not in the bottom composer.
        editing
          ? h(EditCard, {
              initialText: prepared.text,
              attachments: parts.attachments,
              imageIds: imageIds(),
              sessionId,
              sessionRemote,
              permissionRemote,
              permissionValue,
              onSelectPermission: selectPermission,
              busy,
              onCancel: () => setEditing(false),
              onSend: (text, images) => void performEditSend(text, images),
              t,
            })
          : renderFactorySlot('conversation.chat.user.content', {
              content: prepared,
              loadImage,
              facts,
              interactive: true,
            }),
        // The shipped user row carried the clock and the copy icon. Shadowing the
        // node means rendering them here again, or copying disappears from the UI.
        editing
          ? null
          : h(
              'div',
              { className: 'dspo-recall-actions' },
              typeof data.time === 'number' ? h('span', { className: 'dspo-recall-time' }, formatClock(data.time)) : null,
              iconButton('copy', copied ? t('copied') : t('copy'), onCopy, copied ? h(CheckIcon) : h(CopyIcon)),
              showEdit ? iconButton('edit', t('recallEdit'), () => setEditing(true), h(EditIcon)) : null,
              showRetract ? iconButton('retract', t('recallRetract'), () => setAsking(true), h(UndoIcon)) : null,
            ),
        error !== '' ? h('p', { className: 'dspo-recall-error', role: 'alert' }, error) : null,
        asking
          ? h(ConfirmDialog, {
              message: t('recallConfirm'),
              confirmLabel: t('confirm'),
              cancelLabel: t('cancel'),
              onConfirm: () => void performRollback(),
              onCancel: () => setAsking(false),
            })
          : null,
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
.dspo-beta{display:inline-block;margin-left:6px;padding:0 5px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:4px;color:var(--dsw-alias-state-warn-primary);font-size:10px;font-weight:600;line-height:15px;letter-spacing:.04em;vertical-align:middle}
.dspo-recall-row{display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:0;max-width:100%}
.dspo-recall-time{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));white-space:nowrap}
.dspo-recall-actions{display:flex;align-items:center;gap:6px;opacity:0;transition:opacity 120ms ease}
.dspo-recall-row:hover .dspo-recall-actions,.dspo-recall-actions:focus-within{opacity:1}
.dspo-recall-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;min-height:24px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dspo-recall-btn svg{display:block;width:15px;height:15px}
.dspo-recall-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dspo-recall-btn:disabled{opacity:.5;cursor:wait}
.dspo-recall-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dspo-recall-error{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:2px 0 0;max-width:320px;text-align:right}
@media(prefers-reduced-motion:reduce){.dspo-recall-actions{transition:none}}
@media(hover:none){.dspo-recall-actions{opacity:1}}
/* The edit card mirrors the shipped composer card rule (same radius/surface/
   elevation/type scale and the same root side padding), so the editing box reads
   as the same object as the bottom composer rather than a plugin-authored
   look-alike. No backticks may appear in this template literal. */
.dspo-recall-row[data-editing=true]{align-items:stretch;width:100%;box-sizing:border-box;padding:0 var(--dsh-composer-side-clearance,16px) 4px}
.dspo-edit-card{box-sizing:border-box;width:100%;max-width:var(--dsh-composer-card-max-width,100%);--dsw-elevation-stroke-color:var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-panel,12px);background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-elevation-soft);color:var(--dsw-alias-label-primary);font-size:var(--dsh-content-font-size,14px);line-height:calc(24px + var(--dsh-content-font-delta,0px));border:0;display:flex;flex-direction:column;gap:12px;padding:12px;position:relative}
.dspo-edit-area{box-sizing:border-box;width:100%;max-height:360px;padding:0;border:0;outline:none;background:transparent;color:inherit;font:inherit;line-height:inherit;resize:none;overflow-y:auto;--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2)}
.dspo-edit-meta{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.dspo-edit-field{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary);min-width:0}
.dspo-edit-field>select{box-sizing:border-box;max-width:230px;height:28px;padding:0 6px;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.dspo-edit-field>select:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dspo-edit-atts{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.dspo-edit-chip{display:inline-flex;align-items:center;gap:4px;max-width:240px;height:24px;padding:0 8px;border:0;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:24px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dspo-edit-chip[data-removed=true]{opacity:.45;text-decoration:line-through}
.dspo-edit-chip-x{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px;line-height:1}
.dspo-edit-chip-x:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dspo-edit-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.dspo-edit-actions .dspo-muted{margin-right:auto;flex:1 1 220px;min-width:0}
.dspo-modal-backdrop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);padding:24px}
.dspo-modal{box-sizing:border-box;width:min(420px,100%);padding:20px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 12px 40px rgba(0,0,0,.35);font-size:14px;line-height:1.6}
.dspo-modal-text{margin:0 0 18px;white-space:pre-wrap;overflow-wrap:anywhere}
.dspo-modal-actions{display:flex;justify-content:flex-end;gap:8px}
.dspo-modal .dspo-btn-primary{color:var(--dsw-alias-bg-layer-1)}
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

      // Retract / edit sit on the user's own messages, so they shadow the
      // shipped `user` chat node. A client without the session services simply
      // never gets the controls.
      ctx.inject(['sessions'], (child) => {
        const sessions = child.sessions;
        const uiWorkspace = child.get('uiWorkspace');
        const conversationInput = child.get('conversation')?.input;
        // The durable user message and the pending steering bubble render through
        // the same shipped component, so both keys are shadowed.
        for (const key of ['user', 'steering']) {
          child.slots.inject('conversation.chat.node', () =>
            child.slots.register(
              {
                name: 'conversation.chat.node',
                key,
                priority: nextShadowPriority(child.slots, 'conversation.chat.node', key),
                inject: () => ({
                  sessions,
                  uiWorkspace,
                  conversationInput,
                  remote,
                  sessionRemote: child.get('remote.session'),
                  permissionRemote: child.get('remote.permissionPresets'),
                  tr: t,
                }),
              },
              UserMessageWithRecall,
            ),
          );
        }
      });
    }

    // Pure helpers exposed for the Node test suite. The module loader ignores
    // extra keys, so this costs nothing at runtime.
    return {
      inject,
      apply,
      __internals: {
        DICTS,
        UI_LANG,
        contentParts,
        messageText,
        latestUserSeq,
        userSeqInfo,
        nextShadowPriority,
        writeBack,
        nodeSeq,
        isUserMessageSeq,
        formatClock,
        isFirstUserNode,
        isLastUserNode,
        modelChoices,
        modelGroups,
        permissionLabel,
      },
    };
  },
});
