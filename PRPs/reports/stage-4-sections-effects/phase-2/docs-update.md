# Docs Update — stage-4-sections-effects (Phase 2: image-resolve)

**PR:** n/a (worktree implement-time sync)
**Merged at:** 2026-11-10
**Source PRD:** PRPs/prds/stage-4-sections-effects.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

Edits were made in the worktree `C:/repos/site-pro/.worktrees/stage-4-sections-effects/docs/` (uncommitted, on top of Phase 1's docs sync).

## Files Edited

### `docs/04-animations.md`

**Change type:** additive
**Rationale:** The `image-resolve` row gave a bare "700 ms"; the code (`effect-timing.ts`) makes the step 1,000 ms (`RESOLVE_REVEAL_MS` 300 + `DISSOLVE_MS` 700, 16 Bayer steps). The `build-card` row now states the cover resolve ramp (`cardPhases().cover = ramp(250, 400)`) that fades the blur cover out while the real cover rises.

---

### `docs/03-design-system.md`

**Change type:** additive
**Rationale:** Added `AsciiOverlay` and `BlurCover` rows to the build-layer component table (new factories in `src/components/build/`).

---

### `docs/06-architecture.md`

**Change type:** index-update
**Rationale:** The folder-structure line for `components/build/` now lists `AsciiOverlay` and `BlurCover`.

---

### `docs/context/architecture.md`

**Change type:** additive
**Rationale:** The `src/components/build/` row now records that Phase 2 adds `AsciiOverlay` and `BlurCover` (`aria-hidden`, placed with `transform`).

---

## Candidate Decisions (for operator review)

- The photo rises from a non-zero opacity (`PHOTO_START_OPACITY` = 0.12, a tunable constant) because a hidden image is not counted as the largest paint. The docs already say "low, non-zero opacity"; the value itself is a tuning detail, so not written to `decisions.md`.
- The runtime duplicates the ASCII cell advance (`ASCII_ADVANCE` = 0.6 em) instead of importing the build-time module, because that module pulls in `sharp`. This is a stable constraint worth recording in `docs/decisions.md` or `docs/context/constraints.md` if the operator agrees.

## Deferred Questions

- Should the `hero.photo("<file>")` typed-command argument (file name derived from the photo metadata, with an ellipsis fallback for stubs) be noted in `docs/02-experience.md`, which still lists `hero.photo(…)`? — suggested default: yes, update on the next docs pass after the Stage 4 hero content is final.

## Files Scanned — No Edit Required

- `docs/domain/areas/build.md` — B21, B22, B29 and B30 already describe the mechanics (page untouched, overlap, command source) as the code implements them.
- `docs/domain/glossary.md` — `image-resolve` already in the Effect list.
- `docs/anti-patterns.md`, `docs/decisions.md` — already cover `image-resolve`; no new explicit decision or pattern in the diff.
- `docs/KNOWLEDGE_BASE.md`, `CLAUDE.md` — no new `docs/` file or essential command.
- `docs/design/component-map.md` — `figma_track` not exercised for this feature; Step 3.5 skipped.

---
*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Status: APPROVED*
