# Docs Update — stage-2-foundation (phase 4)

**PR:** n/a (implement-time sync, diff_source=patch)
**Merged at:** 2026-11-05
**Source PRD:** PRPs/prds/stage-2-foundation.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/context/conventions.md` (in the worktree)

**Change type:** additive
**Rationale:** The phase 4 diff adds the first React components under `src/components/page/` and the file says file naming and folder-per-component rules are set in Stage 2. Kept the existing `[INFERRED - VALIDATE]` line (softened to "not fully defined") and appended the patterns the diff shows. Components are flat PascalCase `.tsx` files with named exports. Helpers are lowercase `.ts` files (`cx.ts`, `resolve-asset.ts`). Styles are `.css` files shared per family (`Actions.css`, `Labels.css`) or per component, imported first, and use `sp-` classes. Shared assets live in `src/assets/` and go through `resolveAssetUrl`.

---

## Candidate Decisions (for operator review)

- Folder-per-component is not used; components are flat in `src/components/page/`. If this is stable, record it in `docs/decisions.md` and drop the `[INFERRED - VALIDATE]` marker in conventions.md.
- `MobileMenu` is a static popover and `NavBar` ships without the command palette trigger. Confirm these are final v1 choices rather than Phase 5+ placeholders before recording them.
- `Footer` omits the Replay control in this phase. Confirm this is deferred to the runtime stage.
- Page components use a shared `cx` class-name helper instead of a class-name library. Minor; record only if a no-new-dependency rule is wanted.

## Deferred Questions

- Should the import-order convention (CSS first, siblings, then types/helpers) be promoted to a hard rule and enforced by ESLint? — suggested default: leave it descriptive until a lint rule exists.
- Should `docs/context/architecture.md` list the `src/assets/` and `cx`/`resolve-asset` helpers? — suggested default: no, the folder table already lists `src/components/page/`.

## Files Scanned — No Edit Required

- `docs/context/architecture.md` — already lists `src/components/page/` and `src/strings.ts`; the new components fit the documented layout.
- `docs/context/methodology.md` — `docs_sync: true`, `figma_track: false`; no change. Step 3.5 skipped (figma_track is false).
- `docs/context/constraints.md`, `docs/decisions.md`, `docs/anti-patterns.md` — the diff states no new decision or forbidden pattern explicitly.
- `docs/KNOWLEDGE_BASE.md` — no new `docs/` file was added.
- `CLAUDE.md` — essential commands and key patterns are unchanged.
- `docs/domain/*` — the `src/strings.ts` additions (`menuAriaLabel`, `year`) are interface copy, not domain rules.

---
*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Status: APPROVED*
