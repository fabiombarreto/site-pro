# Feature: Quality gates (Phase 5 of stage-3-runtime)

```
**Decision Gate**
- Active context: none
- Activated criteria: cross-cutting patterns (quality gates: E2E coverage of the behavior rules, axe, layout invariance, budgets, Lighthouse, CI); impact on a shared public surface (the runtime's public TypeScript API documented in docs/api-reference.md for Stage 5); documentation of build business rules (B1-B28) and the test mapping; no new component, no scheduler change
- Decisions found:
  - Stage 3 PRD approved 2026-11-08 (docs/decisions.md): every behavior rule must be testable end to end, the rule to spec mapping lives in docs/context/testing.md, methodology stays test-after (`tdd: false`, `test_frameworks: [vitest, playwright]`)
  - D6 full build on every visit; D7 interactive dock and D8 agents are v1.1; the runtime runs only on `/`; only `sp-speed` is stored
  - Stage 3 Phase 4 decision (docs/decisions.md): the `Shift + Esc` status is unverified until the owner checks real Chrome on Windows
  - 2026-11-08 "Footer slot reserves its width and the speed button name contains its glyph": the speed button names carry the visible glyphs (`Build speed: 1×. Switch to 2×`); the PRD AC-13 example quotes the older `1x` wording
  - docs/context/architecture.md records that `pop` and `stagger` use an inset `clip-path`, while docs/04-animations.md still says "Scale from 0.9 to 1" (open owner item, not resolved by this phase)
  - Stage 2 gates are the base: nine CI jobs (`lint`, `check`, `unit`, `build`, `e2e`, `tokens`, `privacy`, `budgets`, `lighthouse`); Playwright screenshot baselines are not generated yet (docs/development.md) and stay advisory
- Applicable anti-patterns:
  - Weakening tests to get a green run (the Implementer authors no test and edits no existing test; every gap is closed by the test pair adding coverage, never by loosening a limit)
  - Scope creep into v1 (no palette, `?` list, scroll-spy, toasts, interactive dock, analytics; no `image-resolve`)
  - Raw values instead of tokens (`pnpm check:tokens` must stay green)
  - Publishing private data (docs added here carry no personal data; `pnpm check:privacy` must stay green)
  - Layout-shifting build animations and scroll hijacking (the gaps asserted by the test pair protect both)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - docs/ is the source of truth and is updated before code; relay artifacts live in `PRPs/`, nothing under `.claude/`
  - Budgets: runtime + effects <= 18 KB gzip, critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB, Lighthouse >= 0.95 in every category, CLS <= 0.01 (median of 3 runs)
  - Test pair authority: only `test-writer`/`test-reviewer` create or modify files under `tests/` (R-X is a blanket straight-fail on a test glob in the Implementer's diff)
  - The scheduler in `src/runtime/` stays stable through Stage 4; this phase changes no runtime behavior unless a gate fails and the owner is told
  - Deterministic clock: Playwright `page.clock` in E2E, a manual clock in Vitest, no test hook in production
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-3-runtime.prd.md` — Implementation Phases row 5: "Quality gates" — Goal: Every Stage 3 target is enforced in CI and visible on the preview. — Success signal: All 21 ACs pass in CI on the pull request; all nine CI jobs are green; the owner approves the rhythm on the preview.

## Summary

Phases 1 to 4 built the runtime and, with the test pair, a large E2E and unit suite. Phase 5 closes the stage. Under the methodology (`tdd: false`, test-after) the Implementer edits no file under `tests/`, so this plan covers only what is not a test: it (1) records in `docs/context/testing.md` the rule to spec mapping for the 18 behavior rules of docs/02, saying which ACs are already covered by specs that exist and which gaps remain, and names the four spec files the test pair will author to close those gaps; (2) documents the runtime's public TypeScript API in `docs/api-reference.md` for Stage 5; (3) documents how to run Lighthouse locally on Windows in `docs/development.md`; and (4) runs and records the size and privacy gates on the real build (and fixes production code only if a gate fails). The E2E coverage of the gaps (axe matrix at boot, mid-hero, mid-projects and done on both themes and both viewports; layout invariance against the no-JS page at both viewports; the mobile build layer and tall sections; the remaining behavior-rule gaps) is routed through the test pair (see Notes). The three open owner items (`Shift + Esc` on real Chrome for Windows, the speed button names, the `pop` description in docs/04) are left exactly as they are.

## User Story

As the owner finishing Stage 3
I want every behavior rule mapped to the spec that proves it, the runtime API documented and the gates measured
So that Stage 4 and Stage 5 build on an enforced, documented engine and the pull request shows which gates hold.

## Problem Statement

The PRD's exit criterion is "Every scenario in 02 · Behavior rules covered by an E2E test", recorded as a rule to spec mapping in `docs/context/testing.md`. That mapping does not exist, so nobody can tell which of the 18 rules and 21 ACs are proven and which are not. `docs/api-reference.md` still says the runtime's TypeScript API will be "documented here once Stage 3 implements it", though Stage 5's palette consumes it. `docs/development.md` says `pnpm lighthouse` needs `CHROME_PATH` but gives no Windows recipe, and nothing has recorded the measured gzip numbers after Phase 4.

## Solution Statement

Treat the existing suites as the baseline and be explicit about the delta. Map every rule to existing specs (taken from the APPROVED Phase 3 and Phase 4 manifests and a read of `tests/`), list the gaps, and prescribe the spec file names the test pair will author, so docs and tests agree. Document the public API from the source of truth (`src/runtime/api.ts`, `src/stores/build.ts`, `src/runtime/types.ts`, `src/runtime/compiler.ts`, `src/runtime/clock.ts`). Document the local Lighthouse recipe without making any validation depend on Chrome for lhci. Run the budget, token and privacy gates on a fresh build and record the numbers.

## Metadata

| Key | Value |
|-----|-------|
| Type | ENHANCEMENT (documentation and gate verification; no new runtime behavior) |
| Complexity | LOW to MEDIUM (the effort is accuracy of the coverage map; the test authoring happens in the test pair) |
| Systems Affected | docs/context/testing.md, docs/api-reference.md, docs/development.md; conditional production fix in src/, scripts/check-budgets.mjs, lighthouserc.json or .github/workflows/ci.yml only if a gate fails |
| Dependencies | Phases 1, 2, 3 and 4 (all complete); no new dependency |
| Estimated Tasks | 4 |
| Source PRD line ref | PRPs/prds/stage-3-runtime.prd.md:204 (row 5), :228-231 (Phase Details), :58-91 (ACs and rule coverage) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-3-runtime.prd.md` | 58-91, 228-231 | The 21 ACs, the rule to AC coverage line and Phase 5's scope |
| P0 | `docs/context/testing.md` | 49-79 | The file Task 1 amends; its "Quality gate scripts" format is the pattern |
| P0 | `docs/02-experience.md` | 289-310 | The 18 behavior rules, verbatim names for the mapping table |
| P0 | `src/runtime/api.ts` | 1-28 | `Controls`, `getControls`, `setControls` and the store re-exports to document |
| P0 | `src/stores/build.ts` | 1-11 | Store atoms and `BuildStatus` to document |
| P0 | `src/runtime/types.ts` | 1-70 | `EFFECTS`, `EffectName`, `SectionId`, `SectionState`, `BuildStep`, `TimelineStep`, `Timeline`, `BuildScript` |
| P0 | `src/runtime/compiler.ts` | whole file | `compileScript` and `serializeTimeline` signatures for the API docs |
| P0 | `src/runtime/clock.ts` | whole file | The `Clock` interface and the real and manual clocks |
| P1 | `docs/api-reference.md` | 24-44 | The file Task 2 amends; its section style is the pattern |
| P1 | `docs/development.md` | 11-33 | The file Task 3 amends |
| P1 | `scripts/check-budgets.mjs` | 8-14, 195-249 | The thresholds and the output lines Task 4 reads |
| P1 | `lighthouserc.json` | 1-35 | Thresholds that docs describe; unchanged by this phase |
| P1 | `PRPs/reports/stage-3-runtime/phase-3/test-suite.diff` | 14-42 | Phase 3 APPROVED AC to spec map (source of the Coverage map in Notes) |
| P1 | `PRPs/reports/stage-3-runtime/phase-4/test-suite.diff` | 14-37 | Phase 4 APPROVED AC to spec map and the test conventions in its notes |
| P2 | `.github/workflows/ci.yml` | 16-146 | The nine jobs the docs describe; read only |

## Patterns to Mirror

```
# SOURCE: docs/context/testing.md:72-79
### Quality gate scripts (CI)

Each gate is its own CI job and exits non-zero on a violation.

- `pnpm check:tokens` (CI job `tokens`, AC-9): no color or `box-shadow` literal in `src/` outside `src/styles/tokens.css` and `src/assets/`.
- `pnpm check:privacy` (CI job `privacy`, AC-8): privacy rules over `dist/`; run `pnpm build` first.
- `pnpm check:budgets` (CI job `budgets`, AC-10): gzip budgets over `dist/` (JS total 90 KB, JS before first paint 20 KB, runtime 18 KB, CSS 25 KB; the runtime is the JS only the home page loads, followed through its module imports); run `pnpm build` first.
- `pnpm lighthouse` (CI job `lighthouse`, AC-10): Lighthouse CI per `lighthouserc.json`, median of 3 runs on `/` and `/projects/relay/`, every category >= 0.95 and CLS <= 0.01. It needs `pnpm build` and Chrome; locally set `CHROME_PATH=$(node -p "require('@playwright/test').chromium.executablePath()")`.
```
Task 1 copies this style (a bold lead-in, one bullet per item, backticked commands and paths) for the new coverage section.

```
# SOURCE: docs/api-reference.md:38-40
### Controls API (Stage 3 Phase 4)

`Controls` from `src/runtime/api.ts`: `skip`, `runAll`, `setSpeed`, `cycleSpeed`, `replay`, `play`. `getControls()` returns `null` on pages without the runtime. The stores `currentSection`, `progress`, `status`, `speed` and `queue` are re-exported for Stage 5.
```
Task 2 copies this style (a `###` heading per surface, a one-paragraph description naming the source file and the exported names).

```
# SOURCE: docs/development.md:11-14
## Commands

| Task | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
```
Task 3 copies the table-then-prose style of this file.

```
# SOURCE: scripts/check-budgets.mjs:195-199
  if (jsTotal > JS_TOTAL_KB) {
    problems.push(
      `JS total ${jsTotal.toFixed(1)} KB exceeds ${JS_TOTAL_KB} KB`,
    );
  }
```
Task 4 reads the output this code produces (`JS total X / 90 KB gzip` lines, from `main()` at lines 232-248) and, only if a threshold fails, mirrors this pattern for any fix.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `docs/context/testing.md` | UPDATE | Rule to spec mapping for the 18 behavior rules (PRD requirement), the named gap specs, test conventions for animated pages, the dated measured sizes, the advisory screenshot statement |
| `docs/api-reference.md` | UPDATE | Replace the "documented once Stage 3 implements it" placeholder with the runtime's public TypeScript API |
| `docs/development.md` | UPDATE | Local Lighthouse recipe for Windows and bash, and how a Stage 3 E2E run works on this repo |
| `src/**`, `scripts/check-budgets.mjs`, `lighthouserc.json`, `.github/workflows/ci.yml` | UPDATE (conditional) | Only if Task 4 finds a failing gate (size, tokens, privacy, build); minimal fix, reported to the owner. No change is expected |

## NOT Building (Scope Limits)

- Any file under `tests/`: creating, editing or deleting a spec is the test pair's job (R-X). The four gap specs named in Notes are authored there, not here.
- `image-resolve`, the photo to ASCII script, real assets and per-section tuning (Stage 4).
- The Command Palette, `⌘K`, `?`, scroll-spy, view transitions, `open("slug");`, the `ENOENT` window, toasts, easter eggs (Stage 5); analytics (Stage 6); the interactive dock and agents (v1.1).
- Playwright screenshot baselines: they must be generated in CI's Linux environment and gating versus advisory is still an open PRD question; they stay a follow-up (docs/development.md).
- Resolving the three open owner items: the `Shift + Esc` check on real Chrome for Windows, the speed button name wording (docs/decisions.md 2026-11-08), and the `pop` inset `clip-path` versus the 0.9 to 1 scale in docs/04-animations.md. This phase documents them as open and edits none of their texts.
- The owner's rhythm review on the preview against prototype v2 (a manual step) and relaxing any threshold (budgets, Lighthouse 0.95, CLS 0.01).
- Any change to the Stage 2 layout, content, section ids, labels or heading structure.

## Step-by-Step Tasks

### Task 1: UPDATE docs/context/testing.md

- **ACTION**: Delivers AC-A1, AC-A2 and part of AC-A3. Make four edits.
  1. Replace the two sentences at lines 69-70 ("The axe matrix runs inside `pnpm test:e2e` (the `e2e` CI job). Screenshot baselines are not part of Stage 2 yet.") with: "The axe matrix (the boot, mid-hero, mid-projects and done moments, in both themes, at 1280x800 and 375x812) runs inside `pnpm test:e2e` (the `e2e` CI job). Screenshot baselines of build states are advisory and not generated yet: they must be created in CI's Linux environment (docs/development.md) and are not a gate."
  2. After the "Quality gate scripts (CI)" bullets, append a line to the `pnpm lighthouse` bullet: "Local Windows recipe: docs/development.md."
  3. Append a new section `## Behavior rule coverage (Stage 3)` (after "Quality gate scripts (CI)"). Intro: one paragraph saying the 18 rules of docs/02-experience.md "Behavior rules" map to PRD ACs and specs as below, and that the rows in the last column are specs authored by the test pair in Stage 3 Phase 5. Then a table with the header `| Rule | ACs | Covered by | Gap closed by |` and exactly one row per rule, with the rule name in bold in the first cell, in this order and spelling: `**Trigger**`, `**Scroll hint**`, `**Order**`, `**Reserved space**`, `**The final layout never moves**`, `**Fast scrolling (turbo)**`, `**Never hijack scrolling**`, `**Skip**`, `**Run all**`, `**Deep links**`, `**Keyboard focus**`, `**Scrolling up**`, `**Immediate interaction**`, `**Resize during a build**`, `**Revisits**`, `**Reduced motion**`, `**No JavaScript**`, `**Background tab**`. Row content is transcribed from the "Coverage map" table in `## Notes` of this plan, with file paths only (no line numbers, they rot); use `-` in "Gap closed by" when the rule has no gap. After the table, add `### Other acceptance criteria` with one bullet each for AC-1, AC-17, AC-18, AC-19, AC-20 and AC-21 from the same Coverage map, and a one-line statement that the Stage 2 spec `tests/e2e/home-no-build-layer.spec.ts` was rewritten in Phase 4 (not weakened). The four planned spec files are `tests/e2e/behavior-gaps.spec.ts`, `tests/e2e/layout-invariance.spec.ts`, `tests/e2e/axe-build-matrix.spec.ts` and `tests/e2e/mobile-build.spec.ts`; each must appear by its exact path in the "Gap closed by" column or the bullets.
  4. Append `### Test conventions for animated pages` with bullets: always `pnpm build` before `pnpm test:e2e`; locally Playwright reuses an `astro preview` already serving `dist/` on 127.0.0.1:4321 (`reuseExistingServer`), so rebuild instead of restarting it; Playwright's `page.clock` is installed before navigation and time is advanced with `runFor`; under the fake clock click page controls with `element.click()` inside `page.evaluate` because `locator.click()` waits for animation frames; progress is rounded to 1 % and sampled moments carry about 52 ms late and 16 ms early error, and effects have a 150 ms selection phase before a target goes live, so never sample on a phase boundary; `@axe-core/playwright` needs `browser.newContext()` before `newPage()`; the dock is hidden while the boot terminal is on screen, so wait for it to be visible before checking a dock control.
  The measured-size line is added in Task 4. Leave every other line unchanged.
- **MIRROR**: `# SOURCE: docs/context/testing.md:72-79`
- **VALIDATE**: `set -euo pipefail; node --input-type=module - <<'EOF'
import { existsSync, readFileSync } from 'node:fs';
const fail = [];
const testing = readFileSync('docs/context/testing.md', 'utf8');
const rules = ['Trigger','Scroll hint','Order','Reserved space','The final layout never moves','Fast scrolling (turbo)','Never hijack scrolling','Skip','Run all','Deep links','Keyboard focus','Scrolling up','Immediate interaction','Resize during a build','Revisits','Reduced motion','No JavaScript','Background tab'];
for (const r of rules) {
  if (!testing.includes(`| **${r}** |`)) fail.push(`no table row for rule ${r}`);
}
const planned = ['tests/e2e/behavior-gaps.spec.ts','tests/e2e/layout-invariance.spec.ts','tests/e2e/axe-build-matrix.spec.ts','tests/e2e/mobile-build.spec.ts'];
for (const p of planned) {
  if (!testing.includes(p)) fail.push(`planned spec not named: ${p}`);
}
for (const p of new Set(testing.match(/tests\/(?:e2e|unit)\/[A-Za-z0-9_.\/-]+\.ts/g) ?? [])) {
  if (!planned.includes(p) && !existsSync(p)) fail.push(`names a file that does not exist: ${p}`);
}
if (testing.includes('Screenshot baselines are not part of Stage 2 yet.')) fail.push('old screenshot sentence still present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('PASS: 18 rule rows, planned specs named, every other spec path exists');
EOF`

### Task 2: UPDATE docs/api-reference.md

- **ACTION**: Delivers AC-A4. Replace line 36 ("The runtime's internal TypeScript API (program, scheduler, effects registry, stores) is designed in docs/06-architecture.md and documented here once Stage 3 implements it.") with a short pointer sentence, and add a new section `### Runtime TypeScript API (Stage 3)` after the "Build data contract (Stage 3 Phase 1)" section. Read `src/runtime/api.ts`, `src/stores/build.ts`, `src/runtime/types.ts`, `src/runtime/compiler.ts`, `src/runtime/clock.ts` and `src/runtime/effect-timing.ts` first and document only what they export, with the exact names and signatures:
  - the `Controls` interface (`skip`, `runAll`, `setSpeed(speed: Speed)`, `cycleSpeed`, `replay`, `play`), `getControls(): Controls | null` (null on pages without the runtime) and `setControls(next: Controls | null)` (set by the runtime entry; Stage 5 consumes `getControls`);
  - a stores table (`currentSection`, `progress`, `status`, `speed`, `queue`) with the value type of each atom and the `BuildStatus` values;
  - the types a build script author and the Stage 5 palette use (`EFFECTS` and `EffectName`, `SectionId`, `SectionState` with its eight states, `BuildStep`, `TimelineStep`, `Timeline`, `BuildScript`) and where each lives;
  - the compiler (`compileScript`, `serializeTimeline`): input a step sequence with call, target, effect and optional gap or overlap, output an absolute 1x timeline in ms; an unknown effect or a target missing from the section fails `pnpm build`, naming the section and the step (`scripts/verify-build-targets.mjs` runs from `astro.config.mjs`);
  - the `Clock` interface (`now`, `onFrame`) with the real and manual implementations, and that E2E uses Playwright's `page.clock` with no production hook;
  - one sentence that `src/runtime/main.ts` is a side-effect entry with no exports, loaded only by `src/pages/index.astro`.
  Add a closing sentence that Stage 4 changes build scripts and effects data only, and that scheduler changes need a record in docs/decisions.md. Do not edit the "Visitor controls (runtime surface)" table, the "Controls API" section or the "Build data contract" section.
- **MIRROR**: `# SOURCE: docs/api-reference.md:38-40`
- **VALIDATE**: `set -euo pipefail; node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';
const api = readFileSync('docs/api-reference.md', 'utf8');
const fail = [];
const exported = (file) =>
  [...readFileSync(file, 'utf8').matchAll(/export\s+(?:interface|function|const|type)\s+(\w+)/g)].map((m) => m[1]);
for (const file of ['src/runtime/api.ts', 'src/stores/build.ts', 'src/runtime/types.ts']) {
  for (const name of exported(file)) {
    if (!api.includes(name)) fail.push(`${file} exports ${name}, not in docs/api-reference.md`);
  }
}
for (const name of ['compileScript', 'serializeTimeline', 'Clock', 'getControls', 'setControls']) {
  if (!api.includes(name)) fail.push(`docs/api-reference.md does not mention ${name}`);
}
for (const file of ['src/runtime/compiler.ts', 'src/runtime/clock.ts']) {
  const names = ['compileScript', 'serializeTimeline', 'Clock'];
  const src = readFileSync(file, 'utf8');
  for (const n of names) {
    if (src.includes(`export function ${n}`) || src.includes(`export interface ${n}`) || src.includes(`export type ${n}`)) {
      if (!api.includes(n)) fail.push(`${file} exports ${n}`);
    }
  }
}
if (api.includes('documented here once Stage 3 implements it')) fail.push('placeholder sentence still present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('PASS: every export of api.ts, build.ts and types.ts is documented');
EOF`

### Task 3: UPDATE docs/development.md

- **ACTION**: Delivers AC-A3. Under `## Commands`, after the sentence about `scripts/verify-build-targets.mjs` (line 27), add a `### Running Lighthouse locally` subsection stating: Lighthouse CI needs `pnpm build` and a Chrome binary; the CI job points `CHROME_PATH` at Playwright's Chromium. Give both forms. In PowerShell: `pnpm build`, then `$env:CHROME_PATH = (node -p "require('@playwright/test').chromium.executablePath()")`, then `pnpm lighthouse`. In bash: `export CHROME_PATH="$(node -p "require('@playwright/test').chromium.executablePath()")"` then `pnpm lighthouse`. Add: if that path does not exist, run `pnpm exec playwright install chromium` first; if lhci still cannot start Chrome (for example "No Chrome installations found" on Windows), the CI `lighthouse` job is authoritative and the pull request records that Lighthouse was not run locally; Lighthouse covers `/` with the build running (the real runtime on the real clock) and `/projects/relay/`, median of 3 runs, every category >= 0.95 and CLS <= 0.01 (`lighthouserc.json`). Also add a short subsection `### Running the E2E suite` that points to docs/context/testing.md "Test conventions for animated pages". Leave every other line unchanged.
- **MIRROR**: `# SOURCE: docs/development.md:11-14`
- **VALIDATE**: `set -euo pipefail; node -e "const p=require('@playwright/test').chromium.executablePath(); if(!require('fs').existsSync(p)){console.error('FAIL: Playwright Chromium not found at '+p+' (pnpm exec playwright install chromium)'); process.exit(1)}"; node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';
const dev = readFileSync('docs/development.md', 'utf8');
const need = [
  '### Running Lighthouse locally',
  `$env:CHROME_PATH = (node -p "require('@playwright/test').chromium.executablePath()")`,
  `export CHROME_PATH="$(node -p "require('@playwright/test').chromium.executablePath()")"`,
  'pnpm lighthouse',
  '### Running the E2E suite',
];
const fail = need.filter((s) => !dev.includes(s)).map((s) => `docs/development.md lacks: ${s}`);
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('PASS: local Lighthouse recipe and E2E pointer present, and the recipe path exists');
EOF`

### Task 4: VERIFY the gates on a fresh build and record the sizes

- **ACTION**: Delivers AC-A3, AC-A5 and AC-A6. Run `pnpm build`, then `pnpm check:budgets`, `pnpm check:tokens` and `pnpm check:privacy` in the worktree. Never stop or require free the `astro preview` already serving `dist/` on 127.0.0.1:4321. Copy the four numbers `pnpm check:budgets` prints (lines of the form `JS total X / 90 KB gzip`, `JS runtime X / 18 KB gzip`, `JS critical X / 20 KB gzip`, `CSS total X / 25 KB gzip`) into `docs/context/testing.md`, as one sentence appended to the `pnpm check:budgets` bullet in the form "Measured on <YYYY-MM-DD> (Stage 3 Phase 5): JS total <X> KB, runtime <X> KB, critical <X> KB, CSS <X> KB gzip." using today's date and the printed values. If any gate fails, do not relax a threshold: make the smallest production fix that removes the cause, add a "Decisions" entry to docs/decisions.md only if behavior changes, and list the fix in the completion report. Do not run `pnpm format`; format only the three changed docs with `pnpm exec prettier --write docs/context/testing.md docs/api-reference.md docs/development.md`. Do not touch the three open owner items: the `pop` row of docs/04-animations.md, the `Shift + Esc` sentence of docs/02-experience.md and docs/decisions.md, and the speed button names.
- **MIRROR**: `# SOURCE: scripts/check-budgets.mjs:195-199`
- **VALIDATE**: `set -euo pipefail; pnpm build; pnpm check:budgets; pnpm check:tokens; pnpm check:privacy; node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';
const fail = [];
const testing = readFileSync('docs/context/testing.md', 'utf8');
if (!/Measured on \d{4}-\d{2}-\d{2} \(Stage 3 Phase 5\):/.test(testing)) fail.push('testing.md has no dated measured-size sentence');
const open = [
  ['docs/04-animations.md', 'Scale from 0.9 to 1 with a slight overshoot'],
  ['docs/02-experience.md', 'the real-browser check is pending the owner'],
  ['docs/02-experience.md', 'Build speed: ∞ (instant). Switch to 1×'],
  ['docs/decisions.md', 'The `Shift + Esc` status is unverified until the owner checks real Chrome on Windows'],
];
for (const [file, text] of open) {
  if (!readFileSync(file, 'utf8').includes(text)) fail.push(`${file} no longer contains the open owner item: ${text}`);
}
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('PASS: sizes recorded, open owner items untouched');
EOF`

## Validation Commands

Run from the worktree root. Level 3 uses its own `preview()` on port 4399 and never touches 127.0.0.1:4321.

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm exec prettier --check docs/context/testing.md docs/api-reference.md docs/development.md
pnpm check:tokens
pnpm lint
pnpm check
```

### Level 2: CONTENT_INVARIANTS

```bash
set -euo pipefail
node --input-type=module - <<'EOF'
import { existsSync, readFileSync } from 'node:fs';
const fail = [];
const read = (p) => readFileSync(p, 'utf8');
const testing = read('docs/context/testing.md');
const api = read('docs/api-reference.md');
const dev = read('docs/development.md');

const rules = ['Trigger','Scroll hint','Order','Reserved space','The final layout never moves','Fast scrolling (turbo)','Never hijack scrolling','Skip','Run all','Deep links','Keyboard focus','Scrolling up','Immediate interaction','Resize during a build','Revisits','Reduced motion','No JavaScript','Background tab'];
for (const r of rules) {
  if (!testing.includes(`| **${r}** |`)) fail.push(`testing.md has no row for rule ${r}`);
}
const planned = ['tests/e2e/behavior-gaps.spec.ts','tests/e2e/layout-invariance.spec.ts','tests/e2e/axe-build-matrix.spec.ts','tests/e2e/mobile-build.spec.ts'];
for (const p of planned) {
  if (!testing.includes(p)) fail.push(`testing.md does not name ${p}`);
}
for (const p of new Set(testing.match(/tests\/(?:e2e|unit)\/[A-Za-z0-9_.\/-]+\.ts/g) ?? [])) {
  if (!planned.includes(p) && !existsSync(p)) fail.push(`testing.md names a missing file ${p}`);
}
for (const file of ['src/runtime/api.ts', 'src/stores/build.ts', 'src/runtime/types.ts']) {
  for (const m of read(file).matchAll(/export\s+(?:interface|function|const|type)\s+(\w+)/g)) {
    if (!api.includes(m[1])) fail.push(`${file} exports ${m[1]}, missing from api-reference.md`);
  }
}
if (!dev.includes('### Running Lighthouse locally')) fail.push('development.md lacks the Lighthouse recipe');
if (!/Measured on \d{4}-\d{2}-\d{2} \(Stage 3 Phase 5\):/.test(testing)) fail.push('no dated measured sizes');
for (const [file, text] of [
  ['docs/04-animations.md', 'Scale from 0.9 to 1 with a slight overshoot'],
  ['docs/02-experience.md', 'the real-browser check is pending the owner'],
  ['docs/02-experience.md', 'Build speed: ∞ (instant). Switch to 1×'],
  ['docs/decisions.md', 'The `Shift + Esc` status is unverified until the owner checks real Chrome on Windows'],
]) {
  if (!read(file).includes(text)) fail.push(`open owner item changed in ${file}: ${text}`);
}
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('PASS: content invariants hold');
EOF
```

### Level 3: INTEGRATION

```bash
set -euo pipefail
pnpm build
pnpm check:budgets
pnpm check:privacy
pnpm test
pnpm test:e2e
node --input-type=module - <<'EOF'
import { preview } from 'astro';
import { chromium } from '@playwright/test';
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: 4399 } });
const browser = await chromium.launch();
let problem = null;
try {
  const page = await (await browser.newContext()).newPage();
  await page.clock.install();
  await page.goto('http://127.0.0.1:4399/');
  await page.clock.runFor(6000);
  const state = await page.evaluate(() => ({
    status: document.documentElement.getAttribute('data-build-status'),
    dock: document.querySelector('.sp-dock')?.textContent ?? '',
  }));
  if (state.status !== 'idle') problem = `data-build-status is ${state.status} after the hero (docs/api-reference.md lists idle)`;
  else if (!state.dock.includes('1/5')) problem = `dock text lacks 1/5 sections: ${state.dock}`;
} finally {
  await browser.close();
  await server.stop();
}
if (problem) { console.error('FAIL: ' + problem); process.exit(1); }
console.log('PASS: the real build reaches the idle dock after the hero on the fake clock');
EOF
```

Lighthouse is not part of any Level: run it locally with the recipe from Task 3 if Chrome is available; otherwise the CI `lighthouse` job decides.

## Acceptance Criteria

- **AC-A1 (PRD AC-2, AC-3, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16):** `docs/context/testing.md` has one row per behavior rule of docs/02-experience.md (18 rows, rule names verbatim), each naming the existing spec files that cover it and, where the Coverage map shows a gap, the planned spec that closes it.
- **AC-A2 (PRD AC-4, AC-18, AC-21):** `docs/context/testing.md` names the four planned specs (`tests/e2e/behavior-gaps.spec.ts`, `tests/e2e/layout-invariance.spec.ts`, `tests/e2e/axe-build-matrix.spec.ts`, `tests/e2e/mobile-build.spec.ts`), records the axe matrix cells still missing, and records the test conventions for animated pages; every other `tests/` path it names exists.
- **AC-A3 (PRD AC-19):** `pnpm check:budgets` exits 0 on a fresh build with the measured sizes recorded and dated in `docs/context/testing.md`; `docs/development.md` documents running Lighthouse locally on Windows and bash with its fallback; `lighthouserc.json` thresholds are unchanged.
- **AC-A4 (PRD AC-19, AC-20):** `docs/api-reference.md` documents the runtime's public TypeScript API: every export of `src/runtime/api.ts`, `src/stores/build.ts` and `src/runtime/types.ts`, the compiler (including that a bad effect or target fails `pnpm build` naming the section and step) and the `Clock`.
- **AC-A5 (PRD AC-8, AC-13):** The open owner items are not closed: the `Shift + Esc` real-Chrome statement, the speed button names with their glyphs and the `pop` row of docs/04-animations.md are exactly as before.
- **AC-A6 (PRD AC-18, AC-19):** The Stage 3 gates stay green on the final tree: `pnpm lint`, `pnpm check`, `pnpm check:tokens`, `pnpm check:privacy`, `pnpm check:budgets`, `pnpm test` and `pnpm test:e2e`.

R8b note: every bullet above carries a `(PRD AC-N)` token because this is PRD mode.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lighthouse Performance < 0.95 on `/` because LCP only counts once the hero headline is visible (opacity 0 is ignored by Chromium) | M | H | Not run in any Level; measure with Task 3's recipe or read the CI job; if it falls short, the numbers go to the owner and no threshold is relaxed (PRD Open Questions) |
| The coverage map in testing.md goes stale or names specs the test pair writes under other names | M | M | Task 1's Level 2 check verifies every existing path and pins the four planned names; if the test pair uses other names its manifest records them and the mapping is reconciled at docs-update |
| A gate fails on the final tree (size over budget, a token literal, privacy) | L | H | Task 4 runs them first; fix minimally, never relax a limit, report to the owner |
| Flaky E2E from the gap specs the test pair adds (animated page) | M | M | Notes carry the sampling-error rules (52 ms late, 16 ms early, 150 ms selection phase) and the conventions go into testing.md |
| The Level 3 smoke or `pnpm test:e2e` collides with the preview already on 127.0.0.1:4321 | L | L | Level 3 uses its own preview on 4399; Playwright reuses 4321 locally; never stop that process |
| `pnpm lighthouse` cannot find Chrome on Windows | M | L | It is outside every Level; Task 3 documents the fallback (CI is authoritative) |

## Notes

**TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

**Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.

**What the test pair must write (the gaps, for E2E and unit coverage of PRD AC-1 to AC-21).** Phases 1 to 4 already cover most of the PRD; the test pair targets only the gaps below, in four new Playwright specs named in docs/context/testing.md (plus support helpers, reusing `tests/e2e/support/effects.ts` `boxes`, `expectSameBoxes`, `layoutShift`, `mainTree`, `mainText`, `noScriptPage`, `heroFrame` and `controls.ts` helpers). Existing specs are not rewritten; the Stage 2 spec `tests/e2e/home-no-build-layer.spec.ts` was already rewritten, not weakened, in Phase 4.

- `tests/e2e/behavior-gaps.spec.ts`: (AC-1) before the runtime starts the hero is pending (opacity 0, laid out, in the accessibility tree), the hero is final with its window gone and `✔ Hero Section created. (<t>s)` by 3.2 s on `page.clock`, then the idle dock; (AC-2) About starts exactly when its top crosses 75 % of the viewport and not before, a second section never opens a window over a built one after scrolling up and down again, and no built element animates again; (AC-4) pending outlines are dashed and labeled with the file name; (AC-11) with the Projects window open and the relay card created, clicking the relay card's title navigates to `/projects/relay`; (AC-15) with the runtime request aborted everything is revealed within 3 s of clock time (an explicit bound, not 4.5 s total).
- `tests/e2e/layout-invariance.spec.ts`: (AC-4) boxes of every section, heading, paragraph, button, project card and stack group plus the document height are recorded with JavaScript disabled, then compared (±0.5 px) at the boot, mid-hero, mid-projects (two cards overlapping) and after the build, at 1280x800 AND 375x812; summed layout shift <= 0.01 at both.
- `tests/e2e/axe-build-matrix.spec.ts`: (AC-18) `@axe-core/playwright` with WCAG 2.0, 2.1 and 2.2 A and AA tags at four clock moments (boot, mid-hero, mid-projects, done at 1x) x Midnight and Daylight x 1280x800 and 375x812 (16 cells); the 4 cells covered today are mid-hero and mid-projects on desktop in `effects-axe.spec.ts`, so the other 12 are new; the text and accessibility tree of `<main>` equal the no-JS page at the mobile moments too.
- `tests/e2e/mobile-build.spec.ts`: (AC-21, AC-7) at 375x812 a tap on the compact window bar skips the section, the dock shows only the status and `» Skip`, and the speed button is not shown; at 1280x800 and 375x812 a section taller than the viewport keeps its title bar and command bar stuck under the nav until the section's end.

**Coverage map: which of the 18 rules and which ACs are covered today** (from the APPROVED Phase 3 and Phase 4 manifests, which are in `PRPs/reports/stage-3-runtime/phase-3/test-suite.diff` and `phase-4/test-suite.diff`, and a read of `tests/`; paths relative to the worktree). Task 1 transcribes this into docs/context/testing.md.

| Rule | ACs | Covered by (existing) | Gap closed by (this phase) |
|------|-----|-----------------------|----------------------------|
| Trigger | AC-2 | `tests/e2e/runtime-build-order.spec.ts` (About stays pending after 30 s without scrolling), `tests/unit/runtime-scheduler.test.ts` | `tests/e2e/behavior-gaps.spec.ts` (the 75 % boundary and the `renderAbout();` window) |
| Scroll hint | AC-3 | `tests/e2e/controls-done-replay.spec.ts`, `tests/e2e/controls-speed.spec.ts` (reduced motion never pulses), `tests/unit/runtime-controls-timing.test.ts` | - |
| Order | AC-2, AC-5 | `tests/e2e/runtime-build-order.spec.ts` (order and at most one window), `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/unit/runtime-scheduler.test.ts` | - |
| Reserved space | AC-4 | `tests/e2e/runtime-fallbacks.spec.ts` (pending content stays laid out and in the tree), `tests/e2e/build-layer-show.spec.ts` (outline file names, not in the tree), `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/e2e/controls-done-replay.spec.ts` (footer slot) | `tests/e2e/behavior-gaps.spec.ts` (dashed style, hero at first paint) |
| The final layout never moves | AC-4 | `tests/e2e/build-layer-layout.spec.ts`, `tests/e2e/effects-layout.spec.ts`, `tests/e2e/runtime-build-order.spec.ts` (all at 1280x800), `tests/e2e/effects-layout.spec.ts` (no horizontal scroll at 375x812) | `tests/e2e/layout-invariance.spec.ts` (against the no-JS page, at 375x812, at the done moment) |
| Fast scrolling (turbo) | AC-5 | `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/unit/runtime-scheduler-controls.test.ts` | - |
| Never hijack scrolling | AC-6 | `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/e2e/controls-done-replay.spec.ts`, `tests/e2e/controls-speed.spec.ts` | - |
| Skip | AC-7, AC-21 | `tests/e2e/controls-skip.spec.ts` (Esc, dock button, bars, body, the open menu), `tests/unit/runtime-scheduler-controls.test.ts` | `tests/e2e/mobile-build.spec.ts` (tap on the compact bar) |
| Run all | AC-8 | `tests/e2e/controls-skip.spec.ts`, `tests/unit/runtime-scheduler-controls.test.ts` | - |
| Deep links | AC-9 | `tests/e2e/controls-turbo-navigation.spec.ts` (`#projects`, `#about`, `#contact`, nav Stack link) | - |
| Keyboard focus | AC-10 | `tests/e2e/controls-focus-resize.spec.ts`, `tests/unit/runtime-scheduler-controls.test.ts` | - |
| Scrolling up | AC-2 | `tests/unit/runtime-scheduler.test.ts` only (never replays a built section) | `tests/e2e/behavior-gaps.spec.ts` |
| Immediate interaction | AC-11 | `tests/e2e/effects-pointer.spec.ts` (hit tests, pointer events), `tests/e2e/build-layer-show.spec.ts` (window body ignores the pointer) | `tests/e2e/behavior-gaps.spec.ts` (real click navigates to `/projects/relay`) |
| Resize during a build | AC-12 | `tests/e2e/controls-focus-resize.spec.ts`, `tests/e2e/build-layer-layout.spec.ts`, `tests/unit/runtime-controls-timing.test.ts` | - |
| Revisits | AC-13 | `tests/e2e/runtime-fallbacks.spec.ts` (saved speed still builds), `tests/e2e/controls-speed.spec.ts` | - |
| Reduced motion | AC-14 | `tests/e2e/controls-speed.spec.ts`, `tests/e2e/runtime-fallbacks.spec.ts`, `tests/e2e/build-layer-absent.spec.ts`, `tests/e2e/effects-absent.spec.ts` | - |
| No JavaScript | AC-15 | `tests/e2e/runtime-fallbacks.spec.ts` (no JS, aborted runtime, throwing runtime), `tests/e2e/build-layer-absent.spec.ts`, `tests/e2e/effects-absent.spec.ts`, `tests/unit/runtime-mode-clock.test.ts` (watchdog 3 s) | `tests/e2e/behavior-gaps.spec.ts` (explicit 3 s bound) |
| Background tab | AC-16 | `tests/e2e/runtime-build-order.spec.ts`, `tests/unit/runtime-scheduler.test.ts`, `tests/unit/runtime-scheduler-tick.test.ts` | - |

Other ACs: **AC-1** is covered by `tests/e2e/effects-scripts.spec.ts`, `tests/e2e/effects-hero.spec.ts`, `tests/e2e/build-layer-show.spec.ts` and `tests/unit/runtime-pacing.test.ts` (order, 2.0 s headline, compiled duration <= 3200, idle dock); the first-paint pending state and the clock-measured 3.2 s remain gaps (behavior-gaps). **AC-17** is covered by `tests/e2e/controls-done-replay.spec.ts` and `tests/e2e/controls-speed.spec.ts`. **AC-18** is covered by `tests/e2e/controls-dock-a11y.spec.ts` (dock buttons and names), `tests/e2e/effects-layout.spec.ts` (tree equal at six hero moments, mid-projects and mid-stack, desktop), `tests/e2e/effects-axe.spec.ts` (mid-hero and mid-projects, desktop, both themes) and `tests/e2e/home-axe.spec.ts` (ready dock, both themes, three viewports); the missing axe cells and the mobile moments are `axe-build-matrix`. **AC-19** is covered by `tests/unit/runtime-budget.test.ts`, `tests/unit/quality-gates.test.ts` (Lighthouse config), `tests/e2e/quality-gates.spec.ts` and `tests/e2e/css-budget.spec.ts`; the Lighthouse medians are the CI `lighthouse` job only. **AC-20** is covered by `tests/unit/runtime-compiler.test.ts`, `tests/unit/runtime-pacing.test.ts`, `tests/unit/verify-build-targets.test.ts` and `tests/e2e/runtime-timeline-contract.spec.ts`. **AC-21** is partly covered by `tests/e2e/build-layer-layout.spec.ts` (compact bar, dock 343 px wide with a 16 px inset at 375x812); the mobile tap and tall-section sticky bars remain gaps (mobile-build).

**Sampling rules for the test pair (from Phases 3 and 4).** Progress is rounded to 1 % (31 ms of the 3100 ms hero); with 20 ms slices a sampled moment is up to about 52 ms late and about 16 ms early; effects have a 150 ms selection phase before a target goes live, so never sample on a boundary. Click page controls with `element.click()` inside `page.evaluate` under the fake clock. axe needs `browser.newContext()` before `newPage()`; the dock is hidden while the boot terminal is on screen.

**Open owner items kept open (not closed by this phase).** (1) `Shift + Esc` on real Chrome for Windows: Chrome lists it as Task Manager; the E2E tests prove only the handler (docs/02, docs/decisions.md). (2) The speed button names now carry the visible glyphs (docs/decisions.md 2026-11-08); the PRD AC-13 example quotes `Build speed: 1x. Switch to 2x`, and the tests follow the source strings. (3) `pop` and `stagger` use an inset `clip-path`, while docs/04-animations.md line 129 still says "Scale from 0.9 to 1" and docs/04 line 116 says the window "scales up from 0.96" (not checked against code). Also open: whether Playwright screenshot baselines gate CI (PRD Open Questions) and the owner's rhythm review against prototype v2.

**Divergences and facts to keep.** `pnpm lighthouse` is `lhci autorun` using `lighthouserc.json` (`staticDistDir ./dist`, 3 runs, `http://localhost/` and `http://localhost/projects/relay/`); CI sets `CHROME_PATH` from Playwright's Chromium. Web research was unverified (search summaries only): lhci reads `CHROME_PATH` and a "No Chrome installations found" error on Windows is resolved by setting it. docs/domain/areas/build.md lists B1-B28 (the PRD text says B1-B24).

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
