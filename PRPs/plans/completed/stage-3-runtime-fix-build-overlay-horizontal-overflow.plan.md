# Feature: Stage 3 runtime fix: build overlay horizontal overflow (description mode)

```
**Decision Gate**
- Active context: none
- Activated criteria: change to build-layer styling (build area, overlay invariants); new cross-cutting rule ("the build layer never creates horizontal scroll") that must land in docs/ first; touches the "final layout never moves" core rule
- Decisions found:
  - D2 (2026-11-02): the animation runtime is plain TypeScript outside React and writes to the DOM directly; this fix is CSS-only and adds no runtime code
  - D17 (2026-11-02): build windows are overlays that disappear and leave the readable page
  - Stage 3 PRD approved (2026-11-08): build-layer components are TypeScript DOM factories; effects are driven by the runtime's clock; methodology stays test-after
  - Stage 2 approved (2026-11-06): Stage 3 adds the runtime on top without changing layout, content or accessibility
- Applicable anti-patterns:
  - Layout-shifting build animations (docs/anti-patterns.md): overlays only, animate only transform, opacity, clip-path; a build-layer element must never widen the page
  - Weakening tests to get a green run: tests/e2e/effects-layout.spec.ts is correct and MUST NOT change; no file under tests/ is edited
  - Raw values instead of tokens: no color or shadow literal in the CSS change (pnpm check:tokens)
  - Mixing the two registers: the build layer stays aria-hidden and overlay-only
- Applicable architectural rules:
  - The build layer is one overlay; it never moves the page; `aria-hidden`; exists only while building (docs/context/architecture.md)
  - Plain CSS with token custom properties, no CSS framework
  - Docs first: update docs/ (and docs/decisions.md) before code (docs/context/constraints.md)
  - Browsers: last two versions of Chrome, Edge, Firefox and Safari (docs/context/constraints.md)
- Result: PROCEED
```

## Source

Stage 3 runtime fix: build overlay horizontal overflow at 375px. During the hero build at a 375x812 viewport (hero t=1600 ms, the photo step's selection box), the document scrolls sideways by 2 px: documentElement.scrollWidth is 377 while clientWidth is 375. Browser-measured offenders: the two right-hand span.sp-select-handle elements (left 371, right 377) of a selection box drawn at the viewport's right edge. Cause: src/styles/build-layer.css:307-320 places those handles at right:-3px, and neither .sp-build-layer (build-layer.css:1-9: position absolute, top 0, left 0, width 100%, height 0, z-index 2, pointer-events none) nor .sp-build-fx (build-layer.css:276-283) clips horizontally. The failing guard is tests/e2e/effects-layout.spec.ts:38 (zero horizontal overflow during the build, limit 0); that test is correct and must not change. Fix it in production code only: the build layer must never widen the document (docs/02 'the final layout never moves'; overlays only). Preferred direction: contain the overlay roots horizontally (for example overflow-x: clip on .sp-build-layer and .sp-build-fx, keeping the vertical axis visible) so no present or future overlay piece (selection handles, windows, cursors, skeletons, text overlays) can create horizontal scroll; the alternative is to inset the handles when the box touches the viewport edge. Keep per-frame animation on transform/opacity/clip-path, keep the build layer aria-hidden, and change no test file. Out of scope: tests/e2e/effects-hero.spec.ts:100 (the hero links sample at t=2330 sits on the intro-end / links-pop boundary), which the Phase 3 test pair fixes afterwards; it may stay red during this plan's validation.

R8b does not apply in description mode — no (PRD AC-N) token required. Context only (not a source PRD, no back-fill): `PRPs/prds/stage-3-runtime.prd.md` AC-4 (reserved space and final layout), AC-18 (axe), AC-21 (mobile).

## Summary

At 375 px the hero's photo selection box sits at the viewport's right edge and its right-hand corner handles (`right: -3px`) poke 2 px past the layer, so `documentElement.scrollWidth` becomes 377. This plan makes both overlay roots (`.sp-build-layer` and `.sp-build-fx`) clip the horizontal axis with `overflow-x: clip` while leaving the vertical axis visible, so no current or future overlay piece can widen the document. It is CSS-only in production code (one stylesheet), preceded by a docs-first rule (new build rule B26, the "final layout never moves" wording, the architecture styles row and a decisions entry). No test file changes; the already-correct guard `tests/e2e/effects-layout.spec.ts:38` becomes green.

Decision (containment over inset), with evidence:

- The selection handles are only one offender. `layer.ts:129-135` appends build windows, whose `left/top/width/height` come from the section box, and `effects.ts:406-416` mounts the `sp-build-fx` root that holds selection boxes (translated with `translate3d`, `SelectionBox.ts:35-39`), skeletons and text overlays. Insetting the handles would fix one piece and leave every other overlay piece (window shadow, outline, selection label `white-space: nowrap` at `build-layer.css:322-332`, shimmer, scramble glyphs) free to widen the page later. Inset also needs per-effect knowledge of whether a box touches the edge, which is runtime code and a visual change to the drawn box.
- Nothing legitimately paints outside the horizontal bounds. The dock (`build-layer.css:132-142`) and boot terminal (`build-layer.css:100-117`) are `position: fixed`; the containing block of a fixed element is the viewport (the layer has no transform, filter or contain), so an `overflow` on the absolutely positioned layer does not clip them. Windows and outlines are placed over section boxes, which are inside the page width; only their box-shadow could extend sideways, and that part is off-screen anyway. The only content that ever exceeded the width is the 2 px handle overhang, which the viewport edge hides.
- `overflow-x: clip` is chosen over `hidden`: `hidden` on one axis forces the other `visible` to compute to `auto`, which would make the zero-height layer a scroll container (it would clip the vertical axis and break `position: sticky` of `.sp-window-chrome`, `build-layer.css:222-230`). `clip` does not create a scroll container and does not coerce the other axis, so `overflow-x: clip; overflow-y: visible` clips only horizontally and keeps the vertical extent (the hero photo's selection box legitimately runs past the window, docs/02-experience.md "runs past the bottom") and the sticky bars intact. Clipped content is also excluded from the ancestor's scrollable overflow, which is what removes the 2 px from `scrollWidth`.
- Browser support: `overflow: clip` (and per-axis `overflow-x: clip`) ships in Chrome/Edge 90, Firefox 81 and Safari 16. The project's targets are the last two versions of Chrome, Edge, Firefox and Safari (docs/context/constraints.md), all of which support it, so no `@supports` fallback is added.

## User Story

As a visitor on a 375 px phone
I want the page to never scroll sideways while it builds itself
So that the final layout stays fixed and the build overlay never breaks the reading page.

## Problem Statement

At 375x812, hero t=1600 ms, the photo step's selection box is drawn at the viewport's right edge. Its two right-hand `span.sp-select-handle` elements (left 371, right 377) overflow the 375 px layer by 2 px, because `build-layer.css:307-320` positions them at `right: -3px` and neither `.sp-build-layer` (`build-layer.css:1-9`) nor `.sp-build-fx` (`build-layer.css:276-283`) clips horizontally. `documentElement.scrollWidth` is 377 while `clientWidth` is 375, so `tests/e2e/effects-layout.spec.ts:38` fails. This violates "the final layout never moves" (docs/02-experience.md, Behavior rules) and Stage 3 PRD AC-21 (mobile).

## Solution Statement

Add `overflow-x: clip` (and keep `overflow-y: visible`) to `.sp-build-layer` and `.sp-build-fx` in `src/styles/build-layer.css`, with a short comment explaining clip versus hidden. Record the new rule first in docs (`docs/domain/areas/build.md` B26, `docs/02-experience.md`, `docs/context/architecture.md`, `docs/decisions.md`). Verify with a clean build, the previously failing spec, the full e2e suite (only `effects-hero.spec.ts:100` may remain red) and the budgets.

## Metadata

| Key | Value |
|-----|-------|
| Type | Bug fix |
| Complexity | Low |
| Systems Affected | build layer styling (`src/styles/build-layer.css`); docs (build area rules, experience behavior rules, architecture, decisions) |
| Dependencies | none new; existing Playwright, Vitest, Astro toolchain |
| Estimated Tasks | 4 |
| Source PRD line ref | none (description mode); context: PRPs/prds/stage-3-runtime.prd.md AC-4, AC-18, AC-21 |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `src/styles/build-layer.css` | 1-9, 199-205, 276-283, 295-332 | The two overlay roots to change, the absolutely positioned window root, the fx root and the handle rules that overhang |
| P0 | `src/runtime/layer.ts` | 57-63, 129-135 | Where `.sp-build-layer` is created and mounted after `.sp-page`, and where windows are appended to it |
| P0 | `src/runtime/effects.ts` | 406-416 | Where `.sp-build-fx` is created and inserted as the layer's first child |
| P0 | `src/components/build/SelectionBox.ts` | 19-39 | The selection box (four handle spans, `translate3d` placement) that produces the overhang |
| P0 | `tests/e2e/effects-layout.spec.ts` | 23-42 | The failing guard (read only, never edited): hero build at desktop and 375 px, overflow limit 0 |
| P0 | `docs/domain/areas/build.md` | 5-33 | Rule table where B26 is appended after B25; B4 is the sibling rule |
| P1 | `docs/02-experience.md` | 297 | The "The final layout never moves" behavior row to extend |
| P1 | `docs/context/architecture.md` | 48 | The `src/styles/` row that describes `build-layer.css` |
| P1 | `docs/decisions.md` | 198-216 | Entry format and the place (before the template comment) for the new decision |
| P1 | `playwright.config.ts` | 13-17 | `astro preview` on 127.0.0.1:4321 without building and with `reuseExistingServer` locally (a stale server serves a stale `dist/`) |

## Patterns to Mirror

```css
# SOURCE: src/styles/build-layer.css:1-9
.sp-build-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  z-index: 2;
  pointer-events: none;
}
```
Task 3 copies this rule shape (add `overflow-x: clip; overflow-y: visible;` to it).

```css
# SOURCE: src/styles/build-layer.css:276-283
.sp-build-fx {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  pointer-events: none;
}
```
Task 3 copies this rule shape for the fx root.

```css
# SOURCE: src/styles/build-layer.css:131-142
/* Dock */
.sp-dock {
  position: fixed;
  bottom: max(var(--space-6), env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  margin-inline: auto;
  height: var(--dock-height);
  width: min(var(--dock-width), calc(100vw - var(--space-8)));
  box-sizing: border-box;
  pointer-events: none;
}
```
Task 3 keeps the section-comment style (`/* Name */`) used for each block; this rule also documents that fixed pieces are not affected by the layer's overflow.

```markdown
# SOURCE: docs/domain/areas/build.md:12
| B4 | **The final layout never moves**: windows, cursors and selection boxes are overlays; animate only `transform`, `opacity`, `clip-path` |
```
Task 1 copies this table-row shape for rule B26.

```markdown
# SOURCE: docs/decisions.md:198-205
## [2026-11-08] Stage 3 PRD approved: runtime boundaries and rules

**Context:** Stage 3 · Runtime needed its boundary with Stage 4 and the behavior details prototype v2 left open (PRPs/prds/stage-3-runtime.prd.md).
**Decision:** ...
**Reason:** ...
**Areas affected:** build, navigation, visual-design

---
```
Task 2 copies this entry shape for the new decision.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `docs/domain/areas/build.md` | UPDATE | Add rule B26 (the build layer never widens the document); docs first |
| `docs/02-experience.md` | UPDATE | Extend the "The final layout never moves" behavior row with the no-horizontal-scroll guarantee |
| `docs/context/architecture.md` | UPDATE | Describe the horizontal containment of the two overlay roots in the `src/styles/` row |
| `docs/decisions.md` | UPDATE | Record the containment decision (clip over hidden over inset) |
| `src/styles/build-layer.css` | UPDATE | Add `overflow-x: clip; overflow-y: visible` to `.sp-build-layer` and `.sp-build-fx` |

## NOT Building (Scope Limits)

- No change to any file under `tests/`: `tests/e2e/effects-layout.spec.ts` is correct and stays as is; the implementer does not edit, add, skip or loosen any test (R-X).
- Out of scope: `tests/e2e/effects-hero.spec.ts:100` (the hero links sample at t=2330 sits on the intro-end / links-pop boundary). The Phase 3 test pair fixes it afterwards; it may stay red during this plan's validation and is NOT a plan defect.
- No inset of the selection handles and no change to `SelectionBox.ts`, `effects.ts`, `layer.ts` or any runtime/TypeScript code.
- No change to effect timing, durations, geometry or the animated properties (per-frame animation stays `transform`, `opacity`, `clip-path`).
- No `overflow: hidden`/`auto` on the overlay roots (would create a scroll container) and no `overflow-clip-margin`.
- No `@supports` fallback for `overflow: clip` (every project target supports it).
- No change to `html`/`body` overflow, page CSS, tokens or `aria-hidden` behavior of the build layer.
- No new effects, v1.1 features, or other responsive fixes.

## Step-by-Step Tasks

### Task 1: UPDATE docs/domain/areas/build.md and docs/02-experience.md (docs first)

- **ACTION**: Delivers AC-A3. In `docs/domain/areas/build.md`, append a new row directly after the B25 row of the Business rules table, in the same `| B<n> | ... |` shape:
  `| B26 | **The build layer never widens the document**: its roots clip horizontal overflow (`overflow-x: clip`, vertical stays visible), so no overlay piece (handles, windows, skeletons, text overlays) can create horizontal scroll; `clip`, not `hidden`, so the sticky window bars keep working |`
  In `docs/02-experience.md`, in the Behavior rules table row `**The final layout never moves**` (line 297), append after its last sentence: ` No overlay piece may widen the page: the build layer clips horizontal overflow, so the page never scrolls sideways while building.` Use narrow `Edit` calls; change nothing else.
- **MIRROR**: `# SOURCE: docs/domain/areas/build.md:12` (row shape).
- **VALIDATE**: `set -euo pipefail; grep -qF '| B26 | **The build layer never widens the document**' docs/domain/areas/build.md; grep -qF 'never scrolls sideways while building' docs/02-experience.md; pnpm exec prettier --check docs/domain/areas/build.md docs/02-experience.md` (text match is legitimate here: the deliverable IS documentation prose; prettier's own exit code checks formatting).

### Task 2: UPDATE docs/context/architecture.md and docs/decisions.md (docs first)

- **ACTION**: Delivers AC-A3. In `docs/context/architecture.md`, in the `src/styles/` row (line 48), extend the `build-layer.css` clause so it ends with: `; its roots (`.sp-build-layer`, `.sp-build-fx`) clip horizontal overflow with `overflow-x: clip` (vertical stays visible, and `clip` does not create a scroll container) so no overlay piece can widen the document`. In `docs/decisions.md`, add a new entry before the `<!-- Template for future entries:` comment, after the Stage 3 PRD entry's `---` separator, titled exactly `## [2026-11-08] Build layer clips horizontal overflow`, with the four fields: **Context** (a selection box at the 375 px viewport edge made `scrollWidth` 377 against `clientWidth` 375 during the hero build), **Decision** (the build layer's overlay roots clip the horizontal axis with `overflow-x: clip` and keep the vertical axis visible; fixed pieces such as the dock and boot terminal are unaffected; insetting individual handles was rejected), **Reason** (protects "the final layout never moves" for every present and future overlay piece; `clip` over `hidden` so the layer is not a scroll container and sticky window bars keep working; supported by the last two versions of every target browser), **Areas affected** (build, visual-design). End the entry with the `---` separator.
- **MIRROR**: `# SOURCE: docs/decisions.md:198-205` (entry shape).
- **VALIDATE**: `set -euo pipefail; grep -qF '## [2026-11-08] Build layer clips horizontal overflow' docs/decisions.md; grep -qF 'overflow-x: clip' docs/context/architecture.md; pnpm exec prettier --check docs/context/architecture.md docs/decisions.md` (text match is legitimate: the deliverable IS documentation prose).

### Task 3: UPDATE src/styles/build-layer.css

- **ACTION**: Delivers AC-A1, AC-A2 and AC-A4. In the `.sp-build-layer` rule (lines 1-9) add `overflow-x: clip;` and `overflow-y: visible;` after `pointer-events: none;`, and in the `.sp-build-fx` rule (lines 276-283) add the same two declarations. Immediately above the `.sp-build-layer` rule add one comment: `/* The overlay never widens the document (B26): clip, not hidden, so the layer is not a scroll container (sticky window bars keep working) and the vertical axis stays visible. Fixed pieces (dock, boot) are unaffected. */`. Use only these declarations: no color or shadow literals, no change to any other rule, no layout property animated.
- **MIRROR**: `# SOURCE: src/styles/build-layer.css:1-9` and `# SOURCE: src/styles/build-layer.css:276-283`.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check src/styles/build-layer.css; node -e "require('net').connect(4321,'127.0.0.1').on('connect',()=>{console.error('FAIL: a server already listens on 4321 and may serve a stale dist/; stop it');process.exit(1)}).on('error',()=>console.log('PASS: port 4321 is free'))"; pnpm build; pnpm exec playwright test tests/e2e/effects-layout.spec.ts` (builds fresh, then runs the guard that failed: `tests/e2e/effects-layout.spec.ts:38`; Playwright's own exit code carries the result, and both the desktop and the 375 px spec must pass).

### Task 4: Verify the full gate set without editing anything

- **ACTION**: Delivers AC-A2 and AC-A4. Run the `## Validation Commands` Levels 1-3 from the worktree root in order. Do not edit any file in this task. If only `tests/e2e/effects-hero.spec.ts:100` is red in the full e2e run, that is the declared out-of-scope failure and is not a plan defect; do not edit tests and do not report it as a plan defect. Any other failing spec is a real regression of this change: fix it in `src/styles/build-layer.css` only.
- **MIRROR**: `# SOURCE: src/styles/build-layer.css:131-142` (confirms fixed overlay pieces are outside the clip's reach; nothing is copied).
- **VALIDATE**: run Level 3 of `## Validation Commands` below (it exits non-zero on any failure other than the tolerated `effects-hero.spec.ts:100`).

## Validation Commands

All commands run from the worktree root `C:/repos/site-pro/.worktrees/stage-3-runtime` (Git Bash or any POSIX shell; the Node snippets are cross-platform).

Precondition for Level 3: `playwright.config.ts` starts `astro preview` on 127.0.0.1:4321 WITHOUT building, and reuses an already running server locally (`reuseExistingServer: !process.env.CI`). No stale preview server may be serving an old `dist/`: stop any process on port 4321, then run `pnpm build` first (the Level 3 block checks the port and builds).

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm check
pnpm lint
pnpm exec prettier --check src/styles/build-layer.css docs/domain/areas/build.md docs/02-experience.md docs/context/architecture.md docs/decisions.md
pnpm check:tokens
# the implementer must not have touched tests/: nothing under tests/ is newer than the first docs file edited in Task 1
if [ -n "$(find tests -type f -newer docs/domain/areas/build.md)" ]; then
  echo "FAIL: a file under tests/ changed after Task 1 (R-X)"; exit 1
else
  echo "PASS: no test file touched"
fi
```

### Level 2: UNIT_TESTS

```bash
set -euo pipefail
pnpm test
```

### Level 3: INTEGRATION (build + e2e + budgets)

```bash
set -euo pipefail
node -e "require('net').connect(4321,'127.0.0.1').on('connect',()=>{console.error('FAIL: a server already listens on 4321 and may serve a stale dist/; stop it');process.exit(1)}).on('error',()=>console.log('PASS: port 4321 is free'))"
pnpm build
# 1. the previously failing guard must pass on its own (desktop and 375 px)
pnpm exec playwright test tests/e2e/effects-layout.spec.ts
# 2. the full suite: the ONLY allowed failure is tests/e2e/effects-hero.spec.ts:100
#    (out of scope, fixed later by the Phase 3 test pair; NOT a plan defect).
rm -f .e2e-full.json
PLAYWRIGHT_JSON_OUTPUT_NAME=.e2e-full.json pnpm exec playwright test --reporter=json > /dev/null || true
node -e '
const r = require("./.e2e-full.json");
let total = 0;
const bad = [];
const walk = (s) => {
  for (const sp of s.specs ?? []) { total++; if (!sp.ok) bad.push(sp.file + ":" + sp.line); }
  for (const c of s.suites ?? []) walk(c);
};
for (const s of r.suites ?? []) walk(s);
const allowed = ["effects-hero.spec.ts:100"];
const extra = bad.filter((b) => !allowed.includes(b));
if (total === 0 || extra.length) {
  console.error("FAIL: specs=" + total + " unexpected failures: " + extra.join(", "));
  process.exit(1);
}
console.log("PASS: " + total + " specs; tolerated failures: " + (bad.join(", ") || "none"));
'
rm -f .e2e-full.json
# 3. budgets over dist/ (built above)
pnpm check:budgets
```

The JSON reporter is pinned (`--reporter=json`, output file via `PLAYWRIGHT_JSON_OUTPUT_NAME`) so the failure set is read from Playwright's machine-readable report (`suites[].specs[]` with `file`, `line`, `ok`) and not scraped from a human-readable format. The `|| true` only lets the report be written; the Node block exits non-zero on an empty run or any failure other than `effects-hero.spec.ts:100`.

## Acceptance Criteria

- **AC-A1:** During the hero build at 375x812 (hero t = 1340, 1600, 1800, 2150, 2450 ms) and at the desktop viewport, `documentElement.scrollWidth - clientWidth` is at most 0; `tests/e2e/effects-layout.spec.ts` ("never adds horizontal scroll while the hero elements are created", both viewports) passes unchanged.
- **AC-A2:** Only the horizontal axis is contained: `.sp-build-layer` and `.sp-build-fx` carry `overflow-x: clip` with `overflow-y: visible`, so overlay pieces stay visible and positioned as before (dock and boot terminal are fixed and unaffected; windows, outlines, selection boxes and skeletons render; sticky window bars still stick). Every other e2e spec stays green; the only tolerated failure in the full `pnpm test:e2e` run is `tests/e2e/effects-hero.spec.ts:100` (out of scope).
- **AC-A3:** The rule "the build layer never widens the document" is recorded before the code change in `docs/domain/areas/build.md` (B26), `docs/02-experience.md`, `docs/context/architecture.md` and `docs/decisions.md`.
- **AC-A4:** No file under `tests/` is changed; the build layer stays `aria-hidden`; per-frame animation still uses only `transform`, `opacity` and `clip-path`; `pnpm check`, `pnpm lint`, Prettier, `pnpm check:tokens`, `pnpm test` and `pnpm check:budgets` pass.

R8b (PRD AC-N token check) does not apply in description mode.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `overflow-x: clip` on the layer unexpectedly clips a fixed piece (dock, boot) | Low | High | Fixed elements' containing block is the viewport (the layer has no transform/filter/contain), so they are not clipped; the full e2e suite (dock/boot specs) is the check |
| The layer's `width: 100%` is narrower than the visible page (e.g. a positioned ancestor) so legitimate overlay content is clipped | Low | Medium | The layer is mounted after `.sp-page` with `left: 0; width: 100%` over the page width (`layer.ts:61-63`); the implementer confirms through the passing window/selection e2e specs; if a spec shows missing overlay content, fix in the CSS only |
| `clip` ignored by an old engine, leaving the bug in that browser | Low | Low | Targets are the last two versions of Chrome, Edge, Firefox, Safari, all supporting per-axis `overflow: clip` (Chrome/Edge 90, Firefox 81, Safari 16); no fallback needed |
| Stale preview server serves an old `dist/`, so the new CSS is not exercised and the guard still fails (or passes falsely) | Medium | High | Level 3 checks port 4321 is free and runs `pnpm build` before any Playwright command |
| The implementer reports `effects-hero.spec.ts:100` as a plan defect or edits it | Medium | Medium | The plan names it explicitly as out of scope and tolerated; Level 3 allows exactly that one failure; no task edits tests |
| The Playwright JSON report shape differs by version | Low | Low | The script reads only documented `suites[].specs[]` fields (`file`, `line`, `ok`); an empty or unreadable report fails closed (exit 1) |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework. (Task 3 and the Level 3 block still run the existing Playwright suite as an end-to-end check; running a suite is not authoring a test file.)
- Test guardrail (docs/context/testing.md): suites covering this change are Playwright E2E (`tests/e2e/effects-layout.spec.ts`, the full e2e suite, axe inside it) and Vitest (`tests/unit/`). The existing guard already asserts the intended behavior, so no test update is needed.
- Verification detail: in the Level 1 `find ... -newer` check, `docs/domain/areas/build.md` is the reference file because Task 1 edits it first; do not re-save it after the later tasks.
- The `effects-hero.spec.ts:100` red sample (hero links at t=2330, on the intro-end / links-pop boundary) is a known, separate defect for the Phase 3 test pair.

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
