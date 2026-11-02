# 06 · Architecture

> Stack decided (D2): **Astro + React + TypeScript**. The rest of this document is a proposal for approval; nothing has been implemented.

## Scope

A **static, presentation-only** website: no login, no accounts, no backend, no API, no forms that post to a server. Contact happens through links and a copyable email. The only external call is optional and happens at **build time** (fetching GitHub star counts).

## Non-functional requirements

| Requirement | Target |
|---|---|
| Rendering | Static site generation (SSG): all content in the HTML produced at build time |
| Progressive enhancement | Without JS, the site renders complete and static. Animation is an extra layer |
| Performance | Lighthouse ≥ 95 · LCP ≤ 2.5 s · CLS ≈ 0 · INP ≤ 200 ms |
| Critical JavaScript | ≤ 20 KB gzip before the hero animation starts (inline head script + runtime) |
| Total JavaScript | ≤ 90 KB gzip after idle, including React and the hydrated islands |
| Accessibility | WCAG 2.2 AA |
| Content | Editable as Markdown/JSON in the repository, validated at build time |
| Browsers | Last two versions of Chrome, Edge, Firefox and Safari (desktop and mobile) |
| Language | English only, for now (D1). Interface copy centralized in one file, so another language could be added later |

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** (latest stable version when implementation starts) | Static HTML with zero JS by default, *islands* for the interactive parts and *Content Collections* for content. It fits "content in the HTML, animation on top" perfectly. |
| UI components | **React** via `@astrojs/react` | Components for the IDE chrome and the interactive pieces, rendered to static HTML at build time and hydrated only where interactivity is needed |
| Language | **TypeScript** (strict mode) | — |
| Styles | **Plain CSS** with custom properties (theme tokens) and component-scoped styles | Themes switch at runtime at no cost; no heavy CSS framework |
| Animation | **Own runtime** in TypeScript, using `requestAnimationFrame`, the Web Animations API and `IntersectionObserver` | The core effect (typing, logs, frames) is simple and very specific. It is imperative by nature, so it lives outside React's render cycle |
| Shared state | **nanostores** (+ `@nanostores/react`) | The approach Astro recommends for sharing state between islands. The runtime writes; islands read |
| Content | Astro Content Collections, with schemas validating the fields from [05](05-content.md) | A content mistake breaks the build, not the site |
| Syntax highlighting | Shiki (built into Astro) for static snippets; a minimal tokenizer of our own for typed commands | — |
| Images | Astro image optimization (AVIF/WebP, responsive sizes) | — |
| ASCII art | Build scripts: **figlet** for the banner and an image → ASCII converter (resizes and maps each pixel's brightness to `@%#*+=-:. `) | Generated once at build time, at no cost in the browser |
| Share image (OG) | Generated at build time (e.g. Satori), in the terminal look | — |

### Why Astro + React

React is a UI library; Astro is a website framework that generates HTML at build time and can render React components inside it. Combining them gives the best of both: the static output and small JS footprint of Astro, and React's component model and ecosystem for the interactive parts.

Compared with a React-only framework such as Next.js, for this site:

| Criterion | Astro + React | Next.js |
|---|---|---|
| Model | Static HTML by default; JS only where requested | React components everywhere. Server Components reduce JS, but the React and Next runtimes always ship to the browser |
| Complete HTML without JS | Yes, effortlessly | Yes, with SSG and Server Components, but it takes care |
| Terminal animation | The imperative runtime works directly on the DOM | Typing character by character through state causes one render per letter; in practice you end up using `ref` and manipulating the DOM "outside" React |
| Shared chrome state | nanostores between islands | Context or a store |
| Navigating without reloading the IDE | View Transitions with `transition:persist` | Persistent layouts |
| Typed Markdown content | Native Content Collections | Needs an extra library |
| Login, API, app features | Not the focus | The natural path, but **out of scope** for this site |

### How React is used

- **Static by default.** React components such as `Explorer`, `StatusBar` and `ProjectCard` are rendered to HTML at build time without a client directive, so they ship no JS.
- **Hydrated islands only where needed.** Command Palette (`client:idle`), theme and speed menus, the mobile Explorer drawer and, in v1.1, the interactive terminal (`client:visible`).
- **The runtime stays outside React.** It manipulates the DOM directly and publishes its state (current block, progress, status) to nanostores. Hydrated islands subscribe to that state; static parts of the chrome react through `data-*` attributes and CSS.
- **React stays off the critical path.** The hero animation never waits for React to load.

## Overview

```
 BUILD (locally or in CI)
 ────────────────────────
 content/*.md, *.json ──► validation (schemas) ──┐
 images ──► optimization + ASCII version ────────┼──► Astro (SSG) ──► complete HTML, already in its final state
 name ──► figlet (ASCII banner) ─────────────────┘                    + each block's script (data-* attributes)
                                                                      + theme CSS, fonts, images

 BROWSER
 ───────
 1. An inline script in <head> picks the mode BEFORE the first paint:
      no JS                  → nothing runs; the site is already complete
      reduced motion         → instant mode
      speed set to ∞         → instant mode
      otherwise              → marks blocks as "pending" (hidden)
 2. The runtime (a small deferred module) wires the triggers and runs blocks as the visitor scrolls.
 3. React islands (Command Palette, menus, interactive terminal) hydrate later, off the critical path.
```

The key idea: **the server delivers the final result, and the browser "rewinds" it to perform it.** SEO, accessibility and the no-JS experience come for free, and the inline `<head>` script prevents a flash of content before the animation.

## Folder structure (proposal)

```
site-pro/
├─ docs/                      ← this documentation
├─ public/                    ← fonts, favicons, robots.txt
├─ scripts/                   ← build: figlet, image → ASCII, OG images
├─ tests/                     ← Playwright E2E, visual and accessibility tests
└─ src/
   ├─ content/                ← profile, projects/, stack.json
   ├─ components/
   │  ├─ ide/                 ← React: TitleBar, ActivityBar, Explorer, TabBar, StatusBar, CommandPalette
   │  ├─ console/             ← PromptLine, LogLine, Cursor, Block, BuildSummary
   │  └─ tui/                 ← TuiFrame, AsciiBanner, AsciiImage, ProjectCard, TreeView…
   ├─ sections/               ← Astro: Hero, About, Projects, Stack, Contact
   ├─ runtime/                ← scheduler, effects, triggers, controls (framework-agnostic TS)
   ├─ stores/                 ← nanostores shared by the runtime and the islands
   ├─ styles/                 ← tokens.css, themes/, base.css
   ├─ strings.ts              ← interface copy, centralized
   └─ pages/                  ← index, projects/[slug], 404
```

## The runtime (design)

| Piece | Responsibility |
|---|---|
| **Program** | Ordered list of blocks, read from the HTML's `data-*` attributes |
| **Block** | A section's steps (`type`, `log`, `render`, `done`) and its lifecycle state |
| **Scheduler** | A single queue, one block at a time, with a speed multiplier (1×, 2×, ∞, turbo) |
| **Effects** | Registry of the effects in [04](04-animations.md#effects-catalog). Each effect knows how to run and how to finish instantly (for skip) |
| **Triggers** | `IntersectionObserver` on the waiting prompts |
| **Controls** | Skip, run all, speed, replay, deep link |
| **Persistence** | `localStorage` for the visitor's speed and theme. Nothing else is remembered: every visit plays the full animation (D6) |
| **State** | Publishes `currentBlock`, `progress` and `status` to nanostores, and mirrors them as `data-*` attributes for the static chrome |

## Responsive TUI frames

Character borders need to adapt to any width. Proposal:

- Frames are **drawn with CSS**: pseudo-elements with long runs of `─` and `│` clipped by `overflow`, plus positioned `┌┐└┘` corners. They fit any width without JS.
- Border characters are **decorative** (`aria-hidden`). The content inside is regular semantic HTML.
- The inner width is rounded to a whole number of `ch`, so everything lands on the character grid.
- Fallback, if CSS does not align well in some browser: compute the columns with JS and generate the border. This will be validated in the design prototype.

## Accessibility

- Semantic HTML: `<header>`, `<nav>` (Explorer), `<main>` (console), `<footer>` (status bar); one `<h1>` (the name) and one `<h2>` per section.
- ASCII banner, ASCII images, frames, spinners and decorative logs use `aria-hidden="true"`, always with a real text equivalent.
- Typing is **not** announced letter by letter. Screen readers get the final content.
- A "Skip to content" link and a logical focus order.
- Visible focus everywhere (the same look as card hover).
- `prefers-reduced-motion` is respected, and the speed control is always available.
- AA contrast in every theme (see [03 · Color tokens](03-design-system.md#color-tokens)).
- The Command Palette follows the accessible *combobox* pattern.

## SEO and sharing

- Complete HTML at build time, with all content indexable without JS.
- Per-page `title` and `description`, canonical URL and `<html lang="en">`.
- JSON-LD structured data: `Person` on the home page and `CreativeWork`/`SoftwareSourceCode` for projects.
- A per-page OG image, generated at build time in the terminal look.
- `sitemap.xml` and `robots.txt`.

## Performance

| Item | Budget / strategy |
|---|---|
| Critical JS | ≤ 20 KB gzip (inline head script + runtime) |
| Total JS | ≤ 90 KB gzip after idle (React + islands), loaded off the critical path |
| CSS | ≤ 25 KB gzip |
| Fonts | JetBrains Mono as WOFF2, Latin subset, 2–3 files, regular weight preloaded |
| Images | Responsive AVIF/WebP; lazy-loaded except the hero photo |
| LCP | The hero photo and name have priority. The hero boot is designed for ≤ 1.8 s ([04](04-animations.md#boot-timeline-hero)) |
| CLS | ≈ 0, thanks to each section's reserved space |

## Quality and testing

| Type | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Scheduler, speeds, turbo queue, block states, React components |
| End-to-end | Playwright | Boot, scroll trigger, skip, deep links, reduced motion, no JS, mobile |
| Visual | Playwright screenshots | TUI frame alignment across browsers |
| Accessibility | axe via Playwright | Every page and theme |
| Performance | Lighthouse CI | The targets in the requirements table |

## Deployment and operations

- Static hosting: **Cloudflare Pages** (decision **D9**).
- CI on GitHub Actions: lint → typecheck → tests → build → Lighthouse → deploy. Every pull request gets a preview link.
- Cookieless analytics (open decision **D10**): Cloudflare Web Analytics, Plausible or Umami. Suggested events: Skip usage, Replay, project clicks, palette usage and deepest section reached.
