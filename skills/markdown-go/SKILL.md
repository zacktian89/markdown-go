---
name: markdown-go
description: Use this skill when the user asks to preview, publish, format, or typeset Markdown for WeChat Official Accounts or other rich-text platforms. Always install or verify the global markdown-go CLI first, then invoke the CLI instead of repo-local scripts.
---

# markdown-go

Use this skill for Markdown `预览`, `发布`, `格式化`, and `排版` workflows, especially for WeChat Official Accounts.

## Required workflow

Always use the published CLI. Do not call repository-local source files, `tsx`, or `.agent/skills/...` paths.

1. Check the installed CLI version with `markdown-go --version`.
2. If the command is missing, or the installed major version is not `1`, install the compatible release with `npm install -g markdown-go@^1`.
3. After the CLI is available, invoke it directly.

## CLI usage

For a Markdown file:

```bash
markdown-go "article.md"
```

For generated Markdown content held in memory:

```bash
markdown-go "# Title\n\nHello WeChat!" --is-string
```

## Notes

- The CLI opens a local browser preview and watches Markdown file changes when a file path is used.
- The CLI is the only supported public interface. Do not use `scripts/convert.ts`, `npm run dev`, or `npx tsx`.
- Keep the skill thin: installation check plus CLI invocation.
