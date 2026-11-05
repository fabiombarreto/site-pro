# Decisions

Stable project decisions that the AI must not re-evaluate.
Updated by the Docs Updater after each approved implementation.
The full decision table, with options and status, is docs/07-roadmap-and-decisions.md; the D-numbers below match it.

---

## [2026-11-02] Presentation-only scope

**Context:** The site promotes the owner's work to the developer community, not to clients (docs/01-concept.md).
**Decision:** A static, presentation-only site: no login, accounts, backend, API, CMS or forms that post anywhere. Content lives in the repository as Markdown/JSON.
**Reason:** It is the current goal and is not expected to change soon; it keeps the site fast, cheap to host and fully static.
**Areas affected:** content, navigation, build

---

## [2026-11-02] D1 · English only

**Context:** The audience is the international developer community.
**Decision:** English for the site and every project artifact (docs, code, comments, commits, pull requests). Interface copy is centralized so another language could be added later.
**Reason:** Chosen by the owner in Stage 0.
**Areas affected:** content, all

---

## [2026-11-02] D2 · Astro + React + TypeScript

**Context:** A static site with a heavy animation layer and a small interactive surface.
**Decision:** Astro (SSG) with React components rendered to static HTML, a few hydrated islands, TypeScript strict. The animation runtime is plain TypeScript outside React and manipulates the DOM directly; nanostores share its state with the islands.
**Reason:** Complete HTML for SEO and no-JS visitors, minimal JS on the critical path, and no React re-render per typed character (docs/06-architecture.md).
**Areas affected:** build, navigation, visual-design

---

## [2026-11-02] D9 · Cloudflare hosting (amended 2026-11-05)

**Context:** Static hosting with previews.
**Decision:** Cloudflare Workers Static Assets, deployed by Workers Builds (Git integration): a preview deployment per pull request and production from `main`. No Cloudflare secret is stored in GitHub; branch protection on `main` makes the CI checks gate merges. Amended on 2026-11-05; the Stage 0 choice was Cloudflare Pages.
**Reason:** Chosen by the owner in Stage 0. Amended by the owner in the Stage 2 PRD (PRPs/prds/stage-2-foundation.prd.md): Cloudflare recommends Workers for new projects and puts new investment there, while Pages only gets maintenance, and the owner already runs a project on Workers.
**Areas affected:** all

---

## [2026-11-02] D11 · Claude Design, Figma as fallback

**Context:** Stage 1 needed a design system, screens and an animated prototype.
**Decision:** Claude Design holds the Design System, screens and prototype; Figma (with its MCP) is the fallback. The decisions are mirrored in `docs/`.
**Reason:** Chosen by the owner; documenting everything in `docs/` mitigates the tool's research-preview status.
**Areas affected:** visual-design

---

## [2026-11-02] D13 · Public repository, D16 · MIT license

**Context:** The site is also a showcase of how it was built.
**Decision:** The repository is public. Code is MIT; personal content (text, photo, images) is all rights reserved.
**Reason:** The build commands on screen must match the real public source (technical authenticity); personal content stays protected.
**Areas affected:** content, build

---

## [2026-11-02] D17 · Build windows concept (v2)

**Context:** The v1 concept put the whole site inside an IDE with TUI sections.
**Decision:** A typed command opens a build window that creates the section live; the window then disappears and leaves a modern, readable page.
**Reason:** The owner found the IDE layout too niche and hard to read for people outside development.
**Areas affected:** build, visual-design

---

## [2026-11-02] D3 · Midnight + blue

**Context:** Default theme and accent.
**Decision:** Midnight (dark) by default with accent `#2563eb`; Daylight (light) available from the nav.
**Reason:** Chosen by the owner in Stage 1.
**Areas affected:** visual-design

---

## [2026-11-02] D5 · Internal project pages

**Context:** What a project card click does.
**Decision:** An internal page `/projects/<slug>` with a card → header view transition; cards keep a direct `repo ↗` shortcut.
**Reason:** Chosen by the owner in Stage 1.
**Areas affected:** navigation, content

---

## [2026-11-02] D6 · Full build on every visit

**Context:** How revisits behave.
**Decision:** Every visit, reloads included, plays the full build; a visitor's saved `∞` speed is the only exception.
**Reason:** Chosen by the owner in Stage 1; Skip, Run all and speed keep it from being a burden.
**Areas affected:** build

---

## [2026-11-02] D7 · Interactive dock in v1.1

**Context:** Whether visitors can type commands.
**Decision:** Not in v1. In v1.1 the collapsed dock opens a prompt for the site's own commands.
**Reason:** Keeps v1 scope closed.
**Areas affected:** build, navigation

---

## [2026-11-02] D12 · Hero photo: ASCII → real photo

**Context:** How the hero photo appears.
**Decision:** The photo's build effect starts from an ASCII version generated at build time from the photo itself and dissolves into the real photo.
**Reason:** Chosen by the owner in Stage 1.
**Areas affected:** build, visual-design

---

## [2026-11-03] D4 · Essential sections only

**Context:** Which sections v1 ships.
**Decision:** Hero, About, Projects, Stack, Contact, plus project pages and the 404. Experience and Articles and talks are post-v1. No separate "How this site was built" page: the site-pro project page tells that story.
**Reason:** Confirmed by the owner on 2026-11-03.
**Areas affected:** content, navigation

---

## [2026-11-03] D8 · Multi-cursor agents in v1.1

**Context:** A tribute to the reference reel's agent swarm.
**Decision:** v1 builds one element at a time per window; 2–4 labeled agent cursors come in v1.1, desktop only.
**Reason:** Tested in the prototype; one element at a time reads more clearly. Retried later with the real content.
**Areas affected:** build

---

## [2026-11-03] D18 · Geist for the page

**Context:** Sans-serif family for the page register.
**Decision:** Geist for the page, JetBrains Mono for the build layer, both self-hosted.
**Reason:** Very legible, technical without being a code font, open license (OFL) and variable.
**Areas affected:** visual-design

---

## [2026-11-03] D19 · The dock at the bottom center

**Context:** Where the terminal goes after the boot.
**Decision:** The boot terminal folds into a pill dock at the bottom center that stays as the build HUD and holds Skip, speed and Replay.
**Reason:** It echoes the reel's HUD, keeps controls in one predictable place and never covers the reading area.
**Areas affected:** build, visual-design

---

## [2026-11-03] Only personal projects; privacy list

**Context:** Content sourced from the owner's private career profile.
**Decision:** Only personal projects appear. Never publish phone, email, compensation targets, city, relocation/visa policy, application or interview data, recruiter notes, past employers or client projects. Location is `Brazil (UTC-3)`.
**Reason:** The site is a short invitation, not a résumé; that data stays private (docs/09-content-draft.md).
**Areas affected:** content

---

## [2026-11-04] D20 · One continuous page

**Context:** The first screens read as separate, boxed sections.
**Decision:** One backdrop (glows across section boundaries + grain) behind the whole page; the hero is a banner with the giant name and a full-body cut-out photo running into About; staggered project covers carry continuity; the giant type returns in Contact; the dot grid lives only inside build windows.
**Reason:** Asked for by the owner after reviewing the first screens.
**Areas affected:** visual-design, build

---

## [2026-11-04] Stage 1 approved: look and rhythm

**Context:** Stage 1 exit criteria (docs/07-roadmap-and-decisions.md).
**Decision:** The look (screens + D20) and the rhythm (prototype v2, docs/04-animations.md timings) are approved; they are the reference for Stages 2–4.
**Reason:** Approved by the owner on 2026-11-04.
**Areas affected:** build, visual-design

---

## [2026-11-05] Stage 2 PRD approved: scope boundaries and methodology

**Context:** Stage 2 · Foundation needed its boundaries with Stages 3–5 settled (PRPs/prds/stage-2-foundation.prd.md).
**Decision:** Stage 2 ships a working theme toggle (Midnight by default, saved in `localStorage`, applied by an inline head script before first paint), a static HTML `popover` mobile menu that works without JavaScript, header-only project pages at `/projects/<slug>` (with a body only where the entry has one, such as relay's fork note) and a plain page-register 404. The nav's `⌘K` button, the footer's build summary and Replay, the `ENOENT` 404 window and the palette's theme command wait for their stages. The photo placeholder is a neutral 900 × 1600 silhouette drawn for the repository. Methodology: test-after (`tdd: false`) with Vitest and Playwright declared in docs/context/methodology.md.
**Reason:** Approved by the owner on 2026-11-05: a navigable site has no broken links or dead controls, both themes must be testable, and the scaffold phase cannot be test-first.
**Areas affected:** navigation, visual-design, content, build

---

<!-- Template for future entries:

## [YYYY-MM-DD] Title of the decision

**Context:** Why this decision was needed.
**Decision:** What was decided.
**Reason:** Why this option was chosen over alternatives.
**Areas affected:** [list domain areas]

-->
