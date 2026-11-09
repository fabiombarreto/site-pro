# Docs Update — stage-3-runtime

**PR:** 2
**Merged at:** 2026-11-09
**Source PRD:** C:/repos/site-pro/PRPs/prds/stage-3-runtime.prd.md
**Effective configuration:** diff_source=pr, non_interactive=true, docs_sync=true

## Files Edited

None. The merged PR already carries the docs-first edits for every area it touched: `docs/02-experience.md`, `docs/04-animations.md`, `docs/06-architecture.md`, `docs/KNOWLEDGE_BASE.md`, `docs/api-reference.md`, `docs/context/architecture.md`, `docs/context/constraints.md`, `docs/context/testing.md`, `docs/decisions.md`, `docs/development.md`, `docs/domain/areas/build.md` and `docs/domain/glossary.md`. They were written by the per-phase implement-time syncs. Evaluated against the current merged state, this pass produced no delta. The merge added no new `docs/` file, so no index change is needed beyond what Phase 5 already did in `docs/KNOWLEDGE_BASE.md`.

## Candidate Decisions (for operator review)

- None new. The measured gzip sizes in `docs/context/testing.md` are a dated measurement, not a decision.
- Carried from Phases 4 and 5 (outside write scope, still open): `docs/troubleshooting.md` says "a resize finishes the current section", but the code reacts only to a width change. Suggest a one-line amendment.
- Carried from Phase 4: `docs/domain/flows.md` could say that Replay overrides a saved `∞` speed.
- `CLAUDE.md` intro still reads "Stage 2 scaffolded the project (…CI with nine jobs)". The PR did not change it. Updating it to mention the Stage 3 runtime belongs with the orchestrator's stage close-out, so it was left alone.

## Deferred Questions

- Should the "Gap closed by" column in the `docs/context/testing.md` coverage map be reworded to "Covered by" now that the specs are merged? — suggested default: yes, at the Stage 3 close-out. The spec files `behavior-gaps`, `layout-invariance`, `axe-build-matrix` and `mobile-build` are in the merged diff.
- Open owner items stay untouched: the `docs/04` pop "Scale from 0.9 to 1" row, the `docs/02` "real-browser check is pending the owner" sentence, the `docs/02` speed names, and the Shift + Esc "unverified" sentence in `docs/decisions.md`. — suggested default: keep open until the owner checks in a real browser.
- Screenshot baselines of build states are not generated (they need CI's Linux environment). — suggested default: generate them in a later CI-only change.

## Files Scanned — No Edit Required

- `docs/context/architecture.md`, `docs/context/constraints.md`, `docs/context/testing.md`, `docs/decisions.md`, `docs/domain/areas/build.md`, `docs/domain/glossary.md`, `docs/api-reference.md`, `docs/development.md`, `docs/KNOWLEDGE_BASE.md` — already updated by the merged PR. No uncommitted change exists under `docs/` or `CLAUDE.md`.
- `docs/context/methodology.md` — frontmatter has `docs_sync: true`, `tdd: false`, `figma_track: false`. Step 3.5 (component-map upgrade) was skipped because `figma_track` is false.
- `docs/anti-patterns.md`, `docs/context/conventions.md` — no contradiction with the diff. PRESERVE rule applied.
- `docs/07-roadmap-and-decisions.md`, `docs/README.md` — Stage 3 close-out is handled by the orchestrator, so they were not touched.
- `documentation/` — not touched.

---
*Generated: 2026-11-09*
*Approved: 2026-11-09*
*Status: APPROVED*
