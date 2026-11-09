# Feature: Stage 3 runtime controls fix: footer slot layout and speed label (description mode)

```
**Decision Gate**
- Active context: none
- Activated criteria: change to the footer layout and the dock's accessible names (build and visual-design areas); touches the core rule "the final layout never moves"; changes owner-visible copy (the speed button's accessible name quoted in docs), so a docs-first decision entry is required; accessibility rule (axe zero violations)
- Decisions found:
  - D2 (2026-11-02): the animation runtime is plain TypeScript outside React and writes to the DOM directly; this fix adds no runtime logic, only CSS and one copy string
  - D17 (2026-11-02): build windows are overlays that disappear and leave the readable page
  - Stage 3 PRD approved (2026-11-08): the footer build summary and Replay arrive in Stage 3 "in a slot reserved in the static footer"; build-layer components are TypeScript DOM factories; methodology stays test-after
  - Build layer clips horizontal overflow (2026-11-08): the overlay roots clip the horizontal axis; unrelated to this fix and left untouched
  - Stage 3 Phase 4 controls and navigation (2026-11-08): the dock is a `role="group"` named "Site build" with real buttons; strings are centralized in `src/strings.ts`
  - Stage 2 approved (2026-11-06): the static footer must keep looking like Stage 2 when the slot stays empty
- Applicable anti-patterns:
  - Layout-shifting build animations (docs/anti-patterns.md): filling the footer slot must move no box
  - Raw values instead of tokens: the CSS change uses no color, shadow or pixel literal (`pnpm check:tokens`)
  - Weakening tests to get a green run: no file under `tests/` is edited, skipped or loosened; specs asserting the old names are updated afterwards by the test pair
  - Mixing the two registers: the footer slot stays page-register text; the dock keeps its aria-hidden status, log and hint
  - Publishing private data: no private datum is added to copy or docs
- Applicable architectural rules:
  - Docs first: update docs/ (and docs/decisions.md) before code (docs/context/constraints.md, CLAUDE.md)
  - Plain CSS with token custom properties, no CSS framework; interface copy lives only in `src/strings.ts`
  - The build layer is an overlay and stays `aria-hidden` except the dock's group controls (B24); the footer slot is reserved in the static HTML
  - v1 scope is closed: no new features, only these two defects
- Result: PROCEED
```

## Source

Stage 3 runtime controls fix: footer slot layout and speed label. Two implementation defects found by the Stage 3 Phase 4 test-after review, both against the APPROVED PRD PRPs/prds/stage-3-runtime.prd.md. (1) The footer build summary slot moves boxes when it fills (PRD AC-4 'the final layout never moves', AC-17 and the Architecture note 'Footer.tsx gets an empty slot for the build summary in the static HTML, reserved so that filling it moves nothing'). src/components/page/Footer.css:26-28 reserves only min-height for .sp-footer-build, while .sp-footer-inner (Footer.css:6-16) is a wrapping flex row with justify-content: space-between, so the slot's width changes when the runtime writes 'Built live in <t>s · ↻ Replay' (src/components/build/FooterBuild.ts) and the other footer items shift: measured, the empty p.sp-footer-build sits at x=1208 while building and at x=1148.75 once filled; tests/e2e/controls-done-replay.spec.ts:80 sees a box move by 176.6 px and tests/e2e/build-layer-layout.spec.ts:64 and tests/e2e/effects-layout.spec.ts:44 by 59.25 px. Reserve the slot's box so that filling it moves no other box at 1280x800 and 375x812, without JavaScript too (the static footer must look like Stage 2 when the slot stays empty, AC-15). (2) axe label-content-name-mismatch on the dock speed button (PRD AC-18 zero violations): button[data-dock-action="speed"] shows the glyph '1×' (also '2×', '∞'; src/strings.ts speedGlyph, set in src/components/build/CommandDock.ts) while its aria-label is 'Build speed: 1x. Switch to 2x' (strings.ts speedLabel, letter x), so the visible text is not part of the accessible name (WCAG 2.5.3 Label in Name). PRD AC-13 quotes the name as an example ('Build speed: 1x. Switch to 2x', …); keep its structure and make the visible text part of the name (for example 'Build speed: 1×. Switch to 2×' and an infinity state that contains '∞'), confirming with axe on all three states, and record the wording change in docs first (docs/decisions.md entry plus wherever docs/ quote the names, e.g. docs/api-reference.md, docs/02-experience.md, docs/domain/areas/build.md) as an owner-visible decision. Change no test file: the Phase 4 test pair updates any spec that asserts the old names afterwards.

R8b does not apply in description mode — no (PRD AC-N) token required. Context only (not a source PRD, no back-fill): `PRPs/prds/stage-3-runtime.prd.md` AC-4, AC-13, AC-15, AC-17, AC-18.

## Summary

Two small production fixes plus a docs-first pass. (1) `.sp-footer-build` becomes a slot whose own box does not depend on its content: on wide viewports it takes `flex: 1 1 0` (the leftover row width, right-aligned content) so filling it changes nothing outside its own children, and under 768 px it keeps its existing full-row basis (`flex-basis: 100%`). An empty slot is an invisible empty paragraph, so the static footer still looks like Stage 2 with or without JavaScript. (2) `buildStrings.speedLabel` in `src/strings.ts` is reworded so each accessible name contains the button's visible glyph (`1×`, `2×`, `∞`), keeping the "Build speed: <state>. Switch to <next>" structure; `CommandDock.ts` already reads both strings, so no component change is needed. The wording change and the slot rule are recorded first in `docs/` (build rules B27 and B28, the experience and architecture docs, and a `docs/decisions.md` entry). No file under `tests/` changes.

Decision (slot width by growth, not by a fixed width), with evidence:

- Footer.css:6-16 is a wrapping flex row with `justify-content: space-between`; the empty slot has width 0 and sits at the right edge, so when text arrives the slot's left edge moves left (x 1208 to 1148.75, measured). A hard-coded `min-width` would have to guess the longest summary (`Built live in 12.3s · ↻ Replay`) in every font and theme and would break on 375 px. Letting the slot absorb the free row width (`flex: 1 1 0`) makes its box equal "the rest of the row" in both states, whatever the text, and the meta item stays at the left edge as in Stage 2.
- Under 768 px the slot already wraps to its own full-width line (`flex-basis: 100%`, Footer.css:52-54); its box is fixed there too, so only its content alignment needs stating (`justify-content: flex-start`, the current look).
- The text and the Replay button are children of the slot and exist only after the fill; the guarantee is on every box that exists in the static page, including the slot itself.

Decision (names keep their structure), with evidence: PRD AC-13 quotes the names as examples and asks for state plus next state. Replacing the ASCII `x` with the visible `×` (U+00D7) and writing the infinity state as `∞ (instant)` makes each accessible name contain the button text as a substring, which is what WCAG 2.5.3 (axe `label-content-name-mismatch`) checks, with no change to the visual glyphs.

## User Story

As a visitor (including a screen reader or speech-input user)
I want the footer to stay put when the build summary appears and the speed button's name to include what I see on it
So that the page never shifts under me and I can say "1×" or "∞" to activate the control.

## Problem Statement

(1) `.sp-footer-build` (`src/components/page/Footer.css:26-28`) reserves only a minimum height. When the runtime writes `Built live in <t>s · ↻ Replay` into it (`FooterBuild.ts:14-27`), its width grows inside a `space-between` flex row (`Footer.css:6-16`) and its box moves (measured x=1208 empty, x=1148.75 filled; specs saw moves of 176.6 px and 59.25 px). This violates "the final layout never moves" (PRD AC-4, AC-17).

(2) The dock speed button shows `1×`, `2×` or `∞` (`strings.ts:76-77`) while its `aria-label` says `Build speed: 1x. Switch to 2x` (`strings.ts:78-83`), so the visible text is not part of the accessible name: axe reports `label-content-name-mismatch` (WCAG 2.5.3), against PRD AC-18 (zero violations).

## Solution Statement

Record the decisions first (docs), then make `.sp-footer-build` absorb the free row width (`flex: 1 1 0; min-width: 0; justify-content: flex-end`, with `justify-content: flex-start` under 768 px) and reword `speedLabel` so each name contains its glyph. Verify with a real build, a Playwright box-diff script at 1280x800 and 375x812 (static no-JS, building and filled), and axe on all three speed states.

## Metadata

| Key | Value |
|-----|-------|
| Type | Bug fix |
| Complexity | Low |
| Systems Affected | footer styling (`src/components/page/Footer.css`); interface copy (`src/strings.ts`); docs (build area rules, experience, architecture, decisions) |
| Dependencies | none new; existing Astro, Playwright, `@axe-core/playwright` toolchain |
| Estimated Tasks | 5 |
| Source PRD line ref | none (description mode); context: PRPs/prds/stage-3-runtime.prd.md AC-4, AC-13, AC-15, AC-17, AC-18 |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `src/components/page/Footer.css` | 1-55 | The flex row, the `.sp-footer p` flex rule and the slot rule plus the under-768 px override to change |
| P0 | `src/components/page/Footer.tsx` | 13-34 | Where the empty slot `p.sp-footer-build[data-footer-build]` is rendered after the meta paragraph (unchanged) |
| P0 | `src/components/build/FooterBuild.ts` | 9-32 | How the runtime fills (`replaceChildren`) and clears the slot; confirms the fill only adds children |
| P0 | `src/strings.ts` | 65-104 | `speedGlyph` and `speedLabel`, the only copy to change |
| P0 | `src/components/build/CommandDock.ts` | 62-94, 201-212 | Where the speed button gets its glyph (`textContent`) and name (`aria-label`) from `strings.ts`, initially and on `setSpeed` |
| P0 | `docs/domain/areas/build.md` | 28-35 | Rule table where B27 and B28 are appended after B26 |
| P0 | `docs/decisions.md` | 198-234 | Entry shape and the place (before the template comment, after the Phase 4 entry) for the new decision |
| P1 | `docs/02-experience.md` | 119, 296 | The speed-cycle paragraph and the "Reserved space" row to extend |
| P1 | `docs/06-architecture.md` | 130-132 | "Dock accessibility" paragraph that quotes `Build speed: 1x. Switch to 2x` |
| P1 | `docs/context/architecture.md` | 42 | The `src/components/page/` row that describes the `buildSlot` reserved line |
| P1 | `docs/api-reference.md` | 38-44 | Controls API and build data contract: `data-build-speed` values `1`, `2`, `inf` (no accessible name is quoted; checked, no change needed unless the implementer finds one) |
| P1 | `tests/e2e/support/home.ts` | 7-13, 120 | The project's axe tag list (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) reused by Level 3 (read only, never edited) |
| P1 | `playwright.config.ts` | 3-18 | `astro preview` on 127.0.0.1:4321 with `reuseExistingServer`; Level 3 starts its own preview on 4399 and never touches 4321 |

## Patterns to Mirror

```css
# SOURCE: src/components/page/Footer.css:25-28
/* Reserved line for the build summary (filled later, so nothing moves). */
.sp-footer-build {
  min-height: calc(var(--text-sm) * 1.5);
}
```
Task 3 extends this rule (same comment style, same token-based `min-height`).

```css
# SOURCE: src/components/page/Footer.css:45-55
/* Side padding: 32px, 16px under 768px. */
@media (max-width: 767px) {
  .sp-footer-inner {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }

  .sp-footer-build {
    flex-basis: 100%;
  }
}
```
Task 3 keeps this block and adds the content alignment inside the existing `.sp-footer-build` override.

```ts
# SOURCE: src/strings.ts:76-83
  speedGlyph: (speed: Speed) =>
    speed === 'inf' ? '∞' : speed === '2' ? '2×' : '1×',
  speedLabel: (speed: Speed) =>
    speed === 'inf'
      ? 'Build speed: instant. Switch to 1x'
      : speed === '2'
        ? 'Build speed: 2x. Switch to instant'
        : 'Build speed: 1x. Switch to 2x',
```
Task 4 rewrites only the three `speedLabel` literals in this same nested-ternary shape.

```markdown
# SOURCE: docs/domain/areas/build.md:34
| B26 | **The build layer never widens the document**: its roots clip horizontal overflow (`overflow-x: clip`, vertical stays visible), so no overlay piece (handles, windows, skeletons, text overlays) can create horizontal scroll; `clip`, not `hidden`, so the sticky window bars keep working |
```
Task 1 copies this table-row shape for rules B27 and B28.

```markdown
# SOURCE: docs/decisions.md:207-214
## [2026-11-08] Build layer clips horizontal overflow

**Context:** A selection box drawn at the 375 px viewport edge made `scrollWidth` 377 against `clientWidth` 375 during the hero build, so the page scrolled sideways.
**Decision:** ...
**Reason:** ...
**Areas affected:** build, visual-design

---
```
Task 2 copies this entry shape for the new decision.

```ts
# SOURCE: tests/e2e/support/home.ts:7-13
const AXE_TAGS = ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
```
(paraphrased shape from the cited lines; the exact tag list is in the file). Task 5 and Level 3 reuse these five tags in the axe check.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `docs/domain/areas/build.md` | UPDATE | Add rules B27 (footer slot box is content-independent) and B28 (the speed button's accessible name contains its visible glyph); docs first |
| `docs/02-experience.md` | UPDATE | Extend the "Reserved space" row with the footer slot and the speed paragraph with the accessible names |
| `docs/06-architecture.md` | UPDATE | Replace the quoted `Build speed: 1x. Switch to 2x` with the new names in "Dock accessibility" |
| `docs/context/architecture.md` | UPDATE | Describe that the footer slot absorbs the free row width so its box never depends on its content |
| `docs/decisions.md` | UPDATE | Owner-visible decision: wording change of the three speed names and the slot rule |
| `src/components/page/Footer.css` | UPDATE | Make `.sp-footer-build`'s box independent of its content |
| `src/strings.ts` | UPDATE | Reword `buildStrings.speedLabel` so each name contains its visible glyph |

## NOT Building (Scope Limits)

- No change to any file under `tests/`: the implementer does not edit, add, skip or loosen any test (R-X). Specs asserting the old names (`tests/e2e/controls-speed.spec.ts`, `tests/e2e/controls-dock-a11y.spec.ts:30`, `tests/unit/runtime-controls-timing.test.ts:35-41`, possibly `tests/unit/content-copy.test.ts` and other new Phase 4 specs) fail until the Phase 4 test pair updates them; this is expected and out of scope. The full `pnpm test:e2e` run is not a Level of this plan.
- No change to `Footer.tsx`, `FooterBuild.ts`, `CommandDock.ts`, `layer.ts`, any runtime or effects code, or the glyphs (`speedGlyph` stays `1×`, `2×`, `∞`).
- No fixed or guessed `min-width`/`width` for the slot and no JavaScript measuring of the summary text.
- No change to the replay, skip, play or expand button names, to the `Site build` group name, or to the theme toggle names.
- No change to the order or structure "Build speed: <state>. Switch to <next>" (PRD AC-13) beyond making the visible text part of the name.
- No other responsive, theme, token or footer content change; no new effects or v1.1 features.

## Step-by-Step Tasks

### Task 1: UPDATE docs/domain/areas/build.md, docs/02-experience.md, docs/06-architecture.md and docs/context/architecture.md (docs first)

- **ACTION**: Delivers AC-A4. Use narrow `Edit` calls and change nothing else.
  1. `docs/domain/areas/build.md`: append two rows directly after the B26 row (line 34) of the rules table, in the same `| B<n> | ... |` shape:
     `| B27 | **The footer slot never moves anything**: the reserved build-summary slot takes the free width of the footer row (its box does not depend on its content), so filling it with the summary and Replay moves no other box, with or without JavaScript, at every viewport width |`
     `| B28 | **A control's accessible name contains its visible text** (WCAG 2.5.3): the speed button names its state and the next one with the same glyph it shows, `Build speed: 1×. Switch to 2×`, `Build speed: 2×. Switch to instant` and `Build speed: ∞ (instant). Switch to 1×` |`
  2. `docs/02-experience.md`: in the Behavior rules row `**Reserved space**` (line 296) append at the end of its description cell, before the closing ` |`: ` The footer's build-summary slot is reserved the same way: it takes the free width of the footer row, so the summary and Replay appear without moving any box.` In the paragraph at line 119 (`Clicking the speed cycles through ...`) append after its second sentence: ` The speed button's accessible name repeats what it shows: `Build speed: 1×. Switch to 2×`, `Build speed: 2×. Switch to instant`, `Build speed: ∞ (instant). Switch to 1×`.`
  3. `docs/06-architecture.md` (line 132, "Dock accessibility"): replace `"Build speed: 1x. Switch to 2x" (and its two siblings)` with `"Build speed: 1×. Switch to 2×" (and its two siblings, which also repeat the visible glyph)`.
  4. `docs/context/architecture.md` (line 42, the `src/components/page/` row): extend the sentence about `buildSlot` so it ends with: `; the slot takes the free width of the footer row, so filling it moves nothing`.
- **MIRROR**: `# SOURCE: docs/domain/areas/build.md:34` (row shape).
- **VALIDATE**: `set -euo pipefail; grep -qF '| B27 | **The footer slot never moves anything**' docs/domain/areas/build.md; grep -qF '| B28 | **A control' docs/domain/areas/build.md; grep -qF 'Build speed: ∞ (instant). Switch to 1×' docs/02-experience.md; grep -qF '"Build speed: 1×. Switch to 2×"' docs/06-architecture.md; grep -qF 'filling it moves nothing' docs/context/architecture.md; pnpm exec prettier --check docs/domain/areas/build.md docs/02-experience.md docs/06-architecture.md docs/context/architecture.md` (text matches are legitimate here: the deliverable IS documentation prose; each literal is copied byte-for-byte from this task's ACTION; prettier's exit code checks formatting).

### Task 2: UPDATE docs/decisions.md (docs first, owner-visible decision)

- **ACTION**: Delivers AC-A4. In `docs/decisions.md`, add a new entry before the `<!-- Template for future entries:` comment, after the Phase 4 entry's `---` separator, titled exactly `## [2026-11-08] Footer slot reserves its width and the speed button name contains its glyph`, with the four fields: **Context** (the Stage 3 Phase 4 test-after review found two defects: the footer build-summary slot moved boxes when it filled, up to 176.6 px, against PRD AC-4 and AC-17; and axe reported `label-content-name-mismatch` on the dock speed button, against AC-18, because its visible `1×`, `2×`, `∞` was not part of its name `Build speed: 1x. Switch to 2x`); **Decision** (the footer slot takes the free width of the footer row so its box no longer depends on its content, with the same look as Stage 2 while empty; the three speed button names change to `Build speed: 1×. Switch to 2×`, `Build speed: 2×. Switch to instant` and `Build speed: ∞ (instant). Switch to 1×`, keeping the PRD AC-13 structure (state, then next state); this wording change is owner-visible and the glyphs are unchanged); **Reason** (the final layout never moves; WCAG 2.5.3 Label in Name lets speech-input users say what they see; a fixed width would guess the summary length and fail on mobile; the PRD quotes the names as examples, so the structure is kept and only the characters change); **Areas affected** (build, visual-design). End the entry with the `---` separator. Make this edit after Task 1 so the rules exist first.
- **MIRROR**: `# SOURCE: docs/decisions.md:207-214` (entry shape).
- **VALIDATE**: `set -euo pipefail; grep -qF '## [2026-11-08] Footer slot reserves its width and the speed button name contains its glyph' docs/decisions.md; grep -qF 'Build speed: ∞ (instant). Switch to 1×' docs/decisions.md; pnpm exec prettier --check docs/decisions.md` (text match is legitimate: the deliverable IS documentation prose; the literals are copied from this task's ACTION).

### Task 3: UPDATE src/components/page/Footer.css

- **ACTION**: Delivers AC-A1 and AC-A2. In the `.sp-footer-build` rule (lines 25-28) keep the `min-height` and add, after it: `flex: 1 1 0;`, `min-width: 0;` and `justify-content: flex-end;`; update the comment above it to: `/* Reserved slot for the build summary: it takes the free width of the footer row, so its box never depends on its content and filling it moves nothing (B27). Empty, it is invisible. */`. In the existing `.sp-footer-build` override inside `@media (max-width: 767px)` (lines 52-54) keep `flex-basis: 100%;` and add `justify-content: flex-start;` (the slot already owns a full line there; this keeps the current left-aligned look). Use only these declarations: no color, shadow or pixel literal, no change to any other rule, `.sp-footer-inner`, `Footer.tsx` or any runtime file.
- **MIRROR**: `# SOURCE: src/components/page/Footer.css:25-28` and `# SOURCE: src/components/page/Footer.css:45-55`.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check src/components/page/Footer.css; pnpm check:tokens; pnpm build; node --input-type=module -e 'import { preview } from "astro"; import { chromium } from "@playwright/test"; const s = await preview({ root: process.cwd(), server: { host: "127.0.0.1", port: 4399 }, logLevel: "error" }); const b = await chromium.launch(); let bad = []; try { for (const [w, h] of [[1280, 800], [375, 812]]) { const box = async (js) => { const c = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js }); if (js) await c.addInitScript(() => localStorage.setItem("sp-speed", "inf")); const p = await c.newPage(); await p.goto("http://127.0.0.1:4399/"); if (js) await p.waitForSelector("[data-footer-build] button"); const r = await p.$eval("[data-footer-build]", (e) => { const q = e.getBoundingClientRect(); return [q.x + scrollX, q.y + scrollY, q.width, q.height]; }); await c.close(); return r; }; const a = await box(false); const f = await box(true); if (a.some((n, i) => Math.abs(n - f[i]) > 0.5)) bad.push(w + "px: slot box " + a + " -> " + f); } } finally { await b.close(); await s.stop(); } if (bad.length) { console.error("FAIL: " + bad.join("; ")); process.exit(1); } console.log("PASS: footer slot box is identical empty and filled");'` (builds fresh, then measures the slot's own box with JavaScript off (empty) and in instant mode (filled) at both viewports; the exit code carries the result; it starts its own preview on 4399 and never touches 4321).

### Task 4: UPDATE src/strings.ts

- **ACTION**: Delivers AC-A3. In `buildStrings.speedLabel` (lines 78-83) replace only the three literals, keeping the nested-ternary shape and leaving `speedGlyph` untouched: `inf` → `'Build speed: ∞ (instant). Switch to 1×'`; `'2'` → `'Build speed: 2×. Switch to instant'`; default (`'1'`) → `'Build speed: 1×. Switch to 2×'`. The `×` is U+00D7 and the `∞` is U+221E, the same characters `speedGlyph` returns. `CommandDock.ts` already feeds both strings to the button (initially and in `setSpeed`), so no other file changes. Do not edit `speedGlyph` and do not touch any test.
- **MIRROR**: `# SOURCE: src/strings.ts:76-83`.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check src/strings.ts; pnpm check; pnpm build; node --input-type=module -e 'import { preview } from "astro"; import { chromium } from "@playwright/test"; const s = await preview({ root: process.cwd(), server: { host: "127.0.0.1", port: 4399 }, logLevel: "error" }); const b = await chromium.launch(); let bad = []; try { for (const [sp, glyph] of [["1", "1×"], ["2", "2×"], ["inf", "∞"]]) { const c = await b.newContext(); await c.addInitScript((v) => localStorage.setItem("sp-speed", v), sp); const p = await c.newPage(); await p.goto("http://127.0.0.1:4399/"); await p.waitForSelector("button[data-dock-action=\"speed\"]", { state: "attached" }); const r = await p.$eval("button[data-dock-action=\"speed\"]", (e) => [e.textContent, e.getAttribute("aria-label")]); if (r[0] !== glyph || !r[1].includes(glyph) || !r[1].startsWith("Build speed: ")) bad.push(sp + ": " + JSON.stringify(r)); await c.close(); } } finally { await b.close(); await s.stop(); } if (bad.length) { console.error("FAIL: " + bad.join("; ")); process.exit(1); } console.log("PASS: every speed name contains its visible glyph");'` (consumes the built page: reads the real button's text and name for each saved speed; exit code carries the result; own preview on 4399).

### Task 5: Verify the full gate set without editing anything

- **ACTION**: Delivers AC-A1 to AC-A5. Run `## Validation Commands` Levels 1-3 from the worktree root in order. Do not edit any file in this task. The only tolerated failures are the specs and tests that assert the OLD speed names (see `## NOT Building`): in Level 2 exactly `tests/unit/runtime-controls-timing.test.ts` "names the button after the current state and the one it switches to"; the e2e specs are not run by this plan. Do not edit tests and do not report those as plan defects. Any other failing check is a real regression: fix it in `src/components/page/Footer.css` or `src/strings.ts` only.
- **MIRROR**: `# SOURCE: src/components/page/Footer.css:45-55` (confirms the mobile override is the only other slot rule; nothing is copied).
- **VALIDATE**: run Level 3 of `## Validation Commands` below (it exits non-zero on any footer box move or any `label-content-name-mismatch`).

## Validation Commands

All commands run from the worktree root `C:/repos/site-pro/.worktrees/stage-3-runtime` (Git Bash or any POSIX shell; the Node snippets are cross-platform). Level 3 starts its own `astro preview` on 127.0.0.1:4399; it never requires 127.0.0.1:4321 to be free and never stops the process listening there. Level 2 runs `pnpm build` first, so Level 3 reads a fresh `dist/`.

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm check
pnpm lint
pnpm exec prettier --check src/components/page/Footer.css src/strings.ts docs/domain/areas/build.md docs/02-experience.md docs/06-architecture.md docs/context/architecture.md docs/decisions.md
pnpm check:tokens
pnpm check:privacy
# the implementer must not have touched tests/: nothing under tests/ is newer than the first docs file edited in Task 1
if [ -n "$(find tests -type f -newer docs/domain/areas/build.md)" ]; then
  echo "FAIL: a file under tests/ changed after Task 1 (R-X)"; exit 1
else
  echo "PASS: no test file touched"
fi
```

### Level 2: UNIT_TESTS (+ build and budgets)

```bash
set -euo pipefail
# Vitest: the ONLY allowed failure is the unit test asserting the OLD speed names
# (expected, out of scope; the Phase 4 test pair updates it afterwards; NOT a plan defect).
rm -f .vitest-full.json
pnpm exec vitest run --reporter=json --outputFile=.vitest-full.json > /dev/null || true
node -e '
const r = require("./.vitest-full.json");
const bad = [];
for (const f of r.testResults ?? []) {
  for (const a of f.assertionResults ?? []) {
    if (a.status === "failed") bad.push(f.name.replace(/\\/g, "/").split("/").slice(-1)[0] + " > " + a.title);
  }
}
const allowed = ["runtime-controls-timing.test.ts > names the button after the current state and the one it switches to"];
const extra = bad.filter((b) => !allowed.includes(b));
if (!(r.numTotalTests > 0) || extra.length) {
  console.error("FAIL: tests=" + r.numTotalTests + " unexpected failures: " + extra.join(", "));
  process.exit(1);
}
console.log("PASS: " + r.numTotalTests + " tests; tolerated failures: " + (bad.join(", ") || "none"));
'
rm -f .vitest-full.json
pnpm build
pnpm check:budgets
```

The JSON reporter is pinned (`--reporter=json`, `--outputFile`), so the failure set is read from Vitest's machine-readable report (`testResults[].assertionResults[]` with `status` and `title`), never scraped from a human-readable format. The `|| true` only lets the report be written; the Node block exits non-zero on an empty run or any failure other than the one tolerated test. A suite-level crash yields no passing tests for that file and, if it fails collection, shows up as an empty or short run; the implementer also reads the `pnpm exec vitest run` summary on any doubt.

### Level 3: INTEGRATION (box-diff and axe against dist/)

Requires `pnpm build` (Level 2) to have produced `dist/`. Both blocks start their own preview on port 4399 and stop it in `finally`.

```bash
set -euo pipefail
# (a) Footer: record every footer box and the page boxes before and after the slot fills; assert nothing moved.
node --input-type=module - <<'EOF'
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const URL = 'http://127.0.0.1:4399/';
const server = await preview({ root: process.cwd(), server: { host: '127.0.0.1', port: 4399 }, logLevel: 'error' });
const browser = await chromium.launch();
const failures = [];

const snap = (page) =>
  page.evaluate(() => {
    const out = {};
    const count = {};
    const add = (key, e) => {
      count[key] = (count[key] ?? 0) + 1;
      const r = e.getBoundingClientRect();
      out[key + '#' + count[key]] = [r.x + scrollX, r.y + scrollY, r.width, r.height].map((n) => Math.round(n * 100) / 100);
    };
    add('main', document.querySelector('main') ?? document.body);
    document.querySelectorAll('main > section').forEach((e) => add('section:' + e.id, e));
    add('footer', document.querySelector('.sp-footer'));
    document.querySelectorAll('.sp-footer *').forEach((e) => add(e.tagName + '.' + e.className, e));
    out['doc#1'] = [0, 0, document.documentElement.scrollWidth, document.documentElement.scrollHeight];
    return out;
  });

const open = async (viewport, { js, speed, wait }) => {
  const ctx = await browser.newContext({ viewport, javaScriptEnabled: js });
  if (speed) await ctx.addInitScript((v) => localStorage.setItem('sp-speed', v), speed);
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForSelector('[data-footer-build]', { state: 'attached' });
  if (wait === 'filled') {
    await page.waitForSelector('[data-footer-build] button');
    await page.waitForTimeout(300);
  }
  if (wait === 'empty') {
    const n = await page.$eval('[data-footer-build]', (e) => e.childElementCount);
    if (n !== 0) throw new Error('building baseline is not empty: the slot was already filled');
  }
  const boxes = await snap(page);
  await ctx.close();
  return boxes;
};

try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
    const tag = viewport.width + 'x' + viewport.height;
    const filled = await open(viewport, { js: true, speed: 'inf', wait: 'filled' });
    if (!('BUTTON.sp-footer-replay#1' in filled)) failures.push(tag + ': the slot was not filled with Replay');
    const baselines = {
      'static (no JavaScript)': await open(viewport, { js: false }),
      'building (slot empty)': await open(viewport, { js: true, wait: 'empty' }),
    };
    for (const [name, before] of Object.entries(baselines)) {
      if (!Object.keys(before).some((k) => k.startsWith('P.sp-footer-build'))) {
        failures.push(tag + ' ' + name + ': the empty slot p.sp-footer-build is missing from the static footer');
      }
      for (const [key, a] of Object.entries(before)) {
        const b = filled[key];
        if (!b) { failures.push(tag + ' ' + name + ': ' + key + ' disappeared'); continue; }
        if (a.some((n, i) => Math.abs(n - b[i]) > 0.5)) failures.push(tag + ' ' + name + ': ' + key + ' moved ' + a + ' -> ' + b);
      }
    }
  }
} finally {
  await browser.close();
  await server.stop();
}
if (failures.length) { console.error('FAIL:\n' + failures.join('\n')); process.exit(1); }
console.log('PASS: no footer or page box moved when the slot filled, at 1280x800 and 375x812');
EOF

# (b) Axe: the speed button in each speed state, project WCAG tags, zero label-content-name-mismatch.
node --input-type=module - <<'EOF'
import { preview } from 'astro';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const RULE = 'label-content-name-mismatch';
const SPEED = 'button[data-dock-action="speed"]';
const server = await preview({ root: process.cwd(), server: { host: '127.0.0.1', port: 4399 }, logLevel: 'error' });
const browser = await chromium.launch();
const failures = [];

try {
  for (const [saved, glyph] of [['1', '1×'], ['2', '2×'], ['inf', '∞']]) {
    const context = await browser.newContext();
    await context.addInitScript((v) => localStorage.setItem('sp-speed', v), saved);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4399/');
    // Check what a visitor meets, un-hiding nothing. For 1x and 2x the button is rendered once the boot is over
    // and the dock is shown (building/created/idle states), so wait until it is actually visible. In instant
    // mode (inf) the build finishes at once and the dock is collapsed with the speed button hidden, so a visitor
    // never meets a rendered infinity button: check its glyph and name only, and do not require the rule to run.
    const rendered = saved !== 'inf';
    await page.waitForSelector(SPEED, rendered ? { state: 'visible', timeout: 30000 } : { state: 'attached' });
    const [text, name] = await page.$eval(SPEED, (e) => [e.textContent, e.getAttribute('aria-label')]);
    if (text !== glyph || !name.includes(glyph) || !name.startsWith('Build speed: ')) failures.push(saved + ': text ' + JSON.stringify(text) + ' is not part of the name ' + JSON.stringify(name));

    // All project WCAG tags on the dock: zero violations of any rule.
    const tagged = await new AxeBuilder({ page }).include('.sp-dock').withTags(TAGS).analyze();
    for (const v of tagged.violations) failures.push(saved + ': axe violation ' + v.id + ' on the dock');

    // The 2.5.3 rule itself (experimental in axe, so run it by name): zero violations always; for the rendered
    // states (1x, 2x) it must also have evaluated the button (in passes). Not required for inf (button not rendered).
    const named = await new AxeBuilder({ page }).include('.sp-dock').withRules([RULE]).analyze();
    for (const v of named.violations) failures.push(saved + ': ' + v.id + ' ' + JSON.stringify(v.nodes.map((n) => n.target)));
    if (rendered) {
      const ran = named.passes.find((p) => p.id === RULE);
      if (!ran || ran.nodes.length === 0) failures.push(saved + ': ' + RULE + ' did not evaluate the speed button (it must be in passes)');
    }
    await context.close();
  }

  // Real cycle: click the speed button 1× -> 2× -> ∞ in a live build and read text and name after every click.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4399/');
  await page.waitForSelector(SPEED, { state: 'visible', timeout: 30000 });
  for (const glyph of ['2×', '∞']) {
    await page.click(SPEED);
    await page.waitForFunction(
      ([sel, g]) => { const e = document.querySelector(sel); return e.textContent === g && e.getAttribute('aria-label').includes(g); },
      [SPEED, glyph],
      { timeout: 5000 },
    ).catch(() => failures.push('cycle: after the click the name never contained ' + glyph));
    if (glyph === '2×') {
      // Right after the 2x click the button is still visible: the rule must run on it by name and pass.
      const live = await new AxeBuilder({ page }).include('.sp-dock').withRules([RULE]).analyze();
      for (const v of live.violations) failures.push('cycle 2x: ' + v.id + ' ' + JSON.stringify(v.nodes.map((n) => n.target)));
      const ran = live.passes.find((p) => p.id === RULE);
      if (!ran || ran.nodes.length === 0) failures.push('cycle 2x: ' + RULE + ' did not evaluate the visible speed button (it must be in passes)');
    }
  }
  await context.close();
} finally {
  await browser.close();
  await server.stop();
}
if (failures.length) { console.error('FAIL:\n' + failures.join('\n')); process.exit(1); }
console.log('PASS: zero label-content-name-mismatch and zero dock violations in all three speed states');
EOF
```

Grounding: the `AxeBuilder({ page })` import, the five tags and `new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()` come from `tests/e2e/support/home.ts:4, 7-13, 120`; `@axe-core/playwright` needs `browser.newContext()` before `newPage()`, which both blocks do. The slot selector `[data-footer-build]` and the classes `p.sp-footer-build` / `button.sp-footer-replay` come from `Footer.tsx:29` and `FooterBuild.ts:19` (the snapshot keys `P.sp-footer-build…` and `BUTTON.sp-footer-replay#1` are `tagName + '.' + className`, tag names being upper-case in the DOM). The speed button selector and its glyph/name sources are `CommandDock.ts:68-85` and `strings.ts:76-83`; the saved speed key `sp-speed` is `SPEED_STORAGE_KEY` (`docs/context/architecture.md:45`, `docs/api-reference.md:44`). Pass/fail comes only from each block's own exit code (`process.exit(1)` on any recorded failure; `set -e` propagates it).

## Acceptance Criteria

- **AC-A1:** Filling the footer build-summary slot moves no box: for every footer element and the page boxes (`main`, `main > section`, `.sp-footer`, document size) that exist in the static page, the position and size are equal (within 0.5 px) before and after the fill, at 1280x800 and 375x812, both against the no-JavaScript static page and against the JavaScript page while building with an empty slot (Level 3 (a)).
- **AC-A2:** The static footer looks like Stage 2 when the slot stays empty: the empty `p.sp-footer-build` stays in the static HTML, is invisible (no text, no border, no background) and the meta item stays at the left edge; the change uses no color, shadow or pixel literal (`pnpm check:tokens`).
- **AC-A3:** The speed button's accessible name contains its visible text in all three states (`1×`, `2×`, `∞`), keeps the "Build speed: <state>. Switch to <next>" structure, and axe reports zero violations (project WCAG tags) and zero `label-content-name-mismatch` on the dock in each state (Level 3 (b)).
- **AC-A4:** The slot rule (B27), the label-in-name rule (B28), the experience, architecture and dock-accessibility wording, and an owner-visible `docs/decisions.md` entry for the wording change are recorded before the code change.
- **AC-A5:** No file under `tests/` is changed; the dock keeps its aria-hidden status, log and hint; `pnpm check`, `pnpm lint`, Prettier, `pnpm check:tokens`, `pnpm check:privacy`, `pnpm build` and `pnpm check:budgets` pass; `pnpm test` passes except the one declared out-of-scope unit test that asserts the old names.

R8b (PRD AC-N token check) does not apply in description mode.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `flex: 1 1 0` changes the footer look when the slot is empty (meta shifts or the row grows) | Low | Medium | The empty slot has no content and only `min-height`; Level 3 (a) compares the static no-JS footer boxes against the filled ones, and the meta item keeps its left edge as with `space-between` and one item |
| The slot's filled text wraps or overflows its box at 375 px, moving the row height | Low | Medium | Under 768 px the slot already owns a full line (`flex-basis: 100%`); the summary is one short line (`Built live in 12.3s · ↻ Replay`) and Level 3 (a) compares heights as well as positions |
| Level 3 (b) cannot see the speed button because the dock hides it in the done state (instant mode finishes at once) | Medium | Medium | The script un-hides nothing: for saved 1× and 2× it waits until the button is actually visible (boot over, dock shown) and requires the rule in `passes`; for ∞ (button never rendered, dock collapsed) it checks glyph, name and zero violations only; it also drives a real 1× to 2× to ∞ click cycle with a by-name axe run right after the 2× click, requiring the rule in `passes` |
| `label-content-name-mismatch` is experimental in axe and is not run by `withTags` alone | Medium | High | The script runs it explicitly with `withRules` and asserts it evaluated the button, so a skipped rule cannot pass silently |
| A stale `dist/` is served (Level 3 would test old CSS or copy) | Medium | High | Level 2 runs `pnpm build` immediately before Level 3, and each Task 3/4 VALIDATE builds first; the scripts use their own preview on port 4399, never the possibly stale 4321 server |
| Port 4399 is already in use | Low | Low | `preview()` fails to start and the block exits non-zero; the implementer picks another free port (the scripts hard-code 4399 only in one constant per file) |
| The implementer edits the old-name specs to get green or reports them as plan defects | Medium | Medium | The plan names them as expected, out-of-scope failures; Level 2 tolerates exactly one named unit test; no task edits tests; the e2e suite is not a Level |
| The `×` or `∞` is saved as a different character by the editor, so the name stops containing the glyph | Low | Medium | Task 4 states the code points; Task 4's VALIDATE and Level 3 (b) compare the rendered name against the real glyph |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework. (Level 2 and the Level 3 scripts still run the existing Vitest suite and drive Playwright and axe as end-to-end checks; running a suite or a script is not authoring a test file.)
- Test guardrail (docs/context/testing.md): suites covering this change are Playwright E2E (`tests/e2e/`, including axe) and Vitest (`tests/unit/`). Expected stale assertions to update afterwards by the test pair, not by the Implementer: `tests/e2e/controls-speed.spec.ts:43, 52, 62, 74, 140, 145`, `tests/e2e/controls-dock-a11y.spec.ts:30`, `tests/unit/runtime-controls-timing.test.ts:35-41`, and possibly other new Phase 4 specs that quote the old names. The three specs that measured the slot move (`tests/e2e/controls-done-replay.spec.ts:80`, `tests/e2e/build-layer-layout.spec.ts:64`, `tests/e2e/effects-layout.spec.ts:44`) assert the intended behavior and should turn green with this fix; they are read-only here. The full `pnpm test:e2e` run is not a Level of this plan.
- Verification detail: in the Level 1 `find ... -newer` check, `docs/domain/areas/build.md` is the reference file because Task 1 edits it first; do not re-save it after the later tasks.
- Why the box is checked in three states: the reported defect was "empty while building (x=1208) versus filled (x=1148.75)", and the no-JS static page must equal the Stage 2 look (PRD AC-15), so Level 3 (a) uses both the static no-JS page and the live building page as the "before".

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
