# Docs Update — stage-2-foundation (phase 6)

**PR:** n/a (implement-time docs-sync, not yet merged)
**Merged at:** 2026-11-05
**Source PRD:** PRPs/prds/stage-2-foundation.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/api-reference.md` (in the worktree, code_root)

**Change type:** additive
**Rationale:** Phase 6 adds `src/pages/projects/[slug].astro` (header-only project pages, Markdown body only where present, nav links back to `/#<section>` via the new `homeHref` prop) and `src/pages/404.astro` (plain page-register 404 with a home link). The Routes table rows for `/projects/<slug>` and the unknown-path 404 were amended to state what Stage 2 actually ships, and that the `ENOENT` build window is not implemented yet.

---

## Candidate Decisions (for operator review)

- Shared subpage chrome lives in `src/sections/site-chrome.ts` (`loadSiteChrome`, `pageTitle`); the footer source link is derived from the `site-pro` project's repo link and the build fails if it is missing. Consider recording this in `docs/decisions.md` if stable.
- NavBar/MobileMenu take an optional `homeHref` (default empty) so subpages link to `/#<section>`; consider a note in `docs/context/conventions.md`.

## Deferred Questions

- Should the `ENOENT` build window for the 404 be tracked as a Stage 3 item in the roadmap? — suggested default: yes, leave the note in `docs/api-reference.md` and let the operator add it to the roadmap.

## Files Scanned — No Edit Required

- `docs/context/methodology.md` — `docs_sync: true`; `figma_track: false`, so the component-map step was skipped.
- `docs/context/architecture.md`, `docs/context/conventions.md`, `docs/context/constraints.md`, `docs/decisions.md`, `docs/anti-patterns.md` — PRESERVE-ENTIRELY; no explicit diff hunk requires an edit (see candidates).
- `docs/KNOWLEDGE_BASE.md` — no new docs/ file added.
- `CLAUDE.md` — no user-facing command or key-pattern change.

---
*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Status: APPROVED*
