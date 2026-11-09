# Docs Update — stage-3-runtime

**PR:** n/a (implement-time sync, Phase 1 of 5, attempt 2)
**Merged at:** 2026-11-08
**Source PRD:** PRPs/prds/stage-3-runtime.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/context/architecture.md`

**Change type:** additive
**Rationale:** The diff adds `src/runtime/*`, `src/stores/build.ts`, `src/scripts/build-mode.ts`, `src/styles/build-pending.css`, `src/sections/*.build.ts` and `scripts/verify-build-targets.mjs`. The folder table and the state line now describe them; later phases (effects, overlays, controls) are explicitly marked as not built.

---

### `docs/development.md`

**Change type:** additive
**Rationale:** `astro.config.mjs` now runs `verifyBuildTargets` after the build and fails it on a missing `data-build-target`.

---

### `docs/context/testing.md`

**Change type:** additive
**Rationale:** `check-budgets.mjs` now measures a runtime budget (18 KB gzip, home-only JS followed through imports).

---

### `docs/api-reference.md`

**Change type:** additive
**Rationale:** New "Build data contract" subsection for `data-build`, `data-build-target`, the `<html>` state attributes and the `sp-speed` key.

---

## Candidate Decisions (for operator review)

- Effect durations in `src/runtime/compiler.ts` are provisional (Phase 3 tunes them); not recorded as a decision.
- The runtime JS budget of 18 KB is a new project limit; consider adding it to `docs/context/constraints.md` (Performance budgets) and docs/06-architecture.md if the PRD does not already fix it.
- The `nanostores` dependency is in `package.json`; `@nanostores/react` is not yet added (docs/context/architecture.md still lists it as part of the stack).

## Deferred Questions

- Should `docs/context/constraints.md` list the 18 KB runtime budget now? — suggested default: yes, add when the PRD's budget wording is confirmed.

## Files Scanned — No Edit Required

- `docs/decisions.md` — PRD decisions already committed in base 28e52b9; no new explicit decision in the diff.
- `docs/anti-patterns.md` — no new forbidden pattern stated.
- `docs/context/constraints.md`, `docs/context/conventions.md`, `docs/context/methodology.md` — preserved; nothing stated concretely by the diff.
- `docs/KNOWLEDGE_BASE.md` — no new docs file added.
- `CLAUDE.md` — essential commands unchanged.
- `docs/domain/areas/build.md` — already describes the runtime rules.
- `docs/design/component-map.md` — `figma_track: false`, Step 3.5 skipped.

---
*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
