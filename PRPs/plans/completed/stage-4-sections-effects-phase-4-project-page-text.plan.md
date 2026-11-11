# Feature: Project page text (Phase 4 of stage-4-sections-effects)

```
**Decision Gate**
- Active context: none
- Activated criteria: content change (project page copy, an owner-approved text copied into the content collection); business rules for content (C3, C4, C12, C13, C14, C15, C16); navigation (project pages, D5); cross-cutting privacy rule (private-data list)
- Decisions found:
  - Presentation-only scope: content lives in the repository as Markdown, no CMS or backend
  - D1 English only; D5 internal project pages; D16 personal content all rights reserved
  - Only personal projects and the privacy list (no phone, email, compensation, city, visa, recruiter notes, past employers, client projects)
  - [2026-11-10] Project page text approved by the owner (docs/09-content-draft.md "Project pages", status approved); the four blocks are copied as is into `src/content/projects/<slug>.md`
  - Stage 4 PRD (approved 2026-11-10): Phase 4 copies the approved bodies, checks Prose rendering, privacy and voice
- Applicable anti-patterns:
  - Invented numbers and banned copy patterns (no em dash, no banned AI vocabulary, no number absent from docs/09, no "this isn't X, it's Y")
  - Publishing private data
  - Mixing the two registers (page copy is plain English; no code-flavored build-layer text on the page)
  - Weakening tests to get a green run (stale content-copy assertions are updated by the test pair, never deleted or loosened by the Implementer)
  - Scope creep into v1
- Applicable architectural rules:
  - SSG with complete final HTML: the bodies render to static HTML through the content collection and `<Prose>`
  - docs/ is the source of truth and is updated before code: the approval is already recorded in docs/09, docs/05, docs/decisions.md and content.md, so this phase does not re-edit them
  - Page register stays modern and readable (headings and lists only, tokens from Prose.css)
  - WCAG 2.2 AA in both themes; Lighthouse >= 95 on `/projects/relay/`
  - relay artifacts live in PRPs/, nothing under .claude/
- Result: PROCEED
```

## Source

- `PRPs/prds/stage-4-sections-effects.prd.md` — Implementation Phases row 4: "Project page text" — Goal: Each project page tells its story. — Success signal: AC-13 passes; Lighthouse on `/projects/relay` stays ≥ 0.95.

## Summary

Copy the four owner-approved project page bodies from `docs/09-content-draft.md` ("## Project pages", status approved on 2026-11-10) into the bodies of `src/content/projects/relay.md`, `ai-track-record.md`, `praesto-sum.md` and `site-pro.md`, byte-faithfully (the fenced block content without the fence lines). Front matter (title, summary, tags, links, year, status, order) stays untouched. No code changes are needed: `src/pages/projects/[slug].astro` already renders `<Content />` inside `<Prose>` whenever the body has text, and `Prose.css` already styles the `##` headings, lists and paragraphs the bodies use. relay's body replaces its one-sentence fork note with the full text, whose first line is that same sentence, so C15 stays satisfied.

## User Story

As a visitor who opened a project card
I want to read what each project is, how it works and what Fabio learned
So that the project page tells a story instead of showing only a header

## Problem Statement

The four project pages hold only a header: relay's body is one sentence and the other three bodies are empty, so `/projects/relay`, `/projects/ai-track-record`, `/projects/praesto-sum` and `/projects/site-pro` have nothing to read, and the launch checklist in docs/05-content.md still lists project page text. The owner approved the text on 2026-11-10.

## Solution Statement

Treat the approved docs/09 blocks as the single source and copy each as is into the matching content file's body. Validate by comparing every body to its docs/09 block with a script (the deliverable IS the text, so an exact comparison is the right check), by scanning the bodies for the voice and privacy rules, and by building the site and confirming the rendered pages carry the text. No docs are re-edited; no tests are authored by the Implementer.

## Metadata

| Key | Value |
|-----|-------|
| Type | Content |
| Complexity | Low |
| Systems Affected | `src/content/projects/*.md` (content collection `projects`), rendered by `src/pages/projects/[slug].astro` and `src/components/page/Prose.tsx` |
| Dependencies | Phases 1-3 complete (the worktree already holds their results); owner approval of the text (recorded 2026-11-10); none on other rows (`Depends` is `-`) |
| Estimated Tasks | 5 |
| Source PRD line ref | `PRPs/prds/stage-4-sections-effects.prd.md:187` (row 4), Phase Details lines 207-210, AC-13 line 82 |
| phase_type | docs |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `docs/09-content-draft.md` | 76-165 | The approved bodies: one fenced `markdown` block per project (relay, AI Track Record, Praesto Sum, site-pro) under "## Project pages", plus the status and sources note |
| P0 | `docs/09-content-draft.md` | 11-21 | Writing rules (no em dash, no banned vocabulary, no invented numbers) that the copy must still satisfy |
| P0 | `src/content/projects/relay.md` | 1-16 | Current front matter (stays untouched) and the one-sentence body that the full text replaces |
| P0 | `src/pages/projects/[slug].astro` | 31-32, 55-59 | Body rendering: `<Content />` inside `<Prose>` only when the body has text |
| P1 | `src/components/page/Prose.css` | 10-24, 26-39 | How `##` headings, paragraphs and lists render; the page `<h1>` comes from `ProjectHeader`, so body `##` headings nest correctly beneath it |
| P1 | `src/components/page/ProjectHeader.tsx` | 50-51 | The page's own `<h1>` (the project title) and summary; bodies must not add another `#` heading |
| P1 | `src/content/projects/praesto-sum.md` | 1-14 | Shape of an empty-body entry (front matter ends the file) that three of the four edits extend |
| P1 | `docs/domain/areas/content.md` | 20-23 | C12 to C15: numbers, voice, register and the relay fork note |
| P1 | `tests/unit/content-copy.test.ts` | 155-172 | Read only: existing assertions on the bodies (relay fork-note equality, the other three empty) that this phase makes stale; the test pair updates them |
| P2 | `scripts/check-privacy.mjs` | 17-19, 64-66 | `pnpm check:privacy` rejects any external anchor on the built pages other than the approved profiles and repositories |
| P2 | `lighthouserc.json` | 6 | `/projects/relay/` is audited, which also confirms the built page path `dist/projects/relay/index.html` |

## Patterns to Mirror

Grounded by direct reads of the worktree files (no research subagent was dispatched for this four-file content phase; each anchor below was read in this run).

```
# SOURCE: src/content/projects/relay.md:14-16
---

The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.
```
Task 1 copies this shape: front matter closes with `---`, one blank line, then the Markdown body.

```
# SOURCE: src/content/projects/praesto-sum.md:13-14
status: in development
---
```
Tasks 2, 3 and 4 copy this shape: an empty-body entry ends right after the closing `---`; the body goes after it, separated by one blank line.

```
# SOURCE: tests/unit/content-copy.test.ts:155-163
  it('gives relay the fork note as its body', () => {
    const body = readNormalized('src/content/projects/relay.md')
      .split('\n---\n')
      .slice(1)
      .join('\n---\n');
```
Tasks 1 to 4 reuse this body-extraction idiom (split on `\n---\n`, drop the front matter, normalize CRLF) in their VALIDATE commands, so the comparison reads a body the way the repository's own tests do.

```
# SOURCE: src/pages/projects/[slug].astro:31-32
const hasBody = Boolean(entry.body?.trim());
const Content = hasBody ? (await render(entry)).Content : undefined;
```
Task 5 relies on this: once a body has text, the page renders it, which the build output check confirms.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/content/projects/relay.md` | UPDATE | Replace the one-sentence body with the approved relay block (the fork note stays as its first line, C15) |
| `src/content/projects/ai-track-record.md` | UPDATE | Add the approved AI Track Record body after the front matter |
| `src/content/projects/praesto-sum.md` | UPDATE | Add the approved Praesto Sum body after the front matter |
| `src/content/projects/site-pro.md` | UPDATE | Add the approved site-pro body after the front matter |

## NOT Building (Scope Limits)

- Any edit to docs/09-content-draft.md, docs/05-content.md, docs/decisions.md or docs/domain/areas/content.md: the approval is owner input already present before this phase. A docs sync after implementation may add only genuinely new facts.
- Any change to front matter fields (title, summary, tags, links, year, status, order, featured), to `src/content-schemas.ts`, to `[slug].astro`, `Prose.tsx`, `Prose.css` or `ProjectHeader.tsx`: rendering already works.
- Editing the approved text: no rewording, no added numbers, links or emphasis; copy as is.
- Authoring or editing any test file (the stale `tests/unit/content-copy.test.ts` assertions are the test pair's work, routed through its lifecycle ledger).
- Project covers, new cover art, the real photo (owner content, Stage 4 NOT Building).
- The card to project page view transition and `open("slug");` (Stage 5), OG images and analytics (Stage 6).
- Any change under `src/runtime/` (frozen by AC-14) and the Phase 5 quality-gate work (E2E matrix, Lighthouse LCP assertion, docs/context/testing.md).

## Step-by-Step Tasks

All VALIDATE commands run with a POSIX shell from the worktree root (`code_root`). The comparison script reads the approved block from `docs/09-content-draft.md` ("## Project pages", the `### <HEADING>` subsection, its first fenced `markdown` block) and compares it with the body of `src/content/projects/<SLUG>.md`, after normalizing CRLF and trimming surrounding whitespace.

### Task 1: UPDATE src/content/projects/relay.md

- **ACTION**: Delivers AC-A1, AC-A2, AC-A3 and AC-A5. Replace the single body line `The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.` (after the closing `---` of the front matter) with the full content of the `### relay` fenced `markdown` block in `docs/09-content-draft.md` (lines 84-105, without the two fence lines), byte-faithfully: its first line is the same fork sentence, followed by the sections `## The problem`, `## How it works` (with its numbered list of four stages) and `## What I learned`. Leave every front matter line unchanged. Use one blank line between the closing `---` and the first body line, and end the file with a single newline.
- **MIRROR**: `# SOURCE: src/content/projects/relay.md:14-16`
- **VALIDATE**: `SLUG=relay HEADING=relay node -e 'const fs=require("fs");const n=s=>s.replace(/\r\n/g,"\n");const doc=n(fs.readFileSync("docs/09-content-draft.md","utf8"));const sec=doc.split("\n## Project pages\n")[1].split("\n## Stack\n")[0];const part=sec.split("\n### "+process.env.HEADING+"\n")[1];const m=part&&/```markdown\n([\s\S]*?)\n```/.exec(part);if(!m){console.error("FAIL: no approved block");process.exit(1)}const f=n(fs.readFileSync("src/content/projects/"+process.env.SLUG+".md","utf8"));const body=f.split("\n---\n").slice(1).join("\n---\n");if(body.trim()!==m[1].trim()){console.error("FAIL: body differs from docs/09 block");process.exit(1)}if(!body.includes("The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.")){console.error("FAIL: fork note missing");process.exit(1)}console.log("PASS: "+process.env.SLUG+" body matches docs/09")'`

### Task 2: UPDATE src/content/projects/ai-track-record.md

- **ACTION**: Delivers AC-A1, AC-A3 and AC-A5. After the closing `---` of the front matter (the file currently ends there), add one blank line and the full content of the `### AI Track Record` fenced `markdown` block in `docs/09-content-draft.md` (lines 111-121, without the fence lines): `## The question`, `## The method` and `## Status`, byte-faithfully. Leave the front matter unchanged and end the file with a single newline.
- **MIRROR**: `# SOURCE: src/content/projects/praesto-sum.md:13-14`
- **VALIDATE**: `SLUG=ai-track-record HEADING="AI Track Record" node -e 'const fs=require("fs");const n=s=>s.replace(/\r\n/g,"\n");const doc=n(fs.readFileSync("docs/09-content-draft.md","utf8"));const sec=doc.split("\n## Project pages\n")[1].split("\n## Stack\n")[0];const part=sec.split("\n### "+process.env.HEADING+"\n")[1];const m=part&&/```markdown\n([\s\S]*?)\n```/.exec(part);if(!m){console.error("FAIL: no approved block");process.exit(1)}const f=n(fs.readFileSync("src/content/projects/"+process.env.SLUG+".md","utf8"));const body=f.split("\n---\n").slice(1).join("\n---\n");if(body.trim()!==m[1].trim()){console.error("FAIL: body differs from docs/09 block");process.exit(1)}console.log("PASS: "+process.env.SLUG+" body matches docs/09")'`

### Task 3: UPDATE src/content/projects/praesto-sum.md

- **ACTION**: Delivers AC-A1, AC-A3 and AC-A5. After the closing `---` of the front matter (the file currently ends there), add one blank line and the full content of the `### Praesto Sum` fenced `markdown` block in `docs/09-content-draft.md` (lines 127-143, without the fence lines): `## What it is`, `## Why one user`, `## Why Cloudflare Workers` and `## Installing it`, byte-faithfully. Leave the front matter unchanged and end the file with a single newline.
- **MIRROR**: `# SOURCE: src/content/projects/praesto-sum.md:13-14`
- **VALIDATE**: `SLUG=praesto-sum HEADING="Praesto Sum" node -e 'const fs=require("fs");const n=s=>s.replace(/\r\n/g,"\n");const doc=n(fs.readFileSync("docs/09-content-draft.md","utf8"));const sec=doc.split("\n## Project pages\n")[1].split("\n## Stack\n")[0];const part=sec.split("\n### "+process.env.HEADING+"\n")[1];const m=part&&/```markdown\n([\s\S]*?)\n```/.exec(part);if(!m){console.error("FAIL: no approved block");process.exit(1)}const f=n(fs.readFileSync("src/content/projects/"+process.env.SLUG+".md","utf8"));const body=f.split("\n---\n").slice(1).join("\n---\n");if(body.trim()!==m[1].trim()){console.error("FAIL: body differs from docs/09 block");process.exit(1)}console.log("PASS: "+process.env.SLUG+" body matches docs/09")'`

### Task 4: UPDATE src/content/projects/site-pro.md

- **ACTION**: Delivers AC-A1, AC-A3 and AC-A5. After the closing `---` of the front matter (the file currently ends there), add one blank line and the full content of the `### site-pro` fenced `markdown` block in `docs/09-content-draft.md` (lines 149-164, without the fence lines): `## The idea`, `## How it works` (with its four bullets), `## How I built it` and the closing sentence about the MIT license, byte-faithfully. Leave the front matter unchanged and end the file with a single newline.
- **MIRROR**: `# SOURCE: src/content/projects/praesto-sum.md:13-14`
- **VALIDATE**: `SLUG=site-pro HEADING=site-pro node -e 'const fs=require("fs");const n=s=>s.replace(/\r\n/g,"\n");const doc=n(fs.readFileSync("docs/09-content-draft.md","utf8"));const sec=doc.split("\n## Project pages\n")[1].split("\n## Stack\n")[0];const part=sec.split("\n### "+process.env.HEADING+"\n")[1];const m=part&&/```markdown\n([\s\S]*?)\n```/.exec(part);if(!m){console.error("FAIL: no approved block");process.exit(1)}const f=n(fs.readFileSync("src/content/projects/"+process.env.SLUG+".md","utf8"));const body=f.split("\n---\n").slice(1).join("\n---\n");if(body.trim()!==m[1].trim()){console.error("FAIL: body differs from docs/09 block");process.exit(1)}console.log("PASS: "+process.env.SLUG+" body matches docs/09")'`

### Task 5: VERIFY the built project pages render the bodies

- **ACTION**: Delivers AC-A4 (and re-confirms AC-A2 and AC-A3 on the built output). No file is edited. Run `pnpm build` and confirm each of the four built pages contains its body: `dist/projects/<slug>/index.html` (directory format, as `lighthouserc.json:6` audits `/projects/relay/`) must include an `<h2` element and the first section heading of its body (relay "The problem", ai-track-record "The question", praesto-sum "Why Cloudflare Workers", site-pro "The idea"), and relay's page must include `fork of Wirasm/prp`. Then run `pnpm check:privacy` (it rejects any external anchor on the built pages other than the approved profiles and repositories, so any link slipped into a body fails here). If a heading fails to render, fix the body copy in the affected file back to the docs/09 block rather than editing the rendering code.
- **MIRROR**: `# SOURCE: src/pages/projects/[slug].astro:31-32`
- **VALIDATE**: `set -euo pipefail; pnpm build; node -e 'const fs=require("fs");const pages={relay:["The problem","fork of Wirasm/prp"],"ai-track-record":["The question"],"praesto-sum":["Why Cloudflare Workers"],"site-pro":["The idea"]};let bad=0;for(const [slug,needles] of Object.entries(pages)){const html=fs.readFileSync("dist/projects/"+slug+"/index.html","utf8");if(!html.includes("<h2")){console.error("FAIL: no h2 in "+slug);bad++}for(const x of needles){if(!html.includes(x)){console.error("FAIL: "+slug+" page lacks "+x);bad++}}}if(bad)process.exit(1);console.log("PASS: four built pages carry their bodies")'; pnpm check:privacy`

## Validation Commands

Run from the worktree root with a POSIX shell. Each block starts with `set -euo pipefail` so a failure anywhere fails the block. These commands do not invoke Vitest or Playwright: this plan touches no test file, and the test pair owns the suite (see the Test-file routing note).

**Level 1 STATIC_ANALYSIS**

```
set -euo pipefail
pnpm check
pnpm lint
pnpm format:check
```

**Level 2 CONTENT_INVARIANTS** (all four bodies equal their approved blocks and obey C12 to C15, C4 and the anti-patterns)

```
set -euo pipefail
node -e 'const fs=require("fs");const n=s=>s.replace(/\r\n/g,"\n");const doc=n(fs.readFileSync("docs/09-content-draft.md","utf8"));const sec=doc.split("\n## Project pages\n")[1].split("\n## Stack\n")[0];const map={"relay":"relay","AI Track Record":"ai-track-record","Praesto Sum":"praesto-sum","site-pro":"site-pro"};let bad=0;for(const [h,slug] of Object.entries(map)){const part=sec.split("\n### "+h+"\n")[1];const m=part&&/```markdown\n([\s\S]*?)\n```/.exec(part);if(!m){console.error("FAIL: no approved block for "+h);bad++;continue}const f=n(fs.readFileSync("src/content/projects/"+slug+".md","utf8"));const body=f.split("\n---\n").slice(1).join("\n---\n");if(body.trim()!==m[1].trim()){console.error("FAIL: "+slug+" body differs from docs/09 block");bad++}}if(bad)process.exit(1);console.log("PASS: four bodies match docs/09")'
node -e 'const fs=require("fs");const ids=["relay","ai-track-record","praesto-sum","site-pro"];const allowed=new Set(["270","2026","19"]);let bad=0;for(const id of ids){const t=fs.readFileSync("src/content/projects/"+id+".md","utf8").replace(/\r\n/g,"\n");const body=t.split("\n---\n").slice(1).join("\n---\n");if(body.includes("—")){console.error("FAIL: em dash in "+id);bad++}if(/leverag|seamless|robust|scalab|innovativ/i.test(body)){console.error("FAIL: banned word in "+id);bad++}if(/https?:\/\/|@/.test(body)){console.error("FAIL: link or address in "+id);bad++}for(const x of body.replace(/^\d+\. /gm,"").match(/(?<![A-Za-z0-9_])\d+(?![A-Za-z0-9_])/g)||[]){if(!allowed.has(x)){console.error("FAIL: number "+x+" in "+id);bad++}}if(/^# /m.test(body)){console.error("FAIL: h1 in body of "+id);bad++}}if(bad)process.exit(1);console.log("PASS: voice, number, privacy and heading invariants hold")'
```

**Level 3 INTEGRATION** (build, rendered pages, privacy and size gates)

```
set -euo pipefail
pnpm build
node -e 'const fs=require("fs");const pages={relay:["The problem","fork of Wirasm/prp"],"ai-track-record":["The question"],"praesto-sum":["Why Cloudflare Workers"],"site-pro":["The idea"]};let bad=0;for(const [slug,needles] of Object.entries(pages)){const html=fs.readFileSync("dist/projects/"+slug+"/index.html","utf8");if(!html.includes("<h2")){console.error("FAIL: no h2 in "+slug);bad++}for(const x of needles){if(!html.includes(x)){console.error("FAIL: "+slug+" page lacks "+x);bad++}}}if(bad)process.exit(1);console.log("PASS: four built pages carry their bodies")'
pnpm check:privacy
pnpm check:budgets
```

## Acceptance Criteria

- **AC-A1 (PRD AC-13):** Given `/projects/relay`, `/projects/ai-track-record`, `/projects/praesto-sum` and `/projects/site-pro`, when each page loads, then its body shows the text approved in docs/09-content-draft.md for that project, copied as is (the fenced block content without the fence lines).
- **AC-A2 (PRD AC-13):** Given `/projects/relay`, when the page loads, then its body states that the repository is a fork of Wirasm/prp and that relay is the plugin built inside it.
- **AC-A3 (PRD AC-13):** Given the four bodies, then they contain no em dash, no number absent from docs/09 (270, December 2026, React 19, plus the numbered-list markers), no link or address, and none of the privacy-list data; `pnpm check:privacy` passes on the built site.
- **AC-A4 (PRD AC-13):** Given the built site, when each project page loads, then the body renders inside the page's `<Prose>` block beneath the page's own `<h1>` with its `##` sections as `<h2>` headings, and axe reports 0 violations on each page in both themes (verified end to end by the test pair's Playwright run; this plan's commands verify the static render).
- **AC-A5 (PRD AC-13):** Given the four content files, then every front matter field (title, summary, tags, links, year, status, order, featured) is unchanged and the page header (title, summary, tags, repo button) still renders as before.

R8b note: this plan is in PRD mode, so every AC-A item carries its `(PRD AC-N)` token.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `tests/unit/content-copy.test.ts` asserts relay's body equals only the fork sentence and that the other three bodies are empty (lines 155-172), so `pnpm test` fails after this phase until those assertions are updated to the approved text | H | M | Expected, not a regression. The Implementer must not touch the file (R-X). The test pair updates the two assertions to the approved bodies after the Implementer and records it in the lifecycle ledger; never delete, skip or loosen them |
| A body contains a character `pnpm format:check` (Prettier over `src/content/*.md`; `docs` is ignored, `src` is not) would rewrite, for example list markers or emphasis | L | L | The approved blocks already use Prettier-stable Markdown (`1.` lists, `-` bullets, `##` headings). If it still fails, the diff names the line; fix only whitespace and keep the words identical, then rerun Level 2 to confirm the body still equals the approved block modulo trailing whitespace |
| Smart-quote or typography conversion at render time changes apostrophes (for example "It's") in the built HTML | L | L | Level 3 asserts only text without apostrophes, quotes or dashes; the source files stay byte-faithful to docs/09 |
| Longer bodies move Lighthouse below 0.95 on `/projects/relay/` | L | M | Text only, no new requests or scripts; Lighthouse runs in CI and in Phase 5 (AC-12). Numbers go to the owner instead of relaxing a threshold |
| Copy drifts from the approved text (retyped instead of copied) | M | M | Task VALIDATE commands compare each body to the docs/09 block exactly, so any deviation fails |
| The banned-vocabulary list in docs/09 is open-ended ("and the rest of the list") and Level 2 greps only the five words named there | L | L | The bodies were approved against the full list by the owner; the grep guards against regressions on the named words only |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- **Heads-up for the test pair:** `tests/unit/content-copy.test.ts` lines 155-172 ('gives relay the fork note as its body' and the `it.each` 'leaves the %s body empty') become stale once the bodies land and must be updated to the approved text. Its other privacy and voice tests (no email or form, no em dash, only approved URLs over the content files) already cover the new bodies and should pass. The Phase 5 E2E matrix (axe on each project page in both themes) maps to AC-A4.
- **Diff base:** docs/09, docs/05, docs/decisions.md and docs/domain/areas/content.md already contain the approval before this phase starts (owner input), so none of them is a deliverable here.
- Heading levels: the page `<h1>` is the project title from `ProjectHeader`; the approved bodies use only `##` headings, so the outline is h1 then h2 with no skipped level. Do not add a `#` heading to any body (Level 2 checks this).
- Research grounding was done by direct reads of the worktree (`[slug].astro`, `Prose.css`, `ProjectHeader.tsx`, the four content files, `content-copy.test.ts`, `check-privacy.mjs`, `lighthouserc.json`) rather than by research subagents; every `# SOURCE:` anchor above was read in this run.

*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Implemented: 2026-11-10*
*Status: IMPLEMENTED*
