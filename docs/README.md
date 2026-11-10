# site-pro — Project documentation

> **Status:** ✅ Approved v2.0 · 2026-11-03 · new layout concept (build windows)
> **Current stage:** 1 · Design project ✅ approved on 2026-11-04 (design system, screens, animated prototype). `CLAUDE.md` milestone ✅ generated on 2026-11-04. Stage 2 · Foundation ✅ approved on 2026-11-06 ([PRD](../PRPs/prds/stage-2-foundation.prd.md), [PR #1](https://github.com/fabiombarreto/site-pro/pull/1)). Stage 3 · Runtime ✅ approved on 2026-11-09 ([PRD](../PRPs/prds/stage-3-runtime.prd.md), [PR #2](https://github.com/fabiombarreto/site-pro/pull/2)). Next: Stage 4 · Sections and effects, PRD approved on 2026-11-10 ([PRD](../PRPs/prds/stage-4-sections-effects.prd.md), [07](07-roadmap-and-decisions.md#stages))
> **Project rule:** no production code is written until this documentation is approved.
> **Language:** every project artifact is in English: site, documentation, code, comments, commits.

## The idea in one sentence

A personal website for the **developer community** that **builds itself in front of the visitor**: a typed command opens an application window, the window types its own commands, and each command creates one element of the section, live. When a section is done, its window steps aside and leaves a modern, readable page behind.

```
❯ renderProjects();                           ← typed in the command dock
┌─ ● ● ●  projects.tsx ────────────── 3/5 ─┐  ← a build window opens
│ ❯ projects.card("ai-track-record")█      │  ← the window types its own commands
├──────────────────────────────────────────┤
│ Selected work                            │
│ ┌─────────────────┐ ┏━ card ━━━━━━━━━━┓  │
│ │ relay           │ ┃░░░░░░░░░░░░░░░░░┃  │  ← each command creates one element
│ └─────────────────┘ ┗━━━━━━━━━━━━━━━━━┛  │
└──────────────────────────────────────────┘
✔ Projects Section created. (2.31s)           ← the window fades; the section stays
```

## Index

| #  | Document                                                  | What it answers                                                          |
|----|-----------------------------------------------------------|--------------------------------------------------------------------------|
| 01 | [Concept](01-concept.md)                                   | Why, for whom, scope, principles, and the reference video analysis       |
| 02 | [Experience](02-experience.md)                             | Page layout, the dock, build windows, the first-visit script, behavior rules, mobile |
| 03 | [Design system](03-design-system.md)                       | Themes and colors, typography, layout, components, wireframes            |
| 04 | [Animations](04-animations.md)                             | The build runtime, effects, timings, controls, reduced motion            |
| 05 | [Content](05-content.md)                                   | Sections, data model, microcopy, what is needed from the site owner      |
| 06 | [Architecture](06-architecture.md)                         | Stack (Astro + React + TypeScript), structure, accessibility, SEO, performance |
| 07 | [Roadmap and decisions](07-roadmap-and-decisions.md)       | Stages, exit criteria, risks, and **open decisions** by stage            |
| 08 | [Tools](08-tools.md)                                       | Design tool, development tools, workflow                                 |
| 09 | [Content draft](09-content-draft.md)                       | The actual site content, drafted from the owner's career-ops profile     |

## How to approve

1. Read in order (01 → 09). Documents 02 and 04 are the heart of the proposal; 06 and 08 define the stack and the tools.
2. Answer the open **Stage 1 decisions** in [07](07-roadmap-and-decisions.md#open-decisions). Each one comes with a recommendation, so agreeing or disagreeing is enough.
3. Ask for any changes, in the conversation or directly in the files.
4. Once everything is approved, the status changes to **Approved** and the Stage 1 design work (Design System v2, screens, prototype) begins.

## Glossary

| Term | Meaning |
|---|---|
| **Page** | What stays on screen: the nav, the five sections and the footer, in a modern, readable layout. |
| **Build layer** | Everything that exists only while the site is being built: the dock, build windows, selection boxes, skeletons and agent cursors. It is an overlay and never moves the page. |
| **Boot terminal** | The small terminal in the middle of the first screen, where `startSite();` is typed. It folds into the dock. |
| **Command dock** | The pill at the bottom of the screen that types each section command, shows progress and holds the controls. |
| **Build window** | An application window that opens over a section's place, types the element commands in its command bar and disappears when the section is done. |
| **Section build** | The unit of each section: section command → log → window → element commands → confirmation. |
| **Selection box** | The labeled box (`h1`, `card`) drawn around an element while it is being created, as in a design tool. |
| **Skeleton** | The gray placeholder an element shows before its content arrives. |
| **Runtime** | The JavaScript engine that runs each section's build script. |
| **Turbo** | Accelerated building of pending sections when the visitor jumps straight to a section. |

## Changelog

| Version | Date | Change |
|---|---|---|
| v0.1 | 2026-11-02 | First complete draft (in Portuguese). |
| v0.2 | 2026-11-02 | English-only site (D1). Astro × React comparison. New doc 08 (tools). Roadmap reorganized into stages, with decisions grouped by stage. |
| v0.3 | 2026-11-02 | All documentation translated to English and files renamed. Presentation-only scope confirmed (no login, no API). Decided: Astro + React + TypeScript (D2), Claude Design (D11), public repository (D13); pnpm, ESLint, Prettier, Vitest and Playwright confirmed. GitHub Issues kept as a suggestion (D14). New open decision: license (D16). |
| v0.4 | 2026-11-02 | Decided: Cloudflare Pages hosting (D9) and MIT license for the code, with personal content all rights reserved (D16). All Stage 0 decisions answered. |
| v1.0 | 2026-11-02 | Documentation approved. Stage 1 (design project) begins. |
| v1.1 | 2026-11-02 | Stage 1 decisions: blue accent (D3), essential sections only, with Experience and Articles post-v1 (D4), internal project pages (D5), ASCII → photo hero (D12). First version of the [design system](https://claude.ai/artifact/VtbNMjiH7N1q9buK1pFQ5K) published in Claude Design. Skip button label changed to `» Skip`, avoiding an emoji fallback for `⏭`. |
| v1.2 | 2026-11-02 | Full animation on every visit (D6). Interactive terminal moved to v1.1 (D7). |
| v1.3 | 2026-11-02 | New doc 09: content draft (profile, about, 6 projects, stack, contact) from the career-ops profile, with open questions. |
| v2.0 | 2026-11-02 | New layout concept (D17): **build windows** replace the IDE + terminal + TUI layout, which read as too niche for people outside development. A typed command opens an application window that creates each element of the section live, and the final page is a modern, readable site. Docs 01–09 rewritten or adjusted; the v1 Design System is superseded; the Phosphor theme is retired and Classic becomes Daylight. New open decisions: sans-serif family (D18) and the dock's position (D19). The v1 concept stays in the Git history (`7b147b0`). |
| v2.1 | 2026-11-03 | Concept v2 approved after a first [animated prototype](https://claude.ai/artifact/QnmBawnJozkSAp37DKp73F) (boot, build windows, every section, desktop and mobile). |
| v2.2 | 2026-11-03 | Stage 1 decisions closed: **Geist** for the page (D18), the **dock at the bottom center** (D19), and multi-cursor agents moved to **v1.1** (D8). |
| v2.3 | 2026-11-03 | Design System v2 foundations published in Claude Design: [site-pro v2](https://claude.ai/artifact/CvbHWjN6GHJoYxCTCmk91o) (colors in Midnight and Daylight, Geist and JetBrains Mono, spacing, radius, shadows, layout sizes). Font weights per text style added to [03](03-design-system.md#scale). Daylight syntax colors switched from Eclipse to the Midnight hues, so every syntax color passes AA on every surface. |
| v2.4 | 2026-11-03 | Sections and content defined; [09](09-content-draft.md) approved. The site is a short invitation, not a résumé: headline "Fabio Barreto.", a 54-word About without the facts box, only personal projects (4, in a 2 × 2 grid), Stack without usage frequencies, and Contact through GitHub and LinkedIn with "Brazil (UTC-3)" and no public email. No "How this site was built" page in v1. The photo is pending. Wireframes and the Design System updated to match. |
| v2.5 | 2026-11-04 | A placeholder stands in for the hero photo until the real one arrives: a neutral head-and-shoulders silhouette, added to the Design System (Placeholders). The real photo moves from the Stage 1 checklist to the launch checklist in [05](05-content.md). |
| v2.6 | 2026-11-04 | Design System v2 components published in Claude Design: all 31 components from [03](03-design-system.md#components), for the page and the build layer, in one React bundle with a live preview and usage notes each, checked in both themes. Lucide 1.33.0 and Simple Icons 13.21.0 pinned for icons. `Toast` gains the `warn` level used by the easter egg, and `StatusBadge` drops status hues. |
| v2.7 | 2026-11-04 | Stage 1 screens published in Claude Design: [site-pro v2 screens](https://claude.ai/artifact/HL5MJH8mEdhb7JbSd8kDzS), 17 artboards built from the Design System components. They cover the final page (desktop in both themes, tablet, mobile, the open mobile menu) and the boot, hero window and projects window build states. The relay project page, the Command Palette and the 404 are there too. Build states and the other pages are on desktop and mobile. The relay page copy is a draft from the material in [09](09-content-draft.md#detail-page-material). Design System: `CommandDock` gains `compact` for mobile, and the nav and footer now use the 32 px side padding from [03](03-design-system.md#layout-and-spacing) (16 px under 768 px). |
| v2.8 | 2026-11-04 | One continuous page (**D20**), asked for by the owner after the first screens. A background of soft accent-blue glows and film grain runs behind every section (`Backdrop`, tokens `glow-1`, `glow-2`, `grain-opacity`), and the dot grid moves into the build windows. The hero becomes a banner: the name in giant type on two lines (`--text-banner`, up to 216 px) with a full-body cut-out photo in front of it that runs into About. From Projects on, the project covers carry the continuity in a staggered grid, and the giant type comes back in Contact. The photo requirement changes to a full-body, 9:16 cut-out, with a full-body placeholder until it arrives. Docs 02, 03, 05, 07, 08 and 09, the Design System (32 components) and the screens are updated. |
| v2.9 | 2026-11-04 | Animated prototype v2 published: [site-pro build prototype](https://claude.ai/artifact/ABxEwc9LHKR7cwy3rjQvDj), built on the Design System's own components with the D20 page. It runs the boot and all five sections with the timings in [04](04-animations.md#timings-1-speed), scroll triggers and turbo, Skip, Run all, speed, Replay, the Command Palette, both themes and mobile. `CommandDock` gains the `created` state from the section lifecycle, and page titles are typed with a thin caret. |
| v3.0 | 2026-11-04 | **Stage 1 approved**: the look (Design System v2, the screens and D20) and the rhythm (prototype v2). Project covers move to the launch checklist in [05](05-content.md), like the photo; placeholders stand in until then. Next: the `CLAUDE.md` milestone with the relay plugin's `context-builder`, then Stage 2. |
| v3.1 | 2026-11-04 | **`CLAUDE.md` milestone**: the relay `context-builder` generated `CLAUDE.md`, the [knowledge base](KNOWLEDGE_BASE.md), `context/` (architecture, conventions, integrations, constraints, methodology, testing), `domain/` (glossary, flows and the build, content, navigation and visual-design areas), the [Decision Gate](decision-gate.md), [decisions](decisions.md), [anti-patterns](anti-patterns.md) and four developer docs. Next: Stage 2 · Foundation. |
| v3.2 | 2026-11-05 | **Stage 2 PRD approved** ([stage-2-foundation](../PRPs/prds/stage-2-foundation.prd.md)). D9 amended: hosting moves from Cloudflare Pages to **Cloudflare Workers Static Assets**, deployed by Workers Builds with a preview per pull request. Stage 2 boundaries recorded in [decisions](decisions.md): a working theme toggle, a static `popover` mobile menu (no longer an island), header-only project pages and a plain 404 now; the `ENOENT` 404 window and the palette's theme command stay in Stage 5. Methodology: test-after, with Vitest and Playwright declared. The photo placeholder size in the visual-design area is corrected to heights, matching [03](03-design-system.md). |
| v3.3 | 2026-11-06 | **Stage 2 merged** ([PR #1](https://github.com/fabiombarreto/site-pro/pull/1)): the static page, header-only project pages, the plain 404, tokens, self-hosted fonts, content collections and the nine-job CI. Stale "no code yet" lines are updated in the README, [architecture](architecture.md) and `context/`. The project slug is the file name, not a field ([05](05-content.md)); the type check command is `pnpm check` ([development](development.md)). |
| v3.4 | 2026-11-06 | **Stage 2 approved** by the owner after checking the site: a navigable static page without animation, meeting the accessibility targets, with CI green. Next: Stage 3 · Runtime. |
| v3.5 | 2026-11-08 | **Stage 3 PRD approved** ([stage-3-runtime](../PRPs/prds/stage-3-runtime.prd.md)). Stage 3 ships the runtime, the effects catalog except `image-resolve` and base build scripts for the five sections; Stage 4 adds `image-resolve`, the real assets and per-section tuning. Recorded in [decisions](decisions.md) and the docs: build scripts compiled from step sequences into timelines ([04](04-animations.md)), turbo ×5, deep links and nav clicks that go to the target at once, a focus rule that keeps sections in order, width-only resize ([02](02-experience.md#behavior-rules)), build-layer components as TypeScript DOM factories and the test clock ([06](06-architecture.md)). |
| v3.6 | 2026-11-09 | **Stage 3 merged and approved** ([PR #2](https://github.com/fabiombarreto/site-pro/pull/2)): the runtime builds the page live, with the boot terminal, the dock, build windows, element effects except `image-resolve`, base build scripts for the five sections, skip, run all, speed, replay, turbo, deep links, the focus rule, reduced motion and the saved speed. Every behavior rule in [02](02-experience.md#behavior-rules) is covered by an E2E test, and all nine CI jobs pass. Next: Stage 4 · Sections and effects. |
| v3.7 | 2026-11-10 | **Stage 4 PRD approved** ([stage-4-sections-effects](../PRPs/prds/stage-4-sections-effects.prd.md)). Stage 4 ships with the placeholder photo and covers; the image pipeline (`astro:assets` + `sharp`) makes the real files a content-only swap. `image-resolve`: the hero photo's ASCII version vanishes in a Bayer dither while the photo appears, and covers resolve from an inlined blurred version ([04](04-animations.md)). Budgets keep their values, measured at the `✔ created` line for sections after the hero; cards shorten to about 300–350 ms. Commands and dock logs come from the content ([05](05-content.md)). Committed images carry no metadata. The unstyled → styled effect moves to v1.1 and the Coffee easter egg to Stage 5. Project page text drafted in [09](09-content-draft.md#project-pages-draft-awaiting-approval) for approval. Recorded in [decisions](decisions.md). |
