# Feature: Tokens, themes and fonts (Phase 2 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: cross-cutting patterns (design tokens and themes, base styles, self-hosted fonts); reuse or creation of components (Design System v2 ThemeToggle, Backdrop, Icon); impact on shared UI (base layout, theme script); architectural decisions (island vs progressive-enhancement script for the theme toggle, film grain asset vs generated filter); business rules for visual-design (V1-V4, V10-V13); business rules for build only as an out-of-scope boundary (no build layer in this phase)
- Decisions found:
  - D3: Midnight (dark) by default with accent #2563eb; Daylight available from the nav
  - D18: Geist for the page, JetBrains Mono for small labels and the build layer, both self-hosted
  - D20: one continuous page, one backdrop (glows across section boundaries + grain) behind every section
  - D2: React components render to static HTML; hydrate only where needed; runtime stays outside React
  - Stage 2 PRD approved 2026-11-05: working theme toggle, `localStorage`, inline head script before first paint, Midnight default, no non-functional controls with JavaScript off
  - Stage 2 PRD approved 2026-11-05: methodology is test-after (`tdd: false`) with Vitest and Playwright declared; contrast checking is a test-pair concern
- Applicable anti-patterns:
  - Raw values instead of tokens (every color, radius and shadow outside `src/styles/tokens.css` is a `var(--...)`)
  - Mixing the two registers (no code-flavored styling or dot grid in the page)
  - Hiding pending content with display or visibility (the JS-only toggle control is not content, but nothing in this phase may hide page content)
  - Layout-shifting animations (the Backdrop is absolutely positioned and never animates layout properties)
  - Weakening tests to get a green run (no test files in the Implementer's diff, existing tests untouched)
  - Scope creep into v1 (no runtime, palette, nav, sections or content in this phase)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - Plain CSS with token custom properties, no CSS framework; `src/styles/` holds tokens.css and base.css
  - SSG with complete HTML that works without JS; React page components render to static HTML without a client directive
  - WCAG 2.2 AA in both themes with a 2px solid `--accent` focus ring and 2px offset
  - Fonts self-hosted and preloaded, never loaded from Google at runtime
  - Budgets: CSS <= 25 KB gzip, total JS <= 90 KB gzip, critical JS <= 20 KB gzip
  - Relay artifacts live in `PRPs/`; nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-2-foundation.prd.md` — Implementation Phases row 2: "Tokens, themes and fonts" — Goal: Both themes and the type system available to every component, with no theme flash. — Success signal: AC-4 passes; the contrast test passes in both themes; AC-9 holds for everything added.

## Summary

This phase gives every later component its visual foundation. It ports the Design System v2 tokens into `src/styles/tokens.css` (Midnight default and Daylight, spacing, radius, shadows, fluid type-size tokens), adds `src/styles/base.css` (reset, type-style classes, the 2px `--accent` focus ring, selection color, 68ch measure, `prefers-reduced-motion` and `prefers-reduced-transparency` fallbacks), self-hosts Geist and JetBrains Mono (Latin variable WOFF2 files under `public/fonts/`, declared in `src/styles/fonts.css` and preloaded), adds a `Base.astro` layout whose first head element is an `is:inline` script that sets `data-theme` and `color-scheme` on `<html>` from `localStorage` before first paint, and adds the typed React components `ThemeToggle`, `Backdrop` and a minimal `Icon`. The ThemeToggle is rendered to static HTML and wired by a tiny bundled script (a progressive-enhancement script rather than a `client:idle` island, which keeps `react-dom/client` out of the JS budget); it stays invisible until that script runs, so no non-functional control is ever exposed. The film grain is a generated SVG noise filter inlined in CSS; the decision is recorded in `docs/domain/areas/visual-design.md`. The placeholder home page is moved onto the new layout so the theme behavior is observable.

## User Story

As the owner of site-pro
I want both themes, the type system and the continuous backdrop available as tokens, base styles and a working theme toggle with no flash
So that every Stage 2 component can be built from tokens only and Stage 3 can animate a stable, accessible base.

## Problem Statement

site-pro has a scaffolded project (Phase 1) but no styles: no tokens, no themes, no fonts, no base layout. Until the tokens and the no-flash theme mechanism exist, no component can be built without raw values, neither theme can be tested, and the type system and contrast guarantees (V2, V10, V11) cannot be enforced.

## Solution Statement

Port the approved Design System v2 tokens and component CSS values (the Claude Design reference, with `docs/03-design-system.md` winning any difference) into plain CSS custom properties, self-host the two font families from the repository, and add a base layout that applies the stored theme before first paint. Implement the toggle as static markup plus a small deferred script that also reveals it, so the page needs no hydration and no control is exposed without JavaScript.

## Metadata

| Key | Value |
|-----|-------|
| Type | Enhancement (styles, layout and two page components on the Phase 1 scaffold) |
| Complexity | Medium |
| Systems Affected | `src/styles/`, `src/scripts/`, `src/layouts/`, `src/components/page/`, `src/pages/index.astro`, `public/fonts/`, `package.json`, `pnpm-lock.yaml`, `docs/domain/areas/visual-design.md` |
| Dependencies | Phase 1 (complete); npm registry access for `@fontsource-variable/geist` and `@fontsource-variable/jetbrains-mono` (dev dependencies, used only as the source of the WOFF2 files) |
| Estimated Tasks | 9 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md:178`, `:192-195` |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-2-foundation.prd.md` | 65, 150-161, 192-195 | AC-4, the Architecture Notes (interactivity, tokens and styles, fonts) and the Phase 2 Goal/Scope/Success signal |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/tokens.css` | 2-14 | The token values for both themes, spacing, radius, shadows and the type classes to port (outside the repo; never copy verbatim, port the values) |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/bundle-page.css` | 9-30, 53-58, 118-122, 176-179 | Body and selection base, focus ring, reduced-transparency rules, `sp-icon-btn`, Backdrop glows and SVG grain, reduced motion |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx` | 12-56, 95-102, 227-237 | Icon (sun, moon), ThemeToggle and Backdrop reference implementations to port to typed React |
| P0 | `docs/03-design-system.md` | 104-131, 133-166 | Typography scale (fluid and mobile sizes win over the reference), spacing, radii, shadows and the Backdrop description |
| P1 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md` | 98-139 | Glow positions per breakpoint (`k` = 1, 0.78, 0.6) that Backdrop must express as CSS |
| P1 | `src/pages/index.astro` | 1-21 | The Phase 1 placeholder page Task 7 moves onto the new layout |
| P1 | `src/components/page/SiteMark.tsx` | 1-3 | The existing typed-component shape (`React.JSX.Element` return type) |
| P1 | `docs/domain/areas/visual-design.md` | 30-33 | The film-grain open question Task 8 resolves |
| P1 | `eslint.config.mjs` | 44-46 | `src/**` gets browser globals; the new scripts lint under this config |

## Patterns to Mirror

The repository has one component and one page; the anchors below are those plus the approved Design System reference (read-only, outside the repo) whose values are ported.

```
# SOURCE: src/components/page/SiteMark.tsx:1-3
export function SiteMark(): React.JSX.Element {
  return <h1>Fabio Barreto.</h1>;
}
```
Copied by Tasks 5 (typed named export, explicit `React.JSX.Element` return type) and 7 (SiteMark stays as the page h1).

```
# SOURCE: src/pages/index.astro:1-21
---
// Phase 1 placeholder, replaced by the real home page in Phase 5.
import { SiteMark } from '../components/page/SiteMark';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fabio Barreto</title>
    <meta name="description" content="Personal portfolio of Fabio Barreto, Senior Software Engineer." />
  </head>
  <body>
    <main>
      <SiteMark />
    </main>
  </body>
</html>
```
Copied by Tasks 6 (head contents move into Base.astro) and 7 (page body shape, title and description unchanged).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/tokens.css:2-4
:root, [data-theme="midnight"] { --bg: #141519; --bg-raised: #1d1e24; ... --shadow-card: 0 1px 2px #0000004d, 0 8px 24px #00000040; ... }
[data-theme="daylight"] { --bg: #f6f7f9; --bg-raised: #ffffff; ... --shadow-card: 0 1px 2px #1018280f, 0 8px 24px #10182814; ... }
:root { --space-1: 4px; ... --space-32: 128px; --radius-sm: 6px; ... --container: 1200px; --measure: 68ch; --nav-height: 64px; ... --grain-opacity: 0.05; --font-sans: "Geist", system-ui, ...; --font-mono: "JetBrains Mono", ... }
```
Copied by Task 2 (every token name and value; docs/03 wins on any difference, none found for colors).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/tokens.css:5-14
.banner { font-family: var(--font-sans); font-size: 216px; line-height: 0.92; font-weight: 650; letter-spacing: -0.045em; }
.text-2xl { font-family: var(--font-sans); font-size: 28px; line-height: 1.2; font-weight: 500; letter-spacing: -0.01em; }
.mono-xs { font-family: var(--font-mono); font-size: 12px; line-height: 1.4; font-weight: 500; letter-spacing: normal; }
```
Copied by Task 3 (type-style classes in base.css; sizes move to `--text-*` tokens, fluid and mobile values from docs/03:119-128).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/bundle-page.css:18-30
.sp-btn:focus-visible, .sp-link:focus-visible, ... {
  outline: 2px solid var(--accent); outline-offset: 2px;
}
@media (prefers-reduced-transparency: reduce) {
  ... .sp-nav.is-scrolled { background: var(--bg-raised); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```
Copied by Task 3 (a global `:focus-visible` rule replaces the per-class list; the reduced-transparency rule keeps only the page-register selector).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/bundle-page.css:118-122
.sp-backdrop { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.sp-glow { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(closest-side, var(--glow-1), transparent); }
.sp-glow.is-2 { background: radial-gradient(closest-side, var(--glow-2), transparent); }
.sp-backdrop.has-grain::after { content: ""; position: absolute; inset: 0; opacity: var(--grain-opacity); background-size: 180px 180px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence ... %3C/svg%3E"); }
```
Copied by Task 5 (Backdrop.css; glow size becomes `calc(var(--glow-size) * var(--glow-scale) * 1px)` so the three breakpoints are CSS).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:95-102
function ThemeToggle({ theme = 'midnight', onToggle, className }: any) {
  const next = theme === 'midnight' ? 'Daylight' : 'Midnight';
  return (
    <button type="button" className={cx('sp-icon-btn', className)} onClick={onToggle} aria-label={`Switch to the ${next} theme`} title={`${next} theme`}>
      <Icon name={theme === 'midnight' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
```
Copied by Task 5 (typed, no `onToggle`, both icons rendered and switched by CSS).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:227-237
function Backdrop({ glows = [], grain = true, className, style }: any) {
  return (
    <div className={cx('sp-backdrop', grain && 'has-grain', className)} style={style} aria-hidden="true">
      {glows.map((g: any, i: number) => (
        <span key={i} className={cx('sp-glow', g.tone === 2 && 'is-2')} style={{ left: g.x, top: g.y, width: g.size, height: g.size }} />
      ))}
    </div>
  );
}
```
Copied by Task 5 (typed `Glow` interface; size via custom property).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:110-118
const k = desktop ? 1 : mobile ? 0.6 : 0.78;
const glows = [
  { x: '18%', y: '6%', size: 900 * k, tone: 1 },
  { x: '82%', y: '21%', size: 820 * k, tone: 2 },
  { x: '12%', y: '37%', size: 760 * k, tone: 1 },
  { x: '88%', y: '64%', size: 860 * k, tone: 2 },
  { x: '28%', y: '84%', size: 900 * k, tone: 1 },
];
```
Copied by Task 5 (the default glow list; `k` becomes `--glow-scale` in CSS) and used by Task 7.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `package.json` | UPDATE | Add `@fontsource-variable/geist` and `@fontsource-variable/jetbrains-mono` as devDependencies (source of the font files) |
| `pnpm-lock.yaml` | UPDATE | Lockfile for the two new dev dependencies |
| `public/fonts/geist-latin-wght-normal.woff2` | CREATE | Self-hosted Geist variable font, Latin subset |
| `public/fonts/jetbrains-mono-latin-wght-normal.woff2` | CREATE | Self-hosted JetBrains Mono variable font, Latin subset |
| `public/fonts/geist-OFL.txt` | CREATE | OFL license text for the redistributed Geist file |
| `public/fonts/jetbrains-mono-OFL.txt` | CREATE | OFL license text for the redistributed JetBrains Mono file |
| `src/styles/tokens.css` | CREATE | All Design System v2 tokens for both themes, spacing, radius, shadows, fluid type sizes; the only file allowed to hold color and shadow literals (AC-9) |
| `src/styles/fonts.css` | CREATE | `@font-face` declarations for the two self-hosted families |
| `src/styles/base.css` | CREATE | Reset, type-style classes, focus ring, selection, measure, reduced-motion and reduced-transparency fallbacks, page wrapper |
| `src/scripts/theme.ts` | CREATE | Pure theme helpers (storage key, parse, labels, color-scheme) shared by the layout and the toggle script |
| `src/scripts/theme-toggle.ts` | CREATE | Deferred progressive-enhancement script: syncs the toggle label, toggles and persists the theme, reveals the control |
| `src/components/page/Icon.tsx` | CREATE | Minimal typed inline Lucide icon component (sun, moon) used by ThemeToggle; Phase 4 extends it |
| `src/components/page/ThemeToggle.tsx` | CREATE | Statically rendered theme toggle button with the two accessible names |
| `src/components/page/ThemeToggle.css` | CREATE | `sp-icon-btn` and toggle visibility/icon switching styles, tokens only |
| `src/components/page/Backdrop.tsx` | CREATE | Typed Backdrop component (glows and grain) and the default glow list |
| `src/components/page/Backdrop.css` | CREATE | Backdrop, glow and SVG-noise grain styles with breakpoint glow scaling, tokens only |
| `src/layouts/Base.astro` | CREATE | Base layout: `lang="en"`, `data-theme="midnight"`, inline head theme script first, style imports, font preloads, toggle script |
| `src/pages/index.astro` | UPDATE | Use the base layout and render the Backdrop and ThemeToggle so the theme behavior is observable; keep the `<h1>`, title and description |
| `docs/domain/areas/visual-design.md` | UPDATE | Record the film-grain decision in the open question |

## NOT Building (Scope Limits)

- The NavBar, MobileMenu, skip link, sections, footer, ProjectCard and the other page components — Phases 4 and 5.
- The `⌘K` button, Command Palette, scroll-spy and any runtime or build layer — Stages 3 and 5.
- `src/strings.ts` and the content collections — Phase 3 (the toggle's accessible-name helper lives in `src/scripts/theme.ts` for now and may move to `strings.ts` later).
- The contrast unit test, the token check, the axe matrix and screenshot baselines — test pair and Phase 7; this phase writes no test files and does not touch existing tests.
- The 900x1600 photo placeholder SVG, Photo and Prose components — Phase 4.
- Lighthouse CI and the size-budget script — Phase 7 (this phase only checks its own CSS size).
- Google Fonts links, an icon library, a CSS framework, or hydrating the toggle with `react-dom/client`.
- Anything in v1.1 or post-v1 (Phosphor theme, agent cursors, interactive dock).

## Step-by-Step Tasks

### Task 1: CREATE public/fonts (self-hosted Geist and JetBrains Mono)

**ACTION**: Delivers AC-A7. Run `pnpm add -D @fontsource-variable/geist @fontsource-variable/jetbrains-mono` in the worktree root; this updates `package.json` (two new devDependencies) and `pnpm-lock.yaml` (the lockfile entries for them). List `node_modules/@fontsource-variable/geist/files/` and `node_modules/@fontsource-variable/jetbrains-mono/files/` to find the Latin, normal-style, `wght` variable WOFF2 files (expected names `geist-latin-wght-normal.woff2` and `jetbrains-mono-latin-wght-normal.woff2`; if the names differ, use the Latin `wght` normal file and still save it under the two target names below). Copy them to `public/fonts/geist-latin-wght-normal.woff2` and `public/fonts/jetbrains-mono-latin-wght-normal.woff2`. Copy each package's `LICENSE` file to `public/fonts/geist-OFL.txt` and `public/fonts/jetbrains-mono-OFL.txt`. The packages stay as devDependencies purely as the provenance of these files; nothing imports them. No Google Fonts reference anywhere.
**MIRROR**: No code anchor applies (binary assets); follow the `public/` row of the Folder structure table in `docs/context/architecture.md` ("Fonts, favicons, robots.txt").
**VALIDATE**: `node -e 'const fs=require("fs");for(const f of ["public/fonts/geist-latin-wght-normal.woff2","public/fonts/jetbrains-mono-latin-wght-normal.woff2"]){if(fs.statSync(f).size<10000){console.error("FAIL: "+f+" too small");process.exit(1)}}for(const f of ["public/fonts/geist-OFL.txt","public/fonts/jetbrains-mono-OFL.txt"]){if(fs.statSync(f).size<100){console.error("FAIL: "+f+" too small");process.exit(1)}}' && pnpm install --frozen-lockfile`

### Task 2: CREATE src/styles/tokens.css

**ACTION**: Delivers AC-A3 and AC-A6. Port every token from the reference `tokens.css` lines 2-4 into `src/styles/tokens.css`, formatted one declaration per line (Prettier style, single quotes), in this structure: (a) a block with selector `:root, [data-theme='midnight']` holding every Midnight color/shadow token plus `color-scheme: dark;`; (b) a block with selector `[data-theme='daylight']` holding every Daylight token (the same token names as Midnight) plus `color-scheme: light;`; (c) a `:root` block with `--space-1` to `--space-32`, `--radius-sm|md|lg|full`, `--container`, `--measure`, `--nav-height`, `--dock-height`, `--dock-width`, `--window-bar`, `--grain-opacity`, `--font-sans`, `--font-mono`; (d) type-size tokens in `:root`: `--text-banner: clamp(64px, 15vw, 216px)`, `--text-display: clamp(44px, 7vw, 88px)`, `--text-3xl: clamp(32px, 4.5vw, 48px)`, `--text-2xl: 28px`, `--text-xl: 22px`, `--text-lg: 19px`, `--text-md: 16px`, `--text-sm: 14px`, `--mono-sm: 13px`, `--mono-xs: 12px`, with an `@media (max-width: 767px)` `:root` override giving `--text-banner: 19vw`, `--text-2xl: 22px`, `--text-xl: 20px`, `--text-lg: 18px`, `--mono-sm: 12px`, `--mono-xs: 11px` (docs/03-design-system.md:119-128 wins over the reference). Include the syntax, log, build-layer and agent tokens (Stage 3 uses them). Do not invent values: every color value comes from the reference, which matches docs/03:33-102. This is the only file in `src/` allowed to contain color or `box-shadow` literals.
**MIRROR**: `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/tokens.css:2-4` and `# SOURCE: .../design-reference/tokens.css:5-14` (type sizes only).
**VALIDATE**: `node -e 'const css=require("fs").readFileSync("src/styles/tokens.css","utf8");const block=(re)=>{const m=css.match(re);if(!m){console.error("FAIL: missing selector "+re);process.exit(1)}const s=css.indexOf("{",m.index);return css.slice(s,css.indexOf("}",s))};const names=(b)=>new Set([...b.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m)=>m[1]));const mid=names(block(/\[data-theme=[\x22\x27]midnight[\x22\x27]\]/));const day=names(block(/\[data-theme=[\x22\x27]daylight[\x22\x27]\]/));const miss=[...mid].filter((n)=>!day.has(n));if(mid.size<40||miss.length){console.error("FAIL: midnight="+mid.size+" missing in daylight: "+miss.join(","));process.exit(1)}for(const t of ["--accent","--glow-1","--glow-2","--grain-opacity","--shadow-card","--text-banner","--font-sans","--font-mono"]){if(!css.includes(t+":")){console.error("FAIL: missing "+t);process.exit(1)}}'`

### Task 3: CREATE src/styles/fonts.css and src/styles/base.css

**ACTION**: Delivers AC-A4, AC-A5 and AC-A7. (1) `src/styles/fonts.css`: two `@font-face` rules. Geist: `font-family: 'Geist'`, `font-style: normal`, `font-weight: 100 900`, `font-display: swap`, `src: url('/fonts/geist-latin-wght-normal.woff2') format('woff2')`. JetBrains Mono: `font-family: 'JetBrains Mono'`, `font-weight: 100 800`, same other properties, `src: url('/fonts/jetbrains-mono-latin-wght-normal.woff2') format('woff2')`. No remote URL. (2) `src/styles/base.css`, reading only tokens: reset (`box-sizing: border-box` on all elements, `margin: 0` on `body`, `button { font: inherit; }`, `img, svg { max-width: 100%; }`); `html { scroll-padding-top: calc(var(--nav-height) + var(--space-4)); }`; `body` with `background: var(--bg)`, `color: var(--fg)`, `font-family: var(--font-sans)`, `font-size: var(--text-md)`, `line-height: 1.65`, `-webkit-font-smoothing: antialiased`; `::selection { background: var(--bg-selection); }`; `:where(p) { max-width: var(--measure); }`; the global focus rule `:focus-visible` with `outline: 2px solid var(--accent);` and `outline-offset: 2px;`; the type-style classes `.banner`, `.display`, `.text-3xl`, `.text-2xl`, `.text-xl`, `.text-lg`, `.text-md`, `.text-sm`, `.mono-sm`, `.mono-xs` using the family, line height, weight (650/650/650/500/600/400/400/500/400/500) and letter spacing from the reference `tokens.css:5-14`, with `font-size` read from the matching `--text-*`/`--mono-*` token; `.sp-icon { flex: none; display: inline-block; vertical-align: middle; }`; `.sp-num { font-variant-numeric: tabular-nums; }`; the page wrapper `.sp-page { position: relative; overflow-x: clip; background: var(--bg); }` and `.sp-page-content { position: relative; z-index: 1; }` (`overflow-x: clip`, never `hidden`, so a later sticky nav keeps working); `@media (prefers-reduced-transparency: reduce)` giving `.sp-nav.is-scrolled` `background: var(--bg-raised)` and `backdrop-filter: none` (consumed in Phases 4 and 5), plus the `@supports not` fallback from the reference; and `@media (prefers-reduced-motion: reduce)` with `*, *::before, *::after { transition: none !important; animation: none !important; }` so no transition or animation runs. No color or shadow literal in either file.
**MIRROR**: `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/tokens.css:5-14` (type classes) and `# SOURCE: .../design-reference/bundle-page.css:18-30` (focus ring and reduced-transparency rules).
**VALIDATE**: `grep -qF 'outline: 2px solid var(--accent);' src/styles/base.css && grep -qF 'outline-offset: 2px;' src/styles/base.css && grep -q 'prefers-reduced-motion: reduce' src/styles/base.css && grep -q 'prefers-reduced-transparency: reduce' src/styles/base.css && grep -q 'font-display: swap' src/styles/fonts.css && grep -qF "/fonts/geist-latin-wght-normal.woff2" src/styles/fonts.css && grep -qF "/fonts/jetbrains-mono-latin-wght-normal.woff2" src/styles/fonts.css && grep -qE 'font-weight: 100 900' src/styles/fonts.css && pnpm exec prettier --check src/styles`

### Task 4: CREATE src/scripts/theme.ts and src/scripts/theme-toggle.ts

**ACTION**: Delivers AC-A1 and AC-A2. (1) `src/scripts/theme.ts`: pure, dependency-free, erasable-syntax TypeScript only (no enums, no imports; Node must be able to import it with type stripping). Exports: `type Theme = 'midnight' | 'daylight'`; `const THEME_STORAGE_KEY = 'sp-theme'`; `const DEFAULT_THEME: Theme = 'midnight'`; `parseTheme(value: unknown): Theme` (returns `'daylight'` only for the string `'daylight'`, otherwise `'midnight'`); `otherTheme(theme: Theme): Theme`; `themeToggleLabel(current: Theme): string` returning `Switch to the Daylight theme` when current is `midnight` and `Switch to the Midnight theme` when current is `daylight`; `colorSchemeFor(theme: Theme): 'dark' | 'light'`. (2) `src/scripts/theme-toggle.ts`: imports from `./theme`; reads the current theme from `document.documentElement.dataset.theme` through `parseTheme`; for every element matching `[data-theme-toggle]` sets `aria-label` and `title` from `themeToggleLabel`; on click toggles to `otherTheme`, sets `data-theme` and `style.colorScheme` on `<html>`, writes the choice to `localStorage` inside `try/catch` (storage may be blocked; the in-page theme still changes), and refreshes the labels; finally sets the attribute `data-js` on `<html>` (this reveals the control, see Task 5). Handles a missing toggle without throwing.
**MIRROR**: `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:95-102` (label wording and next-theme logic).
**VALIDATE**: `node --input-type=module -e 'const m=await import("./src/scripts/theme.ts");const ok=m.THEME_STORAGE_KEY==="sp-theme"&&m.DEFAULT_THEME==="midnight"&&m.parseTheme("daylight")==="daylight"&&m.parseTheme("midnight")==="midnight"&&m.parseTheme("x")==="midnight"&&m.parseTheme(null)==="midnight"&&m.otherTheme("midnight")==="daylight"&&m.otherTheme("daylight")==="midnight"&&m.themeToggleLabel("midnight")==="Switch to the Daylight theme"&&m.themeToggleLabel("daylight")==="Switch to the Midnight theme"&&m.colorSchemeFor("daylight")==="light"&&m.colorSchemeFor("midnight")==="dark";if(!ok){console.error("FAIL: theme helpers");process.exit(1)}' && pnpm exec eslint src/scripts`

### Task 5: CREATE Icon, ThemeToggle and Backdrop components

**ACTION**: Delivers AC-A2 and AC-A8. (1) `src/components/page/Icon.tsx`: named export `Icon` with typed props `{ name: IconName; size?: number; className?: string }`, `IconName = 'sun' | 'moon'`, rendering an inline `<svg>` per the reference (`viewBox="0 0 24 24"`, `aria-hidden="true"`, `focusable="false"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="2"`, round caps and joins, class `sp-icon`) with the Lucide `sun` and `moon` nodes from the reference `LUCIDE` map (no `any`). (2) `src/components/page/ThemeToggle.tsx` + `ThemeToggle.css`: `ThemeToggle({ className? })` renders `<button type="button" data-theme-toggle className="sp-icon-btn sp-theme-toggle ..." aria-label="Switch to the Daylight theme" title="Switch to the Daylight theme">` (the Midnight default) containing the sun icon (class `sp-theme-sun`) and the moon icon (class `sp-theme-moon`); no `onClick`, no client directive. CSS (tokens only): the reference `.sp-icon-btn` rules (bundle-page.css:53-58); `.sp-theme-toggle { visibility: hidden; }` and `html[data-js] .sp-theme-toggle { visibility: visible; }` so the control is neither visible nor in the accessibility tree without JavaScript; `.sp-theme-moon { display: none; }`, and under `html[data-theme='daylight']` `.sp-theme-sun { display: none; }` and `.sp-theme-moon { display: inline-block; }`. The CSS file is imported by the component (`import './ThemeToggle.css';`). (3) `src/components/page/Backdrop.tsx` + `Backdrop.css`: export `interface Glow { x: string; y: string; size: number; tone: 1 | 2 }`, `const DEFAULT_GLOWS: readonly Glow[]` (the five glows of the reference, sizes 900, 820, 760, 860, 900, positions in percent, alternating tones), and `Backdrop({ glows?, grain?, className? })` rendering `<div className="sp-backdrop has-grain" aria-hidden="true">` with one `<span className="sp-glow is-2?">` per glow, positioned with inline `left`/`top` and the size passed as the custom property `--glow-size` (typed with a `CSSProperties` cast). CSS (tokens only): the reference backdrop rules (bundle-page.css:118-122), the grain as the generated SVG-noise `data-uri` background already present in the reference rule (no image file, no color literal), glow `width` and `height` equal to `calc(var(--glow-size) * var(--glow-scale) * 1px)`, `.sp-backdrop { --glow-scale: 1; }` with `@media (max-width: 1023px) { .sp-backdrop { --glow-scale: 0.78; } }` and `@media (max-width: 767px) { .sp-backdrop { --glow-scale: 0.6; } }`. The Backdrop is absolutely positioned, `pointer-events: none`, never animates, and adds no scrollable overflow.
**MIRROR**: `# SOURCE: src/components/page/SiteMark.tsx:1-3` (typed named export with `React.JSX.Element` return type), `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:95-102` (ThemeToggle), `# SOURCE: .../design-reference/components-page.tsx:227-237` (Backdrop), `# SOURCE: .../design-reference/bundle-page.css:118-122` (backdrop CSS) and `# SOURCE: .../design-reference/screens-main-layout.md:110-118` (default glows and `k` scaling).
**VALIDATE**: `pnpm exec eslint src/components/page && pnpm astro check && pnpm exec prettier --check src/components/page`

### Task 6: CREATE src/layouts/Base.astro

**ACTION**: Delivers AC-A1 and AC-A7. Props `{ title: string; description: string }`. Frontmatter imports `'../styles/tokens.css'`, `'../styles/fonts.css'`, `'../styles/base.css'` (in that order) and `THEME_STORAGE_KEY` from `'../scripts/theme'`. Markup: `<html lang="en" data-theme="midnight">`; `<head>` whose FIRST child after the two meta tags (charset, viewport) is `<script is:inline define:vars={{ storageKey: THEME_STORAGE_KEY }}>` containing a self-executing function that sets `theme = 'midnight'`, switches to `'daylight'` only when `localStorage.getItem(storageKey) === 'daylight'` (inside `try/catch`), then runs `document.documentElement.setAttribute('data-theme', theme)` and `document.documentElement.style.colorScheme = theme === 'daylight' ? 'light' : 'dark'`; then the two font preloads written exactly as `<link rel="preload" href="/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />` and `<link rel="preload" href="/fonts/jetbrains-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />` (attribute order `rel` first); then `<title>{title}</title>` and `<meta name="description" content={description} />`. `<body>` holds `<slot />` and, last, a bundled (non-inline) `<script>import '../scripts/theme-toggle';</script>`. No remote font URL and no color literal.
**MIRROR**: `# SOURCE: src/pages/index.astro:1-21` (the head contents, charset, viewport, title and description, move here unchanged in wording).
**VALIDATE**: `pnpm astro check && pnpm exec eslint src/layouts && pnpm exec prettier --check src/layouts`

### Task 7: UPDATE src/pages/index.astro

**ACTION**: Delivers AC-A1, AC-A2 and AC-A8. Replace the standalone document with `<Base title="Fabio Barreto" description="Personal portfolio of Fabio Barreto, Senior Software Engineer.">` (same title and description text as today). Inside it: `<div class="sp-page">` containing `<Backdrop glows={DEFAULT_GLOWS} />` then `<div class="sp-page-content">` with a temporary `<header>` holding `<ThemeToggle />` (Phase 5 replaces it with the real NavBar) and the existing `<main><SiteMark /></main>`. No client directive on any component. Keep the file's Phase 1 comment updated to say the page is a Phase 2 placeholder still replaced in Phase 5. The `<h1>` text "Fabio Barreto." and the single `<main>` stay (existing tests and the PRD AC-1 depend on them).
**MIRROR**: `# SOURCE: src/pages/index.astro:1-21` (page shape, imports of React components in frontmatter).
**VALIDATE**: `pnpm build && grep -qE '<html[^>]*data-theme="midnight"' dist/index.html && grep -q 'aria-label="Switch to the Daylight theme"' dist/index.html && grep -qE '<link[^>]*rel="preload"[^>]*geist-latin-wght-normal\.woff2' dist/index.html && grep -qE '<link[^>]*rel="preload"[^>]*jetbrains-mono-latin-wght-normal\.woff2' dist/index.html && grep -q 'sp-theme' dist/index.html && grep -q 'Fabio Barreto\.' dist/index.html && test -s dist/fonts/geist-latin-wght-normal.woff2 && node -e 'const h=require("fs").readFileSync("dist/index.html","utf8");const s=h.indexOf("localStorage.getItem");const c=[h.indexOf("rel=\"stylesheet\""),h.indexOf("<style")].filter((i)=>i>=0);if(s<0||(c.length&&s>Math.min(...c))){console.error("FAIL: theme script missing or after styles");process.exit(1)}'`

### Task 8: UPDATE docs/domain/areas/visual-design.md

**ACTION**: Documentation task (docs first); delivers no AC-A item, it records the film-grain decision the PRD assigns to this phase. In the "Open Questions" section, replace the film-grain bullet with: `- ~~Whether the film grain is an image asset or a generated SVG noise filter in production [INFERRED - VALIDATE].~~ Answered in Stage 2 Phase 2: a generated SVG noise filter (feTurbulence) inlined as a data URI in the Backdrop styles, so the grain adds no image request and no asset; its opacity comes from --grain-opacity.` Change nothing else in the file.
**MIRROR**: `# SOURCE: docs/domain/areas/visual-design.md:32` is the existing struck-through-and-answered bullet style (the first Open Questions bullet); reuse that style. (Line 32 of the current file; no code snippet applies.)
**VALIDATE**: `grep -qF 'Answered in Stage 2 Phase 2: a generated SVG noise filter' docs/domain/areas/visual-design.md`

### Task 9: Format and run every gate

**ACTION**: Verification task; delivers no AC-A item (it is infrastructure that proves the others). Run `pnpm exec prettier --write src` and fix anything ESLint, `astro check` or the build reports in the files this phase created. Every file written by this phase must be Prettier-clean because `pnpm format:check` runs in CI. Do not create or edit any file under `tests/`, `*.test.*` or `*.spec.*`.
**MIRROR**: `# SOURCE: src/components/page/SiteMark.tsx:1-3` (the code style Prettier and ESLint already accept).
**VALIDATE**: `pnpm exec prettier --write src && pnpm lint && pnpm format:check && pnpm astro check && pnpm test && pnpm build && pnpm test:e2e`

## Validation Commands

Run from the worktree root (`C:/repos/site-pro/.worktrees/stage-2-foundation`) in Git Bash.

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm lint
pnpm format:check
pnpm astro check
```

### Level 2: CONTENT_INVARIANTS

```bash
set -euo pipefail
# Tokens only (AC-9): no color literal and no box-shadow literal outside tokens.css
if grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src --include='*.css' --include='*.astro' --include='*.ts' --include='*.tsx' --exclude=tokens.css; then
  echo "FAIL: color literal outside src/styles/tokens.css"; exit 1
fi
if grep -rn 'box-shadow' src --include='*.css' --include='*.astro' --include='*.ts' --include='*.tsx' --exclude=tokens.css | grep -v 'var(--'; then
  echo "FAIL: box-shadow literal outside src/styles/tokens.css"; exit 1
fi
# No Google Fonts anywhere
if grep -rnIiE 'fonts\.(googleapis|gstatic)' src public; then
  echo "FAIL: remote font host referenced"; exit 1
fi
# Focus ring, motion and transparency fallbacks, fonts
grep -qF 'outline: 2px solid var(--accent);' src/styles/base.css
grep -qF 'outline-offset: 2px;' src/styles/base.css
grep -q 'prefers-reduced-motion: reduce' src/styles/base.css
grep -q 'prefers-reduced-transparency: reduce' src/styles/base.css
grep -q 'font-display: swap' src/styles/fonts.css
# Theme helpers behave (AC-4 labels, default, parsing)
node --input-type=module -e 'const m=await import("./src/scripts/theme.ts");const ok=m.parseTheme("daylight")==="daylight"&&m.parseTheme("x")==="midnight"&&m.themeToggleLabel("midnight")==="Switch to the Daylight theme"&&m.themeToggleLabel("daylight")==="Switch to the Midnight theme";if(!ok){console.error("FAIL: theme helpers");process.exit(1)}'
# Grain decision recorded
grep -qF 'Answered in Stage 2 Phase 2: a generated SVG noise filter' docs/domain/areas/visual-design.md
echo "PASS: content invariants"
```

### Level 3: INTEGRATION (build output and existing suites)

```bash
set -euo pipefail
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm test:e2e
# Built HTML pages only (never vendor JS under dist/_astro)
grep -qE '<html[^>]*lang="en"' dist/index.html
grep -qE '<html[^>]*data-theme="midnight"' dist/index.html
grep -q 'aria-label="Switch to the Daylight theme"' dist/index.html
grep -qE '<link[^>]*rel="preload"[^>]*geist-latin-wght-normal\.woff2' dist/index.html
grep -qE '<link[^>]*rel="preload"[^>]*jetbrains-mono-latin-wght-normal\.woff2' dist/index.html
test -s dist/fonts/geist-latin-wght-normal.woff2
test -s dist/fonts/jetbrains-mono-latin-wght-normal.woff2
grep -rq 'data-js' dist --include='*.css' --include='*.html'
grep -rq 'feTurbulence' dist --include='*.css' --include='*.html'
if grep -rnIiE 'fonts\.(googleapis|gstatic)' dist --include='*.html' --include='*.css'; then
  echo "FAIL: remote font host in build output"; exit 1
fi
# The inline theme script runs before any stylesheet (no flash)
node -e 'const h=require("fs").readFileSync("dist/index.html","utf8");const s=h.indexOf("localStorage.getItem");const c=[h.indexOf("rel=\"stylesheet\""),h.indexOf("<style")].filter((i)=>i>=0);if(s<0||(c.length&&s>Math.min(...c))){console.error("FAIL: theme script missing or after styles");process.exit(1)}'
# CSS budget: <= 25 KB gzip across emitted .css files
node -e 'const fs=require("fs"),z=require("zlib");let n=0;for(const f of fs.readdirSync("dist",{recursive:true}))if(String(f).endsWith(".css"))n+=z.gzipSync(fs.readFileSync("dist/"+f)).length;console.log("css gzip bytes",n);if(n>25*1024){console.error("FAIL: css over budget");process.exit(1)}'
echo "PASS: integration"
```

## Acceptance Criteria

- **AC-A1 (PRD AC-4):** With no stored preference, the built `/` carries `data-theme="midnight"` on `<html>` in the served HTML, an `is:inline` script that runs before any stylesheet sets `data-theme` and `color-scheme` from `localStorage` (`sp-theme`), and after switching to Daylight and reloading `data-theme` is `daylight` at `DOMContentLoaded`, never Midnight first.
- **AC-A2 (PRD AC-4):** The toggle is named "Switch to the Daylight theme" in Midnight and "Switch to the Midnight theme" in Daylight; activating it changes `data-theme` and the name; with JavaScript disabled the page renders in Midnight and no non-functional theme control is exposed (the button is `visibility: hidden` until the deferred script sets `data-js` on `<html>`).
- **AC-A3 (PRD AC-9):** Every color, radius, shadow and type size used outside `src/styles/tokens.css` is a `var(--...)` token; no hex, `rgb()`, `rgba()`, `hsl()` or `box-shadow` literal exists in any `.css`, `.astro`, `.ts` or `.tsx` file under `src/` other than `tokens.css`.
- **AC-A4 (PRD AC-3):** Every focusable element gets a computed 2px solid `--accent` outline with a 2px offset on `:focus-visible` from the global base rule.
- **AC-A5 (PRD AC-12):** With `prefers-reduced-motion: reduce` no CSS transition or animation runs; this phase adds no animation and no transition other than the 150 ms hover color change of the icon button, which the reduced-motion rule disables.
- **AC-A6 (PRD AC-5):** Both themes define the complete token set with the approved values, so every text/background token pair can be checked at >= 4.5:1 by the test pair (including `--fg-muted` over the capped glows); `--fg-subtle` stays decorative.
- **AC-A7 (PRD AC-10):** Geist and JetBrains Mono are served from the site's own `/fonts/` path (Latin variable WOFF2, `font-display: swap`), both are preloaded in the head, no Google font host is referenced, and the emitted CSS stays within 25 KB gzip.
- **AC-A8 (PRD AC-13):** The Backdrop is `aria-hidden`, absolutely positioned inside the clipped page wrapper, never animates and adds no horizontal scroll or layout shift (glow size scales by breakpoint through CSS only).

R8b note: every bullet above carries its `(PRD AC-N)` token because this is PRD mode.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| The Fontsource file names differ from the expected `*-latin-wght-normal.woff2` | M | Task 1 stalls | Task 1 tells the Implementer to list the package `files/` directory and save the Latin `wght` normal file under the two fixed target names; Task 1's VALIDATE checks size, not name of the source |
| Font swap causes a layout shift (CLS) before Phase 7 measures it | M | Misses CLS <= 0.01 later | Both fonts are preloaded with `font-display: swap`; the system fallback stacks come from the tokens; Phase 7 measures CLS and a metric-adjusted fallback face can be added then |
| A glow reduces `--fg-muted` contrast below AA | M | Accessibility failure axe cannot detect | Reference glow tokens and sizes are ported unchanged (capped per docs/03:70); the contrast unit test authored by the test pair covers the worst-case blend |
| The toggle is `visibility: hidden` until the script runs, which could be read as hiding content | L | Anti-pattern misread | It is a JS-only control, not page content; this is the PRD-mandated alternative to exposing a non-functional control (AC-4), and nothing hides page content |
| Node cannot import `theme.ts` for VALIDATE if non-erasable TypeScript syntax is used | L | Validation false failure | Task 4 requires erasable-only syntax and no imports in `theme.ts` |
| Importing `.css` from a React component fails under a later Vitest static-render test | L | Phase 4 tests break | Vite/Vitest process CSS imports; the test pair can configure `css` if needed without changing source |
| Prettier reformats CSS selectors or quotes and a grep for a literal breaks | L | False failure | Greps in this plan use literals that Prettier preserves (`outline: 2px solid var(--accent);`) and quote-agnostic regexes for selectors |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- Decisions made by this plan: (1) fonts are static files in `public/fonts/` with hand-written `@font-face` and preloads, because the Fontsource CSS and Astro Fonts API paths could not be verified offline and `public/` is the documented home for fonts in the folder-structure table; the Fontsource packages are devDependencies only as provenance; (2) the theme toggle is a progressive-enhancement script instead of a `client:idle` island, which keeps `react-dom/client` out of the JS budget (PRD Architecture Notes allow either); (3) the film grain is the generated SVG-noise data URI from the reference, recorded in `docs/domain/areas/visual-design.md`.
- The accessible-name helper `themeToggleLabel` lives in `src/scripts/theme.ts` because `src/strings.ts` is created in Phase 3; the SSR default label in `ThemeToggle.tsx` must equal `themeToggleLabel('midnight')`. Phase 3 or 4 may move the wording to `strings.ts`.
- `.sp-icon-btn` is defined in `ThemeToggle.css` for now; Phase 4 (IconLink) should move it to a shared component stylesheet.
- Grounding note: research subagents were not dispatched for this plan; the Patterns to Mirror anchors come from direct reads of the Phase 1 worktree and the design reference files, with line numbers verified at write time. `phase_type: feature` because the phase adds behavior (theme switching) rather than a type seam.
- Phase 3 (content collections) is independent of this phase and may be planned in parallel; neither touches the other's files.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
