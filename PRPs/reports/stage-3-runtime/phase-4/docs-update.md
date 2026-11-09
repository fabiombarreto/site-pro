# Docs Update — stage-3-runtime

**PR:** n/a (implement-time sync, Phase 4 of 5, attempt 1)
**Merged at:** 2026-11-08
**Source PRD:** PRPs/prds/stage-3-runtime.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

The patch already carries docs-first edits to `docs/decisions.md`, `docs/02-experience.md`, `docs/04-animations.md`, `docs/06-architecture.md`, `docs/api-reference.md`, `docs/domain/areas/build.md` and `docs/context/architecture.md`. They were checked against the code (CommandDock, FooterBuild, BuildWindow, resize, scheduler, api) and are consistent; no change was made to them in this sync. The three edits below are new.

### `docs/context/constraints.md`

**Change type:** additive
**Rationale:** The accessibility line said the build layer is `aria-hidden`. `CommandDock.ts` now makes the dock a `role="group"` named "Site build" with real buttons (status, log and hint stay `aria-hidden`), as the Phase 4 decision records. The line now states that exception.

---

### `docs/domain/areas/build.md`

**Change type:** additive
**Rationale:** Rule B24 ("The build layer is `aria-hidden`") contradicted the new dock buttons. It now names the exception (Skip, speed, Replay, Play build, Show build status).

---

### `docs/domain/glossary.md`

**Change type:** additive
**Rationale:** The "Build layer" term said "`aria-hidden`" without qualification. It now notes the dock's real control buttons.

---

## Candidate Decisions (for operator review)

- `docs/troubleshooting.md` line 22 says "a resize finishes the current section". Phase 4 code (`resize.ts`, `isWidthChange`) reacts only to a width change, so a height-only resize (mobile URL bar) does nothing. Suggest amending to "a width change finishes the current section". Not edited: the file is outside the write scope.
- Shortcut handling: `Esc` yields to an open popover or dialog, `Shift + Esc` is the run-all key. Already in decisions.md (Phase 4 entry); `docs/domain/areas/navigation.md` N7 and `docs/domain/flows.md` match it, so no edit.
- Replay and Play build force normal speed (1x, saved) from a ready state; a Replay from a finished 1x or 2x build keeps that speed. `docs/domain/flows.md` line 45 says every visit plays the full build "unless the visitor saved the `∞` speed". This holds, but the flow does not say Replay overrides a saved ∞. Consider adding that to flows.md.
- Footer Replay button (`FooterBuild`) is built by the runtime; navigation.md N13 already states "Replay" in the footer, so no edit.
- Not recorded as durable decisions (judgment calls in the code): the dock's `queued n/5` status text, the hold of a skipped section's text for 1.5 s, and the 4 s idle timers. The first two are in the decisions.md entry; the 4 s timers also appear in 04-animations.md.

## Deferred Questions

- Should `docs/troubleshooting.md` be amended for the width-only resize rule, and should `docs/domain/flows.md` mention that Replay overrides a saved `∞`? — suggested default: yes to both, as one-line additive edits in the next docs pass.
- Shift + Esc on Chrome for Windows is unverified (Chrome Task Manager shortcut). — suggested default: keep it as an open question in `docs/02-experience.md` until the owner checks real Chrome; the Stage 5 palette's Run all is the fallback.

## Files Scanned — No Edit Required

- `docs/domain/areas/navigation.md` — N6, N7 and N13 already list Esc, Shift + Esc, Run all, Replay, speed and the footer Replay.
- `docs/domain/flows.md` — Skip, Run all, speed, turbo catch-up, focus rule and reduced-motion Play build already match.
- `docs/troubleshooting.md` — see candidate above (out of scope to edit).
- `docs/context/testing.md` — generic guardrail; no controls-specific statements.
- `docs/KNOWLEDGE_BASE.md` — no new docs files; index unchanged.
- `CLAUDE.md` — says "the build layer (code look, overlay only, `aria-hidden`)" in a key pattern. Left as is (a summary of the two-register rule); consider qualifying it.
- `docs/decisions.md`, `docs/02-experience.md`, `docs/04-animations.md`, `docs/06-architecture.md`, `docs/api-reference.md`, `docs/context/architecture.md` — already updated by the patch and consistent with the code.

---
*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
