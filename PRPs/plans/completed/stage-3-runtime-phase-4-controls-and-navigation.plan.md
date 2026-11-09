# Feature: Controls and navigation (Phase 4 of stage-3-runtime)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (controls API and stores for Stage 5, a rebuildable show lifecycle for Replay and Play build, one extra idle-time frame subscription); cross-cutting patterns (one overlay root, data-* contract, nanostores state, budgets); creation of components (dock control buttons, footer build summary, window bar click, TypeScript DOM factories); impact on shared UI (the dock leaves the aria-hidden layer and gains real buttons, the static footer slot is filled, global keydown and focusin listeners); business rules for build (B6 turbo status, Skip, Run all, speed, Replay, Play build, focus rule, resize, scroll hint), navigation (N3, N7, N13) and visual-design (V9, V13, V14)
- Decisions found:
  - D2 Astro + React + TypeScript strict; the runtime and controls are plain TypeScript outside React, nanostores share state with islands
  - D6 full build on every visit; a saved infinity speed is the only persisted state (only `sp-speed` is stored)
  - D7 interactive dock and D8 agents are v1.1; the collapsed `❯_` only reopens the done state until the Stage 5 palette
  - D17 build windows, D19 the dock at the bottom center, D20 the dot grid only inside windows
  - Stage 2 approved: layout, content, section ids, labels, heading structure and the `data-build-target` hooks do not change
  - Stage 3 PRD approved 2026-11-08 (docs/decisions.md): turbo is x5, nav clicks and deep links use the browser's own anchor navigation while earlier sections catch up in turbo, the focus rule finishes the focused section and every one before it, only a width change counts as a resize, `Esc` with the mobile menu open only closes the menu, `Shift + Esc` is kept and checked on Chrome for Windows, the collapsed `❯_` reopens the done state, the footer summary and Replay arrive in a slot reserved in the static footer, the runtime runs only on `/`, only `sp-speed` is stored
  - Phases 1-3 complete: scheduler, compiler, clock, triggers, stores, layer, factories, effects and base scripts exist in the code root
  - docs/decisions.md 2026-11-08 "Build layer clips horizontal overflow": overlay roots use `overflow-x: clip`
- Applicable anti-patterns:
  - Scroll hijacking (the runtime moves the page only on Replay and Play build with one `window.scrollTo(0, 0)`; nav clicks and deep links stay browser anchor navigation, no click handler on links)
  - Many timers instead of one loop (no `setTimeout` or `setInterval`; idle hint, skip hold and done collapse run on one `requestAnimationFrame` subscription that is active only while the scheduler loop is stopped; the window `scroll` listener only resets the hint pulse and never drives the build)
  - Layout-shifting build animations (the footer summary fills a reserved slot; the collapsed dock changes position with no transition; nothing animates a layout property)
  - Hiding pending content with `display` or `visibility` (unchanged; the controls add no hiding of page content)
  - Mixing the two registers (the dock buttons are build-layer chrome, the footer Replay is the only control that sits in the page register and uses page tokens)
  - Raw values instead of tokens (check:tokens scans .css, .astro, .ts and .tsx)
  - Re-rendering React per typed character (controls are DOM factories)
  - Scope creep into v1 (no palette, `?` list, scroll-spy, toasts, window-dot close B25, interactive dock, analytics events)
  - Weakening tests to get a green run (the Implementer authors no tests and edits no existing test)
  - Publishing private data (new copy is control labels only)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - The build layer is one overlay root outside `<main>`; everything in it is aria-hidden except the dock's control buttons, which sit in a `role="group"` named "Site build"; the text content and accessibility tree of `<main>` stay equal to the no-JS page
  - SSG with progressive enhancement: no JS, reduced motion and a saved `∞` render the final page; the runtime reveals everything if it throws
  - One scheduler, one `requestAnimationFrame` loop while building, `IntersectionObserver` triggers, deterministic clock (`page.clock` in E2E), pause while hidden
  - The scheduler stays stable through Stage 4: Phase 4 only adds the control and queue-status surface the PRD assigns to it (docs/decisions.md records it)
  - Budgets: runtime + effects <= 18 KB gzip, critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB, Lighthouse >= 95, CLS about 0
  - Folder contract (docs/context/architecture.md): `src/runtime/` engine and controls, `src/components/build/` DOM factories, `src/stores/` nanostores, `src/strings.ts` copy
  - Docs first: docs/ is amended before code; relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-3-runtime.prd.md` — Implementation Phases row 4: "Controls and navigation" — Goal: The visitor is always in control, and every behavior rule holds. — Success signal: AC-3, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-12, AC-13, AC-14 and AC-17 pass.

## Summary

Phase 4 gives the visitor control over the show built in Phases 1-3. It first amends the docs (docs first), then adds a pure DOM-free module (`controls-timing.ts`) with the idle constants, the speed cycle, the key mapping and the queue position; extends the scheduler with `skip`, `runAll`, `finishThrough` and a `queued n/5` status callback (no change to its turbo or timing rules); turns the dock into a `role="group"` named "Site build" with real buttons (Skip, speed, Replay, Play build, the collapsed `❯_`) whose status text stays aria-hidden; adds a window title/command bar click that skips; fills the reserved footer slot with `Built live in <t>s · ↻ Replay` through a small factory; and rewires `layer.ts` for the new dock states (reduced and instant "ready" docks, the `queued n/5` text, the `✔ <Section> Section created` text after a skip, the 4 s scroll hint, the 4 s done-to-collapsed timer, the expand action). Three small DOM modules bind the inputs (one capture-phase `keydown` for `Esc` and `Shift + Esc` that yields to an open popover, a `focusin` rule, a width-only resize rule), and `main.ts` becomes a rebuildable show (`beginShow` / `endShow`) so Replay and Play build can tear down and start a fresh boot from the ready page, while a new `api.ts` exposes the controls and stores for Stage 5. Deep links and nav clicks need no new scroll code: the runtime attaches nothing to links, the existing 75% trigger queues every earlier section, and turbo catches them up; Level 3 proves it. The `Shift + Esc` check on real Chrome for Windows is an owner step recorded in docs/02 (the Playwright test proves only the handler).

## User Story

As a visitor watching the site build itself
I want to skip, run everything at once, change the speed, replay the show and jump anywhere with the keyboard, a link or the nav
So that the show never blocks reading, keyboard use or a screen reader, and I can always take over.

## Problem Statement

After Phase 3 the build plays, but nothing in it responds to the visitor: no key skips a section, the dock has no buttons (and is aria-hidden), the speed cannot change or persist, a finished build cannot be replayed, reduced-motion and `∞` visitors get no dock at all (the instant branch of `main.ts` creates no layer), the dock never collapses or hints, turbo shows no `queued n/5`, focus inside an unbuilt section leaves it hidden, and a width resize leaves a window that no longer matches its section. AC-3, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-12, AC-13, AC-14 and AC-17 cannot be met until these controls and rules exist.

## Solution Statement

Keep one scheduler and one clock and add control surfaces around them. The scheduler gains `skip()` (finishes the active section as `skipped`), `runAll()` and `finishThrough(id)` (finish everything not finished up to an index as `skipped`; both guard against a no-op so `onIdle` and `onAllDone` never fire twice) and an optional `onQueue(position, total)` host callback that reports the section being caught up while turbo is active. The layer owns the dock, so it also owns the dock's idle behavior on a single frame subscription that is active only while the dock is idle, held after a skip, or done. The page-level inputs are small modules that call the controls object. Replay and Play build re-create the whole show (effects, layer, scheduler, observers) from the ready page, so there is no reset logic to keep correct. Nothing new scrolls the page except `window.scrollTo(0, 0)` on Replay and Play build.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (visitor controls and navigation rules) |
| Complexity | HIGH (lifecycle rebuild, accessible dock inside an overlay, global input rules, deterministic timing under Playwright's clock) |
| Systems Affected | docs/decisions.md, 02-experience.md, 04-animations.md, 06-architecture.md, api-reference.md, domain/areas/build.md, context/architecture.md; src/runtime/controls-timing.ts, api.ts, keys.ts, focus-rule.ts, resize.ts (new), scheduler.ts, layer.ts, main.ts; src/components/build/CommandDock.ts, BuildWindow.ts, FooterBuild.ts (new); src/strings.ts, src/scripts/build-mode.ts, src/stores/build.ts; src/styles/build-layer.css, src/components/page/Footer.css |
| Dependencies | Phases 1, 2 and 3 (complete); no new dependency |
| Estimated Tasks | 8 |
| Source PRD line ref | PRPs/prds/stage-3-runtime.prd.md:203 (row 4), :223-226 (Phase Details) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-3-runtime.prd.md` | 70-86 (AC-3, AC-5 to AC-10, AC-12 to AC-14, AC-17, AC-18), 133-136 (controls, navigation, reduced motion, stores), 175-178 (build layer, reduced motion, state and controls, footer), 223-226 (Phase 4), 243-248 (decisions), 95 (Shift + Esc question) | The contract this phase implements |
| P0 | `docs/02-experience.md` | 107-119 (dock states), 289-310 (behavior rules), 322-331 (keyboard shortcuts) | Exact states, copy and rules |
| P0 | `docs/04-animations.md` | 37-54 (lifecycle), 155-175 (visitor controls, reduced motion) | Control semantics |
| P0 | `src/runtime/scheduler.ts` | 8-29, 61-196 | The API to extend; `finishUpTo`, `startNext`, turbo factor, `setSpeed` |
| P0 | `src/runtime/main.ts` | 19-119 | `reveal`, `guard`, the instant branch (no layer today), host wiring, the single `cancelFrame` variable |
| P0 | `src/runtime/layer.ts` | 22-28, 52-144, 171-216, 218-291 | `finishSlot`, `onState`, `onTick`, `onAllDone`, `destroy`, the root and dock |
| P0 | `src/components/build/CommandDock.ts` | 7-132 | The dock factory to turn into a group with persistent buttons |
| P0 | `src/components/build/BuildWindow.ts` | 21-77 | The bars the window click attaches to |
| P0 | `src/runtime/triggers.ts` | 3-23 | One-shot 75% observer, the `top < 0` rule that makes deep links queue earlier sections |
| P0 | `src/layouts/Base.astro` | 36-68 | Head script reading `sp-speed` (the runtime only writes it) |
| P0 | `src/scripts/build-mode.ts` | 1-14 | Where `persistSpeed` joins `parseSpeed` |
| P0 | `src/scripts/theme-toggle.ts` | 20-32 | The `try`/`catch` `localStorage.setItem` pattern to copy |
| P0 | `src/stores/build.ts` | 1-10 | Atoms to extend with `queue` |
| P0 | `src/strings.ts` | 63-84 | `buildStrings`, where all new copy goes |
| P0 | `src/components/page/Footer.tsx`, `src/components/page/Footer.css` | Footer.tsx 28-30; Footer.css 18-40 | The reserved `data-footer-build` slot the runtime fills |
| P0 | `src/components/page/NavBar.tsx`, `src/components/page/MobileMenu.tsx` | NavBar.tsx 55-62; MobileMenu.tsx 24-28 | `popovertarget` toggle `.sp-menu-toggle` and `#mobile-menu` `popover="auto"` (the `Esc` yield) |
| P0 | `src/styles/build-layer.css` | 134-200, 225-252, 402-439 | Dock, window bars (`pointer-events: auto`), reduced-motion and compact rules |
| P0 | `src/styles/base.css` | 7-9, 38-42 | No `scroll-behavior` (anchor navigation is instant); global 2px `:focus-visible` ring |
| P0 | `src/runtime/clock.ts` | 1-49 | `Clock` and the manual clock |
| P1 | `PRPs/plans/completed/stage-3-runtime-phase-3-element-effects-and-base-scripts.plan.md` | 855-866 (Notes), 419-446 (Validation Commands style) | Effects contract (`onState` `done`/`skipped` finishes a section, `command` re-initializes), expected-test-impact convention, self-contained Level 3 blocks |
| P1 | `docs/domain/areas/build.md`, `docs/domain/areas/navigation.md`, `docs/06-architecture.md` | whole files | Rules and design text to amend (read before editing) |

## Patterns to Mirror

```ts
# SOURCE: src/runtime/scheduler.ts:144-155
  const finishUpTo = (index: number) => {
    for (let i = 0; i <= index; i++) {
      const entry = entries[i];
      if (!isFinished(entry)) {
        const wasActive = i === active;
        setState(entry, 'done');
        if (wasActive) active = -1;
      }
    }
    if (active === -1) startNext();
    else checkAllDone();
  };
```
Copied by Task 3 (`finishUpTo` gains a `final` argument defaulting to `'done'`; the `∞` paths keep passing `'done'`, the new controls pass `'skipped'`).

```ts
# SOURCE: src/runtime/scheduler.ts:131-132
    const turbo = entries[active + 1]?.state === 'queued';
    const factor = (speed === '2' ? 2 : 1) * (turbo ? TURBO_FACTOR : 1);
```
Copied by Task 3 (the same predicate defines the `queued n/5` position; turbo timing itself is not touched).

```ts
# SOURCE: src/components/build/CommandDock.ts:59-65
  const show = (next: string, nodes: Node[], hintText = '') => {
    if (mode !== next) {
      mode = next;
      status.replaceChildren(...nodes);
    }
    if (hint.textContent !== hintText) hint.textContent = hintText;
  };
```
Copied by Task 4 (status text keeps this last-value discipline; the control buttons are persistent nodes toggled with `hidden`, not re-created per state, so focus survives a state change).

```ts
# SOURCE: src/runtime/layer.ts:171-186
  const finishSlot = (slot: Slot) => {
    slot.win?.el.remove();
    slot.win = null;
    slot.outline?.el.remove();
    slot.outline = null;
    if (slot.timeline.section === heroId) removeBoot();
    setNav(1);
    if (!slot.counted) {
      slot.counted = true;
      doneCount++;
    }
    dock.setState('idle');
    dock.setLog(null);
    dock.setOpacity(1);
    dock.setIdle(doneCount, timelines.length);
  };
```
Copied by Task 6 (a skipped slot that was running shows its created text and holds it; a slot that never started goes straight to idle).

```ts
# SOURCE: src/runtime/main.ts:29-38
function guard<A extends unknown[]>(fn: (...args: A) => void) {
  return (...args: A): void => {
    try {
      fn(...args);
    } catch (error) {
      reveal();
      console.error(error);
    }
  };
}
```
Copied by Task 8 (every new listener and callback runs inside `guard`; `reveal()` must also remove the new global listeners and cancel every frame subscription, not only the last one).

```ts
# SOURCE: src/scripts/theme-toggle.ts:25-29
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage may be blocked; the in-page theme still changes.
    }
```
Copied by Task 2 (`persistSpeed` swallows a blocked storage the same way).

```ts
# SOURCE: src/components/build/BuildWindow.ts:37-42
  const cmd = h('div', 'sp-window-cmd');
  const line = createCommandLine();
  cmd.append(line.el);
  chrome.append(bar, cmd);
  frame.append(body, chrome);
  el.append(frame);
```
Copied by Task 4 (the click handler attaches to `bar` and `cmd`, the two elements that already carry `pointer-events: auto`; the body never gets one).

```ts
# SOURCE: src/runtime/triggers.ts:10-19
      for (const entry of entries) {
        if (fired.has(entry.target)) continue;
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          fired.add(entry.target);
          observer.unobserve(entry.target);
          onTrigger(entry.target.id as SectionId);
        }
      }
    },
    { rootMargin: '0px 0px -25% 0px', threshold: 0 },
```
Copied by Task 8 (unchanged; a deep link or nav click triggers every section whose top is above the viewport edge and the target, `trigger` queues all of them, and turbo catches them up; each new show creates a fresh observer so Replay re-arms it).

```css
# SOURCE: src/styles/build-layer.css:88-100
.sp-cursor {
  color: var(--fg);
  animation: sp-cursor-blink 1.06s steps(1) infinite;
}

@keyframes sp-cursor-blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
```
Copied by Task 5 (the scroll-hint pulse is an opacity-only keyframe loop; reduced motion disables it in the existing media block).

```css
# SOURCE: src/styles/build-layer.css:432-439
@media (max-width: 767px) {
  .sp-window-bar,
  .sp-dock-hint,
  .sp-dock-log {
    display: none;
  }
}
```
Copied by Task 5 (the compact dock also hides the speed button so it shows only the status and `» Skip`).

```css
# SOURCE: src/components/page/Footer.css:25-28
/* Reserved line for the build summary (filled later, so nothing moves). */
.sp-footer-build {
  min-height: calc(var(--text-sm) * 1.5);
}
```
Copied by Task 5 (the filled summary must fit this reserved line; a footer box comparison is in Level 3).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `docs/decisions.md`, `docs/02-experience.md`, `docs/04-animations.md`, `docs/06-architecture.md`, `docs/api-reference.md`, `docs/domain/areas/build.md`, `docs/context/architecture.md` | UPDATE | Docs first: record the Phase 4 decisions, the `Shift + Esc` status, idle timers, dock accessibility, the controls API and the new modules |
| `src/runtime/controls-timing.ts` | CREATE | Pure, DOM-free constants and mappings (idle times, speed cycle, key action, width change, queue position) |
| `src/strings.ts` | UPDATE | Control labels, queue text, footer summary text |
| `src/scripts/build-mode.ts` | UPDATE | `persistSpeed` |
| `src/stores/build.ts` | UPDATE | `queue` atom |
| `src/runtime/scheduler.ts` | UPDATE | `skip`, `runAll`, `finishThrough`, `onQueue` |
| `src/components/build/CommandDock.ts` | UPDATE | Group role, persistent buttons, queued text, hint pulse, ready idle without hint, focus preservation |
| `src/components/build/BuildWindow.ts` | UPDATE | Optional `onSkip` click on the title and command bars |
| `src/components/build/FooterBuild.ts` | CREATE | Fills and clears the reserved footer slot |
| `src/styles/build-layer.css`, `src/components/page/Footer.css` | UPDATE | Button styles, collapsed dock position, hint pulse, compact rule, footer button, tokens only |
| `src/runtime/layer.ts` | UPDATE | Ready docks, queue text, skip text and hold, idle frame subscription, expand, footer, aria-hidden children, speed and queue setters |
| `src/runtime/keys.ts`, `src/runtime/focus-rule.ts`, `src/runtime/resize.ts` | CREATE | The three global input rules |
| `src/runtime/api.ts` | CREATE | `Controls`, `getControls`, `setControls` and the store re-exports for Stage 5 |
| `src/runtime/main.ts` | UPDATE | Rebuildable show, ready branch, controls object, stores mirror for `queue`, listeners |

## NOT Building (Scope Limits)

- The Command Palette, `⌘K`, the `?` shortcut list, scroll-spy, toasts, the window-dot close (B25), the interactive dock (D7), agents (D8), analytics events, the `ENOENT` window: Stages 5 and 6 and v1.1.
- `image-resolve`, real assets, per-section tuning (Stage 4).
- The complete E2E suite for the 18 rules, the axe matrix, layout-invariance suite, budget/Lighthouse gating work, the rewritten `home-no-build-layer.spec.ts`, the rule to spec mapping in docs/context/testing.md and the full API documentation: Phase 5. Phase 4 only amends the docs listed above.
- Any change to the compiler's timeline rules, the effects engine, the triggers, the head script or watchdog, the Stage 2 markup, copy, section ids or labels. `Footer.tsx` and `Base.astro` do not change.
- Any test file (tests are authored by the test pair after the Implementer), any new dependency, any `setTimeout` or `setInterval`, any link click handler, any call to `scrollTo`, `scrollIntoView` or `scrollTop` other than the single `window.scrollTo(0, 0)` in Replay and Play build.
- Running or changing the `astro preview` already serving `dist/` on port 4321, and a real-Chrome check of `Shift + Esc` by the agent (owner step, see Notes).

## Step-by-Step Tasks

### Task 1: UPDATE the docs (docs first)

- **ACTION**: Delivers AC-A12 and the record part of AC-A2. Read each file, then amend it in its existing format, additively. `docs/decisions.md`: insert a new entry before the closing `<!-- Template` comment, after the last `---`, with the exact heading `## [2026-11-08] Stage 3 Phase 4 controls and navigation` and the four fields (Context, Decision, Reason, Areas affected: build, navigation, visual-design). Decision text records, in this order: the dock leaves the aria-hidden layer as a `role="group"` named "Site build" with real buttons while its status text, log and hint stay aria-hidden; the scheduler gains `skip`, `runAll`, `finishThrough` and a `queued n/5` status callback (the PRD assigns these to Phase 4; turbo and timing rules are unchanged); `Esc` skips only the active section and yields to an open popover or dialog, `Shift + Esc` runs all; a skip shows `✔ <Section> Section created. (<t>s)` for 1.5 s before the dock returns to idle; the scroll hint pulses after 4 s idle and the pulse restarts its count after a scroll; the done state lasts 4 s, then collapses into `❯_`, and a reopened done state collapses again after 4 s; the sentence `Replay and Play build always play the show at normal speed from the boot: when the dock is in a ready state (reduced motion or a saved ∞) they switch the speed to 1× and save it, and a Replay from a finished 1× or 2× build keeps that speed`; the controls API lives in `src/runtime/api.ts`; the footer summary is filled by the runtime with the same seconds as the dock; the `Shift + Esc` status is unverified until the owner checks real Chrome. `docs/02-experience.md`: after the sentence "Clicking the speed cycles through `1×`, `2×` and `∞` (instant). The choice is saved in the browser." add the exact sentence `Replay and Play build always play the show at normal speed from the boot.` and add, under the Keyboard shortcuts table, a short paragraph that starts with the exact words `Shift + Esc on Windows Chrome:` stating that Chrome lists `Shift + Esc` as its Task Manager shortcut, that the E2E test proves only the page handler, that the real-browser check is pending the owner, and that if Chrome swallows it the Stage 5 palette's Run all is the keyboard path. `docs/04-animations.md`: under "Visitor controls" add a paragraph starting with the exact words `Idle timers.` listing the 4 s scroll hint, the 1.5 s hold after a skip and the 4 s done-to-collapsed delay, and that they run on one frame subscription that is active only while no section is building. `docs/06-architecture.md`: add a short section whose heading is exactly `### Dock accessibility` describing the group, the aria-hidden status text, the persistent buttons with their names ("Skip this section's build", "Build speed: 1x. Switch to 2x" and its two siblings, "Replay the build", "Play the build animation", "Show build status") and the rule that every other layer child is aria-hidden; plus the new modules (`controls-timing`, `keys`, `focus-rule`, `resize`, `api`, `FooterBuild`). `docs/api-reference.md`: under "Visitor controls (runtime surface)" add a subsection with the exact heading `### Controls API (Stage 3 Phase 4)` listing `skip`, `runAll`, `setSpeed`, `cycleSpeed`, `replay`, `play` of `Controls` from `src/runtime/api.ts` (`getControls()` returns `null` on pages without the runtime) and the stores `currentSection`, `progress`, `status`, `speed`, `queue`; and add the mirrored attribute `data-build-queue` (`<n>/<total>` while turbo is catching up, absent otherwise) to the "Build data contract" paragraph. `docs/domain/areas/build.md`: in its existing rule list format add the exact sentence `Replay and Play build always play the show at normal speed from the boot.` under the Replay and Play build rules (create the rule lines in the file's own style if no such rule exists) and resolve the Skip, Run all, focus and resize open questions that Phase 4 settles. `docs/context/architecture.md`: in the `src/runtime/` row replace "Controls come in a later phase" with text that starts `Phase 4 adds` and names `controls-timing.ts`, `keys.ts`, `focus-rule.ts`, `resize.ts`, `api.ts` and the scheduler's `skip`/`runAll`/`finishThrough`/`onQueue`; add `FooterBuild` to the `src/components/build/` row; update the intro sentence "controls and persistence are not built yet" to say Phase 4 adds them; add `queue` to the `src/stores/` row. Format the changed docs with `pnpm exec prettier --write <files>`.
- **MIRROR**: `# SOURCE: src/scripts/theme-toggle.ts:25-29` (storage failure behavior the decision text refers to) and the existing entry format in `docs/decisions.md` (Context, Decision, Reason, Areas affected, separated by `---`)
- **VALIDATE**: `set -euo pipefail; grep -qF "## [2026-11-08] Stage 3 Phase 4 controls and navigation" docs/decisions.md; for f in docs/decisions.md docs/02-experience.md docs/domain/areas/build.md; do grep -qF "Replay and Play build always play the show at normal speed" "$f"; done; grep -qF "Shift + Esc on Windows Chrome:" docs/02-experience.md; grep -qF "Idle timers." docs/04-animations.md; grep -qF "### Dock accessibility" docs/06-architecture.md; grep -qF "### Controls API (Stage 3 Phase 4)" docs/api-reference.md; grep -qF "data-build-queue" docs/api-reference.md; grep -qF "Phase 4 adds" docs/context/architecture.md; pnpm exec prettier --check docs/decisions.md docs/02-experience.md docs/04-animations.md docs/06-architecture.md docs/api-reference.md docs/domain/areas/build.md docs/context/architecture.md`

### Task 2: CREATE src/runtime/controls-timing.ts and UPDATE src/strings.ts, src/scripts/build-mode.ts, src/stores/build.ts

- **ACTION**: Delivers AC-A3 and AC-A10 (speed cycle, labels, hint timing) and the stores part of AC-A12. Create `controls-timing.ts` with only type imports (`import type { Speed } from '../scripts/build-mode'`) so `node --experimental-strip-types` can run it. Export constants `HINT_IDLE_MS = 4000`, `DONE_COLLAPSE_MS = 4000`, `SKIP_HOLD_MS = 1500`. Export pure functions: `nextSpeed(speed: Speed): Speed` (`'1'` to `'2'`, `'2'` to `'inf'`, `'inf'` to `'1'`); `hintPulsing(idleMs: number): boolean` (`idleMs >= HINT_IDLE_MS`); `doneCollapsed(doneMs: number): boolean` (`doneMs >= DONE_COLLAPSE_MS`); `skipHeld(holdMs: number): boolean` (`holdMs < SKIP_HOLD_MS`); `queuePosition(activeIndex: number, nextQueued: boolean): number | null` (`activeIndex + 1` when `nextQueued`, else `null`); `isWidthChange(previousWidth: number, nextWidth: number): boolean` (`previousWidth !== nextWidth`); and `keyAction(event: { key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean }, popoverOpen: boolean): 'skip' | 'runAll' | null` (null unless `key === 'Escape'`; null when `ctrlKey`, `metaKey`, `altKey` or `repeat`; `'runAll'` when `shiftKey`, regardless of `popoverOpen`; null when `popoverOpen`; otherwise `'skip'`). In `src/strings.ts` add to `buildStrings` (keep every existing key): `skip: '» Skip'`, `skipLabel: "Skip this section's build"`, `replay: '↻ Replay'`, `replayLabel: 'Replay the build'`, `play: '▶ Play build'`, `playLabel: 'Play the build animation'`, `expandLabel: 'Show build status'`, `groupLabel: 'Site build'`, `queued: (position: number, total: number) => \`queued ${position}/${total}\``, `footerBuilt: (seconds: string) => \`Built live in ${seconds}s · \``, `speedGlyph: (speed: Speed) => ...` returning `1×`, `2×` or `∞`, and `speedLabel: (speed: Speed) => ...` returning exactly `Build speed: 1x. Switch to 2x`, `Build speed: 2x. Switch to instant` and `Build speed: instant. Switch to 1x` for `'1'`, `'2'` and `'inf'`; add `import type { Speed } from './scripts/build-mode'` (type-only, so the module stays runnable by `node --experimental-strip-types`). In `src/scripts/build-mode.ts` add `export function persistSpeed(next: Speed): void` that calls `localStorage.setItem(SPEED_STORAGE_KEY, next)` inside `try`/`catch` with the comment style of the theme toggle (swallow a blocked storage; the in-page speed still changes). In `src/stores/build.ts` add `export const queue = atom<{ position: number; total: number } | null>(null);`. Do not edit `Base.astro`. Format the changed files with `pnpm exec prettier --write`.
- **MIRROR**: `# SOURCE: src/scripts/theme-toggle.ts:25-29` and `# SOURCE: src/runtime/scheduler.ts:131-132`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm test; pnpm exec prettier --check src/runtime/controls-timing.ts src/strings.ts src/scripts/build-mode.ts src/stores/build.ts; node --experimental-strip-types --no-warnings --input-type=module -e "import * as c from './src/runtime/controls-timing.ts'; import { buildStrings as b } from './src/strings.ts'; import { persistSpeed } from './src/scripts/build-mode.ts'; const eq = (a, d, m) => { if (a !== d) { console.error('FAIL: ' + m + ' got ' + a + ' want ' + d); process.exit(1); } }; eq(c.nextSpeed('1'), '2', 'next 1'); eq(c.nextSpeed('2'), 'inf', 'next 2'); eq(c.nextSpeed('inf'), '1', 'next inf'); eq(c.HINT_IDLE_MS, 4000, 'hint'); eq(c.DONE_COLLAPSE_MS, 4000, 'collapse'); eq(c.SKIP_HOLD_MS, 1500, 'hold'); eq(c.hintPulsing(3999), false, 'pulse early'); eq(c.hintPulsing(4000), true, 'pulse'); eq(c.doneCollapsed(3999), false, 'collapse early'); eq(c.doneCollapsed(4000), true, 'collapse due'); eq(c.skipHeld(1499), true, 'held'); eq(c.skipHeld(1500), false, 'released'); eq(c.queuePosition(0, true), 1, 'q0'); eq(c.queuePosition(2, true), 3, 'q2'); eq(c.queuePosition(2, false), null, 'q none'); eq(c.isWidthChange(1280, 1024), true, 'width'); eq(c.isWidthChange(375, 375), false, 'height only'); const k = (o) => ({ key: 'Escape', shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...o }); eq(c.keyAction(k({}), false), 'skip', 'esc'); eq(c.keyAction(k({}), true), null, 'esc yields to a popover'); eq(c.keyAction(k({ shiftKey: true }), false), 'runAll', 'shift esc'); eq(c.keyAction(k({ shiftKey: true }), true), 'runAll', 'shift esc with popover'); eq(c.keyAction(k({ ctrlKey: true }), false), null, 'ctrl esc'); eq(c.keyAction(k({ repeat: true }), false), null, 'repeat'); eq(c.keyAction(k({ key: 'a' }), false), null, 'other key'); eq(b.speedLabel('1'), 'Build speed: 1x. Switch to 2x', 'label 1'); eq(b.speedLabel('2'), 'Build speed: 2x. Switch to instant', 'label 2'); eq(b.speedLabel('inf'), 'Build speed: instant. Switch to 1x', 'label inf'); eq(b.speedGlyph('1'), '1\u00d7', 'glyph 1'); eq(b.speedGlyph('2'), '2\u00d7', 'glyph 2'); eq(b.speedGlyph('inf'), '\u221e', 'glyph inf'); eq(b.queued(2, 5), 'queued 2/5', 'queued'); eq(b.footerBuilt('9.6'), 'Built live in 9.6s \u00b7 ', 'footer'); eq(b.skipLabel, 'Skip this section' + String.fromCharCode(39) + 's build', 'skip label'); eq(b.replayLabel, 'Replay the build', 'replay label'); eq(b.playLabel, 'Play the build animation', 'play label'); eq(b.groupLabel, 'Site build', 'group label'); eq(b.expandLabel, 'Show build status', 'expand label'); eq(b.skip, '\u00bb Skip', 'skip'); eq(b.replay, '\u21bb Replay', 'replay'); eq(b.play, '\u25b6 Play build', 'play'); persistSpeed('2');"`

### Task 3: UPDATE src/runtime/scheduler.ts (skip, run all, finish through, queue status)

- **ACTION**: Delivers AC-A1, AC-A2, AC-A6 and AC-A8 (the scheduler surface the controls and the focus rule call). Add to `SchedulerHost` an optional `onQueue?(position: number | null, total: number): void` and to `Scheduler` the methods `skip(): void`, `runAll(): void` and `finishThrough(id: SectionId): void`. Change the private `finishUpTo` to `finishUpTo(index: number, final: 'done' | 'skipped' = 'done')` so it calls `setState(entry, final)`; `trigger` and `setSpeed` keep calling it with the default, so the `∞` behavior and every existing event stay as they are. Add `let lastQueue = 'null'` and `publishQueue()` that computes `const position = active >= 0 && entries[active + 1]?.state === 'queued' ? active + 1 : null`, returns when `String(position) === lastQueue`, otherwise stores it and calls `host.onQueue?.(position, entries.length)` (the initial `null` is not emitted). Call `publishQueue()` at the end of `startNext`, `trigger`, `finish`, `setSpeed` and the three new methods. `skip()`: return when `active === -1`; otherwise `const entry = entries[active]; setState(entry, 'skipped'); active = -1; startNext();`. `runAll()`: return when every entry is finished; otherwise `finishUpTo(entries.length - 1, 'skipped')` (never-started `pending` and `queued` sections also become `skipped`, which the layer and effects already treat as finished). `finishThrough(id)`: resolve the index, return when it is `-1` or when every entry up to it is already finished, otherwise `finishUpTo(index, 'skipped')`. The two guards keep `onIdle` and `onAllDone` from firing twice (a second `Esc`, a second `Shift + Esc` or a focus event in a built section must change nothing). Do not touch `stateAt`, `onFrame`, the turbo factor, `MAX_FRAME_MS`, `TURBO_FACTOR` or the hidden-tab branch. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/scheduler.ts:144-155` and `# SOURCE: src/runtime/scheduler.ts:131-132`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm test; pnpm exec prettier --check src/runtime/scheduler.ts; node --experimental-strip-types --no-warnings --input-type=module -e "import { createScheduler } from './src/runtime/scheduler.ts'; import { createManualClock } from './src/runtime/clock.ts'; const eq = (a, d, m) => { if (a !== d) { console.error('FAIL: ' + m + ' got ' + a + ' want ' + d); process.exit(1); } }; const tl = (section) => ({ v: 1, section, file: section + '.tsx', command: 'x();', commandEnd: 100, windowEnd: 200, buildStart: 300, steps: [], createdAt: 900, duration: 1000 }); const mk = () => { const clock = createManualClock(); const log = { s: [], q: [], idle: 0, all: 0 }; const host = { onState: (id, st) => log.s.push(id + ':' + st), onProgress: () => {}, onIdle: () => { log.idle++; }, onAllDone: () => { log.all++; }, isHidden: () => false, onQueue: (p, t) => log.q.push(p + '/' + t) }; const sch = createScheduler({ clock, timelines: [tl('top'), tl('about'), tl('projects')], speed: '1', host }); return { clock, log, sch }; }; const lastQ = (a) => a.log.q[a.log.q.length - 1]; const a = mk(); a.sch.trigger('top'); a.clock.advance(100); eq(a.log.q.length, 0, 'no queue status without turbo'); a.sch.trigger('projects'); eq(lastQ(a), '1/3', 'turbo while the hero builds'); a.sch.skip(); eq(a.log.s.includes('top:skipped'), true, 'skip marks skipped'); eq(lastQ(a), '2/3', 'about is now caught up'); a.sch.skip(); eq(lastQ(a), 'null/3', 'turbo is over when the last section builds'); eq(a.log.s.includes('about:skipped'), true, 'about skipped'); a.sch.skip(); eq(a.log.all, 1, 'all done once'); const idleAfter = a.log.idle; a.sch.skip(); eq(a.log.all, 1, 'skip with nothing active is a no-op'); eq(a.log.idle, idleAfter, 'no extra idle'); const b = mk(); b.sch.trigger('top'); b.clock.advance(100); b.sch.runAll(); eq(['top', 'about', 'projects'].every((id) => b.log.s.includes(id + ':skipped')), true, 'run all skips every section'); eq(b.log.all, 1, 'run all completes once'); const n = b.log.s.length; b.sch.runAll(); eq(b.log.s.length, n, 'second run all changes nothing'); eq(b.log.all, 1, 'second run all fires nothing'); const c = mk(); c.sch.finishThrough('about'); eq(c.log.s.includes('top:skipped') && c.log.s.includes('about:skipped'), true, 'finish through about'); eq(c.log.s.some((x) => x.startsWith('projects:')), false, 'later sections untouched'); const m = c.log.s.length; c.sch.finishThrough('about'); eq(c.log.s.length, m, 'finish through is idempotent'); const d = mk(); d.sch.setSpeed('inf'); d.sch.trigger('about'); eq(d.log.s.includes('top:done') && d.log.s.includes('about:done'), true, 'infinity keeps finishing as done');"`

### Task 4: UPDATE the dock and window factories and CREATE FooterBuild

- **ACTION**: Delivers AC-A1, AC-A3, AC-A4, AC-A5 and AC-A11 (the buttons, their names and the footer summary). `CommandDock.ts`: change the signature to `createCommandDock(options: { speed: Speed; onAction(action: DockAction): void })` and export `type DockAction = 'skip' | 'speed' | 'replay' | 'play' | 'expand'`. The dock root loses `aria-hidden` and gains `role="group"` and `aria-label` from `buildStrings.groupLabel`; `.sp-dock-log`, `.sp-dock-status` and `.sp-dock-hint` each get `aria-hidden="true"` (the status text is not announced; the controls stay reachable). Add a persistent `.sp-dock-controls` container appended to the pill after the hint, holding five real `<button type="button">` elements created once with `data-dock-action` set to their action and class `sp-dock-btn` (the expand button also keeps the class `sp-dock-fab`): skip (visible text `buildStrings.skip`, `aria-label` `buildStrings.skipLabel`), speed (visible text `buildStrings.speedGlyph(speed)`, `aria-label` `buildStrings.speedLabel(speed)`), replay (`buildStrings.replay`, `buildStrings.replayLabel`), play (`buildStrings.play`, `buildStrings.playLabel`) and expand (`buildStrings.collapsedGlyph`, `buildStrings.expandLabel`). A click calls `options.onAction(action)`. Visibility is the `hidden` property set in `setState` from this matrix: `hidden` none; `typing` and `building` skip + speed; `created` and `idle` speed; `done` replay; `reduced` play; `collapsed` expand. The `reduced` branch keeps `reducedReady` text plus the cursor and the `collapsed` branch no longer renders the `span.sp-dock-fab` glyph in the status (the expand button is the glyph). After toggling `hidden`, if `document.activeElement` is a button inside the dock that is now hidden, focus the first visible button (so a pressed Skip does not drop focus to `body`). Add methods `setSpeed(speed: Speed)` (updates the speed button text and `aria-label` only when they changed), `setQueued(text: string)` (`show('queued', [text])` with the shared text span, same last-value check as `setCreated`), `setPulse(on: boolean)` (toggles the `data-pulse` attribute on the hint, last-value cached) and an optional third parameter `withHint = true` on `setIdle` so a ready dock shows `✓ 5/5 sections ❯ █` without `scroll ↓`. `BuildWindow.ts`: `createBuildWindow(file, section, onSkip?: () => void)`; when `onSkip` is given, add a `click` listener calling it to `bar` and to `cmd` only (never to `body` or `frame`; both bars already receive pointer events and the window stays `aria-hidden`). `FooterBuild.ts` (new, uses `h` from `./dom`): `createFooterBuild(slot: HTMLElement, onReplay: () => void)` returning `{ setSummary(seconds: string | null): void; clear(): void }`; `setSummary(seconds)` replaces the slot's children with the text node `buildStrings.footerBuilt(seconds)` (omitted when `seconds` is `null`, so instant mode shows only `↻ Replay`) followed by a real `<button type="button" class="sp-footer-replay">` with text `buildStrings.replay` and `aria-label` `buildStrings.replayLabel` that calls `onReplay`; `clear()` calls `slot.replaceChildren()`, which restores the empty reserved slot. No `innerHTML`, no role other than the group, and every per-frame style or text write compares with its last value, as the factories do today. Format with prettier.
- **MIRROR**: `# SOURCE: src/components/build/CommandDock.ts:59-65` and `# SOURCE: src/components/build/BuildWindow.ts:37-42`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm check:tokens; pnpm test; pnpm exec prettier --check src/components/build; pnpm build`

### Task 5: UPDATE src/styles/build-layer.css and src/components/page/Footer.css

- **ACTION**: Delivers AC-A5, AC-A10 and AC-A11 (look of the controls, the collapsed position, the hint pulse, a footer slot that does not grow). Tokens only (no hex, `rgb(`, `hsl(`; every `box-shadow` carries `var(--`; no `transition` property). `build-layer.css`: `.sp-dock-controls` is `display: flex; align-items: center; gap: var(--space-2); pointer-events: auto` (the dock root and pill stay `pointer-events: none`, only the controls catch clicks); `.sp-dock-btn` is `appearance: none; background: transparent; border: 0; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-family: var(--font-mono); font-size: var(--mono-xs); color: var(--fg-muted); cursor: pointer; white-space: nowrap; pointer-events: auto` with a `:hover` rule setting `color: var(--fg)`, and `.sp-dock-btn[hidden] { display: none }`; keep the global 2px `:focus-visible` ring from `base.css` (add no outline rule). `.sp-dock[data-state='collapsed']` sets `left: auto; right: max(var(--space-6), env(safe-area-inset-right)); margin-inline: 0; width: var(--dock-height)` and hides `.sp-dock-status` and `.sp-dock-hint`; the `.sp-dock-fab` rule (existing, 191-200) now styles the expand button, so keep it and add `pointer-events: auto; background: transparent; border: 0` where the button needs it. `.sp-dock-hint[data-pulse] { animation: sp-hint-pulse 1.6s ease-in-out infinite }` with `@keyframes sp-hint-pulse` changing only `opacity` (1 to 0.4 to 1); add `.sp-dock-hint[data-pulse] { animation: none }` to the existing `@media (prefers-reduced-motion: reduce)` block. Extend the existing `@media (max-width: 767px)` compact block so `.sp-dock-btn[data-dock-action='speed']` is `display: none` (compact shows only the status and `» Skip`; Replay and Play build stay visible). `Footer.css`: add `.sp-footer-replay` as `appearance: none; background: none; border: 0; padding: 0; font: inherit; color: var(--fg); text-decoration: underline; cursor: pointer` with a `:hover` that sets `color: var(--accent-fg)`, so the filled line keeps the reserved height of `.sp-footer-build`. Format with prettier.
- **MIRROR**: `# SOURCE: src/styles/build-layer.css:88-100`, `# SOURCE: src/styles/build-layer.css:432-439` and `# SOURCE: src/components/page/Footer.css:25-28`
- **VALIDATE**: `set -euo pipefail; pnpm check:tokens; pnpm exec prettier --check src/styles/build-layer.css src/components/page/Footer.css; pnpm build; pnpm check:budgets`

### Task 6: UPDATE src/runtime/layer.ts (dock states, idle timers, queue text, footer, accessibility)

- **ACTION**: Delivers AC-A1, AC-A4, AC-A5, AC-A6, AC-A10 and AC-A11. Replace the options with `interface LayerOptions { sections: HTMLElement[]; timelines: Timeline[]; clock: Clock; speed: Speed; actions: { skip(): void; cycleSpeed(): void; replay(): void; play(): void }; ready?: 'reduced' | 'instant' }` and add to `BuildLayer` the methods `setSpeed(speed: Speed): void` and `setQueue(position: number | null, total: number): void`. The layer `root` loses `aria-hidden`; instead the boot terminal, every build window, every pending outline and the effects container carry `aria-hidden="true"` (the effects engine already sets it on its own container; set it on `boot.el`, `win.el` and `outline.el` where they are appended, and confirm the factories do not already) so the only non-hidden descendants of the root are the dock group and its buttons. Create the dock with `createCommandDock({ speed: options.speed, onAction })` where `onAction` maps `skip`, `speed`, `replay` and `play` to `actions.skip`, `actions.cycleSpeed`, `actions.replay` and `actions.play`, and `expand` to a local `reopen()` (dock `done` state, `setDone(lastDoneText)`, `armUi('collapse')`). Create windows with `createBuildWindow(file, section, actions.skip)`. Ready docks: when `options.ready` is set, create only the dock (no outlines, no windows, no boot, no `ResizeObserver`, no `fonts.ready` placement), set `dock.setOpacity(1)`, then for `'reduced'` `dock.setState('reduced')` and for `'instant'` `dock.setState('idle')` plus `dock.setIdle(timelines.length, timelines.length, false)`; in both cases `createFooterBuild(slot, actions.replay).setSummary(null)` when `document.querySelector('[data-footer-build]')` exists (no summary text, only `↻ Replay`), and `onTick`, `onState` and `onAllDone` return early. Idle timers on ONE frame subscription: add `type Ui = 'none' | 'hint' | 'hold' | 'collapse'`, a `uiMode`, a `uiMs` counter and `armUi(mode)` that sets both, resets the pulse, subscribes `options.clock.onFrame(onUiFrame)` when the mode is not `'none'` and unsubscribes when it is. `onUiFrame(now)` computes `dt = Math.min(Math.max(now - lastUiNow, 0), 50)` (the scheduler's `MAX_FRAME_MS` rule), returns without counting while `document.visibilityState === 'hidden'`, adds `dt` to `uiMs`, then: in `'hint'` calls `dock.setPulse(hintPulsing(uiMs))`; in `'hold'` when `!skipHeld(uiMs)` sets the dock to idle (`setState('idle')`, `setCreated` cleared by the idle text, `setIdle(doneCount, total)`) and `armUi('hint')`; in `'collapse'` when `doneCollapsed(uiMs)` calls `dock.setState('collapsed')` and `armUi('none')`. Import `hintPulsing`, `doneCollapsed` and `skipHeld` from `./controls-timing`. Add one `window` `scroll` listener (passive) that, only while `uiMode === 'hint'`, sets `uiMs = 0` and `dock.setPulse(false)` (the scroll never drives the build); remove it in `destroy()`. Behavior changes in the existing code: in `finishSlot`, when the slot was running (its previous state is `command`, `window`, `building` or `closing`) and the new state is `skipped`, show `dock.setState('created')` with `dock.setCreated(buildStrings.created(buildStrings.sectionLabels[id], formatSeconds(slot.elapsed)))` and `armUi('hold')` instead of going idle at once; for a natural `done` or a slot that never started keep today's immediate idle and `armUi('hint')`; any `onState(id, 'command')` calls `armUi('none')` before the dock types. In `onTick` add a queue branch: `if (queueText !== null && slot.state !== 'closing')` set `dock.setState('building')`, `dock.setLog(null)` and `dock.setQueued(queueText)` instead of the typing and building branches (for the hero's fold branch, call `dock.setQueued` instead of `dock.setBuilding` while a queue status is set); `setQueue(position, total)` stores `queueText = position === null ? null : buildStrings.queued(position, total)`. `onAllDone` additionally keeps `lastDoneText`, calls `armUi('collapse')`, and fills the footer through `createFooterBuild(slot, actions.replay).setSummary(formatSeconds(total, 1))` using the SAME seconds string as `buildStrings.complete` (so the dock and the footer show the same `<t>`); `destroy()` also calls `footer.clear()`, unsubscribes the idle frame, removes the scroll listener and keeps its current cleanup. `setSpeed` forwards to `dock.setSpeed`. Do not change effects, boot, window timing or placement behavior. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/layer.ts:171-186` and `# SOURCE: src/components/build/CommandDock.ts:59-65`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm test; pnpm exec prettier --check src/runtime/layer.ts; pnpm build; pnpm check:budgets`

### Task 7: CREATE src/runtime/keys.ts, src/runtime/focus-rule.ts and src/runtime/resize.ts

- **ACTION**: Delivers AC-A1, AC-A2, AC-A8 and AC-A9 (the three global input rules). `keys.ts` exports `bindKeys(actions: { skip(): void; runAll(): void }): () => void`: one `keydown` listener on `document` registered in the CAPTURE phase (so an open popover is still open when it runs, before the browser's close request is processed). It computes `popoverOpen` with `document.querySelector(':popover-open, dialog[open]') !== null` inside `try`/`catch` (a browser without `:popover-open` throws a `SyntaxError`; treat that as `dialog[open]` only), calls `keyAction(event, popoverOpen)` from `./controls-timing` and runs `actions.skip()` or `actions.runAll()`; it never calls `preventDefault` and never stops propagation, so the native `Esc` that closes the mobile menu still runs. `focus-rule.ts` exports `observeFocus(options: { sections: HTMLElement[]; heroId: SectionId; finishThrough(id: SectionId): void }): () => void`: one `focusin` listener on `document`; if the event target is inside one of the `sections`, call `finishThrough(section.id)`; otherwise, while the hero's `data-build-state` is not `done` or `skipped`, a target inside `.sp-nav` or equal to `document.getElementById('main')` calls `finishThrough(heroId)` (the skip link itself and the dock buttons do nothing). It never moves focus and never scrolls. `resize.ts` exports `observeWidth(onChange: () => void): () => void`: remembers `window.innerWidth`, listens to `resize`, and calls `onChange()` only when `isWidthChange(previous, window.innerWidth)` is true (height-only changes, as when a phone's URL bar shows or hides, do nothing). All three files import only from `./controls-timing`, `./types` and the DOM; none uses a timer. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/triggers.ts:10-19` and `# SOURCE: src/runtime/main.ts:29-38`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm exec prettier --check src/runtime/keys.ts src/runtime/focus-rule.ts src/runtime/resize.ts; pnpm build`

### Task 8: CREATE src/runtime/api.ts and UPDATE src/runtime/main.ts (rebuildable show, controls object) and smoke it

- **ACTION**: Delivers AC-A1 to AC-A9 and the Stage 5 surface of AC-A12. `api.ts` exports `interface Controls { skip(): void; runAll(): void; setSpeed(speed: Speed): void; cycleSpeed(): void; replay(): void; play(): void }`, `getControls(): Controls | null`, `setControls(controls: Controls | null): void` (a module-level variable) and re-exports `currentSection`, `progress`, `queue`, `speed` and `status` from `../stores/build`; it creates no listener and no DOM. Restructure `main.ts` (keep `IDS`, `reveal`, `guard`, the store mirrors and the watchdog contract): (a) add a mirror `queue.subscribe(...)` that sets `data-build-queue` to `` `${position}/${total}` `` or removes it on `null`, and make the `speed` subscription also call the current layer's `setSpeed`. (b) Replace the single `cancelFrame` variable with a `Set<() => void>` of cancel functions filled by a guarded clock wrapper (the scheduler and the layer's idle subscription both go through it), and make `reveal()` call every cancel, the show's `destroy`, `unbindKeys` and the show's observers, then reveal as today. (c) Introduce `beginShow(startSpeed: Speed, options: { scrollTop: boolean })` and `endShow()`: `endShow()` cancels frames, stops the observer, focus rule and width observer, calls `effects.destroy` and `layer.destroy`, and clears the module references; `beginShow` calls `endShow()`, sets every section's `data-build-state` to `pending`, sets `root` `data-build-mode` to `pending`, resets the stores (`status` `idle`, `progress` 0, `currentSection` and `queue` `null`, `speed` to `startSpeed`), calls `window.scrollTo(0, 0)` only when `scrollTop` is true (Replay and Play build; `base.css` sets no `scroll-behavior`, so it is instant), then creates the layer (`createBuildLayer({ sections, timelines, clock, speed: startSpeed, actions })`), the effects, the scheduler (host as today plus `onQueue: guard((position, total) => { queue.set(position === null ? null : { position, total }); layer.setQueue(position, total); })`), the `IntersectionObserver` (`observeSections`), `observeFocus({ sections, heroId: 'top', finishThrough: scheduler.finishThrough })` and `observeWidth(scheduler.skip)`. (d) `start()`: in the instant branch keep marking every section `done` and the status/`data-build-started` behavior, but now also create the ready dock: `createBuildLayer({ ..., ready: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'instant' })` and keep it as the current layer; in the other branch call `beginShow(startSpeed, { scrollTop: false })`. (e) Build the `Controls` object once and `setControls(controls)`: `skip` and `runAll` call the current scheduler's `skip` and `runAll` (no-ops in a ready state); `setSpeed(next)` does `speed.set(next)`, `persistSpeed(next)` (from `../scripts/build-mode`), then the scheduler's `setSpeed(next)` when a scheduler exists; `cycleSpeed` is `setSpeed(nextSpeed(speed.get()))`; `replay` and `play` call `beginShow` with `'1'` when the page is in a ready state (and then `persistSpeed('1')` when the stored speed was not `'1'`, so the speed button, storage and page agree) or with the current speed after a finished build, always with `scrollTop: true`. The `layer` receives `actions` that delegate to this object. (f) `bindKeys({ skip: guard(controls.skip), runAll: guard(controls.runAll) })` once at `start()`, never inside `beginShow`; every callback and listener goes through `guard`. Do not edit the scheduler call signature beyond Task 3, the triggers, `Base.astro` or any section file; the runtime still attaches no handler to links, so nav clicks and `/#<id>` deep links use the browser's anchor navigation, and the only code that ever scrolls is `window.scrollTo(0, 0)` in `beginShow`. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/main.ts:29-38` and `# SOURCE: src/runtime/triggers.ts:10-19`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm test; pnpm exec prettier --check src/runtime/api.ts src/runtime/main.ts; pnpm build; node --input-type=module -e "import { chromium } from '@playwright/test'; import { preview } from 'astro'; const PORT = 4399; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } }); const browser = await chromium.launch(); try { const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); await page.clock.install({ time: 0 }); await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'domcontentloaded' }); await page.clock.pauseAt(60000); const state = () => page.evaluate(() => document.getElementById('top').getAttribute('data-build-state')); let s = ''; for (let i = 0; i < 400 && s !== 'building'; i++) { await page.clock.runFor(20); await sleep(3); s = await state(); } if (s !== 'building') throw new Error('FAIL: the hero never reached building'); await page.keyboard.press('Escape'); await page.clock.runFor(40); await sleep(10); s = await state(); if (s !== 'skipped') throw new Error('FAIL: Escape did not skip the hero, state ' + s); const dock = await page.evaluate(() => document.querySelector('.sp-dock-status').textContent); if (!dock.includes('Hero Section created')) throw new Error('FAIL: dock text after the skip: ' + dock); } catch (e) { console.error(e.message); process.exitCode = 1; } finally { await browser.close(); await server.stop(); } process.exit(process.exitCode ?? 0);"`

## Validation Commands

All three levels run from the worktree root (`C:/repos/site-pro/.worktrees/stage-3-runtime`). Level 3 needs Playwright's Chromium (`pnpm exec playwright install chromium`). Every block is self-contained, writes no file outside the code root and `PRPs/`, exits non-zero on failure, serves `dist/` itself with Astro's `preview()` on port 4399, and never uses or stops the `astro preview` already on port 4321 (so the port does not need to be free). Assertions read the DOM through `page.evaluate`, never the serialized page (the inlined pending CSS contains attribute names). Clicks use the element's own `.click()` inside `page.evaluate` because Playwright's actionability checks wait on `requestAnimationFrame`, which the fake clock freezes; keys use `page.keyboard.press`. Every sample moment keeps a margin larger than the sampling error: `data-build-progress` is rounded to 1 % and `runFor` slices add up to about 20 ms plus a frame (about 52 ms late, 16 ms early), so idle moments are sampled 500 ms or more away from their 4000 ms thresholds and turbo/1× durations use 120 to 300 ms tolerances. `pnpm test:e2e` is not a validation command here (see Notes).

### Level 1 STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm lint
pnpm format:check
pnpm check
pnpm check:tokens
pnpm check:privacy
```

### Level 2 CONTENT_INVARIANTS and UNIT_TESTS

```bash
set -euo pipefail
pnpm test
pnpm build
pnpm check:budgets
test -f dist/404.html -a -f dist/projects/relay/index.html
```

### Level 3 INTEGRATION (dry-run end to end in Chromium with Playwright's clock)

Run the build block first, then scenario blocks A to E in order.

```bash
set -euo pipefail
pnpm build
```

Scenario A (reduced motion and saved `∞` docks, Play build, speed cycle and persistence, 2× timing):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const fin = (v) => v === 'done' || v === 'skipped';
const read = (page) => page.evaluate((ids) => ({ states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')), queue: document.documentElement.getAttribute('data-build-queue'), dock: document.querySelector('.sp-dock')?.getAttribute('data-state') ?? null, y: window.scrollY }), IDS);
const frames = async (page, n = 2) => { for (let i = 0; i < n; i++) { await page.clock.runFor(20); await sleep(3); } };
async function until(page, test, label, maxMs = 90000) { for (let t = 0; t < maxMs; t += 20) { await frames(page, 1); const s = await read(page); if (test(s)) return { s, t: t + 20 }; } throw new Error('FAIL: timed out waiting for ' + label); }
const click = (page, sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) throw new Error('FAIL: missing ' + q); e.click(); }, sel);
async function open(browser, opts = {}, hash = '', init = null) { const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts }); if (init) await ctx.addInitScript(init); const page = await ctx.newPage(); await page.clock.install({ time: 0 }); await page.goto(URL + hash, { waitUntil: 'domcontentloaded' }); await page.clock.pauseAt(60000); return page; }
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const rp = await open(browser, { reducedMotion: 'reduce' });
  await frames(rp, 5);
  const r1 = await rp.evaluate(() => {
    const d = document.querySelector('.sp-dock');
    const b = (a) => d?.querySelector('[data-dock-action="' + a + '"]');
    const shown = (a) => { const e = b(a); return !!e && !e.hidden; };
    const cursor = d?.querySelector('.sp-cursor');
    return { status: document.documentElement.getAttribute('data-build-status'), state: d?.getAttribute('data-state'), text: d?.querySelector('.sp-dock-status')?.textContent ?? '', play: shown('play') ? b('play').getAttribute('aria-label') : null, skip: shown('skip'), speed: shown('speed'), pulse: !!d?.querySelector('.sp-dock-hint')?.hasAttribute('data-pulse'), layer: document.querySelectorAll('.sp-boot, .sp-window, .sp-select, .sp-skel, .sp-outline').length, h1: getComputedStyle(document.querySelector('h1')).opacity, anim: cursor ? getComputedStyle(cursor).animationName : 'none', footer: document.querySelector('[data-footer-build]')?.textContent.trim() ?? null };
  });
  check(r1.status === 'done' && r1.state === 'reduced', 'reduced motion: dock is in the reduced state ' + JSON.stringify(r1));
  check(r1.text.includes('Ready') && r1.text.includes('motion reduced'), 'reduced motion: dock text ' + r1.text);
  check(r1.play === 'Play the build animation' && !r1.skip && !r1.speed && !r1.pulse, 'reduced motion: only Play build, never a pulse ' + JSON.stringify(r1));
  check(r1.layer === 0 && r1.h1 === '1' && r1.anim === 'none', 'reduced motion: no layer pieces, content visible, steady cursor ' + JSON.stringify(r1));
  check(r1.footer === '\u21bb Replay', 'instant mode: the footer slot shows only Replay, got ' + r1.footer);
  await rp.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await click(rp, '[data-dock-action="play"]');
  await frames(rp, 20);
  const r2 = await rp.evaluate(() => ({ y: window.scrollY, mode: document.documentElement.getAttribute('data-build-mode'), speed: document.documentElement.getAttribute('data-build-speed'), boot: document.querySelectorAll('.sp-boot').length, footer: document.querySelector('[data-footer-build]').textContent.trim() }));
  check(r2.y === 0 && r2.mode === 'pending' && r2.speed === '1' && r2.boot === 1 && r2.footer === '', 'Play build scrolls to the top and replays from the boot ' + JSON.stringify(r2));
  const played = await until(rp, (s) => fin(s.states[0]), 'hero done after Play build');
  check(played.t + 400 >= 2800 && played.t + 400 <= 3600, 'Play build runs the hero at 1x: ' + (played.t + 400) + ' ms');

  const ip = await open(browser, {}, '', () => localStorage.setItem('sp-speed', 'inf'));
  await frames(ip, 5);
  const r3 = await ip.evaluate(() => { const d = document.querySelector('.sp-dock'); const sp = d.querySelector('[data-dock-action="speed"]'); return { mode: document.documentElement.getAttribute('data-build-mode'), state: d.getAttribute('data-state'), text: d.querySelector('.sp-dock-status').textContent, shown: !sp.hidden, label: sp.getAttribute('aria-label'), layer: document.querySelectorAll('.sp-boot, .sp-window, .sp-select, .sp-skel').length, footer: document.querySelector('[data-footer-build]').textContent.trim() }; });
  check(r3.mode === 'instant' && r3.state === 'idle' && r3.text.includes('5/5 sections') && r3.shown, 'saved infinity: ready dock ' + JSON.stringify(r3));
  check(r3.label === 'Build speed: instant. Switch to 1x' && r3.layer === 0 && r3.footer === '\u21bb Replay', 'saved infinity: label, no layer, footer ' + JSON.stringify(r3));
  await click(ip, '[data-dock-action="speed"]');
  await frames(ip, 2);
  const r4 = await ip.evaluate(() => ({ label: document.querySelector('[data-dock-action="speed"]').getAttribute('aria-label'), stored: localStorage.getItem('sp-speed'), attr: document.documentElement.getAttribute('data-build-speed') }));
  check(r4.label === 'Build speed: 1x. Switch to 2x' && r4.stored === '1' && r4.attr === '1', 'leaving infinity updates the label, storage and attribute ' + JSON.stringify(r4));

  const sp = await open(browser);
  await until(sp, (s) => s.dock === 'building', 'dock building');
  const info = () => sp.evaluate(() => { const b = document.querySelector('[data-dock-action="speed"]'); return { label: b.getAttribute('aria-label'), glyph: b.textContent.trim(), stored: localStorage.getItem('sp-speed') }; });
  let i0 = await info();
  check(i0.label === 'Build speed: 1x. Switch to 2x' && i0.glyph === '1\u00d7' && i0.stored === null, 'speed starts at 1x with nothing stored ' + JSON.stringify(i0));
  await click(sp, '[data-dock-action="speed"]'); await frames(sp, 1);
  i0 = await info();
  check(i0.label === 'Build speed: 2x. Switch to instant' && i0.glyph === '2\u00d7' && i0.stored === '2', 'first activation goes to 2x ' + JSON.stringify(i0));
  await click(sp, '[data-dock-action="speed"]'); await frames(sp, 2);
  i0 = await info();
  check(i0.label === 'Build speed: instant. Switch to 1x' && i0.glyph === '\u221e' && i0.stored === 'inf', 'second activation goes to infinity ' + JSON.stringify(i0));
  check(fin((await read(sp)).states[0]), 'switching to infinity finishes the current section');
  await click(sp, '[data-dock-action="speed"]'); await frames(sp, 1);
  i0 = await info();
  check(i0.label === 'Build speed: 1x. Switch to 2x' && i0.stored === '1', 'third activation is back to 1x ' + JSON.stringify(i0));

  const tp = await open(browser, {}, '', () => localStorage.setItem('sp-speed', '2'));
  const two = await until(tp, (s) => fin(s.states[0]), 'hero done at 2x');
  check(two.t >= 1300 && two.t <= 1900, 'at 2x the hero completes in about half of 3100 ms: ' + two.t);
  console.log('PASS: scenario A');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario B (Skip by `Esc`, window bar and dock button, the window body does not skip, `Esc` yields to the mobile menu, Run all by `Shift + Esc`):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const fin = (v) => v === 'done' || v === 'skipped';
const read = (page) => page.evaluate((ids) => ({ states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')), queue: document.documentElement.getAttribute('data-build-queue'), dock: document.querySelector('.sp-dock')?.getAttribute('data-state') ?? null, y: window.scrollY }), IDS);
const frames = async (page, n = 2) => { for (let i = 0; i < n; i++) { await page.clock.runFor(20); await sleep(3); } };
async function until(page, test, label, maxMs = 90000) { for (let t = 0; t < maxMs; t += 20) { await frames(page, 1); const s = await read(page); if (test(s)) return { s, t: t + 20 }; } throw new Error('FAIL: timed out waiting for ' + label); }
const click = (page, sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) throw new Error('FAIL: missing ' + q); e.click(); }, sel);
const scrollTo = (page, id) => page.evaluate((i) => window.scrollTo({ top: document.getElementById(i).getBoundingClientRect().top + window.scrollY - 500, behavior: 'instant' }), id);
async function open(browser, opts = {}, hash = '', init = null) { const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts }); if (init) await ctx.addInitScript(init); const page = await ctx.newPage(); await page.clock.install({ time: 0 }); await page.goto(URL + hash, { waitUntil: 'domcontentloaded' }); await page.clock.pauseAt(60000); return page; }
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  let page = await open(browser);
  await until(page, (s) => s.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);
  check((await read(page)).states[0] === 'skipped', 'Esc skips the hero within a frame');
  const info = await page.evaluate(() => ({ win: document.querySelectorAll('.sp-window').length, text: document.querySelector('.sp-dock-status').textContent.trim() }));
  check(info.win === 0 && /^\u2714 Hero Section created\. \(\d+(\.\d+)?s\)$/.test(info.text), 'window gone and the dock shows the created text: ' + JSON.stringify(info));
  await frames(page, 30);
  check((await read(page)).states[1] === 'pending', 'the next section still waits for its own trigger');

  await scrollTo(page, 'about');
  await until(page, (s) => s.states[1] === 'building', 'about building');
  const probe = await page.evaluate(() => { const sec = document.getElementById('about').getBoundingClientRect(); const hit = document.elementFromPoint(sec.left + sec.width / 2, sec.top + 200); const bar = document.querySelector('.sp-window[data-section="about"] .sp-window-bar').getBoundingClientRect(); return { throughToPage: !!hit && !hit.closest('.sp-window-chrome'), bar: [bar.x + bar.width / 2, bar.y + bar.height / 2] }; });
  check(probe.throughToPage, 'a click on the window body reaches the page, not the window chrome');
  await page.mouse.click(probe.bar[0], probe.bar[1]);
  await frames(page, 2);
  check((await read(page)).states[1] === 'skipped', 'a click on the window title bar skips the section');

  await scrollTo(page, 'projects');
  await until(page, (s) => s.states[2] === 'building', 'projects building');
  const skipLabel = await page.evaluate(() => document.querySelector('[data-dock-action="skip"]').getAttribute('aria-label'));
  check(skipLabel === 'Skip this section' + String.fromCharCode(39) + 's build', 'the Skip button is named: ' + skipLabel);
  await click(page, '[data-dock-action="skip"]');
  await frames(page, 2);
  check((await read(page)).states[2] === 'skipped', 'the dock Skip button skips the section');

  const mp = await open(browser, { viewport: { width: 375, height: 812 } });
  await until(mp, (s) => s.states[0] === 'building', 'mobile hero building');
  await click(mp, '.sp-menu-toggle');
  const opened = await mp.evaluate(() => document.getElementById('mobile-menu').matches(':popover-open'));
  check(opened, 'the mobile menu popover opened');
  await mp.keyboard.press('Escape');
  await frames(mp, 2);
  const afterEsc = await mp.evaluate(() => document.getElementById('mobile-menu').matches(':popover-open'));
  check(!afterEsc && !fin((await read(mp)).states[0]), 'with the menu open Esc only closes the menu and does not skip');
  await mp.keyboard.press('Escape');
  await frames(mp, 2);
  check((await read(mp)).states[0] === 'skipped', 'the next Esc skips the hero');

  page = await open(browser);
  await until(page, (s) => s.states[0] === 'building', 'hero building for run all');
  await page.keyboard.press('Escape');
  await frames(page, 2);
  await scrollTo(page, 'about');
  await until(page, (s) => s.states[1] === 'building', 'about building for run all');
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  const all = await read(page);
  check(all.states.every(fin), 'Shift + Esc finishes every remaining section within a frame: ' + all.states);
  const done = await page.evaluate(() => ({ win: document.querySelectorAll('.sp-window').length, text: document.querySelector('.sp-dock-status').textContent.trim(), replay: !document.querySelector('[data-dock-action="replay"]').hidden }));
  check(done.win === 0 && /^\u2714 Build complete: 5 sections in \d+(\.\d+)?s$/.test(done.text) && done.replay, 'Run all ends in the done state with Replay: ' + JSON.stringify(done));
  console.log('PASS: scenario B');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario C (turbo with `queued n/5`, scrolling never hijacked, deep links, nav clicks):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const fin = (v) => v === 'done' || v === 'skipped';
const read = (page) => page.evaluate((ids) => ({ states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')), queue: document.documentElement.getAttribute('data-build-queue'), dock: document.querySelector('.sp-dock')?.getAttribute('data-state') ?? null, y: window.scrollY }), IDS);
const frames = async (page, n = 2) => { for (let i = 0; i < n; i++) { await page.clock.runFor(20); await sleep(3); } };
async function until(page, test, label, maxMs = 90000) { for (let t = 0; t < maxMs; t += 20) { await frames(page, 1); const s = await read(page); if (test(s)) return { s, t: t + 20 }; } throw new Error('FAIL: timed out waiting for ' + label); }
const click = (page, sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) throw new Error('FAIL: missing ' + q); e.click(); }, sel);
const scrollTo = (page, id) => page.evaluate((i) => window.scrollTo({ top: document.getElementById(i).getBoundingClientRect().top + window.scrollY - 500, behavior: 'instant' }), id);
async function open(browser, opts = {}, hash = '', init = null) { const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts }); if (init) await ctx.addInitScript(init); const page = await ctx.newPage(); await page.clock.install({ time: 0 }); await page.goto(URL + hash, { waitUntil: 'domcontentloaded' }); await page.clock.pauseAt(60000); return page; }
const dur = (page) => page.evaluate((ids) => Object.fromEntries(ids.map((id) => [id, JSON.parse(document.getElementById(id).getAttribute('data-build')).duration])), IDS);
async function watch(page, y0, untilIndex, seen, first, last) {
  let now = 0;
  for (let i = 0; i < 6000 && last[untilIndex] === undefined; i++) {
    await frames(page, 1); now += 20;
    const s = await read(page);
    check(s.y === y0, 'scrollY never changes while building (' + s.y + ' vs ' + y0 + ')');
    if (s.queue) seen.add(s.queue);
    s.states.forEach((v, k) => { if (v !== 'pending' && v !== 'queued' && first[k] === undefined) first[k] = now; if (fin(v) && last[k] === undefined) last[k] = now; });
  }
  check(last[untilIndex] !== undefined, 'section ' + untilIndex + ' finished');
}
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  let page = await open(browser);
  const D = await dur(page);
  await until(page, (s) => fin(s.states[0]), 'hero done');
  await scrollTo(page, 'contact');
  const y0 = (await read(page)).y;
  let seen = new Set(); let first = {}; let last = {}; let now = 0; let dockChecked = false;
  for (let i = 0; i < 6000 && last[4] === undefined; i++) {
    await frames(page, 1); now += 20;
    const s = await read(page);
    check(s.y === y0, 'scrollY never changes during the turbo build (' + s.y + ' vs ' + y0 + ')');
    if (s.queue) seen.add(s.queue);
    if (s.queue === '2/5' && !dockChecked) { dockChecked = true; const t = await page.evaluate(() => document.querySelector('.sp-dock-status').textContent.trim()); check(t === 'queued 2/5', 'the dock shows the queue status: ' + t); }
    if (s.states[4] === 'building') check(s.queue === null, 'Contact builds at 1x with no queue status');
    s.states.forEach((v, k) => { if (v !== 'pending' && v !== 'queued' && first[k] === undefined) first[k] = now; if (fin(v) && last[k] === undefined) last[k] = now; });
  }
  check(last[4] !== undefined, 'Contact finished');
  check(['2/5', '3/5', '4/5'].every((q) => seen.has(q)), 'the queue status walks 2/5, 3/5, 4/5: ' + [...seen]);
  [[1, 'about'], [2, 'projects'], [3, 'stack']].forEach(([k, id]) => { const took = last[k] - first[k]; check(Math.abs(took - D[id] / 5) <= 150, id + ' builds at 5x: took ' + took + ', want about ' + D[id] / 5); });
  check(Math.abs(last[4] - first[4] - D.contact) <= 300, 'Contact builds at 1x right after them: ' + (last[4] - first[4]) + ' vs ' + D.contact);

  page = await open(browser, {}, '#projects');
  const D2 = await dur(page);
  let y1 = 0;
  for (let i = 0; i < 20 && y1 === 0; i++) { await frames(page, 1); y1 = (await read(page)).y; }
  check(y1 > 0, 'the browser anchor navigation put Projects in view at once');
  const early = await page.evaluate(() => { const r = document.getElementById('projects').getBoundingClientRect(); return { inView: r.top <= innerHeight * 0.75 && r.bottom > 0, outline: [...document.querySelectorAll('.sp-outline')].some((o) => o.textContent.includes('projects.tsx') && !o.hasAttribute('data-hidden')) }; });
  check(early.inView && early.outline, 'Projects is in view and shows its pending outline while the hero builds: ' + JSON.stringify(early));
  seen = new Set(); first = {}; last = {};
  await watch(page, y1, 2, seen, first, last);
  check(seen.has('1/5') && seen.has('2/5'), 'the hero and About build in turbo: ' + [...seen]);
  check(last[0] <= first[2] && last[1] <= first[2], 'the hero and About are finished before Projects starts');
  check(Math.abs(last[0] - first[0] - D2.top / 5) <= 200, 'the hero, boot included, builds in turbo: ' + (last[0] - first[0]) + ' vs ' + D2.top / 5);
  check(Math.abs(last[2] - first[2] - D2.projects) <= 300, 'Projects builds at 1x: ' + (last[2] - first[2]) + ' vs ' + D2.projects);

  for (const id of ['about', 'contact']) {
    const p = await open(browser, {}, '#' + id);
    const k = IDS.indexOf(id);
    let yy = 0;
    for (let i = 0; i < 20 && yy === 0; i++) { await frames(p, 1); yy = (await read(p)).y; }
    check(yy > 0, '/#' + id + ' goes to the target at once');
    const r = await until(p, (s) => s.states[k] === 'building', id + ' building');
    check(r.s.states.slice(0, k).every(fin), 'the sections before ' + id + ' are built before it');
    check(r.s.y === yy, 'the runtime did not scroll for /#' + id);
    await until(p, (s) => fin(s.states[k]), id + ' done');
  }

  page = await open(browser);
  const D3 = await dur(page);
  await until(page, (s) => s.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);
  await click(page, '.sp-nav-links a[href="#stack"]');
  await frames(page, 2);
  const n = await read(page);
  const view = await page.evaluate(() => { const r = document.getElementById('stack').getBoundingClientRect(); return r.top <= innerHeight * 0.75 && r.bottom > 0; });
  check(n.y > 0 && view, 'the nav link went to Stack at once');
  seen = new Set(); first = {}; last = {};
  await watch(page, n.y, 3, seen, first, last);
  check(first[1] < first[2] && first[2] < first[3], 'About, Projects and Stack build in order');
  check(Math.abs(last[1] - first[1] - D3.about / 5) <= 150, 'About builds in turbo: ' + (last[1] - first[1]));
  check(Math.abs(last[3] - first[3] - D3.stack) <= 300, 'Stack builds at 1x after them: ' + (last[3] - first[3]) + ' vs ' + D3.stack);
  console.log('PASS: scenario C');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario D (focus rule, width-only resize, scroll hint, done state, collapsed dock, footer summary, Replay from the footer and the dock):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const fin = (v) => v === 'done' || v === 'skipped';
const read = (page) => page.evaluate((ids) => ({ states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')), queue: document.documentElement.getAttribute('data-build-queue'), dock: document.querySelector('.sp-dock')?.getAttribute('data-state') ?? null, y: window.scrollY }), IDS);
const frames = async (page, n = 2) => { for (let i = 0; i < n; i++) { await page.clock.runFor(20); await sleep(3); } };
async function until(page, test, label, maxMs = 90000) { for (let t = 0; t < maxMs; t += 20) { await frames(page, 1); const s = await read(page); if (test(s)) return { s, t: t + 20 }; } throw new Error('FAIL: timed out waiting for ' + label); }
const click = (page, sel) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) throw new Error('FAIL: missing ' + q); e.click(); }, sel);
const scrollTo = (page, id) => page.evaluate((i) => window.scrollTo({ top: document.getElementById(i).getBoundingClientRect().top + window.scrollY - 500, behavior: 'instant' }), id);
async function open(browser, opts = {}, hash = '', init = null) { const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts }); if (init) await ctx.addInitScript(init); const page = await ctx.newPage(); await page.clock.install({ time: 0 }); await page.goto(URL + hash, { waitUntil: 'domcontentloaded' }); await page.clock.pauseAt(60000); return page; }
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  for (const sel of ['.sp-nav a.sp-nav-link', '#main', '#top a']) {
    const p = await open(browser);
    await until(p, (s) => ['command', 'window', 'building'].includes(s.states[0]), 'boot in progress');
    await p.evaluate((q) => document.querySelector(q).focus(), sel);
    await frames(p, 2);
    check(fin((await read(p)).states[0]), 'focus in ' + sel + ' during the boot finishes the hero');
  }
  let page = await open(browser);
  await until(page, (s) => s.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);
  await page.evaluate(() => document.querySelector('#projects a.sp-card-link').focus());
  await frames(page, 2);
  const f = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { inProjects: !!a.closest('#projects'), ring: a.matches(':focus-visible'), w: cs.outlineWidth, style: cs.outlineStyle }; });
  const fs = await read(page);
  check(fin(fs.states[0]) && fin(fs.states[1]) && fin(fs.states[2]), 'focus in Projects finishes Projects and every section before it: ' + fs.states);
  check(!fin(fs.states[3]) && !fin(fs.states[4]), 'sections after the focused one are untouched');
  check(f.inProjects && f.ring && f.w === '2px' && f.style === 'solid', 'focus stays on the element and shows the 2px ring: ' + JSON.stringify(f));

  page = await open(browser);
  await until(page, (s) => s.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);
  await scrollTo(page, 'about');
  await until(page, (s) => s.states[1] === 'building', 'about building');
  await page.setViewportSize({ width: 1024, height: 800 });
  await frames(page, 3);
  const rz = await page.evaluate(() => document.querySelectorAll('.sp-window[data-section="about"]').length);
  check(fin((await read(page)).states[1]) && rz === 0, 'a width change finishes the active section and removes its window');
  const mob = await open(browser, { viewport: { width: 375, height: 812 } });
  await until(mob, (s) => s.states[0] === 'building', 'mobile hero building');
  await mob.setViewportSize({ width: 375, height: 700 });
  await frames(mob, 3);
  check(!fin((await read(mob)).states[0]), 'a height-only change does not finish the build');
  await until(mob, (s) => fin(s.states[0]), 'mobile hero done', 6000);

  page = await open(browser);
  await until(page, (s) => s.dock === 'idle', 'dock idle after the hero');
  const pulse = () => page.evaluate(() => document.querySelector('.sp-dock-hint').hasAttribute('data-pulse'));
  await frames(page, 175);
  check(!(await pulse()), 'no pulse before 4 s of idle');
  await frames(page, 55);
  check(await pulse(), 'the scroll hint pulses after 4 s without a scroll');
  await page.evaluate(() => window.scrollBy(0, 4));
  await frames(page, 2);
  check(!(await pulse()), 'the pulse stops at the next scroll');

  page = await open(browser);
  const before = await page.evaluate(() => { const f = document.querySelector('footer').getBoundingClientRect(); return { h: document.documentElement.scrollHeight, f: [f.x, f.y + window.scrollY, f.width, f.height], text: document.querySelector('[data-footer-build]').textContent }; });
  check(before.text === '', 'the footer slot is empty before the build');
  await until(page, (s) => s.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  const done = await page.evaluate(() => { const d = document.querySelector('.sp-dock'); const f = document.querySelector('footer').getBoundingClientRect(); return { state: d.getAttribute('data-state'), text: d.querySelector('.sp-dock-status').textContent.trim(), replay: !d.querySelector('[data-dock-action="replay"]').hidden, footer: document.querySelector('[data-footer-build]').textContent.trim(), h: document.documentElement.scrollHeight, f: [f.x, f.y + window.scrollY, f.width, f.height], stored: localStorage.getItem('sp-speed') }; });
  const m = /^\u2714 Build complete: 5 sections in (\d+(\.\d+)?)s$/.exec(done.text);
  check(done.state === 'done' && m && done.replay, 'Run all ends in the done state with Replay: ' + JSON.stringify(done));
  check(done.footer === 'Built live in ' + m[1] + 's \u00b7 \u21bb Replay', 'the footer shows the same seconds as the dock: ' + done.footer);
  check(Math.abs(done.h - before.h) <= 0.5 && done.f.every((v, i) => Math.abs(v - before.f[i]) <= 0.5), 'filling the footer slot moves nothing');
  check(done.stored === null, 'nothing is stored but sp-speed, and it is untouched');
  await frames(page, 175);
  check((await read(page)).dock === 'done', 'the done state lasts about 4 s');
  await frames(page, 55);
  check((await read(page)).dock === 'collapsed', 'the dock collapses into the round button after about 4 s');
  const fab = await page.evaluate(() => { const b = document.querySelector('[data-dock-action="expand"]'); return { shown: !b.hidden, tag: b.tagName, label: b.getAttribute('aria-label'), glyph: b.textContent.trim() }; });
  check(fab.shown && fab.tag === 'BUTTON' && fab.glyph === '\u276f_' && fab.label === 'Show build status', 'the collapsed dock is a real button: ' + JSON.stringify(fab));
  await click(page, '[data-dock-action="expand"]');
  await frames(page, 2);
  check((await read(page)).dock === 'done', 'the collapsed button reopens the done state');

  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await click(page, '[data-footer-build] button');
  await frames(page, 20);
  const rp = await page.evaluate(() => ({ y: window.scrollY, mode: document.documentElement.getAttribute('data-build-mode'), footer: document.querySelector('[data-footer-build]').textContent.trim(), boot: document.querySelectorAll('.sp-boot').length }));
  const rs = await read(page);
  check(rp.y === 0 && rp.mode === 'pending' && rp.footer === '' && rp.boot === 1 && rs.states[1] === 'pending' && !fin(rs.states[0]), 'the footer Replay scrolls to the top, resets every section and replays from the boot: ' + JSON.stringify(rp));
  await until(page, (s) => ['window', 'building'].includes(s.states[0]), 'replayed hero building');
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await click(page, '[data-dock-action="replay"]');
  await frames(page, 20);
  const rd = await page.evaluate(() => ({ y: window.scrollY, boot: document.querySelectorAll('.sp-boot').length, stored: localStorage.getItem('sp-speed') }));
  check(rd.y === 0 && rd.boot === 1 && rd.stored === null, 'the dock Replay does the same and stores nothing: ' + JSON.stringify(rd));
  console.log('PASS: scenario D');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario E (one overlay root, everything aria-hidden except the dock group and its buttons, and no build layer outside `/`):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const read = (page) => page.evaluate((ids) => ({ states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')), dock: document.querySelector('.sp-dock')?.getAttribute('data-state') ?? null }), IDS);
const frames = async (page, n = 2) => { for (let i = 0; i < n; i++) { await page.clock.runFor(20); await sleep(3); } };
async function until(page, test, label, maxMs = 90000) { for (let t = 0; t < maxMs; t += 20) { await frames(page, 1); const s = await read(page); if (test(s)) return s; } throw new Error('FAIL: timed out waiting for ' + label); }
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.clock.pauseAt(60000);
  await until(page, (s) => s.states[0] === 'building', 'hero building');
  const r = await page.evaluate(() => {
    const layers = document.querySelectorAll('[data-build-layer]');
    const layer = layers[0];
    const dock = document.querySelector('.sp-dock');
    const buttons = [...dock.querySelectorAll('button')].filter((b) => !b.hidden);
    return { layers: layers.length, layerHidden: layer.getAttribute('aria-hidden'), others: [...layer.children].filter((k) => k !== dock && k.getAttribute('aria-hidden') !== 'true').map((k) => k.className), role: dock.getAttribute('role'), label: dock.getAttribute('aria-label'), status: dock.querySelector('.sp-dock-status').getAttribute('aria-hidden'), log: dock.querySelector('.sp-dock-log').getAttribute('aria-hidden'), hint: dock.querySelector('.sp-dock-hint').getAttribute('aria-hidden'), names: buttons.map((b) => b.getAttribute('aria-label')), tags: buttons.map((b) => b.tagName), tabs: buttons.map((b) => b.tabIndex), inMain: !!document.querySelector('main [data-build-layer]'), afterPage: layer.previousElementSibling?.classList.contains('sp-page') ?? false };
  });
  check(r.layers === 1 && !r.inMain && r.afterPage, 'exactly one overlay root, a sibling of .sp-page outside main: ' + JSON.stringify(r));
  check(r.layerHidden === null, 'the layer root is not aria-hidden, so the dock buttons stay reachable');
  check(r.others.length === 0, 'every layer child except the dock is aria-hidden: ' + r.others);
  check(r.role === 'group' && r.label === 'Site build', 'the dock is a group named Site build');
  check(r.status === 'true' && r.log === 'true' && r.hint === 'true', 'the dock status text, log and hint are hidden from assistive technology');
  check(r.tags.length >= 2 && r.tags.every((t) => t === 'BUTTON') && r.tabs.every((t) => t >= 0), 'the visible dock controls are real, tabbable buttons: ' + JSON.stringify(r.tags));
  check(r.names.includes('Skip this section' + String.fromCharCode(39) + 's build') && r.names.some((n) => n.startsWith('Build speed: ')), 'the buttons carry their accessible names: ' + r.names);
  await page.keyboard.press('Shift+Escape');
  await frames(page, 2);
  const names = await page.evaluate(() => [...document.querySelectorAll('.sp-dock button')].filter((b) => !b.hidden).map((b) => b.getAttribute('aria-label')));
  check(names.includes('Replay the build'), 'the done dock offers Replay the build: ' + names);
  for (const path of ['/projects/relay/', '/no-such-page']) {
    const other = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    await other.goto('http://127.0.0.1:' + PORT + path, { waitUntil: 'load' });
    const n = await other.evaluate(() => document.querySelectorAll('[data-build-layer], .sp-dock, [data-footer-build]').length);
    check(n === 0, path + ': no build layer, dock or footer slot outside the home page');
  }
  console.log('PASS: scenario E');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

## Acceptance Criteria

- **AC-A1 (PRD AC-7):** Given a section building with its window open, `Esc`, the dock button named "Skip this section's build", or a click on the window's title bar or command bar puts that section in its final state within one frame, removes its window and shows `✔ <Section> Section created. (<t>s)` in the dock; the next section still waits for its own trigger; a click on the window body does not skip (it reaches the page); and with the mobile menu popover open `Esc` only closes the menu.
- **AC-A2 (PRD AC-8):** `Shift + Esc` finishes every remaining section (triggered or not) within one frame, leaves no window, and the dock shows `✔ Build complete: 5 sections in <t>s` with `↻ Replay`; a second press changes nothing. The `Shift + Esc` behavior in real Chrome on Windows is recorded in docs/02-experience.md as pending the owner's check (the handler is proven by the E2E key dispatch only).
- **AC-A3 (PRD AC-13):** The dock speed button cycles `1×`, `2×`, `∞`, `1×` with the accessible names `Build speed: 1x. Switch to 2x`, `Build speed: 2x. Switch to instant`, `Build speed: instant. Switch to 1x`; `localStorage` key `sp-speed` holds the choice and is the only key the runtime writes; at `2×` the hero completes in about half its 1× time; switching to `∞` finishes the current section and every triggered one; a saved `∞` reloads into a ready page (no boot, window or typing) whose dock shows `✓ 5/5 sections` with a speed button that can leave `∞`.
- **AC-A4 (PRD AC-14):** With reduced motion the page is ready at load, the dock shows `✔ Ready · motion reduced` with a steady cursor and a button named "Play the build animation", no pulse and no layer piece exists; activating Play build scrolls to the top, resets every section and plays the build at 1× from the boot.
- **AC-A5 (PRD AC-17):** After every section is built the dock shows the done state with `↻ Replay` for about 4 s and then collapses into the round `❯_` button, which is a real button that reopens the done state; the footer shows `Built live in <t>s · ↻ Replay` with the same `<t>` as the dock (only `↻ Replay` in instant mode), filling the reserved slot moves no box and no document height; Replay from the dock or the footer scrolls to the top, returns every section to pending and replays from the boot.
- **AC-A6 (PRD AC-5, AC-6):** When the visitor scrolls straight to Contact the three sections before it build in order at one fifth of their 1× clock time (within a frame) while the dock shows `queued <n>/5` and `<html>` carries `data-build-queue`, Contact then builds at 1× with no queue status; `window.scrollY` never changes during any build; the only code that moves the page is `window.scrollTo(0, 0)` on Replay and Play build.
- **AC-A7 (PRD AC-9):** A first visit to `/#projects`, `/#about` or `/#contact` puts the target in view at once through the browser's anchor navigation (the runtime does not scroll), the hero (boot included) and the sections before the target build in turbo in order while the target shows its pending outline, and then the target builds at 1×; activating the nav's Stack link with only the hero built goes to Stack at once, builds About and Projects in turbo in order, then Stack at 1×.
- **AC-A8 (PRD AC-10):** When keyboard focus enters an element inside an unbuilt section, that section and every section before it reach their final state within one frame, focus stays on the element and shows the 2px accent ring; while the boot is in progress, focus entering the nav, `#main` or the hero finishes the hero.
- **AC-A9 (PRD AC-12):** A viewport width change (1280 to 1024) finishes the active section within one frame and removes its window while later sections build normally on their triggers; a height-only change at 375 px leaves the build running.
- **AC-A10 (PRD AC-3):** With the hero built and the dock idle, 4 s of clock time without a scroll puts the `scroll ↓` hint in its pulsing state (`data-pulse`), the pulse stops at the next scroll, and with reduced motion (or `∞`) it never pulses.
- **AC-A11 (PRD AC-18, AC-4):** The build layer is one overlay root outside `<main>`; every child except the dock is `aria-hidden`; the dock is a `role="group"` named "Site build" whose status, log and hint are aria-hidden while its controls are real, tabbable `<button>` elements named "Skip this section's build", "Build speed: …", "Replay the build" and "Play the build animation" (and "Show build status" for the collapsed `❯_`), each showing the global 2px accent focus ring; the compact dock (under 768 px) shows only the status and `» Skip`.
- **AC-A12 (PRD AC-19 and Phase 4 scope):** Docs are amended before the code; `src/runtime/api.ts` exposes `Controls` (`skip`, `runAll`, `setSpeed`, `cycleSpeed`, `replay`, `play`) and the stores (`currentSection`, `progress`, `status`, `speed`, `queue`) for Stage 5 with no test hook on `window`; `pnpm check:budgets` stays green (runtime + effects <= 18 KB gzip, critical <= 20 KB, total JS <= 90 KB, CSS <= 25 KB), `pnpm check:tokens` finds no literal, and no control, footer fill or layer piece reaches the 404 or project pages.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| The 18 KB runtime + effects budget is exceeded by the controls, the footer factory, the three input modules and the extra scheduler surface (5.7 KB at Phase 2, effects added in Phase 3) | M | H | Pure shared constants, no dependency, small factories, `pnpm check:budgets` in Tasks 5 and 6 and in Level 2; a breach is fixed in the code, never by raising a limit |
| `Shift + Esc` is swallowed by Chrome (Task Manager) on Windows and Linux, so the page never sees the keydown | H | M | Handler kept as documented; the status is recorded in docs/02 as pending the owner's real-Chrome check; Stage 5's palette Run all is the keyboard path (PRD Open Questions); Playwright proves only the handler |
| The browser closes the mobile menu popover before the runtime's `keydown` runs, so `Esc` would also skip | M | M | The listener is registered in the capture phase so `:popover-open` is still true; Scenario B opens the menu at 375 px, presses `Esc` and asserts the menu closed and the section not skipped. Web research found no spec text on this ordering (see Notes) |
| Moving the dock out of the aria-hidden layer changes existing assertions that expect an aria-hidden layer root | H | M | Intended by AC-A11 and the PRD; the test pair updates them (see Notes); Scenario E asserts the new structure |
| A second `requestAnimationFrame` subscription (idle hint, skip hold, done collapse) violates "one loop" | L | M | It is active only when no section is building and unsubscribes when its mode is `none`; documented in docs/04 ("Idle timers.") and the decisions entry; the scheduler loop is untouched |
| A dock button loses keyboard focus when its state changes (Skip pressed, then hidden) | M | M | Buttons are persistent nodes toggled with `hidden`, and the dock moves focus to the first visible button when the focused one is hidden; Replay and Play build re-create the layer, so focus returns to `body` there (a known limit, noted for the Phase 5 a11y pass) |
| Visible label and accessible name differ ("▶ Play build" vs "Play the build animation") | L | L | Names are fixed by the PRD and Design System; recorded for the Phase 5 axe run |
| Hash scrolling happens after the first `IntersectionObserver` callback, so the hero starts at 1× and turbo begins a moment later | M | L | `trigger` queues every earlier section whenever a later one triggers and turbo is evaluated each frame; Scenario C asserts order, the turbo durations and 1× for the target |
| Replay or Play build tears the whole layer down while a section's effects are mid-step | L | M | `endShow` destroys effects first (finishing every section and clearing every inline style) and then the layer, as `reveal()` already does; Scenario D replays after a Run all and mid-hero |
| Existing unit or E2E specs assert Phase 2-3 behavior the controls change on purpose | H | M | Expected; handled by the test pair's lifecycle ledger (see Notes); the Implementer edits no test |

## Notes

**TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

**Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.

- **Expected test impact (for the test pair, not the Implementer).** (a) The dock root and the layer root are no longer `aria-hidden` and the dock is a `role="group"`; specs that assert an aria-hidden layer root or dock (`tests/e2e/build-layer-show.spec.ts`, `build-layer-layout.spec.ts`, `effects-axe.spec.ts`, `tests/unit/build-layer-components.test.ts` where it covers the dock) must follow the new structure (boot, windows, outlines and the effects container carry their own `aria-hidden`). (b) `tests/e2e/home-no-build-layer.spec.ts` and `tests/e2e/runtime-fallbacks.spec.ts` assume no build-layer element after the build settles or in instant mode; instant mode and the finished build now keep a dock and a footer Replay button (Phase 5 rewrites the Stage 2 spec). (c) `tests/e2e/home-keyboard.spec.ts` and `home-mobile-menu.spec.ts` meet new Tab stops (dock buttons, footer Replay) and an `Esc` listener; start those specs from the ready page. (d) `tests/unit/runtime-scheduler.test.ts` and `runtime-scheduler-tick.test.ts` keep passing (the host callback is optional and `∞` still reports `done`); new unit candidates for the pair: `controls-timing` (every export), the scheduler's `skip`/`runAll`/`finishThrough`/`onQueue` with the manual clock, and `persistSpeed`. (e) Playwright candidates are Scenarios A to E: rules Skip, Run all, Deep links, Keyboard focus, Resize, Revisits, Reduced motion, Fast scrolling, Scroll hint and Never hijack scrolling, with `page.clock`. If an existing unit test asserts the old dock markup and fails against the correct implementation, report a TEST_CONTRACT_DISPUTE; do not edit it.
- **Why `pnpm test:e2e` is not a validation command here.** The Stage 2 and Phase 1-3 specs named above can conflict with the new structure by design until the test pair updates them, so running them in the Implementer's gate would fail against a correct implementation. Level 3 drives the built site with Playwright's library and clock directly; `pnpm test` (unit) stays in Level 2 and in Tasks 2, 3, 4, 6, 8 so a regression in an existing unit test is caught.
- **Validation conventions carried from Phases 1-3.** Level 3 asserts on the DOM, never on the serialized page; each scenario is a self-contained block that writes nothing outside the code root and serves `dist/` on port 4399 with Astro's `preview()` (the `astro preview` on 4321, PID 36980 locally, is never touched and the port need not be free); `pnpm build` runs first because `playwright.config.ts` starts `astro preview` without building. Authored literals in the checks are copied byte-for-byte from this plan's ACTION prose and the existing source: `Build speed: 1x. Switch to 2x`, `Build speed: 2x. Switch to instant`, `Build speed: instant. Switch to 1x`, `Skip this section's build` (built with `String.fromCharCode(39)` to avoid shell quoting), `Replay the build`, `Play the build animation`, `Show build status`, `Site build`, `queued 2/5`, `Built live in <t>s · ↻ Replay`, `✔ Build complete: 5 sections in <t>s`, `✔ Hero Section created. (<t>s)`, the attributes `data-dock-action`, `data-pulse`, `data-build-queue`, `data-footer-build`, `data-build-layer` and the classes `sp-dock`, `sp-dock-status`, `sp-dock-hint`, `sp-dock-log`, `sp-window-bar`, `sp-outline`, `sp-menu-toggle`, `sp-card-link`, `sp-nav-link`, `sp-boot` (the last five exist in the source read for this plan: `NavBar.tsx:55-62`, `MobileMenu.tsx:24-28`, `build-layer.css:255-276`, `layer.ts:198`; `sp-card-link` and `sp-nav-link` come from the Phase 3 plan and `NavBar.tsx:40`). Non-ASCII glyphs in commands are `\u` escapes. Idle moments are sampled at least 500 ms from the 4000 ms thresholds.
- **Why clicks use `.click()` in `page.evaluate`.** Playwright's `locator.click()` waits for the element to be stable using `requestAnimationFrame`, which `page.clock` freezes, so it could hang while the clock is paused; `page.keyboard.press` and `page.mouse.click` send input events directly and are used where a real key or pointer is the behavior under test.
- **Decisions this plan takes that the owner should confirm** (all recorded in the docs/decisions.md entry of Task 1): Replay and Play build always play at normal speed, switching a saved `∞` or `2×` ready page to `1×` and saving it; a skip shows its created text for 1.5 s; a reopened done state collapses again after 4 s; the collapsed button is named "Show build status"; Replay and Play build re-create the layer, so keyboard focus returns to `body` afterwards.
- **`Shift + Esc` owner check (not automatable by the agent).** Build `pnpm build && pnpm preview` (or use the pull request preview), open `/` in real Chrome on Windows, press `Shift + Esc` while the hero is building, and note whether the build jumps to `✔ Build complete: 5 sections in <t>s` (the page received the key) or Chrome's Task Manager opens instead. Then edit the paragraph that starts `Shift + Esc on Windows Chrome:` in docs/02-experience.md with the result, and if Chrome swallows it keep Stage 5's palette Run all as the keyboard path. The same note covers Linux if the owner can test it.
- **Esc and the popover.** Web research (relay research-web) found no authoritative statement of the event order between a document `keydown` listener and the close watcher of a `popover="auto"`, and no authoritative answer on whether Chrome on Windows delivers `Shift + Esc` to pages; both are covered by the capture-phase listener plus Scenario B and by the owner check above.
- **Grounding.** The code root is `C:/repos/site-pro/.worktrees/stage-3-runtime` (branch `feature/stage-3-runtime`, uncommitted Phases 1-3); every `src/` and `docs/` reference above was read there. Facts the plan relies on: the scheduler exposes only `trigger`, `finish`, `setSpeed`, `destroy` (`scheduler.ts:24-29`); `main.ts` creates no layer in instant mode (`main.ts:63-71`); the dock is `aria-hidden` and has no buttons (`CommandDock.ts:31-34`, nothing in `src/` handles `keydown`, `Escape` or `focusin`); nothing writes `sp-speed` (only `Base.astro:45-47` reads it); `Footer.tsx:28-30` renders the empty slot and nothing fills it; `layer.ts:171-186` sends every `done` or `skipped` slot straight to idle (no created text, no hold); there is no `scroll-behavior` in `base.css`.
- **One loop.** The scheduler's frame subscription runs only while a section is building; the layer's idle subscription runs only while the dock is idle, held after a skip, or done. They are never meant to run at the same time; the `data-build-*` and dock behavior are driven only by those two.
- **Hero numbers and sampling.** Hero 3100 ms at 1× (1550 ms at 2×, 620 ms in turbo); the Level 3 tolerances (turbo 120 to 200 ms, 1× 250 to 300 ms, 2× 1300 to 1900 ms, Play build 2800 to 3600 ms) leave a margin over the roughly 52 ms late / 16 ms early sampling error and the 150 ms selection phase of effects (`SELECT_MS`).
- **Phase 5 follow-ups seen while planning.** The axe matrix must cover the dock buttons in all their states; the Phase 5 spec for AC-18 should confirm the label-in-name mismatch noted in Risks; docs/context/testing.md gets the rule to spec mapping for the rules this phase delivers.

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
