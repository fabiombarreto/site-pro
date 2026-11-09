# Docs Update — stage-3-runtime-controls-fix-footer-slot-layout

**PR:** n/a (pre-merge, /relay-implement Phase A.3.5, fix pass attempt 2)
**Merged at:** 2026-11-08 (not yet merged)
**Source PRD:** none (PRD-less plan: PRPs/plans/stage-3-runtime-controls-fix-footer-slot-layout.plan.md)
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

None. The plan wrote its docs first, and the fix-pass patch already carries every docs change the code needs: `docs/domain/areas/build.md` (B27, B28), `docs/02-experience.md`, `docs/06-architecture.md`, `docs/context/architecture.md` and `docs/decisions.md`. I checked the rest of `docs/` in `code_root` and found no contradiction, so I made no further edit.

## Candidate Decisions (for operator review)

- None. The patch's decision (footer slot width, speed button names containing glyphs) is already recorded in `docs/decisions.md` (2026-11-08).

## Deferred Questions

- None.

## Files Scanned — No Edit Required

- `docs/api-reference.md`, `docs/domain/glossary.md`, `docs/04-animations.md`, `docs/domain/areas/navigation.md`, `docs/context/constraints.md`, `docs/domain/flows.md`, `docs/07-roadmap-and-decisions.md` — no old speed button name (`Build speed: 1x. Switch to 2x`, or "instant" without the ∞ glyph) and no differing footer slot description. The `Speed: 1× / 2× / instant` palette command names and the glossary Speed entry are unrelated to the button's accessible name and are consistent.
- `docs/decisions.md` — the old names appear only in the new entry's Context, as a historical description of the defect; this is correct and was left alone.
- `docs/context/architecture.md` — the `FooterBuild` and `buildSlot` description is already updated by the patch, and no second mention contradicts it.
- `docs/KNOWLEDGE_BASE.md`, `CLAUDE.md` — no new docs file and no essential-command or key-pattern change.
- `docs/design/component-map.md` — not applicable (no Figma track phase in this change).

### Outside the docs write scope (for the operator's awareness)

- `tests/unit/runtime-controls-timing.test.ts` (lines 35 to 40), `tests/e2e/controls-speed.spec.ts` (lines 43, 52, 62, 74, 140, 145) and `tests/e2e/controls-dock-a11y.spec.ts` (line 30) still assert the OLD names (`Build speed: 1x. Switch to 2x`, `Build speed: instant. Switch to 1x`). They are not touched by this patch, which has no test files. Unless they are updated elsewhere in the fix pass, they will fail against the new `src/strings.ts`. I did not edit them, because they are outside this agent's write scope.
- `PRPs/prds/stage-3-runtime.prd.md:81` quotes the old name as an example. It is a PRD, so it is read-only here, and `docs/decisions.md` records that the PRD structure is kept and only the characters change.

---
*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
