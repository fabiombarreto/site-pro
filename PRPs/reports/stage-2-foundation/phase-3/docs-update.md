# Docs Update — stage-2-foundation (phase 3)

**PR:** n/a (implement-time sync, diff_source=patch)
**Merged at:** 2026-11-05
**Source PRD:** PRPs/prds/stage-2-foundation.prd.md
**Effective configuration:** diff_source=patch, non_interactive=true, docs_sync=true

## Files Edited

### `docs/api-reference.md` (in the worktree)

**Change type:** additive
**Rationale:** Phase 3 adds `src/content-schemas.ts` (strict Zod schemas), `src/content.config.ts` (file loader for profile/stack, glob loader for projects) and the content files. Added a paragraph naming these files, noting that the project `slug` is the file name (not a frontmatter field), `cover` is optional, and links must be `https://`. The schema table rows were left untouched.

---

### `docs/context/conventions.md` (in the worktree)

**Change type:** additive (narrow amendment)
**Rationale:** `src/strings.ts` now exists (and is consumed by `ThemeToggle.tsx` and `src/scripts/theme.ts`), so the word "planned" was removed from the interface-copy convention.

---

## Candidate Decisions (for operator review)

- Project slug is derived from the Markdown file name via the glob loader, not stored as a `slug` field; docs/05-content.md still lists `slug` as a field row. Consider amending that table (human-validated content doc).
- `cover` is optional in `projectSchema` while docs/05-content.md says every project has a 16:9 cover; revisit when real covers land.
- `profile.json` and `stack.json` wrap their data under a single top-level key (`profile`, `stack`) as the file loader requires an id-keyed object.
- Bio limit is enforced as fewer than 100 words, matching 05-content.md; schema constants (`SUMMARY_MAX_LENGTH` 140, tags 2 to 4) mirror the doc.
- `docs/development.md` still lists `slug` among the fields to put in a project Markdown file; operator may want to adjust.

## Deferred Questions

- Should docs/05-content.md and docs/development.md drop `slug` from the project field list? — suggested default: yes, note that the file name is the slug.

## Files Scanned — No Edit Required

- `docs/05-content.md` — human-validated content spec; discrepancies recorded as candidates above.
- `docs/development.md` — mentions `slug`; recorded as candidate.
- `docs/context/architecture.md` — `src/content/` and `src/strings.ts` rows already accurate.
- `docs/decisions.md`, `docs/anti-patterns.md` — no explicit new decision or pattern in the diff.
- `docs/KNOWLEDGE_BASE.md`, `CLAUDE.md` — no new docs files or user-facing commands.
- `docs/design/component-map.md` — `figma_track: false`, step 3.5 skipped.

---
*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Status: APPROVED*
