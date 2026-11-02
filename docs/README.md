# site-pro — Project documentation

> **Status:** ✅ Approved v1.0 · 2026-11-02
> **Current stage:** 1 · Design project (content, color, features, design system, screens, animated prototype)
> **Project rule:** no production code is written until this documentation is approved.
> **Language:** every project artifact is in English: site, documentation, code, comments, commits.

## The idea in one sentence

A personal website for the **developer community** that presents itself as **a program running inside an IDE**. Visitors watch commands being typed into a terminal, and each section of the site appears as that program's output, drawn in the style of text user interfaces (TUIs). Everything stays clickable, selectable and navigable like a regular website.

```
❯ startSite();
[21:04:31] info   Initializing application...
[21:04:32] info   Rendering Hero Section...
  ╭─ hero ─────────────────────────────╮
  │  name · photo · title · subtitle   │
  ╰────────────────────────────────────╯
✔ Hero Section created. (1.21s)

❯ █        ← waits for the visitor to scroll before running the next command
```

## Index

| #  | Document                                                  | What it answers                                                          |
|----|-----------------------------------------------------------|--------------------------------------------------------------------------|
| 01 | [Concept](01-concept.md)                                   | Why, for whom, scope, principles, and the reference video analysis       |
| 02 | [Experience](02-experience.md)                             | IDE layout, the section-by-section script, behavior rules, mobile        |
| 03 | [Design system](03-design-system.md)                       | Themes and colors, typography, TUI character kit, components, wireframes |
| 04 | [Animations](04-animations.md)                             | The execution runtime, effects, timings, controls, reduced motion        |
| 05 | [Content](05-content.md)                                   | Sections, data model, microcopy, what is needed from the site owner      |
| 06 | [Architecture](06-architecture.md)                         | Stack (Astro + React + TypeScript), structure, accessibility, SEO, performance |
| 07 | [Roadmap and decisions](07-roadmap-and-decisions.md)       | Stages, exit criteria, risks, and **open decisions** by stage            |
| 08 | [Tools](08-tools.md)                                       | Design tool, development tools, workflow                                 |

## How to approve

1. Read in order (01 → 08). Documents 02 and 04 are the heart of the proposal; 06 and 08 define the stack and the tools.
2. Answer the **Stage 0 decisions** in [07](07-roadmap-and-decisions.md#open-decisions). Each one comes with a recommendation, so agreeing or disagreeing is enough. Content, color and features are decided in Stage 1.
3. Ask for any changes, in the conversation or directly in the files.
4. Once everything is approved, the status changes to **Approved** and Stage 1 (design project) begins.

## Glossary

| Term | Meaning |
|---|---|
| **IDE chrome** | The fixed parts that imitate an IDE: title bar, activity bar, Explorer, tabs, breadcrumbs and status bar. |
| **Console** | The page body, where the "program" runs. |
| **Execution block** | The unit of each section: typed command → logs → rendered content → confirmation → new prompt. |
| **Runtime** | The JavaScript engine that orchestrates typing, logs and rendering for each block. |
| **TUI** | *Text User Interface*: an interface drawn with characters (`┌─┐ │ └┘ █▓▒░`), like `htop` or `lazygit`. |
| **Turbo** | Accelerated execution of pending blocks when the visitor jumps straight to a section. |

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
