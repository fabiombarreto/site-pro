# Docs Update — stage-2-foundation (phase 5: home page)

**PR:** none (implement-time sync, worktree)
**Merged at:** 2026-11-05 (not yet merged)
**Source PRD:** PRPs/prds/stage-2-foundation.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/context/architecture.md` (in the worktree)

**Change type:** additive
**Rationale:** The diff adds `src/sections/profile-links.ts`, composes the five sections in `src/pages/index.astro` with `src/styles/home.css`, and adds `src/scripts/nav.ts` (scrolled-nav class, close-on-link for the mobile menu popover). The folder table now notes these and gains a `src/scripts/` row. No other lines changed.

---

## Candidate Decisions (for operator review)

- The nav is sticky and translucent by default, and goes transparent at the top only once `:root[data-js]` is set (so no-JS visitors keep a readable nav). It falls back to `--bg-raised` under `prefers-reduced-transparency` and when `backdrop-filter` is unsupported. Consider recording this in `docs/decisions.md` or the visual-design area.
- The hero is built from absolutely positioned layers with fixed per-breakpoint heights (836, 700 and 900 px), and the photo overflows into About. This deliberately departs from flow layout, and the runtime will need to respect it.
- Home-page data failures (missing profile, stack, photo, location, or the site-pro repo link) throw at build time instead of rendering fallbacks.
- `SiteMark` was removed, and `<h1>` now lives in `Hero.astro`.

## Deferred Questions

- Should `docs/context/architecture.md` drop "no application code exists yet" (line 3) and the *(planned)* markers? The same stale wording is in `CLAUDE.md`. This is a structural rewrite of preserved files, so it was left alone. Suggested default: update both at the Stage 2 close-out.

## Files Scanned — No Edit Required

- `docs/context/methodology.md` — no methodology change (`figma_track: false`, so the component-map step was skipped).
- `docs/context/conventions.md`, `docs/context/constraints.md`, `docs/decisions.md`, `docs/anti-patterns.md` — the diff states no new decision or anti-pattern explicitly.
- `docs/KNOWLEDGE_BASE.md` — no new docs files were added.
- `CLAUDE.md` — essential commands and patterns are unchanged.
- `docs/domain/areas/*.md` — no domain rule change stated in the diff.

---
*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Status: APPROVED*
