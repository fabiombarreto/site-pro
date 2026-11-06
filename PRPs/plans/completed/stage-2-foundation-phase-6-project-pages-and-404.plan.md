# Feature: Project pages and 404 (Phase 6 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: reuse of existing components (the phase-4 page components composed into two new pages); impact on shared UI (NavBar and MobileMenu hrefs, base layout skip-target contract); cross-cutting patterns (design tokens, centralized interface copy in src/strings.ts, content collections as the only copy source); business rules for navigation (N1, N5, N10, N11, N13), content (C1-C16, C15 relay fork note) and visual-design (V1-V16); hosting contract under D9 (404 served by `not_found_handling`); business rules for build only as an out-of-scope boundary (no build layer in this phase)
- Decisions found:
  - D2 Astro + React + TypeScript strict: React page components render to static HTML without a client directive; plain-TypeScript scripts live outside React
  - D1 English only; interface copy from src/strings.ts, page copy from the content collections
  - D5 Internal project pages /projects/<slug> with a direct repo shortcut on cards (this phase builds the pages the cards already link to)
  - D9 Cloudflare Workers Static Assets with `not_found_handling: "404-page"` (already in wrangler.jsonc): the 404 status is served by the host once dist/404.html exists
  - D4 Essential sections only; project pages and a plain 404 are in v1 scope; Stage 2 PRD approved 2026-11-05: header-only project pages (body only where the entry has one), plain page-register 404 ("Page not found.", "Go home"), no previous/next links (Could), no view transition, no ENOENT window
  - Presentation-only scope and the privacy list: GitHub and LinkedIn are the only profile links; no form, mailto or tel
  - Test-after methodology (`tdd: false`, vitest + playwright): the Implementer's diff contains no test files and edits no existing test
- Applicable anti-patterns:
  - Raw values instead of tokens (no color or box-shadow literals outside src/styles/tokens.css and src/assets/)
  - Mixing the two registers (no code look or build-layer markup on the page)
  - Layout-shifting animation and generic fade-up reveals (no animation of any kind in this phase)
  - Hiding pending content with display or visibility (no pending states, no `data-build`)
  - Publishing private data; a contact form or public email
  - Scope creep into v1 (no prev/next links, no view transition, no ENOENT window, no OG/JSON-LD/canonical; those are Stage 5-6)
  - Weakening tests to get a green run (existing tests are neither edited nor deleted by the Implementer)
- Applicable architectural rules:
  - Pages are `.astro` files in `src/pages/`; page components stay in `src/components/page/`; shared page-level helpers live beside the sections in `src/sections/`
  - Static by default: no `client:*` directive; every page is complete HTML that works without JavaScript
  - Plain CSS with token custom properties; responsive values are CSS at the three breakpoints, no layout JavaScript
  - Budgets: CSS <= 25 KB gzip total, total JS <= 90 KB gzip, inline head JS <= 20 KB gzip; WCAG 2.2 AA with the global 2px `--accent` focus ring
  - Every page using `Base.astro` renders `<main id="main" tabindex="-1">` (skip-target contract from phase 5)
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-2-foundation.prd.md` — Implementation Phases row 6: "Project pages and 404" — Goal: Every link on the site resolves; unknown paths get a real 404. — Success signal: AC-14 passes; AC-5 passes on these pages.

## Summary

Add the two routes the finished home page already points at. `src/pages/projects/[slug].astro` builds one static page per entry of the `projects` collection (`getStaticPaths` over the four entries): NavBar, `ProjectHeader` (back link "All projects" to `/#projects`, `<h1>` title, summary, year, status, tags, "Repo" external link, cover placeholder labelled with the slug), the entry's Markdown body inside `Prose` only when the entry has one (relay: the fork note), and the `Footer`. `src/pages/404.astro` is a plain page-register not-found page ("Page not found." heading, "Go home" link to `/`, NavBar and Footer); Astro emits it as `dist/404.html`, which Workers `not_found_handling: "404-page"` (and `astro preview`) serves with status 404. Because the existing `NavBar`/`MobileMenu` emit bare same-page hashes (`#about`), which are dead on any other page, both components gain an optional `homeHref` prop (default `''`, so the home page and its existing tests are unchanged) that the new pages set to `/`. A small `src/sections/site-chrome.ts` helper loads the profile, the two profile links and the Footer source link, and builds per-page titles; a small `src/styles/subpages.css` provides the container and 404 layout, tokens only.

## User Story

As a visitor (and as the site owner who builds Stage 3 on top of this site)
I want every link on the site to land on a real, accessible page and unknown URLs to show a clear 404
So that the site is navigable without dead ends before the build runtime is added.

## Problem Statement

The home page (phase 5) links every project card to `/projects/<slug>`, but no such page exists, and an unknown path has no 404 document, so links break and AC-14 and the "page loads with HTTP 200" clause of AC-2 cannot be met. The nav and menu also use bare `#section` hashes that only resolve on the home page.

## Solution Statement

`[slug].astro` reads the collection in `getStaticPaths` (`params.slug` = the entry `id`, the same value `Projects.astro` uses for the card link), passes the entry as a prop, and renders `ProjectHeader` with the entry's data, mapping `data.links.repo` to `repo` and `resolveAssetUrl(data.cover)` to `cover` exactly as `Projects.astro` does. When `entry.body` is non-empty it calls `render(entry)` (Astro 6: a standalone function, `entry.render()` was removed) and places `<Content />` inside `<Prose>`; empty bodies render no `Prose`. `404.astro` shares the same Base, Backdrop, NavBar, Footer wrapper as the home page. `NavBar`/`MobileMenu` prefix their hash links with `homeHref`. Titles are `<label> - <profile headline without trailing period>`; descriptions are the project summary and the profile subtitle respectively. No new string keys are added: the 404 copy and "All projects"/"Repo" already live in `src/strings.ts`.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (two routes) |
| Complexity | MEDIUM (dynamic route, one shared-component prop, status verified in a real server) |
| Systems Affected | src/pages (new), src/sections (new helper), src/styles (new), src/components/page/NavBar.tsx, src/components/page/MobileMenu.tsx |
| Dependencies | Phases 1-5 (all complete): layout, tokens, content collections, strings, page components, home page; no new package |
| Estimated Tasks | 5 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md:212-215` (Phase 6 details), AC-2 at line 63, AC-5 at line 66, AC-14 at line 75 |
| phase_type | feature |

## Mandatory Reading

All source paths below are relative to the worktree root `C:/repos/site-pro/.worktrees/stage-2-foundation/` (where the implementation and every command in this plan run), except the first row.

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `C:/repos/site-pro/PRPs/prds/stage-2-foundation.prd.md` | 63, 66, 75, 212-215 | AC-2 (project pages load with 200), AC-5, AC-14 and the Phase 6 scope |
| P0 | `src/pages/index.astro` | 1-46 | The page wrapper (Base > sp-page > Backdrop > sp-page-content > NavBar + main + Footer) and the data-loading idiom to mirror |
| P0 | `src/layouts/Base.astro` | 1-61 | Props `title`/`description`; skip link targets `#main`, so each page supplies `<main id="main" tabindex="-1">` |
| P0 | `src/components/page/NavBar.tsx` | 1-70 | Bare `#top`/`#id` hrefs to prefix; passes props into MobileMenu |
| P0 | `src/components/page/MobileMenu.tsx` | 1-61 | Same bare `#id` hrefs in the popover menu |
| P0 | `src/components/page/ProjectHeader.tsx` | 1-60 | Props and markup of the header this phase renders |
| P0 | `src/sections/Projects.astro` | 1-44 | How a collection entry maps onto card/header props (`slug={id}`, `repo={data.links.repo}`, `cover={resolveAssetUrl(data.cover)}`) |
| P0 | `src/strings.ts` | 48-56 | `projects.backToProjects` "All projects", `projects.repo` "Repo", `notFound.title` "Page not found.", `notFound.homeLink` "Go home" |
| P0 | `src/content/projects/relay.md` | 1-16 | The only entry with a body (the fork note); the other three bodies are empty |
| P1 | `src/sections/profile-links.ts` | 1-19 | Reused to get the GitHub/LinkedIn URLs |
| P1 | `src/components/page/Footer.tsx` | 1-29 | Footer props `sourceHref`, `owner` |
| P1 | `src/components/page/Prose.tsx` | 1-11 | Prose takes children only; `<Content />` goes in its slot |
| P1 | `src/components/page/CoverPlaceholder.tsx` | 1-15 | Placeholder markup (`div.sp-cover-ph` > `span` with the label) used by the header and asserted by validation |
| P1 | `src/components/page/Button.tsx` | 26-45 | Button `variant`/`href` props used for "Go home" |
| P1 | `src/components/page/ProjectHeader.css` | 1-56 | Header styles (grid, 16:9 cover) so the page CSS adds only the container |
| P1 | `src/styles/home.css` | 1-21 | `--gutter` and `.sp-section-inner` container values to mirror in `subpages.css` |
| P1 | `src/content.config.ts` | 10-13 | Projects collection loader (`glob` over `*.md`): entry id is the file basename |
| P1 | `wrangler.jsonc` | 4-7 | `not_found_handling: "404-page"` already set; nothing to change |
| P1 | `tests/unit/page-navigation.test.ts` | 37-40, 75, 89-99 | Existing assertions pinning the default bare-hash hrefs, which the default `homeHref=''` must keep green |

## Patterns to Mirror

```
# SOURCE: src/pages/index.astro:31-46
<Base title={title} description={description}>
  <div class="sp-page">
    <Backdrop glows={DEFAULT_GLOWS} />
    <div class="sp-page-content">
      <NavBar githubHref={links.github} linkedinHref={links.linkedin} />
      <main id="main" tabindex="-1">
        <Hero profile={profile} />
        <About profile={profile} />
        <Projects projects={projects} />
        <Stack stack={stackEntry.data} />
        <Contact profile={profile} />
      </main>
      <Footer sourceHref={sourceHref} owner={profile.name} />
    </div>
  </div>
</Base>
```
Copied by Tasks 4 and 5 (same wrapper; `main` keeps `id="main" tabindex="-1"`).

```
# SOURCE: src/components/page/NavBar.tsx:26-45
    <header className={cx('sp-nav', className)}>
      <div className="sp-nav-inner">
        <a className="sp-nav-name" href="#top">
          {strings.nav.brand}
        </a>
        <nav
          className="sp-nav-links text-sm"
          aria-label={strings.nav.ariaLabel}
        >
          {strings.nav.links.map((link) => (
            <a
              key={link.id}
              className={cx('sp-nav-link', active === link.id && 'is-active')}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
```
Copied by Task 1 (the three hash hrefs get the `homeHref` prefix; `MobileMenu.tsx:36` has the same `href={`#${link.id}`}` shape).

```
# SOURCE: src/sections/Projects.astro:28-39
      {projects.map(({ id, data }) => (
        <div class="sp-projects-cell">
          <ProjectCard
            title={data.title}
            slug={id}
            year={data.year}
            summary={data.summary}
            tags={data.tags}
            status={data.status}
            repo={data.links.repo}
            cover={resolveAssetUrl(data.cover)}
          />
        </div>
      ))}
```
Copied by Task 4 (entry `id` is the slug; the same field mapping feeds `ProjectHeader`).

```
# SOURCE: src/components/page/ProjectHeader.tsx:11-33
interface ProjectHeaderProps {
  title: string;
  slug: string;
  summary: string;
  year: string;
  status: ProjectStatus;
  tags: readonly string[];
  repo?: string;
  cover?: string;
  backHref?: string;
}

export function ProjectHeader({
  title,
  slug,
  summary,
  year,
  status,
  tags,
  repo,
  cover,
  backHref = '/#projects',
}: ProjectHeaderProps): React.JSX.Element {
```
Copied by Task 4 (props to supply; `backHref` default is already `/#projects`, so it is not passed).

```
# SOURCE: src/sections/profile-links.ts:11-19
export function profileLinks(profile: ProfileData): {
  github: string;
  linkedin: string;
} {
  return {
    github: urlFor(profile, 'github'),
    linkedin: urlFor(profile, 'linkedin'),
  };
}
```
Copied by Task 2 (the helper calls it and keeps the "throw on missing content" convention of `urlFor`).

```
# SOURCE: src/content.config.ts:10-13
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: projectSchema,
```
Copied by Task 4 (`getCollection('projects')` yields entries whose `id` is the file basename and whose `body` is the raw Markdown).

```
# SOURCE: src/components/page/Footer.tsx:6-16
interface FooterProps {
  sourceHref: string;
  owner: string;
  className?: string;
}

export function Footer({
  sourceHref,
  owner,
  className,
}: FooterProps): React.JSX.Element {
```
Copied by Tasks 2, 4 and 5 (the helper returns exactly these two values).

```
# SOURCE: src/styles/home.css:1-17
:root {
  --gutter: clamp(16px, 4vw, 32px);
}

.sp-section {
  padding: clamp(80px, 10vw, 128px) 0;
}

.sp-section-inner {
  box-sizing: border-box;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--gutter);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
```
Copied by Task 3 (container width, gutter and column gap values; `subpages.css` redefines the gutter under its own name so it does not depend on `home.css` being loaded).

## Files to Change

Worktree-relative paths.

| File | Action | Justification |
|------|--------|---------------|
| `src/components/page/NavBar.tsx` | UPDATE | Optional `homeHref` prop prefixing the brand and section hash links; forwarded to MobileMenu |
| `src/components/page/MobileMenu.tsx` | UPDATE | Same optional `homeHref` prop for the popover menu links |
| `src/sections/site-chrome.ts` | CREATE | One helper returning profile data, GitHub/LinkedIn URLs and the Footer source link, plus the page-title builder, shared by both new pages |
| `src/styles/subpages.css` | CREATE | Container and 404 layout for the two new pages, tokens only |
| `src/pages/projects/[slug].astro` | CREATE | The four header-only project pages (body only where present) |
| `src/pages/404.astro` | CREATE | The plain page-register not-found page emitted as `dist/404.html` |

## NOT Building (Scope Limits)

- Previous / next project links (Could in the PRD; not required to be navigable).
- View transitions between card and project page, the `ENOENT` 404 build window, scroll-spy, the Command Palette, `⌘K` and the `?` shortcut list (Stage 5).
- The build runtime and every build-layer element, `data-build` attribute or pending state (Stage 3).
- Real project covers and project body text beyond what the entries already hold (Stage 4 and owner-supplied content); the other three bodies stay empty.
- OG images, JSON-LD, sitemap, canonical URLs, `noindex` handling, analytics (Stage 6).
- GitHub star counts (C12); no build-time fetch.
- Any change to `wrangler.jsonc` (already `not_found_handling: "404-page"`), `src/strings.ts` or `src/content/` (no new copy is needed).
- The full CI quality gates, axe matrix in CI, privacy script and Lighthouse CI (Phase 7); this phase only runs ad-hoc equivalents as validation.
- Any new test file or edit to an existing test (test pair, after Code Review).
- Anything in v1.1 or post-v1.

## Step-by-Step Tasks

All commands run from the worktree root `C:/repos/site-pro/.worktrees/stage-2-foundation/` in Git Bash. After writing each file, format it with `pnpm exec prettier --write <file>`. `pnpm check` is gated on its own exit code (non-zero on any error); its output is never parsed.

### Task 1: UPDATE src/components/page/NavBar.tsx and src/components/page/MobileMenu.tsx

- **ACTION**: Add an optional `homeHref?: string` prop to both `NavBarProps` and `MobileMenuProps`, defaulting to `''` in the destructuring. In `NavBar`, change the brand link to `href={`${homeHref}#top`}` and each section link to `href={`${homeHref}#${link.id}`}`; pass `homeHref={homeHref}` to the nested `<MobileMenu>`. In `MobileMenu`, change each `sp-menu-link` to `href={`${homeHref}#${link.id}`}`. With the default `''` the rendered HTML is byte-identical to today, so the home page and the existing unit and e2e tests are unaffected; pages other than the home page pass `homeHref="/"` so the links become `/#about`, `/#top` and so on. Touch nothing else. Delivers AC-A7 (nav links on the new pages target the home sections).
- **MIRROR**: `# SOURCE: src/components/page/NavBar.tsx:26-45`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm exec eslint src/components/page/NavBar.tsx src/components/page/MobileMenu.tsx; pnpm exec prettier --check src/components/page/NavBar.tsx src/components/page/MobileMenu.tsx; pnpm exec vitest run tests/unit/page-navigation.test.ts` (astro check type-checks the new prop through both components; the existing page-navigation unit test renders the default and must stay green, proving the default output is unchanged; `pnpm check` exits non-zero on any error, so its own exit code is the gate and no output is parsed).

### Task 2: CREATE src/sections/site-chrome.ts

- **ACTION**: Create a typed module with two exports. (1) `export async function loadSiteChrome()` that imports `getCollection` and `getEntry` from `astro:content` and `profileLinks` from `./profile-links`, loads `getEntry('profile', 'profile')` (throw an `Error('The profile entry is missing')` if undefined), loads `getCollection('projects')` and takes `sourceHref` from the `links.repo` of the entry whose `id` is `site-pro` (throw `Error('The site-pro project has no repo link')` if absent), and returns `{ profile: profileEntry.data, links: profileLinks(profileEntry.data), sourceHref }`. (2) `export function pageTitle(label: string, profile: { headline: string }): string` returning `` `${label.replace(/\.$/, '')} - ${profile.headline.replace(/\.$/, '')}` `` (so `relay` becomes `relay - Fabio Barreto` and `Page not found.` becomes `Page not found - Fabio Barreto`). Use `CollectionEntry<'profile'>['data']` for the profile type, as `profile-links.ts` does. Delivers infrastructure for AC-A1, AC-A3 and AC-A8 (no task criterion of its own; it removes duplicated loading from the two pages and keeps the profile URLs only in `profile.json`).
- **MIRROR**: `# SOURCE: src/sections/profile-links.ts:11-19` and `# SOURCE: src/components/page/Footer.tsx:6-16`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm exec eslint src/sections/site-chrome.ts; pnpm exec prettier --check src/sections/site-chrome.ts` (astro check type-checks the `astro:content` types against the real collection schemas, including the `site-pro` entry lookup and `links.repo`).

### Task 3: CREATE src/styles/subpages.css

- **ACTION**: Create the stylesheet for the two new pages, tokens only (no hex, `rgb()`, `hsl()`, no `box-shadow`, no `transition`, no `animation`). Rules: `.sp-subpage { --subpage-gutter: clamp(16px, 4vw, 32px); box-sizing: border-box; max-width: var(--container); margin: 0 auto; padding: var(--space-12) var(--subpage-gutter) clamp(96px, 12vw, 160px); display: flex; flex-direction: column; gap: var(--space-12); }`; `.sp-notfound { min-height: 50vh; justify-content: center; align-items: flex-start; gap: var(--space-6); }`; `.sp-notfound-title { margin: 0; color: var(--fg); }`. The project body needs no extra rule (`Prose.css` already sets the 68ch measure). Delivers AC-A9 (tokens only) and the layout under AC-A1 and AC-A3.
- **MIRROR**: `# SOURCE: src/styles/home.css:1-17`.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check src/styles/subpages.css; if grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src/styles/subpages.css; then echo "FAIL: color literal in subpages.css"; exit 1; else echo "PASS: no color literal"; fi; if grep -nE 'box-shadow\s*:|transition\s*:|animation\s*:' src/styles/subpages.css; then echo "FAIL: box-shadow, transition or animation in subpages.css"; exit 1; else echo "PASS: no shadow, transition or animation"; fi; grep -q '\.sp-subpage' src/styles/subpages.css; grep -q '\.sp-notfound' src/styles/subpages.css` (the two class names are the contract with Tasks 4 and 5; their visual effect is measured in Level 3 once the pages import the file).

### Task 4: CREATE src/pages/projects/[slug].astro

- **ACTION**: Frontmatter: import `getCollection` and `render` from `astro:content` and `type CollectionEntry`, `Base` from `../../layouts/Base.astro`, `Backdrop` and `DEFAULT_GLOWS` from `../../components/page/Backdrop`, `Footer`, `NavBar`, `ProjectHeader`, `Prose` from `../../components/page/*`, `resolveAssetUrl` from `../../components/page/resolve-asset`, `loadSiteChrome` and `pageTitle` from `../../sections/site-chrome`, and `'../../styles/subpages.css'`. Export `getStaticPaths` returning `(await getCollection('projects')).map((entry) => ({ params: { slug: entry.id }, props: { entry } }))`. Declare `interface Props { entry: CollectionEntry<'projects'> }`, read `const { entry } = Astro.props; const { data } = entry;`, call `const { profile, links, sourceHref } = await loadSiteChrome();`, then `const hasBody = Boolean(entry.body?.trim()); const Content = hasBody ? (await render(entry)).Content : undefined;` (Astro 6: import `render` from `astro:content`; `entry.render()` no longer exists; do not call it for empty bodies). Markup: `<Base title={pageTitle(data.title, profile)} description={data.summary}>` > `<div class="sp-page">` > `<Backdrop glows={DEFAULT_GLOWS} />` + `<div class="sp-page-content">` > `<NavBar githubHref={links.github} linkedinHref={links.linkedin} homeHref="/" />`, then `<main id="main" tabindex="-1" class="sp-subpage">` holding `<ProjectHeader title={data.title} slug={entry.id} summary={data.summary} year={data.year} status={data.status} tags={data.tags} repo={data.links.repo} cover={resolveAssetUrl(data.cover)} />` and, only when `Content` is defined, `<Prose><Content /></Prose>`, then `<Footer sourceHref={sourceHref} owner={profile.name} />`. Do not pass `backHref` (the default `/#projects` is the contract). No inline `style`, no `client:*` directive, no prev/next links, no `data-build`. Delivers AC-A1 (relay page), AC-A2 (other three pages), AC-A5 (each card link target is a built page), AC-A6 (`main#main` skip target) and AC-A7 (nav links to `/#...`).
- **MIRROR**: `# SOURCE: src/pages/index.astro:31-46`, `# SOURCE: src/sections/Projects.astro:28-39`, `# SOURCE: src/components/page/ProjectHeader.tsx:11-33` and `# SOURCE: src/content.config.ts:10-13`.
- **VALIDATE**: the following block (builds the site, then reads each built page without running any script; exits non-zero on the first violated invariant):

```bash
set -euo pipefail
pnpm exec prettier --check "src/pages/projects/[slug].astro"
pnpm exec eslint "src/pages/projects/[slug].astro"
pnpm build
node --input-type=module - <<'EOF'
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (s) => dec(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const unq = (v) => v.trim().replace(/^['"]|['"]$/g, '').replace(/''/g, "'");
const files = readdirSync('src/content/projects').filter((f) => f.endsWith('.md'));
check(files.length === 4, 'four project entries, found ' + files.length);
for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const raw = readFileSync(join('src/content/projects', f), 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  const fm = m[1];
  const field = (k) => unq(new RegExp('^' + k + ':\\s*(.+)$', 'm').exec(fm)?.[1] ?? '');
  const html = readFileSync(`dist/projects/${slug}/index.html`, 'utf8');
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
  check(h1.length === 1 && text(h1[0][1]) === field('title'), `${slug}: one h1 reading the title`);
  check(/<a\b[^>]*href="\/#projects"[^>]*>[\s\S]*?All projects/.test(html), `${slug}: back link /#projects`);
  check((html.match(/<main\b/g) || []).length === 1 && /<main\b(?=[^>]*\bid="main")(?=[^>]*\btabindex="-1")/.test(html), `${slug}: one main#main[tabindex=-1]`);
  check(new RegExp(`<div class="sp-cover-ph"[^>]*>\\s*<span[^>]*>${slug}</span>`).test(html), `${slug}: cover placeholder labelled with the slug`);
  const hrefs = [...html.matchAll(/href="(#[^"]*)"/g)].map((x) => x[1]);
  check(hrefs.length === 1 && hrefs[0] === '#main', `${slug}: only same-page hash is the skip link, got ${hrefs.join()}`);
  for (const id of ['top', 'about', 'projects', 'stack', 'contact']) check(html.includes(`href="/#${id}"`), `${slug}: nav link /#${id}`);
  const repo = /^\s+repo:\s*(\S+)/m.exec(fm)?.[1];
  if (repo) {
    const esc = repo.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    check(new RegExp(`<a\\b[^>]*href="${esc}"[^>]*>(?:(?!</a>)[\\s\\S])*<span>Repo</span>`).test(html), `${slug}: Repo link to ${repo}`);
  }
  const body = m[2].trim();
  if (body) check(html.includes('sp-prose') && text(html).includes(body), `${slug}: body rendered in Prose`);
  else check(!html.includes('sp-prose'), `${slug}: empty body must render no Prose`);
}
if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log('PASS: four project pages carry header, back link, repo link, cover label, nav links and body-only-when-present');
EOF
```

### Task 5: CREATE src/pages/404.astro

- **ACTION**: Frontmatter: import `Base`, `Backdrop` + `DEFAULT_GLOWS`, `Button`, `Footer`, `NavBar`, `strings` from `../strings`, `loadSiteChrome` and `pageTitle` from `../sections/site-chrome`, and `'../styles/subpages.css'`; call `const { profile, links, sourceHref } = await loadSiteChrome();`. Markup: `<Base title={pageTitle(strings.notFound.title, profile)} description={profile.subtitle}>` > `<div class="sp-page">` > `<Backdrop glows={DEFAULT_GLOWS} />` + `<div class="sp-page-content">` > `<NavBar githubHref linkedinHref homeHref="/" />`, then `<main id="main" tabindex="-1" class="sp-subpage sp-notfound">` holding `<h1 class="text-3xl sp-notfound-title">{strings.notFound.title}</h1>` and `<Button variant="primary" href="/">{strings.notFound.homeLink}</Button>`, then `<Footer sourceHref owner={profile.name} />`. No new string keys, no inline `style`, no script, no build-layer markup, no animation. Astro emits this file as `dist/404.html`; `wrangler.jsonc` already serves it with status 404. Delivers AC-A3 (heading, "Go home" link to `/`, status 404 once served), AC-A6 and AC-A7.
- **MIRROR**: `# SOURCE: src/pages/index.astro:31-46`.
- **VALIDATE**: the following block (builds the site and reads `dist/404.html` without running any script):

```bash
set -euo pipefail
pnpm exec prettier --check src/pages/404.astro
pnpm exec eslint src/pages/404.astro
pnpm build
test -f dist/404.html
node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';
const html = readFileSync('dist/404.html', 'utf8');
const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (s) => dec(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8')).profile;
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
check(h1.length === 1 && text(h1[0][1]) === 'Page not found.', 'one h1 reading "Page not found."');
check(/<main\b(?=[^>]*\bid="main")(?=[^>]*\btabindex="-1")/.test(html), 'main#main[tabindex=-1]');
check(/<main\b[\s\S]*<a\b[^>]*href="\/"[^>]*>(?:(?!<\/a>)[\s\S])*<span>Go home<\/span>/.test(html), '"Go home" link to / inside main');
for (const id of ['top', 'about', 'projects', 'stack', 'contact']) check(html.includes(`href="/#${id}"`), 'nav link /#' + id);
check(/<footer\b/.test(html), 'footer present');
check(dec(html).includes(`<title>Page not found - ${profile.headline.replace(/\.$/, '')}</title>`), 'title');
check(dec(html).includes(`name="description" content="${profile.subtitle}"`), 'meta description is the profile subtitle');
check(!/<form\b|mailto:|tel:/i.test(html), 'no form, mailto or tel');
if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log('PASS: dist/404.html is the page-register 404 with heading, Go home link, nav and footer');
EOF
```

## Validation Commands

Run from the worktree root. No existing test is obsoleted by this phase (the default `homeHref=''` keeps every pinned hash href), so the project-wide unit and e2e suites run unscoped as a regression guard; if any existing test fails, report it as a dispute rather than editing it. Build-output greps target HTML only. Every block starts with `set -euo pipefail` so a mid-block failure fails the block.

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm check
pnpm lint
pnpm format:check
```

### Level 2: UNIT_TESTS and CONTENT_INVARIANTS

```bash
set -euo pipefail
# Existing unit suite as a regression guard (nothing in it is obsoleted by this phase).
pnpm test
pnpm build

# AC-9: no color or shadow literal in anything this phase wrote.
FILES="src/styles/subpages.css src/pages/404.astro src/pages/projects src/sections/site-chrome.ts src/components/page/NavBar.tsx src/components/page/MobileMenu.tsx"
if grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' $FILES; then echo "FAIL: color literal"; exit 1; else echo "PASS: no color literal"; fi
if grep -rnE 'box-shadow\s*:' $FILES | grep -v 'var(--'; then echo "FAIL: box-shadow literal"; exit 1; else echo "PASS: no box-shadow literal"; fi

# AC-14, AC-5 (static part), AC-8, AC-12 (static part), budgets: read the built HTML without running any script.
node --input-type=module - <<'EOF'
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (s) => dec(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const unq = (v) => v.trim().replace(/^['"]|['"]$/g, '').replace(/''/g, "'");
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8')).profile;
const stripDot = (s) => s.replace(/\.$/, '');
const allowedExternal = /^https:\/\/(github\.com\/fabiombarreto(\/|$)|www\.linkedin\.com\/in\/fabio-martins-barreto$)/;

const common = (html, label) => {
  check(/<html lang="en"/.test(html), `${label}: html lang`);
  check(/<body[^>]*>\s*<a\b[^>]*href="#main"[^>]*>\s*Skip to content/.test(html), `${label}: skip link first in body`);
  check(!/<form\b|mailto:|tel:/i.test(html), `${label}: no form, mailto or tel`);
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(https?:[^"]+)"/g)) check(allowedExternal.test(m[1]), `${label}: unexpected external link ${m[1]}`);
  check(!/\bsp-(boot|dock|dock-fab|window|select|skel)\b/.test(html) && !/data-build/.test(html), `${label}: no build layer`);
  check(!/<(a|button)\b[^>]*>[^<]*(Previous|Next) project/i.test(html), `${label}: no prev/next links`);
};

const files = readdirSync('src/content/projects').filter((f) => f.endsWith('.md'));
for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const raw = readFileSync(join('src/content/projects', f), 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  const fm = m[1];
  const field = (k) => unq(new RegExp('^' + k + ':\\s*(.+)$', 'm').exec(fm)?.[1] ?? '');
  const tags = (/^tags:\n((?:\s+- .+\n?)+)/m.exec(fm)?.[1] ?? '').split('\n').map((l) => unq(l.replace(/^\s+- /, ''))).filter(Boolean);
  const html = readFileSync(`dist/projects/${slug}/index.html`, 'utf8');
  const body = text(html);
  common(html, slug);
  check(dec(html).includes(`<title>${field('title')} - ${stripDot(profile.headline)}</title>`), `${slug}: title`);
  check(dec(html).includes(`name="description" content="${field('summary')}"`), `${slug}: meta description is the summary`);
  check(body.includes(field('summary')), `${slug}: summary text`);
  check(body.includes(field('year')), `${slug}: year`);
  check(body.toLowerCase().includes(field('status').toLowerCase()), `${slug}: status`);
  check(tags.length >= 2 && tags.every((t) => body.includes(t)), `${slug}: tags ${tags.join()}`);
  if (slug === 'relay') {
    check(body.includes('The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.'), 'relay: exact fork note');
    check(html.includes('href="https://github.com/fabiombarreto/PRPs-agentic-eng"'), 'relay: Repo href');
  }
}
common(readFileSync('dist/404.html', 'utf8'), '404');

// Every project link on the home page has a built page.
const home = readFileSync('dist/index.html', 'utf8');
const links = [...new Set([...home.matchAll(/href="(\/projects\/[a-z0-9-]+)"/g)].map((x) => x[1]))];
check(links.length === 4, 'four distinct project links on the home page, found ' + links.length);
for (const l of links) check(readdirSync('dist' + l).includes('index.html'), 'no built page for ' + l);

// Budgets (real PRD values), gzip, over the whole dist.
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const dist = walk('dist');
const htmlFiles = dist.filter((f) => f.endsWith('.html'));
const inline = (re) => htmlFiles.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(re)].map((x) => x[1])).join('\n');
const css = dist.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n') + '\n' + inline(/<style[^>]*>([\s\S]*?)<\/style>/g);
const js = dist.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
const headJs = [...readFileSync('dist/projects/relay/index.html', 'utf8').split('</head>')[0].matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((x) => x[1]).join('\n');
const kb = (s) => gzipSync(Buffer.from(s)).length / 1024;
check(kb(css) <= 25, `CSS ${kb(css).toFixed(1)} KB gzip > 25`);
check(kb(js) <= 90, `JS ${kb(js).toFixed(1)} KB gzip > 90`);
check(kb(headJs) <= 20, `inline head JS ${kb(headJs).toFixed(1)} KB gzip > 20`);

if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log(`PASS: project pages and 404 HTML invariants (CSS ${kb(css).toFixed(1)} KB, JS ${kb(js).toFixed(1)} KB, head JS ${kb(headJs).toFixed(2)} KB gzip)`);
EOF
```

### Level 3: INTEGRATION (existing e2e suite, then the real status codes and a browser run of the acceptance scenarios)

```bash
set -euo pipefail
pnpm build
# Existing e2e suite, unscoped (nothing in it is obsoleted by this phase).
pnpm test:e2e

# AC-2 (project pages load with 200), AC-5 (axe on the new pages), AC-14 (real 404 status), skip link and nav links on the new pages.
# astro preview is started in-process through Astro's own API so it can be stopped cleanly on Windows.
node --input-type=module - <<'EOF'
import { readFileSync, readdirSync } from 'node:fs';
import { preview } from 'astro';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const server = await preview({ root: process.cwd(), server: { host: '127.0.0.1', port: 4399 }, logLevel: 'silent' });
const base = 'http://127.0.0.1:4399';
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const axe = async (page, label) => {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  check(r.violations.length === 0, `axe ${label}: ${r.violations.map((v) => v.id).join(',')}`);
};
const slugs = readdirSync('src/content/projects').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const norm = (s) => s.replace(/\s+/g, ' ').trim();
let browser;
try {
  // Real HTTP statuses from the built site (AC-2, AC-14).
  const home = await fetch(base + '/');
  check(home.status === 200, '/ status ' + home.status);
  const hrefs = [...new Set([...(await home.text()).matchAll(/href="(\/projects\/[a-z0-9-]+)"/g)].map((m) => m[1]))];
  check(hrefs.length === 4, 'four project links on the home page, found ' + hrefs.length);
  for (const h of hrefs) check((await fetch(base + h)).status === 200, `${h} status is not 200`);
  for (const s of slugs) check((await fetch(`${base}/projects/${s}`)).status === 200, `/projects/${s} status is not 200`);
  for (const bad of ['/nope', '/projects/does-not-exist']) {
    const r = await fetch(base + bad);
    const body = await r.text();
    check(r.status === 404, `${bad} status ${r.status} != 404`);
    check(body.includes('Page not found.') && /<a\b[^>]*href="\/"/.test(body) && body.includes('Go home'), `${bad} does not serve the 404 page`);
  }

  browser = await chromium.launch();
  const pages = [...slugs.map((s) => '/projects/' + s), '/nope'];
  const sizes = [[1280, 800], [800, 1024], [375, 812]];
  for (const p of pages) {
    for (const [w, h] of sizes) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      const resp = await page.goto(base + p, { waitUntil: 'load' });
      check(resp.status() === (p === '/nope' ? 404 : 200), `${p} browser status ${resp.status()}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 0, `${p} @${w} horizontal overflow ${overflow}`);
      check((await page.locator('h1').count()) === 1, `${p} @${w} h1 count`);
      await axe(page, `${p} @${w} midnight`);
      await page.evaluate(() => { document.documentElement.dataset.theme = 'daylight'; });
      await axe(page, `${p} @${w} daylight`);
      await ctx.close();
    }
  }

  // Keyboard: the skip link is first and moves focus to main on a project page and on the 404 (JS on).
  for (const p of ['/projects/relay', '/nope']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(base + p);
    await page.keyboard.press('Tab');
    check((await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Skip to content', `${p}: first Tab focuses the skip link`);
    await page.keyboard.press('Enter');
    check((await page.evaluate(() => document.activeElement?.tagName)) === 'MAIN', `${p}: skip link moves focus to main`);
    await ctx.close();
  }

  // No JavaScript: back link, nav links and Go home resolve to the home page (AC-14, AC-2).
  const nctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const np = await nctx.newPage();
  const inView = (id) => np.evaluate((i) => { const r = document.getElementById(i).getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }, id);
  await np.goto(base + '/projects/relay');
  const relayMain = norm(await np.locator('main').innerText());
  check(relayMain.includes('The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.'), 'relay: fork note visible without JS');
  await np.locator('main a[href="/#projects"]').click();
  await np.waitForURL((u) => new URL(u).pathname === '/' && new URL(u).hash === '#projects');
  check(await inView('projects-title'), 'back link lands with the projects h2 in view');
  for (const id of ['about', 'contact']) {
    await np.goto(base + '/projects/site-pro');
    await np.locator(`.sp-nav-links a[href="/#${id}"]`).click();
    await np.waitForURL((u) => new URL(u).pathname === '/' && new URL(u).hash === '#' + id);
    check(await inView(id + '-title'), `nav /#${id} from a project page lands with the h2 in view`);
  }
  await np.goto(base + '/nope');
  await np.locator('main a[href="/"]').click();
  await np.waitForURL((u) => new URL(u).pathname === '/');
  check((await np.locator('h1').innerText()).includes('Fabio'), 'Go home reaches the home page');
  await nctx.close();

  // Mobile menu on a project page (links must be home-prefixed), with JS.
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await mctx.newPage();
  await mp.goto(base + '/projects/relay');
  await mp.getByRole('button', { name: 'Open the menu' }).click();
  check(await mp.locator('#mobile-menu').evaluate((e) => e.matches(':popover-open')), 'menu opens on a project page');
  check((await mp.locator('#mobile-menu a[href^="/#"]').count()) === 4, 'four home-prefixed menu links');
  await axe(mp, '/projects/relay @375 menu open');
  await mp.locator('#mobile-menu a[href="/#about"]').click();
  await mp.waitForURL((u) => new URL(u).pathname === '/' && new URL(u).hash === '#about');
  await mctx.close();
} finally {
  if (browser) await browser.close();
  await server.stop();
}
if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log('PASS: statuses, axe in both themes at three sizes, skip link, nav links and menu on the new pages');
EOF
```

## Acceptance Criteria

- **AC-A1 (PRD AC-14):** `/projects/relay` shows an "All projects" back link to `/#projects`, an `<h1>` "relay", the approved summary, the year 2026, the status "active", its tags, a "Repo" external link to `https://github.com/fabiombarreto/PRPs-agentic-eng`, a cover placeholder labelled `relay`, and the sentence "The repository is a fork of Wirasm/prp. relay is the plugin I built inside it."; the page has a per-page `<title>` (`relay - Fabio Barreto`) and a meta description equal to the summary.
- **AC-A2 (PRD AC-14):** `/projects/ai-track-record`, `/projects/praesto-sum` and `/projects/site-pro` render the same header with their own data and no body (no `Prose` element).
- **AC-A3 (PRD AC-14):** When an unknown path such as `/nope` is requested from the built site, the response status is 404 and the page shows the heading "Page not found." and a "Go home" link to `/`, inside the page register with the NavBar and Footer.
- **AC-A4 (PRD AC-5):** `@axe-core/playwright` with the WCAG 2.0, 2.1 and 2.2 A/AA tags reports 0 violations on each of the 4 `/projects/<slug>` pages and on an unknown path, in Midnight and Daylight, at 1280x800, 800x1024 and 375x812, and on a project page at 375x812 with the mobile menu open.
- **AC-A5 (PRD AC-2):** Every project card title link on `/` (`/projects/<slug>`) resolves to a built page that loads with HTTP 200.
- **AC-A6 (PRD AC-3):** On the project pages and the 404, the first Tab focuses the visible "Skip to content" link and activating it moves focus to `<main id="main" tabindex="-1">`.
- **AC-A7 (PRD AC-2):** The nav and mobile-menu links on the project pages and the 404 target the home sections (`/#top`, `/#about`, `/#projects`, `/#stack`, `/#contact`), not same-page hashes; activating them without JavaScript lands on `/` with the target section's `<h2>` in the viewport; the home page's own nav output is unchanged.
- **AC-A8 (PRD AC-8):** The new pages contain no `<form>`, `mailto:` or `tel:` and no external link other than `github.com/fabiombarreto` (and its repositories) and `linkedin.com/in/fabio-martins-barreto`.
- **AC-A9 (PRD AC-9, AC-10):** Nothing this phase adds contains a color or `box-shadow` literal outside `src/styles/tokens.css`; built CSS is <= 25 KB gzip, total JS <= 90 KB gzip and inline head JS <= 20 KB gzip.

R8b (PRD AC-N token check) applies here: every item above carries its PRD `AC-N`.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `astro preview` may return the 404 body with a status other than 404 (research found only a release note that it serves `404.html`, not the status) | L | M | Level 3 asserts the real status of `/nope` and an unknown project slug; if it is not 404 report it as a dispute with the observed status rather than weakening the check (Workers serves the status in production via `not_found_handling`) |
| Bare `#hash` nav links are dead on the new pages | H (without the fix) | H | Task 1 adds `homeHref`; Tasks 4-5 pass `"/"`; Level 2 asserts no same-page hash other than `#main`; Level 3 follows the links without JavaScript |
| Empty Markdown bodies may render an empty `Prose` wrapper or error in `render()` (the docs do not describe empty-body behaviour) | M | L | Task 4 renders `Prose` only when `entry.body.trim()` is non-empty; Task 4 and Level 2 assert `sp-prose` is absent on the three empty-body pages |
| Changing a shared component could break the pinned home-page markup | L | M | Default `homeHref=''` yields byte-identical output; Task 1 runs the existing `page-navigation` unit test and Level 2/3 run the full unit and e2e suites unscoped |
| Contrast and layout of the two new pages differ from the home page register | L | M | Reuse Base, Backdrop, NavBar, Footer and the home container values; axe in both themes at three sizes in Level 3 (glow contrast is covered by the phase-2 contrast test) |
| Astro 6 API drift (`entry.render()` removed; `render` is a standalone import) | L | L | Task 4 specifies `render(entry)` from `astro:content`; `astro check` and the build fail on misuse |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework. (Task 1's validation and Levels 2 and 3 additionally run the existing suites, purely as a regression guard.)
- **Existing tests this phase obsoletes:** none. The only pinned behaviour near the change is the bare-hash hrefs in `tests/unit/page-navigation.test.ts:37-40, 75, 89-99` and `tests/e2e/home-mobile-menu.spec.ts:36, 53-65, 89`; the default `homeHref=''` keeps them passing, so the unscoped project-wide commands in Levels 2 and 3 are safe. If any existing test fails, report it as a dispute instead of editing it.
- **New-test candidates for the test pair (no existing coverage):** `/projects/<slug>` and `/404` are not asserted anywhere today. Suggested NEW tests from the ACs: a project-pages e2e (each slug returns 200, one h1, back link to `/#projects`, Repo link, cover label, relay fork note only on relay, no `Prose` on the others), a 404 e2e (status 404 from `astro preview`, heading and "Go home" link), the axe matrix extension for these pages (AC-5), and a unit test that `NavBar`/`MobileMenu` prefix their links with `homeHref` while the default stays bare. The existing dist privacy e2e covers the new HTML automatically.
- Working directory: all implementation and validation happens in the worktree `C:/repos/site-pro/.worktrees/stage-2-foundation/`; the `src/...` paths in this plan are relative to it.
- Research grounding: `research-codebase` and `research-web` were dispatched in parallel; every cited line range was re-read directly in the worktree. `research-web` confirmed that Astro 6 uses a standalone `render(entry)`, that `getCollection()` inside `getStaticPaths()` with the entry passed as a prop is the documented pattern, and that Cloudflare `404-page` serves the nearest `404.html` with a 404 status. Gaps it left (preview status code in Astro 6, empty-body `render()` behaviour) are handled by Level 3's real-status assertions and by rendering `Prose` only for non-empty bodies. Output format is the Astro default (`build.format: 'directory'`, no override in `astro.config.mjs`), so project pages are `dist/projects/<slug>/index.html` and the 404 is `dist/404.html`.
- Titles are built as `<label> - <headline without trailing period>` to match the home page's `<headline> - <role>` idiom without adding string keys; the 404 description reuses the profile subtitle. `noindex` for the 404 and canonical URLs are Stage 6.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
