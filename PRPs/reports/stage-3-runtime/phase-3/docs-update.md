# Docs Update — stage-3-runtime

**PR:** n/a (implement-time sync, Phase 3 of 5, attempt 2)
**Merged at:** 2026-11-08
**Source PRD:** PRPs/prds/stage-3-runtime.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/context/architecture.md`

**Change type:** additive
**Rationale:** The diff adds `src/runtime/effect-timing.ts`, `effect-dom.ts` and `effects.ts`, `src/sections/pacing.ts`, `SelectionBox`, `Skeleton` and `TextOverlay`, rewrites the five base scripts, and adds the `data-build-fx` hidden rule to `build-pending.css` and the `sp-build-fx` layer to `build-layer.css`. The state line and the rows for `src/components/build/`, `src/sections/`, `src/runtime/` and `src/styles/` now describe them. The pop mechanism is stated as the code implements it (inset `clip-path` with overshoot plus opacity). Controls and persistence are still stated as not built (Phase 4 not documented as done).

---

### `docs/domain/areas/build.md`

**Change type:** additive
**Rationale:** New "Effect mechanics (Stage 3 Phase 3)" section records what effects may write on page elements, the overlay-only items, the pop mechanism, the 29-character window command cut and the hero compile times (headline about 1.84 s, final 3.1 s), all taken from the diff and dispatch notes.

---

## Candidate Decisions (for operator review)

- `pop` is implemented as an inset `clip-path` with overshoot plus opacity, not the "Scale from 0.9 to 1" stated in `docs/04-animations.md` (effects catalog, `pop` row), because a transform on a page element would change measured boxes. Decide whether to amend the catalog wording and record this in `docs/decisions.md`. Not written to either file.
- Effects may write only `data-build-fx`, inline `opacity` and inline `clip-path` on page elements (stated in an `effect-dom.ts` comment). Promote to a decision or anti-pattern if it should be durable.
- Window commands are cut to 29 characters with `…`. Promote if it should be a durable decision.
- Hero timing (headline readable about 1.84 s, final 3.1 s) sits inside the B21 budgets (≤ 2.0 s, ≤ 3.2 s); no budget change proposed.

## Deferred Questions

- Should `docs/04-animations.md` `pop` row ("Scale from 0.9 to 1 with a slight overshoot") be reworded to match the clip-path mechanism? Suggested default: yes, after the owner confirms the candidate decision above (outside this agent's write scope).

## Files Scanned — No Edit Required

- `docs/04-animations.md` — outside write scope; discrepancy flagged above.
- `docs/context/methodology.md`, `docs/context/conventions.md`, `docs/context/constraints.md`, `docs/decisions.md`, `docs/anti-patterns.md` — PRESERVE; no explicit new decision or pattern stated in the diff.
- `docs/KNOWLEDGE_BASE.md` — no new docs files added.
- `CLAUDE.md` — no change to commands or key patterns.
- `docs/design/component-map.md` — figma_track is false; step skipped.
- `documentation/` — never touched.

---
*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
