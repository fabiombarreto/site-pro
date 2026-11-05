# API reference

site-pro has **no HTTP API**: it is a static, presentation-only site with no backend (docs/01-concept.md). This file catalogs the public surfaces that do exist: routes, content schemas and (planned) runtime controls.

## Routes

| Route | Content |
|---|---|
| `/` | The one-page site: Hero, About, Projects, Stack, Contact |
| `/#about`, `/#projects`, `/#stack`, `/#contact` | Deep links: build everything before the target in turbo, then scroll |
| `/projects/<slug>` | Project page (D5) |
| any unknown path | 404 with the `ENOENT` build window |

## Content schemas

Defined in docs/05-content.md and validated at build time with Astro Content Collections.

| Collection | Shape |
|---|---|
| `profile` | `name`, `headline`, `role`, `subtitle`, `photo`, `location?`, `bio`, `links[]`, `cv?` |
| `projects` | `slug`, `title`, `summary`, `cover`, `tags[]`, `links{repo?, demo?, article?}`, `year`, `featured`, `order`, `status`, `githubRepo?`, Markdown body |
| `stack` | `groups[].items[]` |

## Visitor controls (runtime surface)

| Control | Input |
|---|---|
| Skip current section | `Esc`, `» Skip`, click on a window's title or command bar |
| Run all | `Shift + Esc`, palette |
| Speed `1× / 2× / ∞` | Dock, palette; saved in the browser |
| Replay | Dock (done), footer, palette |
| Play build | Dock, reduced motion only |
| Command Palette | `Ctrl/⌘ + K`, nav `⌘K`, collapsed dock |
| Shortcut list | `?` |

The runtime's internal TypeScript API (program, scheduler, effects registry, stores) is designed in docs/06-architecture.md and documented here once Stage 3 implements it.
