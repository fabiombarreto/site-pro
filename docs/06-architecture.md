# 06 · Architecture

> Stack decided (D2): **Astro + React + TypeScript**. The rest of this document is a proposal for approval; nothing has been implemented.

## Scope

A **static, presentation-only** website: no login, no accounts, no backend, no API, no forms that post to a server. Contact happens through links (GitHub and LinkedIn); there is no public email. The only external call is optional and happens at **build time** (fetching GitHub star counts).

## Non-functional requirements

| Requirement | Target |
|---|---|
| Rendering | Static site generation (SSG): all content in the HTML produced at build time |
| Progressive enhancement | Without JS, the site renders complete and static. The build animation is an extra layer |
| Performance | Lighthouse ≥ 95 · LCP ≤ 2.5 s · CLS ≈ 0 · INP ≤ 200 ms |
| Critical JavaScript | ≤ 20 KB gzip before the hero build starts (inline head script + runtime) |
| Total JavaScript | ≤ 90 KB gzip after idle, including React and the hydrated islands |
| Accessibility | WCAG 2.2 AA |
| Content | Editable as Markdown/JSON in the repository, validated at build time |
| Browsers | Last two versions of Chrome, Edge, Firefox and Safari (desktop and mobile) |
| Language | English only, for now (D1). Interface copy centralized in one file, so another language could be added later |

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** (latest stable version when implementation starts) | Static HTML with zero JS by default, *islands* for the interactive parts and *Content Collections* for content. It fits "content in the HTML, animation on top" perfectly. |
| UI components | **React** via `@astrojs/react` | Components for the page and the interactive pieces, rendered to static HTML at build time and hydrated only where interactivity is needed |
| Language | **TypeScript** (strict mode) | — |
| Styles | **Plain CSS** with custom properties (theme tokens) and component-scoped styles | Themes switch at runtime at no cost; no heavy CSS framework |
| Animation | **Own runtime** in TypeScript, using `requestAnimationFrame`, the Web Animations API, `IntersectionObserver` and `ResizeObserver` | The build effect (typing, windows, element creation) is very specific and imperative by nature, so it lives outside React's render cycle |
| Shared state | **nanostores** (+ `@nanostores/react`) | The approach Astro recommends for sharing state between islands. The runtime writes; islands read |
| Content | Astro Content Collections, with schemas validating the fields from [05](05-content.md) | A content mistake breaks the build, not the site |
| Syntax highlighting | Shiki (built into Astro) for static snippets; a minimal tokenizer of our own for typed commands | — |
| Images | Astro image optimization (AVIF/WebP, responsive sizes) | — |
| Page transitions | Astro view transitions | The card grows into the project page header |
| ASCII art | A build script that turns the hero photo into ASCII (resizes it and maps each pixel's brightness to `@%#*+=-:. `) for its build effect (D12) | Generated once at build time, at no cost in the browser |
| Share image (OG) | Generated at build time (e.g. Satori), in the site's look | — |

### Why Astro + React

React is a UI library; Astro is a website framework that generates HTML at build time and can render React components inside it. Combining them gives the best of both: the static output and small JS footprint of Astro, and React's component model and ecosystem for the interactive parts.

Compared with a React-only framework such as Next.js, for this site:

| Criterion | Astro + React | Next.js |
|---|---|---|
| Model | Static HTML by default; JS only where requested | React components everywhere. Server Components reduce JS, but the React and Next runtimes always ship to the browser |
| Complete HTML without JS | Yes, effortlessly | Yes, with SSG and Server Components, but it takes care |
| Build animation | The imperative runtime works directly on the DOM | Typing character by character through state causes one render per letter; in practice you end up using `ref` and manipulating the DOM "outside" React |
| Shared state between interactive parts | nanostores between islands | Context or a store |
| Card → project page morph | Built-in view transitions | Possible, with more custom work |
| Typed Markdown content | Native Content Collections | Needs an extra library |
| Login, API, app features | Not the focus | The natural path, but **out of scope** for this site |

### How React is used

- **Static by default.** React components such as `NavBar`, `ProjectCard` and `StackGroup` are rendered to HTML at build time without a client directive, so they ship no JS.
- **Hydrated islands only where needed.** Command Palette (`client:idle`), the theme toggle, the mobile menu and, in v1.1, the interactive dock (`client:visible`).
- **The runtime stays outside React.** It manipulates the DOM directly, draws the build layer and publishes its state (current section, progress, status) to nanostores. Hydrated islands subscribe to that state; static parts of the page react through `data-*` attributes and CSS.
- **React stays off the critical path.** The hero build never waits for React to load.

## Overview

```
 BUILD (locally or in CI)
 ────────────────────────
 content/*.md, *.json ──► validation (schemas) ──┐
 images ──► optimization + ASCII version ────────┴──► Astro (SSG) ──► complete HTML, already in its final state
                                                                      + each section's build script (data-* attributes)
                                                                      + theme CSS, fonts, images

 BROWSER
 ───────
 1. An inline script in <head> picks the mode BEFORE the first paint:
      no JS                  → nothing runs; the site is already complete
      reduced motion         → instant mode
      speed set to ∞         → instant mode
      otherwise              → marks sections as "pending" (invisible, space reserved)
 2. The runtime (a small deferred module) wires the triggers, draws the dock and the windows, and builds sections as the visitor scrolls.
 3. React islands (Command Palette, theme toggle, mobile menu) hydrate later, off the critical path.
```

The key idea: **the server delivers the final result, and the browser "rewinds" it to build it in front of the visitor.** SEO, accessibility and the no-JS experience come for free, and the inline `<head>` script prevents a flash of content before the build.

## Folder structure (proposal)

```
site-pro/
├─ docs/                      ← this documentation
├─ public/                    ← fonts, favicons, robots.txt
├─ scripts/                   ← build: photo → ASCII, OG images
├─ tests/                     ← Playwright E2E, visual and accessibility tests
└─ src/
   ├─ content/                ← profile, projects/, stack.json
   ├─ components/
   │  ├─ page/                ← React: NavBar, Button, Tag, ProjectCard, StackGroup, Footer, CommandPalette…
   │  └─ build/               ← BootTerminal, CommandDock, CommandLine, BuildWindow, SelectionBox, Skeleton, AgentCursor (v1.1)
   ├─ sections/               ← Astro: Hero, About, Projects, Stack, Contact (each with its build script)
   ├─ runtime/                ← scheduler, effects, triggers, overlays, controls (framework-agnostic TS)
   ├─ stores/                 ← nanostores shared by the runtime and the islands
   ├─ styles/                 ← tokens.css, themes/, base.css
   ├─ strings.ts              ← interface copy, centralized
   └─ pages/                  ← index, projects/[slug], 404
```

## The runtime (design)

| Piece | Responsibility |
|---|---|
| **Program** | Ordered list of section builds, read from the HTML's `data-*` attributes |
| **Section build** | A section's dock steps (`type`, `log`), window steps (`call` + `target` + `effect`) and its lifecycle state |
| **Scheduler** | One section at a time, with a speed multiplier (1×, 2×, ∞, turbo). Inside a section, steps run on a timeline and may overlap |
| **Effects** | Registry of the effects in [04](04-animations.md#effects-catalog). Each effect knows how to run and how to finish instantly (for skip) |
| **Overlays** | Draw the boot terminal, the dock and each build window; place windows from the section's box and keep them aligned with `ResizeObserver` |
| **Triggers** | `IntersectionObserver` on each section's top edge; a `focusin` listener for the keyboard focus rule |
| **Controls** | Skip, run all, speed, replay, play build, deep link |
| **Persistence** | `localStorage` for the visitor's speed and theme. Nothing else is remembered: every visit plays the full build (D6) |
| **State** | Publishes `currentSection`, `progress` and `status` to nanostores, and mirrors them as `data-*` attributes for the static page |
| **Clock** | Real time by default; a deterministic clock in tests |

## The build layer

- The dock, the windows, selection boxes, skeletons and agent cursors live in **one overlay layer** above the page, created by the runtime. None of it exists in the static HTML.
- The whole layer is **decorative** (`aria-hidden`). Its controls (Skip, speed, Replay, Play build) are real buttons with labels, reachable by keyboard.
- Window bodies let clicks through (`pointer-events: none`), so elements are usable as soon as they exist. Only the title bar and the command bar catch clicks, to skip.
- Pending content is hidden with `opacity` and `clip-path`, never with `display` or `visibility`, so it stays in the accessibility tree and keeps its layout.

## Accessibility

- Semantic HTML: `<header>` with the `<nav>`, `<main>` with one `<section>` per section, `<footer>`; one `<h1>` (the hero headline, which includes the name) and one `<h2>` per section.
- The build layer is `aria-hidden`; the ASCII photo and skeletons too. Screen readers get the final content.
- Typing is **not** announced letter by letter.
- When keyboard focus enters a section that has not been built, the section is finished instantly.
- A "Skip to content" link and a logical focus order.
- Visible focus everywhere: a 2 px `--accent` ring with a 2 px offset.
- `prefers-reduced-motion` is respected, and the speed control is always available.
- AA contrast in both themes (see [03 · Color tokens](03-design-system.md#color-tokens)).
- The Command Palette follows the accessible *combobox* pattern.

## SEO and sharing

- Complete HTML at build time, with all content indexable without JS.
- Per-page `title` and `description`, canonical URL and `<html lang="en">`.
- JSON-LD structured data: `Person` on the home page and `CreativeWork`/`SoftwareSourceCode` for projects.
- A per-page OG image, generated at build time in the site's look.
- `sitemap.xml` and `robots.txt`.

## Performance

| Item | Budget / strategy |
|---|---|
| Critical JS | ≤ 20 KB gzip (inline head script + runtime) |
| Total JS | ≤ 90 KB gzip after idle (React + islands), loaded off the critical path |
| CSS | ≤ 25 KB gzip |
| Fonts | Geist (D18) as one variable WOFF2 and JetBrains Mono in 1–2 files, Latin subsets, self-hosted; both preloaded, since the boot types in mono and the headline is in sans |
| Images | Responsive AVIF/WebP; lazy-loaded except the hero photo |
| LCP | The hero headline is typed by ~1.7 s and the photo is complete by ~2.4 s ([04](04-animations.md#boot-timeline-hero)); the photo loads with priority |
| CLS | ≈ 0, thanks to reserved space and an overlay-only build layer |
| Blur | Only on build-layer surfaces, the scrolled nav and the palette, and only while they are visible |

## Quality and testing

| Type | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Scheduler, overlapping steps, speeds, turbo queue, section states, React components |
| End-to-end | Playwright | Boot, scroll trigger, skip, run all, deep links, keyboard focus rule, reduced motion, no JS, mobile |
| Visual | Playwright screenshots | The final page in both themes, plus build states captured at fixed moments with the deterministic clock |
| Accessibility | axe via Playwright | Every page and theme |
| Performance | Lighthouse CI | The targets in the requirements table |

## Deployment and operations

- Static hosting: **Cloudflare Pages** (decision **D9**).
- CI on GitHub Actions: lint → typecheck → tests → build → Lighthouse → deploy. Every pull request gets a preview link.
- Cookieless analytics (open decision **D10**): Cloudflare Web Analytics, Plausible or Umami. Suggested events: Skip usage, Replay, project clicks, palette usage and deepest section reached.
