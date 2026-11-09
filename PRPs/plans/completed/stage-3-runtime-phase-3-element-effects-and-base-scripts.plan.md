# Feature: Element effects and base scripts (Phase 3 of stage-3-runtime)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (effects registry driven by the runtime clock, in-place reveal without rewriting page text, seeded randomness, pacing helper for the script model); creation of components (SelectionBox, Skeleton, TextOverlay as TypeScript DOM factories); cross-cutting patterns (one overlay root, data-* contract, tokens only, budgets); impact on shared UI (build-pending.css visibility rules, the five section build scripts); business rules for build (B1-B5, B18-B24 element creation, typing speeds, hero 3.2 s) and visual-design (V1, V9, V13, V14, V15)
- Decisions found:
  - D2 Astro + React + TypeScript strict; the runtime and effects are plain TypeScript outside React, nanostores share state
  - D12 hero photo ASCII to real photo is Stage 4; here the hero photo step is select, then skeleton, then the placeholder
  - D17 build windows, D19 the dock at the bottom center, D20 the dot grid only inside windows
  - D6 full build on every visit; a saved infinity speed is the only exception (instant mode renders no effect)
  - D7 interactive dock and D8 agents are v1.1; no agent cursors, no counters here
  - Stage 2 approved: layout, content, section ids, labels, heading structure and the data-build-target hooks do not change
  - Stage 3 PRD approved 2026-11-08: effects are driven by the runtime's clock with seeded randomness, only decorative loops in CSS; page text is never rewritten; Stage 3 ships the effects catalog except image-resolve and base scripts with prototype v2's commands and timings on the current content; the scheduler stays stable through Stage 4; methodology stays test-after
  - Phases 1 and 2 complete: scheduler, compiler, clock, triggers, stores, layer, factories, pending outlines and the footer slot exist in the worktree
- Applicable anti-patterns:
  - Layout-shifting build animations (effects write only opacity, clip-path and pointer-events on page elements, and transform only on overlay elements; no page element gets a transform)
  - Hiding pending content with `display` or `visibility` (hiding uses opacity only and only under the pending mode)
  - Generic fade-up reveals (every element goes select, skeleton, content; no plain fade-in)
  - Re-rendering React per typed character (typing and decoding write overlay DOM and clip-path from the tick, no React)
  - Many timers instead of one loop (no setTimeout or setInterval; CSS animation only for the skeleton shimmer and the cursor)
  - Mixing the two registers (selection boxes, skeletons, carets and scramble glyphs live only in the overlay)
  - Raw values instead of tokens (check:tokens scans .css, .astro, .ts and .tsx)
  - Scroll hijacking (effects never call scrollTo, scrollIntoView or touch scrollTop)
  - Scope creep into v1 (no image-resolve, no ASCII photo, no agents, no controls, no palette)
  - Weakening tests to get a green run (the Implementer authors no tests and edits no existing test)
  - Publishing private data (commands and labels come from approved content only)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - The build layer is one overlay root outside `<main>`, decorative and aria-hidden; the text content and accessibility tree of `<main>` and every box equal the no-JS page at any clock moment
  - Pending content stays laid out and in the accessibility tree; created elements are clickable at once and elements not yet created get no pointer events
  - Only transform, opacity and clip-path are animated per frame; one requestAnimationFrame loop; deterministic clock; seeded randomness
  - Budgets: runtime + effects <= 18 KB gzip (5.7 KB today), critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB, Lighthouse >= 95, CLS about 0; hero <= 3.2 s at 1x with the headline readable <= 2.0 s
  - Folder contract (docs/context/architecture.md): `src/runtime/` for the engine, `src/components/build/` for DOM factories, `src/sections/` for the build scripts
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-3-runtime.prd.md` — Implementation Phases row 3: "Element effects and base scripts" — Goal: The page builds element by element with the approved rhythm. — Success signal: AC-1, AC-4 and AC-18 pass; the page builds like prototype v2 (without the ASCII photo); hero <= 3.2 s at 1x; the size check stays within 18 KB.

## Summary

Phase 3 makes the page build element by element inside the windows Phase 2 opened. It adds one pure, DOM-free module (`effect-timing.ts`) that owns the effect duration table, the seeded random generator, the jittered dock typing, the window command truncation and every per-effect phase function; three overlay factories (SelectionBox, Skeleton, TextOverlay); an effects engine (`effects.ts` with DOM helpers in `effect-dom.ts`) that marks the targets of a section hidden when it starts, then renders each step as a pure function of the section clock `t` (select box, skeleton, clip-path typing with a caret, decode with scramble glyphs drawn in the overlay, line-by-line resolve, clip-path pop, stagger, project card build) and restores the untouched no-JS state when each step ends; a pacing helper and retuned base scripts for the five sections that reproduce prototype v2's step offsets (hero: 1300 / 1500 / 1600 / 1900 / 2200 ms, created at 2600 ms, duration 3100 ms); and small updates to the layer (jittered typing, truncated window commands) and to `main.ts` (the engine joins the host callbacks and `reveal()`). The scheduler is not touched. Controls, navigation behavior, `image-resolve` and per-section tuning stay in Phase 4 and Stage 4.

## User Story

As a visitor opening the site
I want each headline, photo, paragraph, card and button to be created in place, one after another
So that I watch the page build itself with the approved rhythm while the layout never moves and the text stays real and readable.

## Problem Statement

After Phase 2 the surfaces (boot terminal, dock, windows, outlines) follow the scheduler, but a section still appears whole when its timeline ends: nothing is created element by element, the window command bar has no effect to narrate, the dock types at a flat 40 ms per character, and the base scripts carry provisional durations that put the hero past its 3.2 s budget. AC-1 (headline readable by 2.0 s, hero final by 3.2 s), AC-4 (boxes never move while elements are created) and AC-18 (page text never rewritten, accessibility tree unchanged) cannot be met until the effects exist and run in place on the real page.

## Solution Statement

Reveal real page elements in place without touching their text or their box. A target element stays laid out the whole time; the engine hides it with an attribute-driven `opacity: 0; pointer-events: none` rule (pending mode only), draws a selection box and skeleton in the overlay, and then reveals the real content with `clip-path` (a polygon that follows the measured text lines for typing, decoding and line resolve; an inset with a small overshoot for pop) while a caret or scrambled glyphs are drawn in the overlay at measured positions. Every frame is a pure function of the step's local time (`t - step.start`), so a manual or Playwright clock freezes any moment and a turbo jump or an instant finish lands in the right state. When a step ends the engine removes every attribute and inline property it wrote, so the element is byte-identical to the no-JS page. Windows are not touched (lesson from Phase 2: no transform on the window root; effect overlays are siblings of the windows inside the overlay root and are placed once per step). The five scripts are rewritten with a small pacing helper so that each step starts at prototype v2's offset whatever the content length, which is how the hero lands at 3100 ms.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (element effects and base scripts) |
| Complexity | HIGH (clock-driven in-place effects, text measurement, clip-path geometry, pointer-event rules, retimed scripts) |
| Systems Affected | src/runtime/effect-timing.ts (new), src/runtime/effect-dom.ts (new), src/runtime/effects.ts (new), src/runtime/compiler.ts, src/runtime/layer.ts, src/runtime/main.ts, src/sections/pacing.ts (new), src/sections/hero.build.ts, about.build.ts, projects.build.ts, stack.build.ts, contact.build.ts, src/components/build/SelectionBox.ts, Skeleton.ts, TextOverlay.ts (new), src/styles/build-layer.css, src/styles/build-pending.css |
| Dependencies | Phases 1 and 2 (complete); no new dependency |
| Estimated Tasks | 7 |
| Source PRD line ref | PRPs/prds/stage-3-runtime.prd.md:202 (row 3), :218-221 (Phase Details) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-3-runtime.prd.md` | 69, 72, 79, 86, 88 (AC-1, AC-4, AC-11, AC-18, AC-20), 131-132 (effects and base scripts), 174 (in-place effects), 218-221 (Phase 3) | The contract this phase implements |
| P0 | `docs/04-animations.md` | 56-102 (timings, boot timeline), 119-131 (element effects), 177-187 (runtime performance) | Durations, typing speeds, effect behavior, hero targets |
| P0 | `src/runtime/compiler.ts` | 15-36, 59-108 | The duration table that moves into `effect-timing.ts`, the timeline fields and how overlap, gap and settle compile |
| P0 | `src/runtime/layer.ts` | 187-295 | `onState`/`onTick` where typing and window commands are rendered; the root the engine mounts into |
| P0 | `src/runtime/main.ts` | 17-35, 70-108 | `reveal()`, `guard` and the host wiring the engine joins |
| P0 | `src/runtime/scheduler.ts` | 120-142 | `onTick(id, t, dt)` is called every frame with the section clock; the scheduler must not change |
| P0 | `src/runtime/layer-timing.ts` | 17-35, 50-61 | Pure-function style, `progressBetween`, `commandChars`, `windowCommandChars` |
| P0 | `src/sections/hero.build.ts` | 6-41 | Hero script and the timing override (commandEnd 730, windowEnd 1000, buildStart 1300) |
| P0 | `src/sections/about.build.ts`, `projects.build.ts`, `stack.build.ts`, `contact.build.ts` | whole files | The other four scripts to retime |
| P0 | `src/sections/Hero.astro` | 31-55 | The `data-build-target` hooks: title, photo, role, intro, links |
| P0 | `src/sections/About.astro` | 26-54 | Heading wrapper, three paragraphs sharing target `text`, links |
| P0 | `src/sections/Projects.astro` | 24-48 | Heading wrapper and one `card-<slug>` cell per project |
| P0 | `src/sections/Stack.astro` | 23-37 | Heading wrapper and one `group-<i>` wrapper per group |
| P0 | `src/sections/Contact.astro` | 26-52 | Heading, links, location |
| P0 | `src/components/page/ProjectCard.tsx` | 34-62 | Card parts the `build-card` effect reveals in order |
| P0 | `src/components/page/StackGroup.tsx` | 17-27 | Group name and `li` chips the `stagger` effect pops |
| P0 | `src/styles/home.css` | 80-121 (absolutely positioned hero layers), 136-142 (cell transform) | `.sp-projects-cell:nth-child(even)` already carries a CSS transform, so no effect may write `transform` on page elements |
| P0 | `src/styles/build-pending.css` | 1-13 | Pending rule to extend |
| P0 | `src/styles/tokens.css` | 17, 33-35 (`--accent-fg`, `--build-select`, `--build-skeleton`, `--build-shine`) | The only colors the effect surfaces may use |
| P1 | `src/components/build/BuildWindow.ts` | 21-77 | Factory shape with last-value caches to mirror in the new factories |
| P1 | `src/components/build/PendingOutline.ts` | 14-32 | Overlay placement in document coordinates with `transform` |
| P1 | `src/styles/build-layer.css` | 85-97, 222-230 | Cursor blink (opacity-only keyframes) and the sticky chrome the effect overlays must not disturb |
| P1 | `tests/e2e/runtime-timeline-contract.spec.ts` | 26-65 | READ-ONLY contract the compiled timelines must keep (title is 150 + n x 28 ms, cards start 120 ms before the previous ends, createdAt >= last step end); never edit |
| P1 | `PRPs/plans/completed/stage-3-runtime-phase-2-build-layer.plan.md` | 303-357 (tasks), 769-781 (Notes) | Phase 2 contract and the expected-test-impact convention |
| P1 | `C:/Users/Fabio/AppData/Roaming/Claude/side-session-notes/local_d389fce4-59fb-4a3a-b3ea-133204dd4159/stage-3-prd-research.md` | 5-18 | Prototype v2 per-section step offsets and created times |
| P2 | `src/content/profile.json`, `src/content/stack.json`, `src/strings.ts` | 24-43 | The real strings the commands interpolate (headline "Fabio Barreto.", role "Senior Software Engineer", section titles) |

## Patterns to Mirror

```ts
# SOURCE: src/runtime/compiler.ts:15-31
// Provisional effect durations in ms at 1x. Phase 3 tunes this table.
export const EFFECT_DURATION_MS: Record<
  EffectName,
  (step: BuildStep) => number | string
> = {
  select: () => 150,
  skeleton: () => 300,
  'type-text': (s) =>
    s.text === undefined ? 'needs text' : 150 + s.text.length * 28,
  decode: (s) =>
    s.text === undefined ? 'needs text' : 150 + s.text.length * 20,
  'resolve-lines': (s) =>
    s.count === undefined ? 'needs count' : 150 + s.count * 60,
  pop: () => 300,
  stagger: (s) => (s.count === undefined ? 'needs count' : 150 + s.count * 80),
  'build-card': () => 600,
};
```
Copied by Task 1 (the table moves to `effect-timing.ts` with the Phase 3 values, keeps its signature and its two error strings, and `compiler.ts` re-exports it).

```ts
# SOURCE: src/runtime/layer-timing.ts:17-31
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function progressBetween(t: number, from: number, to: number): number {
  if (to <= from) return t >= to ? 1 : 0;
  return clamp((t - from) / (to - from), 0, 1);
}

export function easeOut(p: number): number {
  return 1 - (1 - p) ** 3;
}

export function commandChars(t: number, length: number): number {
  return clamp(Math.floor((t - COMMAND_START_MS) / COMMAND_CHAR_MS), 0, length);
}
```
Copied by Task 1 (pure functions of `t`, no DOM, no value imports so `node --experimental-strip-types` can run the module; `effect-timing.ts` keeps its own tiny `ramp` instead of importing `progressBetween`).

```ts
# SOURCE: src/components/build/BuildWindow.ts:58-65
    setOpen(progress, origin) {
      if (progress === lastOpen) return;
      lastOpen = progress;
      const eased = easeOut(progress);
      frame.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      frame.style.transform = `scale(${0.96 + 0.04 * eased})`;
      frame.style.opacity = String(eased);
    },
```
Copied by Task 3 (every per-frame setter compares with its last value and writes only when it changed).

```ts
# SOURCE: src/components/build/PendingOutline.ts:21-31
  return {
    el,
    setPlacement(rect) {
      el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    },
    setVisible(visible) {
      el.toggleAttribute('data-hidden', !visible);
    },
  };
```
Copied by Task 3 (overlay boxes are placed once in document coordinates with `transform` plus width and height).

```css
# SOURCE: src/styles/build-layer.css:85-97
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
Copied by Task 4 (the only CSS animation allowed is a decorative loop that changes `transform` or `opacity`; the skeleton shimmer follows it).

```css
# SOURCE: src/styles/build-pending.css:1-13
html[data-build-mode='pending']
  main
  > section[data-build]:not([data-build-state='done']):not(
    [data-build-state='skipped']
  ) {
  opacity: 0;
  pointer-events: none;
}

html[data-build-mode='pending']:not([data-build-nav]) .sp-nav {
  opacity: 0;
  transform: translateY(-100%);
}
```
Copied by Task 4 (the section rule also spares `building` and `closing`, and one attribute rule hides individual targets).

```ts
# SOURCE: src/runtime/main.ts:17-35
function reveal(): void {
  cancelFrame?.();
  stopObserver?.();
  destroyLayer?.();
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
Copied by Task 7 (the engine's callbacks run inside `guard`; `reveal()` also destroys the engine so no inline style or attribute is left behind).

```ts
# SOURCE: src/runtime/main.ts:84-104
    host: {
      onState: guard((id, state) => {
        byId.get(id)?.setAttribute('data-build-state', state);
        layer.onState(id, state);
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
        layer.onAllDone();
        status.set('done');
        root.removeAttribute('data-build-mode');
      }),
      onTick: guard((id, t, dt) => layer.onTick(id, t, dt)),
      isHidden: () => document.visibilityState === 'hidden',
    },
```
Copied by Task 7 (the host gains `effects.onState` before the state attribute is written, and `effects.onTick`).

```ts
# SOURCE: src/runtime/layer.ts:226-229
      if (id === heroId) {
        if (t >= BOOT_NAV_AT_MS) setNav(navSlideProgress(t));
        if (boot) {
          boot.setCommand(tl.command, commandChars(t, length), true);
```
Copied by Task 6 (the boot and dock typing switch from `commandChars(t, length)` to `typedChars(t, tl.command)`; the enter moment stays `commandEnterAt(length)`).

```ts
# SOURCE: src/runtime/layer.ts:266-274
      win.setOpen(windowOpenProgress(t, tl), slot.origin);
      if (slot.state === 'building') {
        const index = stepIndexAt(t, tl.steps);
        if (index < 0) win.setCommand('', 0, false);
        else {
          const step = tl.steps[index];
          win.setCommand(step.call, windowCommandChars(t, step), true);
        }
      }
```
Copied by Task 6 (the window shows `truncateCall(step.call)` and types that displayed string).

```ts
# SOURCE: src/sections/hero.build.ts:6-41
export function heroBuild(profile: ProfileData): BuildScript {
  const words = profile.subtitle.split(/\s+/).filter(Boolean).length;
  return {
    section: 'top',
    file: 'hero.tsx',
    command: 'startSite();',
    timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 },
    steps: [
      {
        call: `hero.title("${profile.headline}")`,
        target: 'title',
        effect: 'type-text',
        text: profile.headline,
      },
      {
        call: `hero.role("${profile.role}")`,
        target: 'role',
        effect: 'type-text',
        text: profile.role,
      },
      { call: 'hero.photo(…)', target: 'photo', effect: 'skeleton' },
      {
        call: 'hero.intro(…)',
        target: 'intro',
        effect: 'resolve-lines',
        count: words,
      },
      {
        call: 'hero.links([…])',
        target: 'links',
        effect: 'pop',
        gap: 60,
      },
    ],
  };
}
```
Copied by Task 2 (same shape: `section`, `file`, `command`, `timing`, steps; the steps now come from `pacedSteps`, the role becomes `decode`, and `count` becomes an estimated line count).

```ts
# SOURCE: src/sections/projects.build.ts:8-13
  const cards: BuildStep[] = projects.map(({ id }, index) => ({
    call: `projects.card("${id}")`,
    target: `card-${id}`,
    effect: 'build-card',
    ...(index > 0 ? { overlap: 120 } : {}),
  }));
```
Copied by Task 2 (cards keep the 120 ms overlap; with the 450 ms `build-card` duration the card pitch is 330 ms as in prototype v2).

```css
# SOURCE: src/styles/home.css:136-142
.sp-projects-cell {
  min-width: 0;
}

.sp-projects-cell:nth-child(even) {
  transform: translateY(96px);
}
```
Copied by Task 5 (the hazard to respect: `getBoundingClientRect` includes CSS transforms and this cell already has one, so effects write `clip-path` and `opacity` on page elements and never `transform`).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/runtime/effect-timing.ts` | CREATE | Pure, DOM-free module: duration table, seeded rng, jittered dock typing, call truncation, line estimate and per-effect phase functions |
| `src/runtime/compiler.ts` | UPDATE | Import the duration table from `effect-timing.ts` and re-export it; compiled output for unchanged scripts stays identical |
| `src/sections/pacing.ts` | CREATE | `pacedSteps` helper that turns prototype v2 pitches into gap or overlap values and a settle time |
| `src/sections/hero.build.ts`, `about.build.ts`, `projects.build.ts`, `stack.build.ts`, `contact.build.ts` | UPDATE | Base scripts retimed to prototype v2 offsets, hero role as `decode`, estimated line counts |
| `src/components/build/SelectionBox.ts`, `Skeleton.ts`, `TextOverlay.ts` | CREATE | Overlay factories for the selection box, skeleton blocks, typing caret and scramble glyphs |
| `src/styles/build-layer.css` | UPDATE | Styles for the three factories, tokens only, decorative shimmer |
| `src/styles/build-pending.css` | UPDATE | Sections stay visible while building; individual targets are hidden by attribute |
| `src/runtime/effect-dom.ts` | CREATE | Text-line measurement, clip-path polygon builders, label rules, hide and clear helpers |
| `src/runtime/effects.ts` | CREATE | The eight effect runners and the engine (`createEffects`) driven by `onState` and `onTick` |
| `src/runtime/layer.ts` | UPDATE | Jittered typing, truncated window commands, `root` exposed |
| `src/runtime/main.ts` | UPDATE | Create the engine in the non-instant branch, forward host callbacks, destroy it in `reveal()` |

## NOT Building (Scope Limits)

- `image-resolve`, the build-time photo to ASCII script, the real photo and covers, project page body text: Stage 4. The hero photo step is `skeleton` (select, skeleton, placeholder).
- Per-section tuning of the scripts against their budgets with the real content (Stage 4); the other sections keep prototype v2's relative offsets and are not forced under 2.5 s.
- Every visitor control and navigation behavior: Skip, Run all, speed, Replay, Play build, the collapsed dock, `queued <n>/5`, scroll hint, deep links, nav clicks, the focus rule, width-only resize handling, the `Shift + Esc` check, the controls API: Phase 4. The engine only exposes `onState`, `onTick` and `destroy`, and re-initializes a section on `command` so Phase 4's Replay can reuse it.
- Any change to the scheduler (`src/runtime/scheduler.ts`), the triggers, the stores, the compiler's timeline rules, the Stage 2 markup, copy, section ids or labels.
- Any new dependency, any test file (tests are authored by the test pair after the Implementer), the Command Palette, toasts, easter eggs, analytics, agent cursors (D8), the interactive dock (D7), keyboard sound and the element counter.
- The "unstyled to styled" joke effect (decided in Stage 4).

## Step-by-Step Tasks

### Task 1: CREATE src/runtime/effect-timing.ts and UPDATE src/runtime/compiler.ts

- **ACTION**: Delivers AC-A2 and AC-A7 (content-derived durations, seeded jitter, truncation). Create `effect-timing.ts` with only type imports (`import type { BuildStep, EffectName } from './types'`) so `node --experimental-strip-types` can run it, and with its own `ramp(t, from, to)` (0 before `from`, 1 at or after `to`, linear between, `t >= to ? 1 : 0` when `to <= from`) and `clamp`. Export constants `SELECT_MS = 150`, `SKELETON_MS = 300`, `SKELETON_BARS_MS = 200`, `TYPE_CHAR_MS = 28`, `DECODE_MS = 350`, `LINE_MS = 40`, `POP_MS = 180`, `STAGGER_GAP_MS = 90`, `CARD_MS = 450`, `SCRAMBLE_FRAME_MS = 40`, `WINDOW_CALL_MAX = 29` and `SCRAMBLE_GLYPHS` (the sixteen characters `!<>-_\/[]{}=+*^?#`). Export `EFFECT_DURATION_MS: Record<EffectName, (step: BuildStep) => number | string>` with exactly these results: `select` 150; `skeleton` `SELECT_MS + SKELETON_MS` (450); `type-text` `150 + text.length * 28` or the string `needs text`; `decode` `SELECT_MS + DECODE_MS` (500) or `needs text`; `resolve-lines` `SELECT_MS + SKELETON_BARS_MS + count * LINE_MS` or the string `needs count`; `pop` `SELECT_MS + POP_MS` (330); `stagger` `SELECT_MS + POP_MS + max(count - 1, 0) * STAGGER_GAP_MS` or `needs count`; `build-card` `CARD_MS`. Export these pure functions with exactly these signatures: `hashSeed(text: string): number` (32-bit FNV-1a, unsigned); `createRng(seed: number): () => number` (mulberry32 returning floats in [0, 1)); `estimateLines(text: string, charsPerLine: number): number` (sum over the `\n\n`-separated paragraphs of `max(1, ceil(paragraph.length / charsPerLine))`); `typedChars(t: number, command: string): number` (dock and boot typing at 40 ms per character with seeded jitter: per-character delays `40 + (rng() * 20 - 10)` with a further `+100` after a `(` or `,`, rng seeded by `hashSeed(command)`, cumulative times scaled so that character `k` appears at `250 + scale * cumulative[k]`, and the last character assigned directly at exactly `250 + command.length * 40`; returns how many characters have appeared at `t`, monotone, 0 at `t = 250`, equal to `command.length` at `250 + 40 * length`, so the compiled `commandEnd` is unchanged); `truncateCall(call: string, max = WINDOW_CALL_MAX): string` (return `call` when its length is `<= max`; otherwise keep the head up to and including the opening `(` and a following `"`, keep the tail `")` or `)`, and cut the argument body so the result is exactly `max` long with a single `…` before the tail; for example `projects.card("ai-track-record")` becomes `projects.card("ai-track-re…")`; a call without a long quoted argument is shortened to `max - 1` characters plus `…`); `typeCharsAt(localMs: number, length: number): number` (`clamp(floor((localMs - SELECT_MS) / TYPE_CHAR_MS), 0, length)`); `decodeSettled(localMs: number, length: number): number` (`floor(length * ramp(localMs, SELECT_MS, SELECT_MS + DECODE_MS))`); `decodeGlyphs(text: string, localMs: number, seed: number): string` (same length as `text`; characters before `decodeSettled` are the originals, spaces stay spaces, every other character is a glyph of `SCRAMBLE_GLYPHS` drawn from `createRng(seed + floor(localMs / SCRAMBLE_FRAME_MS) * 7919)` in index order, so a frame is reproducible); `resolveLinesAt(localMs: number, count: number): number` (`clamp(floor((localMs - SELECT_MS - SKELETON_BARS_MS) / LINE_MS), 0, count)`); `popProgress(localMs: number): number` (`ramp(localMs, SELECT_MS, SELECT_MS + POP_MS)`); `popInset(p: number): number` (the clip inset in percent: `10 - 14 * (p / 0.7)` for `p < 0.7`, so 10 at 0 and -4 at 0.7, then `-4 * (1 - (p - 0.7) / 0.3)` up to 0 at 1: a small overshoot made with `clip-path`, never a transform); `staggerChildProgress(localMs: number, index: number): number` (`popProgress(localMs - index * STAGGER_GAP_MS)`); `cardPhases(localMs: number): { select: number; skeleton: boolean; cover: boolean; title: number; summary: number; tags: number }` (`select = ramp(localMs, 0, 150)`, `skeleton = localMs >= 150 && localMs < 250`, `cover = localMs >= 250`, `title = ramp(localMs, 250, 400)`, `summary = ramp(localMs, 300, 420)`, `tags = ramp(localMs, 360, 450)`). In `compiler.ts` delete the local `EFFECT_DURATION_MS` table, `import { EFFECT_DURATION_MS } from './effect-timing'`, and add `export { EFFECT_DURATION_MS } from './effect-timing'` so existing importers keep working; change nothing else in the compiler. Format with `pnpm exec prettier --write` on both files.
- **MIRROR**: `# SOURCE: src/runtime/compiler.ts:15-31` and `# SOURCE: src/runtime/layer-timing.ts:17-31`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm test; node --experimental-strip-types --no-warnings --input-type=module -e "import * as e from './src/runtime/effect-timing.ts'; const q = String.fromCharCode(34); const G = '!<>-_' + String.fromCharCode(92) + '/[]{}=+*^?#'; const eq = (a, b, m) => { if (a !== b) { console.error('FAIL: ' + m + ' got ' + a + ' want ' + b); process.exit(1); } }; const D = e.EFFECT_DURATION_MS; eq(D['type-text']({ text: 'Fabio Barreto.' }), 542, 'type-text'); eq(D.decode({ text: 'x' }), 500, 'decode'); eq(D.skeleton({}), 450, 'skeleton'); eq(D.select({}), 150, 'select'); eq(D.pop({}), 330, 'pop'); eq(D['build-card']({}), 450, 'card'); eq(D['resolve-lines']({ count: 3 }), 470, 'lines'); eq(D.stagger({ count: 4 }), 600, 'stagger4'); eq(D.stagger({ count: 1 }), 330, 'stagger1'); eq(D['type-text']({}), 'needs text', 'needs text'); eq(D.stagger({}), 'needs count', 'needs count'); const cmd = 'startSite();'; eq(e.typedChars(250, cmd), 0, 'typed0'); eq(e.typedChars(730, cmd), 12, 'typed all'); eq(e.typedChars(729, cmd) < 12, true, 'typed not early'); let prev = 0; let diff = 0; for (let t = 0; t <= 800; t++) { const c = e.typedChars(t, cmd); if (c < prev) { console.error('FAIL: typedChars went backwards at ' + t); process.exit(1); } prev = c; const uniform = Math.min(Math.max(Math.floor((t - 250) / 40), 0), 12); if (c !== uniform) diff++; } eq(diff > 0, true, 'jitter present'); eq(e.typedChars(500, cmd), e.typedChars(500, cmd), 'deterministic'); const call = 'projects.card(' + q + 'ai-track-record' + q + ')'; eq(e.truncateCall(call), 'projects.card(' + q + 'ai-track-re\u2026' + q + ')', 'truncate'); eq(e.truncateCall(call).length, 29, 'truncate length'); const title = 'hero.title(' + q + 'Fabio Barreto.' + q + ')'; eq(e.truncateCall(title), title, 'short call'); eq(e.truncateCall('hero.links([\u2026])'), 'hero.links([\u2026])', 'links call'); eq(e.estimateLines('a'.repeat(100), 48), 3, 'lines'); eq(e.estimateLines('a\n\nb', 48), 2, 'paragraph lines'); eq(e.decodeGlyphs('Hello world', 500, 7), 'Hello world', 'decode settled'); const g = e.decodeGlyphs('Hello world', 150, 7); eq(g.length, 11, 'decode length'); eq(g[5], ' ', 'decode keeps spaces'); eq([...g].every((c) => c === ' ' || G.includes(c)), true, 'decode glyphs'); eq(g, e.decodeGlyphs('Hello world', 150, 7), 'decode deterministic'); eq(e.popInset(0), 10, 'pop start'); eq(e.popInset(1), 0, 'pop end'); eq(Math.round(e.popInset(0.7) * 100), -400, 'overshoot'); eq(e.resolveLinesAt(470, 3), 3, 'lines done'); eq(e.resolveLinesAt(390, 3), 1, 'lines mid'); eq(e.resolveLinesAt(300, 3), 0, 'lines early'); eq(e.hashSeed('a') === e.hashSeed('a') && e.hashSeed('a') !== e.hashSeed('b'), true, 'hash'); const r1 = e.createRng(5); const r2 = e.createRng(5); eq(r1() === r2() && r1() === r2(), true, 'rng'); eq(e.cardPhases(300).cover, true, 'cover'); eq(e.cardPhases(300).skeleton, false, 'skeleton off'); eq(e.cardPhases(200).skeleton, true, 'skeleton on'); eq(e.cardPhases(449).tags < 1, true, 'tags');"`

### Task 2: CREATE src/sections/pacing.ts and UPDATE the five build scripts

- **ACTION**: Delivers AC-A1, AC-A2 and AC-A9 (the base scripts at prototype v2's rhythm). Create `pacing.ts` exporting `pacedSteps(entries: { step: BuildStep; pitch?: number }[], createdRel: number, minSettle = 60): { steps: BuildStep[]; settle: number }`. It reads each step's duration from `EFFECT_DURATION_MS` (imported from `../runtime/effect-timing`; throw an `Error` naming the step if the table returns a string), puts step 0 at offset 0 and step `i` at `offset[i-1] + pitch` (the prototype's pitch is the distance between the STARTS of consecutive steps), converts each gap between the previous step's end and the wanted start into `gap` (when positive) or `overlap` (when negative) on that step's copy, and returns `settle = max(minSettle, createdRel - (offset[last] + duration[last]))`. Rewrite the five scripts to use it and pass `settle` into the `BuildScript`; keep every `section`, `file`, `command`, `call` string, `target`, and the hero `timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 }` as they are. Hero: pitches title 0, role 200, photo 100, intro 300, links 300 and `createdRel` 1300 (title 1300, role 1500, photo 1600, intro 1900, links 2200, createdAt 2600, duration 3100); the role step becomes `effect: 'decode'` with `text: profile.role`; the photo step stays `{ call: 'hero.photo(…)', target: 'photo', effect: 'skeleton' }` (no `image-resolve`); the intro step uses `count: estimateLines(profile.subtitle, 48)`; the title call stays `hero.title("Fabio Barreto.")` built from `profile.headline`, and the role call `hero.role("Senior Software Engineer")` built from `profile.role`. About: heading pitch 0, text 250, links 600, `createdRel` 1150, `count: estimateLines(profile.bio, 80)`. Projects: heading 0, first card 450, every later card 330 (the 450 ms card with a 330 ms pitch is exactly the 120 ms overlap), `createdRel` 1990. Stack: heading 0, first group 400, every later group 150, `createdRel` 1350. Contact: heading 0, links 450, location 200, `createdRel` 1100. Import `estimateLines` from `../runtime/effect-timing`. Do not edit any `.astro` file. Format with prettier.
- **MIRROR**: `# SOURCE: src/sections/hero.build.ts:6-41` and `# SOURCE: src/sections/projects.build.ts:8-13`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm test; pnpm build; node --input-type=module -e "import { chromium } from '@playwright/test'; import { preview } from 'astro'; const PORT = 4399; const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } }); const browser = await chromium.launch(); try { const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage(); await page.goto('http://127.0.0.1:' + PORT + '/'); const hero = await page.evaluate(() => JSON.parse(document.getElementById('top').getAttribute('data-build'))); const q = String.fromCharCode(34); const calls = hero.steps.map((s) => s.call).join('|'); const want = ['hero.title(' + q + 'Fabio Barreto.' + q + ')', 'hero.role(' + q + 'Senior Software Engineer' + q + ')', 'hero.photo(\u2026)', 'hero.intro(\u2026)', 'hero.links([\u2026])'].join('|'); if (calls !== want) throw new Error('FAIL: hero commands ' + calls); if (hero.steps.map((s) => s.effect).join() !== 'type-text,decode,skeleton,resolve-lines,pop') throw new Error('FAIL: hero effects ' + hero.steps.map((s) => s.effect).join()); [1300, 1500, 1600, 1900, 2200].forEach((ms, i) => { if (Math.abs(hero.steps[i].start - ms) > 50) throw new Error('FAIL: hero step ' + i + ' starts at ' + hero.steps[i].start + ', want ' + ms); }); if (hero.steps[0].end > 2000) throw new Error('FAIL: headline ends at ' + hero.steps[0].end); if (hero.duration > 3200) throw new Error('FAIL: hero duration ' + hero.duration); } catch (e) { console.error(e.message); process.exitCode = 1; } finally { await browser.close(); await server.stop(); } process.exit(process.exitCode ?? 0);"`

### Task 3: CREATE SelectionBox, Skeleton and TextOverlay in src/components/build/

- **ACTION**: Delivers AC-A4 and AC-A6 (the overlay surfaces effects draw; nothing in them is exposed to assistive technology). Each file exports one factory returning `{ el, ... }`; every root is created with `aria-hidden="true"`, uses `h()` from `./dom`, sets no role and no tabindex, never uses `innerHTML`, and compares every per-frame value with its last one before writing (as `setOpen` does). `SelectionBox.ts` exports `createSelectionBox()` with root class `sp-select`, attribute `data-state` (`drawing`, `active` or `fading`), four child spans of class `sp-select-handle` (the corner handles) and one label span of class `sp-select-label`; methods `setPlacement(rect: { x: number; y: number; width: number; height: number })` (writes `transform: translate3d(x, y, 0)`, `width` and `height`, called once per step), `setLabel(text: string)`, `setDraw(progress: number)` (writes only `clip-path: inset(0 <(1 - progress) * 100>% <(1 - progress) * 100>% 0)`, the box dragged from the top-left corner), `setState(state)` and `setOpacity(value: number)`. `Skeleton.ts` exports `createSkeleton(rects: { x: number; y: number; width: number; height: number }[])` with root class `sp-skel` holding one child block span (class `sp-skel-block`) per rect, each placed with `transform` plus width and height once, and methods `setOpacity(value: number)` and `setVisibleBlocks(from: number)` (blocks with index below `from` get `opacity: 0`; used by `resolve-lines`); there is no `setPlacement` because the rects are given at creation. `TextOverlay.ts` exports `createTextOverlay()` with root class `sp-text-fx` holding a caret span of class `sp-caret` (a thin bar) and a scramble span of class `sp-scramble`; methods `setCaret(x: number, y: number, height: number)` (the caret is hidden until first set; writes `transform: translate3d(x, y, 0)` and `height`), `hideCaret()`, `setScramble(text: string, x: number, y: number)` (writes `textContent` and `transform`; the empty string hides it) and `setFont(font: { font: string; letterSpacing: string; lineHeight: string })` (written once per step to match the real text). The caret and scramble elements carry the glyph and position only; they are never a copy of the page's text beyond the scrambled characters of the current step. Format with prettier.
- **MIRROR**: `# SOURCE: src/components/build/BuildWindow.ts:58-65` and `# SOURCE: src/components/build/PendingOutline.ts:21-31`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm check:tokens; pnpm exec prettier --check src/components/build`

### Task 4: UPDATE src/styles/build-layer.css and src/styles/build-pending.css

- **ACTION**: Delivers AC-A3, AC-A5, AC-A6 and AC-A8 (look, visibility rules, pointer events, CSS budget). `build-pending.css`: keep the existing selectors and the nav rule; extend the section rule with `:not([data-build-state='building']):not([data-build-state='closing'])` so a section is visible (its targets are hidden one by one) from its building state on, and add one rule `html[data-build-mode='pending'] [data-build-fx='hidden'] { opacity: 0; pointer-events: none; }` (`data-build-fx` is the attribute the engine writes on a target while it is not created yet; only opacity and pointer-events, never `display` or `visibility`, and only under the pending mode so a failure or the watchdog reveals everything). `build-layer.css` (tokens only: no hex, `rgb(` or `hsl(`, and every `box-shadow` carries `var(--`; no `transition`): `.sp-build-fx` is `position: absolute; top: 0; left: 0; width: 100%; height: 0; pointer-events: none` (the effects container that the engine inserts before the dock so windows and the dock paint above it); `.sp-select` is `position: absolute; top: 0; left: 0; box-sizing: border-box; border: 1px solid var(--build-select); background: var(--accent-glow); pointer-events: none`, `.sp-select[data-state='fading']` carries no extra rule (opacity is written per frame), `.sp-select-handle` is a 6px square in `var(--build-select)` positioned on the four corners, `.sp-select-label` is positioned above the top-left corner in `var(--font-mono)`, `var(--mono-xs)`, `background: var(--build-select)` and `color: var(--on-accent)`; `.sp-skel` is `position: absolute; top: 0; left: 0; pointer-events: none`, `.sp-skel-block` is `position: absolute; top: 0; left: 0; overflow: hidden; background: var(--build-skeleton); border-radius: var(--radius-sm)` with a `::after` shimmer (`background: linear-gradient(90deg, transparent, var(--build-shine), transparent)`) animated by a `@keyframes sp-skel-shimmer` rule that changes only `transform` (`translateX(-100%)` to `translateX(100%)`, 1.4s linear infinite), and under `@media (prefers-reduced-motion: reduce)` the shimmer is `animation: none`; `.sp-caret` is `position: absolute; top: 0; left: 0; width: 2px; background: var(--accent-fg); pointer-events: none`; `.sp-scramble` is `position: absolute; top: 0; left: 0; white-space: pre; color: var(--accent-fg); pointer-events: none`; `.sp-text-fx` is `position: absolute; top: 0; left: 0; pointer-events: none`. Format with prettier.
- **MIRROR**: `# SOURCE: src/styles/build-pending.css:1-13` and `# SOURCE: src/styles/build-layer.css:85-97`
- **VALIDATE**: `set -euo pipefail; pnpm check:tokens; pnpm exec prettier --check src/styles/build-layer.css src/styles/build-pending.css; pnpm build; pnpm check:budgets`

### Task 5: CREATE src/runtime/effect-dom.ts and src/runtime/effects.ts (the effects engine)

- **ACTION**: Delivers AC-A1, AC-A3, AC-A4, AC-A5, AC-A6 and AC-A9 (every effect, in place, as a pure function of the clock). `effect-dom.ts` exports DOM helpers only: `docRect(el: HTMLElement)` (the element's rect in document coordinates, `rect.left + scrollX`, `rect.top + scrollY`); `measureLines(el: HTMLElement): { top: number; bottom: number; left: number; right: number; chars: { x: number; line: number }[] }[]`-style data built with `Range.getClientRects` over the element's text nodes (read-only; collapsed whitespace has no rect and is skipped; characters are grouped into lines by rect top; line bounds are extended halfway to the neighbour line, the first line to the element's top and the last to its bottom, coordinates relative to the element's border box); `revealPolygon(lines, shown: number, total: number): string` returning a `clip-path` value `polygon(...)` that fully shows every line above the current one and the current line up to the x of character `shown` (a staircase polygon), and the fully clipped value `inset(0 100% 0 0)` when `shown` is 0; `lineReveal(lines, count: number): string` showing the first `count` whole lines; `popClip(inset: number, radius: string): string` returning `inset(<inset>% round <radius>)`; `labelFor(el: HTMLElement): string` (`data-build-label` if present, otherwise `card` for an element containing an `article`, `img <width>x<height>` of the rounded box for an element whose first content is an `img`, the tag name for `h1`, `h2`, `h3`, `p`, `ul` and `a`, and the tag of the first `h1`, `h2` or `h3` inside a wrapper, falling back to `div`); `hide(el)` (sets `data-build-fx="hidden"`), `live(el)` (removes the attribute) and `clear(el)` (removes the attribute and the inline `clip-path`, `opacity` and `pointer-events` it wrote, and removes the `style` attribute when it ends up empty). No function writes `transform`, `display`, `visibility` or text to a page element. `effects.ts` exports `createEffects(options: { sections: HTMLElement[]; timelines: Timeline[]; root: HTMLElement }): { onState(id: SectionId, state: SectionState): void; onTick(id: SectionId, t: number): void; destroy(): void }`. On creation it inserts one `<div class="sp-build-fx" data-build-fx-layer aria-hidden="true">` into `root`, before the first child (so the dock and windows paint above it). `onState(id, 'command')` (re)initializes that section: it discards any previous step state and overlays, and calls `hide()` on every `[data-build-target]` element of the section; `onState` with `closing`, `done` or `skipped` finishes the section (every step finished, overlays removed, every target cleared); `onTick(id, t)` walks the steps in order: a step with `t < start` is untouched (its targets stay hidden, no pointer events); a step with `start <= t < end` is mounted once (measure text and rects, create overlays) and rendered with `localMs = t - step.start` every tick; a step first seen with `t >= end` is finished without mounting. Finishing a step clears its targets (`clear`) and removes its overlays, so the elements are exactly the no-JS elements again. Targets of a step are `section.querySelectorAll('[data-build-target="<step.target>"]')` in document order (About's `text` matches three paragraphs; a missing target throws, which `guard` turns into `reveal()`). The seed of a step is `hashSeed(timeline.section + ':' + step.call)`. A target is "created" (its `hide` removed, so it receives pointer events) at its content start; before that it stays hidden. Per effect: **`select`** (150 ms): a `SelectionBox` per target drawn with `setDraw(selectProgress)` and labeled by `labelFor`; at the end the targets are revealed whole. **All other effects** first draw the selection box over each target during `localMs` 0 to 150 (`drawing`), keep it `active`, and fade it (`fading`, opacity ramp) over its last 100 ms. **`skeleton`**: one `Skeleton` block per target from 150 ms; the target is revealed whole at `localMs` 350 (content start) while the skeleton fades to 0 by the step's end (450 ms); a photo shows the real placeholder image afterwards. **`type-text`**: content starts at 150 ms; the target is made live with the empty clip, then `revealPolygon` reveals `floor(typeCharsAt(localMs, text.length) / text.length * measuredCharCount)` characters and `setCaret` follows the end of the revealed characters (thin caret, `--accent-fg`); the page text is never touched. **`decode`**: content starts at 150 ms; the settled prefix (`decodeSettled`) is revealed with `revealPolygon` and `setScramble(decodeGlyphs(text, localMs, seed).slice(settled), x, y)` draws the remaining characters of the line that holds the first unsettled character at the measured position, with the font copied once from `getComputedStyle`. **`resolve-lines`**: skeleton bars (one `Skeleton` block per measured line across all targets, in order) from 150 ms; content starts at 350 ms; `resolveLinesAt(localMs, count)` is mapped proportionally onto the measured lines (`floor(total * resolved / count)`), each target's lines revealed with `lineReveal` and the matching bars hidden with `setVisibleBlocks`. **`pop`**: the children of the target (its direct element children, or the target itself when it has none) are made live at 330 ms minus the pop length (content start 150 ms) with a fully clipped inset, and each child's clip is `popClip(popInset(popProgress(localMs)), <computed border radius>)` with opacity ramping to 1 over the first half; no `transform`. **`stagger`**: the target's name element (`h3`) is revealed whole at content start; its `li` children are pops started `STAGGER_GAP_MS` apart (`staggerChildProgress(localMs, index)`). **`build-card`**: a cell target per `cardPhases(localMs)`: selection box (`select`), one skeleton block over the cell (`skeleton` true), the cell made live at 250 ms (`cover` true; it now receives pointer events) with every part first clipped out, then the cover and card shell revealed whole, the title (`.sp-card-title` and `.sp-card-year`) revealed by `title` with `revealPolygon` and a caret, the summary (`.sp-card-summary`) by `summary` with `lineReveal`, and the tags and foot (`.sp-card-tags > *`, `.sp-card-foot`) popped by `tags`. Rules for all effects: write only `opacity`, `clip-path` and `pointer-events` on page elements and only `transform`, `opacity`, `clip-path`, width, height and text on overlay elements; never `transform` on a page element (see the cell transform in `home.css`); call no timer function, no `scrollTo`, no `scrollIntoView`; cache every written value so the DOM is touched only on change. `destroy()` finishes every section and removes the container. Format with prettier.
- **MIRROR**: `# SOURCE: src/styles/home.css:136-142` and `# SOURCE: src/components/build/BuildWindow.ts:58-65`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm check:tokens; pnpm exec prettier --check src/runtime/effect-dom.ts src/runtime/effects.ts; pnpm build`

### Task 6: UPDATE src/runtime/layer.ts (jittered typing, truncated window commands, root)

- **ACTION**: Delivers AC-A7 (typing rhythm in the layer). Import `typedChars` and `truncateCall` from `./effect-timing`. Add `readonly root: HTMLElement` to the `BuildLayer` interface and return `root` from `createBuildLayer`. In `onTick`, replace both `commandChars(t, length)` calls (the boot terminal and the dock `typing` branch) with `typedChars(t, tl.command)`; keep `commandEnterAt(length)` for the enter and log moments. For the window command bar compute `const display = truncateCall(step.call)` and call `win.setCommand(display, windowCommandChars(t, { call: display, start: step.start }), true)` (the displayed string is typed at 12 ms per character, so it always fits the 350 ms cap). Remove the now unused `commandChars` import from `layer.ts` only; leave `commandChars` exported from `layer-timing.ts`. Do not change any other behavior of the layer. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/layer.ts:226-229` and `# SOURCE: src/runtime/layer.ts:266-274`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm exec prettier --check src/runtime/layer.ts; pnpm test; pnpm build`

### Task 7: UPDATE src/runtime/main.ts (wire the engine) and smoke the hero

- **ACTION**: Delivers AC-A1, AC-A4, AC-A5 and AC-A6. Import `createEffects` from `./effects`. In the non-instant branch only, right after `createBuildLayer`, create `const effects = createEffects({ sections, timelines, root: layer.root });` and keep a module-level `let destroyEffects: (() => void) | null = effects.destroy`. In the scheduler host, `onState` calls `effects.onState(id, state)` FIRST, then writes the `data-build-state` attribute, then `layer.onState(id, state)` (a section's targets are marked hidden at its `command` state, before the pending rule stops hiding the section at `building`); add `effects.onTick(id, t)` inside the existing `onTick` guard next to `layer.onTick(id, t, dt)`. In `reveal()` call `destroyEffects?.()` before `destroyLayer?.()`. The instant branch (`data-build-mode="instant"`) creates no engine and writes nothing to the page, exactly as today. Do not change the scheduler call, the triggers, the stores or the `data-build-started` timing. Format with prettier.
- **MIRROR**: `# SOURCE: src/runtime/main.ts:17-35` and `# SOURCE: src/runtime/main.ts:84-104`
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm exec prettier --check src/runtime/main.ts; pnpm build; node --input-type=module -e "import { chromium } from '@playwright/test'; import { preview } from 'astro'; const PORT = 4399; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } }); const browser = await chromium.launch(); try { const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); await page.clock.install({ time: 0 }); await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'domcontentloaded' }); const dur = await page.evaluate(() => JSON.parse(document.getElementById('top').getAttribute('data-build')).duration); await page.clock.pauseAt(60000); const read = () => page.evaluate(() => { const t = document.querySelector('#top [data-build-target=' + String.fromCharCode(34) + 'title' + String.fromCharCode(34) + ']'); return { p: Number(document.documentElement.getAttribute('data-build-progress') || 0), state: document.getElementById('top').getAttribute('data-build-state'), fx: t.getAttribute('data-build-fx'), select: document.querySelectorAll('.sp-select').length, stray: document.querySelectorAll('[data-build-fx], .sp-select, .sp-skel, .sp-caret, .sp-scramble').length }; }); const until = async (test, label) => { for (let i = 0; i < 400; i++) { await page.clock.runFor(20); await sleep(3); const s = await read(); if (test(s)) return s; } throw new Error('FAIL: timed out waiting for ' + label); }; const early = await until((s) => s.p * dur >= 1340, 'title select'); if (early.fx !== 'hidden' || early.select < 1) throw new Error('FAIL: title should be hidden under a selection box at 1340 ms, got ' + JSON.stringify(early)); const mid = await until((s) => s.p * dur >= 1600, 'title typing'); if (mid.fx !== null) throw new Error('FAIL: title should be live while typing'); const late = await until((s) => s.p * dur >= 2750 && s.state !== 'done', 'hero closing'); if (late.stray !== 0) throw new Error('FAIL: effect leftovers after the hero steps: ' + late.stray); } catch (e) { console.error(e.message); process.exitCode = 1; } finally { await browser.close(); await server.stop(); } process.exit(process.exitCode ?? 0);"`

## Validation Commands

All three levels run from the worktree root (`C:/repos/site-pro/.worktrees/stage-3-runtime`). Level 3 needs Playwright's Chromium (`pnpm exec playwright install chromium`). Every block is self-contained, writes no file outside the code root and `PRPs/`, and exits non-zero on failure. Assertions read the DOM, never the serialized page, because inlined CSS can legitimately contain the class names of the layer and the effects. `pnpm test:e2e` is not a validation command here (see Notes).

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

Scenario A (the compiled scripts, read from the DOM with JavaScript disabled: commands from the content, prototype v2 offsets, every target present, nothing outside a target):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const near = (a, b, tol, msg) => check(Math.abs(a - b) <= tol, msg + ' (got ' + a + ', want ' + b + ')');
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto(URL, { waitUntil: 'load' });
  const data = await page.evaluate(() => {
    const out = {};
    for (const id of ['top', 'about', 'projects', 'stack', 'contact']) {
      const s = document.getElementById(id);
      const tl = JSON.parse(s.getAttribute('data-build'));
      const targets = new Set([...s.querySelectorAll('[data-build-target]')].map((e) => e.getAttribute('data-build-target')));
      out[id] = {
        tl,
        missing: tl.steps.filter((st) => !targets.has(st.target)).map((st) => st.target),
        uncovered: [...s.querySelectorAll('h1, h2, h3, p, a, button, img, li')].filter((e) => !e.closest('[data-build-target]')).length,
      };
    }
    out.slugs = [...document.querySelectorAll('#projects [data-build-target^="card-"]')].map((e) => e.getAttribute('data-build-target').slice(5));
    out.groups = [...document.querySelectorAll('#stack .sp-stack-name')].map((e) => e.textContent);
    return out;
  });
  const q = String.fromCharCode(34);
  const offsets = (tl) => tl.steps.map((s) => s.start - tl.steps[0].start);
  for (const id of ['top', 'about', 'projects', 'stack', 'contact']) {
    const d = data[id];
    check(d.missing.length === 0, id + ': every step target exists in the section: ' + d.missing.join());
    check(d.uncovered === 0, id + ': every heading, paragraph, link, image and chip sits inside a data-build-target (' + d.uncovered + ' outside)');
    check(d.tl.steps.every((s) => s.end <= d.tl.createdAt), id + ': createdAt is not before any step end');
  }
  const hero = data.top.tl;
  check(hero.steps.map((s) => s.call).join('|') === ['hero.title(' + q + 'Fabio Barreto.' + q + ')', 'hero.role(' + q + 'Senior Software Engineer' + q + ')', 'hero.photo(\u2026)', 'hero.intro(\u2026)', 'hero.links([\u2026])'].join('|'), 'hero commands in order');
  check(hero.steps.map((s) => s.effect).join() === 'type-text,decode,skeleton,resolve-lines,pop', 'hero effects: title types, role decodes, photo is a skeleton (no image-resolve)');
  [1300, 1500, 1600, 1900, 2200].forEach((ms, i) => near(hero.steps[i].start, ms, 50, 'hero step ' + i + ' start'));
  check(hero.steps[0].end <= 2000, 'headline step ends by 2.0 s');
  check(hero.createdAt <= 2700 && hero.duration <= 3200, 'hero created by 2.7 s and complete by 3.2 s (duration ' + hero.duration + ')');
  const about = data.about.tl;
  check(about.steps.map((s) => s.call).join('|') === ['about.heading(' + q + 'About me' + q + ')', 'about.text(\u2026)', 'about.links([\u2026])'].join('|'), 'about commands');
  [0, 250, 850].forEach((ms, i) => near(offsets(about)[i], ms, 60, 'about offset ' + i));
  near(about.createdAt - about.buildStart, 1150, 200, 'about created time');
  const projects = data.projects.tl;
  check(projects.steps.map((s) => s.call).join('|') === ['projects.heading(' + q + 'Selected work' + q + ')', ...data.slugs.map((s) => 'projects.card(' + q + s + q + ')')].join('|'), 'projects commands: one card per project');
  check(data.slugs.length >= 2, 'at least two project cards');
  const cards = projects.steps.slice(1);
  cards.slice(1).forEach((c, i) => check(c.start === cards[i].end - 120, 'card ' + (i + 1) + ' starts 120 ms before the previous card ends'));
  near(offsets(projects)[1], 450, 60, 'first card offset');
  near(projects.createdAt - projects.buildStart, 1990, 200, 'projects created time');
  const stack = data.stack.tl;
  check(stack.steps.map((s) => s.call).join('|') === ['stack.heading(' + q + 'What I work with' + q + ')', ...data.groups.map((g) => 'stack.group(' + q + g + q + ')')].join('|'), 'stack commands: one per group');
  stack.steps.slice(1).forEach((s, i) => near(offsets(stack)[i + 1], 400 + i * 150, 60, 'stack group ' + i + ' offset'));
  near(stack.createdAt - stack.buildStart, 1350, 200, 'stack created time');
  const contact = data.contact.tl;
  check(contact.steps.map((s) => s.call).join('|') === ['contact.heading(' + q + "Let's talk." + q + ')', 'contact.links([\u2026])', 'contact.location(\u2026)'].join('|'), 'contact commands');
  [0, 450, 650].forEach((ms, i) => near(offsets(contact)[i], ms, 60, 'contact offset ' + i));
  near(contact.createdAt - contact.buildStart, 1100, 200, 'contact created time');
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

Scenario B (the hero effects frame by frame: hidden and unclickable before their step, selection box, typing with a caret, decode with scramble glyphs, skeleton, pop, and nothing left behind):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const GLYPHS = '!<>-_' + String.fromCharCode(92) + '/[]{}=+*^?#';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const snap = (page) => page.evaluate((ids) => ({ p: Number(document.documentElement.getAttribute('data-build-progress') || 0), states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')) }), IDS);
const frame = (page) => page.evaluate(() => {
  const el = (n) => document.querySelector('#top [data-build-target="' + n + '"]');
  const st = (e) => { const cs = getComputedStyle(e); return { fx: e.getAttribute('data-build-fx'), clip: e.style.clipPath, op: cs.opacity, pe: cs.pointerEvents }; };
  const count = (s) => document.querySelectorAll(s).length;
  return {
    title: st(el('title')), role: st(el('role')), photo: st(el('photo')), links: st(el('links')),
    select: count('.sp-select'), skel: count('.sp-skel-block'), caret: count('.sp-caret'),
    scramble: [...document.querySelectorAll('.sp-scramble')].map((e) => e.textContent).join(''),
    inline: [...document.querySelectorAll('#top, #top *')].filter((e) => e.style.clipPath || e.style.opacity || e.style.transform || e.style.pointerEvents).length,
  };
});
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const dur = await page.evaluate(() => JSON.parse(document.getElementById('top').getAttribute('data-build')).duration);
  await page.clock.pauseAt(60000);
  const at = async (ms) => {
    for (let i = 0; i < 600; i++) { await page.clock.runFor(20); await sleep(3); const s = await snap(page); if (s.p * dur >= ms && s.states[0] !== 'done') return frame(page); }
    throw new Error('FAIL: timed out waiting for hero t=' + ms);
  };
  let f = await at(1340);
  check(f.title.fx === 'hidden' && f.title.op === '0' && f.title.pe === 'none' && f.select >= 1, 'title is hidden, unclickable and under a selection box while it is selected');
  check(f.role.fx === 'hidden' && f.photo.fx === 'hidden' && f.links.fx === 'hidden', 'later steps stay hidden');
  f = await at(1600);
  check(f.title.fx === null && f.title.clip.startsWith('polygon') && f.caret >= 1 && f.title.pe !== 'none', 'title is created, revealed by a clip-path polygon with a caret');
  check(f.role.fx === 'hidden' && f.role.pe === 'none' && f.links.fx === 'hidden', 'role and links are not created yet');
  f = await at(1800);
  check(f.role.fx === null && f.scramble.length >= 1 && [...f.scramble].every((c) => c === ' ' || GLYPHS.includes(c)), 'role decodes with scramble glyphs from the documented set');
  check(f.photo.fx === 'hidden' && f.skel >= 1, 'photo shows a skeleton before the placeholder');
  f = await at(2150);
  check(f.title.fx === null && f.title.clip === '' && f.role.clip === '' && f.photo.fx === null && f.photo.op === '1', 'title, role and photo are back to their resting state');
  check(f.links.fx === 'hidden' && f.links.pe === 'none', 'links are not created before 2.2 s');
  f = await at(2750);
  check(f.title.fx === null && f.role.fx === null && f.photo.fx === null && f.links.fx === null, 'no target is still marked');
  check(f.select === 0 && f.skel === 0 && f.caret === 0 && f.scramble === '' && f.inline === 0, 'no overlay element and no inline effect style is left in the hero');
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

Scenario C (layout never moves while elements are created: boxes, height, text and accessibility tree equal the ready page at effect moments, layout shift stays tiny):

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
const snap = (page) => page.evaluate((ids) => ({ p: Number(document.documentElement.getAttribute('data-build-progress') || 0), states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')) }), IDS);
async function runUntil(page, test, maxMs, label, step = 100) {
  for (let t = 0; t < maxMs; t += step) { await page.clock.runFor(step); await sleep(4); const s = await snap(page); if (test(s)) return s; }
  throw new Error('FAIL: timed out waiting for ' + label);
}
const boxes = (page) => page.evaluate(async () => {
  await document.fonts.ready;
  const els = [...document.querySelectorAll('main > section, main h1, main h2, main h3, main p, main a, main article, main li, main .sp-tag, footer, footer p')];
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
  const readyTree = await readyPage.locator('main').ariaSnapshot();
  const ctx = await browser.newContext(desktop);
  await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  const page = await ctx.newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const tls = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => [id, JSON.parse(document.getElementById(id).getAttribute('data-build'))])), IDS);
  await page.clock.pauseAt(60000);
  const hero = (ms) => runUntil(page, (s) => s.states[0] !== 'done' && s.p * tls.top.duration >= ms, 30000, 'hero t=' + ms, 20);
  await hero(1500);
  same(await boxes(page), ready, 'hero title typing');
  await hero(1700);
  same(await boxes(page), ready, 'hero decode and skeleton');
  check((await page.locator('main').ariaSnapshot()) === readyTree, 'hero: the accessibility tree of main equals the ready page');
  await hero(2440);
  same(await boxes(page), ready, 'hero links pop');
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  same(await boxes(page), ready, 'hero done');
  const top = await page.evaluate(() => document.getElementById('projects').getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y - 500, behavior: 'instant' }), top);
  const cards = tls.projects.steps.filter((s) => s.call.startsWith('projects.card('));
  const overlap = (cards[1].start + cards[0].end) / 2;
  await runUntil(page, (s) => s.states[2] === 'building' && s.p * tls.projects.duration >= overlap, 90000, 'two cards overlapping', 20);
  same(await boxes(page), ready, 'projects, two cards overlapping');
  check((await page.locator('main').ariaSnapshot()) === readyTree, 'projects: the accessibility tree of main equals the ready page');
  await runUntil(page, (s) => s.states[2] === 'done', 90000, 'projects done');
  const stackTop = await page.evaluate(() => document.getElementById('stack').getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y - 500, behavior: 'instant' }), stackTop);
  const mid = tls.stack.steps[3].start + 200;
  await runUntil(page, (s) => s.states[3] === 'building' && s.p * tls.stack.duration >= mid, 90000, 'stack stagger', 20);
  same(await boxes(page), ready, 'stack stagger');
  await runUntil(page, (s) => s.states[3] === 'done', 90000, 'stack done');
  same(await boxes(page), ready, 'after stack');
  await sleep(50);
  const cls = await page.evaluate(() => window.__cls);
  check(cls <= 0.01, 'layout shift ' + cls + ' is above 0.01');
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

Scenario D (pointer events while a card builds, and the window command truncated at 29 characters):

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
const snap = (page) => page.evaluate((ids) => ({ p: Number(document.documentElement.getAttribute('data-build-progress') || 0), states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')) }), IDS);
async function runUntil(page, test, maxMs, label, step = 100) {
  for (let t = 0; t < maxMs; t += step) { await page.clock.runFor(step); await sleep(4); const s = await snap(page); if (test(s)) return s; }
  throw new Error('FAIL: timed out waiting for ' + label);
}
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const tl = await page.evaluate(() => JSON.parse(document.getElementById('projects').getAttribute('data-build')));
  await page.clock.pauseAt(60000);
  await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
  const top = await page.evaluate(() => document.getElementById('projects').getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y - 500, behavior: 'instant' }), top);
  const cards = tl.steps.filter((s) => s.call.startsWith('projects.card('));
  check(cards.length >= 3, 'at least three project cards');
  const slotEnd = cards[1].start - 10;
  check(slotEnd > cards[0].start + 100, 'card 0 has its own slot before card 1 starts');
  await runUntil(page, (s) => s.states[2] === 'building' && s.p * tl.duration >= slotEnd, 90000, 'first card window command', 20);
  const cmd = await page.evaluate(() => document.querySelector('.sp-window[data-section="projects"] .sp-window-cmd').textContent.replace('\u2588', ''));
  const call = cards[0].call;
  const expected = call.length <= 29 ? call : call.slice(0, call.indexOf('(' + String.fromCharCode(34)) + 2) + call.slice(call.indexOf('(' + String.fromCharCode(34)) + 2, call.indexOf('(' + String.fromCharCode(34)) + 2 + (29 - (call.indexOf('(' + String.fromCharCode(34)) + 2) - 3)) + '\u2026' + String.fromCharCode(34) + ')';
  check(cmd.length > 0 && cmd.length <= 29 && expected.startsWith(cmd), 'window command is a typed prefix of the call cut to 29 characters with an ellipsis: ' + cmd);
  await runUntil(page, (s) => s.states[2] === 'building' && s.p * tl.duration >= cards[2].start + 100, 90000, 'third card selecting', 20);
  await page.evaluate(() => { const c = document.querySelectorAll('#projects .sp-projects-cell')[1]; window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 150, behavior: 'instant' }); });
  await page.clock.runFor(16); await sleep(10);
  const r = await page.evaluate((ids) => {
    const cells = [...document.querySelectorAll('#projects .sp-projects-cell')];
    const center = (e) => { const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const link = cells[1].querySelector('a.sp-card-link');
    const [lx, ly] = center(link);
    const hit = document.elementFromPoint(lx, ly);
    const [cx, cy] = center(cells[3]);
    const hit3 = document.elementFromPoint(cx, cy);
    const pe = (e) => getComputedStyle(e).pointerEvents;
    return {
      createdFx: cells[1].getAttribute('data-build-fx'), createdPe: pe(cells[1]), laterFx: [cells[2].getAttribute('data-build-fx'), cells[3].getAttribute('data-build-fx')], laterPe: [pe(cells[2]), pe(cells[3])],
      linkHit: !!hit && link.contains(hit), laterHit: !!hit3 && cells[3].contains(hit3),
      states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')),
    };
  }, IDS);
  check(r.states[3] === 'pending', 'scrolling for the hit test did not trigger Stack');
  check(r.createdFx === null && r.createdPe !== 'none', 'a created card receives pointer events');
  check(r.laterFx.every((v) => v === 'hidden') && r.laterPe.every((v) => v === 'none'), 'cards not created yet are hidden and receive no pointer events');
  check(r.linkHit, 'a click on the created card title reaches the title link while later cards are still building');
  check(!r.laterHit, 'a click where an uncreated card will be does not reach it');
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

Scenario E (no effect artifact on instant, no-JS, failure and non-home paths; only transform, opacity and clip-path animate; page elements never get a transform):

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
const artifacts = (page) => page.evaluate(() => document.querySelectorAll('[data-build-fx], [data-build-fx-layer], .sp-build-fx, .sp-select, .sp-skel, .sp-caret, .sp-scramble').length);
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  for (const [label, opts, init] of [['reduced motion', { ...desktop, reducedMotion: 'reduce' }, null], ['saved infinity', desktop, () => localStorage.setItem('sp-speed', 'inf')]]) {
    const ctx = await browser.newContext(opts);
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'load' });
    await p.waitForFunction(() => document.documentElement.getAttribute('data-build-status') === 'done');
    check((await artifacts(p)) === 0, label + ': no effect artifact');
  }
  const bare = await (await browser.newContext({ ...desktop, javaScriptEnabled: false })).newPage();
  await bare.goto(URL, { waitUntil: 'load' });
  check((await artifacts(bare)) === 0, 'no JavaScript: no effect artifact');
  const staticNames = await bare.evaluate(() => { const names = new Set(); for (const e of document.querySelectorAll('main [data-build-target], main [data-build-target] *')) for (let k = 0; k < e.style.length; k++) names.add(e.style.item(k)); return [...names]; });
  const okNames = new Set(['opacity', 'clip-path', 'pointer-events', ...staticNames]);
  const failed = await (await browser.newContext(desktop)).newPage();
  await failed.route(/\/_astro\/.*\.js/, (route) => route.abort());
  await failed.clock.install({ time: 0 });
  await failed.goto(URL, { waitUntil: 'domcontentloaded' });
  await failed.clock.pauseAt(60000);
  check((await artifacts(failed)) === 0, 'failure: the watchdog leaves no effect artifact');
  check((await failed.evaluate(() => getComputedStyle(document.querySelector('h1')).opacity)) === '1', 'failure: the headline is visible');
  for (const path of ['/projects/relay/', '/no-such-page']) {
    const other = await (await browser.newContext(desktop)).newPage();
    await other.goto('http://127.0.0.1:' + PORT + path, { waitUntil: 'load' });
    check((await artifacts(other)) === 0, path + ': no effect artifact outside the home page');
  }
  const page = await (await browser.newContext(desktop)).newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.clock.pauseAt(60000);
  const allowedAnim = new Set(['opacity', 'transform', 'clip-path', 'offset', 'easing', 'composite', 'computedOffset']);
  for (let i = 0; i < 600; i++) {
    await page.clock.runFor(20); await sleep(3);
    const r = await page.evaluate((ok) => {
      const bad = [];
      for (const e of document.querySelectorAll('main [data-build-target], main [data-build-target] *')) {
        for (let k = 0; k < e.style.length; k++) { const n = e.style.item(k); if (!ok.includes(n)) bad.push(n); }
      }
      const props = new Set();
      for (const a of document.getAnimations()) for (const kf of a.effect?.getKeyframes() ?? []) for (const k of Object.keys(kf)) props.add(k);
      const outside = [...document.querySelectorAll('.sp-select, .sp-skel, .sp-caret, .sp-scramble')].filter((e) => document.querySelector('main').contains(e) || !e.closest('[data-build-layer][aria-hidden="true"]')).length;
      return { p: Number(document.documentElement.getAttribute('data-build-progress') || 0), state: document.getElementById('top').getAttribute('data-build-state'), bad, props: [...props], outside };
    }, [...okNames]);
    check(r.bad.length === 0, 'page elements only receive opacity, clip-path and pointer-events: ' + r.bad.join());
    check(r.props.every((n) => allowedAnim.has(n)), 'only transform, opacity and clip-path animate: ' + r.props.join());
    check(r.outside === 0, 'every effect overlay is inside the aria-hidden build layer, outside main');
    if (r.state === 'done') break;
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

- **AC-A1 (PRD AC-1):** The hero builds element by element in the order `hero.title("Fabio Barreto.")`, `hero.role("Senior Software Engineer")`, `hero.photo(…)`, `hero.intro(…)`, `hero.links([…])` at prototype v2's offsets (1300, 1500, 1600, 1900, 2200 ms within 50 ms): the headline is typed and fully visible by 2.0 s of clock time, the role decodes through scrambled glyphs, the photo goes select, skeleton, placeholder (no `image-resolve`), the intro resolves line by line and the buttons pop; the hero is in its final state by 3.2 s (compiled duration <= 3200 ms) with the window gone and the dock idle.
- **AC-A2 (PRD AC-20):** Every effect lasts its content-derived duration (a headline of n characters selects for 150 ms then types for n x 28 ms; decode 150 + 350; lines 150 + 200 + n x 40; pop 150 + 180; stagger 150 + 180 + 90 per further child; card 450), each step starts where the previous one ends plus its gap or earlier by its overlap (each project card starts 120 ms before the previous card ends), every command is a string from the script with its arguments taken from the content (one `projects.card("<slug>")` per project, one `stack.group("<name>")` per group), and every step target exists in its section.
- **AC-A3 (PRD AC-4):** No box moves while elements are created: every section, heading, paragraph, link, chip, tag, card and the footer, and the document height, equal the ready page (+/- 0.5 px) during title typing, decode and skeleton, the hero links pop, two project cards overlapping and the Stack stagger; summed layout shift stays <= 0.01.
- **AC-A4 (PRD AC-18):** Page text is never rewritten or announced: the text content of `<main>` and its accessibility tree equal the ready page at mid-hero and mid-projects, the caret, scramble glyphs, selection boxes and skeletons live only in the aria-hidden overlay root outside `<main>`, and no inline style other than `opacity`, `clip-path` and `pointer-events` is ever written on a page element.
- **AC-A5 (PRD AC-11):** Elements not yet created are hidden and receive no pointer events, created ones receive them at once: while the third project card is selecting, the second card's title link receives a click while later cards do not; a section that is not building keeps `pointer-events: none` from Phase 2.
- **AC-A6 (PRD AC-4, AC-14, AC-15):** Effects animate only `transform`, `opacity` and `clip-path` (page elements receive only `opacity`, `clip-path` and `pointer-events` inline, never a transform); with reduced motion, a saved `∞`, JavaScript disabled, the runtime blocked or on a non-home page no effect attribute, overlay or inline style exists, and the headline stays visible after a failure.
- **AC-A7 (PRD AC-1, AC-20):** The window command bar types the displayed call at 12 ms per character, cut with `…` to at most 29 characters so each command takes at most 350 ms (`projects.card("ai-track-record")` shows as `projects.card("ai-track-re…")`); the boot and dock type with seeded jitter (40 ± 10 ms per character, +100 ms after `(` and `,`, normalized so `startSite();` still ends typing at 730 ms and every compiled `commandEnd` is unchanged), identically on every run.
- **AC-A8 (PRD AC-19):** `pnpm check:budgets` stays green with the effects (runtime + effects <= 18 KB gzip, critical <= 20 KB, total JS <= 90 KB, CSS <= 25 KB), `pnpm check:tokens` finds no color or box-shadow literal, and no effect markup or CSS reaches the 404 or project pages.
- **AC-A9 (PRD AC-1, AC-20):** Base scripts exist for the five sections with prototype v2's relative offsets on the current content (About 0 / 250 / 850, Projects heading then cards at 450 and a 330 ms pitch, Stack groups at 400 then every 150 ms, Contact 0 / 450 / 650), each created time within 200 ms of prototype v2's, and no content (heading, paragraph, link, image, chip) sits outside a `data-build-target` so nothing pops in unannounced.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| The 18 KB runtime budget is exceeded by eight effects, the measurement helpers and three factories (5.7 KB today) | M | H | One pure timing module, shared helpers, no dependency, no per-effect duplication; `pnpm check:budgets` runs in Task 4 and Level 2; a breach is fixed in the code, never by raising a limit |
| Clip-path polygons do not follow wrapped text (multi-line headline, absolutely positioned hero layers, cells with a CSS transform) | M | H | Lines are measured with `Range` client rects relative to the element's own box (translation cancels), polygons are staircases over measured line bounds, and Scenario C compares every box and the text at typing, decode and pop moments |
| A `transform` on a page element would change `getBoundingClientRect` and break the "boxes never move" rule (the even project cells already carry a CSS transform) | M | H | Pop is an inset `clip-path` with an overshoot instead of a scale; Scenario E fails if any page element gets an inline property other than opacity, clip-path or pointer-events |
| Pop built with clip-path differs from docs/04's "scale from 0.9 to 1 with a slight overshoot" | M | L | Recorded in Notes for the owner's rhythm review in Phase 5; the invariant (no moved box at any moment) wins over the literal wording |
| Text measured before late fonts load gives wrong line geometry | M | M | Measurement happens when a step starts (after `document.fonts.ready` in practice, the layer already re-places on font load); Phase 4's width-only resize rule finishes the section |
| A section becomes visible at `building` while some content sits outside a target and pops in | L | M | Scenario A asserts every heading, paragraph, link, image and chip is inside a `data-build-target` |
| Estimated line counts differ from the measured lines, so resolve-lines finishes a little early or late inside its step | M | L | Playback maps the compile-time count onto the measured line count proportionally, so it always ends exactly at the step end |
| Lighthouse Performance drops because the hero headline is revealed by script | M | M | Open question carried from the PRD; the headline is readable by about 1.85 s; measured on the pull request and reported to the owner, no threshold relaxed |
| Existing Stage 2 and Phase 1-2 specs assert behavior this phase changes on purpose | H | M | Expected, handled by the test pair's lifecycle ledger (see Notes); the Implementer edits no test |

## Notes

**TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

**Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.

- **Expected test impact (for the test pair, not the Implementer).** (a) `tests/e2e/home-no-build-layer.spec.ts` (rewritten in Phase 2 or pending its rewrite in Phase 5) asserts that no `.sp-select` or `.sp-skel` exists after 2 s with a real clock; the hero now shows selection boxes and skeletons until about 2.1 s, so any such assertion must wait for the build to settle (or use instant mode). (b) Stage 2 specs that measure or click on a default visit (`home-axe`, `home-content`, `home-keyboard`, `home-responsive-layout`, `home-mobile-menu`) now meet hero elements that are hidden with `pointer-events: none` until created and clipped while typing; Playwright treats opacity and clip-path as visible, but a click before a target is created waits for it, so those specs should start from the ready page with `useInstantBuild` (reduced motion or a saved `inf`). (c) The unit file `tests/unit/runtime-compiler.test.ts` builds its own scripts, so the new duration table does not change it, but any unit test that read the old `EFFECT_DURATION_MS` values (decode 150 + n x 20, build-card 600, pop 300, skeleton 300) must follow the new table (decode 500, build-card 450, pop 330, skeleton 450, lines 150 + 200 + n x 40, stagger 330 + 90 per further child); `EFFECT_DURATION_MS` is still importable from `src/runtime/compiler.ts`. (d) `tests/e2e/runtime-timeline-contract.spec.ts` keeps passing by design (headline 150 + n x 28, cards 120 ms overlap, `createdAt` not before the last step end). (e) `tests/e2e/build-layer-show.spec.ts` and `build-layer-layout.spec.ts` should keep passing; `heroAt` moments refer to the retimed hero (duration 3100 ms instead of the provisional value). Unit candidates for the pair: `effect-timing` (every exported function, including `typedChars` determinism and the 730 ms end of `startSite();`, `truncateCall`, `decodeGlyphs`, `popInset`, `cardPhases`), `pacedSteps` (gap or overlap and settle), the five compiled timelines (offsets and created times), and `effect-dom` polygon builders if they stay DOM-free. Playwright candidates: the hero frames of Scenario B, the invariance moments of Scenario C, pointer events of Scenario D, and the artifact-free paths of Scenario E, with `useInstantBuild` fixing any Stage 2 spec the build touches.
- **Why `pnpm test:e2e` is not a validation command here.** The Stage 2 specs named above can conflict with the new effects by design until the test pair updates them; running them in the Implementer's gate would fail against a correct implementation. Level 3 drives the built site with Playwright's library and clock directly instead; `pnpm test` (unit) is part of Level 2 and of Tasks 1, 2 and 6 because a regression in an existing unit test must be caught.
- **Validation conventions carried from Phases 1 and 2.** Level 3 asserts on the DOM, never on the serialized page (inlined CSS can contain class names); each scenario is one small self-contained block that writes nothing outside the code root; the only text patterns that decide an exit code are literals authored in this plan's own ACTION prose (`hero.title("Fabio Barreto.")`, `hero.role("Senior Software Engineer")`, `hero.photo(…)`, `hero.intro(…)`, `hero.links([…])`, `projects.card("ai-track-re…")`, the class names `sp-select`, `sp-skel-block`, `sp-caret`, `sp-scramble`, `sp-build-fx`, `sp-window-cmd`, `sp-card-link` and the attributes `data-build-fx`, `data-build-fx-layer`, `data-build-target`); the glyph set and the non-ASCII characters in inline `node -e` checks are built with `String.fromCharCode` or `\u` escapes so shell quoting cannot change them. Stage times in Scenarios B to E use the compiled hero numbers (title 1300 to 1842, role 1500 to 2000, photo 1600 to 2050, links 2200 to 2530) with margins larger than the 1 percent resolution of `data-build-progress`.
- **Hero numbers.** With the Task 1 table and the Task 2 pitches the hero compiles to: title 1300 to 1842 (542 ms), role 1500 to 2000 (decode 500), photo 1600 to 2050 (skeleton 450), intro 1900 to 2370 (three estimated lines, 470), links 2200 to 2530 (pop 330), `createdAt` 2600 (settle 70), `duration` 3100. The headline is readable at 1842 ms (budget 2000) and the hero is final at 3100 ms (budget 3200). The other four sections follow prototype v2's relative offsets and are not forced under the 2.5 s budget (Stage 4 tunes them; their trigger-to-created time includes the command typing).
- **Effect surface contract for Stage 4 and Phase 4.** `createEffects` renders from `t` only, so Phase 4's Skip, Run all, speed and resize rules need nothing from it beyond `onState(id, 'done' | 'skipped')` finishing a section instantly; a Replay re-enters through `onState(id, 'command')`, which re-hides the targets. `image-resolve` (Stage 4) is one more runner added to the registry plus a duration entry; no scheduler change is needed.
- **Docs impact (for the docs sync, not the Implementer).** docs/04-animations.md's table gains the final durations (decode fixed 350 ms after the 150 ms select, card 450 ms, pop and stagger as above) and records that pop is implemented with an inset `clip-path` (with a small overshoot) instead of a scale so that no page box ever moves; docs/06-architecture.md records the `data-build-fx` attribute and the effects container `sp-build-fx`.
- **Hero photo.** The `hero.photo(…)` step uses the `skeleton` effect: selection box, skeleton block, then the real placeholder silhouette (`src/assets/photo-placeholder-body.svg`) is revealed in place. Stage 4's `image-resolve` replaces the effect on that one step and adds the ASCII start.
- **Open questions carried.** The watchdog timeout (3 s) and Lighthouse Performance with the hero revealed by script are measured on the pull request; nothing in this phase changes what is hidden before the runtime confirms its start.

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
