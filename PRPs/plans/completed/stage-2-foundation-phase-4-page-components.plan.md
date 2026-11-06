# Feature: Page components (Phase 4 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: reuse or creation of components (Design System v2 page components); impact on shared UI (nav, footer); cross-cutting patterns (design tokens and themes, centralized interface copy in src/strings.ts); business rules for navigation (N1, N10, N11), content (C1-C16) and visual-design (V1-V16); architectural decision on static React vs islands (D2); business rules for build only as an out-of-scope boundary (no build layer in this phase)
- Decisions found:
  - D2 Astro + React + TypeScript strict: React page components render to static HTML without a client directive; the runtime stays outside React
  - D1 English only, interface copy centralized in src/strings.ts
  - D18 Geist for the page, JetBrains Mono for small labels (type classes already in base.css)
  - D20 One continuous page: the hero photo is a full-body cut-out; Backdrop already exists from phase 2
  - D5 Cards link to /projects/<slug> and keep a direct `repo` shortcut
  - Stage 2 PRD approved 2026-11-05: no `⌘K` button, footer is `Source ↗` + copyright only (no build summary, no Replay), mobile menu is a static `popover`, photo placeholder is a neutral 900 x 1600 silhouette SVG
  - Only personal projects; privacy list (no email, phone, mailto, tel, form)
  - Test-after methodology (`tdd: false`, vitest + playwright): the Implementer's diff contains no test files
- Applicable anti-patterns:
  - Raw values instead of tokens (no color or box-shadow literals outside src/styles/tokens.css and src/assets/)
  - Mixing the two registers (no code look, terminal styling or dot grid in the page register; `CoverPlaceholder` dot grid is the Design System's own cover placeholder, not a build-window grid)
  - Layout-shifting animation (hover lift uses transform only; the photo and covers reserve space with aspect-ratio and explicit width/height)
  - Hiding pending content with display or visibility (no pending states exist in this phase)
  - Publishing private data; a contact form or public email
  - Scope creep into v1 (no palette, no scroll-spy, no view transitions)
  - Weakening tests to get a green run (existing 103 unit + 22 e2e tests must stay green, untouched)
- Applicable architectural rules:
  - Page components live in `src/components/page/`; sections and pages are phases 5 and 6, not here
  - Plain CSS with token custom properties, `sp-` classes, no CSS framework
  - Static by default: no `client:*` directive; ThemeToggle behaviour stays in the phase 2 deferred script
  - Budgets: total CSS <= 25 KB gzip; WCAG 2.2 AA with the global 2px `--accent` focus ring from base.css
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-2-foundation.prd.md` — Implementation Phases row 4: "Page components" — Goal: The Design System page components available as typed, statically rendered React components. — Success signal: Each component renders to the expected semantic HTML in Vitest; AC-9 holds; CSS stays within budget.

## Summary

Port the Design System v2 page components (NavBar, MobileMenu, SectionHeading, Button, TextLink, IconLink, Tag, StatusBadge, Photo, ProjectCard with its CSS CoverPlaceholder, StackGroup, StackChip, Footer, ProjectHeader, Prose) from the untyped reference `components-page.tsx` and `bundle-page.css` into typed React modules in `src/components/page/`, each with a sibling token-only stylesheet. They render to static HTML with no client directive and with state as props. Phase 2's `Icon`, `ThemeToggle` and `Backdrop` are reused, not duplicated; `Icon` gains the extra glyphs. Missing interface copy goes into `src/strings.ts`. The plan also draws the 900 x 1600 silhouette photo placeholder SVG under `src/assets/` and adds a small resolver that maps `profile.photo` (a plain string path) to its built URL via `import.meta.glob`, with no schema change. Static-render unit tests are NOT written here: the test pair authors them afterwards.

## User Story

As the site owner building Stage 3 on top of this base
I want the approved page components as typed, statically rendered React components that read only design tokens
So that phase 5 can assemble the home page from them without redoing markup, styles or accessibility.

## Problem Statement

The approved design exists only as an untyped, single-script reference (`any` props, build-layer parts and a `⌘K` button mixed in). Until its page components exist as typed modules with token-only styles, the home page and project pages (phases 5 and 6) have nothing to compose, and the photo placeholder that the content layer already points at (`src/assets/photo-placeholder-body.svg`) does not exist.

## Solution Statement

One component per file in `src/components/page/` following the shape phase 2 set (named export, local props interface, `React.JSX.Element` return type, sibling `X.css` imported first, strings from `../../strings`). Styles are ported from `bundle-page.css` rule by rule, with every color, radius and shadow a `var(--…)` token and `sp-` class names. Differences from the reference follow the PRD: no `⌘K`, a static `popover` mobile menu, a footer with `Source ↗` and the copyright only. A tiny `resolveAssetUrl` module turns the profile's string path into a URL with `import.meta.glob`. The home page, sections and project pages stay out of scope.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (component library port) |
| Complexity | MEDIUM |
| Systems Affected | `src/components/page/`, `src/assets/`, `src/strings.ts` |
| Dependencies | Phase 2 (tokens, base.css, Icon, ThemeToggle, Backdrop) and phase 3 (strings, content schema types); react 19.3.1, astro 6.4.8 |
| Estimated Tasks | 12 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md` lines 114, 148-160, 202-205 |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-2-foundation.prd.md` | 114, 148-160, 202-205 | Phase 4 scope, the Design System to code mapping, placeholders, interactivity rules |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx` | 8-311 | The reference components to port (read-only; port, never copy verbatim) |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/bundle-page.css` | 28-179 | The reference `sp-` styles to port with tokens only |
| P0 | `.worktrees/stage-2-foundation/src/components/page/Icon.tsx` | 1-51 | Icon to extend with new glyphs and the brand fill branch |
| P0 | `.worktrees/stage-2-foundation/src/components/page/ThemeToggle.tsx` and `ThemeToggle.css` | 1-27 and 1-42 | Component shape; `.sp-icon-btn` is already defined here and must be reused, not redefined |
| P0 | `.worktrees/stage-2-foundation/src/components/page/Backdrop.tsx` | 1-49 | Class-join and CSS-var-through-style pattern |
| P0 | `.worktrees/stage-2-foundation/src/strings.ts` | 1-59 | Existing copy keys; components compose hrefs from ids |
| P1 | `.worktrees/stage-2-foundation/src/content-schemas.ts` | 8-14, 22-54, 56-74, 87-89 | `Profile`, `Project`, `Stack` types for prop types (`status` union, optional `cover`) |
| P1 | `.worktrees/stage-2-foundation/src/styles/base.css` | 38-42, 125-161 | Global focus ring, `.sp-icon`, `.sp-num`, type classes and `.sp-nav.is-scrolled` fallbacks already provided; do not duplicate |
| P1 | `.worktrees/stage-2-foundation/tests/unit/theme-helpers.test.ts` | 1-62 | Static-render test shape the test pair will follow; its ThemeToggle and Backdrop assertions must keep passing |
| P1 | `PRPs/plans/completed/stage-2-foundation-phase-3-content-collections-and-strings.plan.md` | 210, 233-243, 385-395 | What phase 3 promised phase 4: `profile.photo` is the string `src/assets/photo-placeholder-body.svg`, resolved via `import.meta.glob('/src/assets/**/*')`, no schema change |
| P1 | `docs/03-design-system.md` | whole file | Wins over the reference on any difference (component sizes, states) |

## Patterns to Mirror

Anchor P1 (component file shape, icon map):

```tsx
# SOURCE: .worktrees/stage-2-foundation/src/components/page/Icon.tsx:1-51
export type IconName = 'sun' | 'moon';
interface IconProps { name: IconName; size?: number; className?: string }
const LUCIDE: Record<IconName, React.JSX.Element[]> = {
  sun: [<circle key="0" cx="12" cy="12" r="4" />, /* ... */],
  moon: [<path key="0" d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />],
};
export function Icon({ name, size = 16, className }: IconProps): React.JSX.Element {
  return (
    <svg className={className ? `sp-icon ${className}` : 'sp-icon'} width={size} height={size}
      viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{LUCIDE[name]}</svg>
  );
}
```

Task 4 copies this.

Anchor P2 (sibling CSS import first, strings, optional className):

```tsx
# SOURCE: .worktrees/stage-2-foundation/src/components/page/ThemeToggle.tsx:1-27
import './ThemeToggle.css';
import { Icon } from './Icon';
import { strings } from '../../strings';
interface ThemeToggleProps { className?: string }
export function ThemeToggle({ className }: ThemeToggleProps): React.JSX.Element {
  return (
    <button type="button" data-theme-toggle
      className={`sp-icon-btn sp-theme-toggle${className ? ` ${className}` : ''}`}
      aria-label={DEFAULT_LABEL} title={DEFAULT_LABEL}>
```

Tasks 5-11 copy this.

Anchor P3 (shared icon button style lives in ThemeToggle.css):

```css
/* SOURCE: .worktrees/stage-2-foundation/src/components/page/ThemeToggle.css:1-21 */
.sp-icon-btn {
  box-sizing: border-box; width: 36px; height: 36px; display: inline-grid; place-items: center; padding: 0;
  border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--fg-muted); cursor: pointer;
  transition: background-color 150ms, color 150ms;
}
.sp-icon-btn:hover { background: var(--bg-hover); color: var(--fg); }
```

Tasks 5 and 10 reuse it (IconLink and the nav buttons carry `sp-icon-btn`; no redefinition).

Anchor P4 (class join and CSS var through style):

```tsx
# SOURCE: .worktrees/stage-2-foundation/src/components/page/Backdrop.tsx:1-49
const classes = ['sp-backdrop', grain ? 'has-grain' : '', className ?? ''].filter(Boolean).join(' ');
style={{ left: glow.x, top: glow.y, '--glow-size': glow.size } as React.CSSProperties}
```

Tasks 5, 8 copy this.

Anchor P5 (reference Button, TextLink, IconLink):

```tsx
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:64-93
function Button({ variant = 'primary', icon, iconEnd, external = false, href, disabled = false, children, className, ...rest }: any) {
  const cls = cx('sp-btn', 'sp-btn-' + variant, 'text-sm', className);
  const end = iconEnd || (external ? 'arrowUpRight' : null);
  // renders <a href> when href && !disabled, else <button type="button">
}
function TextLink({ href, external = false, children, className, ...rest }: any) { /* <a className="sp-link ..."> + arrowUpRight when external */ }
function IconLink({ href, icon, label, className, ...rest }: any) { /* <a className="sp-icon-btn" aria-label title> <Icon size 18/> */ }
```

Task 5 copies this.

Anchor P6 (reference NavBar and MobileMenu):

```tsx
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:104-162
<header className={cx('sp-nav', ...)}><div className="sp-nav-inner">
  <a className="sp-nav-name" href="#top">{name}</a>
  <nav className="sp-nav-links text-sm" aria-label="Sections">{links.map(l => <a href={'#' + l.toLowerCase()} className="sp-nav-link">{l}</a>)}</nav>
  <div className="sp-nav-actions">{/* kbd button DROPPED in Stage 2 */}<ThemeToggle/><IconLink href={githubHref} icon="github" label="GitHub" />...
<div className="sp-menu"><nav><ul>{links.map((l, i) => <li><a className="sp-menu-link"><span className="sp-menu-num mono-xs">{String(i + 1).padStart(2, '0')}</span><span className="text-xl">{l}</span></a></li>)}</ul></nav>
  <div className="sp-menu-foot"><Button variant="secondary" href={githubHref} icon="github" external>GitHub</Button>...
```

Task 10 copies this.

Anchor P7 (reference SectionHeading, Tag, StatusBadge, StackChip, StackGroup):

```tsx
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:164-209
function SectionHeading({ index, name, title, lead, as = 'h2', id, className }: any) { /* p.sp-eyebrow.mono-xs, H.sp-heading-title.text-3xl, p.sp-heading-lead.text-lg */ }
function Tag({ children, className }: any) { return <span className={cx('sp-tag', 'mono-xs', className)}>{children}</span>; }
const key = STATUSES.indexOf(status) >= 0 ? status.replace(' ', '-') : 'active';  // <span class="sp-status sp-status-{key} mono-xs"><i class="sp-status-dot" aria-hidden/>{status}
function StackGroup({ name, items = [], className }: any) { /* div.sp-stack > h3.sp-stack-name.mono-xs + ul.sp-stack-list > li > StackChip */ }
```

Tasks 6 and 7 copy this.

Anchor P8 (reference Photo, CoverPlaceholder, ProjectCard):

```tsx
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:214-269
inner = <img className="sp-photo-img" src={src} alt={alt} width={w} height={h} />;   // wrapper div.sp-photo.is-cutout.is-built
function CoverPlaceholder({ label }: any) { return <div className="sp-cover-ph" aria-hidden="true"><span className="mono-sm">{label}</span></div>; }
const link = href || (slug ? '/projects/' + slug : '#');
<article className={cx('sp-card', 'is-link', className)}>
  <div className="sp-card-cover">{cover ? <img src={cover} alt="" /> : <CoverPlaceholder label={slug || title} />}</div>
  ... <h3 className="sp-card-title text-xl"><a className="sp-card-link" href={link}>{title}</a></h3>
  ... <TextLink className="sp-card-repo text-sm" href={repo} external>repo</TextLink>
```

Tasks 8 and 9 copy this.

Anchor P9 (reference Footer, ProjectHeader, Prose):

```tsx
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/components-page.tsx:272-311
<footer className={cx('sp-footer', 'text-sm', className)}><div className="sp-footer-inner">
  {/* sp-footer-build with "Built live in" and Replay DROPPED in Stage 2 */}
  <p className="sp-footer-meta"><TextLink href={sourceHref} external>Source</TextLink><span>© {year} {owner}</span></p>
<TextLink className="sp-back text-sm" href={backHref}><Icon name="arrowLeft" size={14} /> All projects</TextLink>
<h1 className="sp-project-title text-3xl">{title}</h1> ... <Button variant="secondary" href={repo} icon="github" external>Repo</Button>
function Prose({ children, className }: any) { return <div className={cx('sp-prose', 'text-md', className)}>{children}</div>; }
```

Task 11 copies this.

Anchor P10 (reference CSS for actions, cards, cover, reduced motion):

```css
/* SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/bundle-page.css:33-58,124-144,176-179 */
.sp-btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); height: 44px; padding: 0 18px; ... transition: background-color 150ms, border-color 150ms, color 150ms, transform 150ms; }
.sp-card.is-link:hover, .sp-card.is-link:focus-within, .sp-card.is-hover { transform: translateY(-3px); border-color: var(--accent); }
.sp-cover-ph { ... background: radial-gradient(circle at 70% 30%, var(--accent-glow), transparent 60%), radial-gradient(var(--grid-dot) 1px, transparent 1.5px) 0 0 / 16px 16px, var(--bg-hover); }
@media (prefers-reduced-motion: reduce) { .sp-card, .sp-card-cover > * { transition: none; } .sp-card.is-link:hover, .sp-card.is-link:focus-within { transform: none; } }
```

Tasks 5, 9 copy this. The other `sp-*` rule blocks (lines 60-174) are ported by the tasks naming them.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/assets/photo-placeholder-body.svg` | CREATE | The 900 x 1600 silhouette photo placeholder `profile.photo` points at |
| `src/components/page/resolve-asset.ts` | CREATE | Maps `profile.photo` / `project.cover` string paths to built URLs via `import.meta.glob`, no schema change |
| `src/strings.ts` | UPDATE | Add missing interface copy (menu nav label, footer year); existing keys untouched |
| `src/components/page/Icon.tsx` | UPDATE | Extend with `arrowUpRight`, `arrowLeft`, `menu`, `x` and the filled `github` / `linkedin` brand glyphs |
| `src/components/page/cx.ts` | CREATE | One tiny class-join helper shared by the new components |
| `src/components/page/Button.tsx`, `TextLink.tsx`, `IconLink.tsx`, `Actions.css` | CREATE | Actions: buttons and links |
| `src/components/page/Tag.tsx`, `StatusBadge.tsx`, `StackChip.tsx`, `StackGroup.tsx`, `Labels.css` | CREATE | Small labelled elements and the stack group |
| `src/components/page/SectionHeading.tsx`, `SectionHeading.css`, `Prose.tsx`, `Prose.css` | CREATE | Section headings and prose body |
| `src/components/page/Photo.tsx`, `Photo.css` | CREATE | Cutout photo, built state only |
| `src/components/page/ProjectCard.tsx`, `CoverPlaceholder.tsx`, `ProjectCard.css` | CREATE | Project card with CSS cover placeholder |
| `src/components/page/NavBar.tsx`, `MobileMenu.tsx`, `NavBar.css` | CREATE | Sticky nav and static popover menu |
| `src/components/page/Footer.tsx`, `ProjectHeader.tsx`, `Footer.css`, `ProjectHeader.css` | CREATE | Footer and project page header |
| `src/pages/phase4-preview.astro` | CREATE then DELETE (Task 12) | Temporary build-time harness that renders every component once; removed in the same task |

## NOT Building (Scope Limits)

- The sections (`src/sections/`), the home page and project pages, and the 404 (phases 5 and 6); components are built to be composed there.
- The `⌘K` nav button, Command Palette, scroll-spy, view transitions and the `?` shortcut list (Stage 5).
- The footer build summary and the Replay button (Stage 3 runtime).
- Any build-layer component, pending, skeleton, ASCII or select state (Stage 3 and 4); `Photo` has the built state only.
- The optional close-on-link script for the mobile menu (phase 5 may add it).
- Real photo and real project covers (Stage 4 and owner content); GitHub star counts.
- Test files: static-render tests are authored afterwards by the test pair, never by the Implementer. No existing test is modified.
- Any schema change for `profile.photo` or `project.cover`.

## Step-by-Step Tasks

Every task is validated from the worktree root (`C:/repos/site-pro/.worktrees/stage-2-foundation/`). `pnpm exec eslint` and `pnpm exec prettier --check` exit non-zero on any violation; `pnpm check` runs `astro check` and exits non-zero on a type error.

### Task 1: CREATE src/assets/photo-placeholder-body.svg

- **ACTION**: Draw a neutral standing full-body silhouette (no face detail, no identifying features) as an SVG with `width="900"`, `height="1600"` and `viewBox="0 0 900 1600"`, on a transparent background (no background rect), filled with a gray gradient (`linearGradient`) that stays readable on both the Midnight and Daylight backgrounds (mid-gray stops, neither near-black nor near-white). The silhouette stands on the bottom edge of the box. Colors inside this file are allowed (src/assets/ is exempt from the token check). Delivers AC-A6.
- **MIRROR**: Pattern 8 (`# SOURCE: ...components-page.tsx:214-269`), the `cutout` shape (9:16, standing on the bottom edge).
- **VALIDATE**: `node -e 'const s=require("fs").readFileSync("src/assets/photo-placeholder-body.svg","utf8");if(!/<svg[^>]*viewBox="0 0 900 1600"/.test(s)||!/width="900"/.test(s)||!/height="1600"/.test(s)||!/linearGradient/.test(s)||/<rect[^>]*width="(100%|900)"[^>]*height="(100%|1600)"/.test(s)){console.error("photo placeholder SVG invariants failed");process.exit(1)}'`

### Task 2: CREATE src/components/page/resolve-asset.ts

- **ACTION**: Export `resolveAssetUrl(path: string | undefined): string | undefined`. Module level: `const assets = import.meta.glob<string>('/src/assets/**/*', { eager: true, query: '?url', import: 'default' });` (a static string literal, as Vite requires). The function normalizes the input by prepending `/` when missing (profile.json stores `src/assets/photo-placeholder-body.svg` with no leading slash, glob keys start with `/src/assets/`) and returns `assets[normalized]`, or `undefined` when absent (callers then fall back to the CSS cover placeholder; no throw). No `any`. Wires `profile.photo` to the SVG from Task 1 without a schema change. Delivers AC-A6.
- **MIRROR**: Pattern 1 (typed named export, strict types) and the phase 3 promise cited in Mandatory Reading (`...phase-3...plan.md:233-243`).
- **VALIDATE**: `pnpm exec eslint src/components/page/resolve-asset.ts && pnpm exec prettier --check src/components/page/resolve-asset.ts && pnpm check`

### Task 3: UPDATE src/strings.ts

- **ACTION**: Add only the keys the new components need, each as a plain English string without em dashes: `nav.menuAriaLabel: 'Sections'` (accessible name of the menu's `<nav>`) and `footer.year: '2026'`. Keep every existing key and the `as const` export unchanged. The copyright line is composed by Footer from `footer.year` and the `owner` prop (`profile.name`), so no copyright text is added. Never write the string `Switch to the` outside this file's existing keys. Delivers AC-A2.
- **MIRROR**: Pattern 2 (components read copy from `strings`); the existing `nav` and `footer` blocks in `src/strings.ts:1-59`.
- **VALIDATE**: `pnpm exec prettier --check src/strings.ts && pnpm check && pnpm test`

### Task 4: UPDATE src/components/page/Icon.tsx

- **ACTION**: Extend `IconName` to `'sun' | 'moon' | 'arrowUpRight' | 'arrowLeft' | 'menu' | 'x' | 'github' | 'linkedin'`. Lucide glyphs (`arrowUpRight`, `arrowLeft`, `menu`, `x`) go in the existing stroke map with the exact paths from the reference (`components-page.tsx:22-26`); `github` and `linkedin` are Simple Icons single-path glyphs (reference `components-page.tsx:33-38`) rendered in a second branch with `fill="currentColor"` and no stroke attributes. Keep `sun` and `moon` output byte-identical: ThemeToggle still renders exactly 2 `aria-hidden` svgs. Keep `aria-hidden="true"` and `focusable="false"` on all. Delivers AC-A2 and AC-A10.
- **MIRROR**: Pattern 1, `# SOURCE: .worktrees/stage-2-foundation/src/components/page/Icon.tsx:1-51`.
- **VALIDATE**: `pnpm exec eslint src/components/page/Icon.tsx && pnpm exec prettier --check src/components/page/Icon.tsx && pnpm check && pnpm test`

### Task 5: CREATE Button, TextLink, IconLink, cx and Actions.css

- **ACTION**: `cx.ts` exports `cx(...names: Array<string | false | null | undefined>): string` (filter Boolean, join with a space). `Button.tsx`: props `variant?: 'primary' | 'secondary' | 'ghost'`, `icon?: IconName`, `iconEnd?: IconName`, `external?: boolean`, `href?: string`, `disabled?: boolean`, `children: React.ReactNode`, `className?: string`; typed with a discriminated union or intersection with `React.AnchorHTMLAttributes` / `React.ButtonHTMLAttributes` so no `any` is needed. With `href` and not disabled it renders `<a class="sp-btn sp-btn-<variant> text-sm ...">`; external anchors add `target="_blank"` and `rel="noopener noreferrer"` and the trailing `arrowUpRight` icon with class `sp-btn-end`; otherwise a `<button type="button">`. `TextLink.tsx`: `<a class="sp-link ...">` with an `arrowUpRight` icon of class `sp-link-ext` when `external` (same `target`/`rel`). `IconLink.tsx`: `<a class="sp-icon-btn ..." aria-label={label} title={label}>` containing `<Icon size={18}>`; it reuses `.sp-icon-btn` from ThemeToggle.css and, to stay self-contained, imports `./ThemeToggle.css` (the rule is not redefined). `Actions.css` ports `bundle-page.css:33-51` (`.sp-btn*`, `.sp-link*`) with tokens only; transitions 150 ms; add a `prefers-reduced-motion: reduce` block that sets `transition: none` on `.sp-btn`. Do not restyle `:focus-visible` (base.css owns the 2px accent ring). Delivers AC-A1, AC-A4, AC-A5.
- **MIRROR**: Pattern 5 (reference actions), Pattern 2 (file shape, sibling CSS import first), Pattern 3 (`.sp-icon-btn` is shared, not redefined), Pattern 10 (`.sp-btn`, `.sp-link` rules).
- **VALIDATE**: `pnpm exec eslint src/components/page/cx.ts src/components/page/Button.tsx src/components/page/TextLink.tsx src/components/page/IconLink.tsx && pnpm exec prettier --check src/components/page/cx.ts src/components/page/Button.tsx src/components/page/TextLink.tsx src/components/page/IconLink.tsx src/components/page/Actions.css && pnpm check`

### Task 6: CREATE Tag, StatusBadge, StackChip, StackGroup and Labels.css

- **ACTION**: `Tag`: `<span class="sp-tag mono-xs">`. `StackChip`: `<span class="sp-chip mono-sm">`. `StatusBadge`: props `status: ProjectStatus` where `type ProjectStatus = Project['status']` is imported with `import type { Project } from '../../content-schemas'`; renders `<span class="sp-status sp-status-<key> mono-xs">` where `<key>` is `status.replace(' ', '-')` (so `in development` gives `sp-status-in-development`) with `<i class="sp-status-dot" aria-hidden="true">` before the visible status text. `StackGroup`: props `name: string`, `items: readonly string[]`; renders `<div class="sp-stack"><h3 class="sp-stack-name mono-xs">` and `<ul class="sp-stack-list">` with one `<li>` per item holding a `StackChip`, in the given order (list keys are the items). `Labels.css` ports `bundle-page.css:93-107` (`.sp-tag`, `.sp-status*`, `.sp-chip`, `.sp-stack*`) with tokens only. Delivers AC-A2, AC-A1.
- **MIRROR**: Pattern 7 (reference Tag, StatusBadge, StackGroup), Pattern 2 (file shape).
- **VALIDATE**: `pnpm exec eslint src/components/page/Tag.tsx src/components/page/StatusBadge.tsx src/components/page/StackChip.tsx src/components/page/StackGroup.tsx && pnpm exec prettier --check src/components/page/Tag.tsx src/components/page/StatusBadge.tsx src/components/page/StackChip.tsx src/components/page/StackGroup.tsx src/components/page/Labels.css && pnpm check`

### Task 7: CREATE SectionHeading, Prose and their CSS

- **ACTION**: `SectionHeading`: props `title: string`, `id?: string`, `eyebrow?: { index: string; name: string }` (matching `strings.sections.*.eyebrow`), `lead?: string`, `as?: 'h1' | 'h2' | 'h3'` default `'h2'`, `className?`. Renders `<div class="sp-heading">` with `<p class="sp-eyebrow mono-xs">` (index in `<span class="sp-eyebrow-num">`, then ` / `, then name) when an eyebrow is given, the heading element with `class="sp-heading-title text-3xl"` and the `id`, and `<p class="sp-heading-lead text-lg">` when `lead` is given. `Prose`: `<div class="sp-prose text-md ...">{children}</div>`. `SectionHeading.css` ports `bundle-page.css:87-91`; `Prose.css` ports `bundle-page.css:161-174` (tokens only; the heading font sizes in `.sp-prose h2` / `h3` are plain length values, not colors). Delivers AC-A2, AC-A1.
- **MIRROR**: Pattern 7 (reference SectionHeading), Pattern 9 (reference Prose), Pattern 2.
- **VALIDATE**: `pnpm exec eslint src/components/page/SectionHeading.tsx src/components/page/Prose.tsx && pnpm exec prettier --check src/components/page/SectionHeading.tsx src/components/page/Prose.tsx src/components/page/SectionHeading.css src/components/page/Prose.css && pnpm check`

### Task 8: CREATE Photo and Photo.css

- **ACTION**: `Photo.tsx`: props `src: string`, `alt?: string` (default empty string, decorative), `height?: number`, `glow?: boolean`, `className?`; only the `cutout` shape and the built state exist (no `shape` or `state` prop). Renders `<div class="sp-photo is-cutout is-built ...">` containing `<img class="sp-photo-img" src alt width="900" height="1600">` with attributes in exactly that order (`class`, `src`, `alt`, `width`, `height`): the intrinsic 900 x 1600 dimensions reserve space and prevent layout shift. When `height` is given it is passed as the CSS variable `--photo-h` through `style` (cast `as React.CSSProperties`, as Backdrop does with `--glow-size`); no inline `width` or `height` style is written. `Photo.css`: `.sp-photo` has `aspect-ratio: 9 / 16` and `height: var(--photo-h, auto)`; `.sp-photo-img` fills it with `object-fit: contain; object-position: 50% 100%` and no radius or shadow; port `bundle-page.css:109-116` (cutout branch). Fixed px box sizes (960, 760, 480) belong to phase 5's hero CSS, not here. Delivers AC-A6.
- **MIRROR**: Pattern 8 (reference Photo), Pattern 4 (CSS variable through `style`), Pattern 10.
- **VALIDATE**: `pnpm exec eslint src/components/page/Photo.tsx && pnpm exec prettier --check src/components/page/Photo.tsx src/components/page/Photo.css && pnpm check`

### Task 9: CREATE ProjectCard, CoverPlaceholder and ProjectCard.css

- **ACTION**: `CoverPlaceholder.tsx`: `<div class="sp-cover-ph" aria-hidden="true"><span class="mono-sm">{label}</span></div>` (pure CSS, no image). `ProjectCard.tsx`: props `title`, `slug`, `year: string`, `summary`, `tags: readonly string[]`, `status: ProjectStatus` (as in Task 6), `repo?: string`, `cover?: string` (an already resolved URL), `className?`. Renders `<article class="sp-card is-link ...">` with `.sp-card-cover` holding `<img src={cover} alt="">` when `cover` is set, else `<CoverPlaceholder label={slug} />`; the title is `<h3 class="sp-card-title text-xl"><a class="sp-card-link" href={`/projects/${slug}`}>{title}</a></h3>`; then year (`sp-card-year mono-xs`), summary (`sp-card-summary text-md`), tags (`Tag` in `.sp-card-tags`), and a foot with `StatusBadge` and, when `repo` is set, `<TextLink className="sp-card-repo text-sm" href={repo} external>` whose text is `strings.projects.repoShortcut` (rendered class string is exactly `sp-link sp-card-repo text-sm`). `ProjectCard.css` ports `bundle-page.css:124-144` and the reduced-motion block `176-179`: hover and focus-within lift (`translateY(-3px)`, accent border, 1.03 cover zoom) with 200 ms and 300 ms transitions, and under `prefers-reduced-motion: reduce` no transition and no transform. Animate only `transform`, `opacity`, `clip-path` and border color; cover and card sizes come from `aspect-ratio`, never from animated layout properties. Delivers AC-A7, AC-A5, AC-A4.
- **MIRROR**: Pattern 8 (reference CoverPlaceholder and ProjectCard), Pattern 10 (card, cover and reduced-motion rules), Pattern 2.
- **VALIDATE**: `pnpm exec eslint src/components/page/CoverPlaceholder.tsx src/components/page/ProjectCard.tsx && pnpm exec prettier --check src/components/page/CoverPlaceholder.tsx src/components/page/ProjectCard.tsx src/components/page/ProjectCard.css && pnpm check`

### Task 10: CREATE NavBar, MobileMenu and NavBar.css

- **ACTION**: Export a constant `MOBILE_MENU_ID = 'mobile-menu'` from `MobileMenu.tsx`. `MobileMenu`: props `githubHref: string`, `linkedinHref: string`, `active?: string` (a link id), `className?`. Renders `<div id="mobile-menu" popover="auto" class="sp-menu ...">` containing `<nav aria-label={strings.nav.menuAriaLabel}><ul>` with one `<li><a class="sp-menu-link" href="#<id>">` per `strings.nav.links` entry (`<span class="sp-menu-num mono-xs">{index}</span><span class="text-xl">{label}</span>`, plus `aria-current="true"` when active), then `.sp-menu-foot` with two secondary `Button`s: GitHub and LinkedIn (text from `strings.buttons`, `external`). Static HTML only: no `useState`, no handlers, no client directive; `popover="auto"` gives light dismiss and `Esc` with focus return natively. `NavBar`: props `githubHref: string`, `linkedinHref: string`, `active?: string`, `className?`. Renders `<header class="sp-nav ..."><div class="sp-nav-inner">` with `<a class="sp-nav-name" href="#top">{strings.nav.brand}</a>`; `<nav class="sp-nav-links text-sm" aria-label={strings.nav.ariaLabel}>` with `<a class="sp-nav-link" href="#<id>">` for each link; `.sp-nav-actions` with the existing `ThemeToggle`, `IconLink` (GitHub icon, label `strings.buttons.github`) and a `<button type="button" popoverTarget={MOBILE_MENU_ID} class="sp-icon-btn sp-menu-toggle" aria-label={strings.nav.openMenu}>` holding `<Icon name="menu" size={20}>`; then `<MobileMenu>`. There is NO `⌘K` or palette button. `NavBar.css` ports `bundle-page.css:60-71,78-84`: `.sp-nav-links` and `.sp-menu-link` hidden from the layout below 768 px (`@media (max-width: 767px)`), `.sp-menu-toggle` and `.sp-menu` not shown from 768 px up (`@media (min-width: 768px)`), the popover positioned under the nav (`position: fixed; inset: var(--nav-height) 0 auto 0; margin: 0`), nav-link color transition 150 ms, tokens only; keep the focus ring from base.css (no `outline: none`). Hrefs come from props, never hardcoded in the component (no email, `mailto:`, `tel:` or `<form>`). Delivers AC-A3, AC-A4, AC-A8.
- **MIRROR**: Pattern 6 (reference NavBar and MobileMenu, minus the `⌘K` button), Pattern 3 (`.sp-icon-btn`), Pattern 2.
- **VALIDATE**: `pnpm exec eslint src/components/page/NavBar.tsx src/components/page/MobileMenu.tsx && pnpm exec prettier --check src/components/page/NavBar.tsx src/components/page/MobileMenu.tsx src/components/page/NavBar.css && pnpm check && if grep -nE "⌘K|command palette|onClick" src/components/page/NavBar.tsx src/components/page/MobileMenu.tsx; then echo "FAIL: forbidden nav control or handler"; exit 1; else echo "PASS: no palette button or handlers"; fi`

### Task 11: CREATE Footer, ProjectHeader and their CSS

- **ACTION**: `Footer`: props `sourceHref: string`, `owner: string`, `className?`. Renders `<footer class="sp-footer text-sm ..."><div class="sp-footer-inner"><p class="sp-footer-meta">` with `<TextLink href={sourceHref} external>{strings.footer.source}</TextLink>` and `<span>{`© ${strings.footer.year} ${owner}`}</span>` (one template string so the copyright is a single text node). No build summary, no Replay, no button. `ProjectHeader`: props `title`, `slug`, `summary`, `year`, `status: ProjectStatus`, `tags: readonly string[]`, `repo?: string`, `cover?: string`, `backHref?: string` (default `'/#projects'`). Renders `<header class="sp-project-header">` with a back `TextLink` (`class` contains `sp-back`, icon `arrowLeft`, text `strings.projects.backToProjects`), the `<h1 class="sp-project-title text-3xl">`, summary, a meta row with year, `StatusBadge` and `Tag`s, a `Button variant="secondary" icon="github" external` named `strings.projects.repo` when `repo` is set, and the cover (`<img alt="">` or `CoverPlaceholder label={slug}`). `Footer.css` ports `bundle-page.css:146-150` (and the 767 px side-padding rule at line 149 for the footer); `ProjectHeader.css` ports `152-159`. Tokens only. Delivers AC-A7, AC-A8, AC-A2.
- **MIRROR**: Pattern 9 (reference Footer, ProjectHeader), Pattern 2.
- **VALIDATE**: `pnpm exec eslint src/components/page/Footer.tsx src/components/page/ProjectHeader.tsx && pnpm exec prettier --check src/components/page/Footer.tsx src/components/page/ProjectHeader.tsx src/components/page/Footer.css src/components/page/ProjectHeader.css && pnpm check && if grep -niE "replay|built live" src/components/page/Footer.tsx; then echo "FAIL: build summary or Replay in Footer"; exit 1; else echo "PASS: footer has no build summary or Replay"; fi`

### Task 12: Static-render harness, then remove it

- **ACTION**: Create the temporary `src/pages/phase4-preview.astro` that imports `Base`, `NavBar`, `SectionHeading`, `Photo`, `ProjectCard`, `StackGroup`, `ProjectHeader`, `Prose`, `Footer` and `resolveAssetUrl`, and renders each once with literal props and no `client:*` directive: NavBar (`githubHref="https://github.com/fabiombarreto"`, `linkedinHref="https://www.linkedin.com/in/fabio-martins-barreto"`), a SectionHeading with `id="about-title"`, a Photo whose `src` is `resolveAssetUrl('src/assets/photo-placeholder-body.svg')`, a ProjectCard (`slug="relay"`, `title="relay"`, `repo="https://github.com/fabiombarreto/PRPs-agentic-eng"`, status `active`, no cover), a StackGroup, a ProjectHeader, a Prose, a Footer (`sourceHref="https://github.com/fabiombarreto/site-pro"`, `owner="Fabio Barreto"`). Build, assert the semantic HTML in the built page, then DELETE the harness page and rebuild so the final diff contains no preview page. Delivers AC-A2, AC-A3, AC-A6, AC-A7, AC-A8, AC-A9.
- **MIRROR**: Pattern 2 (components consumed with no client directive, as `src/pages/index.astro` does) and the static-render intent of `tests/unit/theme-helpers.test.ts:49-62` (statically rendered output asserted on its HTML).
- **VALIDATE**: `set -euo pipefail; pnpm build; f=dist/phase4-preview/index.html; grep -q 'popovertarget="mobile-menu"' "$f"; grep -q 'id="mobile-menu"' "$f"; grep -q 'popover="auto"' "$f"; grep -q 'aria-label="Open the menu"' "$f"; grep -q 'href="#about"' "$f"; grep -q 'href="/projects/relay"' "$f"; grep -q 'class="sp-link sp-card-repo text-sm"' "$f"; grep -q 'href="https://github.com/fabiombarreto/PRPs-agentic-eng"' "$f"; grep -q '© 2026 Fabio Barreto' "$f"; grep -Eq 'class="sp-photo-img" src="(/_astro/|data:image/svg)[^"]*" alt="" width="900" height="1600"' "$f"; if grep -Eiq 'mailto:|tel:|<form|Replay|Built live' "$f"; then echo "FAIL: forbidden markup"; exit 1; fi; rm src/pages/phase4-preview.astro; pnpm build; test ! -e dist/phase4-preview/index.html`

## Validation Commands

Run from the worktree root. Levels 1-3 only; each block exits non-zero on any failure.

**Level 1 STATIC_ANALYSIS**

```bash
set -euo pipefail
pnpm lint
pnpm format:check
pnpm check
```

**Level 2 CONTENT_INVARIANTS AND UNIT_TESTS** (the existing 103 unit tests must stay green and unmodified; no test file is in the diff)

```bash
set -euo pipefail
pnpm test
# AC-9: no color or box-shadow literal in the new or changed component files and strings
if grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|box-shadow[[:space:]]*:[[:space:]]*[^v[:space:]]' src/components/page/*.css src/components/page/*.tsx src/components/page/*.ts src/strings.ts; then echo "FAIL: raw color or shadow literal"; exit 1; else echo "PASS: tokens only"; fi
# every var(--x) used by the page CSS is defined in tokens.css, base.css or fonts.css
node -e 'const fs=require("fs");const defs=["tokens","base","fonts"].map(n=>fs.readFileSync("src/styles/"+n+".css","utf8")).join("\n");const local=["--glow-size","--photo-h"];const bad=[];for(const f of process.argv.slice(1)){const src=fs.readFileSync(f,"utf8");const own=new Set([...src.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));for(const m of src.matchAll(/var\(\s*(--[\w-]+)/g)){if(!defs.includes(m[1]+":")&&!local.includes(m[1])&&!own.has(m[1]))bad.push(f+" "+m[1]);}}if(bad.length){console.error("undefined tokens: "+bad.join(", "));process.exit(1)}' src/components/page/*.css
```

**Level 3 INTEGRATION**

```bash
set -euo pipefail
pnpm build
# total CSS stays within the 25 KB gzip budget (25 KB = 25 * 1024 bytes)
bytes=$(find dist -name '*.css' -print0 | xargs -0 cat | gzip -c | wc -c)
echo "css gzip bytes: $bytes"
test "$bytes" -le 25600
# the temporary harness page is gone and the existing e2e suite still passes
test ! -e src/pages/phase4-preview.astro
pnpm test:e2e
```

## Acceptance Criteria

- **AC-A1 (PRD AC-9):** Every new `.css`, `.tsx` and `.ts` file under `src/components/page/` and `src/strings.ts` contains no color literal and no `box-shadow` literal; every color, radius and shadow in component styles is a `var(--…)` token that exists in the token files; the photo SVG carries its own gradient colors because `src/assets/` is exempt.
- **AC-A2 (PRD AC-1, AC-14):** Each of NavBar, MobileMenu, SectionHeading, Button, TextLink, IconLink, Tag, StatusBadge, Photo, ProjectCard, StackGroup, StackChip, Footer, ProjectHeader and Prose renders to its expected semantic HTML with no client directive and no `any` in its props: headings as headings, lists as lists, links as `<a href>`, the card title linking to `/projects/<slug>`.
- **AC-A3 (PRD AC-6):** MobileMenu is static `popover="auto"` markup with id `mobile-menu`, opened by a real `<button popovertarget="mobile-menu">` named "Open the menu" that works without JavaScript; it shows the four numbered links (About, Projects, Stack, Contact) and the GitHub and LinkedIn buttons; NavBar shows the section links inline from 768 px and the menu button below it.
- **AC-A4 (PRD AC-3):** Every interactive element is a real link or button and no component overrides the global 2px `--accent` focus ring (no `outline: none` in component CSS).
- **AC-A5 (PRD AC-12):** The only transitions are hover and focus micro-interactions of 150 to 300 ms animating `transform`, `opacity` or color; under `prefers-reduced-motion: reduce` the card lift and cover zoom do not run.
- **AC-A6 (PRD AC-13):** `src/assets/photo-placeholder-body.svg` is a 900 x 1600 (9:16) transparent-background silhouette that reads on both themes; `Photo` renders it at the `cutout` shape with explicit 900 x 1600 attributes and a 9:16 box; `resolveAssetUrl('src/assets/photo-placeholder-body.svg')` returns a URL, so `profile.photo` resolves with no schema change.
- **AC-A7 (PRD AC-14):** ProjectCard renders the title link to `/projects/<slug>`, the year, summary, tags, status badge, a `repo ↗` external link and a CSS cover placeholder labelled with the slug; ProjectHeader renders the "All projects" back link to `/#projects`, the `<h1>`, summary, year, status, tags, a "Repo" external link and the cover placeholder.
- **AC-A8 (PRD AC-8):** No new markup contains an email address, `mailto:`, `tel:` or `<form>`; Footer shows only `Source ↗` and "© 2026 <owner>", with no build summary and no Replay; NavBar has no `⌘K` button.
- **AC-A9 (PRD AC-10):** Total built CSS stays at or under 25 KB gzip.
- **AC-A10 (PRD AC-4, AC-7):** The existing unit and e2e suites (theme toggle, Backdrop, content copy and schemas) stay green with no test file changed; ThemeToggle still renders two decorative svgs.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `import.meta.glob` with `query: '?url'` behaves differently under Astro and under Vitest (no Astro plugin), or Vite inlines the small SVG as a `data:` URI | M | M | Task 12 builds through Astro and accepts both a `/_astro/` URL and a `data:image/svg` URI; Photo takes an already resolved `src` string, so component tests never depend on the glob; the resolver returns `undefined` instead of throwing |
| Glob key normalization: `profile.json` stores `src/assets/…` with no leading slash while glob keys start with `/src/assets/` | M | M | `resolveAssetUrl` prepends `/` when missing; Task 12 exercises exactly the stored path |
| `popover` plus `popovertarget` without JavaScript was not confirmed by a fetched source (research gap), and ARIA guidance for nav popovers conflicts between sources | M | M | Native declarative behavior only (no custom JS); the menu keeps a real `<nav>` with an accessible name; the test pair and phase 7's axe matrix verify it with the menu open |
| A reference style uses a token name that docs/03 or phase 2 renamed | L | M | Level 2 checks every `var(--…)` against `tokens.css`, `base.css` and `fonts.css` |
| Raw hex or shadow sneaks in while porting CSS | L | H | Level 2 token grep over all new component files; docs/03 wins on any difference |
| Hover lift or cover zoom shifts layout or runs under reduced motion | L | M | Only `transform` and border color animate, sizes come from `aspect-ratio`, and a reduced-motion block removes both |
| CSS budget creeps up before phase 5 adds more | L | L | Level 3 measures total gzip CSS against the 25 KB budget (about 2.4 KB before this phase) |
| research-codebase hit its scope cap and did not read some docs (docs/03 hero and Photo positioning values) | M | L | The positions belong to phase 5; docs/03 is listed as P1 Mandatory Reading for sizes and states |

## Notes

- **Test-file routing:** this phase's test-file creation and updates are
  routed through the `test-writer`/`test-reviewer` pair's lifecycle
  ledger (`/relay-write-test` → `/relay-test-write-review`), not authored
  by the Implementer — R-X is a blanket straight-fail on any test glob in
  the Implementer's diff. No task below and no `## Files to Change` row
  targets a test file, so this plan's `**VALIDATE**` commands exercise the
  change directly rather than invoking the test framework.
- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- The existing suites are run (Level 2 `pnpm test`, Level 3 `pnpm test:e2e`) only as a regression guard; running them is not authoring tests.
- Reuse over duplication: `Icon`, `ThemeToggle` and `Backdrop` from phase 2 are not rewritten; `Icon` only gains glyphs, with `sun` and `moon` output unchanged. `.sp-icon-btn` stays defined once, in `ThemeToggle.css`.
- Differences from the reference are deliberate and come from the PRD: no `⌘K` button, no palette, a static popover menu, a footer without the build summary and Replay, strings from `src/strings.ts`, and a `Photo` without skeleton or ASCII states. The reference nav label "Sections" is kept only for the menu's own `<nav>` (`strings.nav.menuAriaLabel`); the bar's `<nav>` keeps `strings.nav.ariaLabel` ("Main").
- The Task 12 harness page exists only inside that task and is removed in the same command; the final diff must not contain `src/pages/phase4-preview.astro`.
- Research notes: research-web found no fetched source confirming popover behavior with JavaScript disabled; native `popover="auto"` is documented to give light dismiss and `Esc` with focus return. research-codebase did not find any existing `import.meta.glob` use; the resolver is new.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
