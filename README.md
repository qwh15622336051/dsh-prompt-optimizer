<h1 align="center">提示词优化 · Prompt Optimizer</h1>

<p align="center">
  <img src="icon.svg" width="96" height="96" alt="Prompt Optimizer">
</p>

<p align="center">
  简体中文 · <a href="README.en.md">English</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/qwh15622336051/dsh-prompt-optimizer?style=flat-square" alt="license"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/DSH-0.2.1--rc.3-4176e6?style=flat-square" alt="DSH 0.2.1-rc.3"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/topic-dsh--plugin-4176e6?style=flat-square" alt="topic dsh-plugin"></a>
</p>

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的输入框里，把你随口说的大白话改写成清晰、具体、可执行的提示词。

点一下按钮，草稿被替换成改写结果；**不会自动发送**，你检查完再自己发。

## 它做什么

- **一键改写** —— 输入框工具栏右侧（模型选择器左边）一个按钮，对当前草稿做改写。
- **不满意可以撤** —— 优化后会多出一个撤销入口，点一下恢复你自己敲的原文（改过优化结果会先问一次，免得误删）。
- **模型你说了算** —— 从 DSH 中**已配置**的模型里挑，按厂商分组；也可以留空跟随当前会话。
- **改写规则可整段替换** —— 发给模型的系统提示词就是一段可编辑文本，你可以完全换成自己的风格。
- **会读你 @ 的东西** —— 草稿里的 `@文件`、`@文件夹`、`@会话` 会被读取内容交给改写器，让它知道实际涉及哪些代码。读取范围限于会话工作目录，并且有大小上限。

## 安装

```sh
dsh plugin add @huanhuan123/dsh-prompt-optimizer
```

## 使用

写好草稿 → 点工具栏里的魔棒按钮 → 一两秒后输入框内容被替换 → 检查后自己按发送。

按钮在草稿为空、或输入框处于非普通状态（例如正在打斜杠命令）时不可点。改写失败会在按钮旁显示原因，**原草稿一个字都不会变**。

## 设置

入口：**设置 → 提示词优化**，或 **设置 → 插件 → 本插件所在行 → 配置**。

| 设置项 | 默认 | 说明 |
|---|---|---|
| 启用优化按钮 | 开 | 关闭后按钮从输入框隐藏 |
| 优化用的模型 | 跟随当前会话 | 只能选 DSH 中已配置的模型 |
| 改写指令（系统提示词） | 内置模板 | 整段可改 |
| 读取 @ 引用指向的内容 | 开 | 关闭则只依据你自己的文字改写 |
| 最大输出 token | 2000 | 改写结果的长度上限 |
| 超时（毫秒） | 30000 | |
| 草稿字数上限 | 4000 | 超出时按钮不可点 |
| 单文件读取上限（字符） | 8000 | 0 表示不读取文件内容 |
| 引用内容总量上限（字符） | 32000 | 所有引用合计 |
| 按钮位置 | 右工具栏 | 右工具栏 / 左工具栏 |
| 同位置内排序 | 40 | 越小越靠左，用来避开同位置的其它插件 |
| 图标颜色 | 跟随主题 | 7 个预设色，均取自宿主主题变量 |
| 图标大小 | 中 | 小 / 中 / 大 |
| 允许撤销优化 | 开 | 优化后出现撤销入口，一键还原你自己敲的内容 |

## 已知边界

- 只改写草稿：**不自动发送**，也不会替你做别的决定。
- 读取引用内容时**不会走出当前会话的工作目录**。
- 改写是一次独立的模型调用，不写入对话记录；token 消耗按你选中的模型计。
- 改位置**即时生效**，不需要重载插件；颜色与大小也一样。

## License

[MIT](LICENSE)
