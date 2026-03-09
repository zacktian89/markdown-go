# markdown-go

`markdown-go` is an open source Markdown preview and publishing workflow tool, with first-class support for WeChat article paste and layout.

It has a dual positioning:

- A practical Markdown to WeChat preview/paste tool for public account workflows.
- A broader Markdown publishing workspace that can grow to support more output targets over time.

## Features

- Preview local Markdown files in a browser with live reload.
- Render content into HTML optimized for WeChat article editor paste.
- Support fenced code blocks, Mermaid diagrams, task lists, and inline image conversion.
- Switch between built-in article themes before copying.
- Run as a local CLI without depending on a remote service.
- Install a packaged skill into Codex, Claude Code, Cursor, and Antigravity-compatible skill directories.

## Install

Install globally from npm:

```bash
npm install -g @zacktian/markdown-go
```

Then run:

```bash
markdown-go ./example.md
```

## One-Click Skill Install

After the CLI is available, install the bundled skill with:

```bash
markdown-go install-skill
```

Useful variants:

```bash
markdown-go install-skill --tool codex
markdown-go install-skill --tool all
markdown-go install-skill --tool cursor --force
markdown-go install-skill --tool codex --dry-run
```

Repository bootstrap scripts for external users:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-skill.ps1
```

```bash
bash ./scripts/install-skill.sh
```

The installer will:

- Detect supported tool environments on Windows and macOS.
- Ensure Node.js 18+ and npm are available.
- Ensure the published `@zacktian/markdown-go` CLI is installed globally.
- Copy a pinned `markdown-go` skill into each selected tool's skill directory.

For local workspace development:

```bash
npm install
```

`npm install` now performs the local workspace build automatically, so the CLI is ready right after dependencies finish installing.

Quick verification:

```bash
npm run verify:install
npm run verify:skill-install
```

That second command runs the packaged installer in `--dry-run` mode against a Codex target, which is useful for release checks.

To validate the package tarball locally:

```bash
npm run pack:cli
```

To validate the npm release flow before publishing:

```bash
npm run release:check
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

## Local Development

```bash
npm install
npm run typecheck
npm run verify:install
npm run verify:skill-install
```

## Current Boundaries

- The current public CLI is centered on local preview and WeChat paste workflow.
- Internal rendering APIs are not treated as stable public interfaces yet.
- The web preview is bundled as part of the CLI package and is not documented as a standalone browser API.

## Roadmap

- Improve documentation and first-run onboarding.
- Add CI-backed release hygiene and package validation.
- Expand beyond WeChat-first workflows to additional Markdown publishing targets.
- Introduce issue templates, PR templates, and more contributor automation.

## Release Status

This repository is being prepared as the initial open source release stream for `markdown-go` and is currently aligned with version `1.1.1`.

## Publish To npm

This package is published as `@zacktian/markdown-go` to avoid npm package-name similarity restrictions on the unscoped `markdown-go` name.

Before the first publish:

```bash
npm login
npm run release:check
npm publish --workspace ./packages/markdown-go-cli --access public --registry=https://registry.npmjs.org/
```

After publishing, users can install it with `npm install -g @zacktian/markdown-go`.

## License

[MIT](./LICENSE)

