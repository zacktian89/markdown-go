# markdown-go

`markdown-go` is a local Markdown preview and WeChat article paste workflow CLI.

## Install

```bash
npm install -g @zacktian/markdown-go
```

## Install Skill

Install the packaged `markdown-go` skill into supported AI coding tools:

```bash
markdown-go install-skill
```

You can target a specific tool or preview the result without writing files:

```bash
markdown-go install-skill --tool codex
markdown-go install-skill --tool all --dry-run
```

The installer currently supports Codex, Claude Code, Cursor, and Antigravity-compatible skill directories.

## Usage

Preview a Markdown file:

```bash
markdown-go ./example.md
```

Preview a Markdown string directly:

```bash
markdown-go "# Hello\n\nThis is a preview." --is-string
```

The CLI starts a local preview server and opens a browser window. From the preview UI, you can switch themes and copy rendered HTML for WeChat paste.

## Requirements

- Node.js 18+

## Repository

- Homepage: https://github.com/zacktian89/markdown-go#readme
- Issues: https://github.com/zacktian89/markdown-go/issues

## License

MIT
