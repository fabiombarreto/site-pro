# Stage 2 · Foundation: the static, accessible site-pro page

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (project scaffold, hosting product under D9, island vs static split); cross-cutting patterns (design tokens and themes, content schemas, CI quality gates); reuse or creation of components (Design System v2 page components); impact on shared UI (nav, footer, base layout); business rules for content (C1–C16), navigation (N1, N5, N10, N11, N13) and visual-design (V1–V16); business rules for build only as an out-of-scope boundary (B4, B17, B24: no build layer in this stage)
- Decisions found: Presentation-only scope; D1 English only; D2 Astro + React + TypeScript strict (React rendered to static HTML, few islands, runtime outside React); D9 Cloudflare with a preview per pull request, amended by the owner on 2026-11-05 from Cloudflare Pages to Cloudflare Workers Static Assets (see Decisions Log); D3 Midnight default + accent #2563eb, Daylight from the nav; D4 essential sections only (Hero, About, Projects, Stack, Contact, project pages, 404); D5 internal project pages /projects/<slug> with a direct repo shortcut on cards; D13/D16 public repository, MIT code, personal content all rights reserved; D18 Geist (page) + JetBrains Mono (labels), self-hosted; D20 one continuous page; only personal projects + privacy list; Stage 1 approved on 2026-11-04 (the screens and D20 are the visual reference)
- Applicable anti-patterns: raw values instead of tokens; mixing the two registers; hiding pending content with display or visibility; layout-shifting animation; generic fade-up reveals; publishing private data; invented numbers and banned copy patterns; a contact form or public email; OS or app branding; scope creep into v1 (no runtime, palette or v1.1 items here); weakening tests to get a green run
- Applicable architectural rules: SSG with complete final HTML that works without JS (docs/context/architecture.md "Architectural pattern"); React page components render to static HTML without a client directive, hydrate only where needed; plain CSS with token custom properties, no CSS framework; planned folder layout (docs/06-architecture.md "Folder structure"); budgets (Lighthouse ≥ 95, LCP ≤ 2.5 s, CLS ≈ 0, critical JS ≤ 20 KB gzip, total JS ≤ 90 KB gzip, CSS ≤ 25 KB gzip); WCAG 2.2 AA in both themes with a 2px --accent focus ring; fonts self-hosted, never loaded from Google at runtime; docs/ is the source of truth and is updated before code; relay artifacts live in PRPs/, nothing under .claude/
- Result: PROCEED
```

## Problem Statement

site-pro has approved documentation and an approved design (Stages 0 and 1, 2026-11-04) but no application code. The whole concept rests on the final page already existing as complete static HTML that the Stage 3 runtime later "rewinds" and builds in front of the visitor. Until that page exists, is accessible and is measured by CI, there is nothing to build the animation layer on, and no way to prove the build layer leaves layout, SEO and accessibility untouched.

## Evidence

- "State on 2026-11-04: **no application code exists yet**" (docs/context/architecture.md:3); the repository has no `package.json`, no CI workflow and no hosting configuration.
- "Production code starts only in Stage 2 ... Stage 1 prototypes live in the design tool and are disposable" (docs/07-roadmap-and-decisions.md:20). The Claude Design bundle (`components/src/index.tsx`, `bundle.css`) is a single-page reference without tests or budgets.
- "The key idea: the server delivers the final result, and the browser 'rewinds' it" (docs/06-architecture.md:85): the static page is the precondition for Stage 3.
- "No automated test suites were detected" (docs/context/testing.md:51); no accessibility or performance check runs anywhere today.
- The roadmap places Stage 2 next, with the exit criterion "A navigable static site, without animation, meeting the accessibility targets" (docs/07-roadmap-and-decisions.md:10).

## Proposed Solution

Scaffold the production project exactly as the approved architecture describes: Astro 6 (static output, no adapter) with React page components rendered to static HTML, TypeScript strict, pnpm, plain CSS reading design tokens ported from the Design System v2 (`tokens.css`/`tokens.json`), self-hosted Geist and JetBrains Mono, and Astro Content Collections holding the approved copy from docs/09-content-draft.md. On top of it, build the one continuous page (D20) in the page register only: nav (with a working theme toggle and a no-JS `popover` mobile menu), the five sections faithful to the approved screens, the footer, header-only project pages (with a body only where the entry has one) and a plain 404, with the photo and cover placeholders. Guard it with a GitHub Actions CI (lint, `astro check`, Vitest, build, Playwright E2E + axe in both themes, Lighthouse CI with budgets) and deploy it on Cloudflare Workers Static Assets through Workers Builds, which publishes a preview per pull request. This approach over alternatives: it follows decisions already made (D2, D9 as amended, D18, D20), reuses the approved reference implementation instead of redesigning, and keeps the build layer out entirely so Stage 3 starts from a measured, stable base.

## Key Hypothesis

We believe a token-driven static Astro page, faithful to the approved screens and guarded by CI (axe, Lighthouse, budgets, E2E), will give Stage 3 a base that never needs to be redone for the owner and a readable, accessible page for visitors.
We'll know we're right when the pull request preview passes axe with zero violations in both themes, scores ≥ 95 in all four Lighthouse categories, and the owner approves visual parity with the five final-page artboards of the screens canvas.

## What We're NOT Building

- The build runtime, boot terminal, command dock, build windows, selection boxes, skeletons, element effects, Skip, Run all, speed, Replay, turbo, deep-link building, the focus rule and pending states — Stage 3 (docs/07).
- The photo → ASCII script, the real photo, the real project covers and the project page body text — Stage 4 and owner-supplied content.
- The Command Palette, the nav `⌘K` button, scroll-spy, the card → project page view transition, the `?` shortcut list and the `ENOENT` 404 build window — Stage 5.
- OG images, JSON-LD, sitemap, canonical URLs on a final domain, analytics (D10) and the domain (D15) — Stage 6.
- The footer build summary and its Replay button — they belong to the runtime (Stage 3).
- GitHub star counts (`githubRepo`) — not displayed (C12); no build-time fetch in this stage.
- Anything in v1.1 or post-v1 (interactive dock D7, agent cursors D8, Phosphor theme, Experience, Articles and talks) — v1 scope is closed.

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| axe violations (WCAG 2.2 AA) | 0 on every page, in Midnight and Daylight, at the 3 breakpoints | Playwright + `@axe-core/playwright` in CI |
| Lighthouse (Performance, Accessibility, Best Practices, SEO) | ≥ 95 in each category | Lighthouse CI on `dist/`, median of 3 runs |
| Budgets | CSS ≤ 25 KB gzip, total JS ≤ 90 KB gzip, critical JS ≤ 20 KB gzip, CLS ≤ 0.01 | Size check script in CI + Lighthouse |
| Visual parity | Owner approval on the 5 final-page artboards (desktop, tablet, mobile, Daylight desktop, open mobile menu) | Owner review on the PR preview + Playwright screenshot baselines |

## Acceptance Criteria (test scenarios)

Mandatory. Each criterion is an observable scenario the resulting code must
satisfy. If `tdd: true` in `docs/context/methodology.md`, these are the
contract the test pair authors test-first (before the Implementer). If
`tdd: false` with a declared framework, they are the contract the test pair
authors test-after (after the Implementer + Code Review). With no framework
declared, no tests are authored.

- **AC-1 Complete static HTML:** Given a clean checkout, when `pnpm install --frozen-lockfile && pnpm build` runs, then it exits 0 and `dist/index.html`, read without executing any script, contains one `<main>` with sections whose ids are `top`, `about`, `projects`, `stack` and `contact` in that order; exactly one `<h1>`, whose text is "Fabio Barreto."; one `<h2>` per section after the hero ("About me", "Selected work", "What I work with", "Let's talk."), each section labelled by its `<h2>`; and the approved copy from docs/09-content-draft.md: the role "Senior Software Engineer", the hero intro, the 54-word About text, 4 project cards (relay, AI Track Record, Praesto Sum, site-pro) with their title, summary, tags, year and status, the 6 stack groups with their items in display order, the Contact lead and "Brazil (UTC-3)".
- **AC-2 Navigation without JavaScript:** Given JavaScript disabled in Playwright and a 1280×800 viewport, when the visitor loads `/` and activates each nav link in turn, then the URL hash becomes `#about`, `#projects`, `#stack` and `#contact` and the target section's `<h2>` is inside the viewport; every text of the five sections is visible; and each project card's title link points to `/projects/<slug>` and that page loads with HTTP 200.
- **AC-3 Keyboard and focus:** Given `/` loaded, when the visitor presses Tab once, then a visible "Skip to content" link has focus, and activating it moves focus to `<main>`; when the visitor keeps pressing Tab, every link and button on the page receives focus in DOM order, and each focused element has a computed 2px solid outline in the `--accent` color with a 2px offset.
- **AC-4 Themes without a flash:** Given no stored theme preference, when `/` loads, then `<html>` carries `data-theme="midnight"` already at `DOMContentLoaded` and a toggle named "Switch to the Daylight theme" is shown; when the visitor activates it, then `data-theme` becomes `daylight`, the toggle's name becomes "Switch to the Midnight theme", and after a reload `data-theme` is `daylight` at `DOMContentLoaded` (applied by the inline head script before first paint, never Midnight first). With JavaScript disabled the page renders in Midnight and no non-functional theme control is exposed.
- **AC-5 Zero axe violations:** Given the built site served locally, when `@axe-core/playwright` runs with the WCAG 2.0, 2.1 and 2.2 A/AA rule tags on `/`, each of the 4 `/projects/<slug>` pages and an unknown path (the 404 page), in both themes, at 1280×800, 800×1024 and 375×812, and additionally on `/` at 375×812 with the mobile menu open, then it reports 0 violations in every combination.
- **AC-6 Mobile menu:** Given a 375×812 viewport, when `/` loads, then the four section links are not shown in the nav bar and a button named "Open the menu" is shown; when the visitor activates it, with or without JavaScript, then a menu shows the four numbered links (About, Projects, Stack, Contact) and the GitHub and LinkedIn buttons, all reachable by keyboard; pressing `Esc` closes it and returns focus to the button; with JavaScript, choosing a link closes the menu and navigates to that section. At widths ≥ 768 px no menu button is shown and the links sit inline in the nav bar.
- **AC-7 Content schemas reject invalid content:** Given the exported content schemas, when Vitest validates a project fixture whose `summary` has 141 characters, or that has 1 or 5 `tags`, or whose `status` is not one of `active`, `in development`, `planning`, `maintained`, `archived`, or a profile fixture whose `bio` has 100 words or more, then validation fails and names the offending field; and the 4 approved project entries, the profile entry and `stack.json` in `src/content/` validate (so `pnpm build` passes with them and fails with any invalid entry).
- **AC-8 Privacy in the build output:** Given the built `dist/`, when the privacy check runs over every HTML, JS, CSS, JSON and XML file, then it finds no email address pattern, no `mailto:` or `tel:` link, no phone-number pattern and no `<form>` element; the only profile links are to `github.com/fabiombarreto` (and its repositories) and `linkedin.com/in/fabio-martins-barreto`; and the only location text is "Brazil (UTC-3)".
- **AC-9 Tokens only:** Given the source under `src/`, when the token check runs, then no color literal (hex, `rgb()`, `rgba()`, `hsl()`) and no `box-shadow` literal appears in any `.css`, `.astro`, `.ts` or `.tsx` file outside `src/styles/tokens.css` and image assets under `src/assets/`; every color, radius and shadow in components is a `var(--…)` token.
- **AC-10 Lighthouse and budgets:** Given a CI run, when Lighthouse CI audits `dist/` on `/` and `/projects/relay` with 3 runs each, then the median score is ≥ 0.95 for Performance, Accessibility, Best Practices and SEO and the median CLS is ≤ 0.01; and when the size check runs on `dist/`, then the total JavaScript is ≤ 90 KB gzip, the JavaScript that runs before first paint (inline head scripts) is ≤ 20 KB gzip and the total CSS is ≤ 25 KB gzip; the CI job fails when any threshold is exceeded.
- **AC-11 CI and preview per pull request:** Given a pull request to `main`, when it is opened or updated, then GitHub Actions runs lint (ESLint and the Prettier check), `astro check`, Vitest, the build, Playwright (E2E + axe) and Lighthouse CI, each reported as its own status check, and Cloudflare Workers Builds publishes a preview URL that serves that commit's build; after a merge to `main`, the production Worker serves the merged build.
- **AC-12 No build layer and no build animation:** Given any page with JavaScript enabled, when it has loaded and stayed idle for 2 s, then the DOM contains no boot terminal, dock, build window, selection box or skeleton (no `.sp-boot`, `.sp-dock`, `.sp-dock-fab`, `.sp-window`, `.sp-select` or `.sp-skel` element), and the text content of `<main>` equals the no-JS rendering; the only CSS transitions are hover and focus micro-interactions of 150–300 ms, and with `prefers-reduced-motion: reduce` no transition or animation runs.
- **AC-13 Responsive layout per the screens:** Given viewports of 1440×900, 800×1024 and 375×812, when `/` renders, then the hero photo placeholder box is 960, 760 and 480 px tall respectively with a 9:16 ratio; the banner name renders on two lines ("Fabio" / "Barreto."); the project grid shows 2 columns with the right column offset 96 px lower at 1440 and 800 and 1 column at 375; the stack grid shows 3, 2 and 1 columns respectively; the page never scrolls horizontally; and the cumulative layout shift recorded after load is ≤ 0.01.
- **AC-14 Project pages and 404:** Given the build, when `/projects/relay` loads, then it shows an "All projects" back link to `/#projects`, an `<h1>` "relay", the approved summary, the year 2026, the status "active", its tags, a "Repo" external link to `https://github.com/fabiombarreto/PRPs-agentic-eng`, a cover placeholder labelled `relay`, and the sentence "The repository is a fork of Wirasm/prp. relay is the plugin I built inside it."; `/projects/ai-track-record`, `/projects/praesto-sum` and `/projects/site-pro` render the same header with their own data and no body; and when an unknown path such as `/nope` is requested from the built site, then the response status is 404 and the page shows the heading "Page not found." and a "Go home" link to `/`.

## Open Questions

- [ ] Which Node.js LTS version to pin at scaffold time (the current Active LTS that satisfies Astro 6's `engines`); resolved by the Phase 1 plan and recorded in docs/development.md.
- [ ] Whether to allow `pnpm` commands in `.claude/settings.json` (today they prompt; the owner decides, nothing changes until then).
- [ ] Owner setup steps outside the repository: connect the GitHub repository to Cloudflare Workers Builds (production branch `main`, non-production branch builds and preview URLs enabled) before the Stage 2 pull request opens, and add branch protection on `main` requiring the CI checks.
- [ ] The Worker name and workers.dev subdomain, which form the temporary production URL until the domain (D15) is decided.
- [ ] Film grain as an image asset or a generated SVG noise filter (docs/domain/areas/visual-design.md open question); decided by the Phase 2 plan and recorded there.
- [ ] Whether the Playwright visual baselines gate CI or stay advisory while the photo and covers are placeholders.

---

## Users & Context

**Primary User**
- **Who:** The owner, as the site's only developer and maintainer, who builds Stage 3 on top of this base. The page's end consumer is the visitor: the international developer community and people who don't code, who must be able to read and navigate the page without JavaScript, by keyboard and on a phone.
- **Current behavior:** Only documentation and disposable Claude Design prototypes exist; nothing can be reviewed in a real browser from the repository.
- **Trigger:** Opening each Stage 2 pull request.
- **Success state:** A preview URL whose page matches the approved artboards, with CI green, that Stage 3 can animate without changing layout, content or accessibility.

**Job to Be Done**
When I start building the build runtime (Stage 3), I want a finished, accessible static page with stable section markup, tokens and a CI that guards the budgets, so I can add the animation layer on top without touching layout, content or accessibility.

**Non-Users**
Clients and recruiters looking for a résumé (the site is presentation-only and a short invitation); visitors expecting the animated build experience (Stage 3 onward); content editors expecting a CMS (content lives in the repository as Markdown/JSON).

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Project scaffold: Astro 6 (static), `@astrojs/react`, TypeScript strict, pnpm with a committed lockfile, ESLint flat config, Prettier, `astro check`, Vitest, Playwright + axe, the docs/06 folder layout, `.gitignore` for Node/Astro output, the relay worktree bootstrap scripts running `pnpm install --frozen-lockfile` | The first production code; every later stage builds on it |
| Must | Tokens and themes: `src/styles/tokens.css` with Midnight and Daylight from the Design System v2, type-style classes, base styles (focus ring, selection, 68ch measure, reduced motion and reduced transparency), self-hosted Geist and JetBrains Mono | Both themes and every contrast guarantee depend on tokens (V2, V10, V11) |
| Must | Theme toggle working in the nav: Midnight by default (D3), choice saved in `localStorage`, applied by an inline head script before first paint | Both themes must be testable; the nav shows `◐` |
| Must | Content Collections for `profile`, `projects` and `stack` with schemas enforcing docs/05 limits, holding the approved copy from docs/09; interface copy in `src/strings.ts` | A content mistake breaks the build, not the site (docs/06); D1 centralized copy |
| Must | Page components ported from the Design System v2, rendered to static HTML: NavBar, MobileMenu, ThemeToggle, SectionHeading, Button, TextLink, IconLink, Tag, StatusBadge, Photo (cutout), Backdrop, ProjectCard, StackGroup, StackChip, Footer, ProjectHeader, Prose | The approved reference implementation; static by default (docs/06) |
| Must | Home page: skip link, sticky nav (name, section links, theme toggle, GitHub; `☰` popover menu below 768 px), the banner hero with the photo placeholder, About, the staggered Projects grid, Stack, Contact with the giant type, the D20 backdrop, the footer with `Source ↗` and the copyright line | The Stage 2 deliverable and the base for Stage 3 |
| Must | Header-only project pages at `/projects/<slug>` (body rendered when the entry has one) and a plain page-register 404 | No broken links in a navigable site; keeps D5 |
| Must | Responsive layout at the three breakpoints (≥ 1024, 768–1023, < 768 px) per the screens | V15 and the approved artboards |
| Must | `<html lang="en">`, a per-page `<title>` and meta description from content | Lighthouse SEO ≥ 95 and D1 |
| Must | CI on GitHub Actions: lint, `astro check`, Vitest, build, Playwright E2E + axe in both themes, Lighthouse CI with assertions, the size budget check | The accessibility and performance targets must be enforced, not hoped for |
| Must | Hosting on Cloudflare Workers Static Assets (`wrangler.jsonc`, `assets.directory: "./dist"`, `not_found_handling: "404-page"`) deployed by Workers Builds with a preview per pull request | D9 as amended on 2026-11-05 |
| Should | Playwright screenshot baselines of the final page in both themes at the three breakpoints, generated in CI's Linux environment | Locks visual parity before Stage 3 adds overlays |
| Should | Nav transparent at the top and translucent with blur after scrolling (solid `--bg-raised` with `prefers-reduced-transparency` or without blur support; no-JS fallback is the translucent state) | N1 and the screens; readability of the sticky nav over content |
| Should | Hover and focus micro-interactions from the Design System (card lift, accent border, slight cover zoom; underlined links), 150–300 ms, off under reduced motion | N11 and the approved look |
| Could | Previous / next project links on project pages | In the Design System wireframe; useful but not required to be navigable |
| Won't | Build runtime and build layer; Command Palette, `⌘K`, scroll-spy, view transitions, `?`; ENOENT 404 window; ASCII photo; OG, JSON-LD, sitemap, canonical, analytics, domain; star counts | Stages 3–6 per docs/07; v1 scope closed |

### MVP Scope

The complete, accessible home page with the approved copy and the placeholders, minimal project pages and 404, CI green on a pull request, and a working preview URL on Cloudflare Workers.

### User Flow

- **Owner:** opens a pull request → CI checks run → Workers Builds posts the preview URL → the owner reviews the preview against the screens artboards (desktop, tablet, mobile, both themes) → merges.
- **Visitor:** lands on `/` → reads the hero → uses the nav or the skip link → reads About, Projects, Stack and Contact → opens a project card → reads the project page header → goes back to `/#projects`; switches the theme at any point.

---

## Technical Approach

**Feasibility:** HIGH. The stack is mature, the Design System v2 provides an approved reference implementation (`components/src/index.tsx`, `bundle.css`, and the screens canvas `tokens.css`), the content is approved and there is no backend.

### TDD routing

Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

Precondition decided by the owner on 2026-11-05: before `/relay-execute` starts, `docs/context/methodology.md` declares `test_frameworks: [vitest, playwright]` (with `tdd: false` kept). Until it does, the test pair self-skips and no tests are authored.

### Architecture Notes

- **Docs amendments before Phase 1 (docs first).** Made in the PRD authoring session after approval, left uncommitted for the owner: the D9 amendment (Cloudflare Workers Static Assets, Workers Builds, preview per pull request) in docs/decisions.md and docs/07-roadmap-and-decisions.md, plus every place that says "Cloudflare Pages" (CLAUDE.md, docs/06-architecture.md, docs/08-tools.md, docs/context/architecture.md, docs/context/integrations.md and the rest); docs/06 "How React is used" (the mobile menu becomes a static `popover`, not an island); docs/context/methodology.md `test_frameworks`; docs/domain/areas/visual-design.md V6 ("widths" → heights, matching docs/03, the source of truth).
- **Astro 6, static output, no adapter.** `@astrojs/react` for page components; TypeScript strict. Use the latest stable 6.x at scaffold time and pin it in the lockfile.
- **Design System → code mapping** (answers the visual-design open question): sections are Astro files in `src/sections/` (Hero, About, Projects, Stack, Contact); page components are React `.tsx` in `src/components/page/`, ported from `components/src/index.tsx` with typed props (no `any`), states as props, rendered without a client directive. Build-layer components, CommandPalette and Toast are not ported in this stage.
- **Interactivity.** ThemeToggle is the only hydrated control; the plan picks a `client:idle` React island (docs/06) or a progressive-enhancement script, whichever keeps the JS budget; either way an `is:inline` head script reads the stored theme and sets `data-theme` and `color-scheme` on `<html>` before first paint. The mobile menu is a static `popover` (works without JS, light dismiss and `Esc` built in) with a small optional script that closes it after a link is chosen.
- **Section markup contract for Stage 3.** `<section id="top" aria-label="Introduction">` for the hero (the NavBar name links to `#top`, as in the Design System) and `<section id="about|projects|stack|contact" aria-labelledby="…-title">` for the others, with stable ids matching the nav anchors and the deep links in docs/api-reference.md. All content is in the HTML; no `data-build` attributes and no pending state in this stage (Stage 3 adds them).
- **Tokens and styles.** `src/styles/tokens.css` from the Design System `tokens.css`/`tokens.json`, cross-checked against docs/03 (docs/03 wins on any difference), including the syntax, log and build-layer tokens Stage 3 will use; `src/styles/base.css` for the reset, type classes, focus ring and media-query fallbacks; component styles port the `sp-` classes from `bundle.css` and read only tokens.
- **Fonts.** Geist (one variable WOFF2) and JetBrains Mono (1–2 files), Latin subsets, self-hosted through the Astro Fonts API or Fontsource packages and preloaded. The Google Fonts link used inside the screens canvas is not copied.
- **Icons.** Lucide 1.33.0 and Simple Icons 13.21.0 paths inlined as in the Design System; no runtime icon library.
- **Content.** `src/content.config.ts` defines `profile` (one entry, with the bio as Markdown), `projects` (one Markdown file per project; the body is the project page text) and `stack` (`stack.json`). The Zod schemas live in an importable module so Vitest can validate fixtures without Astro. The relay entry's body holds the fork note (C15); the other bodies stay empty until Stage 4. Section eyebrows, titles and leads, nav and button labels, accessible names and the 404 copy live in `src/strings.ts`, using the approved screens' wording ("About me", "Selected work" with "Things I built and what I learned.", "What I work with", "Let's talk.").
- **Placeholders.** The full-body photo placeholder is a neutral 900×1600 silhouette SVG drawn for the repository (the Design System's file is an internal Claude Design blob, not exportable); cover placeholders are the CSS dot-grid `CoverPlaceholder` labelled with the slug. Swapping in the real files changes no layout.
- **Hosting and deploy.** `wrangler.jsonc` with `assets.directory: "./dist"` and `not_found_handling: "404-page"`; Node pinned with `.node-version` and pnpm with the `packageManager` field so Workers Builds and CI use the same versions. Workers Builds builds every push, posts a preview URL per pull request and deploys `main` to production; no Cloudflare secret is stored in GitHub. Branch protection on `main` (owner step) makes the CI checks gate merges.
- **CI.** One workflow on `pull_request` and `push` to `main`: install with the pnpm cache → lint → `astro check` → Vitest → build → Playwright (with browsers installed with system deps) → Lighthouse CI (`staticDistDir: ./dist`, `numberOfRuns: 3`, category assertions ≥ 0.95, CLS ≤ 0.01) → size check. The real commands are recorded in docs/context/testing.md and docs/development.md.

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Hero banner fidelity (giant name, cut-out photo in front of it and running into About) across the three breakpoints without layout shift | M | Port the screens' positioning values, give the image explicit `width`/`height`, assert sizes in E2E (AC-13) and lock the result with screenshot baselines |
| Contrast over the glows: axe cannot compute contrast over gradients, so a too-strong glow could pass CI and fail AA | M | Keep the Design System's glow caps; a Vitest contrast test checks every text/background token pair in both themes and `--fg-muted` over the worst-case glow blend (≥ 4.5:1, 4.8:1 expected in Midnight) |
| Flaky CI or deploy: Lighthouse score variance on runners, Node/pnpm mismatches in Workers Builds | M | Lighthouse on the static `dist/` with 3 runs and median assertions; pinned Node and pnpm versions; the owner checks the first preview before merging |

---

## Implementation Phases

| # | Phase | Description | Status | Repo | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|------|----------|---------|----------|
| 1 | Scaffold and CI skeleton | Astro 6 + React + TS strict project with pnpm, lint/format/check/test tooling, folder layout, bootstrap scripts, `wrangler.jsonc` and a first CI workflow | complete | - | - | - | PRPs/plans/stage-2-foundation-phase-1-scaffold-and-ci-skeleton.plan.md |
| 2 | Tokens, themes and fonts | `tokens.css` (Midnight/Daylight), base styles and type classes, self-hosted fonts, base layout with the no-flash theme script, ThemeToggle, Backdrop | complete | - | - | 1 | PRPs/plans/stage-2-foundation-phase-2-tokens-themes-and-fonts.plan.md |
| 3 | Content collections and strings | `profile`, `projects` and `stack` collections with schemas and the approved copy, `src/strings.ts` | complete | - | - | 1 | PRPs/plans/stage-2-foundation-phase-3-content-collections-and-strings.plan.md |
| 4 | Page components | The Design System page components ported to typed React, rendered statically, with their styles and the photo placeholder | complete | - | - | 2, 3 | PRPs/plans/stage-2-foundation-phase-4-page-components.plan.md |
| 5 | Home page | Skip link, nav and popover mobile menu, the five sections per the screens, the D20 backdrop, the footer, responsive layout | complete | - | - | 4 | PRPs/plans/stage-2-foundation-phase-5-home-page.plan.md |
| 6 | Project pages and 404 | `/projects/<slug>` header-only pages (with a body only where the entry has one) and the plain 404 served with status 404 | complete | - | - | 5 | PRPs/plans/stage-2-foundation-phase-6-project-pages-and-404.plan.md |
| 7 | Quality gates and preview deploy | The full CI: E2E, the axe matrix, the privacy and token checks, Lighthouse CI, the size budgets, screenshot baselines, and the Workers Builds preview verified on the pull request | complete | - | - | 6 | PRPs/plans/stage-2-foundation-phase-7-quality-gates-and-preview-deploy.plan.md |

### Phase Details

**Phase 1: Scaffold and CI skeleton**
- **Goal:** A buildable, lintable, testable empty site with CI running on every pull request.
- **Scope:** Astro 6 (static) + `@astrojs/react` + React + TypeScript strict; pnpm with `packageManager`, a committed lockfile and `.node-version`; ESLint flat config (`typescript-eslint`, `eslint-plugin-astro`, React, React Hooks, `jsx-a11y`), Prettier with `prettier-plugin-astro`; Vitest and Playwright + `@axe-core/playwright` with one smoke test each; scripts `dev`, `build`, `preview`, `check`, `lint`, `format`, `test`, `test:e2e`; only the docs/06 folders Stage 2 needs (no empty `runtime/` or `stores/`); `.gitignore` for `node_modules`, `dist`, `.astro`, test and Lighthouse reports; `scripts/worktree-bootstrap.sh` and `.ps1` running `pnpm install --frozen-lockfile`; `wrangler.jsonc` for static assets; a CI workflow with lint, check, unit, build and E2E jobs; a minimal index page; the real commands recorded in docs/context/testing.md and docs/development.md.
- **Success signal:** `pnpm install --frozen-lockfile && pnpm lint && pnpm astro check && pnpm test && pnpm build && pnpm test:e2e` passes locally and in CI. Partially covers AC-1 and AC-11.

**Phase 2: Tokens, themes and fonts**
- **Goal:** Both themes and the type system available to every component, with no theme flash.
- **Scope:** `src/styles/tokens.css` (all Design System v2 tokens, both themes, checked against docs/03); `src/styles/base.css` (reset, type-style classes, 2px `--accent` focus ring with 2px offset, selection color, 68ch measure, `prefers-reduced-motion` and `prefers-reduced-transparency` fallbacks); Geist and JetBrains Mono self-hosted and preloaded; the base layout with the inline head theme script; ThemeToggle with its accessible names and `localStorage` persistence; Backdrop (glows across section boundaries and the film grain, decision recorded in visual-design.md); the contrast unit test.
- **Success signal:** AC-4 passes; the contrast test passes in both themes; AC-9 holds for everything added.

**Phase 3: Content collections and strings**
- **Goal:** All approved content validated at build time and interface copy centralized.
- **Scope:** `src/content.config.ts` and an importable schema module; `profile` (name, headline, role, subtitle, photo, location, bio, links), the 4 project files (relay with the fork note body), `stack.json`; limits from docs/05 (summary ≤ 140, tags 2–4, status enum, bio under 100 words, cover and photo fields pointing at placeholders); `src/strings.ts` with section eyebrows, titles, leads, labels, accessible names and the 404 copy; schema tests with invalid fixtures under `tests/`, never in `src/content/`.
- **Success signal:** AC-7 passes; `pnpm build` validates the real content.

**Phase 4: Page components**
- **Goal:** The Design System page components available as typed, statically rendered React components.
- **Scope:** NavBar (without the `⌘K` button), MobileMenu (popover markup), ThemeToggle wiring, SectionHeading, Button, TextLink, IconLink, Tag, StatusBadge, Photo (`cutout` and the placeholder state), Backdrop, ProjectCard (title link to `/projects/<slug>`, `repo ↗`, CSS cover placeholder, hover/focus states), StackGroup, StackChip, Footer (`Source ↗` and the copyright line only), ProjectHeader, Prose; inline icons; component styles reading only tokens; the 900×1600 photo placeholder SVG; static-render unit tests.
- **Success signal:** Each component renders to the expected semantic HTML in Vitest; AC-9 holds; CSS stays within budget.

**Phase 5: Home page**
- **Goal:** The approved final page, navigable and accessible, in both themes and at the three breakpoints.
- **Scope:** `src/pages/index.astro` and the five `src/sections/`; skip link; sticky 64 px nav with the scrolled state (Should); the `☰` popover menu below 768 px; the banner hero (two-line name, photo placeholder 960/760/480 px tall in front of the name and running into About on desktop and tablet, below the name on mobile; role, intro, `See my work ↓`, GitHub and LinkedIn); About; the staggered 2 × 2 Projects grid with the last cover overlapping Stack; Stack in 3/2/1 columns; Contact with the display type; the footer; the glows placed across section boundaries; per-page title and description.
- **Success signal:** AC-1, AC-2, AC-3, AC-6, AC-12 and AC-13 pass; the owner sees parity with the five final-page artboards locally.

**Phase 6: Project pages and 404**
- **Goal:** Every link on the site resolves; unknown paths get a real 404.
- **Scope:** `src/pages/projects/[slug].astro` from the collection (ProjectHeader with back link, title, summary, year, status, tags, Repo, cover placeholder; Prose body when present); `src/pages/404.astro` in the page register ("Page not found." and "Go home") with the nav and footer; the 404 status served by `not_found_handling`.
- **Success signal:** AC-14 passes; AC-5 passes on these pages.

**Phase 7: Quality gates and preview deploy**
- **Goal:** Every Stage 2 target enforced in CI and visible on a preview URL.
- **Scope:** The complete E2E suite; the axe matrix (pages × themes × breakpoints, menu open); the privacy check on `dist/`; the token check; Lighthouse CI configuration and assertions; the size budget script; Playwright screenshot baselines generated in CI's Linux environment (Should); the final CI workflow with every check reported separately; Workers Builds connected by the owner and the preview verified on the Stage 2 pull request; docs/context/testing.md listing every suite and its command.
- **Success signal:** AC-5, AC-8, AC-9, AC-10 and AC-11 pass on the pull request; the owner approves visual parity on the preview.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Hosting product (D9 amendment) | Cloudflare Workers Static Assets | Cloudflare Pages (D9 as written) | Cloudflare recommends Workers for new projects and puts new investment there while Pages only gets maintenance; the owner already runs Praesto Sum on Workers. Chosen by the owner on 2026-11-05; docs updated before code |
| Deploy mechanism | Workers Builds (Git integration): preview per pull request, production from `main` | `wrangler` deploy from GitHub Actions after CI passes | No Cloudflare secrets in GitHub; previews built in; branch protection on `main` makes CI gate merges. Chosen by the owner |
| Project pages in Stage 2 | Static `/projects/<slug>` with the header, plus the body when present | Cards link only to the repository until Stage 4 | A navigable site has no broken links; keeps D5. Chosen by the owner |
| 404 in Stage 2 | Plain page-register 404 ("Page not found.", "Go home") | Wait for the Stage 5 `ENOENT` build window | The window is build layer; a navigable site needs a 404 now. Chosen by the owner |
| Theme toggle | Working in Stage 2, `localStorage`, inline no-flash head script, Midnight default | Wait for Stage 5 "theme switching" | Both themes must be testable and the nav shows `◐`; Stage 5 keeps the palette's theme command. Chosen by the owner |
| Mobile menu | Static `popover` menu, no hydration | React island (docs/06 list) | Works without JavaScript and ships less JS; docs/06 updated. Chosen by the owner |
| `⌘K` nav button | Omitted until Stage 5 | A button that does nothing | No non-functional controls on the page (accessibility) |
| Footer content | `Source ↗` and the copyright line | The Design System footer with the build summary and Replay | Replay is runtime (Stage 3) |
| Methodology | `tdd: false` + `test_frameworks: [vitest, playwright]` | `tdd: true` | The scaffold phase cannot be test-first (no framework yet); frameworks must be declared or relay authors no tests. Chosen by the owner |
| Docs amendments | Done in the PRD session right after approval, before Phase 1, uncommitted for review | A docs-only phase before Phase 1 in the pipeline | Docs first; the edits are small. Chosen by the owner |
| Photo placeholder file | A neutral 900×1600 silhouette SVG drawn for the repository | The owner exports the Claude Design asset | The Design System file is an internal blob, not exportable; it is temporary and keeps the framing. Chosen by the owner |
| relay fork note (C15) | "The repository is a fork of Wirasm/prp. relay is the plugin I built inside it." in the relay project page body | A longer note on the card | The card summary is approved copy within 140 characters. Wording approved by the owner |
| Section headings and leads | The approved screens' wording | New copy | Stage 1 approved the look with the screens |
| Hero section id | `top`, labelled "Introduction" | `hero` | Matches the Design System NavBar name link (`#top`) and the screens |

---

## Research Summary

**Market Context**
- Astro 6 is the stable major in 2026; a static site needs no adapter (https://docs.astro.build/en/guides/deploy/cloudflare/, https://dev.to/x4nent/astro-6-deep-dive-vite-environment-api-rust-compiler-live-content-collections-and-first-class-bc). Secondary sources disagree on the exact release date; the latest 6.x version was not confirmed from official release notes.
- Astro's built-in Fonts API supports local files and a Fontsource provider that downloads the files and serves them from the site (https://docs.astro.build/en/guides/fonts/); some newer pieces (for example `experimental_getFontFileURL()` in 6.2) are still experimental (https://www.gitclear.com/open_repos/withastro/astro/release/astro@6.2.0).
- Astro's Cloudflare guide says Cloudflare recommends Workers for new projects; a static deploy is a `wrangler.jsonc` with `assets.directory: "./dist"`, and `not_found_handling: "404-page"` serves a custom 404 (https://docs.astro.build/en/guides/deploy/cloudflare/).
- Cloudflare Pages is not deprecated but new features land on Workers only (secondary source: https://www.morphllm.com/comparisons/cloudflare-pages-vs-workers); Workers previews need a `previews` setup, workers.dev preview URLs and preview builds in Workers Builds (https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/).
- Pages Direct Upload cannot later switch to Git integration (https://developers.cloudflare.com/pages/get-started/direct-upload/); Workers previews from Actions use `wrangler versions upload` with `--preview-alias` and need an API token and account ID (https://davistobias-com-5vo.pages.dev/articles/github-cloudflare-worker-deploy).
- Gaps (web research hit its scope cap): no source compared gating a Git-integration deploy on GitHub CI; no source was fetched for the no-flash theme script pattern; `popover` works without JavaScript per MDN, but browser support versions were not confirmed; Lighthouse CI score variance (5–15 points) on runners was the only CI pitfall found.

**Technical Context**
- No application code exists: no `package.json`, lockfile, Astro, TypeScript, ESLint/Prettier configuration, `.github/` workflow or Cloudflare configuration (research-codebase gap).
- `scripts/worktree-bootstrap.sh:24` (and the `.ps1` mirror at line 23) has the `pnpm install --frozen-lockfile` line commented out; Stage 2 enables it, which needs a committed lockfile.
- `.gitignore:1-6` only ignores `.worktrees/` and `.claude/*`; Node/Astro output must be added.
- `.claude/settings.json` allows git, gh and read-only shell commands but no `pnpm` command, denies `pnpm add -g`, `git push origin main*` and mutating `gh api` calls, so Stage 2 work goes through a feature branch and pull request.
- docs/06-architecture.md:56-61 fixes "static by default" React and the island list; docs/06-architecture.md:86-105 the folder plan; docs/06-architecture.md:172-176 the CI and preview contract; docs/development.md:11-22 the planned commands (marked to be confirmed at scaffold time).
- docs/context/methodology.md:4 `test_frameworks: []` and docs/context/testing.md:49-62 (no suites; record real commands when added).
- docs/05-content.md:24-64 defines the `profile`, `projects` and `stack` fields and limits; docs/09-content-draft.md holds the approved values and the privacy list.
- docs/domain/areas/visual-design.md:32-33 lists the two open questions this stage answers (component mapping, film grain). docs/domain/areas/visual-design.md V6 says photo "widths" where docs/03 says heights; docs/03 wins.
- Design System v2 artifact (`components/src/index.tsx`): `ProjectCard` links to `/projects/<slug>` by default; `Footer` includes the build summary and a Replay button; `CoverPlaceholder` is pure CSS; `NavBar` links the name to `#top`; icons are inlined Lucide 1.33.0 and Simple Icons 13.21.0 paths. The artifact lists no placeholder SVG file; the screens canvas (`project/Main.dc.html`) references the photo as an internal blob, uses the section ids `top`, `about`, `projects`, `stack`, `contact`, and ships `project/ds/sitepro/tokens.css`.

---

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Status: APPROVED*
