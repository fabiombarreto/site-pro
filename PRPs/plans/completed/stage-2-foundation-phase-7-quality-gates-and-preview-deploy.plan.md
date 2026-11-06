# Feature: Quality gates and preview deploy (Phase 7 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: cross-cutting patterns (CI quality gates, design tokens as an enforced rule, privacy rules enforced over build output); architectural decisions (hosting contract under D9: deploy is Workers Builds, not CI); impact on shared tooling (package.json scripts, ESLint config, CI workflow); business rules for content (privacy list, C-rules over built HTML), visual-design (V-rules: tokens only) and build only as an out-of-scope boundary (no build layer, no deploy step)
- Decisions found:
  - D9 Cloudflare Workers Static Assets deployed by Workers Builds (Git integration): preview per pull request and production from `main`; no Cloudflare secret in GitHub; branch protection on `main` makes the CI checks gate merges (owner steps)
  - D2 Astro + React + TypeScript strict; static output; pnpm, ESLint, Prettier, Vitest, Playwright + axe, Lighthouse CI are the declared quality stack
  - Presentation-only scope and the privacy list: no form, mailto, tel, email or phone anywhere; GitHub and LinkedIn are the only profile links; location is `Brazil (UTC-3)`
  - Stage 2 PRD approved 2026-11-05 (AC-5, AC-8, AC-9, AC-10, AC-11); methodology test-after (`tdd: false`, `test_frameworks: [vitest, playwright]`): the Implementer's diff contains no test files and edits no existing test
  - D1 English only for every artifact
- Applicable anti-patterns:
  - Weakening tests to get a green run (no lowered threshold, skipped spec or loosened assertion to pass a gate)
  - Raw values instead of tokens (the token check enforces this rule)
  - Publishing private data (the privacy check enforces this; no private value may appear in a script, fixture or doc, so no city or personal name list is hard-coded)
  - A contact form or public email
  - Scope creep into v1 (no build layer, no OG/JSON-LD/sitemap, no analytics)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - CI: GitHub Actions on `pull_request` and `push` to `main`, every check its own job (docs/06-architecture.md CI contract); deploys are done by Workers Builds, so CI holds no deploy step, no Cloudflare CLI and no secret
  - Budgets: Lighthouse >= 95 per category, CLS <= 0.01, critical (pre-first-paint) JS <= 20 KB gzip, total JS <= 90 KB gzip, total CSS <= 25 KB gzip
  - Node and pnpm are pinned by `.node-version` and the `packageManager` field; CI installs with `pnpm install --frozen-lockfile`
  - Plain TypeScript/ESM tooling scripts live in the root `scripts/` folder (docs/context/architecture.md folder table); `src/scripts/` is browser runtime code and is not used here
  - docs/ is the source of truth: the real commands are recorded in docs/context/testing.md and docs/development.md
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-2-foundation.prd.md` — Implementation Phases row 7: "Quality gates and preview deploy" — Goal: Every Stage 2 target enforced in CI and visible on a preview URL. — Success signal: AC-5, AC-8, AC-9, AC-10 and AC-11 pass on the pull request; the owner approves visual parity on the preview.

## Summary

Phases 1-6 already built the site and a large e2e/axe/unit suite. Phase 7 turns every remaining Stage 2 target into a CI gate, without touching `src/`. It adds three dependency-free Node ESM scripts in `scripts/` that exit non-zero on violation: `check-tokens.mjs` (AC-9, no color or `box-shadow` literal in `src/` outside `tokens.css` and `assets/`), `check-privacy.mjs` (AC-8, over every HTML/JS/CSS/JSON/XML file in `dist/`: no email, no `mailto:`/`tel:` link, no phone pattern in text, no `<form>`, only the two allowed profile links, location `Brazil (UTC-3)`) and `check-budgets.mjs` (AC-10, gzip budgets measured on what the pages actually load, with the dist-wide total reported alongside). It adds `@lhci/cli` as a devDependency with a `lighthouserc.json` (`staticDistDir: ./dist`, `numberOfRuns: 3`, `/` and `/projects/relay/`, median category scores >= 0.95, CLS <= 0.01) and the `lighthouse` script. It extends the one ESLint block so the new scripts lint with Node globals, drops `--pass-with-no-tests` from `test:e2e` now that 13 specs exist, and rewrites `.github/workflows/ci.yml` to nine separately reported jobs (`lint`, `check`, `unit`, `build`, `e2e` unchanged; new `tokens`, `privacy`, `budgets`, `lighthouse`). Finally it records every suite and command in `docs/context/testing.md` and `docs/development.md`, including the owner-only steps (connect Workers Builds, branch protection, verify the preview URL on the pull request). Screenshot baselines (a PRD Should with an open gate-vs-advisory question) are not built here: they cannot be generated reliably on Windows for Linux CI.

## User Story

As the site owner who builds Stage 3 on top of this base
I want accessibility, privacy, token, performance and size targets enforced as separate CI checks on every pull request
So that no change can regress them silently and a preview URL is ready for my visual review.

## Problem Statement

The CI skeleton runs only lint, check, unit, build and e2e. Nothing enforces the Lighthouse targets, the size budgets (only CSS is asserted, inside an e2e spec), the privacy rule over the full build output or the token rule as a named check, so AC-8, AC-9, AC-10 and AC-11 cannot be demonstrated on a pull request.

## Solution Statement

Add small, deterministic, exit-code-driven scripts and a Lighthouse CI config, wire each into its own CI job, and document everything. The scripts are scripts, not tests: they gate a build artifact in CI, they accept `--src`/`--dist` so a violating fixture can prove each gate fails, and the test pair stays free to add unit coverage of them later (functions are exported; the CLI runs only when the file is executed directly). Budgets are measured on the set of files the pages reference (every `<script src>` / `<link rel=stylesheet>` target plus every inline script/style, each file counted once); files under `dist/` that no page references (today the `client.*.js` react-dom bundle that no page loads) are printed as orphans, and the dist-wide total is printed for information but does not gate, because the budget protects what visitors download. Hosting stays as is: Workers Builds is an owner connection, so the plan adds no deploy step, secret or Cloudflare CLI to CI.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (CI quality gates) |
| Complexity | MEDIUM (three checker scripts, one third-party tool config, one workflow rewrite, docs) |
| Systems Affected | package.json, pnpm-lock.yaml, eslint.config.mjs, scripts/ (new), lighthouserc.json (new), .github/workflows/ci.yml, docs/context/testing.md, docs/development.md |
| Dependencies | Phases 1-6 (all complete); one new devDependency `@lhci/cli` (needs registry access once, to add it) |
| Estimated Tasks | 7 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md:217-220` (Phase 7 details), AC-5 at line 66, AC-8 at line 69, AC-9 at line 70, AC-10 at line 71, AC-11 at line 72 |
| phase_type | feature |

## Mandatory Reading

All source paths below are relative to the worktree root `C:/repos/site-pro/.worktrees/stage-2-foundation/` (where the implementation and every command in this plan run), except the first rows.

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `C:/repos/site-pro/PRPs/prds/stage-2-foundation.prd.md` | 66, 69-72, 161, 217-220 | AC-5, AC-8, AC-9, AC-10, AC-11 and the Phase 7 scope and CI description |
| P0 | `.github/workflows/ci.yml` | 1-83 | The current five jobs, the repeated setup steps, the e2e job with browser install and artifact upload to mirror |
| P0 | `package.json` | 9-19, 26-47 | Scripts to extend and devDependencies; `test:e2e` carries `--pass-with-no-tests` |
| P0 | `tests/unit/scaffold-config.test.ts` | 75-122 | Existing pins on ci.yml: exact job id list (lines 87-93), `run:` lines (102-117), and "no wrangler or CLOUDFLARE_" (119-121); drives the obsolescence note below |
| P0 | `tests/unit/design-tokens.test.ts` | 117-146 | The exact color and box-shadow regexes and file filter AC-9 already uses in Vitest; the token script must agree with them |
| P0 | `src/layouts/Base.astro` | 20-33, 56-59 | The inline head theme script (the "JS before first paint") and the bundled body script |
| P0 | `eslint.config.mjs` | 44-50 | The only Node-globals block, matching root files only; `scripts/*.mjs` would fail `no-undef` without an extension |
| P1 | `tests/e2e/css-budget.spec.ts` | 1-24 | Existing CSS gzip assertion (whole `dist/`, concatenated) the new script must stay consistent with |
| P1 | `playwright.config.ts` | 1-18 | webServer is `astro preview` on 4321; the e2e job needs `dist/` built first |
| P1 | `wrangler.jsonc` | 1-8 | Hosting contract; nothing here changes and CI must not reference it |
| P1 | `docs/context/testing.md` | 49-70 | Detected-suites section and the stale "arriving in later phases" sentence to rewrite |
| P1 | `docs/development.md` | 11-26 | Commands table (Lighthouse row), the CI paragraph ("five separately reported jobs") and where owner steps go |
| P1 | `.gitignore` | 14-19 | `.lighthouseci/` is already ignored; `.prettierignore` also lists it |
| P1 | `C:/repos/site-pro/PRPs/plans/completed/stage-2-foundation-phase-6-project-pages-and-404.plan.md` | 459-473, 487-590 | Prior validation lessons: read built HTML, never parse coloured tool output, rely on exit codes, gzip over `dist` |

## Patterns to Mirror

```
# SOURCE: .github/workflows/ci.yml:15-27
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: corepack enable
      - uses: actions/setup-node@v6
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
```
Copied by Task 6 (every new job repeats this setup block verbatim, then its own commands).

```
# SOURCE: .github/workflows/ci.yml:65-83
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: corepack enable
      - uses: actions/setup-node@v6
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```
Copied by Task 6 (the `lighthouse` job reuses the build + browser install + failure-artifact shape; the `e2e` job stays byte-identical).

```
# SOURCE: tests/unit/design-tokens.test.ts:117-146
describe('tokens only outside tokens.css (AC-9)', () => {
  const sourceFiles = (): string[] =>
    readdirSync(resolve(root, 'src'), { recursive: true })
      .map((entry) => String(entry).replace(/\\/g, '/'))
      .filter((rel) => /\.(css|astro|ts|tsx)$/.test(rel))
      .filter((rel) => !statSync(resolve(root, 'src', rel)).isDirectory())
      .filter((rel) => rel !== 'styles/tokens.css')
      .filter((rel) => !rel.startsWith('assets/'));
  ...
      expect(text, rel).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  ...
        .filter((line) => line.includes('box-shadow'))
        .filter((line) => !line.includes('var(--'));
```
Copied by Task 2 (same file filter, same color regex, same per-line box-shadow rule, so the script and the Vitest test cannot disagree).

```
# SOURCE: tests/e2e/css-budget.spec.ts:8-24
const BUDGET_BYTES = 25 * 1024;

const cssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return cssFiles(full);
    return full.endsWith('.css') ? [full] : [];
  });
  ...
    expect(gzipSync(all).length).toBeLessThanOrEqual(BUDGET_BYTES);
```
Copied by Task 4 (recursive walk, `node:zlib` gzip, 25 KB CSS budget; no third-party gzip helper).

```
# SOURCE: src/layouts/Base.astro:20-33
    <script is:inline define:vars={{ storageKey: THEME_STORAGE_KEY }}>
      (function () {
        let theme = 'midnight';
        try {
          if (localStorage.getItem(storageKey) === 'daylight')
            theme = 'daylight';
        } catch {
          // Storage may be blocked; keep the default theme.
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme =
          theme === 'daylight' ? 'light' : 'dark';
      })();
    </script>
```
Copied by Task 4 (this is the inline head script the "JS before first paint" budget measures; in `dist/*.html` it is a `<script>` with no `src` inside `<head>`; the body's bundled `<script>` at `Base.astro:56-59` is not blocking and is counted only in the total JS).

```
# SOURCE: eslint.config.mjs:47-50
  {
    files: ['*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },
```
Copied by Task 2 (the `files` list gains `scripts/**/*.{js,mjs}` so `process`, `console` and `URL` resolve in the new scripts).

```
# SOURCE: package.json:9-19
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:e2e": "playwright test --pass-with-no-tests"
  },
```
Copied by Task 1 (new scripts `check:tokens`, `check:privacy`, `check:budgets`, `lighthouse` follow this one-line style; `--pass-with-no-tests` is dropped from `test:e2e`).

```
# SOURCE: tests/unit/scaffold-config.test.ts:119-121
  it('contains no Cloudflare deploy step or secret', () => {
    expect(text).not.toMatch(/wrangler|CLOUDFLARE_/i);
  });
```
Copied by Task 6 (the rewritten workflow must keep containing neither string, not even in a comment).

## Files to Change

Worktree-relative paths.

| File | Action | Justification |
|------|--------|---------------|
| `package.json` | UPDATE | Add `@lhci/cli` devDependency and the scripts `check:tokens`, `check:privacy`, `check:budgets`, `lighthouse`; drop `--pass-with-no-tests` from `test:e2e` |
| `pnpm-lock.yaml` | UPDATE | Lockfile regenerated by `pnpm add -D @lhci/cli` so `--frozen-lockfile` keeps working |
| `eslint.config.mjs` | UPDATE | Node globals for `scripts/**/*.{js,mjs}` |
| `scripts/check-tokens.mjs` | CREATE | AC-9 gate over `src/` |
| `scripts/check-privacy.mjs` | CREATE | AC-8 gate over `dist/` |
| `scripts/check-budgets.mjs` | CREATE | AC-10 size gate over `dist/` |
| `lighthouserc.json` | CREATE | AC-10 Lighthouse CI configuration and assertions |
| `.github/workflows/ci.yml` | UPDATE | Nine separately reported jobs, final CI |
| `docs/context/testing.md` | UPDATE | Record every suite and command, including the gate scripts and Lighthouse |
| `docs/development.md` | UPDATE | Commands table, CI paragraph, owner steps (Workers Builds, branch protection, preview check), screenshot-baseline status |

## NOT Building (Scope Limits)

- Playwright screenshot baselines (PRD Should; open question gate vs advisory). They must be generated in CI's Linux environment, which cannot be done reliably from this Windows machine, and no pull request exists during this pipeline run. Deferred to a follow-up on the pull request; no `toHaveScreenshot` spec, no snapshot directory and no `updateSnapshots` config is added.
- Any deploy step, `wrangler` invocation, Cloudflare API token or secret in GitHub Actions (D9: Workers Builds deploys; owner connection).
- Connecting Workers Builds, enabling branch protection and verifying the preview URL on the pull request: owner steps outside the pipeline, documented in `docs/development.md` only.
- Any new test file or edit to an existing test (test pair, after Code Review). The one existing assertion this phase makes obsolete is listed in Notes.
- Any change under `src/`, `public/`, `src/content/` or `wrangler.jsonc`. If a gate fails against the real site, report it as a dispute with the observed value; do not edit the page or loosen the threshold.
- Deleting the orphan `client.*.js` react-dom bundle or changing the Astro/React integration (it is reported by the budget script, not fixed here).
- OG images, JSON-LD, sitemap, canonical URLs, analytics (Stage 6) and anything in v1.1 or post-v1.

## Step-by-Step Tasks

All commands run from the worktree root `C:/repos/site-pro/.worktrees/stage-2-foundation/` in Git Bash. After writing each file, format it with `pnpm exec prettier --write <file>`. Every gate command is judged on its own exit code; no tool output is parsed. Each checker script takes an optional `--src <dir>` / `--dist <dir>` argument (default `src` / `dist`) so the VALIDATE blocks can feed a violating fixture from `mktemp -d` and prove the script exits non-zero. Scripts are ESM, use only `node:fs`, `node:path`, `node:zlib`, `node:url`, export their pure functions, and call `process.exit(1)` after printing every violation when run directly (guard: `import.meta.url === pathToFileURL(process.argv[1]).href`).

### Task 1: UPDATE package.json (and pnpm-lock.yaml)

- **ACTION**: Run `pnpm add -D @lhci/cli` (resolves the latest stable release and updates `pnpm-lock.yaml`; this needs registry access once, so if the install is refused for lack of network report it as BLOCKED with the exact error rather than hand-editing the lockfile; if pnpm 12 asks to approve a dependency build script, report which one instead of approving silently). Then edit `scripts` to add `"check:tokens": "node scripts/check-tokens.mjs"`, `"check:privacy": "node scripts/check-privacy.mjs"`, `"check:budgets": "node scripts/check-budgets.mjs"` and `"lighthouse": "lhci autorun"`, and change `"test:e2e"` from `playwright test --pass-with-no-tests` to `playwright test` (13 specs exist, so an empty suite must now fail instead of passing). Keep every existing script name unchanged. Delivers AC-A6 (the commands CI jobs call exist) and AC-A5 (`lhci` is available).
- **MIRROR**: `# SOURCE: package.json:9-19`.
- **VALIDATE**: `set -euo pipefail; pnpm exec lhci --version; node -e "const p=require('./package.json'); for (const n of ['check:tokens','check:privacy','check:budgets','lighthouse']) if(!p.scripts[n]) { console.error('missing script '+n); process.exit(1) } if (p.scripts['test:e2e'] !== 'playwright test') { console.error('test:e2e is '+p.scripts['test:e2e']); process.exit(1) } if(!p.devDependencies['@lhci/cli']) { console.error('missing @lhci/cli'); process.exit(1) }"; pnpm install --frozen-lockfile; pnpm exec prettier --check package.json` (`lhci --version` exits non-zero if the binary is not installed, the node check fails on any missing script or a wrong `test:e2e`, and the frozen install proves the lockfile matches `package.json`).

### Task 2: CREATE scripts/check-tokens.mjs and UPDATE eslint.config.mjs

- **ACTION**: Create `scripts/check-tokens.mjs` (shebang `#!/usr/bin/env node`). Export `findTokenViolations(srcDir)` returning a list of `{ file, rule, line }`. It walks `srcDir` recursively (`readdirSync(srcDir, { recursive: true })`, backslashes normalised to `/`), keeps files matching `/\.(css|astro|ts|tsx)$/`, skips directories, skips the relative path `styles/tokens.css` and any path starting with `assets/`. For each remaining file it reports rule `color-literal` for every line matching `/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/` and rule `box-shadow-literal` for every line that contains `box-shadow` and does not contain `var(--` (identical to `tests/unit/design-tokens.test.ts:117-146`). When run directly: read `--src <dir>` (default `src`), print one `FAIL <file>:<line> <rule>` line per violation to stderr and exit 1, else print `PASS: no color or box-shadow literal in <N> source files` and exit 0; also exit 1 with a message if fewer than 6 files were scanned (a wrong directory must not pass vacuously). In `eslint.config.mjs` change the node-globals block's `files` from `['*.{js,mjs,cjs,ts}']` to `['*.{js,mjs,cjs,ts}', 'scripts/**/*.{js,mjs}']`, nothing else. Delivers AC-A3 (PRD AC-9).
- **MIRROR**: `# SOURCE: tests/unit/design-tokens.test.ts:117-146` and `# SOURCE: eslint.config.mjs:47-50`.
- **VALIDATE**: the following block (the real source must pass; each violating fixture must fail; the exempt locations and a clean file must pass):

```bash
set -euo pipefail
pnpm exec prettier --check scripts/check-tokens.mjs eslint.config.mjs
pnpm exec eslint scripts/check-tokens.mjs eslint.config.mjs
node scripts/check-tokens.mjs
T=$(mktemp -d)
mkdir -p "$T/styles" "$T/assets" "$T/pages"
for i in 1 2 3 4 5 6; do printf '.a%s { color: var(--fg); }\n' "$i" > "$T/pages/ok$i.css"; done
printf ':root { --x: #2563eb; }\n' > "$T/styles/tokens.css"
printf 'const c = "#ff0000";\n' > "$T/assets/inline.ts"
node scripts/check-tokens.mjs --src "$T"
printf '.b { color: #fff; }\n' > "$T/pages/bad-hex.css"
if node scripts/check-tokens.mjs --src "$T"; then echo "FAIL: hex literal not detected"; exit 1; else echo "PASS: hex literal fails the gate"; fi
rm "$T/pages/bad-hex.css"
printf '.b { background: rgba(0,0,0,.5); }\n' > "$T/pages/bad-rgba.css"
if node scripts/check-tokens.mjs --src "$T"; then echo "FAIL: rgba literal not detected"; exit 1; else echo "PASS: rgba literal fails the gate"; fi
rm "$T/pages/bad-rgba.css"
printf '.b { box-shadow: 0 0 4px black; }\n' > "$T/pages/bad-shadow.css"
if node scripts/check-tokens.mjs --src "$T"; then echo "FAIL: box-shadow literal not detected"; exit 1; else echo "PASS: box-shadow literal fails the gate"; fi
rm "$T/pages/bad-shadow.css"
printf '.b { box-shadow: var(--shadow-1); }\n' > "$T/pages/ok-shadow.css"
node scripts/check-tokens.mjs --src "$T"
```

### Task 3: CREATE scripts/check-privacy.mjs

- **ACTION**: Create `scripts/check-privacy.mjs` (ESM, shebang). Export `findPrivacyViolations(distDir)` returning `{ file, rule, match }[]`. Walk `distDir` recursively and read every file ending in `.html`, `.js`, `.mjs`, `.css`, `.json`, `.xml` (other types such as `.woff2`, `.svg`, `.png`, `.txt` are skipped). Rules, matching link and markup shapes only, never bare tokens (the react-dom bundle contains the object key `tel:!0`, which must not trip the gate): (1) `email` on every scanned file: `/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/`; (2) `mailto-or-tel-link` on `.html` as `/\bhref\s*=\s*["']?\s*(?:mailto|tel):/i`, and on `.js`/`.mjs`/`.json`/`.xml` as a quoted scheme followed by a value, `/["'`]\s*(?:mailto|tel):[^"'`\s]/i`; (3) `form` on `.html`: `/<form\b/i`; (4) `phone` on the visible text of `.html` (tags and `<script>`/`<style>` bodies stripped, entities left as is) and on `.json`/`.xml` raw text: `/(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]\d{3,5}[\s.-]\d{4}\b/`; (5) `external-link` on `.html`: every `<a ... href="http(s)://...">` must match `^https://(github\.com/fabiombarreto(/|$)|www\.linkedin\.com/in/fabio-martins-barreto$)` (same allow-list as the phase 6 validation); (6) `location` on `dist/index.html` only: the file must contain the exact text `Brazil (UTC-3)` (presence only; no private place name is written into the repository). Also report an error if `distDir` has no `.html` file or no `index.html`, so a missing build cannot pass. When run directly: read `--dist <dir>` (default `dist`), print one `FAIL <file> <rule> <match>` per violation to stderr and exit 1, else print `PASS: privacy check over <N> files` and exit 0. The implementer runs it against the real `dist/` first; if a rule fires on vendored bundle text, narrow that rule's pattern to the real link/markup shape and state the evidence in the task result; never add an allow-list entry that silences a real finding and never exclude a file type. Delivers AC-A2 (PRD AC-8).
- **MIRROR**: `# SOURCE: tests/e2e/css-budget.spec.ts:8-24` (recursive walk idiom) and the phase 6 plan's allowed-external-link regex (`PRPs/plans/completed/stage-2-foundation-phase-6-project-pages-and-404.plan.md:418`).
- **VALIDATE**: the following block (real `dist/` must pass; each violating fixture must fail; a clean fixture containing `tel:!0` in JS must pass):

```bash
set -euo pipefail
pnpm exec prettier --check scripts/check-privacy.mjs
pnpm exec eslint scripts/check-privacy.mjs
pnpm build
node scripts/check-privacy.mjs
T=$(mktemp -d)
mkdir -p "$T/_astro"
good='<!doctype html><html lang="en"><body><main><p>Brazil (UTC-3)</p><a href="https://github.com/fabiombarreto">GitHub</a> <a href="https://www.linkedin.com/in/fabio-martins-barreto">LinkedIn</a></main></body></html>'
printf '%s' "$good" > "$T/index.html"
printf 'var o={tel:!0,type:"tel"};\n' > "$T/_astro/a.js"
node scripts/check-privacy.mjs --dist "$T"
printf '%s' '<html><body><p>Brazil (UTC-3)</p><a href="mailto:someone@example.com">x</a></body></html>' > "$T/index.html"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: mailto not detected"; exit 1; else echo "PASS: mailto fails the gate"; fi
printf '%s' '<html><body><p>Brazil (UTC-3) write to someone@example.com</p></body></html>' > "$T/index.html"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: email not detected"; exit 1; else echo "PASS: email fails the gate"; fi
printf '%s' '<html><body><p>Brazil (UTC-3) call +1 415 555 0132</p></body></html>' > "$T/index.html"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: phone not detected"; exit 1; else echo "PASS: phone fails the gate"; fi
printf '%s' '<html><body><p>Brazil (UTC-3)</p><form action="/x"></form></body></html>' > "$T/index.html"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: form not detected"; exit 1; else echo "PASS: form fails the gate"; fi
printf '%s' '<html><body><p>Brazil (UTC-3)</p><a href="https://example.org/x">x</a></body></html>' > "$T/index.html"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: foreign link not detected"; exit 1; else echo "PASS: foreign link fails the gate"; fi
printf '%s' "$good" > "$T/index.html"
printf 'window.open("tel:+14155550132");\n' > "$T/_astro/b.js"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: tel link in JS not detected"; exit 1; else echo "PASS: tel link in JS fails the gate"; fi
rm "$T/_astro/b.js"
printf '%s' '<html><body><p>Somewhere else</p></body></html>' > "$T/index.html"
if node scripts/check-privacy.mjs --dist "$T"; then echo "FAIL: missing location text not detected"; exit 1; else echo "PASS: missing location text fails the gate"; fi
```

### Task 4: CREATE scripts/check-budgets.mjs

- **ACTION**: Create `scripts/check-budgets.mjs` (ESM, shebang) with the constants `JS_TOTAL_KB = 90`, `JS_CRITICAL_KB = 20`, `CSS_TOTAL_KB = 25` at the top. Export `measureBudgets(distDir)`. It reads every `.html` file under `distDir` and, per page, collects: external scripts (`<script ... src="...">`) and external stylesheets (`<link ... rel="stylesheet" ... href="...">`, either attribute order), resolved to files under `distDir` (a root-relative `/_astro/x.js` maps to `<distDir>/_astro/x.js`; a referenced file that does not exist is a violation `missing-asset`); inline scripts (no `src`) and inline `<style>` bodies. The **loaded set** is the union across all pages with each file counted once (shared bundles are not double counted) plus every distinct inline body per page counted once per page (an inline script repeated on every page is one site-wide cost per page load, so it is measured per page, not summed across pages). Sizes are the sum of individual `gzipSync(...).length` values, in KB (1024). Gates: (a) total JS = gzip of every external script file in the loaded set plus the largest single page's inline scripts <= 90 KB; (b) critical JS = per page, gzip of the inline scripts and blocking external scripts (no `type="module"`, `async` or `defer`) that appear before `</head>`, maximum over all pages <= 20 KB; (c) total CSS = gzip of every external stylesheet in the loaded set plus the largest single page's inline `<style>` bodies <= 25 KB. Also compute and print, informationally, the dist-wide total (every `.js` and `.css` file under `distDir`) and list orphan files (present under `distDir`, referenced by no page) so the choice is visible; orphans do not fail the gate (the budget protects what visitors download; today `client.*.js` is such an orphan). Print one line per metric (`JS total 12.3 / 90 KB gzip`, `JS critical ...`, `CSS total ...`, `dist-wide JS ...`, `orphans: ...`). When run directly: read `--dist <dir>` (default `dist`), exit 1 listing every exceeded gate (or `missing-asset`, or no HTML found), else exit 0. Delivers AC-A4 (PRD AC-10).
- **MIRROR**: `# SOURCE: tests/e2e/css-budget.spec.ts:8-24` and `# SOURCE: src/layouts/Base.astro:20-33`.
- **VALIDATE**: the following block (real `dist/` must pass; each exceeded budget must fail; a within-budget fixture must pass; incompressible base64 payloads make the oversize cases deterministic):

```bash
set -euo pipefail
pnpm exec prettier --check scripts/check-budgets.mjs
pnpm exec eslint scripts/check-budgets.mjs
pnpm build
node scripts/check-budgets.mjs
T=$(mktemp -d)
mkdir -p "$T/_astro"
blob() { node -e "process.stdout.write(require('node:crypto').randomBytes($1).toString('base64'))"; }
page() { printf '<!doctype html><html lang="en"><head>%s</head><body>%s</body></html>' "$1" "$2" > "$T/index.html"; }
page '<script>var a=1;</script><link rel="stylesheet" href="/_astro/a.css">' '<script type="module" src="/_astro/a.js"></script>'
printf 'body{color:red}' > "$T/_astro/a.css"
printf 'console.log(1);' > "$T/_astro/a.js"
node scripts/check-budgets.mjs --dist "$T"
page "<script>var big='$(blob 30000)';</script>" ''
if node scripts/check-budgets.mjs --dist "$T"; then echo "FAIL: oversize critical inline head script not detected"; exit 1; else echo "PASS: critical JS budget fails the gate"; fi
page '<script>var a=1;</script><link rel="stylesheet" href="/_astro/a.css">' '<script type="module" src="/_astro/a.js"></script>'
blob 110000 > "$T/_astro/a.js"
if node scripts/check-budgets.mjs --dist "$T"; then echo "FAIL: oversize total JS not detected"; exit 1; else echo "PASS: total JS budget fails the gate"; fi
printf 'console.log(1);' > "$T/_astro/a.js"
blob 30000 > "$T/_astro/a.css"
if node scripts/check-budgets.mjs --dist "$T"; then echo "FAIL: oversize CSS not detected"; exit 1; else echo "PASS: CSS budget fails the gate"; fi
printf 'body{color:red}' > "$T/_astro/a.css"
blob 110000 > "$T/_astro/orphan.js"
node scripts/check-budgets.mjs --dist "$T"
page '<link rel="stylesheet" href="/_astro/missing.css">' ''
if node scripts/check-budgets.mjs --dist "$T"; then echo "FAIL: missing referenced asset not detected"; exit 1; else echo "PASS: missing asset fails the gate"; fi
```

### Task 5: CREATE lighthouserc.json

- **ACTION**: Create `lighthouserc.json` at the worktree root with `ci.collect`: `staticDistDir: "./dist"`, `numberOfRuns: 3`, `url: ["http://localhost/", "http://localhost/projects/relay/"]` (an explicit `url` list turns autodiscovery off and Lighthouse CI substitutes its static server's port; the trailing slash on the project page is its built `index.html` directory form), `settings: { "chromeFlags": "--no-sandbox" }`; `ci.assert`: `assertions` with `"categories:performance"`, `"categories:accessibility"`, `"categories:best-practices"` and `"categories:seo"` each `["error", { "minScore": 0.95, "aggregationMethod": "median" }]`, and `"cumulative-layout-shift": ["error", { "maxNumericValue": 0.01, "aggregationMethod": "median" }]` (no `preset`, so only these assertions apply); `ci.upload`: `{ "target": "filesystem", "outputDir": ".lighthouseci" }` (`.lighthouseci/` is already git-ignored, and no result is uploaded to any third party). Do not lower any value to make a run pass. Delivers AC-A5 (PRD AC-10).
- **MIRROR**: none, because the repo has no existing Lighthouse config; the shape is taken from the Lighthouse CI configuration reference, https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md: `staticDistDir`, `numberOfRuns`, `url`, `assertions` with `minScore`, `maxNumericValue` and `aggregationMethod`). The `--no-sandbox` flag and the exact URL form are validated by the real run in Level 3.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check lighthouserc.json; node -e "const c=require('./lighthouserc.json').ci; const a=c.assert.assertions; const bad=[]; if(c.collect.staticDistDir!=='./dist') bad.push('staticDistDir'); if(c.collect.numberOfRuns!==3) bad.push('numberOfRuns'); if(c.collect.url.length!==2||!c.collect.url[0].endsWith('/')||!c.collect.url[1].includes('/projects/relay')) bad.push('url'); for (const k of ['performance','accessibility','best-practices','seo']) { const r=a['categories:'+k]; if(!r||r[0]!=='error'||r[1].minScore!==0.95||r[1].aggregationMethod!=='median') bad.push(k) } const cls=a['cumulative-layout-shift']; if(!cls||cls[0]!=='error'||cls[1].maxNumericValue!==0.01) bad.push('cls'); if(c.upload.target!=='filesystem') bad.push('upload'); if(bad.length){ console.error('FAIL: '+bad.join()); process.exit(1) }"` (the node check exits non-zero on any wrong or missing value; the real audit run is Level 3).

### Task 6: UPDATE .github/workflows/ci.yml

- **ACTION**: Keep the header (triggers, `permissions`, `concurrency`) and the five existing jobs `lint`, `check`, `unit`, `build`, `e2e` byte-identical (the `e2e` job still ends with `run: pnpm test:e2e` and `run: pnpm build` lines). Append four jobs after `e2e`, in this order, each starting with the same checkout, `corepack enable`, `setup-node` (`node-version-file: .node-version`, `cache: pnpm`) and `pnpm install --frozen-lockfile` steps: `tokens` (`run: pnpm check:tokens`), `privacy` (`run: pnpm build` then `run: pnpm check:privacy`), `budgets` (`run: pnpm build` then `run: pnpm check:budgets`), and `lighthouse` (`run: pnpm build`; `run: pnpm exec playwright install --with-deps chromium`; a step `run: pnpm lighthouse` with `env: CHROME_PATH: ${{ steps.chrome.outputs.path }}` where the preceding step `id: chrome` runs `echo "path=$(node -p "require('@playwright/test').chromium.executablePath()")" >> "$GITHUB_OUTPUT"`; then `actions/upload-artifact@v4` with `if: failure()`, `name: lighthouse-report`, `path: .lighthouseci/`, `retention-days: 7`). Every job is its own status check, so `lint`, `check`, `unit`, `build`, `e2e`, `tokens`, `privacy`, `budgets` and `lighthouse` are reported separately on a pull request and on pushes to `main`. Add no `needs`, no deploy step, no Cloudflare CLI, no secret, and do not write the strings `wrangler` or `CLOUDFLARE_` anywhere in the file (an existing test pins this); a short comment may state that deploys are done by Workers Builds. Delivers AC-A6 (PRD AC-11) and AC-A1 (PRD AC-5, the axe matrix runs inside the unchanged `e2e` job, now failing on an empty suite).
- **MIRROR**: `# SOURCE: .github/workflows/ci.yml:15-27` and `# SOURCE: .github/workflows/ci.yml:65-83`; `# SOURCE: tests/unit/scaffold-config.test.ts:119-121`.
- **VALIDATE**: the following block (structural check of the workflow with a real YAML-independent parser of the job list, so it fails on a missing job, a missing command, a deploy reference or a drifted original job):

```bash
set -euo pipefail
pnpm exec prettier --check .github/workflows/ci.yml
node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';
const text = readFileSync('.github/workflows/ci.yml', 'utf8').replace(/\r\n/g, '\n');
const all = text.split('\n');
const problems = [];
const start = all.indexOf('jobs:');
const ids = all.slice(start + 1).map((l) => /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(l)?.[1]).filter(Boolean);
const want = ['lint', 'check', 'unit', 'build', 'e2e', 'tokens', 'privacy', 'budgets', 'lighthouse'];
if (JSON.stringify(ids) !== JSON.stringify(want)) problems.push('job ids ' + ids.join());
const block = (id) => {
  const i = all.indexOf(`  ${id}:`);
  const rest = all.slice(i + 1);
  const n = rest.findIndex((l) => /^ {2}\S/.test(l));
  return (n === -1 ? rest : rest.slice(0, n)).join('\n');
};
const has = (id, cmd) => new RegExp(`run: ${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(block(id));
const expect = {
  lint: ['pnpm lint', 'pnpm format:check'], check: ['pnpm astro check'], unit: ['pnpm test'], build: ['pnpm build'],
  e2e: ['pnpm build', 'pnpm test:e2e'], tokens: ['pnpm check:tokens'], privacy: ['pnpm build', 'pnpm check:privacy'],
  budgets: ['pnpm build', 'pnpm check:budgets'], lighthouse: ['pnpm build', 'pnpm exec playwright install --with-deps chromium', 'pnpm lighthouse'],
};
for (const [id, cmds] of Object.entries(expect)) {
  if (!block(id).includes('pnpm install --frozen-lockfile')) problems.push(`${id}: no frozen install`);
  for (const c of cmds) if (!has(id, c)) problems.push(`${id}: missing run: ${c}`);
}
if (!/^ {2}pull_request:/m.test(text) || !/^ {2}push:\s*\n\s+branches:\s*\[main\]/m.test(text)) problems.push('triggers');
if (/wrangler|CLOUDFLARE_|secrets\./i.test(text)) problems.push('deploy or secret reference');
if (/^\s+needs:/m.test(text)) problems.push('unexpected needs');
if (!/CHROME_PATH/.test(block('lighthouse'))) problems.push('lighthouse: CHROME_PATH not set');
if (!/lighthouse-report/.test(block('lighthouse'))) problems.push('lighthouse: no failure artifact');
if (problems.length) { console.error('FAIL:\n' + problems.join('\n')); process.exit(1); }
console.log('PASS: nine separately reported jobs, original jobs intact, no deploy step or secret');
EOF
```

### Task 7: UPDATE docs/context/testing.md and docs/development.md

- **ACTION**: In `docs/context/testing.md`: replace the sentence "Both runners pass with no tests while the suites are still empty; the test files are authored afterwards by the test pair." with a statement that both suites now have specs (`tests/unit/` and `tests/e2e/`) and an empty run fails; keep the Vitest and Playwright subsections; remove the "arriving in later Stage 2 phases" paragraph; add a "Quality gate scripts (CI)" subsection listing `pnpm check:tokens` (AC-9, over `src/`), `pnpm check:privacy` (AC-8, over `dist/`, needs `pnpm build` first), `pnpm check:budgets` (AC-10, over `dist/`, needs `pnpm build` first) and `pnpm lighthouse` (Lighthouse CI per `lighthouserc.json`: median of 3 runs on `/` and `/projects/relay/`, categories >= 0.95, CLS <= 0.01; needs `pnpm build` and Chrome, locally via `CHROME_PATH=$(node -p "require('@playwright/test').chromium.executablePath()")`), each with its nine-job CI name, plus one line saying the axe matrix runs inside `pnpm test:e2e` and that screenshot baselines are not part of Stage 2 yet. In `docs/development.md`: replace the Lighthouse row in the Commands table with the real commands and add rows for the three gate scripts; rewrite the CI paragraph to list the nine separately reported jobs (`lint`, `check`, `unit`, `build`, `e2e`, `tokens`, `privacy`, `budgets`, `lighthouse`) and say deploys are done by Workers Builds, not CI; add an "Owner steps outside the pipeline" section with three numbered steps (connect the GitHub repository to Cloudflare Workers Builds with production branch `main` and non-production branch builds and preview URLs enabled, before the Stage 2 pull request opens; add branch protection on `main` requiring the nine CI checks; on the pull request open the Workers Builds preview URL and confirm it serves that commit's build and matches the five final-page artboards in both themes), and a note that Playwright screenshot baselines (PRD Should, gate-versus-advisory still open) must be generated in CI's Linux environment and are a follow-up. Write all text in English and put no private data in either file. Delivers AC-A7 (PRD AC-11 documentation and owner steps) and documents AC-A2 to AC-A5.
- **MIRROR**: `# SOURCE: .github/workflows/ci.yml:15-27` (job names to list) and the existing section style of `docs/context/testing.md:55-67` and `docs/development.md:11-26`.
- **VALIDATE**: `set -euo pipefail; for c in 'pnpm check:tokens' 'pnpm check:privacy' 'pnpm check:budgets' 'pnpm lighthouse'; do grep -qF "$c" docs/context/testing.md; grep -qF "$c" docs/development.md; done; grep -q 'Workers Builds' docs/development.md; grep -q 'branch protection' docs/development.md; grep -qi 'screenshot baselines' docs/development.md; for j in lint check unit build e2e tokens privacy budgets lighthouse; do grep -q "\`$j\`" docs/development.md; done; if grep -q 'five separately reported' docs/development.md; then echo "FAIL: stale CI job count"; exit 1; fi; if grep -q 'arriving in later Stage 2 phases' docs/context/testing.md; then echo "FAIL: stale testing.md sentence"; exit 1; fi; if grep -q 'pass with no tests' docs/context/testing.md; then echo "FAIL: stale empty-suite sentence"; exit 1; fi; echo "PASS: docs record every suite, command, CI job and owner step"` (a text match is legitimate here because the deliverable is the documentation text; each check reads the literal this task instructs be written).

## Validation Commands

Run from the worktree root. Every block starts with `set -euo pipefail`, so a mid-block failure fails the block. The gate scripts and the CI structure checks have their own failing-fixture proofs inside the task VALIDATE blocks above.

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm format:check
node -e "const p=require('./package.json'); for (const n of ['check:tokens','check:privacy','check:budgets','lighthouse']) if(!p.scripts[n]) { console.error('missing script '+n); process.exit(1) }"
```

### Level 2: UNIT_TESTS and CONTENT_INVARIANTS

```bash
set -euo pipefail
# Existing unit suite as a regression guard. tests/unit/scaffold-config.test.ts is excluded on purpose:
# its "defines exactly the five separately reported jobs" assertion (lines 87-93) is made obsolete by AC-11
# (nine jobs). The Implementer must not edit it; the test pair updates it. Its other assertions are
# re-checked directly by the Task 6 block (original jobs intact, triggers, no deploy reference).
pnpm exec vitest run --exclude tests/unit/scaffold-config.test.ts
pnpm build
# The four gates against the real site and the real source.
pnpm check:tokens
pnpm check:privacy
pnpm check:budgets
# Nothing under src/, public/, wrangler.jsonc or any test file was changed by this phase.
# Phases 1-6 are uncommitted in the worktree by design, so compare against the phase-6 end-state tree
# (the phase's diff base), never against HEAD or a clean status.
git add -A
changed=$(git diff --name-only b4e9c942a6e4f2c6b461b323c83d272e6dbbc73a -- src public wrangler.jsonc tests)
if [ -n "$changed" ]; then
  echo "FAIL: this phase must not change src, public, wrangler.jsonc or tests:"; echo "$changed"; exit 1
else
  echo "PASS: src, public, wrangler.jsonc and tests unchanged since the phase-6 tree"
fi
```

### Level 3: INTEGRATION (existing e2e suite, then the real Lighthouse CI run)

```bash
set -euo pipefail
pnpm build
# Existing e2e suite, unscoped, now without --pass-with-no-tests (an empty suite fails).
pnpm test:e2e
# Real Lighthouse CI run on dist/ with Playwright's chromium, exactly as the CI job does.
# If a category or CLS assertion fails, report the observed scores as a dispute; do not lower a threshold or edit the page.
export CHROME_PATH="$(node -p "require('@playwright/test').chromium.executablePath()")"
test -x "$CHROME_PATH" || test -f "$CHROME_PATH"
pnpm lighthouse
# The run wrote results under the git-ignored .lighthouseci/ folder, with 3 runs for each of the 2 URLs.
node -e "const fs=require('node:fs'); const n=fs.readdirSync('.lighthouseci').filter(f=>/^lhr-.*\.json$/.test(f)).length; if(n!==6){ console.error('expected 6 lhr files, found '+n); process.exit(1) }"
```

## Acceptance Criteria

- **AC-A1 (PRD AC-5):** The axe matrix (`/`, the 4 project pages, an unknown path; Midnight and Daylight; 1280x800, 800x1024, 375x812; `/` at 375x812 with the menu open) runs in CI inside the `e2e` job, and that job fails when no spec runs (`test:e2e` no longer passes with no tests).
- **AC-A2 (PRD AC-8):** `pnpm check:privacy` over the built `dist/` scans every HTML, JS, CSS, JSON and XML file and exits 0 only when it finds no email pattern, no `mailto:` or `tel:` link, no phone pattern in text, no `<form>`, no external link other than `github.com/fabiombarreto` (and its repositories) and `linkedin.com/in/fabio-martins-barreto`, and `dist/index.html` carries the location text `Brazil (UTC-3)`; it exits non-zero on each violating fixture.
- **AC-A3 (PRD AC-9):** `pnpm check:tokens` exits 0 only when no `.css`, `.astro`, `.ts` or `.tsx` file under `src/`, other than `src/styles/tokens.css` and files under `src/assets/`, contains a hex, `rgb()`, `rgba()` or `hsl()` color literal or a `box-shadow` line without `var(--`; it exits non-zero on each violating fixture and on a vacuous scan.
- **AC-A4 (PRD AC-10):** `pnpm check:budgets` exits 0 only when, for what the pages load, total JS is <= 90 KB gzip, the JS that runs before first paint (inline and blocking head scripts) is <= 20 KB gzip and total CSS is <= 25 KB gzip; it exits non-zero when any threshold is exceeded or a referenced asset is missing, and it prints the dist-wide total and the orphan files so the measuring choice is visible.
- **AC-A5 (PRD AC-10):** `lighthouserc.json` configures Lighthouse CI on `dist/` (`staticDistDir: ./dist`, `numberOfRuns: 3`) for `/` and `/projects/relay/`, asserting median scores >= 0.95 for Performance, Accessibility, Best Practices and SEO and a median CLS <= 0.01 as errors, and `pnpm lighthouse` fails the run when any assertion fails.
- **AC-A6 (PRD AC-11):** `.github/workflows/ci.yml`, on `pull_request` and on `push` to `main`, defines nine jobs `lint`, `check`, `unit`, `build`, `e2e`, `tokens`, `privacy`, `budgets` and `lighthouse`, each reported as its own status check, installing from the frozen lockfile, with Playwright browsers installed with system dependencies in the `e2e` and `lighthouse` jobs, and with no deploy step, Cloudflare CLI or secret.
- **AC-A7 (PRD AC-11):** `docs/context/testing.md` and `docs/development.md` record every suite and command and the nine CI jobs, and `docs/development.md` lists the owner-only steps (connect Workers Builds with preview URLs enabled, branch protection requiring the checks, verify the preview URL serves the pull request's build); production serving the merged build after a merge to `main` is performed by Workers Builds and verified by the owner, not by CI.

R8b (PRD AC-N token check) applies here: every item above carries its PRD `AC-N`.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `pnpm add -D @lhci/cli` needs registry access, which the local environment may not have, and pnpm 12 may require approving a dependency build script | M | H | Task 1 reports BLOCKED with the exact error instead of hand-editing the lockfile or approving a build script silently; the lockfile is only changed by pnpm |
| A Lighthouse category (most likely Performance) scores below 0.95 on Windows locally or on a CI runner, or run-to-run variance flips a result | M | M | 3 runs with median aggregation per the PRD; Level 3 reports observed scores as a dispute rather than lowering a threshold or touching `src/`; the PRD's own risk table names this variance and the owner checks the first preview |
| The privacy email or phone pattern false-positives on vendored JS (version strings, `@` in package-style tokens) or on SVG path data | M | M | Phone pattern is applied only to visible HTML text and to JSON/XML; the email pattern needs a dotted domain with a 2+ letter TLD; Task 3 requires narrowing a rule to the real link/markup shape with recorded evidence if the real `dist/` trips it, never an allow-list or excluded file type; fixtures prove each rule still fires |
| Orphan react-dom `client.*.js` is excluded from the JS budget because no page loads it | L | L | The choice is stated in the Solution Statement and Task 4; the script prints the dist-wide total and the orphan list on every run so a growing orphan stays visible |
| The explicit Lighthouse URL form (`http://localhost/projects/relay/`) may not resolve against the static server, or `--no-sandbox` may be unnecessary or insufficient | L | M | Level 3 runs the real audit and checks six `lhr-*.json` outputs exist; fix the URL form (for example `.../index.html`) only if the run proves it wrong, and record the evidence |
| Adding jobs makes the existing `scaffold-config.test.ts` job-list assertion fail | H | M | Declared obsolete in Notes; Level 2 excludes that file only and re-checks its other conditions in Task 6; the Implementer must not edit it, the test pair updates it |
| CI repeats `pnpm build` in five jobs (build, e2e, privacy, budgets, lighthouse) | L | L | Matches the existing per-job style and keeps jobs independent and separately reported; an artifact hand-off is a later optimisation if CI time matters |
| Screenshot baselines are not delivered | L | L | Explicitly deferred (NOT Building, docs): Linux-generated baselines cannot be produced on this Windows machine and no pull request exists yet; the open gate-versus-advisory question stays open in the PRD |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework. (Levels 2 and 3 additionally run the existing suites, purely as a regression guard.)
- **Existing test this phase obsoletes (for the test pair, not the Implementer):** `tests/unit/scaffold-config.test.ts:87-93` ("defines exactly the five separately reported jobs", `expect(ids).toEqual(['lint', 'check', 'unit', 'build', 'e2e'])`) contradicts AC-11, which needs `tokens`, `privacy`, `budgets` and `lighthouse` as their own status checks; it must become the nine-id list. Level 2 excludes only that file. The rest of that file stays valid (frozen installs, per-job `run:` lines, triggers, no `wrangler`/`CLOUDFLARE_` text). No other existing test is affected: nothing under `src/` or `wrangler.jsonc` changes and `package.json` keeps every script name the file pins (`tests/unit/scaffold-config.test.ts:26-41`).
- **New-test candidates for the test pair:** unit tests importing the exported `findTokenViolations`, `findPrivacyViolations` and `measureBudgets` with fixture directories (the same fixtures the VALIDATE blocks use), and a workflow test for the nine jobs. The Playwright axe matrix and the CSS budget already exist (`tests/e2e/home-axe.spec.ts`, `tests/e2e/subpages-axe.spec.ts`, `tests/e2e/css-budget.spec.ts`).
- **Scripts versus tests (decision):** the token, privacy and budget checks are CI scripts, not Vitest or Playwright tests, because each must be a separately reported status check over a build artifact, must be runnable by the owner with one command, and tests belong to the test pair. The token rule is also asserted in Vitest (`design-tokens.test.ts:117-146`); the script copies the same regexes so the two cannot disagree.
- **Budget measuring choice:** gates use the loaded set (files the pages reference, each counted once, plus inline bodies measured per page). The dist-wide total and orphan files are printed for information. The orphan today is `dist/_astro/client.*.js` (the react-dom client bundle that static, directive-free rendering never loads); the existing CSS e2e budget measures the whole `dist/` CSS, which the loaded-set CSS can only equal or undercut because per-file gzip is summed.
- **Owner steps (no PR exists during `/relay-execute`):** connect the GitHub repository to Cloudflare Workers Builds (production branch `main`, non-production branch builds and preview URLs on), add branch protection on `main` requiring the nine checks, then verify the preview URL on the Stage 2 pull request and approve visual parity against the five final-page artboards. These are documented in `docs/development.md` only; the plan adds no deploy step, secret or Cloudflare CLI to CI.
- **Screenshot baselines:** advisory and out of this phase (PRD Should with an open gate-versus-advisory question): they must be generated in Linux CI to be stable and cannot be from Windows. Recommended follow-up on the pull request: add a manually triggered workflow that writes baselines on `ubuntu-latest`, then decide gate or advisory with the owner.
- Working directory: all implementation and validation happens in the worktree `C:/repos/site-pro/.worktrees/stage-2-foundation/`; the paths in this plan are relative to it.
- Research grounding: `research-codebase` and `research-web` were dispatched in parallel. Web research confirmed the `lighthouserc.json` shape (`staticDistDir`, an explicit `url` list disables autodiscovery, `numberOfRuns` default 3, `minScore` and `maxNumericValue` assertions, `aggregationMethod` values `median`, `median-run`, `optimistic`, `pessimistic`), Chrome resolution order (`chromePath` option, then `CHROME_PATH`), and `pnpm/action-setup` reading `packageManager`; it left open whether directory URLs resolve in the static server and whether `--no-sandbox` is needed, so Level 3 runs the real audit. Codebase research hit its scope cap before listing `tests/`, so every anchor above was re-read directly in the worktree.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
