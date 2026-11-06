# Feature: Home page (Phase 5 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: reuse of existing components (the phase-4 page components composed into sections); impact on shared UI (nav, footer, base layout, skip link); cross-cutting patterns (design tokens, centralized interface copy in src/strings.ts, content collections as the only copy source); business rules for navigation (N1, N5, N10, N11, N13), content (C1-C16) and visual-design (V1-V16); architectural rule on static React vs islands (D2); business rules for build only as an out-of-scope boundary (no build layer in this phase)
- Decisions found:
  - D2 Astro + React + TypeScript strict: React page components render to static HTML without a client directive; the plain-TypeScript scripts live outside React
  - D1 English only; interface copy comes from src/strings.ts, page copy from the content collections
  - D18 Geist for the page, JetBrains Mono for small labels (type classes already in base.css)
  - D20 One continuous page: banner hero with the full-body cut-out photo in front of the name, glows across section boundaries
  - D5 Cards link to /projects/<slug> and keep the direct repo shortcut
  - Stage 2 PRD approved 2026-11-05: hero section id `top` labelled "Introduction"; other sections `aria-labelledby` their h2; no `⌘K` button; footer is `Source` + copyright only; mobile menu is a static `popover` with an optional close-on-click script; placeholders for photo and covers
  - Presentation-only scope and the privacy list: GitHub and LinkedIn are the only profile links; location is only "Brazil (UTC-3)"; no form, mailto or tel
  - Test-after methodology (`tdd: false`, vitest + playwright): the Implementer's diff contains no test files and edits no existing test
- Applicable anti-patterns:
  - Raw values instead of tokens (no color or box-shadow literals outside src/styles/tokens.css and src/assets/)
  - Mixing the two registers (no code look, terminal styling or build-layer markup on the page)
  - Layout-shifting animation (only hover/focus micro-interactions; hover lift is transform-only; the photo reserves space with aspect-ratio and explicit width/height)
  - Hiding pending content with display or visibility (no pending states, no `data-build` attributes in this phase)
  - Generic fade-up reveals (none; no scroll animation of any kind)
  - Scroll hijacking (no scroll-behavior override, no snapping)
  - Publishing private data; a contact form or public email
  - Scope creep into v1 (no scroll-spy, no palette, no `⌘K`, no view transition, no runtime)
  - Weakening tests to get a green run (existing tests are neither edited nor deleted by the Implementer; obsoleted ones are listed under Notes for the test pair)
- Applicable architectural rules:
  - Sections are Astro files in `src/sections/`; page components stay in `src/components/page/`; scripts in `src/scripts/` are plain TypeScript modules, no framework
  - Static by default: no `client:*` directive; the page is complete HTML that works without JavaScript
  - Plain CSS with token custom properties; responsive values are CSS at the three breakpoints (>= 1024, 768-1023, < 768), no layout JavaScript
  - Budgets: CSS <= 25 KB gzip total, total JS <= 90 KB gzip, inline head JS <= 20 KB gzip, CLS <= 0.01; WCAG 2.2 AA with the global 2px `--accent` focus ring
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-2-foundation.prd.md` — Implementation Phases row 5: "Home page" — Goal: The approved final page, navigable and accessible, in both themes and at the three breakpoints. — Success signal: AC-1, AC-2, AC-3, AC-6, AC-12 and AC-13 pass; the owner sees parity with the five final-page artboards locally.

## Summary

Replace the phase-1/2 placeholder `src/pages/index.astro` with the real one-page site. The page loads the `profile`, `projects` and `stack` collections once, then composes five Astro sections in `src/sections/` (Hero, About, Projects, Stack, Contact) from the phase-4 React components rendered statically, between a sticky `NavBar` (with the `☰` popover menu below 768 px) and the `Footer`, over the `Backdrop` glows. `Base.astro` gains a "Skip to content" link and imports a new small `src/scripts/nav.ts` (scrolled nav state, close-the-menu-after-a-link). All responsive values from the screens canvas are ported to one token-only stylesheet `src/styles/home.css` at the three breakpoints; there is no layout JavaScript, no build layer and no animation beyond hover/focus micro-interactions. `SiteMark` becomes unused and is removed.

## User Story

As a visitor (and as the site owner who builds Stage 3 on top of this page)
I want to read a finished, accessible home page that works without JavaScript, by keyboard and on a phone
So that the final layout, content and section markup are stable before the build runtime is added.

## Problem Statement

The Design System components exist (phase 4) but nothing composes them: `src/pages/index.astro` is still the phase-1 placeholder showing only the name and a theme toggle. Until the five sections, the sticky nav, the mobile menu and the footer exist with the approved copy, there is no final page for Stage 3 to rewind, and AC-1, AC-2, AC-3, AC-6, AC-12 and AC-13 cannot be satisfied.

## Solution Statement

`index.astro` reads content with `getEntry('profile','profile')`, `getEntry('stack','stack')` and `getCollection('projects')` (sorted by `data.order`) and passes plain data to the sections. Section markup follows the screens canvas (`screens-main-layout.md`) exactly: stable ids `top`, `about`, `projects`, `stack`, `contact`, `aria-labelledby="<id>-title"` on the four content sections. Interface strings come only from `src/strings.ts`; page copy only from content. `src/styles/home.css` ports the canvas's JS-computed values (hero heights, photo positions, role/copy positions, grid columns, stagger, paddings) into media queries at the three breakpoints. The sticky nav is translucent by default (the no-JS state) and becomes transparent at the top only when JavaScript has marked the document (`data-js`), turning translucent again once `nav.ts` sees a scroll; `prefers-reduced-transparency` and no-`backdrop-filter` fall back to solid `--bg-raised`. The mobile menu stays the phase-4 native `popover`; `nav.ts` only adds `hidePopover()` after a menu link is chosen.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (page assembly) |
| Complexity | HIGH (hero positioning at three breakpoints; many acceptance scenarios) |
| Systems Affected | src/pages, src/sections (new), src/styles, src/scripts, src/layouts/Base.astro, NavBar.css, Icon.tsx |
| Dependencies | Phase 4 page components, phase 3 content collections and strings, phase 2 tokens/Backdrop/theme script (all complete); no new package |
| Estimated Tasks | 12 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md:207-210` (Phase 5 details), AC-1/2/3/6/12/13 at lines 62, 63, 64, 67, 73, 74 |
| phase_type | feature |

## Mandatory Reading

All source paths below are relative to the worktree root `C:/repos/site-pro/.worktrees/stage-2-foundation/` (where the implementation and every command in this plan run), except the first two rows.

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `C:/repos/site-pro/PRPs/prds/stage-2-foundation.prd.md` | 62-74, 207-210 | AC-1, AC-2, AC-3, AC-6, AC-12, AC-13 and the Phase 5 scope |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md` | 5-141 | Section markup and the per-breakpoint hero, glow, grid values to port (read-only; docs/03 and docs/02 win on any difference) |
| P0 | `src/pages/index.astro` | 1-24 | The placeholder being replaced |
| P0 | `src/layouts/Base.astro` | 1-56 | Layout props, theme script, deferred script pattern; gains the skip link |
| P0 | `src/components/page/NavBar.tsx` | 1-70 | NavBar props, brand link to `#top`, popover button, nested MobileMenu |
| P0 | `src/components/page/NavBar.css` | 1-136 | Nav and menu styles, breakpoint conventions; gains sticky and scrolled rules |
| P0 | `src/styles/base.css` | 1-170 | Focus ring, `.sp-page`, existing `.sp-nav.is-scrolled` fallbacks, reduced-motion rule |
| P0 | `src/strings.ts` | 1-61 | All interface copy used by the sections |
| P0 | `src/content.config.ts` | 1-20 | Collection names and loaders (entry ids `profile` and `stack`) |
| P1 | `src/content-schemas.ts` | 56-74 | Fields available on project/profile/stack data |
| P1 | `src/content/profile.json` | 1-23 | Real values the page must show (headline, role, subtitle, bio, links, location) |
| P1 | `src/scripts/theme-toggle.ts` | 1-35 | Script module shape and `data-js` marker |
| P1 | `src/components/page/Photo.tsx` | 1-41 | Photo props (`src`, `alt`, `height`); fixed 900x1600 attributes |
| P1 | `src/components/page/Photo.css` | 1-29 | `--photo-h` and 9/16 aspect-ratio hook |
| P1 | `src/components/page/Backdrop.tsx` | 1-49 | `DEFAULT_GLOWS` and per-breakpoint scale already in Backdrop.css |
| P1 | `src/components/page/SectionHeading.tsx` | 1-36 | Eyebrow/title/lead markup reused by four sections |
| P1 | `src/components/page/ProjectCard.tsx` | 1-64 | Card props and title link to `/projects/<slug>` |
| P1 | `src/components/page/resolve-asset.ts` | 1-11 | Turns content asset paths into URLs |
| P1 | `tests/e2e/placeholder-page.spec.ts` | 1-65 | Existing assertions on the placeholder page, two of which this phase obsoletes |
| P1 | `tests/e2e/theme.spec.ts` | 125-139 | Tab-focus assertion that the skip link obsoletes |
| P2 | `docs/03-design-system.md` | - | Source of truth over the canvas on any difference |
| P2 | `docs/02-experience.md` | - | Source of truth over the canvas on any difference |

## Patterns to Mirror

```
# SOURCE: src/scripts/theme-toggle.ts:9-35
const root = document.documentElement;
const toggles = document.querySelectorAll<HTMLElement>('[data-theme-toggle]');

function syncLabels(): void {
  const label = themeToggleLabel(parseTheme(root.dataset.theme));
  toggles.forEach((toggle) => {
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  });
}

toggles.forEach((toggle) => {
  toggle.addEventListener('click', () => { /* ... */ });
});

syncLabels();
root.setAttribute('data-js', '');
```
Copied by Task 3 (`nav.ts`: plain module, top-level side effects, DOM lookups by selector, no framework).

```
# SOURCE: src/layouts/Base.astro:50-55
  <body>
    <slot />
    <script>
      import '../scripts/theme-toggle';
    </script>
  </body>
```
Copied by Task 4 (skip link first in body; second hoisted script import beside the theme one).

```
# SOURCE: src/components/page/NavBar.css:1-8 and 119-136
.sp-nav {
  position: relative;
  height: var(--nav-height);
  border-bottom: 1px solid transparent;
  transition:
    background-color 200ms,
    border-color 200ms;
}
...
@media (max-width: 767px) { /* ... */ }
@media (min-width: 768px) {
  .sp-menu-toggle,
  .sp-menu {
    display: none;
  }
}
```
Copied by Tasks 2 and 11 (token-only CSS, 200 ms transitions, `max-width: 767px` / `min-width: 768px` breakpoint spelling).

```
# SOURCE: src/styles/base.css:147-161
@media (prefers-reduced-transparency: reduce) {
  .sp-nav.is-scrolled {
    background: var(--bg-raised);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@supports not (
  (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
) {
  .sp-nav.is-scrolled {
    background: var(--bg-raised);
  }
}
```
Copied by Task 2 (the solid fallbacks already exist for `.is-scrolled`; the translucent default state needs the same fallbacks).

```
# SOURCE: src/pages/index.astro:13-23
  <div class="sp-page">
    <Backdrop glows={DEFAULT_GLOWS} />
    <div class="sp-page-content">
      <header>...</header>
      <main>...</main>
    </div>
  </div>
```
Copied by Task 12 (same wrapper structure: Backdrop inside `.sp-page`, content in `.sp-page-content`).

```
# SOURCE: src/components/page/ProjectCard.tsx:10-20
interface ProjectCardProps {
  title: string;
  slug: string;
  year: string;
  summary: string;
  tags: readonly string[];
  status: ProjectStatus;
  repo?: string;
  cover?: string;
  className?: string;
}
```
Copied by Task 8 (Projects maps each collection entry onto these props).

```
# SOURCE: src/content.config.ts:5-20
const profile = defineCollection({
  loader: file('src/content/profile.json'),
  schema: profileSchema,
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: projectSchema,
});

const stack = defineCollection({
  loader: file('src/content/stack.json'),
  schema: stackSchema,
});
```
Copied by Task 12 (entry ids: `getEntry('profile', 'profile')`, `getEntry('stack', 'stack')`, `getCollection('projects')`).

```
# SOURCE: src/components/page/Photo.css:1-6
.sp-photo {
  position: relative;
  flex: none;
  aspect-ratio: 9 / 16;
  height: var(--photo-h, auto);
}
```
Copied by Tasks 6 and 11 (the hero sets `--photo-h` per breakpoint from CSS; no `height` prop, so the heights stay responsive).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:20-36
<section id="top" aria-label="Introduction" style="position: relative; box-sizing: border-box; height: {{heroH}};">
  <div style="position: relative; box-sizing: border-box; height: 100%; max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 32px);">
    <h1 class="banner" style="position: absolute; z-index: 1; top: {{nameTop}}; left: clamp(16px, 4vw, 32px); right: clamp(16px, 4vw, 32px); margin: 0; font-size: {{bannerSize}}; color: var(--fg);">Fabio <br>Barreto.</h1>
    <div style="position: absolute; z-index: 2; top: {{photoTop}}; left: {{photoLeft}};"> <Photo shape="cutout" ... height="{{photoH}}" /> </div>
    <p class="text-2xl" style="position: absolute; z-index: 3; top: {{roleTop}}; ... width: {{roleW}}; ...">Senior Software Engineer</p>
    <div style="position: absolute; z-index: 3; bottom: {{textBottom}}; ... width: {{textW}}; display: flex; flex-direction: column; gap: 20px;"> ... </div>
```
Copied by Tasks 6 and 11 (hero structure and stacking order name < photo < role/copy).

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:105-109
const hero = desktop
  ? { heroH: '836px', nameTop: '56px', bannerSize: 'clamp(64px, 15vw, 216px)', photoH: 960, photoLeft: '50%', photoTop: '40px', roleTop: '520px', roleW: '440px', textBottom: '64px', textW: '440px' }
  : mobile
    ? { heroH: '900px', nameTop: '24px', bannerSize: '19vw', photoH: 480, photoLeft: (w - 270) + 'px', photoTop: '150px', roleTop: '200px', roleW: '150px', textBottom: '32px', textW: 'calc(100% - 32px)' }
    : { heroH: '700px', nameTop: '56px', bannerSize: 'clamp(64px, 15vw, 216px)', photoH: 760, photoLeft: '52%', photoTop: '44px', roleTop: '330px', roleW: '330px', textBottom: '48px', textW: '330px' };
```
Copied by Task 11 (the numbers become media-query CSS; `bannerSize` is already `--text-banner`, which is 19vw under 768 px).

## Files to Change

Worktree-relative paths.

| File | Action | Justification |
|------|--------|---------------|
| `src/components/page/Icon.tsx` | UPDATE | Add the `arrowDown` glyph the "See my work" button needs (Lucide `arrow-down`) |
| `src/components/page/NavBar.css` | UPDATE | Sticky nav, default translucent state, transparent-at-top state under `data-js`, solid fallbacks |
| `src/scripts/nav.ts` | CREATE | Plain module: toggles `.is-scrolled` on the nav; closes the mobile popover after a menu link is chosen |
| `src/layouts/Base.astro` | UPDATE | "Skip to content" link as first body child; import `nav.ts` in the deferred script |
| `src/styles/base.css` | UPDATE | `.sp-skip` visible-on-focus styles and `main:focus` outline rule |
| `src/sections/profile-links.ts` | CREATE | One helper returning the GitHub and LinkedIn URLs from the profile, throwing if either is missing |
| `src/sections/Hero.astro` | CREATE | `#top` banner hero |
| `src/sections/About.astro` | CREATE | `#about` section |
| `src/sections/Projects.astro` | CREATE | `#projects` section with the four cards |
| `src/sections/Stack.astro` | CREATE | `#stack` section with six groups |
| `src/sections/Contact.astro` | CREATE | `#contact` section with the display heading |
| `src/styles/home.css` | CREATE | All section layout and the three-breakpoint values, tokens only |
| `src/pages/index.astro` | UPDATE | Compose nav, five sections and footer over the backdrop; per-page title and description from content |
| `src/components/page/SiteMark.tsx` | DELETE | Unused once `index.astro` stops importing it; the phase-1 placeholder |

## NOT Building (Scope Limits)

- The build runtime, boot terminal, command dock, build windows, selection boxes, skeletons, Skip, Run all, Replay and every `data-build` attribute or pending state (Stage 3).
- The photo to ASCII script, the real photo and real project covers; placeholders only (Stage 4).
- The Command Palette, the nav `⌘K` button, scroll-spy (`is-active` states are not driven), the card to project page view transition and the `?` shortcut list (Stage 5).
- `/projects/<slug>` pages and the 404 page (Phase 6); this phase only emits the card links.
- OG images, JSON-LD, sitemap, canonical URLs, analytics (Stage 6).
- The footer build summary and Replay button (runtime, Stage 3).
- GitHub star counts (C12).
- The full CI quality gates, axe matrix, privacy script and Lighthouse CI (Phase 7); this phase only runs ad-hoc equivalents as validation.
- Any new test file or edit to an existing test (test pair, after Code Review).
- Anything in v1.1 or post-v1.

## Step-by-Step Tasks

All commands run from the worktree root `C:/repos/site-pro/.worktrees/stage-2-foundation/` in Git Bash. After writing each file, format it with `pnpm exec prettier --write <file>`.

### Task 1: UPDATE src/components/page/Icon.tsx

- **ACTION**: Add `'arrowDown'` to the `IconName` union and a Lucide 1.33.0 `arrow-down` entry to the `LUCIDE` record: two paths, `M12 5v14` and `m19 12-7 7-7-7`, keyed `0` and `1` like the neighbouring entries. Touch nothing else. Delivers AC-A1 (the "See my work ↓" button in the hero can render its end icon).
- **MIRROR**: `# SOURCE: src/components/page/Icon.tsx:38-40` pattern (the `arrowUpRight` entry in `LUCIDE`: array of `<path key="n" d="..." />`); no Patterns-to-Mirror snippet beyond that existing record entry.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec prettier --check src/components/page/Icon.tsx; pnpm exec eslint src/components/page/Icon.tsx` (type-checks the new union member and record entry: a missing record key is a compile error because `LUCIDE` is `Record<StrokeIconName, …>`).

### Task 2: UPDATE src/components/page/NavBar.css

- **ACTION**: Make the nav sticky and give it three visual states, tokens only, no color literals. (a) `.sp-nav`: `position: sticky; top: 0; z-index: 10;` (replacing `position: relative`), keep `height: var(--nav-height)`. (b) Default state (this is also the no-JS state): `background: var(--bg-overlay); border-bottom-color: var(--border);` plus `-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);`. (c) Transparent at the top, only once JavaScript has marked the document: `:root[data-js] .sp-nav:not(.is-scrolled) { background: transparent; border-bottom-color: transparent; -webkit-backdrop-filter: none; backdrop-filter: none; }`. (d) Solid fallbacks that also cover the no-JS translucent state: inside `@media (prefers-reduced-transparency: reduce)` and inside the existing-style `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` block set `.sp-nav, :root[data-js] .sp-nav:not(.is-scrolled) { background: var(--bg-raised); }` with `backdrop-filter: none` in the reduced-transparency block (the transparent-at-top state then becomes solid too, which is the intended reduced-transparency behaviour). Keep the existing 200 ms background/border transitions and the existing `.sp-menu` rules. Delivers AC-A7.
- **MIRROR**: `# SOURCE: src/components/page/NavBar.css:1-8 and 119-136` and `# SOURCE: src/styles/base.css:147-161` (fallback blocks).
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check src/components/page/NavBar.css; pnpm exec eslint .; pnpm build; node -e "const fs=require('fs');const p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(p.join(d,e.name)):[p.join(d,e.name)]);const css=w('dist').filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(f,'utf8')).join('\n')+(fs.readFileSync('dist/index.html','utf8').match(/<style[^>]*>[\s\S]*?<\/style>/g)||[]).join('\n');for(const t of ['position:sticky','prefers-reduced-transparency']){if(!css.replace(/\s+/g,'').includes(t)){console.error('FAIL: built CSS lacks '+t);process.exit(1)}}console.log('PASS: sticky nav and reduced-transparency rules are in the built CSS')"` (the build must succeed and the rules must survive minification; the visible behaviour is exercised end-to-end by Level 3).

### Task 3: CREATE src/scripts/nav.ts

- **ACTION**: Create a plain TypeScript module in the shape of `theme-toggle.ts` (top-level side effects, no framework, no exports needed). Behaviour: (1) `const nav = document.querySelector<HTMLElement>('.sp-nav')`; if present, define `sync()` that toggles the `is-scrolled` class with `nav.classList.toggle('is-scrolled', window.scrollY > 0)`, call it once immediately (a page restored mid-scroll starts correct), and register `window.addEventListener('scroll', sync, { passive: true })`. (2) `const menu = document.getElementById('mobile-menu')`; if present, add one `click` listener on the menu that, when `(event.target as Element).closest('a')` is non-null and that anchor is inside the menu, calls `menu.hidePopover()` (the anchor's own default navigation to its `#id` still happens). Type-narrow with `instanceof HTMLElement`/`Element` instead of casts where practical. No `localStorage`, no timers, no `requestAnimationFrame`, no layout reads except `scrollY`. Delivers AC-A4 (close-after-link) and AC-A7 (scrolled state).
- **MIRROR**: `# SOURCE: src/scripts/theme-toggle.ts:9-35`.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/scripts/nav.ts; pnpm exec prettier --check src/scripts/nav.ts` (the module is wired and its behaviour is exercised in Task 4's build and Level 3).

### Task 4: UPDATE src/layouts/Base.astro and src/styles/base.css (skip link)

- **ACTION**: In `Base.astro`, import `strings` from `../strings`; make the FIRST child of `<body>` (before `<slot />`) the anchor `<a class="sp-skip" href="#main">{strings.skipLink}</a>`; add `import '../scripts/nav';` as a second line inside the existing hoisted `<script>` block (after the theme-toggle import). In `base.css` add: `.sp-skip` positioned `absolute; left: var(--space-4); top: var(--space-4); z-index: 20;` moved out of view until focused (`transform: translateY(-200%)`) and, on `:focus`, `transform: none`; with `padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm); background: var(--bg-raised); color: var(--fg); border: 1px solid var(--border); text-decoration: none;` (the global `:focus-visible` 2px accent ring from base.css still applies; do not redefine it), and `main:focus { outline: none; }` (the skip target is programmatically focused with `tabindex="-1"`; it is not an interactive control). Note for later phases: any page using `Base.astro` must provide `<main id="main" tabindex="-1">`. Delivers AC-A3.
- **MIRROR**: `# SOURCE: src/layouts/Base.astro:50-55`.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec prettier --check src/layouts/Base.astro src/styles/base.css; pnpm build; node -e "const h=require('fs').readFileSync('dist/index.html','utf8');if(!/<body[^>]*>\s*<a\b[^>]*href=\"#main\"[^>]*>\s*Skip to content/.test(h)){console.error('FAIL: skip link is not the first element in <body>');process.exit(1)}console.log('PASS: skip link first in body')"`.

### Task 5: CREATE src/sections/profile-links.ts

- **ACTION**: Create a typed helper `export function profileLinks(profile: CollectionEntry<'profile'>['data']): { github: string; linkedin: string }` (import `type CollectionEntry` from `astro:content`). It finds the profile link whose `icon` is `'github'` and the one whose `icon` is `'linkedin'` and returns their `url`s; if either is missing it throws an `Error` naming the missing icon, so a content mistake fails the build rather than the page. Used by Hero, About, Contact and `index.astro` so the profile URLs live only in `profile.json`. Delivers AC-A1 and AC-A8 (only the approved profile links appear).
- **MIRROR**: `# SOURCE: src/content.config.ts:5-20` (collection names; entry type is `CollectionEntry<'profile'>`).
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/sections/profile-links.ts; pnpm exec prettier --check src/sections/profile-links.ts` (astro check type-checks the `astro:content` types against the real collection schema).

### Task 6: CREATE src/sections/Hero.astro

- **ACTION**: Props `{ profile: CollectionEntry<'profile'>['data'] }`. Markup, in this DOM order: `<section id="top" aria-label={strings.hero.ariaLabel} class="sp-hero">` > `<div class="sp-hero-inner">` containing (1) `<h1 class="banner sp-hero-name">` whose content is the first word of `profile.headline`, then `{' '}`, then `<br />`, then the remainder (headline "Fabio Barreto." renders "Fabio" and "Barreto." on two lines; textContent stays "Fabio Barreto."); (2) `<div class="sp-hero-photo">` with `<Photo src={url} alt={profile.name} />` where `url = resolveAssetUrl(profile.photo)` (throw an `Error` if undefined) and NO `height` prop; (3) `<p class="sp-hero-role text-2xl">{profile.role}</p>`; (4) `<div class="sp-hero-copy">` with `<p class="text-lg">{profile.subtitle}</p>` and `<div class="sp-hero-actions">` holding three `Button`s in order: primary `href="#projects"` `iconEnd="arrowDown"` labelled `strings.hero.seeMyWork`; ghost `icon="github" external` with the GitHub URL labelled `strings.buttons.github`; ghost `icon="linkedin" external` with the LinkedIn URL labelled `strings.buttons.linkedin` (URLs from `profileLinks`). No inline `style` attributes, no `data-build`. Delivers AC-A1 and AC-A6.
- **MIRROR**: `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:20-36` and `# SOURCE: src/components/page/Photo.css:1-6`.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/sections/Hero.astro; pnpm exec prettier --check src/sections/Hero.astro` (types the component props against `Button`, `Photo`, `strings` and the collection).

### Task 7: CREATE src/sections/About.astro

- **ACTION**: Props `{ profile }`. `<section id="about" aria-labelledby="about-title" class="sp-section">` > `<div class="sp-section-inner">` with `<SectionHeading id="about-title" eyebrow={strings.sections.about.eyebrow} title={strings.sections.about.title} />`, then `<div class="sp-about-body">` containing one `<p class="text-lg">` per paragraph of `profile.bio` (split on blank lines, `\n\n`), then `<div class="sp-actions">` with two `Button variant="secondary" external` (GitHub icon `github`, LinkedIn icon `linkedin`; URLs from `profileLinks`, labels from `strings.buttons`). Delivers AC-A1 (the About text and links come from content, h2 "About me").
- **MIRROR**: `# SOURCE: src/components/page/SectionHeading.tsx:4-36` (props `id`, `eyebrow`, `title`).
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/sections/About.astro; pnpm exec prettier --check src/sections/About.astro`.

### Task 8: CREATE src/sections/Projects.astro

- **ACTION**: Props `{ projects: CollectionEntry<'projects'>[] }` (already ordered by the caller). `<section id="projects" aria-labelledby="projects-title" class="sp-section sp-projects">` > `<div class="sp-section-inner is-loose">` with `<SectionHeading id="projects-title" eyebrow={strings.sections.projects.eyebrow} title={strings.sections.projects.title} lead={strings.sections.projects.lead} />` and `<div class="sp-projects-grid">` holding, per entry, `<div class="sp-projects-cell"><ProjectCard title={data.title} slug={entry.id} year={data.year} summary={data.summary} tags={data.tags} status={data.status} repo={data.links.repo} cover={resolveAssetUrl(data.cover)} /></div>`. The slug is the collection entry id (the markdown file basename). No hand-written copy: every value comes from the entry. Delivers AC-A1 (4 cards with title, summary, tags, year, status) and AC-A2 (each title link targets `/projects/<slug>`).
- **MIRROR**: `# SOURCE: src/components/page/ProjectCard.tsx:10-20`.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/sections/Projects.astro; pnpm exec prettier --check src/sections/Projects.astro` (a status or prop mismatch against `ProjectCardProps` is a type error).

### Task 9: CREATE src/sections/Stack.astro

- **ACTION**: Props `{ stack: CollectionEntry<'stack'>['data'] }`. `<section id="stack" aria-labelledby="stack-title" class="sp-section">` > `<div class="sp-section-inner is-loose">` with `<SectionHeading id="stack-title" eyebrow={strings.sections.stack.eyebrow} title={strings.sections.stack.title} />` and `<div class="sp-stack-grid">` containing one `<StackGroup name={group.name} items={group.items} />` per `stack.groups` entry, in file order (display order). Delivers AC-A1 (6 groups with their items in display order).
- **MIRROR**: `# SOURCE: src/components/page/SectionHeading.tsx:4-36` (heading props) and the `StackGroup` props `{ name, items }`.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/sections/Stack.astro; pnpm exec prettier --check src/sections/Stack.astro`.

### Task 10: CREATE src/sections/Contact.astro

- **ACTION**: Props `{ profile }`. `<section id="contact" aria-labelledby="contact-title" class="sp-section sp-contact">` > `<div class="sp-section-inner">` with `<SectionHeading id="contact-title" eyebrow={strings.sections.contact.eyebrow} title={strings.sections.contact.title} lead={strings.sections.contact.lead} />` (the display scale of the h2 comes from CSS in Task 11, scoped by `.sp-contact`), then `<div class="sp-contact-row">` with `<div class="sp-actions">` holding `Button variant="primary" icon="github" external` (GitHub) and `Button variant="secondary" icon="linkedin" external` (LinkedIn), URLs from `profileLinks`, followed by `<p class="sp-contact-location mono-sm">{profile.location}</p>`; throw an `Error` if `profile.location` is undefined. No form, no mailto, no tel. Delivers AC-A1 (h2 "Let's talk.", lead, "Brazil (UTC-3)") and AC-A8.
- **MIRROR**: `# SOURCE: src/components/page/SectionHeading.tsx:4-36`.
- **VALIDATE**: `set -euo pipefail; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src/sections/Contact.astro; pnpm exec prettier --check src/sections/Contact.astro`.

### Task 11: CREATE src/styles/home.css

- **ACTION**: Create the stylesheet for every class named in Tasks 6-10, tokens only (no hex, `rgb()`, `hsl()`, no `box-shadow` literal). Define `:root { --gutter: clamp(16px, 4vw, 32px); }`. Shared: `.sp-section { padding: clamp(80px, 10vw, 128px) 0; }`; `.sp-section-inner { box-sizing: border-box; max-width: var(--container); margin: 0 auto; padding: 0 var(--gutter); display: flex; flex-direction: column; gap: var(--space-8); }`; `.sp-section-inner.is-loose { gap: var(--space-12); }`; `.sp-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }`; `.sp-about-body { max-width: 680px; display: flex; flex-direction: column; gap: 20px; }` (and `.sp-about-body .sp-actions { margin-top: var(--space-3); }`); `.sp-contact .sp-section-inner` bottom padding `clamp(96px, 12vw, 160px)` on the section (`.sp-contact { padding-bottom: clamp(96px, 12vw, 160px); }`); `.sp-contact .sp-heading-title.text-3xl { font-size: var(--text-display); line-height: 1.02; letter-spacing: -0.03em; }`; `.sp-contact-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4) var(--space-6); }` and `.sp-contact-location { margin: 0; color: var(--fg-muted); }`. Hero: `.sp-hero { position: relative; }` (never `overflow: hidden`: the photo must run into About), `.sp-hero-inner { position: relative; height: 100%; box-sizing: border-box; max-width: var(--container); margin: 0 auto; padding: 0 var(--gutter); }`; `.sp-hero-name { position: absolute; z-index: 1; margin: 0; left: var(--gutter); right: var(--gutter); color: var(--fg); }`; `.sp-hero-photo { position: absolute; z-index: 2; }` with `.sp-hero-photo .sp-photo { --photo-h: <per breakpoint> }`; `.sp-hero-role { position: absolute; z-index: 3; margin: 0; left: var(--gutter); color: var(--fg); }`; `.sp-hero-copy { position: absolute; z-index: 3; left: var(--gutter); display: flex; flex-direction: column; gap: 20px; }` with `.sp-hero-copy p { margin: 0; color: var(--fg-muted); }`; `.sp-hero-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-2); }`. Per-breakpoint hero values (ported from the canvas; `--text-banner` already supplies the font size at each width, do not set `font-size` on the name):

  | Breakpoint | `.sp-hero` height | name `top` | photo `--photo-h` / `top` / horizontal | role `top` / `width` | copy `bottom` / `width` |
  |------------|-------------------|------------|---------------------------------------|----------------------|-------------------------|
  | >= 1024 | 836px | 56px | 960px / 40px / `left: 50%` | 520px / 440px | 64px / 440px |
  | 768-1023 | 700px | 56px | 760px / 44px / `left: 52%` | 330px / 330px | 48px / 330px |
  | < 768 | 900px | 24px | 480px / 150px / `left: auto; right: 0` | 200px / 150px | 32px / `calc(100% - 32px)` |

  (On < 768 the photo's right edge is the viewport edge: the canvas computes `left = viewport width - 270px`, 270px being the 9:16 width of a 480px tall photo.) Projects: `.sp-projects { padding-bottom: 48px; }` (80px under 768); `.sp-projects-grid { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-6); align-items: start; }` (`repeat(1, minmax(0, 1fr))` under 768); `.sp-projects-cell { min-width: 0; }`; `.sp-projects-cell:nth-child(even) { transform: translateY(96px); }` (`none` under 768) so the right column sits 96px lower and the last cover overlaps the top of Stack (the cell's transform never affects layout; its inner `.sp-card` keeps its own hover transform). Stack: `.sp-stack-grid { display: grid; gap: var(--space-6); grid-template-columns: repeat(3, minmax(0, 1fr)); }` becoming 2 columns at 768-1023 and 1 column under 768. Use `@media (min-width: 1024px)`, `(min-width: 768px) and (max-width: 1023px)` and `(max-width: 767px)` spellings. No `transition` or `animation` anywhere in this file. Delivers AC-A6, AC-A5 and AC-A9.
- **MIRROR**: `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:105-109` and `# SOURCE: src/components/page/NavBar.css:1-8 and 119-136` (breakpoint spelling) and `# SOURCE: src/components/page/Photo.css:1-6`.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check src/styles/home.css; if grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src/styles/home.css; then echo "FAIL: color literal in home.css"; exit 1; else echo "PASS: no color literal"; fi; if grep -nE 'box-shadow\s*:|transition\s*:|animation\s*:' src/styles/home.css; then echo "FAIL: box-shadow, transition or animation in home.css"; exit 1; else echo "PASS: no shadow, transition or animation"; fi` (the visual effect of every value is measured in Level 3 once `index.astro` imports the file).

### Task 12: UPDATE src/pages/index.astro and DELETE src/components/page/SiteMark.tsx

- **ACTION**: Rewrite `index.astro` frontmatter: import `Base`, `Backdrop` + `DEFAULT_GLOWS`, `NavBar`, `Footer`, the five sections, `profileLinks`, `strings` is not needed here, `getCollection`/`getEntry` from `astro:content`, and `'../styles/home.css'`. Load `const profileEntry = await getEntry('profile', 'profile')`, `const stackEntry = await getEntry('stack', 'stack')`, `const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order)`; throw an `Error` if either entry is undefined. Derive `title` as the profile headline without its trailing period, a hyphen with spaces, then the role (`Fabio Barreto - Senior Software Engineer`) and `description` as `profile.subtitle`. Footer `sourceHref` is the `links.repo` of the project whose entry id is `site-pro` (throw if absent) and `owner` is `profile.name`. Markup: `<Base title description>` > `<div class="sp-page">` > `<Backdrop glows={DEFAULT_GLOWS} />` + `<div class="sp-page-content">` > `<NavBar githubHref linkedinHref />`, `<main id="main" tabindex="-1">` holding `<Hero profile />`, `<About profile />`, `<Projects projects />`, `<Stack stack />`, `<Contact profile />` in that order, then `<Footer sourceHref owner />`. Remove the old placeholder comment and the `SiteMark` and `ThemeToggle` imports (the NavBar already embeds the toggle). Then delete `src/components/page/SiteMark.tsx`; `tests/unit/site-mark.test.ts` imports it and is obsolete (the Implementer must NOT edit or delete that test; see Notes). Delivers AC-A1, AC-A2, AC-A3, AC-A4, AC-A5, AC-A6.
- **MIRROR**: `# SOURCE: src/pages/index.astro:13-23` and `# SOURCE: src/content.config.ts:5-20`.
- **VALIDATE**: `set -euo pipefail; test ! -e src/components/page/SiteMark.tsx; if grep -rn "SiteMark" src; then echo "FAIL: SiteMark still referenced in src"; exit 1; else echo "PASS: SiteMark gone from src"; fi; OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi; pnpm exec eslint src; pnpm exec prettier --check src; pnpm build; node -e "const h=require('fs').readFileSync('dist/index.html','utf8');const ids=[...h.matchAll(/<section\b[^>]*\bid=\"([^\"]+)\"/g)].map(m=>m[1]).join(',');if(ids!=='top,about,projects,stack,contact'){console.error('FAIL: section ids '+ids);process.exit(1)}console.log('PASS: section ids '+ids)"`.

## Validation Commands

Run from the worktree root. Level 2 and Level 3 are scoped around the tests this phase legitimately obsoletes (see Notes): the unit run excludes `tests/unit/site-mark.test.ts` (it imports the deleted `SiteMark`), and the e2e run skips the two cases whose assertions describe the phase-1/2 placeholder (`placeholder-page.spec.ts` "is a complete document with one main and one h1, before any script runs" and `theme.spec.ts` "rings the focused toggle with a 2px solid accent outline offset 2px"). Build-output greps target HTML only.

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
# astro check, tolerating exactly the obsolete tests/unit/site-mark.test.ts (it imports the deleted SiteMark; the test pair removes it afterwards). Any other error fails. ANSI colour escapes are stripped first: astro check colours its output even when piped, so the plain-text forms matched below ("path:line:col - error ts(NNNN): ...", "Result (N files): ", "- 1 error") only exist after stripping.
OUT=$(pnpm check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true); echo "$OUT"; echo "$OUT" | grep -q 'Result (' || { echo "FAIL: astro check produced no summary"; exit 1; }; BAD=$(echo "$OUT" | grep -E ':[0-9]+:[0-9]+ - error ' | grep -v 'site-mark.test.ts' || true); if [ -n "$BAD" ]; then echo "FAIL: type errors beyond the obsolete site-mark test"; echo "$BAD"; exit 1; fi; TOTAL=$(echo "$OUT" | grep -oE '[0-9]+ errors?' | head -1 | grep -oE '[0-9]+' || true); ALLOWED=$(echo "$OUT" | grep -cE 'site-mark.test.ts:[0-9]+:[0-9]+ - error ' || true); if [ "${TOTAL:-0}" -gt "$ALLOWED" ]; then echo "FAIL: astro check reports $TOTAL errors, only $ALLOWED allowed"; exit 1; fi
pnpm lint
pnpm format:check
```

### Level 2: UNIT_TESTS and CONTENT_INVARIANTS

```bash
set -euo pipefail
# Existing unit suite as a regression guard (site-mark.test.ts is obsolete: it imports the removed SiteMark).
pnpm exec vitest run --exclude tests/unit/site-mark.test.ts
pnpm build

# AC-9: no color or shadow literal in anything this phase wrote.
FILES="src/styles/home.css src/styles/base.css src/sections src/pages/index.astro src/layouts/Base.astro src/scripts/nav.ts src/components/page/NavBar.css"
if grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' $FILES; then echo "FAIL: color literal"; exit 1; else echo "PASS: no color literal"; fi
if grep -rnE 'box-shadow\s*:' $FILES | grep -v 'var(--'; then echo "FAIL: box-shadow literal"; exit 1; else echo "PASS: no box-shadow literal"; fi

# AC-1, AC-6 markup, AC-8, AC-12 (static part), budgets: read dist/index.html without running any script.
node --input-type=module - <<'EOF'
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const html = readFileSync('dist/index.html', 'utf8');
const dec = (s) =>
  s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (s) => dec(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };

const ids = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
check(ids.join() === 'top,about,projects,stack,contact', 'section ids: ' + ids.join());
check((html.match(/<main\b/g) || []).length === 1, 'exactly one <main>');
check(/<main\b[^>]*\bid="main"/.test(html), '<main id="main">');
const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
check(h1s.length === 1 && text(h1s[0][1]) === 'Fabio Barreto.', 'one h1 reading "Fabio Barreto."');
const h2 = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]));
check(h2.join('|') === "About me|Selected work|What I work with|Let's talk.", 'h2 list: ' + h2.join('|'));
for (const id of ['about', 'projects', 'stack', 'contact']) {
  check(new RegExp(`<section\\b[^>]*aria-labelledby="${id}-title"`).test(html), `section ${id} aria-labelledby`);
  check(new RegExp(`<h2\\b[^>]*\\bid="${id}-title"`).test(html), `h2 id ${id}-title`);
}
check(/<section\b(?=[^>]*\bid="top")(?=[^>]*aria-label="Introduction")/.test(html), 'hero section id top + aria-label Introduction');
check(/<body[^>]*>\s*<a\b[^>]*href="#main"[^>]*>\s*Skip to content/.test(html), 'skip link first in body');
for (const id of ['about', 'projects', 'stack', 'contact']) check(html.includes(`href="#${id}"`), 'nav link #' + id);
check(html.includes('href="#top"'), 'brand link #top');
check(/\bid="mobile-menu"/.test(html) && /\bpopover\b/.test(html), 'mobile menu popover markup');
check(/<title>[^<]+<\/title>/.test(html), '<title> present');

// Copy comes from content (the source of truth for AC-1).
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8')).profile;
const stack = JSON.parse(readFileSync('src/content/stack.json', 'utf8')).stack;
const body = text(html);
const expectedTitle = `${profile.headline.replace(/\.$/, '')} - ${profile.role}`;
check(dec(html).includes(`<title>${expectedTitle}</title>`), 'title is ' + expectedTitle);
check(dec(html).includes(`name="description" content="${profile.subtitle}"`), 'meta description is the profile subtitle');
check(body.includes(profile.role), 'role');
check(body.includes(profile.subtitle), 'hero intro');
for (const p of profile.bio.split(/\n\n/)) check(body.includes(p), 'bio paragraph: ' + p.slice(0, 30));
check(body.includes(profile.location), 'location text');
for (const g of stack.groups) {
  check(body.includes(g.name), 'stack group ' + g.name);
  let at = body.indexOf(g.name);
  for (const item of g.items) {
    const i = body.indexOf(item, at);
    check(i >= 0, `stack item ${item} after group ${g.name} (display order)`);
    if (i >= 0) at = i;
  }
}
const files = readdirSync('src/content/projects').filter((f) => f.endsWith('.md'));
check(files.length === 4, 'four project entries, found ' + files.length);
for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const fm = readFileSync(join('src/content/projects', f), 'utf8');
  const unq = (v) => v.trim().replace(/^['"]|['"]$/g, '').replace(/''/g, "'");
  const title = unq(/^title:\s*(.+)$/m.exec(fm)?.[1] ?? '');
  const summary = unq(/^summary:\s*(.+)$/m.exec(fm)?.[1] ?? '');
  check(title && summary, 'frontmatter parsed for ' + slug);
  check(html.includes(`href="/projects/${slug}"`), 'card link /projects/' + slug);
  check(body.includes(title), 'card title ' + title);
  check(body.includes(summary), 'card summary of ' + slug);
}

// AC-8: privacy and links.
check(!/<form\b|mailto:|tel:/i.test(html), 'no form, mailto or tel');
const external = [...html.matchAll(/<a\b[^>]*\bhref="(https?:[^"]+)"/g)].map((m) => m[1]);
const allowed = /^https:\/\/(github\.com\/fabiombarreto(\/|$)|www\.linkedin\.com\/in\/fabio-martins-barreto$)/;
for (const u of external) check(allowed.test(u), 'unexpected external link ' + u);

// AC-12 (static part): no build layer in the HTML.
check(!/\bsp-(boot|dock|dock-fab|window|select|skel)\b/.test(html), 'no build-layer class in the HTML');
check(!/data-build/.test(html), 'no data-build attribute');

// AC-10 budgets (real PRD values): CSS 25 KB, total JS 90 KB, inline head JS 20 KB, gzip.
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const dist = walk('dist');
const inline = (re) => [...html.matchAll(re)].map((m) => m[1]).join('\n');
const css = dist.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n') + '\n' + inline(/<style[^>]*>([\s\S]*?)<\/style>/g);
const inlineScripts = inline(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g);
const js = dist.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n') + '\n' + inlineScripts;
const head = html.slice(0, html.indexOf('</head>'));
const headJs = [...head.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
const kb = (s) => gzipSync(Buffer.from(s)).length / 1024;
check(kb(css) <= 25, `CSS ${kb(css).toFixed(1)} KB gzip > 25`);
check(kb(js) <= 90, `JS ${kb(js).toFixed(1)} KB gzip > 90`);
check(kb(headJs) <= 20, `inline head JS ${kb(headJs).toFixed(1)} KB gzip > 20`);
check(css.replace(/\s+/g, '').includes('prefers-reduced-transparency'), 'reduced-transparency fallback in built CSS');

if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log(`PASS: static HTML invariants (CSS ${kb(css).toFixed(1)} KB, JS ${kb(js).toFixed(1)} KB, head JS ${kb(headJs).toFixed(2)} KB gzip)`);
EOF
```

### Level 3: INTEGRATION (existing e2e suite, then a real-browser run of the acceptance scenarios)

```bash
set -euo pipefail
pnpm build
# Existing e2e suite, minus the two cases that describe the placeholder page (see Notes).
pnpm exec playwright test --pass-with-no-tests --grep-invert "one main and one h1|rings the focused toggle"

# AC-2, AC-3, AC-6, AC-12, AC-13 plus scrolled-nav state and axe, measured in Chromium against dist/ served by a throwaway static server.
node --input-type=module - <<'EOF'
import http from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = resolve('dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let f = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const axe = async (page, label) => {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  check(r.violations.length === 0, `axe ${label}: ${r.violations.map((v) => v.id).join(',')}`);
};
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8')).profile;
const slugs = readdirSync('src/content/projects').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const popoverOpen = (page) => page.locator('#mobile-menu').evaluate((e) => e.matches(':popover-open'));

const browser = await chromium.launch();
try {
  // AC-13 layout at the three breakpoints, plus axe in both themes and CLS.
  const sizes = [
    { w: 1440, h: 900, photo: 960, cols: 2, stagger: 96, stack: 3, runsIntoAbout: true },
    { w: 800, h: 1024, photo: 760, cols: 2, stagger: 96, stack: 2, runsIntoAbout: true },
    { w: 375, h: 812, photo: 480, cols: 1, stagger: 0, stack: 1, runsIntoAbout: false },
  ];
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
    await ctx.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const m = await page.evaluate(() => {
      const photo = document.querySelector('.sp-hero-photo .sp-photo').getBoundingClientRect();
      const heroBottom = document.querySelector('.sp-hero').getBoundingClientRect().bottom;
      const h1 = document.querySelector('h1');
      const top = (n) => { const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().top; };
      const cells = [...document.querySelectorAll('.sp-projects-grid > *')];
      const ty = new DOMMatrix(getComputedStyle(cells[1]).transform).m42;
      return {
        ph: photo.height, pw: photo.width, pr: photo.right, pbottom: photo.bottom, heroBottom,
        photoZ: Number(getComputedStyle(document.querySelector('.sp-hero-photo')).zIndex),
        nameZ: Number(getComputedStyle(h1).zIndex),
        nameLines: [top(h1.firstChild), top(h1.lastChild)],
        cols: getComputedStyle(document.querySelector('.sp-projects-grid')).gridTemplateColumns.split(' ').length,
        ty, sameRow: Math.abs(cells[1].getBoundingClientRect().top - ty - cells[0].getBoundingClientRect().top) < 1,
        stack: getComputedStyle(document.querySelector('.sp-stack-grid')).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cls: window.__cls, vw: document.documentElement.clientWidth,
      };
    });
    const t = `@${s.w}`;
    check(Math.abs(m.ph - s.photo) <= 1, `${t} photo height ${m.ph} != ${s.photo}`);
    check(Math.abs(m.pw / m.ph - 9 / 16) <= 0.01, `${t} photo ratio ${m.pw / m.ph}`);
    check(m.nameLines[1] - m.nameLines[0] > 20, `${t} name is not on two lines`);
    check(m.photoZ > m.nameZ, `${t} photo is not in front of the name`);
    check(s.runsIntoAbout ? m.pbottom > m.heroBottom : m.pr >= m.vw - 1, `${t} photo placement`);
    check(m.cols === s.cols, `${t} project columns ${m.cols} != ${s.cols}`);
    check(Math.abs(m.ty - s.stagger) < 0.5, `${t} right-column offset ${m.ty} != ${s.stagger}`);
    if (s.cols === 2) check(m.sameRow, `${t} first row cells not aligned apart from the stagger`);
    check(m.stack === s.stack, `${t} stack columns ${m.stack} != ${s.stack}`);
    check(m.overflow <= 0, `${t} horizontal overflow ${m.overflow}`);
    check(m.cls <= 0.01, `${t} CLS ${m.cls} > 0.01`);
    await axe(page, `${t} midnight`);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'daylight'; });
    await axe(page, `${t} daylight`);
    await ctx.close();
  }

  // AC-2 and AC-12 no-JS rendering, 1280x800.
  const noJs = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const npage = await noJs.newPage();
  await npage.goto(base + '/');
  const noJsMain = norm(await npage.locator('main').evaluate((e) => e.textContent ?? ''));
  const navBg = await npage.locator('.sp-nav').evaluate((e) => getComputedStyle(e).backgroundColor);
  check(navBg !== 'rgba(0, 0, 0, 0)' && navBg !== 'transparent', 'no-JS nav should be translucent, got ' + navBg);
  for (const id of ['about', 'projects', 'stack', 'contact']) {
    await npage.locator(`.sp-nav-links a[href="#${id}"]`).click();
    await npage.waitForTimeout(300);
    check(new URL(npage.url()).hash === `#${id}`, `no-JS hash for ${id}: ${npage.url()}`);
    const inView = await npage.evaluate((i) => {
      const r = document.getElementById(i + '-title').getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    }, id);
    check(inView, `no-JS #${id}-title is not inside the viewport`);
  }
  const mainText = await npage.locator('main').innerText();
  check(mainText.includes(profile.bio.split(/\n\n/)[0]) && mainText.includes('Brazil (UTC-3)'), 'no-JS main text visible');
  for (const slug of slugs) check((await npage.locator(`a.sp-card-link[href="/projects/${slug}"]`).count()) === 1, 'card link ' + slug);
  await noJs.close();

  // JS enabled, 1280x800: AC-3 keyboard, AC-12 idle DOM and transitions, scrolled nav.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(base + '/');
  await page.keyboard.press('Tab');
  check((await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Skip to content', 'first Tab focuses the skip link');
  await page.keyboard.press('Enter');
  check((await page.evaluate(() => document.activeElement?.tagName)) === 'MAIN', 'skip link moves focus to <main>');

  await page.goto(base + '/');
  await page.evaluate(() => {
    window.__f = [...document.querySelectorAll('a[href], button')].filter(
      (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden',
    );
  });
  const total = await page.evaluate(() => window.__f.length);
  for (let k = 0; k < total; k++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return { i: window.__f.indexOf(document.activeElement), s: cs.outlineStyle, w: cs.outlineWidth, o: cs.outlineOffset, c: cs.outlineColor };
    });
    check(r.i === k, `Tab #${k} focused element index ${r.i} (DOM order)`);
    check(r.s === 'solid' && r.w === '2px' && r.o === '2px' && r.c === 'rgb(37, 99, 235)', `Tab #${k} outline ${JSON.stringify(r)}`);
  }

  await page.goto(base + '/');
  await page.waitForTimeout(2000);
  const layers = await page.locator('.sp-boot, .sp-dock, .sp-dock-fab, .sp-window, .sp-select, .sp-skel').count();
  check(layers === 0, 'build-layer elements present: ' + layers);
  const jsMain = norm(await page.locator('main').evaluate((e) => e.textContent ?? ''));
  check(jsMain === noJsMain, 'main text with JS differs from the no-JS rendering');
  const badTransitions = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      for (const d of getComputedStyle(el).transitionDuration.split(',')) {
        const ms = parseFloat(d) * (d.trim().endsWith('ms') ? 1 : 1000);
        if (ms !== 0 && (ms < 150 || ms > 300)) out.push(el.tagName + '.' + el.className + ':' + d.trim());
      }
    }
    return out;
  });
  check(badTransitions.length === 0, 'transition outside 150-300 ms: ' + badTransitions.slice(0, 5).join(' | '));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const running = await page.evaluate(() => [...document.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.transitionDuration.split(',').some((d) => parseFloat(d) !== 0) || (cs.animationName !== 'none' && cs.animationDuration.split(',').some((d) => parseFloat(d) !== 0));
  }).length);
  check(running === 0, 'transitions or animations still run under reduced motion: ' + running);

  // Sticky and scrolled nav (JS on): transparent at the top, translucent after scrolling.
  await page.goto(base + '/');
  await page.waitForTimeout(300);
  const nav = page.locator('.sp-nav');
  check((await nav.evaluate((e) => getComputedStyle(e).position)) === 'sticky', 'nav is sticky');
  check((await nav.evaluate((e) => e.classList.contains('is-scrolled'))) === false, 'nav starts unscrolled');
  check((await nav.evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgba(0, 0, 0, 0)', 'nav transparent at the top with JS');
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  check(await nav.evaluate((e) => e.classList.contains('is-scrolled')), 'nav gets is-scrolled after scrolling');
  check((await nav.evaluate((e) => getComputedStyle(e).backgroundColor)) !== 'rgba(0, 0, 0, 0)', 'nav translucent after scrolling');
  check((await nav.evaluate((e) => Math.round(e.getBoundingClientRect().top))) === 0, 'nav stays at the top of the viewport');
  await ctx.close();

  // AC-6 mobile menu, 375x812: with JS.
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mpage = await mctx.newPage();
  await mpage.goto(base + '/');
  const btn = mpage.getByRole('button', { name: 'Open the menu' });
  check(!(await mpage.locator('.sp-nav-links').isVisible()), '375: nav links are hidden');
  check(await btn.isVisible(), '375: menu button visible');
  await btn.click();
  check(await popoverOpen(mpage), '375: menu opens (JS)');
  check((await mpage.locator('#mobile-menu a.sp-menu-link').count()) === 4, '375: four numbered menu links');
  check((await mpage.locator('#mobile-menu .sp-menu-foot a').count()) === 2, '375: GitHub and LinkedIn buttons in the menu');
  await axe(mpage, '@375 menu open');
  await mpage.keyboard.press('Escape');
  check(!(await popoverOpen(mpage)), '375: Esc closes the menu');
  await btn.focus();
  await mpage.keyboard.press('Enter');
  await mpage.keyboard.press('Tab');
  check(await mpage.evaluate(() => !!document.activeElement?.closest('#mobile-menu')), '375: Tab from the button reaches the menu');
  await mpage.keyboard.press('Escape');
  check(await btn.evaluate((e) => e === document.activeElement), '375: focus returns to the button after Esc');
  await btn.click();
  await mpage.locator('#mobile-menu a[href="#about"]').click();
  await mpage.waitForTimeout(300);
  check(!(await popoverOpen(mpage)), '375: choosing a link closes the menu (JS)');
  check(new URL(mpage.url()).hash === '#about', '375: choosing a link navigates to #about');
  await mctx.close();

  // AC-6 without JS.
  const nctx = await browser.newContext({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
  const npage2 = await nctx.newPage();
  await npage2.goto(base + '/');
  await npage2.getByRole('button', { name: 'Open the menu' }).click();
  check(await popoverOpen(npage2), '375: menu opens without JavaScript');
  await npage2.keyboard.press('Escape');
  check(!(await popoverOpen(npage2)), '375: Esc closes the menu without JavaScript');
  await nctx.close();

  // AC-6 at >= 768: no button, links inline.
  const tctx = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const tpage = await tctx.newPage();
  await tpage.goto(base + '/');
  check(!(await tpage.getByRole('button', { name: 'Open the menu' }).isVisible()), '768: no menu button');
  check(await tpage.locator('.sp-nav-links').isVisible(), '768: nav links inline');
  await tctx.close();
} finally {
  await browser.close();
  server.close();
}
if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log('PASS: layout, keyboard, menu, nav state, motion and axe checks');
EOF
```

## Acceptance Criteria

- **AC-A1 (PRD AC-1):** `dist/index.html`, read without executing any script, has one `<main>` with sections `top`, `about`, `projects`, `stack`, `contact` in that order, one `<h1>` whose text is "Fabio Barreto.", one `<h2>` per later section ("About me", "Selected work", "What I work with", "Let's talk.") each labelling its section, and the approved copy from content: role, hero intro, About text, four project cards with title, summary, tags, year and status, six stack groups with items in display order, the Contact lead and "Brazil (UTC-3)"; the page has a per-page `<title>` and meta description derived from the profile.
- **AC-A2 (PRD AC-2):** With JavaScript disabled at 1280x800, activating each nav link sets the hash to `#about`, `#projects`, `#stack`, `#contact` and brings the section's `<h2>` into the viewport; every section text is visible; each project card title link points to `/projects/<slug>` (the pages themselves are built in Phase 6).
- **AC-A3 (PRD AC-3):** The first Tab focuses a visible "Skip to content" link, activating it focuses `<main>`, and continued Tab presses focus every link and button in DOM order, each with a computed 2px solid `--accent` outline and 2px offset.
- **AC-A4 (PRD AC-6):** At 375x812 the section links are not in the nav bar and a button named "Open the menu" is shown; activating it (with or without JavaScript) opens a menu with the four numbered links and the GitHub and LinkedIn buttons; `Esc` closes it and returns focus to the button; with JavaScript choosing a link closes the menu and navigates; at widths >= 768 no menu button is shown and the links are inline.
- **AC-A5 (PRD AC-12):** With JavaScript on and the page idle for 2 s the DOM has no `.sp-boot`, `.sp-dock`, `.sp-dock-fab`, `.sp-window`, `.sp-select` or `.sp-skel`, `<main>` text equals the no-JS rendering, every CSS transition lasts 150-300 ms, and under `prefers-reduced-motion: reduce` no transition or animation runs.
- **AC-A6 (PRD AC-13):** At 1440x900, 800x1024 and 375x812 the hero photo placeholder is 960, 760 and 480 px tall at 9:16, the name renders on two lines, the project grid has 2, 2 and 1 columns with the right column 96 px lower at 1440 and 800, the stack grid has 3, 2 and 1 columns, there is no horizontal scroll and CLS is <= 0.01.
- **AC-A7 (PRD AC-2):** The nav is sticky and 64 px tall; without JavaScript it is translucent; with JavaScript it is transparent at the top and translucent after scrolling; under `prefers-reduced-transparency` or without `backdrop-filter` support it falls back to solid `--bg-raised`.
- **AC-A8 (PRD AC-8):** The built HTML contains no `<form>`, `mailto:` or `tel:`, and the only external links are `github.com/fabiombarreto` (and its repositories) and `linkedin.com/in/fabio-martins-barreto`.
- **AC-A9 (PRD AC-9, AC-10):** Nothing this phase adds contains a color or `box-shadow` literal outside `src/styles/tokens.css`; built CSS is <= 25 KB gzip, total JS <= 90 KB gzip and inline head JS <= 20 KB gzip.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hero banner fidelity (giant name, photo in front, photo running into About) across the three breakpoints without layout shift | M | H | Port the canvas values verbatim into one table in Task 11; photo keeps explicit 900x1600 attributes plus `aspect-ratio`; Level 3 measures photo height/ratio, two-line name, z-order, overflow into About and CLS at 1440, 800 and 375 |
| Contrast over the glows is not computed by axe, so a strong glow could pass checks and fail AA | M | M | Keep `DEFAULT_GLOWS` and the per-breakpoint scale untouched (phase-2 contrast test covers token pairs); no new glow values are introduced here |
| The translucent nav over hero text reduces readability in the no-JS and scrolled states | L | M | Default state uses `--bg-overlay` with blur; reduced-transparency and no-`backdrop-filter` fall back to solid `--bg-raised`; checked in built CSS and in Level 3 |
| React 19 SSR and the existing lowercase `popovertarget` spread in NavBar log a dev warning | L | L | Known and intentional (phase 4); not touched here; the menu opens without JavaScript, verified in Level 3 |
| Obsoleted existing tests make a naive full-suite run red | M | M | Validation excludes exactly the obsoleted cases and says so; the Implementer never edits tests; the test pair records UPDATE/REMOVE ops afterwards |
| Sticky positioning broken by an ancestor `overflow` | L | M | `.sp-page` uses `overflow-x: clip` (not `hidden`); Level 3 asserts the nav stays at viewport top after scrolling |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework. (Levels 2 and 3 additionally run the existing suites, scoped as described, purely as a regression guard.)
- **Existing tests this phase obsoletes (for the test pair's lifecycle ledger; the Implementer must not touch them):**
  - `tests/unit/site-mark.test.ts` — covers `SiteMark`, which Task 12 deletes. Lifecycle op: REMOVE.
  - `tests/e2e/placeholder-page.spec.ts`, test "is a complete document with one main and one h1, before any script runs" — asserts `<title>Fabio Barreto</title>`, the old placeholder meta description, and an `<h1>` whose HTML is exactly `Fabio Barreto.` (the real h1 is `Fabio <br>Barreto.` on two lines, with a content-derived title and description). Lifecycle op: UPDATE (the AC-1 contract replaces it). The other tests in that file (JS-disabled heading text, axe, privacy of `dist/`) should stay green.
  - `tests/e2e/theme.spec.ts`, test "rings the focused toggle with a 2px solid accent outline offset 2px" — presses Tab once and expects the theme toggle; the skip link is now first. Lifecycle op: UPDATE (AC-3: first Tab is the skip link; assert the toggle's ring after the skip link, the brand link and the nav links).
  - Level 2 and Level 3 above skip exactly these (unit exclude and `--grep-invert "one main and one h1|rings the focused toggle"`). If any OTHER existing test fails, report it as a dispute rather than editing it.
- Working directory: all implementation and validation happens in the worktree `C:/repos/site-pro/.worktrees/stage-2-foundation/`; the `src/...` paths in this plan are relative to it. The layout reference file under `design-reference/` is read-only: port values, never copy files into the repository. `docs/03-design-system.md` and `docs/02-experience.md` win on any difference with the canvas.
- Research grounding: `research-codebase` and `research-web` were dispatched in parallel. Codebase findings are anchored in Patterns to Mirror above (and re-read directly from the worktree to confirm every cited line). `research-web` confirmed that a `popover` in the auto state is light-dismissable and closes on `Esc` with focus returning to the invoker on keyboard close, and that `prefers-reduced-transparency` is limited-availability (Chrome 118+; its own example keeps the blur and raises opacity, whereas this plan uses a solid `--bg-raised` fallback per the PRD). It left gaps (current support matrix, focus after pointer dismiss, scroll-state approaches), which is why Level 3 asserts the keyboard Esc/focus behaviour in a real browser and the reduced-transparency rule is only verified as present in the built CSS (Playwright emulation of that media feature is not relied on).
- Skip target contract for later phases: every page using `Base.astro` must render `<main id="main" tabindex="-1">`; Phase 6's project pages and 404 must do so.
- The scrolled state is driven by a passive `scroll` listener on purpose: it is a one-off visual state toggle (not build-layer scheduling), and CSS scroll-state queries are not yet a safe baseline. Without JavaScript the nav stays translucent (PRD Should rule).
- No `data-build` attributes, pending states or build-layer classes exist; section ids and `aria-labelledby` wiring are the Stage 3 markup contract.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
