# 07 · Roadmap and decisions

## Stages

| Stage | Deliverable | Done when |
|---|---|---|
| **0 · Foundations** ✅ | Documentation, stack and working tools; root `README.md`; Git repository initialized | Docs approved and Stage 0 decisions answered |
| **1 · Design project** ✅ | Content, color and features defined; the v2 concept (build windows, D17); Design System v2; desktop/tablet/mobile screens of the final page and of the build states; animated prototype of the boot (terminal → dock → hero window → final hero) and the scroll to Projects, all in Claude Design (see [08](08-tools.md#design-tool)) | The look **and the rhythm** are approved and Stage 1 decisions are answered. ✅ Approved on 2026-11-04: the look with the screens and D20, the rhythm with [prototype v2](https://claude.ai/artifact/ABxEwc9LHKR7cwy3rjQvDj) |
| **Milestone · `CLAUDE.md`** ✅ | Generated with the relay plugin's `context-builder` command: `CLAUDE.md`, `docs/KNOWLEDGE_BASE.md`, `docs/context/`, `docs/domain/`, the Decision Gate, decisions and anti-patterns | Documentation and planning are complete, before Stage 2. ✅ Generated on 2026-11-04 |
| **2 · Foundation** ✅ | Astro + React + TypeScript project, tokens and themes (with a working theme toggle), nav and the five sections as a static modern page with the approved copy and the photo and cover placeholders, header-only project pages and a plain 404, CI and preview deployments ([PRD](../PRPs/prds/stage-2-foundation.prd.md)) | A navigable static site, without animation, meeting the accessibility targets. ✅ Merged in [PR #1](https://github.com/fabiombarreto/site-pro/pull/1) and approved by the owner on 2026-11-06 |
| **3 · Runtime** ✅ | Scheduler with overlapping steps, boot terminal, dock, build windows, element effects, triggers, skip, run all, speed, replay, turbo, deep links, focus rule, reduced motion, persistence, and base build scripts for the five sections ([PRD](../PRPs/prds/stage-3-runtime.prd.md)) | Every scenario in [02 · Behavior rules](02-experience.md#behavior-rules) covered by an E2E test. ✅ Merged in [PR #2](https://github.com/fabiombarreto/site-pro/pull/2) and approved by the owner on 2026-11-09 |
| **4 · Sections and effects** | Hero (photo ASCII → photo), About, Projects (with project pages), Stack and Contact, with the real content and their build scripts tuned from the Stage 3 base scripts; `image-resolve` (the ASCII photo and covers resolving from blur) | Every section with the effects from [04](04-animations.md), within its budget |
| **5 · Extras** | Command Palette (with its theme command), nav scroll-spy, card → project page transitions, the `ENOENT` 404 window, easter eggs | Shortcuts and palette fully usable by keyboard |
| **6 · Polish and launch** | Accessibility audit, performance, SEO, OG images, analytics, cross-browser testing, a readability test with people who don't code, domain | Targets from [01](01-concept.md#how-we-will-know-it-worked) met, site live and a "how I built this site" post |
| **v1.1** | Interactive dock (D7), multi-cursor agents (D8), a Phosphor theme easter egg | — |
| **Post-v1** | Experience and Articles and talks sections (D4) | When there is content for them |

**Launch (v1)** = Stages 2 to 4 + controls (skip/speed) + mobile + the Command Palette and project pages from Stage 5 + Stage 6. The rest of Stage 5 can move to v1.1 if we want to launch sooner.

> Production code starts only in Stage 2, once documentation and design are approved. Stage 1 prototypes live in the design tool and are disposable.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The build feels long (dock + window + elements) | Budgets (hero ≤ 3.2 s, other sections ≤ 2.5 s), overlapping steps, skip and speed always visible, and measuring "Skip" usage to recalibrate |
| SEO hurt by "hidden" content | SSG with complete HTML; the build only hides things visually, and only after JS confirms it will run |
| Screen readers reading noise (commands, logs, skeletons) | The whole build layer is `aria-hidden`; pending content stays in the accessibility tree |
| High LCP because the hero waits for the build | Headline typed by ~1.7 s, photo complete by ~2.4 s, photo loaded with priority, LCP measured in Lighthouse CI |
| Overlays out of place (resize, late fonts) | Windows placed from each section's box with `ResizeObserver`; fonts preloaded before the boot; a resize during a build finishes that section |
| Blur and shadows slowing down low-end phones | Blur only on a few surfaces and only while visible; a solid fallback with `prefers-reduced-transparency` or without support |
| React adding weight to the first load | React components render to static HTML; only a few islands hydrate, after idle, off the critical path |
| Looking like a copy of an operating system or of the reel | Our own window chrome (neutral dots, our type), our own grammar and pacing; no OS or app branding |
| Scope creep, "just one more effect" | v1 scope closed above; new ideas go to v1.1 |
| Claude Design changing or leaving *research preview* | The design system and decisions are documented in `docs/`; Figma (with its MCP) is the fallback |

---

## Open decisions

Each decision comes with a recommendation. Agreeing or disagreeing is enough.

### Stage 0 · Foundations: documentation, stack and tools

| # | Decision | Options | Recommendation | Status |
|---|---|---|---|---|
| **D1** | Language | PT-BR · EN · bilingual | — | ✅ **English only**, for the site and every project artifact (docs, code, commits) |
| **D2** | Stack | Astro · Next.js · SvelteKit · other | — | ✅ **Astro + React + TypeScript** |
| **D9** | Hosting | Cloudflare Pages · Vercel · Netlify · GitHub Pages | — | ✅ **Cloudflare Workers Static Assets**, deployed by Workers Builds with a preview per pull request (amended on 2026-11-05 in the [Stage 2 PRD](../PRPs/prds/stage-2-foundation.prd.md); first decided as Cloudflare Pages, which now only gets maintenance) |
| **D11** | Design tool | Claude Design · Figma · Penpot | — | ✅ **Claude Design** (Figma as a fallback) |
| **D13** | Repository visibility | Public · private | — | ✅ **Public** |
| **D14** | Task management | GitHub Issues + Projects · other · none | **GitHub Issues** when the work calls for it | ⏸ Suggestion, decide when needed |
| **D16** | License (public repository) | MIT · Apache-2.0 · other | — | ✅ **MIT for the code**; personal content (text, photo, images) all rights reserved |

### Stage 1 · Design project: content, color and features

| # | Decision | Options | Recommendation | Status |
|---|---|---|---|---|
| **D17** | Layout concept | v1: the site inside an IDE, with TUI sections · v2: build windows | — | ✅ **v2: build windows** (2026-11-02). A typed command opens an application window that builds the section live, and the final page is a modern, readable site. The v1 IDE layout read as too niche for people outside development |
| **D3** | Default theme and accent color | Blue · amber · violet · terminal green · a personal color | — | ✅ **Midnight + blue `#2563eb`**, dark by default, with the light Daylight theme in the nav |
| **D4** | v1 sections | Essentials · + Experience · + Articles and talks | — | ✅ **Essentials only**: Hero, About, Projects, Stack, Contact. Experience and Articles and talks are post-v1. Confirmed on 2026-11-03, with no separate "How this site was built" page: the site-pro project page tells that story |
| **D5** | Project card click | Internal page · direct external link | — | ✅ **Internal page**, opened with a card → page transition, with a direct repo shortcut on the card |
| **D6** | Revisits | Full animation always · at 2× · instant | — | ✅ **Full build on every visit**, reloads included; a visitor's own `∞` speed choice is kept |
| **D7** | Interactive terminal | v1 · v1.1 | — | ✅ **v1.1**, after launch: the collapsed dock opens a real prompt |
| **D8** | Multi-cursor agents, a tribute to the reel | Include in v1 · v1.1 · drop | — | ✅ **v1.1**, after launch (2026-11-03), decided after testing them in the prototype. v1 builds one element at a time in each window, which reads more clearly; the agents are retried with the real content |
| **D12** | Hero photo | ASCII → real photo · permanent ASCII (photo on hover) · no photo | — | ✅ **ASCII → real photo**, now as the photo's build effect |
| **D18** | Sans-serif family for the page | Geist · Inter · Space Grotesk · other | — | ✅ **Geist** (2026-11-03): very legible, technical without being a code font, open license (OFL) and variable |
| **D20** | How the page holds together | Separate, boxed sections · one continuous page | — | ✅ **One continuous page** (2026-11-04), asked for by the owner after the first screens. A background of soft accent-blue glows and grain runs behind every section; the hero becomes a banner with the giant name and a full-body cut-out photo in front of it, running into About; from Projects on, the project covers (in a staggered grid) carry the continuity; the giant type comes back in Contact. The dot grid moves into the build windows |
| **D19** | Where the terminal goes after the boot | A dock at the bottom center that stays as the build HUD · a small terminal window in a corner · nothing (controls move into each window) | — | ✅ **The dock at the bottom center** (2026-11-03): it echoes the reel's HUD, keeps skip and speed in one predictable place and never covers the content's reading area |

### Stage 6 · Launch

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D10** | Analytics | Cloudflare Web Analytics · Plausible · Umami · none | **Cloudflare Web Analytics** (free and cookieless), mainly to tune the build pace |
| **D15** | Domain | — | To be defined |
