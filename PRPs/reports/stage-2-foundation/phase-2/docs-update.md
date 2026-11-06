# Docs Update — stage-2-foundation (phase 2)

**PR:** none (pre-merge docs-sync at implement time)
**Merged at:** 2026-11-05
**Source PRD:** PRPs/prds/stage-2-foundation.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

Scope: Stage 2 Phase 2 (tokens, themes, fonts, ThemeToggle, Backdrop). Phase 1's APPROVED manifest is archived at `PRPs/reports/stage-2-foundation/phase-1/docs-update.md`.

## Files Edited

### `docs/domain/areas/visual-design.md` (worktree)

**Change type:** additive
**Rationale:** Edited by the implementation as a plan task, not by this agent. It strikes through the open question on the film grain and records the answer: a generated SVG noise filter (feTurbulence) inlined as a data URI in `src/components/page/Backdrop.css`, with opacity from `--grain-opacity`. Verified against the diff.

---

### `docs/context/integrations.md` (worktree)

**Change type:** additive
**Rationale:** The diff adds `@fontsource-variable/geist` and `@fontsource-variable/jetbrains-mono`, the woff2 files and OFL texts under `public/fonts/`, `src/styles/fonts.css` and font preloads in `src/layouts/Base.astro`. The Fonts row now records how self-hosting was implemented. The existing text is untouched; the sentence is appended to the last cell.

---

## Candidate Decisions (for operator review)

The following were observed in the merged diff but NOT written to `docs/decisions.md`:

- Theme persistence uses localStorage key `sp-theme`, applied by an inline head script before first paint to avoid a theme flash. Midnight is the default. A blocked localStorage falls back to the default.
- The theme toggle is JS-only: the button is `visibility: hidden` until the deferred script sets `data-js` on `<html>`, so no inert control appears without JS.
- `src/styles/tokens.css` is the only file in `src/` allowed to hold color and shadow literals. Consider adding this to `docs/context/conventions.md` or `docs/context/constraints.md` if it is not already stated.
- Page wrapper uses `overflow-x: clip`, never `hidden`, so a later sticky nav keeps working.
- Font files are copied into `public/fonts/` rather than imported from the packages at build time. The packages are dev dependencies only.

## Deferred Questions

- Should the `sp-theme` storage key and the no-flash inline-script pattern be recorded in `docs/decisions.md` or `docs/context/architecture.md`? Suggested default: add a short note to `docs/context/architecture.md` after Phase 5, when the page structure settles.
- Should `docs/context/architecture.md` list the new `src/layouts/`, `src/scripts/` and `src/components/page/` contents? Suggested default: no, because the existing folder table is a planned overview that already covers `src/styles/`. Revisit at Stage 2 close.

## Files Scanned — No Edit Required

- `CLAUDE.md` (worktree) — essential commands and patterns are unaffected by this phase.
- `docs/KNOWLEDGE_BASE.md` — no new docs files were added.
- `docs/context/methodology.md` — `docs_sync: true`, `figma_track: false`; no change needed.
- `docs/context/architecture.md` — `src/styles/` row already lists tokens.css, themes and base.css.
- `docs/decisions.md`, `docs/anti-patterns.md` — PRESERVE-ENTIRELY; nothing stated explicitly enough to write in.
- `docs/design/component-map.md` — Step 3.5 skipped because `figma_track` is false.
- `package.json`, `pnpm-lock.yaml`, `public/fonts/*` — outside the docs write scope.

---
*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Status: APPROVED*
