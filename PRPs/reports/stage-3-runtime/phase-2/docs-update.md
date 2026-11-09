# Docs Update — stage-3-runtime

**PR:** n/a (implement-time sync, Phase 2 of 5, attempt 1)
**Merged at:** 2026-11-08
**Source PRD:** PRPs/prds/stage-3-runtime.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/context/architecture.md`

**Change type:** additive
**Rationale:** The diff adds `src/components/build/` (nine DOM factories), `src/runtime/layer.ts` and `layer-timing.ts`, `src/styles/build-layer.css` and an opt-in `buildSlot` prop on `Footer`. The state line and the folder-table rows for `src/components/build/`, `src/components/page/`, `src/runtime/` and `src/styles/` now describe them. SelectionBox and Skeleton, effects and controls are stated as not built. The window placement rule (left/top/width/height on placement and resize only; per-frame animation transform/opacity only) is recorded as the code implements it.

---

### `docs/04-animations.md`

**Change type:** additive (narrow amendment of one sentence)
**Rationale:** "they move with `transform` only" was imprecise against `BuildWindow.setPlacement`, which writes left/top/width/height. The sentence now says windows are placed that way on placement and resize only, never per frame, because a transformed window root breaks the sticky bars, and that per-frame animation uses transform and opacity only. This follows the code reviewer's advisory.

---

## Candidate Decisions (for operator review)

- Build windows are placed with `left`/`top`/`width`/`height` rather than `transform`, because sticky offsets ignore an ancestor's transform. This is stated in a code comment only, so it was not written to `docs/decisions.md`. Promote it if it should be a durable decision.

## Deferred Questions

- `docs/06-architecture.md` has no "transform only" statement for windows (grep found none), so it was left unchanged. Should it gain the placement note? Suggested default: no, since 04-animations.md and context/architecture.md carry it.

## Files Scanned — No Edit Required

- `docs/06-architecture.md` — no conflicting window-movement claim.
- `docs/context/methodology.md`, `docs/context/conventions.md`, `docs/context/constraints.md`, `docs/decisions.md`, `docs/anti-patterns.md` — PRESERVE; no explicit new decision or pattern stated in the diff.
- `docs/KNOWLEDGE_BASE.md` — no new docs files added.
- `CLAUDE.md` — no change to commands or key patterns.
- `docs/design/component-map.md` — Figma track not applicable to this phase.
- `documentation/` — never touched.

---
*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
