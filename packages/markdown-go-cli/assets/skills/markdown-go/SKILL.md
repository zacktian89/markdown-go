---
name: markdown-go
description: Use this skill when the user asks to preview, publish, format, or typeset Markdown for WeChat Official Accounts or other rich-text platforms. Invoke the installed markdown-go CLI command pinned by the installer, instead of repo-local source files.
homepage: https://github.com/zacktian89/markdown-go
metadata: {"openclaw":{"requires":{"bins":["node"]}}}
---

# markdown-go

Use this skill for Markdown `preview`, `publish`, `format`, and `typeset` workflows, especially for WeChat Official Accounts and other rich-text platforms.

## Required workflow

This installed skill already pins the CLI command for the local machine. Always use that command directly:

```bash
{{MARKDOWN_GO_COMMAND}} --version
```

Do not call repository-local source files, `tsx`, or ad-hoc scripts.

## CLI usage

For a Markdown file:

```bash
{{MARKDOWN_GO_COMMAND}} "article.md"
```

For generated Markdown content held in memory:

```bash
{{MARKDOWN_GO_COMMAND}} "# Title\n\nHello WeChat!" --is-string
```

## Notes

- The CLI opens a local browser preview and watches Markdown file changes when a file path is used.
- The published CLI is the only supported public interface.
- If the pinned command stops working after an upgrade, rerun the installer to refresh the skill.
