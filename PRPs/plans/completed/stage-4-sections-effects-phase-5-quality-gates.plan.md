# Feature: Quality gates (Phase 5 of stage-4-sections-effects)

```
**Decision Gate**
- Active context: none
- Activated criteria: cross-cutting patterns (CI gates, budgets, Lighthouse, the frozen src/runtime/ boundary); architectural decisions (a scheduler diff check, an LCP assertion); documentation of procedures (asset swap, test mapping, owner review hand-off); business rules for build (B21 budgets, B4/B5 timing), content (C18 asset swap, no image metadata) and visual-design (V5, V6, V7 rhythm tuning items); impact on CI (nine jobs) and on the test guardrail docs
- Decisions found:
  - Stage 4 PRD approved (2026-11-10): budgets measured at the `✔ <Section> Section created.` line; cards about 300-350 ms with a 120 ms overlap; scheduler files frozen (scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts, api.ts) except bug fixes recorded in docs/decisions.md; no threshold is relaxed when LCP or Performance fall short (numbers go to the owner)
  - Real photo and covers are a content-only swap, re-checked by CI; placeholders ship in Stage 4
  - Stage 3 Phase 5 set the nine-job CI (lint, check, unit, build, e2e, tokens, privacy, budgets, lighthouse) and the gate-script pattern (pure exported function + thin main)
  - D12 ASCII to real photo; D8 one element at a time (cards overlap briefly); owner approves the rhythm on the preview
  - Docs first: docs/context/testing.md and docs/development.md are updated with the code
- Applicable anti-patterns:
  - Weakening tests to get green (the implementer never edits tests; the test pair does)
  - Cosmetic validation gates that cannot fail
  - Relaxing a budget or Lighthouse threshold to pass
  - Publishing private data (image metadata such as GPS) in the repository or the site
  - Writing pipeline artifacts outside PRPs/ or under the editor-config folder
  - Claiming a human approval (the rhythm review) that has not happened
- Applicable architectural rules:
  - src/runtime/ boundary: the nine frozen files stay byte-identical to b4271cb (PRD AC-14)
  - Budgets: runtime + effects <= 18 KB gzip, critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB; Lighthouse >= 0.95, CLS <= 0.01, LCP <= 2.5 s
  - Gate scripts export a pure function and run `main()` only as the entry point
  - Relay artifacts live in PRPs/; tests are authored by the relay test pair (R-X)
- Result: PROCEED
```

## Source

- `PRPs/prds/stage-4-sections-effects.prd.md` — Implementation Phases row 5: "Quality gates" — Goal: Every Stage 4 target is enforced in CI and visible on the preview. — Success signal: All 14 ACs pass in CI on the pull request; all nine CI jobs are green; the owner approves the rhythm.

## Summary

This phase closes Stage 4 by making every target enforceable and reviewable. The implementer's (non-test) work is: add a scheduler diff check (`scripts/check-frozen-runtime.mjs`, `pnpm check:frozen`) wired into the existing `check` CI job (with full history, so the job count stays nine); add the missing `largest-contentful-paint` assertion (<= 2500 ms, median of 3) to `lighthouserc.json`; write the Stage 4 AC-to-spec mapping and the updated gate descriptions into `docs/context/testing.md`; add the "Replacing the photo and covers" procedure to `docs/development.md`; record the decisions in `docs/decisions.md`; and author an owner hand-off checklist for the rhythm review on the preview (never marked done by the pipeline). The E2E suite for AC-1 to AC-14, the axe and layout matrix at the new moments and the unit tests for the new script are authored by the relay test pair after code review; this plan spells out what they must write in `## Notes`.

## User Story

As the site's owner
I want every Stage 4 target enforced by CI and the rhythm items laid out for my review on the preview
So that I can swap the real assets and approve the build's rhythm with confidence that nothing regressed.

## Problem Statement

After Phases 1-4 the pipeline, effects, section scripts and project texts exist (pnpm check 0 errors, Vitest 530, build ok, Playwright 308/308; budgets runtime 12.8/18 KB, critical 13.5/20, total JS 14.7/90, CSS 7.5/25), but several Stage 4 targets are not enforced: Lighthouse asserts no LCP; nothing verifies that the nine frozen `src/runtime/` files still match the Stage 3 merge (`b4271cb`); `docs/context/testing.md` still maps only Stage 3's AC numbers (which collide with Stage 4's AC-1..AC-14); the owner has no written procedure to swap the placeholder photo and covers; and the open rhythm items from Phase 3 live only in conversation (300 ms cards squeeze the skeleton to 40 ms and the cover resolve to 80 ms; the first card starts while the Projects heading types; the dock log is visible about 100 ms; up to 4 stack groups pop at once; hero slack 50 ms and projects slack 30 ms, so a fifth project would overrun; PHOTO_START_OPACITY and the ASCII color need tuning; LCP is unmeasured on the preview).

## Solution Statement

Add the missing gates as small, testable artifacts that follow the existing gate-script pattern, extend `lighthouserc.json` with the LCP assertion without touching any other threshold, and document everything docs-first. The scheduler diff check is a Node script wrapping `git diff <base> -- <frozen files>` that fails on any hunk not backed by a recorded bug-fix exception. It runs in the `check` CI job (checkout with `fetch-depth: 0`), so the nine-job contract and branch protection are unchanged. The rhythm review is an explicit owner hand-off document with open items, tunable constants and their locations; its status stays "awaiting owner review". The test pair then authors the specs listed in `## Notes`.

## Metadata

| Key | Value |
|-----|-------|
| Type | Quality gates / CI / documentation |
| Complexity | Medium |
| Systems Affected | scripts/ (new gate), package.json scripts, `.github/workflows/ci.yml`, lighthouserc.json, docs/context/testing.md, docs/development.md, docs/decisions.md, a new owner review doc |
| Dependencies | Phases 3 and 4 (complete); `git` with history reaching `b4271cb`; `@lhci/cli` already installed |
| Estimated Tasks | 7 |
| Source PRD line ref | `PRPs/prds/stage-4-sections-effects.prd.md` lines 188 and 212-215 (row 5, Phase 5 details) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-4-sections-effects.prd.md` | 59-83, 212-215 | AC-1..AC-14 and the Phase 5 scope and success signal |
| P0 | `docs/context/testing.md` | 49-125 | Gate scripts and the Stage 3 mapping the Stage 4 mapping must sit beside |
| P0 | `docs/development.md` | 11-65, 84-86 | Commands table, Lighthouse recipe, CI paragraph, "Adding a project" (the procedure goes after it) |
| P0 | `lighthouserc.json` | 1-35 | Where the LCP assertion goes |
| P0 | `scripts/check-budgets.mjs` | 228-256 | The gate-script main/guard pattern to mirror for the new script |
| P0 | `.github/workflows/ci.yml` | 30-40 | The `check` job that gains full-history checkout and the frozen check |
| P1 | `scripts/check-privacy.mjs` | 1-60 | Flag handling and the pure-function export shape |
| P1 | `src/runtime/effect-timing.ts` | 6-40 | Tunable timing constants (CARD_MS, PHOTO_START_OPACITY, DISSOLVE_MS, STAGGER_GAP_MS) cited in the rhythm hand-off |
| P1 | `docs/decisions.md` | Stage 4 entries (find by heading) | Entry style to mirror; the bug-fix exception record lives here |
| P1 | `package.json` | 9-23 | Script names for the new `check:frozen` |

## Patterns to Mirror

```js
# SOURCE: scripts/check-budgets.mjs:228-256
function main() {
  const flag = process.argv.indexOf('--dist');
  const distDir = resolve(flag === -1 ? 'dist' : process.argv[flag + 1]);
  const r = measureBudgets(distDir);
  ...
  if (r.problems.length > 0) {
    for (const p of r.problems) console.error(`FAIL ${p}`);
    process.exit(1);
  }
  console.log('PASS: budgets within limits');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
```
Copied by Task 5 (pure exported function + `--base` flag read like `--dist`, FAIL lines on stderr, `process.exit(1)`, PASS line, entry-point guard).

```json
# SOURCE: lighthouserc.json:27-30
"cumulative-layout-shift": [
  "error",
  { "maxNumericValue": 0.01, "aggregationMethod": "median" }
]
```
Copied by Task 6 for the `largest-contentful-paint` assertion (same level, same aggregation).

```yaml
# SOURCE: .github/workflows/ci.yml:30-40
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: corepack enable
      - uses: actions/setup-node@v6
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm astro check
```
Copied by Task 7 (the `check` job keeps its steps; checkout gains `with: fetch-depth: 0` and a `pnpm check:frozen` step).

```md
# SOURCE: docs/context/testing.md:84-86
| Rule | ACs | Covered by | Gap closed by |
|---|---|---|---|
| **Trigger** | AC-2 | `tests/e2e/runtime-build-order.spec.ts` (...), `tests/unit/runtime-scheduler.test.ts` | `tests/e2e/behavior-gaps.spec.ts` (...) |
```
Copied by Task 3 (the Stage 4 mapping table uses the same Covered by / Gap closed by columns).

```md
# SOURCE: docs/development.md:84-86
## Adding a project

Add one Markdown file under `src/content/projects/` with the fields in docs/05-content.md (...). Only personal projects; follow the voice rules in docs/09-content-draft.md.
```
Copied by Task 4 (a sibling `##` section, short numbered steps, relative doc references).

```ts
# SOURCE: src/runtime/effect-timing.ts:14-22
export const CARD_MS = 300;
...
export const DISSOLVE_MS = 700;
export const DISSOLVE_STEPS = 16;
// The photo rises from this non-zero opacity (a hidden image is not counted
// as the largest paint); one tunable constant.
export const PHOTO_START_OPACITY = 0.12;
```
Copied by Task 2 (the rhythm hand-off cites these constants as the tunable levers, by name and file; it does not change them).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `docs/decisions.md` | UPDATE | Docs first: record the LCP assertion, the frozen-runtime check and its exception rule, and the pending owner rhythm review |
| `docs/stage-4-rhythm-review.md` | CREATE | Owner hand-off checklist for the rhythm review on the preview (the pipeline cannot perform it) |
| `docs/context/testing.md` | UPDATE | Stage 4 AC-to-spec mapping, the new gates (frozen check, LCP), updated measured budgets |
| `docs/development.md` | UPDATE | "Replacing the photo and covers" procedure; commands table, CI paragraph and Lighthouse sentence updated |
| `scripts/check-frozen-runtime.mjs` | CREATE | The scheduler diff check (PRD AC-14) |
| `lighthouserc.json` | UPDATE | Add the LCP <= 2500 ms median assertion (PRD AC-12) |
| `package.json` | UPDATE | `check:frozen` script |
| `.github/workflows/ci.yml` | UPDATE | Full-history checkout and `pnpm check:frozen` in the existing `check` job (job count stays nine) |

## NOT Building (Scope Limits)

- Any test file (specs or unit tests): the relay test pair authors them after code review (R-X). The implementer touches no path under `tests/`.
- Any change under `src/` or to the section scripts, effects or timings: tuning is the owner's decision after the rhythm review and would be a new change.
- Any change to the nine frozen runtime files.
- A tenth CI job (the nine-job contract and branch protection stay).
- Relaxing any budget or Lighthouse threshold; if LCP or Performance misses, the numbers go to the owner.
- Delivering the real photo and covers (owner content task) and new cover placeholder art.
- Playwright screenshot baselines (advisory, Could) and the Stage 5/6 items (palette, view transitions, `open("slug");`, OG images, analytics).
- Marking the owner's rhythm review done.

## Step-by-Step Tasks

### Task 1: UPDATE docs/decisions.md

- **ACTION**: Docs first. Read the latest Stage 4 entries and mirror their format. Append one entry titled `Stage 4 Phase 5 quality gates` recording: (1) Lighthouse CI gains `largest-contentful-paint` with `maxNumericValue` 2500 and median aggregation, no other threshold changes, and a miss goes to the owner as numbers; (2) the scheduler diff check `scripts/check-frozen-runtime.mjs` (`pnpm check:frozen`) compares the nine frozen files against `b4271cb`, runs inside the existing `check` CI job with full history so the job count stays nine, and a bug-fix exception requires its own docs/decisions.md entry before the file is added to the script's exception list; (3) the owner's rhythm review is a human hand-off in docs/stage-4-rhythm-review.md and stays "awaiting owner review" until the owner approves on the preview. Delivers AC-A2, AC-A3 and AC-A5's decision record.
- **MIRROR**: `# SOURCE: docs/development.md:84-86` (short, factual doc prose in the existing file's own style).
- **VALIDATE**: `grep -qF "Stage 4 Phase 5 quality gates" docs/decisions.md && pnpm exec prettier --check docs/decisions.md`

### Task 2: CREATE docs/stage-4-rhythm-review.md

- **ACTION**: Create the owner hand-off for the rhythm review (AC-A6). Begin with the line `Status: awaiting owner review` and state plainly that the autonomous pipeline cannot perform this review and that no box below is checked by it. Sections: (a) how to run it (open the pull request's Workers Builds preview, desktop 1280x800 and phone 375x812, both themes, speed 1x, compare against prototype v2 and docs/04-animations.md); (b) the budgets to eyeball against measured values (hero created 2650 ms / done 3150 ms, budget 3.2 s; About about 2400, Projects 2470, Stack 2440, Contact 2432 ms against 2.5 s each; read the exact figures from `tests/unit/runtime-pacing.test.ts` expectations and `src/sections/*.build.ts`, not from memory, and correct any number that differs); (c) an unchecked checklist (`- [ ]`) of the open items: 300 ms cards squeeze the skeleton to 40 ms and the cover resolve to 80 ms; the first card starts while the Projects heading types; the dock log is visible only about 100 ms; up to 4 stack groups pop at once; hero slack 50 ms and projects slack 30 ms (a fifth project would overrun, so adding a project needs re-tuning); `PHOTO_START_OPACITY` (0.12) and the ASCII color token need tuning on the preview with the placeholder and again with the real photo; LCP must be measured on the preview (trace or Lighthouse) and reported as numbers; (d) a "Levers" table naming where to tune: `CARD_MS`, `STAGGER_GAP_MS`, `DISSOLVE_MS`, `PHOTO_START_OPACITY` in `src/runtime/effect-timing.ts`, the step pitches and overlaps in `src/sections/pacing.ts`, the ASCII color token in `src/styles/build-layer.css` (locate the exact token name by reading the overlay ASCII piece's rule; if it cannot be found, write `TBD - needs validation` for that row), and the rule that any change re-runs the unit timing tests, budgets and Lighthouse; (e) an owner decision line `Owner approval: pending`. Do not fill measured LCP values or tick any box.
- **MIRROR**: `# SOURCE: src/runtime/effect-timing.ts:14-22` (constants cited by name and file).
- **VALIDATE**: `set -e; grep -qF "Status: awaiting owner review" docs/stage-4-rhythm-review.md; grep -qF "Owner approval: pending" docs/stage-4-rhythm-review.md; if grep -q -- "- \[x\]" docs/stage-4-rhythm-review.md; then echo "FAIL: a rhythm item is pre-checked by the pipeline"; exit 1; fi; pnpm exec prettier --check docs/stage-4-rhythm-review.md`

### Task 3: UPDATE docs/context/testing.md

- **ACTION**: Add a `## Stage 4 AC-to-spec mapping` section after the Stage 3 coverage sections, and retitle the existing "Other acceptance criteria" heading context so its AC numbers are clearly Stage 3's (their numbers collide with Stage 4's AC-1..AC-14). The new table has one row per Stage 4 AC (AC-1 to AC-14) with `Covered by` (specs that exist today; read each spec's header comment under `tests/e2e/` and `tests/unit/` to see which Stage 4 ACs it cites, and cite only what you verified) and `Gap closed by` (specs the test pair authors in this phase, using the names listed in this plan's Notes; `-` when there is no gap). Also update "Quality gate scripts": add `pnpm check:frozen` (CI job `check`, AC-14: the nine frozen files against `b4271cb`), add the LCP <= 2.5 s median-of-3 assertion to the `pnpm lighthouse` line, and replace the `Measured on 2026-11-08` figures with the Stage 4 figures (runtime 12.8, critical 13.5, total JS 14.7, CSS 7.5 KB gzip) re-measured by running `pnpm build && pnpm check:budgets` and correcting to the printed values. Mention that the owner rhythm review is tracked in docs/stage-4-rhythm-review.md and is not an automated gate. Delivers AC-A4.
- **MIRROR**: `# SOURCE: docs/context/testing.md:84-86` (table columns and cell style).
- **VALIDATE**: `set -e; grep -qF "## Stage 4 AC-to-spec mapping" docs/context/testing.md; grep -qF "check:frozen" docs/context/testing.md; grep -qF "docs/stage-4-rhythm-review.md" docs/context/testing.md; pnpm exec prettier --check docs/context/testing.md`

### Task 4: UPDATE docs/development.md

- **ACTION**: Add a `## Replacing the photo and covers` section directly after `## Adding a project` (AC-A5). Numbered steps, grounded in docs/05-content.md and docs/06-architecture.md (read them for the photo and cover specs and for how each is referenced; copy the specs, do not invent): (1) prepare the file to the spec (the photo 9:16 cut-out with transparency; each cover 16:9) and strip EXIF, XMP and GPS metadata before it enters the repository; (2) put it in `src/assets`; (3) reference it from `profile.json` (the `photo` field) or the project's `cover` field, using the exact path form the current content files use (read `src/content/profile.json` and a project file); (4) run `pnpm check:privacy` (fails naming any image with metadata), `pnpm build` (regenerates the responsive AVIF/WebP versions, the ASCII and the blurred covers with no code change; a missing or unreadable file fails the build naming it), `pnpm test`, `pnpm test:e2e`, `pnpm check:budgets` and `pnpm lighthouse`; (5) open the preview and re-run the review items in docs/stage-4-rhythm-review.md (the ASCII color, `PHOTO_START_OPACITY`, LCP); (6) a short "What CI re-checks" list (privacy job on `src/assets`, budgets, lighthouse with LCP, e2e layout invariance and axe, the frozen runtime check). Also update: the Commands table (add a `Frozen runtime` row for `pnpm check:frozen`), the Continuous integration paragraph (the `check` job also runs `pnpm check:frozen`, job count stays nine), and the Lighthouse sentence to state LCP <= 2.5 s in the median of 3 runs.
- **MIRROR**: `# SOURCE: docs/development.md:84-86`.
- **VALIDATE**: `set -e; grep -qF "## Replacing the photo and covers" docs/development.md; grep -qF "check:frozen" docs/development.md; pnpm exec prettier --check docs/development.md`

### Task 5: CREATE scripts/check-frozen-runtime.mjs

- **ACTION**: Create the scheduler diff check (AC-A1). Node ESM script in the style of the other gate scripts: constants `DEFAULT_BASE = 'b4271cb'` and `FROZEN` (the nine files under `src/runtime/`: scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts, api.ts) and `BUG_FIX_EXCEPTIONS = []` (entries `{ file, decision }`, where `decision` is the heading text of a docs/decisions.md entry). Export a pure `findFrozenViolations({ base, cwd })` that runs `git diff --name-only <base> -- <FROZEN paths>` with `spawnSync` (working tree against the base, so uncommitted edits count), drops files whose exception entry's `decision` text appears in `docs/decisions.md`, and returns the list of changed files; if `git` fails (unknown base, shallow clone) return a violation whose message names the base and suggests `fetch-depth: 0`, never a silent pass. `main()` reads `--base <sha>` like `--dist` is read in check-budgets.mjs, prints each violation as `FAIL frozen runtime file changed: <file>` on stderr and exits 1, otherwise prints `PASS: frozen runtime files match <base>`. Guard `main()` with the same `import.meta.url` entry-point check. No dependency beyond `node:` modules.
- **MIRROR**: `# SOURCE: scripts/check-budgets.mjs:228-256`.
- **VALIDATE**: `set -e; node scripts/check-frozen-runtime.mjs; ROOT_COMMIT="$(git rev-list --max-parents=0 HEAD | tail -n 1)"; if node scripts/check-frozen-runtime.mjs --base "$ROOT_COMMIT"; then echo "FAIL: the check passed against the root commit, so it cannot detect a diff"; exit 1; else echo "PASS: the check fails when the frozen files differ from the base"; fi`

### Task 6: UPDATE lighthouserc.json

- **ACTION**: In `ci.assert.assertions`, add `"largest-contentful-paint": ["error", { "maxNumericValue": 2500, "aggregationMethod": "median" }]` after the CLS entry (AC-A2). Change nothing else: not the URLs, not `numberOfRuns` (3), not any category's `minScore` (0.95), not CLS (0.01).
- **MIRROR**: `# SOURCE: lighthouserc.json:27-30`.
- **VALIDATE**: `set -e; node -e "const c=JSON.parse(require('fs').readFileSync('lighthouserc.json','utf8')).ci; const a=c.assert.assertions['largest-contentful-paint']; if(!a||a[0]!=='error'||a[1].maxNumericValue!==2500||a[1].aggregationMethod!=='median'||c.assert.assertions['cumulative-layout-shift'][1].maxNumericValue!==0.01||c.collect.numberOfRuns!==3) process.exit(1)"; pnpm exec prettier --check lighthouserc.json`

### Task 7: UPDATE package.json and .github/workflows/ci.yml

- **ACTION**: In `package.json` `scripts` add `"check:frozen": "node scripts/check-frozen-runtime.mjs"` next to the other `check:*` scripts (AC-A3). In `.github/workflows/ci.yml`, in the existing `check` job only, change its checkout step to carry `with:` / `fetch-depth: 0` (the diff needs history back to `b4271cb`) and add a final step `- run: pnpm check:frozen`. Do not add a job; the other eight jobs and the `check` job's existing steps stay as they are.
- **MIRROR**: `# SOURCE: .github/workflows/ci.yml:30-40`.
- **VALIDATE**: `set -e; pnpm check:frozen; pnpm exec prettier --check package.json .github/workflows/ci.yml; grep -qF "fetch-depth: 0" .github/workflows/ci.yml; test "$(awk '/^jobs:/{j=1;next} /^[^ #]/{j=0} j && /^  [a-z0-9_-]+:$/{n++} END{print n+0}' .github/workflows/ci.yml)" = "9"`

## Validation Commands

### Level 1 STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm exec prettier --check scripts/check-frozen-runtime.mjs lighthouserc.json package.json .github/workflows/ci.yml docs/context/testing.md docs/development.md docs/decisions.md docs/stage-4-rhythm-review.md
pnpm lint
pnpm check
```

### Level 2 CONTENT_INVARIANTS

```bash
set -euo pipefail
# The frozen files match the Stage 3 merge.
pnpm check:frozen
# The check can fail: against the root commit it must exit non-zero.
ROOT_COMMIT="$(git rev-list --max-parents=0 HEAD | tail -n 1)"
if node scripts/check-frozen-runtime.mjs --base "$ROOT_COMMIT"; then
  echo "FAIL: frozen check cannot detect a diff"; exit 1
else
  echo "PASS: frozen check detects a diff"
fi
# The LCP assertion is wired with the agreed ceiling and median aggregation.
node -e "const a=JSON.parse(require('fs').readFileSync('lighthouserc.json','utf8')).ci.assert.assertions['largest-contentful-paint']; if(!a||a[1].maxNumericValue!==2500||a[1].aggregationMethod!=='median') process.exit(1)"
# The owner hand-off carries no pre-checked box.
if grep -q -- "- \[x\]" docs/stage-4-rhythm-review.md; then
  echo "FAIL: pre-checked rhythm item"; exit 1
else
  echo "PASS: no pre-checked rhythm item"
fi
# The implementer touched nothing under tests/ or the frozen runtime (diff scope: working tree against HEAD).
if git diff --name-only HEAD -- tests/ | grep -q .; then
  echo "FAIL: test files changed by the implementer"; exit 1
else
  echo "PASS: no test file changed"
fi
```

### Level 3 INTEGRATION

```bash
set -euo pipefail
pnpm test
pnpm build
pnpm check:budgets
pnpm check:privacy
pnpm check:frozen
pnpm test:e2e
```

Lighthouse (`pnpm lighthouse`) needs Chrome and is authoritative in the CI `lighthouse` job; where it can run locally, use the recipe in docs/development.md and record the LCP median in the pull request.

## Acceptance Criteria

- **AC-A1 (PRD AC-14):** `pnpm check:frozen` exits 0 when the nine frozen `src/runtime/` files match `b4271cb` and exits non-zero (naming each changed file) when any differs and has no recorded bug-fix exception; an unknown base or shallow clone fails loudly rather than passing.
- **AC-A2 (PRD AC-12):** `lighthouserc.json` asserts `largest-contentful-paint` <= 2500 ms with median aggregation over the existing 3 runs on `/` and `/projects/relay/`, with every category >= 0.95 and CLS <= 0.01 unchanged; the size budgets (runtime 18, critical 20, total JS 90, CSS 25 KB gzip) stay unchanged and `pnpm check:budgets` passes.
- **AC-A3 (PRD AC-12, PRD AC-14):** CI runs the scheduler diff check inside the existing `check` job with full history, the workflow still defines exactly nine jobs, and `pnpm check:frozen` is a package script.
- **AC-A4 (PRD AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14):** `docs/context/testing.md` maps each of the 14 Stage 4 ACs to the spec(s) that cover it and to the spec the test pair authors for any gap, keeps Stage 3's numbering distinct, and describes the new gates and current measured budgets.
- **AC-A5 (PRD AC-4):** `docs/development.md` documents the step-by-step "Replacing the photo and covers" procedure (specs, metadata stripping, where to reference, the commands to run, what CI re-checks), and `docs/decisions.md` records the Phase 5 decisions.
- **AC-A6 (PRD AC-6, PRD AC-7):** `docs/stage-4-rhythm-review.md` lists the section budgets, every open rhythm item and the tunable levers as an owner hand-off whose status is "awaiting owner review" with no item pre-checked and no measured LCP invented.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LCP or Performance misses the 2.5 s / 0.95 targets once the assertion is on (the hero photo is revealed by script under the ASCII overlay) | M | High: the `lighthouse` CI job fails | No threshold is relaxed (PRD). The numbers go to the owner via the rhythm hand-off; `PHOTO_START_OPACITY` and the hero step are the levers, and any change is the owner's follow-up |
| `tests/unit/quality-gates.test.ts` asserts the exact Lighthouse key set and goes red once the LCP key is added | L | Medium: Level 3 `pnpm test` fails | That spec is test-pair-owned; the implementer reports it rather than editing it, and the test pair updates it (it is on the Notes list) |
| The CI diff cannot reach `b4271cb` (shallow clone) | M | Medium: a false failure or a silent pass | `fetch-depth: 0` on the `check` job; the script treats a git failure as a violation, never a pass |
| The root-commit negative check in Task 5 passes vacuously if that commit contains identical frozen files | L | Low | The root commit is the docs-only Stage 0 commit; if it ever contained them, use another pre-Stage-3 commit hash printed by `git log` for the negative check |
| A fifth project or a heavier real photo overruns the thin slack (hero 50 ms, projects 30 ms) | M | Medium | Documented in the rhythm hand-off and the swap procedure; the compiled-timeline unit test fails early (AC-6) |
| The real photo or covers carry GPS metadata | L | High | The swap procedure strips metadata first; `pnpm check:privacy` fails naming the file |
| `fetch-depth: 0` and a new step add time to the `check` job | L | Low | History is small; the job still runs one pnpm command plus the diff |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- **What the test pair must author or update (Testing Strategy, test-after).** Read each spec's header comment first; the research found these Stage 4 specs already exist: `tests/e2e/image-resolve-hero.spec.ts` (AC-1, AC-9, AC-10, AC-11), `tests/e2e/image-delivery.spec.ts` (AC-5), `tests/e2e/section-dock-logs.spec.ts` (AC-8), `tests/e2e/project-pages.spec.ts` (AC-13), `tests/e2e/effects-*.spec.ts`, `tests/e2e/axe-build-matrix.spec.ts`, `tests/unit/image-ascii`, `image-blur`, `image-resolve-contract`, `image-resolve-timing`, `hero-photo-command`, `section-call-args`, `runtime-pacing`, `privacy-image-metadata`, `content-copy`. Gaps to close, mapped to ACs:
  1. `tests/unit/check-frozen-runtime.test.ts` (AC-14): spawn the script against a temp git repo or with `--base` against the root commit; assert exit 0 on an unchanged tree, exit 1 naming the file on a changed one, a loud failure on an unknown base, and that a bug-fix exception only counts when its decision text is in `docs/decisions.md`. Also confirm every Stage 3 behavior-rule spec still passes (AC-14).
  2. Update `tests/unit/quality-gates.test.ts` for the new LCP assertion (2500, median) and keep the other thresholds asserted (AC-12).
  3. `tests/e2e/section-budgets.spec.ts` (AC-6, AC-7): with `page.clock`, `<h1>` fully visible by 2.0 s and the hero final with its window gone by 3.2 s; each of About, Projects, Stack and Contact triggered alone shows `✔ <Section> Section created. (<t>s)` with `<t>` <= 2.50 within 2.5 s after the trigger; the docs/04 effects at paused moments (cards overlap about 120 ms, never more than two building; buttons and chips 90 ms apart). Compiled timelines of the committed content stay unit-tested (createdAt <= 2500 ms each, hero duration <= 3200 ms, headline step ends by 2000 ms).
  4. Cover-resolve coverage (AC-3, AC-9 mid-cover, AC-10): the fixture cover must not ship in `src/content`. Wire it test-side only (Playwright route interception or a served-HTML fixture that renders a card with a cover and the blurred data URI through the real runtime), and cover the no-cover card (dot-grid, no blur phase).
  5. Axe and layout matrix at the new moments (AC-9, AC-11): mid dissolve, mid cover resolve, done, in Midnight and Daylight at 1280x800 and 375x812: boxes and document height equal to the no-JS page (±0.5 px), summed layout shift <= 0.01, axe 0 violations (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa), `<main>` accessibility tree equal, ASCII and blur pieces inside the `aria-hidden` overlay, `scrollWidth` equals `clientWidth` at sampled moments.
  6. Instant paths (AC-10): skip (`Esc`, `» Skip`, bar click), run all (`Shift + Esc`), focus into a later section, `∞`, and a viewport-width change mid dissolve and mid cover leave no ASCII or blur piece within one frame; reduced motion, saved `∞` and no JavaScript show the photo at `DOMContentLoaded`.
  7. AC-4 swap invariance (a new 9:16 photo or 16:9 cover with no code change keeps every section, heading, paragraph, button, card and stack-group box at 1280x800 and 375x812) and AC-2 failure on a missing photo naming the file, if not already covered by existing unit tests.
  8. AC-12 budgets and the AC-13 axe check on each of the four project pages in both themes (extend `tests/e2e/quality-gates.spec.ts` / `project-pages.spec.ts` as appropriate).
  - Hand the `docs/context/testing.md` "Gap closed by" column the final spec names once authored.
- The owner's rhythm review is a human step. The implementer ships the checklist; the pipeline must report it as pending, not done. The phase's success signal ("the owner approves the rhythm") is completed by the owner on the pull request preview.
- The frozen files currently unchanged by Phases 1-4 are confirmed by the git status snapshot, which lists changes only to compiler.ts, effect-timing.ts, effects.ts, layer-timing.ts, layer.ts and types.ts under `src/runtime/`; Task 5's positive check proves it against `b4271cb`.
- R8b-style PRD AC traceability applies here (PRD mode): every AC-A item carries its `(PRD AC-N)` token.

*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Implemented: 2026-11-10*
*Status: IMPLEMENTED*
