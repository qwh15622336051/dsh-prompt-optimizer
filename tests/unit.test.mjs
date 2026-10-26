/**
 * 提示词优化插件的纯数据契约测试。
 *
 * 这些用例不需要 DSH 运行时：client.js 作为普通脚本在 node:vm 沙箱里加载，
 * 只取它的 factory 返回值；config.js / contract.js 是普通 ESM，可直接导入。
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { DESCRIPTORS as HOST_DESCRIPTORS, PACKAGE, NAMESPACE } from '../contract.js';
import { CONFIG_KEYS, DEFAULT_SYSTEM_PROMPT, materializeConfig } from '../config.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** 在沙箱里加载 client.js 并返回它的 factory 产物。 */
function loadClient() {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  let registration;
  const sandbox = {
    window: { __ModuleLoader__: { load: (reg) => { registration = reg; } } },
    document: { createElement: () => ({ setAttribute() {}, style: {}, textContent: '' }), head: { append() {} } },
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'client.js' });
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (value) => [value, () => {}],
    useEffect: () => {},
    useMemo: (fn) => fn(),
    useRef: (value) => ({ current: value }),
    useCallback: (fn) => fn,
    memo: (component) => component,
  };
  const requireStub = (spec) => {
    if (spec === 'react') return React;
    if (spec === 'react-dom') return { createPortal: (node) => node };
    throw new Error(`unexpected require: ${spec}`);
  };
  return { registration, plugin: registration.factory(requireStub) };
}

test('client.js 通过 __ModuleLoader__ 注册，且 id 与 package.json 的 name 一致', () => {
  const { registration } = loadClient();
  assert.equal(registration.id, pkg.name);
  assert.equal(PACKAGE, pkg.name);
});

test('插件声明 dsh.bundle（收录要求：只声明 dsh.client 不可安装）', () => {
  assert.ok(pkg.dsh?.bundle?.patch, 'dsh.bundle.patch 必须存在');
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
});

test('官方 @deepseek-ai/* 依赖只能出现在 peerDependencies', () => {
  const deps = Object.keys(pkg.dependencies ?? {});
  assert.deepEqual(deps.filter((d) => d.startsWith('@deepseek-ai/')), [], '不得把官方包列为 dependencies');
  assert.ok(Object.keys(pkg.peerDependencies ?? {}).some((d) => d.startsWith('@deepseek-ai/')));
});

test('客户端内联的 Remote 描述符与 contract.js 完全一致（防止两处漂移）', () => {
  const { plugin } = loadClient();
  const clientDescriptors = plugin.__internals?.DESCRIPTORS;
  assert.ok(Array.isArray(clientDescriptors), 'client 必须暴露 DESCRIPTORS 作为契约守卫');
  // 跨 realm 对象比较：先归一化成 JSON 字符串再比。
  // description 只用于生成 JSON Schema，客户端内联副本不含它，属设计如此。
  const strip = (list) => list.map((d) => ({
    ...d,
    parameters: d.parameters.map(({ description, ...rest }) => rest),
  }));
  assert.equal(JSON.stringify(strip(clientDescriptors)), JSON.stringify(strip(HOST_DESCRIPTORS)));
});

test('每个 Remote 方法的 id / namespace / 参数线名都成形', () => {
  for (const d of HOST_DESCRIPTORS) {
    assert.equal(d.id, `${PACKAGE}#${NAMESPACE}/${d.method}`);
    assert.equal(d.namespace, NAMESPACE);
    assert.equal(d.invocation.kind, 'direct');
    assert.equal(d.result.mode, 'strict');
    for (const p of d.parameters) {
      assert.equal(p.wire, p.name, '参数线名必须等同参数名');
      assert.equal(p.source, 'json');
      assert.equal(p.codec.mode, 'strict');
    }
  }
});

test('移除撤回/编辑后，Remote 只保留提示词优化与设置三项', () => {
  assert.deepEqual(HOST_DESCRIPTORS.map((d) => d.method).sort(), ['getSettings', 'optimize', 'setSettings']);
});

test('设置字段清单与 schema 一致，且不含已移除的三个字段', () => {
  assert.equal(CONFIG_KEYS.length, 10);
  for (const gone of ['enableRetract', 'enableEdit', 'rollbackRefillDraft']) {
    assert.equal(CONFIG_KEYS.includes(gone), false, `${gone} 应已移除`);
  }
});

test('materializeConfig 填入默认值，并保留显式覆盖', () => {
  const defaults = materializeConfig({});
  assert.equal(defaults.enabled, true);
  assert.equal(defaults.maxTokens, 2000);
  assert.equal(defaults.systemPrompt, DEFAULT_SYSTEM_PROMPT);
  const custom = materializeConfig({ provider: 'loomy', model: 'x', enabled: false });
  assert.equal(custom.provider, 'loomy');
  assert.equal(custom.model, 'x');
  assert.equal(custom.enabled, false);
  assert.equal(custom.maxInputChars, 4000, '未覆盖的字段仍有默认值');
});

test('materializeConfig 对无效输入安全返回 undefined', () => {
  assert.equal(materializeConfig(undefined), undefined);
  assert.equal(materializeConfig(null), undefined);
  assert.equal(materializeConfig('nope'), undefined);
});

test('默认改写指令要求保留 @ 引用且只输出正文', () => {
  assert.match(DEFAULT_SYSTEM_PROMPT, /@/);
  assert.match(DEFAULT_SYSTEM_PROMPT, /只做改写|只输出/);
});
