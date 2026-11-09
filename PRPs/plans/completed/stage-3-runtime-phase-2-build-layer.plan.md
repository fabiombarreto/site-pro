# Feature: Build layer (Phase 2 of stage-3-runtime)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (build layer as TypeScript DOM factories outside React, one overlay root, window placement from section boxes, clock-driven surfaces); creation of components (BootTerminal, CommandDock, BuildWindow, CommandLine with tokenizer, Cursor, LogLine with spinner, pending outline); cross-cutting patterns (one overlay root, data-* contract, tokens only, copy in src/strings.ts, budgets); impact on shared UI (nav entrance, Footer.tsx reserved slot, build-pending.css, index.astro); business rules for build (B1-B5, B12, B13, B18-B24 surfaces) and visual-design (V9 reserved space, V13, V14, D19 dock, D20 dot grid only inside windows)
- Decisions found:
  - D2 Astro + React + TypeScript strict; the animation runtime and the build layer are plain TypeScript outside React, nanostores share state
  - D17 build windows; D19 the dock at the bottom center (the boot terminal folds into it); D20 the dot grid lives only inside build windows
  - D6 full build on every visit; a saved infinity speed is the only exception (instant mode renders no layer)
  - D7 interactive dock and D8 agents are v1.1 (the dock here is display only)
  - Stage 2 approved: layout, content, section ids, labels and heading structure do not change
  - Stage 3 PRD approved 2026-11-08: build-layer components are TypeScript DOM factories ported from the Design System v2 markup and classes; effects and surfaces are driven by the runtime's clock (only decorative loops in CSS); everything in the layer is aria-hidden except the dock's control buttons (Phase 4); blur only while a surface is visible and solid with prefers-reduced-transparency; the footer summary slot is reserved in the static footer; the runtime runs only on `/`; methodology stays test-after
  - Phase 1 complete: scheduler, compiler, clock, triggers, stores and pending state exist in the worktree
- Applicable anti-patterns:
  - Layout-shifting build animations (overlay only; only transform, opacity and clip-path are animated; no build element enters the page flow)
  - Hiding pending content with `display` or `visibility` (the pending rule stays opacity only; the new nav hide uses opacity and transform)
  - Re-rendering React per typed character (typing writes DOM text from the runtime tick; no React in the layer)
  - Many timers instead of one loop (no setTimeout or setInterval in the layer; CSS animation only for the cursor blink)
  - Mixing the two registers (code look only inside the overlay; the page register is untouched)
  - Raw values instead of tokens (check:tokens scans .css, .astro, .ts and .tsx for color and box-shadow literals)
  - OS or app branding in the window chrome (three neutral dots, our type)
  - Scroll hijacking (the layer never calls scrollTo, scrollIntoView or touches scrollTop)
  - Scope creep into v1 (no palette, no interactive dock, no agents, no effects, no control buttons)
  - Weakening tests to get a green run (the Implementer authors no tests and edits no existing test)
  - Publishing private data (every string shown comes from approved content or the build scripts)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - The build layer is one overlay root, a sibling of `.sp-page` outside `<main>`, created by the runtime and absent from the static HTML; decorative and aria-hidden; windows are placed from each section's box and kept aligned with ResizeObserver; the window body has pointer-events none and only the bars catch clicks
  - Pending content stays laid out and in the accessibility tree; the final layout never moves; the runtime never rewrites page text
  - Budgets: runtime + effects <= 18 KB gzip, critical JS <= 20 KB gzip, total JS <= 90 KB gzip, CSS <= 25 KB gzip, Lighthouse >= 95, CLS about 0
  - Folder contract (docs/context/architecture.md): `src/components/build/` for the factories, `src/runtime/` for the engine, `src/strings.ts` for copy
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-3-runtime.prd.md` — Implementation Phases row 2: "Build layer" — Goal: The show's surfaces exist and follow the scheduler: the boot terminal, the dock and a build window per section. — Success signal: The boot types `startSite();`, folds into the dock, and each section's window opens and closes on its timeline; AC-11 passes; the layer parts of AC-1, AC-4 and AC-21 pass; check:tokens and the size check stay green.

## Summary

Phase 2 puts the show's surfaces on screen and drives them from the Phase 1 scheduler. It adds a pure timing module (`layer-timing.ts`) that turns a section's clock `t` into typed-character counts, log counts, fold, open and close progress; an optional `onTick(id, t, dt)` hook on the scheduler host; the build-layer copy in `src/strings.ts`; a tokenizer and small DOM factories (Cursor, LogLine with spinner, CommandLine, BootTerminal, CommandDock, BuildWindow, pending outline) under `src/components/build/`; a layer controller (`src/runtime/layer.ts`) that creates one overlay root after `.sp-page`, places windows and outlines from section boxes with `ResizeObserver`, and writes only `transform`, `opacity` and `clip-path` per frame; build-layer CSS with tokens only; a nav entrance during the boot; `pointer-events: none` on pending sections and window bodies; and a reserved, empty footer slot on `/`. Instant, reduced-motion, no-JS and failure paths create no layer. Effects, element reveal, control buttons, the collapsed dock behavior, queued status, footer filling and every visitor control stay in Phases 3 and 4.

## User Story

As a visitor opening the site
I want to see a boot terminal fold into a dock and a build window open over each section as it is built
So that the page builds itself live without ever moving the layout or hiding content from me.

## Problem Statement

After Phase 1 the engine moves sections from pending to done, but nothing is visible: the page stays blank until each section's timeline ends. Without the boot terminal, the dock and the build windows, there is no show, Phase 3's effects have no window to run in, and AC-1, AC-4, AC-11 and AC-21 cannot be checked. This phase narrows the problem to the surfaces: they must follow the scheduler's timeline, live in one overlay outside `<main>`, stay decorative and never move a box.

## Solution Statement

Port the Design System v2 build components as plain TypeScript DOM factories and drive them from the scheduler's own clock. The scheduler already knows each section's `t`; a new optional host hook `onTick(id, t, dt)` hands `t` (and the real frame delta) to a layer controller, which derives every surface state from pure functions of `t` in `layer-timing.ts` (so a manual or Playwright clock freezes any moment). DOM writes are cached so only changed text or style is written. Windows and outlines are overlay elements positioned in document coordinates with `transform` plus width and height set only on placement (on resize or font load), the bars live in the section's top padding and are `position: sticky` under the nav, and the body is `pointer-events: none`. Page content is untouched.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (build-layer surfaces) |
| Complexity | HIGH (clock-driven surfaces, placement, sticky bars, nav entrance, tokens-only CSS, five files in src/components/build/) |
| Systems Affected | src/runtime/layer-timing.ts (new), src/runtime/layer.ts (new), src/runtime/compiler.ts, src/runtime/scheduler.ts, src/runtime/main.ts, src/components/build/ (new, 9 files), src/strings.ts, src/styles/build-layer.css (new), src/styles/build-pending.css, src/components/page/Footer.tsx, src/components/page/Footer.css, src/pages/index.astro |
| Dependencies | Phase 1 (complete); no new dependency |
| Estimated Tasks | 9 |
| Source PRD line ref | PRPs/prds/stage-3-runtime.prd.md:201 (row 2), :213-216 (Phase Details) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-3-runtime.prd.md` | 69-90 (AC-1, AC-2, AC-4, AC-11, AC-21), 125-136 (capabilities), 169-181 (Technical Approach), 213-216 (Phase 2) | The contract this phase implements |
| P0 | `src/runtime/scheduler.ts` | 8-14, 118-139, 91-110 | Host interface to extend; `onFrame` and `startNext` are where `onTick` is called |
| P0 | `src/runtime/main.ts` | 15-32, 57-100 | `reveal`/`guard` and the scheduler wiring the layer plugs into |
| P0 | `src/runtime/compiler.ts` | 28-34, 57-106 | Command timing constants and the timeline fields (`commandEnd`, `windowEnd`, `buildStart`, `createdAt`, `duration`) the layer reads |
| P0 | `src/sections/hero.build.ts` | 1-41 | Hero timing override (commandEnd 730, windowEnd 1000, buildStart 1300) that the boot timeline must match |
| P0 | `docs/04-animations.md` | 56-102 (timings, boot timeline), 108-117 (dock and window effects), 177-187 (runtime performance) | Rhythm: typing speeds, log gap, fold and open durations, blur rule |
| P0 | `src/styles/tokens.css` | 89-116 (spacing, radius, `--nav-height`, `--dock-*`, `--window-bar`, fonts), 22-41 (`--syn-*`, `--log-*`, `--shadow-*`, `--bg-overlay`, `--grid-dot`) | Every value the layer CSS may use |
| P0 | `src/styles/build-pending.css` | 1-7 | Pending rule to extend |
| P0 | `src/components/page/NavBar.css` | 1-13, 143-167 | Nav (`position: sticky`, `z-index: 10`, height) and the reduced-transparency and no-backdrop-filter fallbacks to mirror |
| P0 | `src/components/page/Footer.tsx`, `src/components/page/Footer.css` | whole files | Footer markup receiving the reserved slot |
| P0 | `src/pages/index.astro` | 32-50 | Home-only composition; layer CSS import and Footer prop |
| P1 | `src/styles/base.css` | 135-145, 187-194 | `.sp-page` and `.sp-page-content` stacking (z-index 1) and the reduced-motion block (animation: none) |
| P1 | `src/components/page/Backdrop.css` | 1-8 | `.sp-backdrop` stacking inside `.sp-page` |
| P1 | `src/styles/home.css` | 66-177 (hero layers), 258-260 | Section geometry the windows follow; hero is 836 px tall at 1024+ and 900 px under 768 |
| P1 | `src/runtime/triggers.ts` | 1-23 | Disposer pattern for the layer |
| P1 | `PRPs/plans/completed/stage-3-runtime-phase-1-runtime-core.plan.md` | 214-316 (tasks), 727-738 (Notes) | Phase 1 contract and the expected-test-impact convention |
| P1 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/stage-3-prd-research.md` | 5-18 | Prototype v2 timings and the Design System component states and accessible names |
| P2 | `src/strings.ts` | 57-61 | Copy shape (`as const` object) |

## Patterns to Mirror

```ts
# SOURCE: src/runtime/scheduler.ts:8-14
export interface SchedulerHost {
  onState(id: SectionId, state: SectionState): void;
  onProgress(section: SectionId | null, fraction: number): void;
  onIdle(): void;
  onAllDone(): void;
  isHidden(): boolean;
}
```
Copied by Task 2 (the optional `onTick` joins this interface, additive so existing hosts and tests still compile).

```ts
# SOURCE: src/runtime/main.ts:15-32
function reveal(): void {
  cancelFrame?.();
  stopObserver?.();
  for (const s of sections) s.setAttribute('data-build-state', 'done');
  root.removeAttribute('data-build-mode');
  status.set('failed');
}

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
Copied by Task 8 (the layer's callbacks run inside `guard`; `reveal()` also destroys the layer).

```ts
# SOURCE: src/runtime/main.ts:67-98
  const byId = new Map(sections.map((s) => [s.id, s]));
  const scheduler = createScheduler({
    clock: {
      now: realClock.now,
      onFrame(cb) {
        const cancel = realClock.onFrame(guard(cb));
        cancelFrame = cancel;
        return cancel;
      },
    },
    timelines,
    speed: startSpeed,
    host: {
      onState: guard((id, state) => {
        byId.get(id)?.setAttribute('data-build-state', state);
        if (state !== 'pending' && status.get() !== 'building') {
          status.set('building');
        }
      }),
      onProgress: guard((section, fraction) => {
        currentSection.set(section);
        progress.set(fraction);
      }),
      onIdle: guard(() => status.set('idle')),
      onAllDone: guard(() => {
        status.set('done');
        root.removeAttribute('data-build-mode');
      }),
      isHidden: () => document.visibilityState === 'hidden',
    },
  });
```
Copied by Task 8 (the host gains `onTick`, and `onState`/`onAllDone` also forward to the layer).

```ts
# SOURCE: src/runtime/triggers.ts:3-23
export function observeSections(
  sections: HTMLElement[],
  onTrigger: (id: SectionId) => void,
): () => void {
  const fired = new Set<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
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
  );
  for (const section of sections) observer.observe(section);
  return () => observer.disconnect();
}
```
Copied by Task 7 (an exported factory that observes the DOM and returns a disposer; `createBuildLayer` returns `destroy()` the same way).

```ts
# SOURCE: src/runtime/compiler.ts:28-34
const COMMAND_START_MS = 250;
const COMMAND_CHAR_MS = 40;
const COMMAND_SETTLE_MS = 80;
const WINDOW_OPEN_MS = 100;
const WINDOW_HOLD_MS = 280;
const DEFAULT_SETTLE_MS = 300;
const CLOSING_MS = 500;
```
Copied by Task 1 (`layer-timing.ts` owns the three command constants, with `COMMAND_SETTLE_MS` renamed `COMMAND_ENTER_MS`, and the compiler imports them so the layer and the compiled timeline cannot drift).

```css
# SOURCE: src/components/page/NavBar.css:151-167
@media (prefers-reduced-transparency: reduce) {
  .sp-nav,
  :root[data-js] .sp-nav:not(.is-scrolled) {
    background: var(--bg-raised);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@supports not (
  (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
) {
  .sp-nav,
  :root[data-js] .sp-nav:not(.is-scrolled) {
    background: var(--bg-raised);
  }
}
```
Copied by Task 6 (the translucent surfaces fall back to solid `--bg-raised` the same way).

```css
# SOURCE: src/styles/build-pending.css:1-7
html[data-build-mode='pending']
  main
  > section[data-build]:not([data-build-state='done']):not(
    [data-build-state='skipped']
  ) {
  opacity: 0;
}
```
Copied by Task 6 (the same selector gains `pointer-events: none`, and a nav rule is added next to it under the same `data-build-mode='pending'` guard).

```tsx
# SOURCE: src/components/page/Footer.tsx:12-29
export function Footer({
  sourceHref,
  owner,
  className,
}: FooterProps): React.JSX.Element {
  return (
    <footer className={cx('sp-footer', 'text-sm', className)}>
      <div className="sp-footer-inner">
        <p className="sp-footer-meta">
          <TextLink href={sourceHref} external>
            {strings.footer.source}
          </TextLink>
          <span>{`© ${strings.footer.year} ${owner}`}</span>
        </p>
      </div>
    </footer>
  );
}
```
Copied by Task 9 (an opt-in `buildSlot` prop adds one empty `<p>` after the meta paragraph).

```ts
# SOURCE: src/strings.ts:57-61
  footer: {
    source: 'Source',
    year: '2026',
  },
} as const;
```
Copied by Task 3 (new copy is added as a separate `as const` export in the same file).

```astro
# SOURCE: src/pages/index.astro:44
      <Footer sourceHref={sourceHref} owner={profile.name} />
```
Copied by Task 9 (home passes `buildSlot`; project pages and the 404 render the same Footer without it and do not change).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/runtime/layer-timing.ts` | CREATE | Pure, DOM-free timing functions and constants for the surfaces (typed characters, logs, fold, open, close, nav slide, spinner frame, seconds formatting) |
| `src/runtime/compiler.ts` | UPDATE | Import the three command constants from `layer-timing.ts` instead of declaring them; output unchanged |
| `src/runtime/scheduler.ts` | UPDATE | Optional `onTick(id, t, dt)` host hook called at section start and every frame |
| `src/strings.ts` | UPDATE | Build-layer copy as a separate `buildStrings` export |
| `src/components/build/dom.ts`, `tokenize.ts`, `Cursor.ts`, `LogLine.ts`, `CommandLine.ts` | CREATE | Element helper, command tokenizer, cursor, log line with spinner, command line |
| `src/components/build/BootTerminal.ts`, `CommandDock.ts`, `BuildWindow.ts`, `PendingOutline.ts` | CREATE | The surfaces as DOM factories |
| `src/styles/build-layer.css` | CREATE | Build-layer styles, tokens only, blur only while visible, fallbacks, compact rules |
| `src/styles/build-pending.css` | UPDATE | Pending sections ignore the pointer; nav hidden until its entrance |
| `src/runtime/layer.ts` | CREATE | Layer controller: overlay root, placement, ResizeObserver, state and tick drivers, nav entrance, destroy |
| `src/runtime/main.ts` | UPDATE | Create the layer outside instant mode, forward host callbacks, destroy it in `reveal()` |
| `src/components/page/Footer.tsx`, `src/components/page/Footer.css` | UPDATE | Reserved, empty build-summary slot behind an opt-in prop |
| `src/pages/index.astro` | UPDATE | Import `build-layer.css`; pass `buildSlot` to Footer |

## NOT Building (Scope Limits)

- Effects and element reveal (`select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger`, `build-card`), the SelectionBox and Skeleton factories, seeded randomness, dock typing jitter (40 ± 10 ms, +100 ms after `(` and `,`), window command truncation with `…`, and tuning the base scripts to the 3.2 s hero target — Phase 3. In this phase sections still appear whole when their timeline ends, and the window command bar types each step's `call` at a fixed 12 ms per character capped at 350 ms.
- Every control and its behavior: the `» Skip`, speed, Replay and Play build buttons and the dock's `role="group"` wrapper, Esc and Shift + Esc, the collapsed `❯_` button and the 4 s collapse, the `reduced` and `∞` dock states being shown by the runtime, `queued <n>/5`, the scroll hint pulse, deep links, nav-click catch-up, the focus rule, width-only resize handling (windows only realign here), filling the footer slot, the controls API — Phase 4. The dock factory can render the `reduced` and `collapsed` states as inert, aria-hidden markup, but nothing in Phase 2 selects them.
- `image-resolve`, the ASCII photo, real assets — Stage 4. Command Palette, `⌘K`, toasts, easter eggs, `open("slug");`, the ENOENT window — Stage 5. Analytics — Stage 6. Interactive dock (D7) and agents (D8) — v1.1.
- A build layer on project pages or the 404, and any layer in instant mode (reduced motion, saved `∞`), without JavaScript or after a failure.
- Any change to the Stage 2 layout, content, section ids, labels or heading structure; any new dependency.

## Step-by-Step Tasks

### Task 1: CREATE src/runtime/layer-timing.ts and UPDATE src/runtime/compiler.ts

- **ACTION**: Delivers AC-A1 and AC-A2 (the timing every surface follows). Create `layer-timing.ts` with no value imports (type-only imports from `./types` are fine, so `node --experimental-strip-types` can run it). Export constants `COMMAND_START_MS = 250`, `COMMAND_CHAR_MS = 40`, `COMMAND_ENTER_MS = 80`, `WINDOW_CHAR_MS = 12`, `WINDOW_CHAR_CAP_MS = 350`, `BOOT_LOG_GAP_MS = 100`, `BOOT_NAV_AT_MS = 900`, `NAV_SLIDE_MS = 300`, `FOLD_MS = 300`, `WINDOW_CLOSE_MS = 300`, `SPINNER_FRAME_MS = 80`, and pure functions with exactly these signatures: `progressBetween(t: number, from: number, to: number): number` (0 before `from`, 1 at or after `to`, linear between, and `t >= to ? 1 : 0` when `to <= from`); `easeOut(p: number): number` (`1 - (1 - p) ** 3`); `commandChars(t: number, length: number): number` (`clamp(floor((t - COMMAND_START_MS) / COMMAND_CHAR_MS), 0, length)`); `commandEnterAt(length: number): number` (`COMMAND_START_MS + length * COMMAND_CHAR_MS + COMMAND_ENTER_MS`; the hero's `startSite();` gives 810 and a non-hero section's gives its `commandEnd`); `bootLogCount(t: number, enterAt: number): number` (0 before `enterAt`, then `min(2, 1 + floor((t - enterAt) / BOOT_LOG_GAP_MS))`); `stepIndexAt(t: number, steps: { start: number }[]): number` (index of the last step with `start <= t`, or -1); `windowCommandChars(t: number, step: { call: string; start: number }): number` (`duration = min(call.length * WINDOW_CHAR_MS, WINDOW_CHAR_CAP_MS)`, result `floor(call.length * progressBetween(t, step.start, step.start + duration))`); `windowOpenProgress(t, tl)` = `progressBetween(t, tl.windowEnd, tl.buildStart)`; `foldProgress(t, tl)` = `progressBetween(t, tl.windowEnd, tl.windowEnd + FOLD_MS)`; `windowCloseProgress(t, tl)` = `progressBetween(t, tl.createdAt, tl.createdAt + WINDOW_CLOSE_MS)`; `navSlideProgress(t)` = `progressBetween(t, BOOT_NAV_AT_MS, BOOT_NAV_AT_MS + NAV_SLIDE_MS)`; `spinnerFrame(loopMs: number, frames = 10): number` (`floor(loopMs / SPINNER_FRAME_MS) % frames`); `formatSeconds(ms: number, digits = 2): string` (`(ms / 1000).toFixed(digits)`). `tl` is `Pick<Timeline, 'windowEnd' | 'buildStart' | 'createdAt'>`. In `compiler.ts`, delete the local `COMMAND_START_MS`, `COMMAND_CHAR_MS` and `COMMAND_SETTLE_MS` declarations, import `COMMAND_START_MS`, `COMMAND_CHAR_MS` and `COMMAND_ENTER_MS` from `./layer-timing`, and use `COMMAND_ENTER_MS` where `COMMAND_SETTLE_MS` was; every compiled timeline stays byte-identical. Format with `pnpm exec prettier --write` on both files.
- **MIRROR**: `# SOURCE: src/runtime/compiler.ts:28-34`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm test; node --experimental-strip-types --no-warnings --input-type=module -e "import * as t from './src/runtime/layer-timing.ts'; const tl = { commandEnd: 730, windowEnd: 1000, buildStart: 1300, createdAt: 4000 }; const eq = (a, b, m) => { if (a !== b) { console.error('FAIL: ' + m + ' got ' + a + ' want ' + b); process.exit(1); } }; eq(t.commandEnterAt(12), 810, 'enter'); eq(t.commandChars(370, 12), 3, 'chars'); eq(t.commandChars(0, 12), 0, 'chars0'); eq(t.commandChars(9999, 12), 12, 'charsmax'); eq(t.bootLogCount(809, 810), 0, 'log0'); eq(t.bootLogCount(810, 810), 1, 'log1'); eq(t.bootLogCount(910, 810), 2, 'log2'); eq(t.foldProgress(1150, tl), 0.5, 'fold'); eq(t.windowOpenProgress(1300, tl), 1, 'open'); eq(t.windowCloseProgress(4150, tl), 0.5, 'close'); eq(t.windowCommandChars(1060, { call: 'abcdefghij', start: 1000 }), 5, 'wcmd'); eq(t.windowCommandChars(1175, { call: 'x'.repeat(100), start: 1000 }), 50, 'wcap'); eq(t.stepIndexAt(5, [{ start: 10 }]), -1, 'step'); eq(t.formatSeconds(2310), '2.31', 'secs'); eq(t.spinnerFrame(160), 2, 'spin');"`

### Task 2: UPDATE src/runtime/scheduler.ts (onTick hook)

- **ACTION**: Delivers AC-A1 and AC-A2 (the layer needs the section clock `t`). Add an optional `onTick?(id: SectionId, t: number, dt: number): void;` to `SchedulerHost`. Call `host.onTick?.(entry.timeline.section, 0, 0)` in `startNext` right after `publish(entry.timeline.section, 0)`. In `onFrame`, after the `setState(entry, stateAt(entry.timeline, entry.t))` and `publish(...)` calls (the path that does not complete the section), call `host.onTick?.(entry.timeline.section, entry.t, dt)` where `dt` is the capped real frame delta already computed (unscaled by speed or turbo). Do not call it when the section completes (`entry.t >= duration`) or while hidden. The hook is optional so every existing host and scheduler test keeps working; change nothing else in the scheduler.
- **MIRROR**: `# SOURCE: src/runtime/scheduler.ts:8-14`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm test; node --experimental-strip-types --no-warnings --input-type=module -e "import { createScheduler } from './src/runtime/scheduler.ts'; import { createManualClock } from './src/runtime/clock.ts'; const bad = (m) => { console.error('FAIL: ' + m); process.exit(1); }; const mk = (section, d) => ({ v: 1, section, file: section + '.x', command: 'c();', commandEnd: 100, windowEnd: 200, buildStart: 300, steps: [{ call: 'a', target: 't', effect: 'pop', start: 300, end: 600 }], createdAt: 900, duration: d }); const clock = createManualClock(); const ticks = []; const done = []; const s = createScheduler({ clock, timelines: [mk('top', 1400), mk('about', 1400)], speed: '1', host: { onState: (id, st) => { if (st === 'done') done.push(id); }, onProgress() {}, onIdle() {}, onAllDone() {}, isHidden: () => false, onTick: (id, t, dt) => ticks.push([id, t, dt]) } }); s.trigger('top'); clock.advance(2000); if (ticks.length < 10) bad('too few ticks'); if (ticks[0][0] !== 'top' || ticks[0][1] !== 0 || ticks[0][2] !== 0) bad('first tick is not t=0 dt=0'); if (ticks.some((k) => k[2] > 50)) bad('dt above the 50 ms cap'); if (done.join() !== 'top') bad('top should be done'); if (ticks.some((k, i) => i > 0 && k[1] < ticks[i - 1][1])) bad('t went backwards'); if (ticks.some((k) => k[1] >= 1400)) bad('tick at or after the duration');"`

### Task 3: UPDATE src/strings.ts (build-layer copy)

- **ACTION**: Delivers AC-A1 and AC-A2 (every string the surfaces show). Add a second export after `strings`: `export const buildStrings = { ... } as const;` (a separate export so the runtime bundle imports only it) with exactly these members: `initializing: 'Initializing application...'`; `openingFile: (file: string) => \`Opening ${file}...\``; `readingFile: (file: string) => \`Reading ${file}...\``; `building: (name: string) => \`Building ${name}…\``; `created: (label: string, seconds: string) => \`✔ ${label} Section created. (${seconds}s)\``; `idleCount: (done: number, total: number) => \`✓ ${done}/${total} sections\``; `scrollHint: 'scroll ↓'`; `complete: (total: number, seconds: string) => \`✔ Build complete: ${total} sections in ${seconds}s\``; `reducedReady: '✔ Ready · motion reduced'`; `prompt: '❯'`; `collapsedGlyph: '❯_'`; `sectionLabels: { top: 'Hero', about: 'About', projects: 'Projects', stack: 'Stack', contact: 'Contact' }`. No em dashes, no private data. Do not touch `strings`. Format with prettier.
- **MIRROR**: `# SOURCE: src/strings.ts:57-61`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; node --experimental-strip-types --no-warnings --input-type=module -e "import { buildStrings as b } from './src/strings.ts'; const eq = (a, e, m) => { if (a !== e) { console.error('FAIL: ' + m + ' got ' + a); process.exit(1); } }; eq(b.created('Hero', '2.31'), '\u2714 Hero Section created. (2.31s)', 'created'); eq(b.readingFile('about.md'), 'Reading about.md...', 'reading'); eq(b.openingFile('hero.tsx'), 'Opening hero.tsx...', 'opening'); eq(b.initializing, 'Initializing application...', 'init'); eq(b.building('projects'), 'Building projects\u2026', 'building'); eq(b.idleCount(1, 5), '\u2713 1/5 sections', 'idle'); eq(b.complete(5, '12.3'), '\u2714 Build complete: 5 sections in 12.3s', 'complete'); eq(b.scrollHint, 'scroll \u2193', 'hint'); eq(b.reducedReady, '\u2714 Ready \u00b7 motion reduced', 'reduced'); eq(b.prompt, '\u276f', 'prompt'); eq(b.sectionLabels.top, 'Hero', 'label');"`

### Task 4: CREATE the tokenizer and the small factories in src/components/build/

- **ACTION**: Delivers AC-A1 (boot and dock text is tokenized and colored by `--syn-*`). Create `tokenize.ts` with no imports: `export type TokenKind = 'object' | 'function' | 'string' | 'number' | 'comment' | 'punct'` and `export function tokenize(command: string): { kind: TokenKind; text: string }[]`; concatenating every `text` must equal the input exactly. Rules: a double-quoted run is one `string` token including both quotes (an unterminated quote runs to the end of the input); a digit run is `number`; the single character `…` is `comment`; an identifier (`[A-Za-z_$][\w$]*`) followed immediately by `(` is `function`, any other identifier (for example `hero` in `hero.title`) is `object`; every other character is its own one-character `punct` token (parentheses, brackets, dot, comma, semicolon, space). Create `dom.ts` exporting `h(tag, className?, attrs?)` returning an element with the class and attributes set (no innerHTML). Create `Cursor.ts` exporting `createCursor(): HTMLSpanElement` (class `sp-cursor`, text `█`). Create `LogLine.ts` exporting `createLogLine(level: 'info' | 'success' | 'warn' | 'error', text: string, spinner = false)` returning `{ el, setText(text), setSpinnerFrame(frame) }`, where `el` is a `div` with class `sp-log`, attribute `data-level`, and a glyph span plus a text span; when `spinner` is true the glyph is one of the ten braille frames `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` selected by `setSpinnerFrame` (class `sp-spinner`), otherwise a fixed glyph per level. Create `CommandLine.ts` exporting `createCommandLine()` returning `{ el, set(command: string, chars: number, cursor: boolean) }`: `el` is a `span` with class `sp-cmdline`; `set` tokenizes the whole command, slices the token list to the first `chars` characters, renders one span per token with class `sp-tok-<kind>`, and appends the `createCursor()` span when `cursor` is true; it rewrites the DOM only when `chars` or `cursor` changed since the last call. Every element these factories create is decorative: they set no role and no tabindex, and the callers mark the roots aria-hidden. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/triggers.ts:3-23` (an exported factory that returns a small handle).
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm check:tokens; node --experimental-strip-types --no-warnings --input-type=module -e "import { tokenize } from './src/components/build/tokenize.ts'; const q = String.fromCharCode(34); const j = (s) => tokenize(s).map((k) => k.kind + ':' + k.text).join('|'); const eq = (a, e, m) => { if (a !== e) { console.error('FAIL: ' + m + ' got ' + a); process.exit(1); } }; eq(j('startSite();'), 'function:startSite|punct:(|punct:)|punct:;', 'boot'); const title = 'hero.title(' + q + 'Fabio Barreto.' + q + ')'; eq(j(title), 'object:hero|punct:.|function:title|punct:(|string:' + q + 'Fabio Barreto.' + q + '|punct:)', 'title'); eq(j('hero.links([\u2026])'), 'object:hero|punct:.|function:links|punct:(|punct:[|comment:\u2026|punct:]|punct:)', 'links'); eq(j('a.b(12)'), 'object:a|punct:.|function:b|punct:(|number:12|punct:)', 'number'); for (const s of ['startSite();', title, 'x.y(' + q + 'abc', 'hero.photo(\u2026)']) { eq(tokenize(s).map((k) => k.text).join(''), s, 'roundtrip ' + s); }"`

### Task 5: CREATE BootTerminal, CommandDock, BuildWindow and PendingOutline

- **ACTION**: Delivers AC-A1, AC-A2, AC-A3 and AC-A5 (the surfaces). Each file in `src/components/build/` exports one factory returning `{ el, ... }` and never touches layout of the page; every root is created with `aria-hidden="true"` (there are no controls in this phase). Class names are fixed because the validation scenarios read them: `BootTerminal.ts` → `createBootTerminal()` with root class `sp-boot`, three neutral dots, a prompt line built with `createCommandLine()`, log lines built with `createLogLine('info', …)`, and methods `setCommand(command: string, chars: number, cursor: boolean)`, `setLogs(lines: string[])` (renders the given list, so the caller passes the first `bootLogCount` entries), `setFold(progress: number, to: DOMRect | null)` and `setVisible(visible: boolean)`; `setFold` writes only `transform` and `opacity` on the root (a translate and scale from the centered terminal toward the dock rectangle `to`, rect measured once by the caller when the fold starts, opacity `1 - progress`). `CommandDock.ts` → `createCommandDock()` with root class `sp-dock`, attribute `data-state` taking one of `hidden`, `typing`, `building`, `created`, `idle`, `done`, `reduced`, `collapsed`, a status area `sp-dock-status`, a hint span `sp-dock-hint`, and methods `setState(state)`, `setCommand(command: string, chars: number, cursor: boolean)`, `setLog(text: string | null)` (one log line shown above the pill, absolutely positioned so the pill never resizes), `setBuilding(name: string, spinnerFrame: number)`, `setCreated(text: string)`, `setIdle(done: number, total: number)` (renders `buildStrings.idleCount`, then the `buildStrings.prompt`, a cursor, and the `buildStrings.scrollHint` in `sp-dock-hint`, with no pulse), `setDone(text: string)`, `setOpacity(value: number)` (inline `opacity` only) and `getRect(): DOMRect`; the `reduced` state renders `buildStrings.reducedReady` with a steady cursor and the `collapsed` state renders a round inert `sp-dock-fab` showing `buildStrings.collapsedGlyph`, both as aria-hidden markup that nothing selects in this phase. `BuildWindow.ts` → `createBuildWindow(file: string, section: string)` with root class `sp-window`, attributes `data-section`, `data-file` and `data-state` (`opening`, `building` or `closing`), and children: `sp-window-frame` (receives the per-frame `transform` and `opacity`), inside it `sp-window-chrome` (the sticky bars) containing `sp-window-bar` (three neutral dots plus the file name) and `sp-window-cmd` (a `createCommandLine()` for the current step call), and `sp-window-body` (the dot grid, `pointer-events: none`); methods `setPlacement(rect: { x: number; y: number; width: number; height: number })` (writes `transform: translate3d(x, y, 0)`, `width` and `height` on the root, called only on placement), `setCommand(call: string, chars: number, cursor: boolean)`, `setOpen(progress: number, origin: { x: number; y: number })` (frame `transform: scale(0.96 + 0.04 * easeOut(progress))` with `transform-origin` set from `origin`, and `opacity: easeOut(progress)`), `setClosing(progress: number)` (frame `opacity: 1 - progress`) and `setState`. `PendingOutline.ts` → `createPendingOutline(file: string)` with root class `sp-outline` containing an inner dashed box and a label span showing the file name (for example `projects.tsx`), and methods `setPlacement(rect)` and `setVisible(visible: boolean)`. Import `easeOut` from `../../runtime/layer-timing` and strings from `../../strings` (`buildStrings` only). Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/triggers.ts:3-23` (factory plus handle) and `# SOURCE: src/components/page/Footer.tsx:12-29` (class naming `sp-*`, one root per component).
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm check:tokens; pnpm exec prettier --check src/components/build`

### Task 6: CREATE src/styles/build-layer.css and UPDATE src/styles/build-pending.css

- **ACTION**: Delivers AC-A3, AC-A4, AC-A5 and AC-A6 (look, stacking, pointer events, compact rules). `build-layer.css` uses only tokens from `src/styles/tokens.css` (no hex, `rgb(` or `hsl(` text, and every `box-shadow` carries `var(--`): `.sp-build-layer` is `position: absolute; top: 0; left: 0; width: 100%; height: 0; z-index: 2; pointer-events: none` (above `.sp-page-content`, which is `z-index: 1`; the bars sit under the nav so an overlap is only the faint dot grid); `.sp-boot` is `position: fixed; inset: 0; margin: auto; height: var(--space-32); width: min(var(--dock-width), calc(100vw - var(--space-8)))` (centered without a transform so the fold can use one), mono type via `var(--font-mono)` and `var(--mono-sm)`, `background: var(--bg-overlay)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-dock)`, `pointer-events: none`; `.sp-dock` is `position: fixed; bottom: max(var(--space-6), env(safe-area-inset-bottom)); left: 0; right: 0; margin-inline: auto; height: var(--dock-height); width: min(var(--dock-width), calc(100vw - var(--space-8)))`, pill radius `var(--radius-full)`, `box-shadow: var(--shadow-dock)`, `pointer-events: none` (no controls exist yet), the log line absolutely positioned above it, `data-state='hidden'` giving `opacity: 0`; `.sp-window` is `position: absolute; top: 0; left: 0; pointer-events: none`, `.sp-window-chrome` is `position: sticky; top: var(--nav-height); display: flex; flex-direction: column; pointer-events: auto`, each bar is `height: var(--window-bar)` with `background: var(--bg-overlay)` and `border-bottom: 1px solid var(--border)`, `.sp-window-body` is `position: absolute; inset: 0; pointer-events: none` with a dot grid drawn only from `--grid-dot` (a `radial-gradient` background), the three dots use `var(--border-strong)` (no traffic-light colors), `box-shadow: var(--shadow-window)` on the frame; `.sp-outline` is `position: absolute; top: 0; left: 0; pointer-events: none` with an inner box inset by `var(--space-2)`, `border: 1px dashed var(--border-strong)`, and its label in `var(--font-mono)`, `var(--mono-xs)` and `color: var(--fg-muted)`; `.sp-tok-object`, `-function`, `-string`, `-number`, `-comment` and `-punct` take `--fg`, `--syn-function`, `--syn-string`, `--syn-number`, `--syn-comment` and `--syn-punct` as appropriate (the function token must differ in color from punct); log glyph colors come from `--log-info`, `--log-success`, `--log-warn`, `--log-error`; `.sp-cursor` blinks with a `@keyframes` rule that changes only `opacity` (1.06 s, `steps(1)`), and under `@media (prefers-reduced-motion: reduce)` it is steady. Blur: `backdrop-filter: blur(12px)` (with the `-webkit-` twin) only on `.sp-boot`, `.sp-dock:not([data-state='hidden'])` and `.sp-window-chrome`; under `@media (prefers-reduced-transparency: reduce)` and `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` those surfaces use solid `var(--bg-raised)` and no blur. Compact (`@media (max-width: 767px)`): `.sp-window-bar`, `.sp-dock-hint` and the dock log line are `display: none`, so a window shows one command bar and the dock shows only its status; the dock width already follows `min(...)` so it spans the viewport minus 16 px on each side. No transitions anywhere in the file (surfaces are driven per frame). In `build-pending.css`, keep the existing rule's selector and add `pointer-events: none` to it (a section not yet built receives no pointer events), and add one rule: `html[data-build-mode='pending']:not([data-build-nav]) .sp-nav { opacity: 0; transform: translateY(-100%); }` (the nav is hidden from first paint until the layer starts its entrance; it stays laid out and focusable). Format with prettier.
- **MIRROR**: `# SOURCE: src/styles/build-pending.css:1-7` and `# SOURCE: src/components/page/NavBar.css:151-167`
- **VALIDATE**: `set -euo pipefail; pnpm check:tokens; pnpm exec prettier --check src/styles/build-layer.css src/styles/build-pending.css; pnpm build; pnpm check:budgets`

### Task 7: CREATE src/runtime/layer.ts (the layer controller)

- **ACTION**: Delivers AC-A1, AC-A2, AC-A3, AC-A4 and AC-A5. Export `createBuildLayer(options: { sections: HTMLElement[]; timelines: Timeline[] }): BuildLayer` where `BuildLayer` is `{ onState(id: SectionId, state: SectionState): void; onTick(id: SectionId, t: number, dt: number): void; onAllDone(): void; destroy(): void }`. On creation: build one root `<div class="sp-build-layer" data-build-layer>` and insert it right after the `.sp-page` element (fall back to appending to `document.body`), never inside `<main>`; create the dock (state `hidden`) and a pending outline for every section except the first, place them from the section boxes (`rect = el.getBoundingClientRect()`, document coordinates `x = rect.left + scrollX`, `y = rect.top + scrollY`), and observe `main` and every section with one `ResizeObserver` plus `document.fonts.ready` to re-place every outline and open window (placement only; no per-frame layout reads). Behavior driven by `onState`/`onTick`, all derived from `t` with the functions of `layer-timing.ts` and cached so the DOM is written only when a value changes: **first section (the hero)**: `command` creates the boot terminal (dock stays `hidden`), `setCommand(timeline.command, commandChars(t, length), true)` until the enter, `setLogs([buildStrings.initializing, buildStrings.openingFile(file)].slice(0, bootLogCount(t, commandEnterAt(length))))`; from `BOOT_NAV_AT_MS` the nav entrance runs (set `data-build-nav="sliding"` on `<html>` and write the inline `transform` and `opacity` of `.sp-nav` from `navSlideProgress(t)`; at progress 1 remove those inline styles and set `data-build-nav="in"`); when `foldProgress(t, timeline)` first leaves 0 measure the dock rect once, call `boot.setFold(progress, rect)`, show the dock (`setState('building')`, `setBuilding(name, frame)`) with `setOpacity(progress)`, and at progress 1 remove the boot terminal. **Other sections**: `command` sets the dock `typing` with `setCommand(timeline.command, commandChars(t, length), true)` and, from `commandEnterAt(length)`, `setLog(buildStrings.readingFile(file))`; from `timeline.windowEnd` the dock is `building` (`● Building <name>…` via `buildStrings.building`, where `name` is the file name without its extension, with the spinner frame from `spinnerFrame(loopMs)` and `loopMs` the sum of every `dt` received). **Every section**: `window` creates the window (`createBuildWindow`), places it from the section box and keeps it at `opacity: 0` until `windowEnd`, then `setOpen(windowOpenProgress(t, tl), origin)` where `origin` is the dock's center expressed relative to the window box, measured once at open start; `building` types the active step's `call` into the window command bar with `windowCommandChars(t, steps[stepIndexAt(t, steps)])` (empty before the first step); `closing` calls `setClosing(windowCloseProgress(t, tl))` and sets the dock `created` with `buildStrings.created(label, formatSeconds(elapsedMs))` where `label = buildStrings.sectionLabels[id]` and `elapsedMs` is the sum of the `dt` values received for that section; `done` removes the window, the outline and (for the hero) any boot terminal, shows the `created` text first if the section skipped `closing`, counts it, and sets the dock `idle` with `setIdle(doneCount, timelines.length)`; `command`, `window` and `building` hide that section's outline, while `pending` and `queued` show it. `onAllDone` sets the dock `done` with `buildStrings.complete(timelines.length, formatSeconds(sumOfSectionElapsedMs, 1))`. `destroy()` disconnects the observer, removes the root and the nav inline styles and the `data-build-nav` attribute. Export `formatSeconds` usage only through `layer-timing.ts` (Phase 4 reuses it for the footer). Hard rules: no `setTimeout` or `setInterval`, no `scrollTo`, `scrollIntoView` or `scrollTop`, no `innerHTML`, no write to `<main>` or to any page element other than the nav inline styles above, and every element in the root is inside an `aria-hidden="true"` ancestor. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/triggers.ts:3-23` (factory that observes the DOM and returns a disposer).
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm check:tokens; pnpm exec prettier --check src/runtime/layer.ts`

### Task 8: UPDATE src/runtime/main.ts (wire the layer)

- **ACTION**: Delivers AC-A1, AC-A2 and AC-A6. Import `createBuildLayer`. In the non-instant branch only, create the layer right before the scheduler: `const layer = createBuildLayer({ sections, timelines });` and keep a module-level `let destroyLayer: (() => void) | null = layer.destroy`. Extend the scheduler `host`: `onState` also calls `layer.onState(id, state)`, add `onTick: guard((id, t, dt) => layer.onTick(id, t, dt))`, and `onAllDone` also calls `layer.onAllDone()`. In `reveal()` call `destroyLayer?.()` before removing `data-build-mode` (so a thrown error leaves no build element and no stuck nav). The instant branch (`data-build-mode="instant"`) must create no layer, no root and no dock, exactly as today. Do not change the triggers, the stores or the `data-build-started` timing. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/main.ts:15-32` and `# SOURCE: src/runtime/main.ts:67-98`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm exec prettier --check src/runtime/main.ts; pnpm build`

### Task 9: UPDATE Footer.tsx, Footer.css and index.astro (reserved footer slot, layer CSS)

- **ACTION**: Delivers AC-A7 and AC-A3 (the slot, and the layer styles loaded on `/` only). `Footer.tsx`: add `buildSlot?: boolean` (default `false`) to `FooterProps`; when true render, after the existing `<p className="sp-footer-meta">`, one empty `<p className="sp-footer-build text-sm" data-footer-build="" />` inside `.sp-footer-inner`; without the prop the markup is byte-identical to today (project pages and the 404 do not change). `Footer.css`: `.sp-footer-build { min-height: calc(var(--text-sm) * 1.5); }` (one reserved line, so filling it later moves nothing) and, inside the existing `@media (max-width: 767px)` block, `.sp-footer-build { flex-basis: 100%; }` so the slot always owns its own row on phones. `index.astro`: import `../styles/build-layer.css` next to the existing `build-pending.css` import and pass `buildSlot` to `<Footer>` (line 44). Never put text in the slot (Phase 4 fills it). Format with prettier.
- **MIRROR**: `# SOURCE: src/components/page/Footer.tsx:12-29` and `# SOURCE: src/pages/index.astro:44`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm build; node --input-type=module -e "import { chromium } from '@playwright/test'; import { preview } from 'astro'; const PORT = 4399; const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } }); const browser = await chromium.launch(); try { const ctx = await browser.newContext({ javaScriptEnabled: false }); const home = await ctx.newPage(); await home.goto('http://127.0.0.1:' + PORT + '/'); const slot = await home.evaluate(() => { const el = document.querySelector('[data-footer-build]'); return el ? { text: el.textContent, height: el.getBoundingClientRect().height } : null; }); if (!slot || slot.text !== '' || slot.height < 20) throw new Error('FAIL: reserved empty slot missing on /'); const other = await ctx.newPage(); await other.goto('http://127.0.0.1:' + PORT + '/projects/relay/'); const leaked = await other.evaluate(() => document.querySelectorAll('[data-footer-build]').length); if (leaked !== 0) throw new Error('FAIL: slot leaked onto a project page'); } catch (e) { console.error(e.message); process.exitCode = 1; } finally { await browser.close(); await server.stop(); } process.exit(process.exitCode ?? 0);"`

## Validation Commands

All three levels run from the worktree root (`C:/repos/site-pro/.worktrees/stage-3-runtime`). Level 3 needs Playwright's Chromium (`pnpm exec playwright install chromium`). Every block is self-contained, writes no file outside the code root and `PRPs/`, and exits non-zero on failure. Assertions read the DOM, never the serialized page, because inlined CSS can legitimately contain the layer's class names.

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
if grep -q -e 'sp-dock' -e 'sp-boot' -e 'data-build-layer' dist/404.html dist/projects/relay/index.html; then
  echo "FAIL: build layer leaked onto a non-home page"; exit 1
else
  echo "PASS: no build layer on the 404 or project pages"
fi
```

### Level 3 INTEGRATION (dry-run end to end in Chromium with Playwright's clock)

Run the build block first, then scenario blocks A to E in order.

```bash
set -euo pipefail
pnpm build
```

Scenario A (the boot, the nav entrance, the fold, the hero window, the created and idle dock, then About's dock and window):

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
const snap = (page) => page.evaluate((ids) => {
  const h = document.documentElement;
  return { progress: Number(h.getAttribute('data-build-progress') || 0), nav: h.getAttribute('data-build-nav'), states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')) };
}, IDS);
const layer = (page) => page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const dock = q('.sp-dock');
  return {
    boot: document.querySelectorAll('.sp-boot').length,
    bootText: q('.sp-boot')?.textContent ?? '',
    fnToken: q('.sp-boot .sp-tok-function')?.textContent ?? null,
    windows: document.querySelectorAll('.sp-window').length,
    file: q('.sp-window')?.getAttribute('data-file') ?? null,
    dockState: dock?.getAttribute('data-state') ?? null,
    dockText: dock?.textContent ?? '',
    dockOpacity: dock ? getComputedStyle(dock).opacity : null,
  };
});
async function runUntil(page, test, maxMs, label) {
  for (let t = 0; t < maxMs; t += 100) { await page.clock.runFor(100); await sleep(5); const s = await snap(page); if (test(s)) return s; }
  throw new Error('FAIL: timed out waiting for ' + label);
}
async function stepUntil(page, test, label) {
  for (let i = 0; i < 400; i++) { await page.clock.runFor(16); await sleep(2); const l = await layer(page); if (test(l)) return l; }
  throw new Error('FAIL: timed out waiting for ' + label);
}
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const dur = await page.evaluate(() => JSON.parse(document.getElementById('top').getAttribute('data-build')).duration);
  await page.clock.pauseAt(60000);
  const at = (ms) => runUntil(page, (s) => s.progress * dur >= ms && s.states[0] !== 'done', 20000, 'hero t=' + ms);
  await at(500);
  let l = await layer(page);
  check(l.boot === 1 && l.windows === 0 && l.bootText.includes('start') && l.fnToken?.startsWith('start'), 'boot types startSite() with a function token');
  check(l.dockOpacity === '0', 'the dock is hidden while the boot terminal is on screen');
  const s1000 = await at(1000);
  l = await layer(page);
  check(l.bootText.includes('startSite();') && l.bootText.includes('Initializing application...') && l.bootText.includes('Opening hero.tsx...'), 'boot command and both logs');
  check(s1000.nav === 'sliding' || s1000.nav === 'in', 'nav entrance started by 900 ms');
  await at(1450);
  l = await layer(page);
  check(l.boot === 0 && l.windows === 1 && l.file === 'hero.tsx' && l.dockState === 'building' && l.dockOpacity === '1', 'boot folded, hero.tsx window open, dock building');
  const aligned = await page.evaluate(() => { const w = document.querySelector('.sp-window').getBoundingClientRect(); const s = document.getElementById('top').getBoundingClientRect(); return [w.x - s.x, w.y - s.y, w.width - s.width, w.height - s.height].every((d) => Math.abs(d) <= 0.5); });
  check(aligned, 'the hero window is aligned to the hero box');
  await runUntil(page, (s) => s.states[0] === 'closing', 20000, 'hero closing');
  l = await layer(page);
  check(l.dockState === 'created' && /\u2714 Hero Section created\. \(\d+\.\d{2}s\)/.test(l.dockText), 'dock shows the created line');
  const doneS = await runUntil(page, (s) => s.states[0] === 'done', 20000, 'hero done');
  l = await layer(page);
  check(doneS.nav === 'in', 'nav entrance finished');
  check(l.windows === 0 && l.dockState === 'idle' && l.dockText.includes('\u2713 1/5 sections') && l.dockText.includes('\u276f') && l.dockText.includes('scroll \u2193'), 'idle dock: 1/5 sections, prompt, scroll hint');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await stepUntil(page, (x) => x.dockState === 'typing' && x.dockText.includes('Reading about.md...') && x.dockText.includes('renderAbout();'), 'about command and log in the dock');
  await runUntil(page, (s) => s.states[1] === 'building', 20000, 'about building');
  l = await layer(page);
  check(l.windows === 1 && l.file === 'about.md' && l.dockState === 'building', 'about.md window, one window at a time');
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

Scenario B (pending outlines, one overlay root outside main, aria-hidden, animated properties, pointer events):

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
const snap = (page) => page.evaluate((ids) => ({ states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')) }), IDS);
async function runUntil(page, test, maxMs, label) {
  for (let t = 0; t < maxMs; t += 100) { await page.clock.runFor(100); await sleep(5); const s = await snap(page); if (test(s)) return s; }
  throw new Error('FAIL: timed out waiting for ' + label);
}
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.clock.pauseAt(60000);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  const outlines = await page.evaluate(() => [...document.querySelectorAll('.sp-outline')].map((o) => ({ text: o.textContent, hidden: !!o.closest('[aria-hidden="true"]') })));
  check(outlines.length === 4 && ['about.md', 'projects.tsx', 'stack.tsx', 'contact.tsx'].every((f) => outlines.some((o) => o.text.includes(f))) && outlines.every((o) => o.hidden), 'four pending outlines labeled with their file names, aria-hidden');
  const tree = await page.locator('body').ariaSnapshot();
  check(!/projects\.tsx|about\.md|stack\.tsx|contact\.tsx|startSite|hero\.tsx/.test(tree), 'layer text is not in the accessibility tree');
  const top = await page.evaluate(() => document.getElementById('projects').getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y - 500, behavior: 'instant' }), top);
  await runUntil(page, (s) => s.states[2] === 'building', 90000, 'projects building');
  const inv = await page.evaluate(() => {
    const root = document.querySelector('[data-build-layer]');
    const win = root.querySelector('.sp-window[data-section="projects"]');
    const all = [...root.querySelectorAll('*')];
    const allowed = new Set(['opacity', 'transform', 'clip-path', 'offset', 'easing', 'composite', 'computedOffset']);
    const badProps = new Set();
    for (const a of document.getAnimations()) for (const kf of a.effect.getKeyframes()) for (const k of Object.keys(kf)) if (!allowed.has(k)) badProps.add(k);
    const badTransitions = all.flatMap((e) => { const cs = getComputedStyle(e); const d = cs.transitionDuration.split(','); const p = cs.transitionProperty.split(','); return p.filter((_, i) => parseFloat(d[i % d.length]) > 0).map((x) => x.trim()); }).filter((x) => !['transform', 'opacity', 'clip-path'].includes(x));
    const pe = (el) => getComputedStyle(el).pointerEvents;
    const bar = win.querySelector('.sp-window-bar').getBoundingClientRect();
    const barHit = document.elementFromPoint(bar.x + bar.width / 2, bar.y + bar.height / 2);
    const h2 = document.querySelector('#projects h2').getBoundingClientRect();
    const hit = document.elementFromPoint(h2.x + 4, h2.y + h2.height / 2);
    return {
      outside: !document.querySelector('main').contains(root),
      sibling: root.parentElement === document.body && root.previousElementSibling?.classList.contains('sp-page'),
      controls: root.querySelectorAll('button, a, input, select, textarea, [tabindex]').length,
      unhidden: all.filter((e) => !e.closest('[aria-hidden="true"]')).length,
      windows: root.querySelectorAll('.sp-window').length,
      badProps: [...badProps], badTransitions,
      rootPE: pe(root), winPE: pe(win), bodyPE: pe(win.querySelector('.sp-window-body')), barPE: pe(win.querySelector('.sp-window-bar')), cmdPE: pe(win.querySelector('.sp-window-cmd')),
      barHit: !!barHit?.closest('.sp-window-bar'), pageHit: !!hit && !root.contains(hit),
      stackPE: pe(document.getElementById('stack')), heroPE: pe(document.getElementById('top')),
    };
  });
  check(inv.outside && inv.sibling, 'one overlay root, a sibling of .sp-page, outside main');
  check(inv.controls === 0 && inv.unhidden === 0, 'every layer element is aria-hidden and there are no controls yet');
  check(inv.windows === 1, 'one window at a time');
  check(inv.badProps.length === 0 && inv.badTransitions.length === 0, 'only transform, opacity and clip-path animate: ' + inv.badProps.concat(inv.badTransitions).join());
  check(inv.rootPE === 'none' && inv.winPE === 'none' && inv.bodyPE === 'none' && inv.barPE === 'auto' && inv.cmdPE === 'auto', 'window body ignores the pointer; only the bars catch clicks');
  check(inv.barHit && inv.pageHit, 'a click on a bar hits the bar; a click over the body reaches the page');
  check(inv.stackPE === 'none' && inv.heroPE === 'auto', 'a section not built yet ignores the pointer; a built section does not');
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

Scenario C (layout never moves: boxes and text at mid-hero and mid-projects equal the ready page, layout shift stays tiny):

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
const snap = (page) => page.evaluate((ids) => ({ progress: Number(document.documentElement.getAttribute('data-build-progress') || 0), states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')) }), IDS);
async function runUntil(page, test, maxMs, label) {
  for (let t = 0; t < maxMs; t += 100) { await page.clock.runFor(100); await sleep(5); const s = await snap(page); if (test(s)) return s; }
  throw new Error('FAIL: timed out waiting for ' + label);
}
const boxes = (page) => page.evaluate(async () => {
  await document.fonts.ready;
  const els = [...document.querySelectorAll('main > section, main h1, main h2, main p, main a, main article, footer, footer p')];
  return {
    height: document.documentElement.scrollHeight,
    text: document.querySelector('main').textContent.replace(/\s+/g, ' ').trim(),
    boxes: els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height]; }),
  };
});
const same = (a, b, label) => {
  check(Math.abs(a.height - b.height) <= 0.5 && a.boxes.length === b.boxes.length, label + ': document height and box count equal');
  a.boxes.forEach((box, i) => box.forEach((v, j) => check(Math.abs(v - b.boxes[i][j]) <= 0.5, label + ': box ' + i + ' moved')));
  check(a.text === b.text, label + ': main text equals the ready page');
};
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  const readyPage = await (await browser.newContext({ ...desktop, reducedMotion: 'reduce' })).newPage();
  await readyPage.goto(URL, { waitUntil: 'load' });
  await readyPage.waitForFunction(() => document.documentElement.getAttribute('data-build-status') === 'done');
  const ready = await boxes(readyPage);
  const ctx = await browser.newContext(desktop);
  await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  const page = await ctx.newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const dur = await page.evaluate(() => JSON.parse(document.getElementById('top').getAttribute('data-build')).duration);
  await page.clock.pauseAt(60000);
  await runUntil(page, (s) => s.progress * dur >= 1700 && s.states[0] !== 'done', 20000, 'mid hero');
  same(await boxes(page), ready, 'mid-hero');
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  const top = await page.evaluate(() => document.getElementById('projects').getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y - 500, behavior: 'instant' }), top);
  await runUntil(page, (s) => s.states[2] === 'building', 90000, 'mid projects');
  same(await boxes(page), ready, 'mid-projects');
  await runUntil(page, (s) => s.states[2] === 'done', 90000, 'projects done');
  same(await boxes(page), ready, 'after projects');
  await sleep(50);
  const cls = await page.evaluate(() => window.__cls);
  check(cls <= 0.01, 'layout shift ' + cls + ' is above 0.01');
  const bare = await (await browser.newContext({ ...desktop, javaScriptEnabled: false })).newPage();
  await bare.goto(URL, { waitUntil: 'load' });
  const noJs = await boxes(bare);
  same(noJs, ready, 'no-JS page');
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

Scenario D (sticky bars in a tall section and window realignment on a width change at 1280x800; the compact bar and the dock width at 375x812):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const progress = (page) => page.evaluate(() => Number(document.documentElement.getAttribute('data-build-progress') || 0));
async function untilT(page, ms, dur) {
  for (let i = 0; i < 400; i++) { await page.clock.runFor(100); await sleep(5); if ((await progress(page)) * dur >= ms) return; }
  throw new Error('FAIL: timed out waiting for t=' + ms);
}
async function open(browser, viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const dur = await page.evaluate(() => JSON.parse(document.getElementById('top').getAttribute('data-build')).duration);
  await page.clock.pauseAt(60000);
  await untilT(page, 1700, dur);
  return page;
}
const chromeTop = (page) => page.evaluate(() => document.querySelector('.sp-window-chrome').getBoundingClientRect().top);
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desk = await open(browser, { width: 1280, height: 800 });
  await desk.evaluate(() => window.scrollTo({ top: 150, behavior: 'instant' }));
  await desk.clock.runFor(32); await sleep(20);
  const dTop = await chromeTop(desk);
  check(Math.abs(dTop - 64) <= 1, 'desktop: bars stick under the nav (top ' + dTop + ')');
  await desk.setViewportSize({ width: 1100, height: 800 });
  await desk.clock.runFor(100); await sleep(50);
  const fit = await desk.evaluate(() => { const w = document.querySelector('.sp-window').getBoundingClientRect(); const s = document.getElementById('top').getBoundingClientRect(); return [w.x - s.x, w.width - s.width].every((d) => Math.abs(d) <= 0.5); });
  check(fit, 'desktop: the window follows the section after a width change');
  const mob = await open(browser, { width: 375, height: 812 });
  const m = await mob.evaluate(() => {
    const bar = document.querySelector('.sp-window-bar');
    const cmd = document.querySelector('.sp-window-cmd');
    const dock = document.querySelector('.sp-dock').getBoundingClientRect();
    return { barDisplay: getComputedStyle(bar).display, cmdDisplay: getComputedStyle(cmd).display, cmdText: cmd.textContent, hintDisplay: getComputedStyle(document.querySelector('.sp-dock-hint')).display, dockLeft: dock.left, dockWidth: dock.width };
  });
  check(m.barDisplay === 'none' && m.cmdDisplay !== 'none' && m.cmdText.includes('hero'), 'mobile: a single compact bar with the current command');
  check(Math.abs(m.dockWidth - 343) <= 1 && Math.abs(m.dockLeft - 16) <= 1 && m.hintDisplay === 'none', 'mobile: the dock spans the viewport minus 16 px per side and shows only its status');
  await mob.evaluate(() => window.scrollTo({ top: 150, behavior: 'instant' }));
  await mob.clock.runFor(32); await sleep(20);
  const mTop = await chromeTop(mob);
  check(Math.abs(mTop - 64) <= 1, 'mobile: the compact bar sticks under the nav (top ' + mTop + ')');
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

Scenario E (no layer in reduced motion, with a saved infinity, without JavaScript or after a failure; the nav is hidden while pending and never stuck hidden):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const layerCount = (page) => page.evaluate(() => document.querySelectorAll('[data-build-layer], .sp-boot, .sp-dock, .sp-window, .sp-outline').length);
const navOpacity = (page) => page.evaluate(() => getComputedStyle(document.querySelector('.sp-nav')).opacity);
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  for (const [label, opts, init] of [
    ['reduced motion', { ...desktop, reducedMotion: 'reduce' }, null],
    ['saved infinity', desktop, () => localStorage.setItem('sp-speed', 'inf')],
  ]) {
    const ctx = await browser.newContext(opts);
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'load' });
    await p.waitForFunction(() => document.documentElement.getAttribute('data-build-status') === 'done');
    check((await layerCount(p)) === 0, label + ': no build layer');
    check((await navOpacity(p)) === '1', label + ': the nav is visible');
  }
  const bare = await (await browser.newContext({ ...desktop, javaScriptEnabled: false })).newPage();
  await bare.goto(URL, { waitUntil: 'load' });
  check((await layerCount(bare)) === 0 && (await navOpacity(bare)) === '1', 'no JavaScript: no layer, nav visible');
  const failed = await (await browser.newContext(desktop)).newPage();
  await failed.route(/\/_astro\/.*\.js/, (route) => route.abort());
  await failed.clock.install({ time: 0 });
  await failed.goto(URL, { waitUntil: 'domcontentloaded' });
  check((await navOpacity(failed)) === '0', 'pending: the nav is hidden before the runtime starts');
  await failed.clock.pauseAt(60000);
  check((await layerCount(failed)) === 0 && (await navOpacity(failed)) === '1', 'failure: the watchdog leaves no layer and shows the nav');
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

- **AC-A1 (PRD AC-1):** The layer parts of the first load: before first paint the nav is hidden (it stays laid out); the boot terminal in the middle of the screen types `startSite();` (function token colored differently from punctuation) and logs `Initializing application...` and `Opening hero.tsx...`; the nav slides in from 900 ms of the hero clock; the terminal folds into the dock; a `hero.tsx` window opens over `#top` aligned to its box; the dock shows `✔ Hero Section created. (<t>s)` while the window closes and is idle afterwards with `✓ 1/5 sections`, `❯ █` and `scroll ↓`. (Headline visibility by 2.0 s and the 3.2 s hero budget belong to Phase 3.)
- **AC-A2 (PRD AC-2):** For every later section the dock types its command (`renderAbout();`), logs `Reading about.md...`, switches to `Building about…` as the `about.md` window opens, and shows `✔ About Section created. (<t>s)` then `✓ <n>/5 sections` when it ends; at no moment are two build windows open.
- **AC-A3 (PRD AC-4, AC-12):** The surfaces never move a box: every section, heading, paragraph, link, card and the footer, and the document height, equal the ready page (+/- 0.5 px) at mid-hero, mid-projects and after Projects at 1280x800, summed layout shift stays <= 0.01, and the `<main>` text equals the ready page; each pending section (About, Projects, Stack, Contact) shows a dashed outline labeled with its file name that is not in the accessibility tree; every layer element lives in one overlay root that is a sibling of `.sp-page` outside `<main>`, is `aria-hidden`, and animates only `transform`, `opacity` or `clip-path`; the window stays aligned to its section after a width change (placement only; finishing the section on resize is Phase 4).
- **AC-A4 (PRD AC-11):** The window body, the window and the overlay root have `pointer-events: none` while the title bar and the command bar catch clicks, a click over the window body reaches the page, and a section that is not built yet receives no pointer events (a built section does).
- **AC-A5 (PRD AC-21):** At 375x812 the hero window shows a single compact bar with the current command, the dock spans the viewport width minus 16 px on each side and shows only its status; in a section taller than the viewport (the hero at 1280x800 and at 375x812) the bars stay stuck under the nav (64 px) while scrolling.
- **AC-A6 (PRD AC-14, AC-15):** With reduced motion, a saved `∞`, JavaScript disabled, or the runtime blocked or throwing, no boot terminal, dock, window, outline or overlay root exists, and the nav is visible (hidden only while the pending mode is on and the runtime is expected).
- **AC-A7 (PRD AC-17):** The static footer on `/` carries an empty, reserved build-summary slot (`[data-footer-build]`, one line high, its own row under 768 px) that is present without JavaScript and absent on project pages and the 404; filling it is Phase 4.
- **AC-A8 (PRD AC-19):** `pnpm check:budgets` stays green with the layer (runtime <= 18 KB gzip, critical <= 20 KB, total JS <= 90 KB, CSS <= 25 KB), `pnpm check:tokens` finds no color or box-shadow literal, and no build-layer markup or CSS reaches the 404 or project pages.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| The 18 KB runtime budget is exceeded by the layer, the tokenizer and the factories | M | H | DOM factories without a framework, copy as a separate `buildStrings` export so the bundle imports only it, no new dependency; `pnpm check:budgets` runs in Task 6 and Level 2, and a breach is fixed in the layer, never by raising a limit |
| The 25 KB CSS budget is exceeded by `build-layer.css` | M | M | One small stylesheet, no duplicated rules, tokens only; measured by the same `check:budgets` runs |
| The overlay (`z-index: 2`) sits above the nav (the nav is inside the `z-index: 1` page content), so the faint dot grid can overlay it when a window is scrolled under it | M | L | Bars are sticky under the nav (64 px) so chrome never overlaps it; the grid uses `--grid-dot`, near the page background; the overlay root and windows are `pointer-events: none`; the owner reviews the rhythm in Phase 5 |
| Sticky bars fail inside the window box (sticky needs its containing block to span the section) | M | M | Scenario D scrolls the 836 px hero at 1280x800 and the 900 px hero at 375x812 and asserts the bars at 64 px |
| Window or outline placement drifts when fonts load late or earlier sections change height | M | M | A `ResizeObserver` on `main` and every section plus `document.fonts.ready` re-place all overlay boxes; Scenario A and D compare window and section rectangles |
| Per-frame DOM writes in the tick cost frame time | L | M | Every driver caches its last value and writes only on change; only `transform` and `opacity` are written per frame |
| Lighthouse Performance drops because the nav is hidden until 900 ms and the boot terminal is large text | M | M | The nav is not an LCP candidate that matters (hero is hidden until Phase 3 anyway); measured by the CI `lighthouse` job on the pull request and reported to the owner, no threshold relaxed |
| Existing Stage 2 and Phase 1 specs assert behavior this phase changes on purpose | H | M | Expected, handled by the test pair's lifecycle ledger (see Notes); the Implementer edits no test |

## Notes

**TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

**Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.

- **Expected test impact (for the test pair, not the Implementer).** `tests/e2e/home-no-build-layer.spec.ts` asserts that no `.sp-boot`, `.sp-dock`, `.sp-dock-fab`, `.sp-window`, `.sp-select` or `.sp-skel` exists after 2 s on `/` with a real clock; Phase 2 puts the boot terminal and the hero window on screen for the first seconds and leaves the dock on screen afterwards, so that test conflicts by design and is rewritten (not weakened): in instant mode (reduced motion or saved `∞`) and without JavaScript no layer element exists, and after the build settles no boot terminal, window or outline remains while the dock stays. Its served-HTML test matches `\bsp-(boot|dock|dock-fab|window|select|skel)\b` against the whole page; the layer's CSS contains those class names, so if Astro inlines the stylesheet into `index.html` that regex can match CSS text, not markup: scope it to the body markup or assert on the DOM. Its "main text equals the no-JS page" check should keep passing (the layer is outside `<main>`). Other `/` specs (`home-axe`, `home-content`, `home-keyboard`, `home-responsive-layout`) now meet a fixed dock and a nav hidden while pending with a real clock and no stored speed; they may need reduced motion or a saved `inf` to start from the ready page. The footer gains one empty slot on `/` only, so box-based specs on `/` see one extra row (and one extra line of height) that no-JS and ready pages share. Unit candidates for the pair: `layer-timing`, `tokenize`, `buildStrings`, the scheduler `onTick` hook with the manual clock, and `Footer` with and without `buildSlot`. `pnpm test` is part of Level 2 so a regression in an existing unit test is caught.
- **Why `pnpm test:e2e` is not a validation command here.** The Stage 2 specs named above conflict with the layer by design until the test pair updates them; running them in this phase's Implementer gate would fail against a correct implementation. Level 3 drives the built site with Playwright's library and clock directly instead.
- **Validation conventions carried from Phase 1.** Level 3 asserts on the DOM, never on the serialized page (lesson from the Phase 1 repair: inlined CSS can contain class names); each scenario is one small self-contained block; the only text patterns that decide an exit code are literals authored in this plan's own ACTION prose (`startSite();`, `Initializing application...`, `Opening hero.tsx...`, `Reading about.md...`, `renderAbout();`, `✔ Hero Section created.`, `✓ 1/5 sections`, `scroll ↓`, the class names `sp-boot`, `sp-dock`, `sp-window`, `sp-window-chrome`, `sp-window-bar`, `sp-window-cmd`, `sp-window-body`, `sp-outline`, `sp-dock-hint`, `sp-tok-function`, and the attributes `data-build-layer`, `data-build-nav`, `data-footer-build`); non-ASCII glyphs in inline `node -e` checks are written as `\u` escapes.
- **Timing the layer follows.** The hero boot types `startSite();` from 250 ms (40 ms per character, 12 characters, so typing ends at 730 ms and the enter lands at 810 ms), logs at 810 ms and 910 ms, starts the nav entrance at 900 ms, folds and opens the window from 1000 ms (`windowEnd`) to 1300 ms (`buildStart`), as in prototype v2. Other sections type from 250 ms, enter at their `commandEnd`, open their window at `windowEnd` and finish opening at `buildStart`. The dock log is therefore visible for the 100 ms between `commandEnd` and `windowEnd`, matching the documented log gap. Section durations are still the provisional Phase 1 values; Phase 3 tunes them.
- **Log copy.** The first log (`Initializing application...`) and the file logs (`Opening <file>...` for the hero, `Reading <file>...` for the others) are generic; per-section wording such as a project count is a Stage 4 refinement.
- **Design System reference.** The factories port the v2 markup and classes (`sp-boot`, `sp-dock`, `sp-dock-fab`, `sp-window`, `sp-window-chrome`, `sp-window-cmd`, `sp-cmdline`, `sp-cursor`, `sp-log`, `sp-spinner`); the Design System (https://claude.ai/artifact/CvbHWjN6GHJoYxCTCmk91o, `components/bundle.css` and `components/src/index.tsx`) and prototype v2 (https://claude.ai/artifact/ABxEwc9LHKR7cwy3rjQvDj) are the visual reference when the Implementer can read them; where they cannot be read, the component states in the research notes above and `docs/04-animations.md` decide, and the owner reviews the look on the preview.
- **Open questions carried.** The watchdog timeout (3 s) and Lighthouse with the hero hidden until its timeline ends are still measured on the pull request; nothing in this phase changes what is hidden.

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
