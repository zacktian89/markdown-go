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

## Install

Install globally from npm:

```bash
npm install -g markdown-go
```

Then run:

```bash
markdown-go ./example.md
```

For local workspace development:

```bash
npm install
```

`npm install` now performs the local workspace build automatically, so the CLI is ready right after dependencies finish installing.

Quick verification:

```bash
npm run verify:install
```

That command starts the built local CLI directly from the workspace and opens the preview for `README.md`.

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

This repository is being prepared as the initial open source release stream for `markdown-go` and is currently aligned with version `1.0.0`.

## Publish To npm

`markdown-go` is currently available to publish on npm because the package name is not present in the npm registry as of March 7, 2026.

Before the first publish:

```bash
npm login
npm run release:check
npm publish --workspace markdown-go --access public
```

After publishing, users can install it with `npm install -g markdown-go`.

## License

[MIT](./LICENSE)

