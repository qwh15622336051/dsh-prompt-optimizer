# 提示词优化 · Prompt Optimizer

DeepSeek Harness 插件：在输入框发送键旁加一个「优化提示词」按钮。点一下，把你输入框里的大白话改写成清晰、具体、可执行的提示词，直接填回输入框。

**不会自动发送**，改成什么样你都能再编辑。

## 功能

- **一键优化**：按钮位于输入框工具栏右侧（模型选择器左边）。
- **自选模型**：下拉框列出 DeepSeek Harness 中**已配置好**的厂商与模型；默认「跟随当前会话」。
- **改写指令可自定义**：作为系统提示词发给优化模型的那段文字，整段可改，可恢复默认。
- **读取 @ 引用内容**：草稿里的 `@文件` / `@文件夹` / `@会话` 会被读取内容并交给优化模型参考，让改写结果更具体。读取范围限于当前会话工作目录，且有单文件与总量上限。
- **保留引用标记**：优化后 `@引用` 会原样放回输入框（保留为引用 chip），不会变成死文字。
- **失败不动原稿**：模型报错、超时或返回空时，输入框内容一个字都不会变，只在按钮旁显示原因。

## 消息撤回 / 重新编辑

**不在本插件范围内。** 本插件只做提示词优化。

需要撤回或重新编辑已发送的消息，请安装专用插件 [`dsh-easyrewrite`](https://www.npmjs.com/package/dsh-easyrewrite)（原位重编辑、无痕替换）：

```sh
dsh plugin add dsh-easyrewrite
```

## 设置

两个入口，同一套配置：

- **设置 → 提示词优化**（左侧导航）
- **设置 → 插件 → 本插件所在行 → 配置**

可配置项：

| 项 | 默认 | 说明 |
|---|---|---|
| 启用优化按钮 | 开 | 关闭后按钮从输入框隐藏 |
| 优化用的模型 | 跟随当前会话 | 只能是 Harness 中已配置的模型 |
| 改写指令（系统提示词） | 内置模板 | 整段可改 |
| 读取 @ 引用指向的内容 | 开 | 读取引用内容供模型参考 |
| 最大输出 token | 2000 | |
| 超时（毫秒） | 30000 | |
| 草稿字数上限 | 4000 | 超出时按钮不可用 |
| 单文件读取上限（字符） | 8000 | 0 表示不读文件内容 |
| 引用内容总量上限（字符） | 32000 | |

配置写入本 profile 的 `cordis.patch.yml` 配置层（通过 DSH 设置服务），**插件升级不会覆盖你的配置**。也可以直接手改 `cordis.patch.yml` 的 `prompt-optimizer` 行。

## 结构

```
package.json        包清单（dsh.bundle.patch + dsh.client）
cordis.patch.yml    Loader 补丁：插入 prompt-optimizer 行
index.js            Host 半：模型调用、引用内容读取、设置读写、Typert Remote 服务
config.js           schemastery 配置 schema、默认改写指令、生效值读取
contract.js         Host 侧 Remote 描述符（方法与参数）
client.js           浏览器半：输入框按钮、设置页、Remote 挂载（零外部依赖）
locale/{zh,en}.json 插件元数据（标题/描述），供插件管理器读取
icon.svg            插件图标
```

## 实现要点

- **桥接**：浏览器半用 `ctx.remote.$mount()` 挂载本包的 Typert 描述符，调用
  `ctx.remote.promptOptimizer.{optimize,getSettings,setSettings}`。模型密钥始终留在 Host 侧。
- **免装饰器**：Host 侧的 Remote 方法标记以字符串属性
  `@deepseek-ai/dsh-typert-protocol/remote-methods` 直接写入原型，因此本插件是纯 JavaScript，
  不需要 TypeScript 装饰器编译步骤。
- **免 zod 上浏览器**：描述符里的 codec 只被 Gateway 校验 `mode === 'strict'`，
  `create()` 是惰性路径。浏览器半使用自洽的 stub schema，Host 侧在方法内做显式校验。
- **草稿写回**：`InputActions.setDraft(string)` 会清除引用 chip；需要保留 chip 时改用
  语义文档形式 `setDraft({ text, references })`（运行时支持）。任何 chip 丢失时自动退回纯文本并提示。

## 已知边界

- 按钮位置为输入框工具栏右侧（模型选择器左边）。紧贴发送键的那一格是单占位插槽，当前由语音输入
  按钮占用，占用它会顶掉官方按钮，因此未采用。
- 界面文案在插件加载时确定语言（跟随宿主语言），切换语言后刷新页面生效。
- 优化请求作为辅助模型调用，不写入会话消息流。
