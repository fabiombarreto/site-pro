# Architecture

State on 2026-11-06: Stage 2 (foundation) is merged: the Astro project, the static page, tokens, fonts, content collections and CI exist (PR #1). Stage 3 Phase 1 adds the runtime core (compiler, scheduler, triggers, stores, `nanostores` dependency); Phase 2 adds the build layer (overlay components and `layer.ts`); Phase 3 adds the element effects and the base scripts; Phase 4 adds the controls and speed persistence. The stack comes from the approved documents (06, 07, 08) and the Claude Design artifacts; items that only exist as a plan are marked *(planned)*.

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
| `scripts/` | Build scripts (photo → ASCII, OG images), `check-budgets.mjs`, `verify-build-targets.mjs` (run from `astro.config.mjs` after `astro build`; fails the build if a `data-build` step names a `data-build-target` missing from the page) and the relay worktree bootstrap scripts |
| `tests/` | Playwright E2E, visual and accessibility tests |
| `src/content/` | profile, projects/, stack.json |
| `src/components/page/` | React page components (NavBar, Button, ProjectCard, StackGroup, Footer, CommandPalette…). `Footer` has an opt-in `buildSlot` prop that renders an empty reserved line (`data-footer-build`) for the build summary; `index.astro` enables it; the slot takes the free width of the footer row, so filling it moves nothing |
| `src/components/build/` | Build-layer components as TypeScript DOM factories, not React (BootTerminal, CommandDock, CommandLine, BuildWindow, SelectionBox, Skeleton, AgentCursor for v1.1). Stage 3 Phase 2 built `dom.ts`, `tokenize.ts`, `Cursor`, `LogLine`, `CommandLine`, `BootTerminal`, `CommandDock`, `BuildWindow` and `PendingOutline`; Phase 4 adds `FooterBuild` (fills the reserved footer slot); Phase 3 adds `SelectionBox`, `Skeleton` and `TextOverlay` (the selection box with handles and label, the skeleton blocks, and the caret and scramble glyphs). Styled by `src/styles/build-layer.css` |
| `src/sections/` | Astro sections (Hero, About, Projects, Stack, Contact), each with its build script (`<section>.build.ts`, a step list compiled at build time and serialized into the section's `data-build` attribute; steps name `data-build-target` elements, wrapped in `.sp-build-wrap` where needed); `pacing.ts` (`pacedSteps` turns prototype v2 start offsets into step `gap`/`overlap` values and a final settle); the five base scripts use prototype v2's commands and pacing; `profile-links.ts` resolves the GitHub and LinkedIn URLs from the profile entry. Stage 2 Phase 5 composes them in `src/pages/index.astro` with `src/styles/home.css` |
| `src/scripts/` | Small client modules loaded from `Base.astro`: `theme-toggle`, and `nav.ts` (toggles `is-scrolled` on `.sp-nav` and closes the mobile menu popover when one of its links is clicked). `build-mode.ts` holds `SPEED_STORAGE_KEY` (`sp-speed`), `WATCHDOG_MS`, `parseSpeed` and `resolveMode`; the inline head script in `Base.astro` (rendered only when the page passes `build`) mirrors the two helpers |
| `src/runtime/` | Stage 3 Phase 1 (runtime core): `types.ts` (effects, section states, `BuildScript`, `Timeline`), `compiler.ts` (`compileScript` turns a section's step list into an absolute millisecond timeline; `serializeTimeline`), `clock.ts` (real and manual clocks), `scheduler.ts` (section queue, turbo, speed, hidden-tab handling), `triggers.ts` (`IntersectionObserver` per section) and `main.ts` (entry loaded by `index.astro`; reflects state on `<html>` data attributes and reveals the page if anything throws). Phase 2 adds `layer.ts` (the overlay: boot terminal, dock, build windows, pending outlines, driven by scheduler state) and `layer-timing.ts` (overlay timing and easing). Windows are placed by writing `left`/`top`/`width`/`height` on the absolutely positioned overlay, on placement and resize only, never per frame (a transformed window root would break the sticky bars); per-frame animation stays `transform`/`opacity` only. Phase 3 adds the effects registry: `effect-timing.ts` (pure, DOM-free: effect durations, seeded randomness, the phase of every effect as a function of the step's local time, the dock typing schedule, `truncateCall` that cuts window commands to 29 characters with `…`), `effect-dom.ts` (measurement plus the only writes an effect may make on a page element: the `data-build-fx` attribute and inline `opacity`/`clip-path`) and `effects.ts` (`createEffects`, runners for `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger` and `build-card`, driven by scheduler state and ticks). Effects reveal the real page elements in place with `clip-path` and `opacity`; the caret, scramble glyphs, selection boxes and skeletons live only in the overlay. `pop` and `stagger` use an inset `clip-path` with overshoot plus opacity, not a scale, because a transform on a page element would change measured boxes. `EFFECT_DURATION_MS` moved from `compiler.ts` to `effect-timing.ts` (re-exported). Phase 4 adds `controls-timing.ts` (pure idle constants, speed cycle, key mapping), `keys.ts`, `focus-rule.ts`, `resize.ts`, `api.ts` (the `Controls` object and store re-exports for Stage 5) and the scheduler's `skip`/`runAll`/`finishThrough`/`onQueue`; `main.ts` becomes a rebuildable show |
| `src/stores/` | nanostores shared by the runtime and the islands; `build.ts` holds `currentSection`, `progress`, `status`, `speed` and `queue` atoms |
| `src/styles/` | tokens.css, themes, base.css; `build-pending.css` hides not-yet-built sections (`opacity: 0`) only while `<html data-build-mode="pending">`; `build-layer.css` styles the build layer (overlay only, including the `sp-build-fx` effects layer); a second rule hides elements marked `data-build-fx="hidden"` (`opacity: 0`, no pointer events) while pending, and sections in `building` or `closing` are no longer hidden as a whole; its roots (`.sp-build-layer`, `.sp-build-fx`) clip horizontal overflow with `overflow-x: clip` (vertical stays visible, and `clip` does not create a scroll container) so no overlay piece can widen the document |
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
- The prototype v2 drives the Design System components from a per-section timeline in milliseconds. Stage 3 keeps that model: each section's script is written as a sequence of steps and compiled at build time into an absolute timeline (Stage 3 PRD, 2026-11-08).

## External services

GitHub (links; optional build-time star counts), LinkedIn (links), Cloudflare Workers Static Assets (hosting), analytics still open (D10). Details: docs/context/integrations.md.
