# site-pro

A personal website for the developer community that **builds itself in front of the visitor**. A typed command opens an application window, the window types its own commands, and each command creates one element of the section, live. When a section is done, its window steps aside and leaves a modern, readable page behind.

```
❯ renderProjects();                           ← typed in the command dock
┌─ ● ● ●  projects.tsx ────────────── 3/5 ─┐  ← a build window opens
│ ❯ projects.card("ai-track-record")█      │  ← the window types its own commands
├──────────────────────────────────────────┤
│ Selected work                            │
│ ┌─────────────────┐ ┏━ card ━━━━━━━━━━┓  │
│ │ relay           │ ┃░░░░░░░░░░░░░░░░░┃  │  ← each command creates one element
│ └─────────────────┘ ┗━━━━━━━━━━━━━━━━━┛  │
└──────────────────────────────────────────┘
✔ Projects Section created. (2.31s)           ← the window fades; the section stays
```

> **Status:** Stage 2 (foundation) merged: the static, accessible page, project pages, 404 and CI. The live build layer comes in Stage 3.

## Documentation

Everything about the project lives in [`docs/`](docs/README.md): concept, experience, design system, animations, content, architecture, roadmap and tools.

## Stack

- [Astro](https://astro.build/) + [React](https://react.dev/) + TypeScript
- Static, presentation-only site: no login, no backend, no API
- pnpm · ESLint · Prettier · Vitest · Playwright
- Design in Claude Design

## Hosting

[Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) (static assets), deployed by Workers Builds with a preview deployment for every pull request.

## License

The source code is released under the [MIT License](LICENSE).

Personal content is **not** covered by that license: the text about the site owner, photos, project images and other personal assets are © fabiombarreto, all rights reserved.
