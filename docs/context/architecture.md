# Architecture

State on 2026-11-06: Stage 2 (foundation) is merged: the Astro project, the static page, tokens, fonts, content collections and CI exist (PR #1). The build runtime, build-layer components and stores are not built yet (Stage 3). The stack comes from the approved documents (06, 07, 08) and the Claude Design artifacts; items that only exist as a plan are marked *(planned)*.

## Stack (decided)

| Layer | Choice | Source |
|---|---|---|
| Framework | Astro, latest stable when Stage 2 starts *(planned)* | D2, docs/06-architecture.md |
| UI components | React via `@astrojs/react`, rendered to static HTML; only a few islands hydrate | docs/06-architecture.md |
| Language | TypeScript, strict mode | D2 |
| Styles | Plain CSS with custom properties (theme tokens) and component-scoped styles; no CSS framework | docs/06-architecture.md |
| Animation | Own framework-agnostic TypeScript runtime: `requestAnimationFrame`, Web Animations API, `IntersectionObserver`, `ResizeObserver` | docs/04-animations.md, docs/06-architecture.md |
| Shared state | nanostores (+ `@nanostores/react`) between the runtime and the islands | docs/06-architecture.md |
| Content | Astro Content Collections with schemas (Markdown/JSON in the repository) | docs/05-content.md |
| Package manager | pnpm | docs/08-tools.md |
| Quality | ESLint (flat config), Prettier, Vitest, Playwright (E2E, visual, axe), Lighthouse CI, `astro check` | docs/08-tools.md |
| Hosting | Cloudflare Workers Static Assets, deployed by Workers Builds with a preview per pull request (amended 2026-11-05) | D9 |
| CI | GitHub Actions: lint → typecheck → tests → build → Lighthouse; deploy by Workers Builds *(planned)* | docs/06-architecture.md |
| Fonts | Geist (page) and JetBrains Mono (build layer), self-hosted | D18 |

## Architectural pattern

Static site generation with progressive enhancement:

1. Astro renders the **final page** to complete HTML at build time (SEO, no-JS and accessibility come for free).
2. An inline `<head>` script picks the mode before the first paint: no JS, reduced motion or `∞` speed render the page as is; otherwise sections are marked pending (invisible, space reserved).
3. The **runtime** (a small deferred module, outside React) "rewinds" the page and builds it section by section as the visitor scrolls: a program of section builds, a scheduler, an effects registry, overlays (boot terminal, dock, build windows), triggers, controls, persistence and a clock (real or deterministic in tests).
4. React islands (Command Palette, theme toggle) hydrate later, off the critical path, and read the runtime's state from nanostores. The mobile menu is a static `popover` that works without JavaScript.

Two visual registers never mix: **the page** (modern, readable) and **the build layer** (dock, windows, selection boxes, skeletons; overlay only, `aria-hidden`, exists only while building).

## Folder structure *(planned, docs/06-architecture.md)*

| Path | Holds |
|---|---|
| `docs/` | Documentation, the source of truth |
| `public/` | Fonts, favicons, robots.txt |
| `scripts/` | Build scripts (photo → ASCII, OG images) and the relay worktree bootstrap scripts |
| `tests/` | Playwright E2E, visual and accessibility tests |
| `src/content/` | profile, projects/, stack.json |
| `src/components/page/` | React page components (NavBar, Button, ProjectCard, StackGroup, Footer, CommandPalette…) |
| `src/components/build/` | Build-layer components (BootTerminal, CommandDock, CommandLine, BuildWindow, SelectionBox, Skeleton, AgentCursor for v1.1) |
| `src/sections/` | Astro sections (Hero, About, Projects, Stack, Contact), each with its build script; `profile-links.ts` resolves the GitHub and LinkedIn URLs from the profile entry. Stage 2 Phase 5 composes them in `src/pages/index.astro` with `src/styles/home.css` |
| `src/scripts/` | Small client modules loaded from `Base.astro`: `theme-toggle`, and `nav.ts` (toggles `is-scrolled` on `.sp-nav` and closes the mobile menu popover when one of its links is clicked) |
| `src/runtime/` | Scheduler, effects, triggers, overlays, controls |
| `src/stores/` | nanostores shared by the runtime and the islands |
| `src/styles/` | tokens.css, themes, base.css |
| `src/strings.ts` | Interface copy, centralized |
| `src/pages/` | index, projects/[slug], 404 |
| `PRPs/` | relay pipeline artifacts (PRDs, plans, reports) |

## Design sources (Claude Design, private)

| Artifact | Role |
|---|---|
| Design System "site-pro v2" — https://claude.ai/artifact/CvbHWjN6GHJoYxCTCmk91o | Tokens (Midnight, Daylight), type, 32 React components (`window.SitePro`), previews, placeholders. Its `components/src/index.tsx` and `bundle.css` are the reference implementation for `src/components/` |
| Screens "site-pro v2 screens" — https://claude.ai/artifact/HL5MJH8mEdhb7JbSd8kDzS | 17 artboards: final page (desktop, tablet, mobile, Daylight, mobile menu), build states, project page, palette, 404 |
| Prototype v2 — https://claude.ai/artifact/ABxEwc9LHKR7cwy3rjQvDj | Approved rhythm: runtime timings, triggers, turbo, skip, speed, replay, palette |

## Technical decisions visible in the docs

- The runtime manipulates the DOM directly instead of re-rendering React per typed character (docs/06-architecture.md, "Why Astro + React").
- The build layer is one overlay; it never moves the page (animate `transform`, `opacity`, `clip-path` only).
- Pending content is hidden with `opacity`/`clip-path`, never `display`/`visibility`, so it stays in the accessibility tree.
- The prototype v2 drives the Design System components from a per-section timeline in milliseconds; Stage 3 is expected to keep that model in the real runtime [INFERRED - VALIDATE].

## External services

GitHub (links; optional build-time star counts), LinkedIn (links), Cloudflare Workers Static Assets (hosting), analytics still open (D10). Details: docs/context/integrations.md.
