# markdown-go

[中文说明](./README.md)

`markdown-go` is a local Markdown preview and publishing workflow CLI, designed for fast WeChat article formatting and paste-ready HTML output, with 10+ polished handcrafted themes built in.

## 30-Second Quick Start

Requirements:

- Node.js 18+
- npm 9+

If you do not have npm yet:

- Windows: install Node.js LTS, which includes npm. Recommended command: `winget install OpenJS.NodeJS.LTS`
- macOS: the simplest option is `brew install node`
- Verify the setup with `node -v` and `npm -v`

One-click install:

Windows users do not need to clone the repo first. Run this in PowerShell:

```powershell
$installer = Join-Path $env:TEMP "markdown-go-install.ps1"
Invoke-WebRequest "https://raw.githubusercontent.com/zacktian89/markdown-go/main/install.ps1" -OutFile $installer
& powershell -NoProfile -ExecutionPolicy Bypass -File $installer
```

macOS users can also install directly without cloning:

```bash
curl -fsSL https://raw.githubusercontent.com/zacktian89/markdown-go/main/install.sh | bash
```

These scripts install Node.js LTS first when Node.js / npm are missing, then install `markdown-go` globally and run `markdown-go install-skill` by default.

If you already cloned the repository, you can still use the local helper files in the repo root: `install.cmd`, `install.ps1`, `install.sh`, or `install.command`.

Manual install:

```bash
npm install -g @zacktian/markdown-go
```

Recommended: install the bundled skill so supported AI coding tools can discover and invoke `markdown-go` automatically:

```bash
markdown-go install-skill
```

Useful for:

- Reusing the same Markdown preview and WeChat formatting workflow inside tools like Codex, Claude Code, and Cursor
- Letting AI automatically call `markdown-go` for Markdown preview, formatting, and publishing-related tasks

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
- Switch between 10+ polished handcrafted article themes in the preview UI
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

If you have installed the skill, you can also ask AI to start the preview for you, for example:

- In a skill-enabled AI coding tool, say `Preview ./your-article.md` or `Preview this Markdown with a WeChat-friendly layout`
- The AI can use the installed skill to invoke `markdown-go` automatically and start the local preview workflow

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
- The repository root now includes `install.ps1`, `install.cmd`, `install.sh`, and `install.command`
- Users can also install without cloning by downloading the scripts directly from GitHub Raw

## License

[MIT](./LICENSE)
