# Feature: Scaffold and CI skeleton (Phase 1 of stage-2-foundation)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (project scaffold, hosting product under D9, Node/pnpm pinning); cross-cutting patterns (CI quality gates, lint/format/type tooling, test runner configuration); reuse or creation of project-level configuration (worktree bootstrap scripts, .gitignore); business rules for build only as an out-of-scope boundary (no build layer in this phase)
- Decisions found:
  - D2: Astro (SSG) + React rendered to static HTML + TypeScript strict; runtime stays outside React
  - D9 (amended 2026-11-05): Cloudflare Workers Static Assets deployed by Workers Builds; no Cloudflare secret in GitHub; branch protection on `main` makes CI checks gate merges
  - Presentation-only scope: no backend, forms, or email on the site
  - Stage 2 PRD approved 2026-11-05: methodology is test-after (`tdd: false`) with Vitest and Playwright declared
  - Privacy list: no phone, email, city, employers or client projects anywhere, including fixtures and test data
- Applicable anti-patterns:
  - Raw values instead of tokens (the placeholder page must contain no color literal)
  - Publishing private data
  - Scope creep into v1 (no runtime, palette, tokens, themes, or content in this phase)
  - Weakening tests to get a green run (empty-suite tolerance is a configuration choice, never a deletion or skip)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - SSG with complete final HTML that works without JS; React page components render to static HTML without a client directive
  - Plain CSS with token custom properties, no CSS framework
  - Planned folder layout of docs/06-architecture.md, creating only the folders Stage 2 needs
  - Node and pnpm pinned (`.node-version`, `packageManager`) so CI and Workers Builds match local
  - Relay artifacts live in `PRPs/`; nothing under `.claude/`
- Result: PROCEED
```

## Source

- `PRPs/prds/stage-2-foundation.prd.md` — Implementation Phases row 1: "Scaffold and CI skeleton" — Goal: A buildable, lintable, testable empty site with CI running on every pull request. — Success signal: `pnpm install --frozen-lockfile && pnpm lint && pnpm astro check && pnpm test && pnpm build && pnpm test:e2e` passes locally and in CI. Partially covers AC-1 and AC-11.

## Summary

This phase creates the first production code of site-pro: an Astro 6 static project with `@astrojs/react`, TypeScript strict, pnpm pinned through `packageManager` and a committed lockfile, Node pinned through `.node-version`, an ESLint flat config and Prettier, Vitest and Playwright (+ axe) configured, a minimal placeholder index page that renders one React component to static HTML, a `wrangler.jsonc` for Workers Static Assets, `.gitignore` entries for Node/Astro/test output, the relay worktree bootstrap scripts enabled to run `pnpm install --frozen-lockfile`, a GitHub Actions workflow with five separately reported jobs (lint, check, unit, build, e2e), and the real commands recorded in docs/development.md and docs/context/testing.md. Test runners are configured to pass on an empty suite because test files are authored afterwards by the test pair (test-after methodology).

## User Story

As the owner of site-pro
I want a buildable, lintable, testable empty Astro site with CI on every pull request
So that every later Stage 2 phase and Stage 3 start from a measured, reproducible base.

## Problem Statement

site-pro has approved documentation and an approved design but no application code: no `package.json`, no lockfile, no CI workflow and no hosting configuration. Until a project scaffold exists with quality tooling and CI, no later phase (tokens, content, components, pages) can be built or verified.

## Solution Statement

Scaffold the project exactly as the approved architecture describes (Astro 6 static, no adapter, React page components rendered statically, TypeScript strict, pnpm, plain CSS later), wire the lint/format/type-check/unit/E2E tooling, add `wrangler.jsonc` for Workers Static Assets (no deploy command anywhere; Workers Builds is connected by the owner later), and add a GitHub Actions workflow whose jobs mirror the Phase 1 success signal. Keep the page a minimal placeholder; Phases 2 to 6 replace it.

## Metadata

| Key | Value |
|-----|-------|
| Type | New project scaffold |
| Complexity | Medium |
| Systems Affected | Repository root config, `src/`, `scripts/`, `.github/workflows/`, `docs/development.md`, `docs/context/testing.md`, `.gitignore` |
| Dependencies | Node 24 (v24.15.0 verified locally; Astro 6 requires Node >= 22.12.0), pnpm 12.16.1 via corepack, network access to the npm registry |
| Estimated Tasks | 8 |
| Source PRD line ref | `PRPs/prds/stage-2-foundation.prd.md:177`, `:187-190` |
| phase_type | scaffold |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-2-foundation.prd.md` | 148-161, 187-190 | Architecture Notes (Astro 6 static, no adapter, hosting, CI) and the Phase 1 Goal/Scope/Success signal |
| P0 | `scripts/worktree-bootstrap.sh` | 22-24 | The commented `pnpm install --frozen-lockfile` line Task 6 enables |
| P0 | `scripts/worktree-bootstrap.ps1` | 21-23 | The PowerShell mirror Task 6 enables |
| P0 | `.gitignore` | 1-6 | Existing ignores to preserve while adding Node/Astro/test output |
| P1 | `docs/development.md` | 3-22 | The planned command table Task 8 turns into real commands |
| P1 | `docs/context/testing.md` | 49-62 | The "Detected test suites" section Task 8 updates (guardrail text at 16-47 stays unchanged) |
| P1 | `docs/06-architecture.md` | 86-105, 172-175 | Folder layout and CI/preview contract |
| P1 | `docs/context/methodology.md` | 1-12 | `tdd: false` and `test_frameworks: [vitest, playwright]` |

## Patterns to Mirror

No application code exists to mirror. The anchors below are the repository's real files this phase edits, plus the official documentation snippets that fix the external config shapes (web sources carry their URL).

```
# SOURCE: scripts/worktree-bootstrap.sh:22-24
# TODO: Uncomment and adapt — dependency install
# Run after env files are in place so the install can read them.
# cd "${WORKTREE_PATH}" && pnpm install --frozen-lockfile
```
Copied by: Task 6 (bash script).

```
# SOURCE: scripts/worktree-bootstrap.ps1:21-23
# TODO: Uncomment and adapt — dependency install
# Run after env files are in place so the install can read them.
# Push-Location $WorktreePath; pnpm install --frozen-lockfile; Pop-Location
```
Copied by: Task 6 (PowerShell script).

```
# SOURCE: .gitignore:1-6
# relay — per-feature worktrees (ephemeral)
.worktrees/

# Claude — ignore session/cache/local artifacts, but commit project-wide settings
.claude/*
!.claude/settings.json
```
Copied by: Task 6 (existing blocks are preserved, new blocks appended in the same commented-group style).

```
# SOURCE: docs/development.md:13-22
| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Type check | `pnpm astro check` |
| Lint / format | `pnpm lint` · `pnpm format` |
| Unit tests | `pnpm test` (Vitest) |
| E2E, visual, accessibility | `pnpm test:e2e` (Playwright + axe) |
| Production build | `pnpm build` · `pnpm preview` |
| Lighthouse | Lighthouse CI in GitHub Actions |
```
Copied by: Tasks 1, 3, 4 (script names) and Task 8 (the table itself).

```
# SOURCE: https://developers.cloudflare.com/workers/framework-guides/web-apps/astro
"assets": { "directory": "./dist", "not_found_handling": "404-page" }
```
Plus: set `compatibility_date`, and no `main` field is needed for a static site. Copied by: Task 5.

```
# SOURCE: https://docs.astro.build/en/guides/integrations-guide/react/
extends "astro/tsconfigs/strict"; include [".astro/types.d.ts", "**/*"]; exclude ["dist"]
compilerOptions jsx "react-jsx", jsxImportSource "react"
```
Copied by: Task 2.

```
# SOURCE: https://playwright.dev/docs/ci-intro
run: npx playwright install --with-deps
uses: actions/upload-artifact@v4 with if: ${{ !cancelled() }} and path: playwright-report/
```
Copied by: Task 7 (adapted to `pnpm exec playwright`; the report upload is adapted to `if: failure()`).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `package.json` | CREATE | Project manifest: `packageManager`, `engines`, scripts, dependencies |
| `pnpm-lock.yaml` | CREATE | Committed lockfile required by `pnpm install --frozen-lockfile` (generated by `pnpm install`, never hand-written) |
| `.node-version` | CREATE | Pins Node for CI and Workers Builds |
| `astro.config.mjs` | CREATE | Static output, React integration, no adapter |
| `tsconfig.json` | CREATE | TypeScript strict via `astro/tsconfigs/strict` |
| `src/pages/index.astro` | CREATE | Minimal placeholder page (static HTML, `lang="en"`, title, description) |
| `src/components/page/SiteMark.tsx` | CREATE | Tiny typed React component proving React renders to static HTML |
| `eslint.config.mjs` | CREATE | ESLint flat config (typescript-eslint, eslint-plugin-astro, React, React Hooks, jsx-a11y) |
| `.prettierrc.json` | CREATE | Prettier config with `prettier-plugin-astro` |
| `.prettierignore` | CREATE | Keeps Prettier off docs, PRPs, lockfile, generated output |
| `vitest.config.ts` | CREATE | Vitest config, tolerant of an empty suite (runner config, not a test file) |
| `playwright.config.ts` | CREATE | Playwright config with a preview web server (runner config, not a test file) |
| `wrangler.jsonc` | CREATE | Workers Static Assets config (`./dist`, `404-page`, name `site-pro`) |
| `.gitignore` | UPDATE | Add `node_modules`, `dist`, `.astro`, `.wrangler`, test and Lighthouse reports |
| `scripts/worktree-bootstrap.sh` | UPDATE | Enable `pnpm install --frozen-lockfile` |
| `scripts/worktree-bootstrap.ps1` | UPDATE | Enable `pnpm install --frozen-lockfile` with an exit-code check |
| `.github/workflows/ci.yml` | CREATE | CI with lint, check, unit, build and e2e jobs |
| `docs/development.md` | UPDATE | Replace planned commands with the real ones; record the Node pin |
| `docs/context/testing.md` | UPDATE | Record the real suites, commands and prerequisites |

## NOT Building (Scope Limits)

- Any test file, including the "one smoke test each" named in the PRD's Phase 1 scope: tests are authored afterwards by the test-writer/test-reviewer pair (test-after methodology; the Implementer's diff must contain no test files). Vitest and Playwright are only installed and configured. No `tests/` directory is created.
- Design tokens, themes, base styles, fonts and the theme script (Phase 2); content collections and `src/strings.ts` (Phase 3); page components beyond one placeholder component (Phase 4); the real home page (Phase 5); project pages and the 404 page (Phase 6).
- Empty `src/runtime/`, `src/stores/`, `src/components/build/` or `src/sections/` folders (the PRD says only the folders Stage 2 needs); nanostores.
- Lighthouse CI, the size budget script, axe matrix, privacy and token checks, screenshot baselines (Phase 7).
- Any Cloudflare deploy command, Wrangler dependency, API token or secret, locally or in CI; connecting Workers Builds and branch protection (owner steps).
- Build runtime and every Stage 3 to 6 item; anything in v1.1 or post-v1.

## Step-by-Step Tasks

### Task 1: CREATE package.json, .node-version and the lockfile

- **ACTION**: Delivers AC-A4. Write `.node-version` containing `24`. Write `package.json` by hand with `"name": "site-pro"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@12.16.1"`, `"engines": { "node": ">=22.12.0" }` and these scripts: `dev` = `astro dev`, `build` = `astro build`, `preview` = `astro preview`, `check` = `astro check`, `lint` = `eslint .`, `format` = `prettier --write .`, `format:check` = `prettier --check .`, `test` = `vitest run`, `test:e2e` = `playwright test --pass-with-no-tests`. Then resolve dependencies with the package manager, never by guessing versions: `pnpm add astro @astrojs/react react react-dom` and `pnpm add -D typescript @astrojs/check @types/react @types/react-dom @types/node eslint @eslint/js typescript-eslint eslint-plugin-astro eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y globals prettier prettier-plugin-astro vitest @playwright/test @axe-core/playwright`. Keep Astro on the 6.x major and pick an ESLint major that satisfies every installed plugin's peer range (do not force with `--force` or `--legacy-peer-deps` equivalents). If pnpm reports ignored dependency build scripts (for example esbuild or sharp), approve only the packages it names through pnpm's own workspace configuration and record that in `## Notes`. Do not use any global install. Commit nothing.
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: docs/development.md:13-22` (script names).
- **VALIDATE**: `set -euo pipefail; pnpm install --frozen-lockfile; pnpm exec astro --version; pnpm exec vitest --version; pnpm exec playwright --version; pnpm exec eslint --version; pnpm exec prettier --version; node -e 'const p=JSON.parse(require("fs").readFileSync("package.json","utf8")); if(p.packageManager!=="pnpm@12.16.1"||!p.scripts["test:e2e"]){process.exit(1)}'`

### Task 2: CREATE astro.config.mjs, tsconfig.json, the placeholder page and SiteMark

- **ACTION**: Delivers AC-A1 and AC-A6. Create `astro.config.mjs` using `defineConfig` from `astro/config` with `output: 'static'`, `integrations: [react()]` (from `@astrojs/react`) and no adapter and no `site`. Create `tsconfig.json` extending `astro/tsconfigs/strict`, with `include` `[".astro/types.d.ts", "**/*"]`, `exclude` `["dist", "node_modules", ".worktrees", "PRPs"]`, and `compilerOptions` `jsx: "react-jsx"`, `jsxImportSource: "react"`. Create `src/components/page/SiteMark.tsx` exporting a typed function component `SiteMark` that returns `<h1>Fabio Barreto.</h1>`. Create `src/pages/index.astro` that imports `SiteMark` (rendered with no client directive) and outputs a complete document: `<html lang="en">`, `<meta charset="utf-8" />`, a viewport meta, `<title>Fabio Barreto</title>`, a meta description reading `Personal portfolio of Fabio Barreto, Senior Software Engineer.`, and a `<body>` with one `<main>` containing `<SiteMark />`. Add a one-line comment that this page is a Phase 1 placeholder replaced by Phase 5. No color literal, no `<style>`, no email, no form, no `mailto:` or `tel:`, no invented content.
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: https://docs.astro.build/en/guides/integrations-guide/react/`.
- **VALIDATE**: `set -euo pipefail; pnpm build; test -f dist/index.html; grep -q '<html lang="en"' dist/index.html; grep -q '<main' dist/index.html; grep -q 'Fabio Barreto\.' dist/index.html; if grep -Eq 'mailto:|tel:|<form' dist/index.html; then echo "FAIL: forbidden contact markup in dist/index.html"; exit 1; fi`

### Task 3: CREATE eslint.config.mjs, .prettierrc.json and .prettierignore

- **ACTION**: Delivers AC-A5. Create `eslint.config.mjs` (flat config, ESM) that ignores `dist`, `.astro`, `.worktrees`, `PRPs`, `docs`, `coverage`, `playwright-report`, `test-results`, `.lighthouseci`, and composes: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-astro` recommended plus its jsx-a11y recommended config for `.astro` files, `eslint-plugin-react` flat recommended and jsx-runtime configs, `eslint-plugin-react-hooks` recommended flat config, and `eslint-plugin-jsx-a11y` flat recommended for `.tsx`, with `globals` set for browser (src) and node (config files), and React `settings.version` set to `detect`. Follow each plugin's own flat-config instructions from its README at install time. Create `.prettierrc.json` with `{ "plugins": ["prettier-plugin-astro"], "singleQuote": true, "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }] }`. Create `.prettierignore` listing `dist`, `.astro`, `.worktrees`, `node_modules`, `pnpm-lock.yaml`, `coverage`, `playwright-report`, `test-results`, `.lighthouseci`, `docs`, `PRPs`, `.claude`, `CLAUDE.md`, `README.md`, `LICENSE`. Run `pnpm format` once so every file this phase created conforms; then fix any real lint finding in the code (never by disabling the rule).
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: docs/development.md:13-22` (the `lint` and `format` script names; the repo has no prior ESLint/Prettier config to copy).
- **VALIDATE**: `set -euo pipefail; pnpm lint; pnpm format:check; pnpm exec eslint --print-config src/components/page/SiteMark.tsx > /dev/null`

### Task 4: CREATE vitest.config.ts and playwright.config.ts

- **ACTION**: Delivers AC-A5. Create `vitest.config.ts` using `defineConfig` from `vitest/config` with `test.include` `['tests/unit/**/*.test.{ts,tsx}']`, `test.environment` `'node'` and `test.passWithNoTests` `true` (so `pnpm test` is green on the test-free tree and the later test pair's files under `tests/unit/` are picked up). Create `playwright.config.ts` using `defineConfig` and `devices` from `@playwright/test` with `testDir: './tests/e2e'`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`, `reporter: [['list'], ['html', { open: 'never' }]]`, `use.baseURL: 'http://127.0.0.1:4321'`, a single `chromium` project using `devices['Desktop Chrome']`, and `webServer` with `command: 'pnpm exec astro preview --host 127.0.0.1 --port 4321'`, `url: 'http://127.0.0.1:4321'`, `reuseExistingServer: !process.env.CI`. Create no file under `tests/`. The `--pass-with-no-tests` flag for Playwright is already in the `test:e2e` script from Task 1.
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: https://playwright.dev/docs/ci-intro` (CI-aware settings) and `# SOURCE: docs/development.md:13-22` (script names).
- **VALIDATE**: `set -euo pipefail; pnpm test; pnpm exec playwright test --list --pass-with-no-tests; pnpm build; pnpm test:e2e`

### Task 5: CREATE wrangler.jsonc

- **ACTION**: Delivers AC-A3. Create `wrangler.jsonc` as plain JSON with no comments and no trailing commas, containing exactly: `name` `"site-pro"`, `compatibility_date` `"2026-11-05"`, and `assets` `{ "directory": "./dist", "not_found_handling": "404-page" }`. No `main` field, no routes, no account id, no secret. Do not install `wrangler` and do not run any deploy command.
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: https://developers.cloudflare.com/workers/framework-guides/web-apps/astro`.
- **VALIDATE**: `node -e 'const c=JSON.parse(require("fs").readFileSync("wrangler.jsonc","utf8")); if(c.name!=="site-pro"||c.assets.directory!=="./dist"||c.assets.not_found_handling!=="404-page"||"main" in c){process.exit(1)}'`

### Task 6: UPDATE .gitignore and both worktree bootstrap scripts

- **ACTION**: Delivers AC-A4. In `.gitignore`, keep the existing lines 1-6 unchanged and append two commented groups: `# Node / Astro / Cloudflare` with `node_modules/`, `dist/`, `.astro/`, `.wrangler/`, and `# Test and Lighthouse reports` with `coverage/`, `playwright-report/`, `test-results/`, `blob-report/`, `.lighthouseci/`. In `scripts/worktree-bootstrap.sh`, replace the three-line commented dependency-install block's last line with the active line `cd "${WORKTREE_PATH}" && pnpm install --frozen-lockfile` (keep the other TODO blocks untouched, and reword the block's `# TODO: Uncomment and adapt — dependency install` heading to `# Dependency install`). In `scripts/worktree-bootstrap.ps1`, replace the commented install line with an active block: `Push-Location $WorktreePath`, then `try {`, then `pnpm install --frozen-lockfile` followed by `if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`, then `} finally { Pop-Location }`, and reword the heading the same way. The explicit `$LASTEXITCODE` check is needed because `$ErrorActionPreference = 'Stop'` does not stop on a failing native command.
- **MIRROR**: Patterns to Mirror anchors `# SOURCE: scripts/worktree-bootstrap.sh:22-24`, `# SOURCE: scripts/worktree-bootstrap.ps1:21-23` and `# SOURCE: .gitignore:1-6`.
- **VALIDATE**: `set -euo pipefail; bash -n scripts/worktree-bootstrap.sh; grep -qxF 'cd "${WORKTREE_PATH}" && pnpm install --frozen-lockfile' scripts/worktree-bootstrap.sh; grep -qE '^ *pnpm install --frozen-lockfile$' scripts/worktree-bootstrap.ps1; bash scripts/worktree-bootstrap.sh "$PWD"; for p in node_modules/x dist/index.html .astro/types.d.ts .wrangler/state coverage/lcov.info playwright-report/index.html test-results/a blob-report/a .lighthouseci/a.json .worktrees/a; do git check-ignore -q "$p" || { echo "FAIL: $p not ignored"; exit 1; }; done; if git check-ignore -q .claude/settings.json || git check-ignore -q pnpm-lock.yaml; then echo "FAIL: a tracked file is ignored"; exit 1; fi`

### Task 7: CREATE .github/workflows/ci.yml

- **ACTION**: Delivers AC-A2. Create a workflow named `CI` triggered on `pull_request` and on `push` to `main`, with top-level `permissions: contents: read` and a `concurrency` group that cancels in-progress runs for the same ref. Define five jobs, each on `ubuntu-latest` and each reported as its own status check, with job ids exactly `lint`, `check`, `unit`, `build` and `e2e`. Every job runs: `actions/checkout`, then `corepack enable` (before Node setup so the pnpm cache can resolve; pnpm comes from the `packageManager` field), then `actions/setup-node` with `node-version-file: .node-version` and `cache: pnpm`, then `pnpm install --frozen-lockfile`. Then: `lint` runs `pnpm lint` and `pnpm format:check`; `check` runs `pnpm astro check`; `unit` runs `pnpm test`; `build` runs `pnpm build`; `e2e` runs `pnpm build`, `pnpm exec playwright install --with-deps chromium`, then `pnpm test:e2e`, then an `actions/upload-artifact` step with `if: failure()` uploading `playwright-report/`. Use the current major tags of each action as documented in its README at implementation time (Playwright's docs cite `actions/checkout@v6` and `actions/setup-node@v6`); do not invent commit SHAs. No Cloudflare step, no deploy, no secret. Run `pnpm format` afterwards so the file passes the Prettier check.
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: https://playwright.dev/docs/ci-intro`.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check .github/workflows/ci.yml; for j in lint check unit build e2e; do grep -qE "^  $j:" .github/workflows/ci.yml || { echo "FAIL: job $j missing"; exit 1; }; done; grep -q 'pull_request' .github/workflows/ci.yml; grep -q 'pnpm install --frozen-lockfile' .github/workflows/ci.yml; if grep -Eqi 'wrangler|CLOUDFLARE_' .github/workflows/ci.yml; then echo "FAIL: Cloudflare deploy reference in CI"; exit 1; fi`

### Task 8: UPDATE docs/development.md and docs/context/testing.md

- **ACTION**: Infrastructure/documentation task (delivers no AC-A item directly; it records what AC-A5 and AC-A2 verify). In `docs/development.md`: replace the line-3 state paragraph with one stating the project is scaffolded (Stage 2 Phase 1) and the commands are real; under Prerequisites replace "Node.js LTS, pnpm, Git." with a line naming the pins: `.node-version` (Node 24) and the `packageManager` field (pnpm 12.16.1, enabled with `corepack enable`), plus Git; rename the heading `## Planned commands` to `## Commands`; make the table list the real scripts (`pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm astro check`, `pnpm lint`, `pnpm format` and `pnpm format:check`, `pnpm test`, `pnpm test:e2e`, `pnpm build` and `pnpm preview`) and keep the Lighthouse row stating it arrives in Stage 2 Phase 7; add a short `## Continuous integration` paragraph naming the five CI jobs (`lint`, `check`, `unit`, `build`, `e2e`). Remove every `INFERRED - VALIDATE` marker from the file. In `docs/context/testing.md`, leave lines 1-47 byte-for-byte unchanged and rewrite only the `## Detected test suites` section: replace the "No automated test suites were detected" paragraph and the planned-suites paragraph with two subsections, `### Vitest (unit)` (command `pnpm test`, config `vitest.config.ts`, test files under `tests/unit/`) and `### Playwright (E2E and axe)` (command `pnpm test:e2e`, config `playwright.config.ts`, test files under `tests/e2e/`, prerequisite `pnpm exec playwright install --with-deps chromium`, served by `astro preview` after `pnpm build`), stating that both runners pass with no tests while the suites are still empty (test files are authored afterwards by the test pair). Keep the sentence about the planned visual, axe-matrix and Lighthouse tiers as "arriving in later Stage 2 phases". Do not touch `CLAUDE.md`.
- **MIRROR**: Patterns to Mirror anchor `# SOURCE: docs/development.md:13-22`.
- **VALIDATE**: `set -euo pipefail; grep -qF 'Node 24' docs/development.md; grep -qF '## Commands' docs/development.md; grep -qF '### Vitest (unit)' docs/context/testing.md; grep -qF '### Playwright (E2E and axe)' docs/context/testing.md; grep -qF 'pnpm exec playwright install --with-deps chromium' docs/context/testing.md; if grep -qE 'Planned commands|INFERRED - VALIDATE' docs/development.md; then echo "FAIL: stale planned wording in development.md"; exit 1; fi; if grep -qF 'No automated test suites were detected' docs/context/testing.md; then echo "FAIL: stale 'no suites' wording in testing.md"; exit 1; fi`

## Validation Commands

### Level 1 STATIC_ANALYSIS

```
set -euo pipefail
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm astro check
```

### Level 2 UNIT_TESTS

```
set -euo pipefail
pnpm test
if git status --porcelain -uall | grep -E '(^.. tests/|\.(test|spec)\.[cm]?[jt]sx?$)'; then
  echo "FAIL: test files present in the Implementer's diff"; exit 1
else
  echo "PASS: no test files in the diff"
fi
if git status --porcelain -uall | grep -E '^.. \.claude/'; then
  echo "FAIL: change under .claude/"; exit 1
else
  echo "PASS: nothing under .claude/"
fi
```

### Level 3 INTEGRATION

```
set -euo pipefail
pnpm build
test -f dist/index.html
grep -q '<html lang="en"' dist/index.html
grep -q '<main' dist/index.html
grep -q 'Fabio Barreto\.' dist/index.html
if grep -rEq --include='*.html' 'mailto:|tel:|<form' dist; then echo "FAIL: forbidden contact markup in dist HTML pages"; exit 1; fi
node -e 'const c=JSON.parse(require("fs").readFileSync("wrangler.jsonc","utf8")); if(c.assets.directory!=="./dist"||c.assets.not_found_handling!=="404-page"){process.exit(1)}'
pnpm test:e2e
```

## Acceptance Criteria

- **AC-A1 (PRD AC-1):** `pnpm build` exits 0 and `dist/index.html`, read without executing any script, is a complete document with `<html lang="en">`, one `<main>` and one `<h1>` reading "Fabio Barreto." (placeholder; the full section contract arrives in Phase 5).
- **AC-A2 (PRD AC-11):** `.github/workflows/ci.yml` runs on `pull_request` and on `push` to `main` with five separately reported jobs (`lint`, `check`, `unit`, `build`, `e2e`) and no Cloudflare deploy step or secret.
- **AC-A3 (PRD AC-11):** `wrangler.jsonc` declares Worker `site-pro` with `assets.directory` `./dist` and `not_found_handling` `404-page`, so Workers Builds can publish a preview per pull request once the owner connects it.
- **AC-A4 (PRD AC-1):** From a clean checkout `pnpm install --frozen-lockfile` succeeds against a committed lockfile with Node and pnpm pinned (`.node-version`, `packageManager`), and the worktree bootstrap scripts run that same install.
- **AC-A5 (PRD AC-11):** `pnpm lint`, `pnpm format:check`, `pnpm astro check`, `pnpm test` and `pnpm test:e2e` all exit 0 on the test-free tree, matching the checks CI reports.
- **AC-A6 (PRD AC-8):** The built `dist/` contains no `mailto:`, `tel:` or `<form` markup and no private data.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Node/pnpm mismatch between local, CI and Workers Builds (PRD risk "Flaky CI or deploy") | M | M | `.node-version`, `packageManager` and `engines` pinned; CI uses `corepack enable` and `node-version-file` |
| pnpm 12 ignores dependency build scripts (esbuild, sharp) and the build or tests then fail | M | M | Approve only the packages pnpm names, via its own workspace configuration; record in Notes |
| An ESLint plugin lacks peer support for the newest ESLint major, so the install conflicts | M | L | Choose the ESLint major that satisfies every plugin peer range; never force the install |
| `@astrojs/react` major or Vitest/Astro 6 pairing differs from the research assumptions | L | M | Let `pnpm add` resolve versions and confirm `pnpm build` and `pnpm astro check` pass; research flagged `@astrojs/react` v7 changes |
| Playwright starts the web server or fails when there are no tests | L | M | `--pass-with-no-tests`; Task 4 runs `playwright test --list` and the real `pnpm test:e2e` after a build |
| `.claude/settings.json` does not allow `pnpm` commands, so the Implementer is prompted (PRD open question) | M | L | Not changed by this phase; the owner decides |
| Workers Builds is not connected yet, so no preview exists for this phase | H | L | By design: only `wrangler.jsonc` is written; connecting it is an owner step before the PR |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- The PRD's Phase 1 scope lists "one smoke test each" for Vitest and Playwright. That is deliberately deferred to the test pair (see NOT Building); the runners are configured to pass on an empty suite instead (`test.passWithNoTests`, `--pass-with-no-tests`). `vitest.config.ts` and `playwright.config.ts` are runner configuration, not test files.
- Open question resolved here: pin Node 24 (`.node-version` = `24`; Astro 6 needs >= 22.12.0; v24.15.0 verified locally). Task 8 records it in docs/development.md.
- Follow-up outside this phase: CLAUDE.md "Essential commands" still says no `package.json` exists; update it through the docs-updater after the PR merges.
- Lighthouse CI and the size budget job are not in this workflow (Phase 7).
- R8b does not apply to description-mode plans; this plan is PRD mode, so every AC-A item carries its `(PRD AC-N)` token.

*Generated: 2026-11-05*
*Approved: 2026-11-05*
*Implemented: 2026-11-05*
*Status: IMPLEMENTED*
