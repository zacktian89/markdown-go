# markdown-go

`markdown-go` is a local Markdown preview and WeChat article paste workflow CLI.

## Install

```bash
npm install -g @zacktian/markdown-go
```

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
