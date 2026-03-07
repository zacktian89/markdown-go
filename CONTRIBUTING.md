# Contributing

## Development Environment

- Node.js 18+ recommended
- npm workspaces
- Windows, macOS, and Linux should all work for local preview

## Setup

```bash
npm install
npm run typecheck
```

`npm install` includes the initial workspace build, so a separate first-run `npm run build` is no longer required.

## Validation Before Opening a PR

Run these commands before submitting changes:

```bash
npm run typecheck
npm run build
npm run pack:cli
```

For release validation, use:

```bash
npm run release:check
```

Check that:

- branding remains `markdown-go` in user-visible CLI and web text
- preview still opens and renders Markdown correctly
- copied HTML still works in a WeChat article workflow

## Scope Guidance

- Keep internal `wechat` rendering modules unless a refactor is necessary.
- Prefer small, reviewable changes over broad rewrites.
- Do not commit generated `dist/` output or local tarballs.

## Pull Requests

- Describe the user-visible change.
- Include validation steps and results.
- Call out any packaging or release impact.
