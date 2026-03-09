# markdown-go

[中文说明](./README.md)

`markdown-go` is a local Markdown preview and publishing workflow CLI, designed for fast WeChat article formatting and paste-ready HTML output.

## 30-Second Quick Start

Requirements:

- Node.js 18+
- npm 9+

Install:

```bash
npm install -g @zacktian/markdown-go
```

Run:

```bash
markdown-go README.en.md
```

If you want to try it immediately, you can preview a Markdown string directly:

```bash
markdown-go "# Hello markdown-go\n\nHello, world." --is-string
```

After startup, `markdown-go` will:

1. Start a local preview server.
2. Open the preview page in your browser automatically.
3. Let you switch themes and copy paste-ready HTML for WeChat.

## What It Does

- Preview local Markdown files with live reload
- Render Markdown into WeChat-friendly HTML
- Support code blocks, Mermaid, task lists, and Base64 image conversion
- Switch between built-in article themes in the preview UI
- Run locally without relying on a remote service

## Screenshots

| Desktop Preview | Compact Preview |
| --- | --- |
| ![Desktop preview](./docs/images/preview-home.png) | ![Compact preview](./docs/images/preview-mobile.png) |

The screenshots above are generated from a bilingual demo file in this repository and reflect the current preview UI.

## Get Started in 3 Steps

### 1. Prepare a Markdown File

Any `.md` file works, for example:

```md
# Hello / 你好

This is an English paragraph.

这是中文段落。

- Supports English
- 支持中文
```

### 2. Start Preview

```bash
markdown-go ./your-article.md
```

You will get a local preview page, and saving the file will refresh it automatically.

### 3. Switch Theme and Copy

In the browser:

- Click the theme button in the top right to switch styles
- Click `Copy`
- Paste directly into the WeChat Official Account editor

## Chinese / English Support

- Supports Chinese, English, and mixed-language Markdown
- Chinese headings, English paragraphs, code blocks, and Mermaid diagrams render correctly
- The current UI text is mostly Chinese, but the renderer works well for both Chinese and English content

## Common Commands

Preview a local file:

```bash
markdown-go ./example.md
```

Preview a Markdown string directly:

```bash
markdown-go "# Hello\n\nThis is a preview." --is-string
```

Install the bundled skill into AI coding tools:

```bash
markdown-go install-skill
```

Common variants:

```bash
markdown-go install-skill --tool codex
markdown-go install-skill --tool all
markdown-go install-skill --tool cursor --force
markdown-go install-skill --tool codex --dry-run
```

## Local Development

Install dependencies and build:

```bash
npm install
```

Common verification commands:

```bash
npm run typecheck
npm run verify:install
npm run verify:skill-install
```

Package the CLI:

```bash
npm run pack:cli
```

## Repository Notes

- This is a workspace repository, and the main CLI lives in `packages/markdown-go-cli`
- `npm install` runs the local build automatically, so the CLI is ready right after dependencies finish installing

## License

[MIT](./LICENSE)
