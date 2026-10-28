<h1 align="center">Prompt Optimizer</h1>

<p align="center">
  <img src="icon.svg" width="96" height="96" alt="Prompt Optimizer">
</p>

<p align="center">
  <a href="README.md">简体中文</a> · English
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/qwh15622336051/dsh-prompt-optimizer?style=flat-square" alt="license"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/DSH-0.2.1--rc.3-4176e6?style=flat-square" alt="DSH 0.2.1-rc.3"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/topic-dsh--plugin-4176e6?style=flat-square" alt="topic dsh-plugin"></a>
</p>

Turns a casually written draft into a clear, specific, actionable prompt — from the composer of
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

One click replaces the draft. **Nothing is sent for you**: you review the result and send it yourself.

## What it adds

- **One-click rewrite** — a button in the composer tool row, left of the model selector, rewrites the current draft.
- **Undo it if you dislike it** — a rewrite adds an undo control that restores the text you wrote yourself in one click (if you edited the rewrite, it asks first so your edits are never silently discarded).
- **You pick the model** — choose from the models already configured in DSH, grouped by provider; leaving it empty follows the current session.
- **The rewriting instruction is yours** — the system prompt sent to the model is editable text, and you can replace it wholesale.
- **It reads what you reference** — `@file`, `@folder` and `@session` markers in the draft have their content read and handed to the rewriter, so the result names the code actually involved. Reads stay inside the session working directory and are capped.

## Install

```sh
dsh plugin add @huanhuan123/dsh-prompt-optimizer
```

## Usage

Write a draft → click the wand button → the composer content is replaced a second later → review, then send it yourself.

The button is disabled while the draft is empty or the composer is in a non-plain state (typing a slash command, for example). A failed rewrite reports the reason next to the button and **leaves the draft untouched**.

## Settings

Open **Settings → 提示词优化**, or **Settings → Plugins → this plugin's row → Configure**.

| Setting | Default | Meaning |
|---|---|---|
| Enable the optimize button | on | Hides the button from the composer when off |
| Model used for optimization | follow the current session | Only models configured in DSH can be selected |
| Rewriting instruction (system prompt) | built-in template | Editable in full |
| Read the content behind @ references | on | When off, only your own text is used |
| Max output tokens | 2000 | Length ceiling for the rewritten prompt |
| Timeout (ms) | 30000 | |
| Draft character limit | 4000 | Beyond it the button is disabled |
| Per-file read limit (characters) | 8000 | 0 means file content is not read |
| Total reference content limit (characters) | 32000 | Across all references |
| Button position | right toolbar | Right toolbar / left toolbar |
| Order within that position | 40 | Lower is further left, to avoid other plugins in the same seat |
| Icon colour | follow the theme | Seven presets, all taken from the host theme tokens |
| Icon size | medium | Small / medium / large |
| Allow undoing an optimization | on | A rewrite adds an undo control that restores your own text |

## Known limits

- It only rewrites the draft: it **never sends**, and makes no other decision for you.
- Reference reads **never leave the current session working directory**.
- The rewrite is a separate model call and is not written into the conversation record; its tokens are billed against the model you selected.
- Position changes take effect **immediately**, no plugin reload; so do colour and size.

## License

[MIT](LICENSE)
