# site-pro — Project documentation

> **Status:** ✅ Approved v2.0 · 2026-11-03 · new layout concept (build windows)
> **Current stage:** 1 · Design project (content, color, features, design system, screens, animated prototype)
> **Project rule:** no production code is written until this documentation is approved.
> **Language:** every project artifact is in English: site, documentation, code, comments, commits.

## The idea in one sentence

A personal website for the **developer community** that **builds itself in front of the visitor**: a typed command opens an application window, the window types its own commands, and each command creates one element of the section, live. When a section is done, its window steps aside and leaves a modern, readable page behind.

```
❯ renderProjects();                           ← typed in the command dock
┌─ ● ● ●  projects.tsx ────────────── 2/6 ─┐  ← a build window opens
│ ❯ projects.card("ai-track-record")█      │  ← the window types its own commands
├──────────────────────────────────────────┤
│ Selected work                            │
│ ┌──────────┐ ┏━ card ━━━┓ ┌┄┄┄┄┄┄┄┄┄┄┐   │
│ │ relay    │ ┃░░░░░░░░░░┃ ┆          ┆   │  ← each command creates one element
│ └──────────┘ ┗━━━━━━━━━━┛ └┄┄┄┄┄┄┄┄┄┄┘   │
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
