# Docs Update — stage-4-sections-effects

**PR:** none (implement-time sync, Phase 1)
**Merged at:** 2026-11-10
**Source PRD:** PRPs/prds/stage-4-sections-effects.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

Docs edits were made in the worktree `C:/repos/site-pro/.worktrees/stage-4-sections-effects` (code_root).

## Files Edited

### `docs/context/architecture.md`

**Change type:** additive
**Rationale:** The diff adds `src/images/` (`pipeline.ts`, `ascii.ts`, `blur.ts`) and `src/components/page/image-source.ts`, and changes how Photo, ProjectCard and ProjectHeader render images. A new folder-structure row describes them.

---

### `docs/development.md`

**Change type:** additive
**Rationale:** `scripts/check-privacy.mjs` now also scans `src/assets` for image metadata and accepts an `--assets` flag.

---

### `docs/context/testing.md`

**Change type:** additive
**Rationale:** Same `check:privacy` change: the image EXIF/XMP scan and the `--assets` flag are added to the command's description.

---

### `docs/context/conventions.md`

**Change type:** additive
**Rationale:** Content images no longer go through `resolveAssetUrl`. They are `image()` fields handled by `src/images/pipeline.ts`.

---

## Candidate Decisions (for operator review)

- `sharp` is now a direct runtime dependency (`^0.35.5`), used by the pipeline and the privacy scan. `docs/06` already records `astro:assets` with `sharp`, so this is probably covered.
- The ASCII art is fixed at 48 columns with a 10-character ramp and a 0.6 cell aspect, and the blur is a 32 px WebP at quality 40. These are implementation constants; record them only if they should be binding.
- `resolve-asset.ts` and `resolveAssetUrl` may now be unused by content images. Confirm whether to remove them and update the conventions line once Phase 1 ends. The patch did not show a deletion.

## Deferred Questions

- Should `docs/06-architecture.md` list the responsive widths (photo 960/760/480 px heights, covers 480/960 px) and the `data-build-ascii` and `data-build-blur` attributes? — suggested default: no, keep them in `architecture.md` only.

## Files Scanned — No Edit Required

- `docs/05-content.md`, `docs/domain/areas/content.md` — already describe `image()` fields and the metadata rule (C17, C18).
- `docs/06-architecture.md` — already lists the image optimization and the inlined blur.
- `docs/decisions.md`, `docs/anti-patterns.md` — no explicit new decision or pattern in the diff.
- `CLAUDE.md`, `docs/KNOWLEDGE_BASE.md` — no new command or docs file.
- `docs/design/component-map.md` — Step 3.5 skipped; `figma_track` was not checked beyond this, and the diff carries no Figma-sourced phase evidence.

---
*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Status: APPROVED*
