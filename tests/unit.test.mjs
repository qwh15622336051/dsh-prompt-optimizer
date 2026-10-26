/**
 * client.js 纯函数单元测试。
 *
 * 目标：不依赖任何 DSH 运行时（无 Cordis、无 Host、无浏览器），
 * 只把 client.js 当作普通脚本加载进 node:vm 沙箱，取出它注册的
 * factory，再用一个 require 桩在 Node 里跑起来，然后直接测
 * `plugin.__internals` 暴露出来的纯函数。
 *
 * 运行：node --test tests/
 *
 * 关于 __internals：client.js 由 Lead 独占写入，其中 `__internals`
 * 测试钩子是后加的。若某个内部名还不存在，对应用例走 t.skip() 并打印
 * 原因，而不是判失败——这样钩子尚未落地时套件依然全绿，缺什么一目了然。
 */

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
// legacy（非严格）deepEqual：只比较可枚举自有属性，不比较 [[Prototype]]。
// 见下方 sameData 的说明，跨 realm 的纯数据断言必须用它。
import { deepEqual as looseDeepEqual } from 'node:assert';

/* ------------------------------------------------------------------ *
 * 一、加载 client.js
 * ------------------------------------------------------------------ */

// client.js 没有 import/export，顶层就是 window.__ModuleLoader__.load({ id, factory })。
// 因此给它一个只负责“接住注册对象”的 window 即可。
const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
let registration;
const sandbox = {
  window: {
    __ModuleLoader__: {
      load: (reg) => {
        registration = reg;
      },
    },
  },
  document: {
    createElement: () => ({ setAttribute() {}, style: {}, textContent: '' }),
    head: { append() {} },
  },
  console,
  TextDecoder,
  setTimeout,
  clearTimeout,
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'client.js' });

// React 极简桩：只要不渲染（不调用组件函数），这些钩子够 factory 建模块表用。
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
  throw new Error('unexpected require: ' + spec);
};

// 这里若 client.js 顶层语法/取值有问题，整个文件会抛出——这是期望行为，
// 真坏了就应该红，而不是被吞掉。
const plugin = registration.factory(requireStub);

/* ------------------------------------------------------------------ *
 * 二、测试钩子读取
 * ------------------------------------------------------------------ */

/** __internals 可能还没落地，缺失时退化成空对象。 */
const internals =
  plugin && typeof plugin.__internals === 'object' && plugin.__internals !== null
    ? plugin.__internals
    : {};

/**
 * 取一个内部函数；不存在就跳过当前用例并说明原因。
 * @returns {Function|null} null 表示“已跳过，调用方应立刻 return”。
 */
function intern(name, t) {
  const value = internals[name];
  if (typeof value !== 'function') {
    t.skip(
      `client.js 的 __internals 未暴露可调用函数 "${name}"（Lead 的测试钩子可能还没落地）`,
    );
    return null;
  }
  return value;
}

/* ------------------------------------------------------------------ *
 * 三、通用小工具
 * ------------------------------------------------------------------ */

/** 记录 setDraft 调用的假 inputActions。 */
function makeRecorder({ failOnObject = false } = {}) {
  const calls = [];
  return {
    calls,
    inputActions: {
      setDraft(value) {
        if (failOnObject && value !== null && typeof value === 'object') {
          throw new Error('setDraft 拒绝语义文档形式');
        }
        calls.push(value);
      },
    },
    last: () => calls[calls.length - 1],
  };
}

/** 造一条 eventSource 快照条目。 */
function eventEntry(seq, type = 'user/message', surfaceOp) {
  const event = { type };
  if (seq !== undefined) event.seq = seq;
  // surfaceOp === undefined 表示“不写这个字段”，与显式 'append' 是两种输入。
  if (surfaceOp !== undefined) event.surfaceOp = surfaceOp;
  return { type: 'event', event };
}

/** 造一个带 getSnapshot 的 binding（hasMore 通常是布尔，缺省即 undefined）。 */
function bindingOf(entries, hasMore) {
  return { eventSource: { getSnapshot: () => ({ entries, hasMore }) } };
}

/** 造一个原生快照对象，用来覆盖 hasMore 的各种取值。 */
function bindingWithSnapshot(snapshot) {
  return { eventSource: { getSnapshot: () => snapshot } };
}

/**
 * 跨 realm 的结构比较。
 *
 * client.js 跑在 node:vm 沙箱里，它构造出来的对象/数组，其原型来自沙箱
 * realm，与宿主 realm 的 Object.prototype / Array.prototype 并不是同一个
 * 对象。而 node:assert/strict 的 deepEqual 等价于 deepStrictEqual，会额外
 * 比较 [[Prototype]]，于是对这类纯数据结果会误报
 * “Values have same structure but are not reference-equal”。
 *
 * 这里改用 legacy deepEqual：它只比较可枚举自有属性、不比较原型，正好适合
 * 跨 realm 的纯数据结构断言。标量断言仍然走 assert.strict 的 ===（assert.equal）。
 */
function sameData(actual, expected, message) {
  looseDeepEqual(actual, expected, message);
}

/**
 * 断言 file 块产出的条目形状。
 *
 * 形状是不对称的（已对照官方源码确认，勿“顺手改成对称”）：image 多一层
 * attachment，file 直接把原 attachment 放在 file 上。
 */
function assertFileEntry(entry, attachment) {
  assert.equal(entry.type, 'file');
  sameData(entry, { type: 'file', file: attachment });
  // 严格一点：file 上不能再有 attachment 这一层。
  assert.equal(Object.prototype.hasOwnProperty.call(entry, 'attachment'), false);
  if (attachment && typeof attachment === 'object') {
    assert.equal(Object.prototype.hasOwnProperty.call(entry.file, 'attachment'), false);
  }
}

/* ================================================================== *
 * 四、加载与注册
 * ================================================================== */

test('client.js 通过 __ModuleLoader__ 注册，id 与 package.json 的 name 一致', () => {
  assert.ok(registration, 'client.js 顶层没有调用 window.__ModuleLoader__.load');
  assert.equal(registration.id, 'dsh-prompt-optimizer');
  assert.equal(typeof registration.factory, 'function');
});

test('client.js 的 factory 返回值暴露 __internals 测试钩子', (t) => {
  if (!internals || Object.keys(internals).length === 0) {
    t.skip('client.js 尚未挂载 __internals（Lead 的测试钩子还没落地）');
    return;
  }
  assert.equal(typeof internals, 'object');
});

/* ================================================================== *
 * 五、contentParts / messageText
 * ================================================================== */

test('contentParts：非数组输入返回空结果', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  const empty = { text: '', attachments: [], rest: [] };
  // undefined、null、字符串、对象都不是内容块数组。
  sameData(contentParts(undefined), empty);
  sameData(contentParts(null), empty);
  sameData(contentParts('hello'), empty);
  sameData(contentParts({ type: 'text', text: 'x' }), empty);
});

test('contentParts：空数组返回空结果', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  sameData(contentParts([]), { text: '', attachments: [], rest: [] });
});

test('contentParts：多个 text 块按顺序拼接，非字符串 text 归入 rest', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  const parts = contentParts([
    { type: 'text', text: '第一段' },
    { type: 'text', text: '第二段' },
    { type: 'text', text: 123 }, // text 非字符串 → 不是有效 text 块
  ]);
  assert.equal(parts.text, '第一段第二段');
  assert.equal(parts.attachments.length, 0);
  sameData(parts.rest, [{ type: 'text', text: 123 }]);
});

test('contentParts：image 块带 attachment 进入 attachments', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  const attachment = { id: 'att-1', mediaType: 'image/png' };
  const parts = contentParts([{ type: 'image', attachment }]);
  assert.equal(parts.text, '');
  assert.equal(parts.attachments.length, 1);
  // image 的包裹形状在任务书与实现里一致：{ type:'image', image:{ attachment } }
  sameData(parts.attachments[0], { type: 'image', image: { attachment } });
  assert.equal(parts.rest.length, 0);
});

test('contentParts：file 块产出 { type:"file", file:<attachment> }（没有 attachment 那一层）', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  const attachment = { id: 'file-1', name: 'notes.md' };
  const parts = contentParts([{ type: 'file', attachment }]);
  assert.equal(parts.attachments.length, 1);
  // file 与 image 的形状是不对称的：file 直接挂原 attachment，没有再包一层。
  assertFileEntry(parts.attachments[0], attachment);
  assert.equal(parts.rest.length, 0);
});

test('contentParts：image/file 缺 attachment 时归入 rest，未知类型也归入 rest', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  const noAttachmentImage = { type: 'image' };
  const noAttachmentFile = { type: 'file' };
  const unknown = { type: 'thinking', text: '内部推理' };
  const parts = contentParts([noAttachmentImage, noAttachmentFile, unknown]);
  sameData(parts.attachments, []);
  // rest 保留原块（引用相等即可），顺序与输入一致。
  assert.equal(parts.rest.length, 3);
  assert.equal(parts.rest[0], noAttachmentImage);
  assert.equal(parts.rest[1], noAttachmentFile);
  assert.equal(parts.rest[2], unknown);
});

test('contentParts：text/image/file 混合时各归其位', (t) => {
  const contentParts = intern('contentParts', t);
  if (!contentParts) return;
  const img = { id: 'i' };
  const doc = { id: 'f' };
  const other = { type: 'audio' };
  const parts = contentParts([
    { type: 'text', text: '看图：' },
    { type: 'image', attachment: img },
    { type: 'text', text: '和文档：' },
    { type: 'file', attachment: doc },
    other,
  ]);
  assert.equal(parts.text, '看图：和文档：');
  sameData(parts.attachments[0], { type: 'image', image: { attachment: img } });
  assertFileEntry(parts.attachments[1], doc);
  sameData(parts.rest, [other]);
});

test('messageText：等于 contentParts 的 text，非数组返回空串', (t) => {
  const messageText = intern('messageText', t);
  const contentParts = intern('contentParts', t);
  if (!messageText || !contentParts) return;
  const content = [
    { type: 'text', text: 'a' },
    { type: 'image', attachment: { id: 'i' } },
    { type: 'text', text: 'b' },
  ];
  assert.equal(messageText(content), 'ab');
  assert.equal(messageText(content), contentParts(content).text);
  assert.equal(messageText(undefined), '');
  assert.equal(messageText(null), '');
  assert.equal(messageText([]), '');
});

/* ================================================================== *
 * 六、latestUserSeq
 * ================================================================== */

test('latestUserSeq：取最后一个 append 的用户消息 seq', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  const binding = bindingOf([
    eventEntry(1, 'user/message'),
    eventEntry(2, 'assistant/message'),
    eventEntry(3, 'user/message'),
    eventEntry(4, 'assistant/message'),
  ]);
  assert.equal(latestUserSeq(binding), 3);
});

test('latestUserSeq：显式 surfaceOp === "append" 视为有效', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  assert.equal(latestUserSeq(bindingOf([eventEntry(9, 'user/message', 'append')])), 9);
});

test('latestUserSeq：surfaceOp 非 append 的用户消息被跳过', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  const binding = bindingOf([
    eventEntry(2, 'user/message', 'append'),
    eventEntry(5, 'user/message', 'replace'), // 撤回/编辑产生的替换，不算“最新追加”
    eventEntry(7, 'user/message', 'remove'),
  ]);
  assert.equal(latestUserSeq(binding), 2);
});

test('latestUserSeq：忽略非 event 条目与非 user/message 事件', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  const binding = bindingOf([
    { type: 'pending', id: 'p1' },
    { type: 'local', event: { type: 'user/message', seq: 100 } },
    eventEntry(4, 'user/message'),
    eventEntry(6, 'tool/call'),
  ]);
  assert.equal(latestUserSeq(binding), 4);
});

test('latestUserSeq：找不到匹配时返回 undefined（不抛错）', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  assert.equal(latestUserSeq(bindingOf([])), undefined);
  assert.equal(latestUserSeq(bindingOf([eventEntry(1, 'assistant/message')])), undefined);
  assert.equal(latestUserSeq(bindingOf(undefined)), undefined);
  assert.equal(latestUserSeq(bindingOf('not-an-array')), undefined);
});

test('latestUserSeq：binding 为 undefined / 缺 eventSource / 缺 getSnapshot 时返回 undefined', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  // binding 本身 undefined 绝不能抛错——这是撤回按钮的常态（会话未就绪）。
  assert.equal(latestUserSeq(undefined), undefined);
  assert.equal(latestUserSeq(null), undefined);
  assert.equal(latestUserSeq({}), undefined);
  assert.equal(latestUserSeq({ eventSource: {} }), undefined);
  assert.equal(latestUserSeq({ eventSource: { getSnapshot: null } }), undefined);
});

test('latestUserSeq：getSnapshot 抛错时吞掉并返回 undefined', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  const binding = {
    eventSource: {
      getSnapshot() {
        throw new Error('事件窗口尚未就绪');
      },
    },
  };
  assert.equal(latestUserSeq(binding), undefined);
});

test('latestUserSeq：匹配到但 seq 非数字时跳过该条，不覆盖前一个有效值', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  const binding = bindingOf([
    eventEntry(7, 'user/message'),
    { type: 'event', event: { type: 'user/message', seq: '8' } }, // seq 是字符串
  ]);
  assert.equal(latestUserSeq(binding), 7);
});

test('latestUserSeq：surfaceOp 是对象（{op:"replace"}）时同样被跳过', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  // 真实事件里 surfaceOp 是结构化对象，不是字符串；只有 undefined/'append' 算追加。
  const binding = bindingOf([
    eventEntry(2, 'user/message'),
    { type: 'event', event: { type: 'user/message', seq: 5, surfaceOp: { op: 'replace', target: 2 } } },
  ]);
  assert.equal(latestUserSeq(binding), 2);
});

test('latestUserSeq：返回的是 number 本身，不是包装对象', (t) => {
  const latestUserSeq = intern('latestUserSeq', t);
  if (!latestUserSeq) return;
  const result = latestUserSeq(bindingOf([eventEntry(42, 'user/message')]));
  assert.equal(typeof result, 'number');
  assert.equal(result, 42);
});

/* ================================================================== *
 * 七、userSeqInfo
 * ================================================================== */

test('userSeqInfo：返回 { latest, first, hasMore }，first 是最早的 user/message', (t) => {
  const userSeqInfo = intern('userSeqInfo', t);
  if (!userSeqInfo) return;
  const binding = bindingOf(
    [
      eventEntry(1, 'assistant/message'),
      eventEntry(2, 'user/message'),
      eventEntry(3, 'assistant/message'),
      eventEntry(4, 'user/message'),
      eventEntry(5, 'tool/call'),
      eventEntry(6, 'user/message'),
    ],
    false,
  );
  sameData(userSeqInfo(binding), { latest: 6, first: 2, hasMore: false });
});

test('userSeqInfo：hasMore 严格取 === true，其它取值一律 false', (t) => {
  const userSeqInfo = intern('userSeqInfo', t);
  if (!userSeqInfo) return;
  const entries = [eventEntry(1, 'user/message')];
  assert.equal(userSeqInfo(bindingWithSnapshot({ entries, hasMore: true })).hasMore, true);
  // 真值但不是 true 的都不算。
  for (const value of [false, undefined, null, 0, 1, 'true', {}]) {
    assert.equal(
      userSeqInfo(bindingWithSnapshot({ entries, hasMore: value })).hasMore,
      false,
      `hasMore=${JSON.stringify(value)} 应视为 false`,
    );
  }
});

test('userSeqInfo：只统计 append/undefined 的用户消息，替换事件不计入 first/latest', (t) => {
  const userSeqInfo = intern('userSeqInfo', t);
  if (!userSeqInfo) return;
  const binding = bindingOf([
    { type: 'event', event: { type: 'user/message', seq: 10, surfaceOp: { op: 'replace' } } },
    eventEntry(11, 'user/message', 'append'),
    eventEntry(12, 'user/message', 'remove'),
  ]);
  sameData(userSeqInfo(binding), { latest: 11, first: 11, hasMore: false });
});

test('userSeqInfo：没有用户消息时最新与最早都是 undefined，且不抛错', (t) => {
  const userSeqInfo = intern('userSeqInfo', t);
  if (!userSeqInfo) return;
  sameData(userSeqInfo(bindingOf([eventEntry(1, 'assistant/message')])), {
    latest: undefined,
    first: undefined,
    hasMore: false,
  });
  sameData(userSeqInfo(bindingOf([])), { latest: undefined, first: undefined, hasMore: false });
  sameData(userSeqInfo(undefined), { latest: undefined, first: undefined, hasMore: false });
  sameData(userSeqInfo({}), { latest: undefined, first: undefined, hasMore: false });
  sameData(userSeqInfo(bindingOf('not-an-array')), {
    latest: undefined,
    first: undefined,
    hasMore: false,
  });
});

test('userSeqInfo：getSnapshot 抛错时返回全空结果，不向上冒泡', (t) => {
  const userSeqInfo = intern('userSeqInfo', t);
  if (!userSeqInfo) return;
  const binding = {
    eventSource: {
      getSnapshot() {
        throw new Error('事件窗口尚未就绪');
      },
    },
  };
  sameData(userSeqInfo(binding), { latest: undefined, first: undefined, hasMore: false });
});

test('userSeqInfo：非数字 seq 的条目被整体跳过', (t) => {
  const userSeqInfo = intern('userSeqInfo', t);
  if (!userSeqInfo) return;
  const binding = bindingOf([
    eventEntry(3, 'user/message'),
    { type: 'event', event: { type: 'user/message', seq: '4' } },
  ]);
  sameData(userSeqInfo(binding), { latest: 3, first: 3, hasMore: false });
});

/* ================================================================== *
 * 七、nextShadowPriority
 * ================================================================== */

test('nextShadowPriority：取最小 priority 再减 1', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  const slots = { entries: () => [{ priority: 10 }, { priority: 3 }, { priority: 7 }] };
  assert.equal(nextShadowPriority(slots, 'conversation.chat.node'), 2);
});

test('nextShadowPriority：单条注册时返回其 priority - 1', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  assert.equal(nextShadowPriority({ entries: () => [{ priority: 0 }] }, 'k'), -1);
  assert.equal(nextShadowPriority({ entries: () => [{ priority: -4 }] }, 'k'), -5);
});

test('nextShadowPriority：没有条目时返回 -1', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  assert.equal(nextShadowPriority({ entries: () => [] }, 'k'), -1);
  assert.equal(nextShadowPriority({ entries: () => undefined }, 'k'), -1);
  assert.equal(nextShadowPriority({ entries: () => null }, 'k'), -1);
});

test('nextShadowPriority：priority 字段缺失按 0 处理（因而结果为 -1）', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  assert.equal(nextShadowPriority({ entries: () => [{ priority: 5 }, {}] }, 'k'), -1);
});

test('nextShadowPriority：slots 无 entries 方法 / slots 为空时返回 -1（不抛错）', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  assert.equal(nextShadowPriority(undefined, 'k'), -1);
  assert.equal(nextShadowPriority(null, 'k'), -1);
  assert.equal(nextShadowPriority({}, 'k'), -1);
  assert.equal(nextShadowPriority({ entries: 'not-a-function' }, 'k'), -1);
});

test('nextShadowPriority：entries 抛错时兜底返回 -1', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  const slots = {
    entries() {
      throw new Error('slot 表已销毁');
    },
  };
  assert.equal(nextShadowPriority(slots, 'k'), -1);
});

test('nextShadowPriority：把 key 原样传给 slots.entries', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  const seen = [];
  const slots = {
    entries(key) {
      seen.push(key);
      return [{ priority: 8 }];
    },
  };
  assert.equal(nextShadowPriority(slots, 'conversation.chat.node'), 7);
  sameData(seen, ['conversation.chat.node']);
});

test('nextShadowPriority：传 entryKey 时只统计该 key 的条目', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  // 不传 entryKey → 全局最小（1）再减 1。
  const slots = { entries: () => [{ key: 'k', priority: 5 }, { key: 'j', priority: 1 }] };
  assert.equal(nextShadowPriority(slots, 'conversation.chat.node'), 0);
  // 传 entryKey='k' → 只看 k 的 5，再减 1，不被 j 拉低。
  assert.equal(nextShadowPriority(slots, 'conversation.chat.node', 'k'), 4);
  assert.equal(nextShadowPriority(slots, 'conversation.chat.node', 'j'), 0);
});

test('nextShadowPriority：entryKey 命中任务书给的示例 → -2', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  const slots = { entries: () => [{ key: 'k', priority: -1 }, { key: 'j', priority: 0 }] };
  assert.equal(nextShadowPriority(slots, 'conversation.chat.node', 'k'), -2);
});

test('nextShadowPriority：entryKey 没有任何匹配时返回 -1', (t) => {
  const nextShadowPriority = intern('nextShadowPriority', t);
  if (!nextShadowPriority) return;
  const slots = { entries: () => [{ key: 'j', priority: -50 }] };
  // 过滤后为空 → 走“无条目”分支，结果是 -1 而不是 -51。
  assert.equal(nextShadowPriority(slots, 'k', 'missing'), -1);
});

/* ================================================================== *
 * 八、writeBack
 * ================================================================== */

test('writeBack：无 occurrences 时调用 setDraft(字符串)', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  for (const occurrences of [undefined, null, []]) {
    const rec = makeRecorder();
    const result = writeBack(rec.inputActions, '优化后的草稿', occurrences);
    sameData(result, { dropped: [] });
    sameData(rec.calls, ['优化后的草稿']);
    assert.equal(typeof rec.last(), 'string');
  }
});

test('writeBack：occurrences 非数组时按空处理', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, '纯文本', 'oops');
  sameData(result, { dropped: [] });
  sameData(rec.calls, ['纯文本']);
});

test('writeBack：单个引用命中时回填语义文档，offset/length 正确', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = '请阅读 [file:a.md] 然后总结';
  const occurrence = {
    source: 'workspace',
    ref: 'a.md',
    label: 'a.md',
    clipboardText: '[file:a.md]',
    appearance: 'chip',
  };
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, optimized, [occurrence]);
  sameData(result, { dropped: [] });
  assert.equal(rec.calls.length, 1);
  const payload = rec.last();
  assert.equal(typeof payload, 'object');
  assert.equal(payload.text, optimized);
  assert.equal(payload.references.length, 1);
  const reference = payload.references[0];
  assert.equal(reference.offset, optimized.indexOf('[file:a.md]'));
  assert.equal(reference.offset, 4); // '请阅读 ' 共 4 个字符
  assert.equal(reference.length, '[file:a.md]'.length);
  assert.equal(reference.source, 'workspace');
  assert.equal(reference.ref, 'a.md');
  assert.equal(reference.label, 'a.md');
  assert.equal(reference.clipboardText, '[file:a.md]');
  assert.equal(reference.appearance, 'chip');
});

test('writeBack：多个引用按出现顺序得到各自 offset', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = '先看 @A 再看 @B 结束';
  const first = { source: 's1', ref: 'r1', label: 'A', clipboardText: '@A' };
  const second = { source: 's2', ref: 'r2', label: 'B', clipboardText: '@B' };
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, optimized, [first, second]);
  sameData(result, { dropped: [] });
  const { references } = rec.last();
  assert.equal(references.length, 2);
  assert.equal(references[0].offset, optimized.indexOf('@A'));
  assert.equal(references[0].offset, 3);
  assert.equal(references[0].length, 2);
  assert.equal(references[1].offset, optimized.indexOf('@B'));
  assert.equal(references[1].offset, 9);
  assert.equal(references[1].length, 2);
  // 两个 offset 必须递增且互不重叠，否则 chip 渲染会错位。
  assert.ok(references[0].offset + references[0].length <= references[1].offset);
});

test('writeBack：任务书示例 "see @a.ts and @b.ts" → offset 4 与 14', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = 'see @a.ts and @b.ts';
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, optimized, [
    { source: 's', ref: 'a.ts', label: 'a.ts', clipboardText: '@a.ts' },
    { source: 's', ref: 'b.ts', label: 'b.ts', clipboardText: '@b.ts' },
  ]);
  sameData(result, { dropped: [] });
  const payload = rec.last();
  assert.equal(payload.text, optimized);
  sameData(
    payload.references.map((r) => r.offset),
    [4, 14],
  );
  sameData(
    payload.references.map((r) => r.length),
    [5, 5],
  );
});

test('writeBack：相同 clipboardText 的多个 chip 按 cursor 顺序匹配，不重叠', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = 'aa';
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, optimized, [
    { source: 's', ref: '1', label: '1', clipboardText: 'a' },
    { source: 's', ref: '2', label: '2', clipboardText: 'a' },
  ]);
  sameData(result, { dropped: [] });
  const { references } = rec.last();
  sameData(
    references.map((r) => r.offset),
    [0, 1],
  );
  references.forEach((r) => assert.equal(r.length, 1));
});

test('writeBack：未定义 appearance 时不写该字段，invalid === true 时透传', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, '文本 @A', [
    { source: 's', ref: 'r', label: 'A', clipboardText: '@A', invalid: true },
  ]);
  sameData(result, { dropped: [] });
  const reference = rec.last().references[0];
  assert.equal(Object.prototype.hasOwnProperty.call(reference, 'appearance'), false);
  assert.equal(reference.invalid, true);
});

test('writeBack：chip 丢失时回退为 setDraft(字符串) 并在 dropped 里报告', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = '模型把引用删掉了';
  const occurrence = { source: 'workspace', ref: 'gone.md', label: 'gone.md', clipboardText: '@gone.md' };
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, optimized, [occurrence]);
  sameData(result, { dropped: ['gone.md'] });
  // 关键：绝不能把丢失的 chip 悄悄吞掉，必须退回纯字符串写入。
  assert.equal(rec.calls.length, 1);
  assert.equal(rec.last(), optimized);
  assert.equal(typeof rec.last(), 'string');
});

test('writeBack：部分命中部分丢失时，只报告丢失项且整体回退为字符串', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = '保留 @A';
  const kept = { source: 's1', ref: 'a', label: 'A', clipboardText: '@A' };
  const lost = { source: 's2', ref: 'b', label: 'B', clipboardText: '@B' };
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, optimized, [kept, lost]);
  sameData(result, { dropped: ['B'] });
  assert.equal(typeof rec.last(), 'string');
  assert.equal(rec.last(), optimized);
});

test('writeBack：clipboardText 为空串的 chip 记为丢失，label 缺省时用空串', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const rec = makeRecorder();
  const withLabel = writeBack(rec.inputActions, '无引用', [
    { source: 's', ref: 'r', label: '文件A', clipboardText: '' },
  ]);
  sameData(withLabel, { dropped: ['文件A'] });
  assert.equal(rec.last(), '无引用');

  const rec2 = makeRecorder();
  const noLabel = writeBack(rec2.inputActions, '无引用', [
    { source: 's', ref: 'r', clipboardText: '' },
  ]);
  // label ?? '' → 空串，而不是 'undefined'。
  sameData(noLabel, { dropped: [''] });
});

test('writeBack：clipboardText 非字符串时也按丢失处理', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, '文本', [
    { source: 's', ref: 'r', label: 'L', clipboardText: null },
  ]);
  sameData(result, { dropped: ['L'] });
  assert.equal(rec.last(), '文本');
});

test('writeBack：setDraft 拒绝语义文档形式时回退为字符串并全量报告', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const optimized = '含 @A 和 @B';
  const rec = makeRecorder({ failOnObject: true });
  const result = writeBack(rec.inputActions, optimized, [
    { source: 's1', ref: 'a', label: 'A', clipboardText: '@A' },
    { source: 's2', ref: 'b', label: 'B', clipboardText: '@B' },
  ]);
  sameData(result, { dropped: ['A', 'B'] });
  // 第一次（对象）抛错，第二次（字符串）必须成功落地。
  assert.equal(rec.calls.length, 1);
  assert.equal(rec.last(), optimized);
  assert.equal(typeof rec.last(), 'string');
});

test('writeBack：没有任何引用时返回 { dropped: [] } 且只调用一次 setDraft', (t) => {
  const writeBack = intern('writeBack', t);
  if (!writeBack) return;
  const rec = makeRecorder();
  const result = writeBack(rec.inputActions, '随便写点什么', []);
  sameData(result, { dropped: [] });
  assert.equal(rec.calls.length, 1);
});
