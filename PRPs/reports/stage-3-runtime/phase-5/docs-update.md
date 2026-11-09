# Docs Update — stage-3-runtime

**PR:** n/a (implement-time sync, Phase 5 of 5, attempt 1)
**Merged at:** 2026-11-08
**Source PRD:** PRPs/prds/stage-3-runtime.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

The patch (Phase 5, docs only, no production code) already carries docs-first edits to `docs/context/testing.md` (coverage map, conventions, measured budgets), `docs/api-reference.md` (Runtime TypeScript API) and `docs/development.md` (Lighthouse and E2E sections). They are already in the worktree and were not changed in this sync. The edit below is new.

### `docs/KNOWLEDGE_BASE.md`

**Change type:** index-update
**Rationale:** Three index lines were stale or incomplete against the patch. The `testing.md` line still said "empty until the test pair authors tests". The `api-reference.md` and `development.md` lines did not mention the new runtime TypeScript API, the Lighthouse recipe or the E2E section. No new docs files were added.

---

## Candidate Decisions (for operator review)

- Measured gzip sizes (JS total 13.9 KB, runtime 12.1 KB, critical 12.8 KB, CSS 7.4 KB) are recorded in `docs/context/testing.md` as a dated measurement, not a decision. No `decisions.md` entry proposed.
- The rule "a scheduler change needs a record in docs/decisions.md" (end of the new api-reference section) restates an existing docs-first rule. No new entry needed.
- Carried from Phase 4: `docs/troubleshooting.md` still says "a resize finishes the current section" while the code reacts only to a width change. Suggest a one-line amendment in the next docs pass (outside write scope).
- Carried from Phase 4: `docs/domain/flows.md` could say that Replay overrides a saved `∞` speed.

## Deferred Questions

- The testing.md coverage map lists specs under "Gap closed by" (`behavior-gaps`, `layout-invariance`, `axe-build-matrix`, `mobile-build`) as authored in Phase 5. Should the column be reworded to "Covered by" once the test pair's specs are merged? — suggested default: yes, at the Stage 3 close-out, after confirming the spec files exist.
- Open owner items, left untouched and not resolved: the `docs/04` pop "Scale from 0.9 to 1" row; the `docs/02` sentence "real-browser check is pending the owner"; the `docs/02` speed names; the Shift + Esc "unverified" sentence in `docs/decisions.md`. — suggested default: keep open until the owner checks in a real browser.
- Screenshot baselines of build states are advisory and not generated (they need CI's Linux environment). — suggested default: keep as is; generate them in a later CI-only change.

## Files Scanned — No Edit Required

- `docs/context/testing.md`, `docs/api-reference.md`, `docs/development.md` — already updated by the patch; consistent with each other (the Lighthouse command and `CHROME_PATH` match across testing.md and development.md; thresholds match `lighthouserc.json` as described).
- `docs/context/methodology.md` — frontmatter unchanged (`docs_sync: true`, `tdd: false`); no edit.
- `docs/context/architecture.md`, `docs/context/constraints.md`, `docs/decisions.md`, `docs/anti-patterns.md` — no contradiction with the new sections; PRESERVE rule applied, no edits.
- `CLAUDE.md` — essential commands already list `pnpm lighthouse` and `pnpm test:e2e` with a pointer to docs/development.md; no edit.
- `docs/02-experience.md`, `docs/04-animations.md` — open owner items, untouched.
- `documentation/` — not touched.

---
*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
