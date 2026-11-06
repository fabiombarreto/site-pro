# Feature: Content collections and strings (Phase 3 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: cross-cutting patterns (content schemas validated at build time, centralized interface copy); architectural decisions (importable schema module shared by Astro and Vitest, Content Layer API under Astro 6); business rules for content (C1-C16) as the governing area; reuse of Phase 2 code (theme toggle names move to src/strings.ts); privacy list (public repository, fixtures included)
- Decisions found:
  - Presentation-only scope and C2: content lives in the repository as Markdown/JSON validated at build time; no CMS, backend or API
  - D1 English only: interface copy centralized in `src/strings.ts` so another language could be added later
  - D2 Astro + React + TypeScript strict; D4 essential sections only; D5 internal project pages `/projects/<slug>` (the entry id is the slug)
  - "Only personal projects; privacy list": never publish phone, email, compensation, city, visa policy, recruiter notes, past employers or client projects; location is `Brazil (UTC-3)`
  - Stage 2 PRD approved 2026-11-05: methodology test-after (`tdd: false`, `test_frameworks: [vitest, playwright]`); the relay fork note (C15) is the relay project page body; photo and covers are placeholders until Stage 4
- Applicable anti-patterns:
  - Publishing private data (also forbidden in fixtures and test data)
  - Invented numbers and banned copy patterns (no em dashes, no invented metrics)
  - A contact form or public email
  - Raw values instead of tokens (no color or `box-shadow` literal in any new `.ts` file)
  - Scope creep into v1 (no runtime, no `githubRepo` display, no Stage 4/5 assets or palette copy)
  - Weakening tests to get a green run (existing tests under `tests/` are not touched)
- Applicable architectural rules:
  - Content: Astro Content Collections with schemas (Markdown/JSON in the repository); `src/content/` holds profile, projects/, stack.json; `src/strings.ts` holds interface copy
  - Static by default; the schema module must stay free of Astro runtime imports so Vitest (node environment, no Astro plugin) can import it
  - Relay artifacts live in `PRPs/`; nothing under `.claude/`
  - `docs/` is the source of truth; docs amendments belong to the docs updater after approval, not to this phase
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-2-foundation.prd.md` - Implementation Phases row 3: "Content collections and strings" - Goal: All approved content validated at build time and interface copy centralized - Success signal: AC-7 passes; `pnpm build` validates the real content.

## Summary

Phase 3 adds the content layer on top of the Phase 1-2 scaffold: an importable Zod schema module (`src/content-schemas.ts`) holding the docs/05 limits, the Astro Content Layer config (`src/content.config.ts`) that registers `profile`, `projects` and `stack`, the approved content from docs/09 as `src/content/profile.json`, `src/content/stack.json` and four `src/content/projects/*.md` files (relay's body is the fork note, the other bodies are empty), and `src/strings.ts` with the interface copy of the approved screens. The two Phase 2 places that hardcode the theme toggle names (`src/scripts/theme.ts` and `src/components/page/ThemeToggle.tsx`) are switched to read them from `src/strings.ts`, so the copy has one source. Image fields are plain strings (photo is required, cover is optional) so the build passes without Phase 4 assets. The Implementer authors no test files: the test pair writes the schema tests (invalid fixtures under `tests/`) afterwards.

## User Story

As the owner building Stage 3 on top of this base
I want the approved content validated at build time and the interface copy centralized
So that a content mistake breaks the build instead of the site, and the page components of Phases 4-6 can read typed content and strings without hardcoding either.

## Problem Statement

The final page must carry the approved copy from docs/09-content-draft.md, but no content exists in the repository and nothing enforces the docs/05 limits (summary at most 140 characters, 2 to 4 tags, the status enum, a bio under 100 words). Interface copy (section headings, nav and button labels, accessible names, the 404 text) is scattered or absent: the theme toggle names are already duplicated in two Phase 2 files. Without this phase the home page, project pages and 404 (Phases 4-6) would hardcode content and copy.

## Solution Statement

Define the three schemas in one plain TypeScript module that imports only `astro/zod`, register them in `src/content.config.ts` with the `file` and `glob` loaders, add the approved content as JSON and Markdown, and centralize interface copy in a dependency-free `src/strings.ts`. Phase 2's theme names move into `strings.ts` (unchanged text, so existing tests stay green). Project slugs are the Markdown file names (the glob loader id), so there is no duplicated `slug` field.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | `src/` content layer (new), `src/strings.ts` (new), Phase 2 theme helpers (2 files updated) |
| Dependencies | Phase 1 (scaffold) complete; Phase 2 (theme toggle code that this phase touches) complete; `astro` 6.4.8 (`astro:content`, `astro/loaders`, `astro/zod`) |
| Estimated Tasks | 7 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md:197-200` (Phase 3 details), `:158` (Content approach) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-2-foundation.prd.md` | 158, 197-200, 62, 68 | Content approach, Phase 3 scope, AC-1 and AC-7 |
| P0 | `docs/05-content.md` | 24-64 | Field tables and limits for `profile`, `projects`, `stack` |
| P0 | `docs/09-content-draft.md` | 33-97 | The approved values: profile, About text, 4 projects, stack groups, contact |
| P0 | `docs/domain/areas/content.md` | 5-24 | Business rules C1-C16 (privacy, limits, fork note, no em dashes) |
| P0 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md` | 20-90 | The approved screens' wording for eyebrows, titles, leads, buttons, nav links |
| P0 | `.worktrees/stage-2-foundation/src/scripts/theme.ts` | 1-23 | Module convention (named exports, no default, pure) and the label function to repoint |
| P0 | `.worktrees/stage-2-foundation/src/components/page/ThemeToggle.tsx` | 8-20 | The duplicated `DEFAULT_LABEL` to replace |
| P1 | `.worktrees/stage-2-foundation/vitest.config.ts` | 3-8 | Node environment, no Astro plugin: the schema module must not import `astro:content` |
| P1 | `.worktrees/stage-2-foundation/tsconfig.json` | 2-8 | Astro strict preset, no path aliases (relative imports only) |
| P1 | `.worktrees/stage-2-foundation/src/scripts/theme-toggle.ts` | 12-18 | Consumer of `themeToggleLabel` that must keep working unchanged |
| P1 | `.worktrees/stage-2-foundation/tests/unit/theme-helpers.test.ts` | 43-55 | Existing tests that pin the exact toggle names (must stay green, not edited) |
| P2 | `.worktrees/stage-2-foundation/eslint.config.mjs` | 43-46 | `src/**` gets browser globals; no Node globals inside `src/` |

Paths without a leading drive or `.worktrees/` are relative to the project root. The application code lives in the worktree `C:/repos/site-pro/.worktrees/stage-2-foundation/` (branch `feature/stage-2-foundation`); all commands below run from that directory.

## Patterns to Mirror

**MODULE_SHAPE** (pure TypeScript, named exports only, no default export, no framework imports):

```ts
# SOURCE: .worktrees/stage-2-foundation/src/scripts/theme.ts:1-5
export type Theme = 'midnight' | 'daylight';

export const THEME_STORAGE_KEY = 'sp-theme';

export const DEFAULT_THEME: Theme = 'midnight';
```

Copied by Task 1 (`src/content-schemas.ts`) and Task 5 (`src/strings.ts`).

**LABEL_SINGLE_SOURCE** (the function whose literals move into `strings.ts`):

```ts
# SOURCE: .worktrees/stage-2-foundation/src/scripts/theme.ts:15-19
export function themeToggleLabel(current: Theme): string {
  return current === 'midnight'
    ? 'Switch to the Daylight theme'
    : 'Switch to the Midnight theme';
}
```

Copied by Task 6 (the function stays, its two literals become `strings.theme.*`).

**DUPLICATED_DEFAULT_LABEL** (replaced by the shared string):

```tsx
# SOURCE: .worktrees/stage-2-foundation/src/components/page/ThemeToggle.tsx:8-9
// The Midnight default label; src/scripts/theme.ts themeToggleLabel('midnight') returns the same text.
const DEFAULT_LABEL = 'Switch to the Daylight theme';
```

Copied by Task 6.

**TEST_ENV_CONSTRAINT** (why the schema module imports nothing from Astro's runtime):

```ts
# SOURCE: .worktrees/stage-2-foundation/vitest.config.ts:3-8
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    passWithNoTests: true,
  },
});
```

Copied by Task 1.

**LOADERS** (Astro 6 Content Layer: every collection has a loader; `file()` paths are project-root relative, `glob()` takes `base` and `pattern`; an object keyed by id is a valid `file()` payload):

```ts
# SOURCE: https://docs.astro.build/en/guides/content-collections/
glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' })
```

Copied by Task 4. Schema import: `import { z } from 'astro/zod'` (Astro 6 moves to Zod 4; importing `z` from `astro:content` is deprecated), per https://docs.astro.build/en/guides/upgrade-to/v6/.

**CONTENT_VALUES_PROJECTS** (the approved project data; summaries are at most 140 characters):

```
# SOURCE: docs/09-content-draft.md:62-67
| 1 | **relay** | A Claude Code plugin that takes a feature from PRD to pull request, with a writer and a reviewer agent at every stage. | `claude-code` `ai-agents` `node` | 2026 | active | [repo](https://github.com/fabiombarreto/PRPs-agentic-eng) |
| 2 | **AI Track Record** | A local-first benchmark for AI coding agents: same task, different models and prompts, graded by tests the agent never sees. | `python` `ai-agents` `benchmarks` | 2026 | planning | [repo](https://github.com/fabiombarreto/ai-track-record) |
| 3 | **Praesto Sum** | A personal assistant for one user: tasks and Google Calendar in one installable app, on Cloudflare Workers and React 19. | `typescript` `react` `cloudflare-workers` | 2026 | in development | [repo](https://github.com/fabiombarreto/praesto-sum) |
| 4 | **site-pro** | This site: a portfolio that builds itself live, one typed command at a time. | `astro` `react` `typescript` | 2026 | in development | [repo](https://github.com/fabiombarreto/site-pro) |
```

Copied by Task 3.

**CONTENT_VALUES_PROFILE_STACK** (profile fields and the six stack groups in display order):

```
# SOURCE: docs/09-content-draft.md:37-43,80-87
| `name` | Fabio Martins Barreto |
| `headline` | Fabio Barreto. |
| `role` | Senior Software Engineer |
| `subtitle` | 12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows. |
| `location` | Brazil (UTC-3) |
| `links` | GitHub `github.com/fabiombarreto` · LinkedIn `linkedin.com/in/fabio-martins-barreto` |
| languages | java, python, typescript, sql |
| frontend | react, angular |
| backend | spring-boot, django, graphql, node, fastapi |
| data | postgresql, redis, rabbitmq |
| cloud | aws, ci-cd |
| ai | claude-code |
```

Copied by Task 2.

**STRINGS_WORDING** (the approved screens' copy for headings, leads and buttons):

```
# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:40,55,67,77-79
<SectionHeading index="01" name="about" title="About me" id="about-title" />
<SectionHeading index="02" name="projects" title="Selected work" lead="Things I built and what I learned." id="projects-title" />
<SectionHeading index="03" name="stack" title="What I work with" id="stack-title" />
<p class="mono-xs" ...><span ...>04</span> / contact</p>
<h2 id="contact-title" class="display" ...>Let's talk.</h2>
<p class="text-lg" ...>Questions, ideas or a project in mind? Find me here.</p>
```

Copied by Task 5.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/content-schemas.ts` | CREATE | The three Zod schemas and the docs/05 limits as exported constants, importable by Vitest without Astro (AC-A1) |
| `src/content/profile.json` | CREATE | The `profile` entry (id `profile`) with the approved copy (AC-A2, AC-A3) |
| `src/content/stack.json` | CREATE | The six stack groups in display order (AC-A2, AC-A3) |
| `src/content/projects/relay.md` | CREATE | relay entry; body is the fork note (AC-A3, AC-A4) |
| `src/content/projects/ai-track-record.md` | CREATE | AI Track Record entry, empty body (AC-A3, AC-A4) |
| `src/content/projects/praesto-sum.md` | CREATE | Praesto Sum entry, empty body (AC-A3, AC-A4) |
| `src/content/projects/site-pro.md` | CREATE | site-pro entry, empty body (AC-A3, AC-A4) |
| `src/content.config.ts` | CREATE | Registers `profile`, `projects`, `stack` with their loaders and the shared schemas (AC-A2) |
| `src/strings.ts` | CREATE | Interface copy: eyebrows, titles, leads, nav and button labels, accessible names, theme names, 404 and footer copy (AC-A5) |
| `src/scripts/theme.ts` | UPDATE | `themeToggleLabel` reads its two literals from `strings` (AC-A6) |
| `src/components/page/ThemeToggle.tsx` | UPDATE | `DEFAULT_LABEL` replaced by the shared Midnight-state name (AC-A6) |

No file under `tests/` is created or modified.

## NOT Building (Scope Limits)

- Schema tests and invalid fixtures: authored by the test pair after the Implementer, under `tests/` (never in `src/content/`).
- The photo placeholder SVG (`src/assets/photo-placeholder-body.svg`), the cover placeholder component and any component that renders content: Phase 4. The `photo` value points at the path Phase 4 creates; nothing reads it yet.
- Rendering content on any page (home page sections, `/projects/<slug>`, 404): Phases 5-6. `src/pages/index.astro` and `src/layouts/Base.astro` are not changed.
- Real photo, real covers and project page body text (other than relay's fork note): Stage 4 and owner-supplied content.
- `githubRepo` display or any build-time GitHub fetch (C12): the schema accepts the optional field, no entry sets it and nothing reads it.
- `cv` and the post-v1 `experience` / `writing` collections (D4).
- Docs amendments (docs/05 `slug` field, content.md): left to the docs updater after approval.
- Footer copyright line wording and any copy not in the approved screens or docs/09 (Phase 4 composes it from `profile.name` and the year).
- Command Palette, build microcopy and any runtime copy (Stages 3 and 5).

## Step-by-Step Tasks

### Task 1: CREATE src/content-schemas.ts

- **ACTION**: Create `src/content-schemas.ts` delivering AC-A1. It imports only `{ z } from 'astro/zod'` (no `astro:content`, no `node:*`, no relative imports) and uses only erasable TypeScript syntax (no enums, namespaces or parameter properties) so Node's type stripping can import it for validation. Export named constants for the limits: `SUMMARY_MAX_LENGTH = 140`, `TAGS_MIN = 2`, `TAGS_MAX = 4`, `BIO_WORD_LIMIT = 100`, and `PROJECT_STATUSES = ['active', 'in development', 'planning', 'maintained', 'archived'] as const`. Export `profileSchema`, `projectSchema`, `stackSchema` (all `z.strictObject`) and their inferred types (`Profile`, `Project`, `Stack`). Rules: a shared `httpsUrl` is `z.url()` refined to start with `https://`. `profileSchema` fields: `name` (non-empty), `headline` (non-empty), `role`, `subtitle`, `photo` (non-empty string: a project-relative asset path, not an image() reference), `location` (optional string), `bio` (string, refined so its whitespace-separated word count is below `BIO_WORD_LIMIT`, error message names the limit), `links` (non-empty array of `{ label, url: httpsUrl, icon }` with `icon` an enum of `github | linkedin | x | bluesky | devto | youtube`), `cv` (optional string). `projectSchema` fields: `title`, `summary` (`.max(SUMMARY_MAX_LENGTH)`), `cover` (optional non-empty string, a project-relative asset path; absent means the CSS placeholder), `tags` (array of non-empty strings with `.min(TAGS_MIN).max(TAGS_MAX)`), `links` (strict object with optional `repo`, `demo`, `article`, each `httpsUrl`), `year` (string matching `^\d{4}(?:[\u2013-]\d{4})?$`), `featured` (boolean), `order` (integer), `status` (`z.enum(PROJECT_STATUSES)`), `githubRepo` (optional, matching `^[\w.-]+/[\w.-]+$`). `stackSchema` is `{ groups: array (min 1) of { name: non-empty string, items: non-empty array of non-empty strings } }`, all strict. Do not add a `slug` field (the entry id, i.e. the Markdown file name, is the slug). Use Zod 4 idioms (`z.url()`, `{ error: '...' }` for refine messages). No color or shadow literals.
- **MIRROR**: `# SOURCE: .worktrees/stage-2-foundation/src/scripts/theme.ts:1-5` (MODULE_SHAPE) and `# SOURCE: .worktrees/stage-2-foundation/vitest.config.ts:3-8` (TEST_ENV_CONSTRAINT: no Astro runtime imports).
- **VALIDATE**: first confirm `astro/zod` resolves in plain Node, then exercise the schema rejections (non-zero exit on any miss):

```
node --input-type=module -e 'import { projectSchema } from "./src/content-schemas.ts"; const ok = { title: "t", summary: "x".repeat(140), tags: ["a","b"], links: {}, year: "2026", featured: true, order: 1, status: "active" }; const bad = (o, f) => { const r = projectSchema.safeParse(o); if (r.success || !r.error.issues.some((i) => i.path[0] === f)) { console.error("FAIL: expected rejection naming " + f); process.exit(1); } }; if (!projectSchema.safeParse(ok).success) { console.error("FAIL: baseline fixture must pass"); process.exit(1); } bad({ ...ok, summary: "x".repeat(141) }, "summary"); bad({ ...ok, tags: ["a"] }, "tags"); bad({ ...ok, tags: ["a","b","c","d","e"] }, "tags"); bad({ ...ok, status: "paused" }, "status"); console.log("PASS: project schema limits enforced");'
```

If `astro/zod` cannot be imported in plain Node, run `pnpm add zod` (a direct dependency, Zod 4) and import `z` from `zod` instead in this module only; record the change in the task result. Satisfies AC-A1.

### Task 2: CREATE src/content/profile.json and src/content/stack.json

- **ACTION**: Create the two data files delivering AC-A2 and AC-A3. Each is a JSON object keyed by entry id (the `file()` loader accepts this shape and keeps the keyed id out of the validated data): `src/content/profile.json` is `{ "profile": { ... } }` and `src/content/stack.json` is `{ "stack": { "groups": [ ... ] } }`. Profile values come verbatim from docs/09 (`name` "Fabio Martins Barreto", `headline` "Fabio Barreto.", `role` "Senior Software Engineer", `subtitle` "12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows.", `location` "Brazil (UTC-3)", `photo` "src/assets/photo-placeholder-body.svg", `links` GitHub `https://github.com/fabiombarreto` icon `github` and LinkedIn `https://www.linkedin.com/in/fabio-martins-barreto` icon `linkedin`). `bio` is the approved About text: its three paragraphs joined by `\n\n` ("I'm a full-stack software engineer, and I've been studying programming and software development since 2008." / "Right now I'm building my own projects and exploring what AI can do in real applications, while I work on a postgraduate program in Software Engineering with AI." / "Take a look at my projects below, or find me on GitHub and LinkedIn."). Stack groups, in this order, each `{ "name": ..., "items": [...] }`: languages (java, python, typescript, sql), frontend (react, angular), backend (spring-boot, django, graphql, node, fastapi), data (postgresql, redis, rabbitmq), cloud (aws, ci-cd), ai (claude-code). Include no email, phone, city, `mailto:` or `tel:`, no em dashes and no number not in docs/09. Run `pnpm exec prettier --write src/content/profile.json src/content/stack.json` afterwards.
- **MIRROR**: `# SOURCE: docs/09-content-draft.md:37-43,80-87` (CONTENT_VALUES_PROFILE_STACK).
- **VALIDATE**: both files parse and satisfy the real schemas, with the approved headline, location, link set and group order:

```
node --input-type=module -e 'import { readFileSync } from "node:fs"; import { profileSchema, stackSchema } from "./src/content-schemas.ts"; const must = (c, m) => { if (!c) { console.error("FAIL: " + m); process.exit(1); } }; const p = JSON.parse(readFileSync("src/content/profile.json", "utf8")).profile; const s = JSON.parse(readFileSync("src/content/stack.json", "utf8")).stack; must(profileSchema.safeParse(p).success, "profile.json must satisfy profileSchema"); must(stackSchema.safeParse(s).success, "stack.json must satisfy stackSchema"); must(p.headline === "Fabio Barreto.", "headline"); must(p.location === "Brazil (UTC-3)", "location"); must(p.links.map((l) => l.url).join(" ") === "https://github.com/fabiombarreto https://www.linkedin.com/in/fabio-martins-barreto", "profile links"); must(s.groups.map((g) => g.name).join(",") === "languages,frontend,backend,data,cloud,ai", "stack group order"); console.log("PASS: profile and stack content valid");'
```

Satisfies AC-A2 and AC-A3.

### Task 3: CREATE the four project files under src/content/projects/

- **ACTION**: Create `relay.md`, `ai-track-record.md`, `praesto-sum.md` and `site-pro.md` under `src/content/projects/`, delivering AC-A3 and AC-A4. Each has YAML frontmatter with the fields `title`, `summary`, `tags` (block list, one `- tag` per line), `links` (a `repo:` URL nested under `links:`), `year`, `featured: true`, `order` (relay 1, AI Track Record 2, Praesto Sum 3, site-pro 4) and `status`, with the values from docs/09 (titles `relay`, `AI Track Record`, `Praesto Sum`, `site-pro`; statuses `active`, `planning`, `in development`, `in development`; repo URLs as in the pattern table, relay's is `https://github.com/fabiombarreto/PRPs-agentic-eng`). Quote every `summary` and `year` value with single quotes (two summaries contain `: `, which is invalid in an unquoted YAML scalar; `year` must stay a string); leave `title` and `status` unquoted. Omit `cover` and `githubRepo` (the CSS placeholder renders without `cover`). The body of `relay.md` is exactly `The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.`; the other three files have an empty body (the file ends right after the closing `---`). No relay user or star counts, no em dashes. Run `pnpm exec prettier --write src/content/projects/*.md` afterwards and keep the relay body unchanged.
- **MIRROR**: `# SOURCE: docs/09-content-draft.md:62-67` (CONTENT_VALUES_PROJECTS).
- **VALIDATE**: frontmatter keys and bodies per project (non-zero exit on any mismatch; the schema validation of these files happens in Task 4 through Astro itself):

```
node --input-type=module -e 'import { readFileSync } from "node:fs"; const must = (c, m) => { if (!c) { console.error("FAIL: " + m); process.exit(1); } }; const rows = [["relay","relay","active","1","https://github.com/fabiombarreto/PRPs-agentic-eng"],["ai-track-record","AI Track Record","planning","2","https://github.com/fabiombarreto/ai-track-record"],["praesto-sum","Praesto Sum","in development","3","https://github.com/fabiombarreto/praesto-sum"],["site-pro","site-pro","in development","4","https://github.com/fabiombarreto/site-pro"]]; for (const [id, title, status, order, repo] of rows) { const t = readFileSync("src/content/projects/" + id + ".md", "utf8").replace(/\r\n/g, "\n"); const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(t); must(m, id + ": frontmatter block"); const fm = m[1].split("\n").map((l) => l.trim()); must(fm.includes("title: " + title), id + ": title"); must(fm.includes("status: " + status), id + ": status"); must(fm.includes("order: " + order), id + ": order"); must(fm.includes("repo: " + repo), id + ": repo"); must(fm.some((l) => /^year: [\x27"]2026[\x27"]$/.test(l)), id + ": year is a quoted string"); const expected = id === "relay" ? "The repository is a fork of Wirasm/prp. relay is the plugin I built inside it." : ""; must(m[2].trim() === expected, id + ": body"); } console.log("PASS: 4 project entries");'
```

Satisfies AC-A3 and AC-A4.

### Task 4: CREATE src/content.config.ts

- **ACTION**: Create `src/content.config.ts` delivering AC-A2. It imports `defineCollection` from `astro:content`, `file` and `glob` from `astro/loaders`, and the three schemas from `./content-schemas` (relative, extensionless, as the rest of `src/` does). Define `profile` with `file('src/content/profile.json')` and `profileSchema`; `projects` with `glob({ base: './src/content/projects', pattern: '*.md' })` and `projectSchema`; `stack` with `file('src/content/stack.json')` and `stackSchema`. `export const collections = { profile, projects, stack };`. No other exports, no logic. If Astro rejects a strict schema because a loader adds a key to entry data, relax only that schema from `z.strictObject` to `z.object` and say so in the task result; do not loosen any limit. After creating the file, regenerate types so `astro check` sees the collections.
- **MIRROR**: `# SOURCE: https://docs.astro.build/en/guides/content-collections/` (LOADERS).
- **VALIDATE**: `pnpm exec astro sync` loads every collection and validates every entry against its schema, exiting non-zero on any invalid or missing entry:

```
set -euo pipefail
pnpm exec astro sync
```

Satisfies AC-A2.

### Task 5: CREATE src/strings.ts

- **ACTION**: Create `src/strings.ts` delivering AC-A5: one named export `strings`, a plain nested object `as const`, no imports, no functions with side effects, no color or shadow literals. Keys and exact values: `skipLink: 'Skip to content'`; `hero: { ariaLabel: 'Introduction', seeMyWork: 'See my work' }`; `nav: { ariaLabel: 'Main', brand: 'fabiombarreto', links: [{ id: 'about', index: '01', label: 'About' }, { id: 'projects', index: '02', label: 'Projects' }, { id: 'stack', index: '03', label: 'Stack' }, { id: 'contact', index: '04', label: 'Contact' }], openMenu: 'Open the menu', closeMenu: 'Close the menu' }` (store section ids, not `#` hrefs; components compose the anchors); `theme: { switchToDaylight: 'Switch to the Daylight theme', switchToMidnight: 'Switch to the Midnight theme' }`; `sections: { about: { eyebrow: { index: '01', name: 'about' }, title: 'About me' }, projects: { eyebrow: { index: '02', name: 'projects' }, title: 'Selected work', lead: 'Things I built and what I learned.' }, stack: { eyebrow: { index: '03', name: 'stack' }, title: 'What I work with' }, contact: { eyebrow: { index: '04', name: 'contact' }, title: "Let's talk.", lead: 'Questions, ideas or a project in mind? Find me here.' } }`; `buttons: { github: 'GitHub', linkedin: 'LinkedIn' }`; `projects: { backToProjects: 'All projects', repo: 'Repo', repoShortcut: 'repo' }` (the card's shortcut renders `repo ↗`; the arrow glyph belongs to the component); `notFound: { title: 'Page not found.', homeLink: 'Go home' }`; `footer: { source: 'Source' }`. Use the exact approved wording (copy the apostrophe in "Let's talk." as a straight `'`, inside a double-quoted string, which Prettier keeps). No em dashes, no invented copy, no email, phone or city.
- **MIRROR**: `# SOURCE: .worktrees/stage-2-foundation/src/scripts/theme.ts:1-5` (MODULE_SHAPE) and `# SOURCE: C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/design-reference/screens-main-layout.md:40,55,67,77-79` (STRINGS_WORDING).
- **VALIDATE**: import the module in Node and assert the load-bearing values (non-zero exit on any miss):

```
node --input-type=module -e 'import { strings as s } from "./src/strings.ts"; const must = (c, m) => { if (!c) { console.error("FAIL: " + m); process.exit(1); } }; must(s.skipLink === "Skip to content", "skip link"); must(s.nav.openMenu === "Open the menu", "open menu name"); must(s.nav.links.map((l) => l.id + ":" + l.index + ":" + l.label).join(",") === "about:01:About,projects:02:Projects,stack:03:Stack,contact:04:Contact", "nav links"); must(s.theme.switchToDaylight === "Switch to the Daylight theme" && s.theme.switchToMidnight === "Switch to the Midnight theme", "theme names"); must(s.sections.about.title === "About me" && s.sections.projects.title === "Selected work" && s.sections.projects.lead === "Things I built and what I learned." && s.sections.stack.title === "What I work with", "section copy"); must(s.sections.contact.title === "Let\x27s talk." && s.sections.contact.lead === "Questions, ideas or a project in mind? Find me here.", "contact copy"); must(s.notFound.title === "Page not found." && s.notFound.homeLink === "Go home" && s.projects.backToProjects === "All projects" && s.footer.source === "Source", "404, back link, footer"); console.log("PASS: strings");'
```

Satisfies AC-A5.

### Task 6: UPDATE src/scripts/theme.ts and src/components/page/ThemeToggle.tsx

- **ACTION**: Delivering AC-A6, make `src/strings.ts` the single source of the theme toggle names. In `src/scripts/theme.ts` add `import { strings } from '../strings';` and make `themeToggleLabel` return `strings.theme.switchToDaylight` for `'midnight'` and `strings.theme.switchToMidnight` otherwise (same ternary, same behavior, no other change to the file). In `src/components/page/ThemeToggle.tsx` import `strings` from `'../../strings'`, replace the `DEFAULT_LABEL` literal with `strings.theme.switchToDaylight` (keep the constant and update its comment to say it is the Midnight-state name from `src/strings.ts`), leaving the markup untouched. The rendered text and attributes must be byte-identical to before so `tests/unit/theme-helpers.test.ts` and the theme e2e spec pass unmodified; do not edit any file under `tests/`.
- **MIRROR**: `# SOURCE: .worktrees/stage-2-foundation/src/scripts/theme.ts:15-19` (LABEL_SINGLE_SOURCE) and `# SOURCE: .worktrees/stage-2-foundation/src/components/page/ThemeToggle.tsx:8-9` (DUPLICATED_DEFAULT_LABEL).
- **VALIDATE**: no toggle-name literal remains outside `src/strings.ts`, and the existing unit tests that pin the names stay green:

```
set -euo pipefail
if grep -rn "Switch to the" src --include='*.ts' --include='*.tsx' --include='*.astro' | grep -v "^src/strings.ts" | grep -q .; then
  echo "FAIL: toggle name literal outside src/strings.ts"; exit 1
else
  echo "PASS: toggle names single-sourced"
fi
pnpm test
```

Satisfies AC-A6.

### Task 7: Format the new files and run the full gates (AC-A7, AC-A8, AC-A9)

- **ACTION**: Run `pnpm exec prettier --write` on every file created or updated by Tasks 1-6 (the two JSON files, the four Markdown files, the four new `.ts` files and the two updated files) and fix anything `pnpm lint`, `pnpm check` or `pnpm build` reports in those files only. Deliver AC-A7 (no private data or form in the new content and copy), AC-A8 (no color or `box-shadow` literal in the new `.ts` files) and AC-A9 (the build, lint, format, type check and both existing suites pass with the real content). Do not touch any file under `tests/` and do not weaken any check.
- **MIRROR**: `# SOURCE: .worktrees/stage-2-foundation/src/scripts/theme.ts:1-5` (MODULE_SHAPE) for any formatting-driven rewrite of the new modules.
- **VALIDATE**: the Level 1 and Level 3 blocks below, followed by the Level 2 block (all must exit 0).

## Validation Commands

Run from `C:/repos/site-pro/.worktrees/stage-2-foundation/` in Git Bash.

### Level 1: STATIC_ANALYSIS

```
set -euo pipefail
pnpm format:check
pnpm lint
pnpm check
```

### Level 2: CONTENT_INVARIANTS

```
set -euo pipefail
# schemas reject invalid content and the real content validates (bio boundary: 99 words pass, 100 fail)
node --input-type=module -e 'import { readFileSync } from "node:fs"; import { profileSchema, projectSchema, stackSchema } from "./src/content-schemas.ts"; const must = (c, m) => { if (!c) { console.error("FAIL: " + m); process.exit(1); } }; const rejects = (schema, o, f) => { const r = schema.safeParse(o); must(!r.success && r.error.issues.some((i) => i.path[0] === f), "expected rejection naming " + f); }; const p = JSON.parse(readFileSync("src/content/profile.json", "utf8")).profile; const s = JSON.parse(readFileSync("src/content/stack.json", "utf8")).stack; must(profileSchema.safeParse(p).success, "profile.json valid"); must(stackSchema.safeParse(s).success, "stack.json valid"); must(profileSchema.safeParse({ ...p, bio: "word ".repeat(99).trim() }).success, "99-word bio must pass"); rejects(profileSchema, { ...p, bio: "word ".repeat(100).trim() }, "bio"); rejects(profileSchema, { ...p, links: [{ label: "Mail", url: "mailto:a@b.co", icon: "github" }] }, "links"); rejects(stackSchema, { groups: [{ name: "x", items: [] }] }, "groups"); const ok = { title: "t", summary: "x".repeat(140), tags: ["a","b"], links: {}, year: "2026", featured: true, order: 1, status: "active" }; must(projectSchema.safeParse(ok).success, "baseline project"); rejects(projectSchema, { ...ok, summary: "x".repeat(141) }, "summary"); rejects(projectSchema, { ...ok, tags: ["a"] }, "tags"); rejects(projectSchema, { ...ok, tags: ["a","b","c","d","e"] }, "tags"); for (const st of ["active","in development","planning","maintained","archived"]) must(projectSchema.safeParse({ ...ok, status: st }).success, "status " + st); rejects(projectSchema, { ...ok, status: "paused" }, "status"); console.log("PASS: schema limits and real content");'
# privacy: no email, mailto, tel or form in the new content, copy and schema modules
if grep -rnE "mailto:|\btel:|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|<form" src/content src/strings.ts src/content-schemas.ts src/content.config.ts; then
  echo "FAIL: private contact data or a form in new content"; exit 1
else
  echo "PASS: no email, mailto, tel or form"
fi
# voice: no em dash in content or strings
if grep -rn $'\xe2\x80\x94' src/content src/strings.ts; then
  echo "FAIL: em dash in content or strings"; exit 1
else
  echo "PASS: no em dash"
fi
# tokens only: no color or box-shadow literal in the new .ts files
if grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|box-shadow" src/strings.ts src/content-schemas.ts src/content.config.ts; then
  echo "FAIL: color or shadow literal in new .ts files"; exit 1
else
  echo "PASS: no color or shadow literals"
fi
# only the two approved profile links appear in the content
if grep -rnoE "https?://[^ \"')>]+" src/content | grep -vE "github\.com/fabiombarreto|linkedin\.com/in/fabio-martins-barreto"; then
  echo "FAIL: unexpected URL in content"; exit 1
else
  echo "PASS: only approved URLs"
fi
```

### Level 3: INTEGRATION

```
set -euo pipefail
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm build` loads every collection and fails on any invalid entry; `pnpm test` runs the existing unit suite and `pnpm test:e2e` the existing end-to-end suite (needs the build and the installed Playwright browsers from Phase 1), both unmodified.

## Acceptance Criteria

- **AC-A1 (PRD AC-7):** The exported schemas in `src/content-schemas.ts` reject a project with a 141-character `summary`, with 1 or 5 `tags`, or with a `status` outside `active | in development | planning | maintained | archived`, and a profile whose `bio` has 100 words or more, each failure naming the offending field; and they import nothing from Astro's runtime so Vitest can load them.
- **AC-A2 (PRD AC-7):** `src/content/` holds the profile entry, `stack.json` and the four project entries, registered in `src/content.config.ts`, and all of them validate, so `pnpm build` passes with them.
- **AC-A3 (PRD AC-1):** The content carries the approved copy from docs/09: the role "Senior Software Engineer", the hero intro, the About text, the four projects (relay, AI Track Record, Praesto Sum, site-pro) with title, summary, tags, year and status, the six stack groups with their items in display order, and the location "Brazil (UTC-3)".
- **AC-A4 (PRD AC-14):** relay's entry body is exactly "The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.", its repo link is `https://github.com/fabiombarreto/PRPs-agentic-eng`, and the other three entries have an empty body and their own repo link.
- **AC-A5 (PRD AC-1, AC-4, AC-6, AC-14):** `src/strings.ts` carries the interface copy of the approved screens: the four section eyebrows, the titles "About me", "Selected work", "What I work with" and "Let's talk." with their leads, the nav link labels, "Open the menu", "Skip to content", the button labels, the 404 copy "Page not found." and "Go home", the "All projects" back link and the footer "Source".
- **AC-A6 (PRD AC-4):** The theme toggle names "Switch to the Daylight theme" and "Switch to the Midnight theme" exist only in `src/strings.ts`, and the toggle's rendered names and behavior are unchanged.
- **AC-A7 (PRD AC-8):** The new content, strings and schema files contain no email address, `mailto:` or `tel:` link, form, city or other private datum, and the only profile links are GitHub `fabiombarreto` and LinkedIn `fabio-martins-barreto`.
- **AC-A8 (PRD AC-9):** No new `.ts` file contains a color literal (hex, `rgb()`, `rgba()`, `hsl()`) or a `box-shadow` literal.
- **AC-A9 (PRD AC-1):** With the real content in place, `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm build`, the existing unit tests and the existing e2e tests all pass without any edit under `tests/`.

R8b (PRD AC-N token check) applies in this plan: every bullet above carries its PRD AC reference.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `astro/zod` cannot be imported by plain Node or Vitest (the research found no source confirming it) | M | Schema module unusable by the test pair | Task 1 VALIDATE imports it in plain Node; fallback is a direct `zod` 4 dependency in that module only, so Astro still accepts the schemas |
| Strict schemas reject a key a loader adds to entry data | L | `astro sync` and `pnpm build` fail | Task 4 allows relaxing only that schema to `z.object` (limits unchanged) and requires reporting it |
| Unquoted YAML scalars with `: ` (two summaries) or an unquoted `year` (parsed as a number) break parsing or validation | M | Build fails or year rejected | Task 3 requires single-quoted `summary` and `year`; the VALIDATE checks the quoted year |
| Prettier rewrites frontmatter quoting or the relay body | M | Format check fails or body changes | Tasks 2-3 run Prettier before validating; Task 3 VALIDATE asserts the relay body after formatting |
| Node type stripping cannot load the `.ts` modules in the validation commands | L | Level 2 fails on tooling, not content | Node 24 strips types by default; the modules use only erasable syntax and `import type`-safe imports |
| The `photo` value points at `src/assets/photo-placeholder-body.svg`, which Phase 4 creates | L | A dangling path if Phase 4 names the file differently | The path is a plain string with no existence check; Notes state the name Phase 4 must use (the docs/domain content.md placeholder name) |
| Research gap: no source documented a union of string path and `image()` | M | Phase 4 cannot swap to optimized images without a schema change | Fields are strings now; Phase 4 resolves them through `import.meta.glob` instead of changing the schema (see Notes) |
| research-codebase hit its scope cap (7 of 5 searches), so the file listing was noisy | L | A missed existing file | The key files were confirmed by direct reads; Phase 3 only creates new files and edits two read files |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- The schema tests the test pair will author import `../../src/content-schemas` (relative, as the Vitest config has no alias) and keep invalid fixtures under `tests/`, never in `src/content/` (PRD Phase 3 scope, AC-7).
- Decisions made in this plan, for the docs updater: the project slug is the Markdown file name (the `glob` loader id), so docs/05's `slug` field is not duplicated in frontmatter; `profile.json` and `stack.json` are objects keyed by entry id (`profile`, `stack`) because the `file()` loader requires ids; `cover` is optional and `photo` required, both plain strings.
- How Phase 4 wires the placeholders: create `src/assets/photo-placeholder-body.svg` (the `photo` value) and render the CSS dot-grid `CoverPlaceholder`, labelled with the entry id, whenever a project has no `cover`. To use real files later, resolve the string paths through `import.meta.glob('/src/assets/**/*')` in the Photo and ProjectCard components (no schema change); swapping the values changes no layout.
- Words in the approved bio count about 57 by whitespace splitting while docs/09 and rule C6 say 54; the limit is under 100, so nothing here depends on the exact number and no check asserts it.
- The footer copyright line is not in the approved copy; Phase 4 composes it from `profile.name` and the year rather than adding unapproved text to `src/strings.ts`.
- The Phase 1-2 code lives uncommitted in the worktree; nothing in this phase commits, pushes or opens a pull request.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
