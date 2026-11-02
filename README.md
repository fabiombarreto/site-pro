# site-pro

A personal website for the developer community, presented as **a program running inside an IDE**. Commands are typed into a terminal, and each section of the site is rendered as that program's output in a text-UI (TUI) style. Everything stays a regular, clickable website.

```
❯ startSite();
[21:04:31] info   Initializing application...
[21:04:32] info   Rendering Hero Section...
✔ Hero Section created. (1.21s)

❯ █
```

> **Status:** planning. There is no code yet: documentation and design come first.

## Documentation

Everything about the project lives in [`docs/`](docs/README.md): concept, experience, design system, animations, content, architecture, roadmap and tools.

## Stack

- [Astro](https://astro.build/) + [React](https://react.dev/) + TypeScript
- Static, presentation-only site: no login, no backend, no API
- pnpm · ESLint · Prettier · Vitest · Playwright
- Design in Claude Design

## Hosting

[Cloudflare Pages](https://pages.cloudflare.com/), with a preview deployment for every pull request.

## License

The source code is released under the [MIT License](LICENSE).

Personal content is **not** covered by that license: the text about the site owner, photos, project images and other personal assets are © fabiombarreto, all rights reserved.
