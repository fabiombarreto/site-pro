# Feature: Section tuning (Phase 3 of stage-4-sections-effects)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (an optional per-section dock `log` carried by the build script through the compiler into the timeline and read by the dock; opening the section window at Enter; a staggered `pop`; a shorter card); cross-cutting patterns (the data-build contract, effects driven by the runtime clock, size budgets, the `src/runtime/` boundary); creation or change of components (the effects files, `compiler.ts`, `layer.ts`, `layer-timing.ts`, the five section build scripts, `Hero.astro`); impact on shared UI (hero, About, Projects, Stack and Contact while they build); business rules for build (B1, B4, B13, B21, B22, B23, B24, B29, B30) and content (C7, C15)
- Decisions found:
  - D8 Multi-cursor agents in v1.1 (v1 builds one element at a time inside each window, so cards keep a short overlap of about 120 ms and never more than two cards build at once)
  - D12 Hero photo: ASCII -> real photo (Phase 2 shipped the effect; this phase types the real file name)
  - D17 Build windows concept (a typed command opens a window that creates the section, then steps aside)
  - D2 Astro + React + TypeScript strict; the runtime is plain TypeScript outside React and writes to the DOM directly
  - Stage 4 PRD approved (2026-11-10): budgets measured at the `✔ <Section> Section created.` line for sections after the hero; cards about 300-350 ms with a 120 ms overlap; per-section dock logs carried by the build script; every window command and dock log comes from the content (B22); `src/runtime/` boundary: scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts and api.ts stay frozen, while the effects files, an additive optional `log` field through types.ts and compiler.ts, and layer.ts may change
  - Stage 4 PRD: base-timing tests are updated to the new intended timings by the test pair and recorded in the lifecycle ledger (never loosened)
  - Stage 3 approved (2026-11-09): the runtime is the base for Stage 4; the final layout never moves
  - Privacy list: only personal projects, no private data in commands, logs, fixtures or commits
- Applicable anti-patterns:
  - Layout-shifting build animations (only `transform`, `opacity` and `clip-path` animate; the new stagger reuses the existing inset clip-path and opacity)
  - Hiding pending content with `display` or `visibility`
  - Generic fade-up reveals (buttons, chips and cards keep select -> skeleton -> content with the catalog effects)
  - Many timers instead of one loop (everything stays driven by the runtime tick)
  - Raw values instead of tokens
  - Invented numbers and banned copy patterns (timings come from the PRD budgets and the recorded levers)
  - Weakening tests to get a green run (pinned base-timing tests are updated on purpose by the test pair, never loosened or deleted)
  - Scope creep into v1 (project page text is Phase 4, quality gates are Phase 5)
- Applicable architectural rules:
  - The build layer is one overlay, aria-hidden except the dock's controls, animating only `transform`, `opacity` and `clip-path` on page elements
  - Pending content stays laid out and in the accessibility tree; instant paths (skip, run all, focus, resize, infinity, reduced motion, no JS) leave nothing behind
  - One requestAnimationFrame loop and the runtime's injectable clock; the scheduler is unchanged (AC-14)
  - SSG with complete final HTML; build scripts are compiled at build time into each section's `data-build` attribute
  - Runtime + effects <= 18 KB gzip (12.8 KB today), critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB
  - docs/ is the source of truth and is updated before code; relay artifacts live in PRPs/, nothing under the tool config directory
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-4-sections-effects.prd.md` — Implementation Phases row 3: "Section tuning" — Goal: Every section builds with its final effects, commands and logs within its budget. — Success signal: AC-6, AC-7 and AC-8 pass; all Stage 3 behavior-rule specs stay green.

All code paths in this plan are relative to the feature worktree root (`.worktrees/stage-4-sections-effects`, branch `feature/stage-4-sections-effects`), which already holds the uncommitted Phase 1 and Phase 2 work. Line numbers were read from that worktree.

## Summary

Phase 3 gives the five build scripts their final shape. Every window command argument and dock log comes from the content (an excerpt of the intro and bio text, the link labels, the photo's original file name, the project count), carried by a new optional `log` field from `BuildScript` through `compileScript` into the `Timeline` and read by `layer.ts` instead of the generic `Reading <file>...`. The budgets are met with the levers the runtime already has plus three small ones: the non-hero sections open their window at Enter (`windowEnd = commandEnd`, saving 100 ms) while the dock now holds the log for 100 ms after Enter; `pop` staggers its children 90 ms apart (so the two or three buttons pop one after another, as docs/04 says) and its duration grows with a `count`; and a card lasts 300 ms (the low end of the PRD's 300-350 ms) with its phases retimed to fit, so consecutive cards overlap by exactly 120 ms. Step pitches are retuned in all five scripts. Projected times from trigger to the created line: About 2.40 s, Projects 2.47 s, Stack 2.44 s, Contact 2.43 s; the hero gets its staggered buttons and ends created at 2.65 s with its window gone at 3.15 s, headline readable at 1.84 s. The scheduler and the other frozen files are not touched. No task authors a test: the pinned base-timing tests are listed in `## Notes` for the test pair to update on purpose.

## User Story

As a visitor watching the site build itself
I want every section to finish within its time budget with the commands and logs of its real content
So that the show feels quick and authentic instead of slow and generic

## Problem Statement

After Phases 1 and 2 the hero photo dissolves from ASCII and covers resolve from blur, but the scripts still carry prototype v2 timings on stand-in text: About, Projects, Stack and Contact miss the 2.5 s budget (Projects by about 0.9 s), every dock log reads `Reading <file>...` (`src/runtime/layer.ts:393`), several window commands are placeholders (`hero.intro(…)`, `about.text(…)`, `contact.location(…)`, `*.links([…])`), `hero.photo` can carry a hashed file name, and the buttons of the hero, About and Contact pop all at once instead of one after another.

## Solution Statement

Add the optional `log` field (types.ts, compiler.ts) and read it in the dock (layer.ts, with a pure `dockLogEnd` in layer-timing.ts so the log stays visible for 100 ms after Enter when the window opens at Enter). Make `pop` take an optional `count` and stagger its children by `STAGGER_GAP_MS`; shorten `CARD_MS` to 300 ms and retime `cardPhases` and the card's selection fade to match. Add copy to `src/strings.ts`, a pure `call-args.ts` helper (`excerpt`, `labelList`) and an `openAtEnter` timing helper in `pacing.ts`, then retune the five scripts. `Hero.astro` passes the photo's source file name (`sourcePathFor`) to `heroBuild` so the typed name is the original, never the hashed one. Docs are amended first (docs/04, build.md, docs/02, decisions.md), as the project's docs-first rule requires.

## Metadata

| Key | Value |
|-----|-------|
| Type | ENHANCEMENT (final section scripts, budgets, content-driven commands and logs) |
| Complexity | MEDIUM |
| Systems Affected | `src/runtime/` (types.ts, compiler.ts, layer-timing.ts, layer.ts, effect-timing.ts, effects.ts), `src/sections/` (pacing.ts, call-args.ts, the five `*.build.ts`, Hero.astro), `src/strings.ts`, docs/ (04, 02, build.md, decisions.md, architecture.md) |
| Dependencies | Phase 2 (complete): `image-resolve`, the `cardPhases` progress value and the hero photo step (1000 ms); no new package, nothing added to the browser beyond a few lines in the effects and layer |
| Estimated Tasks | 9 |
| Source PRD line ref | `PRPs/prds/stage-4-sections-effects.prd.md` Implementation Phases row 3; Phase Details "Phase 3: Section tuning" |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-4-sections-effects.prd.md` | 75-77, 154-158, 202-205, 224-225, 233-234 | AC-6, AC-7, AC-8; the `src/runtime/` boundary and timing levers; the Phase 3 scope; the card and log decisions |
| P0 | `src/runtime/types.ts` | 27-65 | `BuildStep`, `Timeline`, `BuildScript` (where `log?` goes) |
| P0 | `src/runtime/compiler.ts` | 17-20, 43-92 | Phase times, `previousEnd`/`createdAt`, the Timeline literal that must carry `log` |
| P0 | `src/runtime/layer.ts` | 350-399 | The dock state machine and the single `readingFile` call site |
| P0 | `src/runtime/layer-timing.ts` | 3-13, 33-35, 63-73 | Constants, `commandEnterAt`, `windowOpenProgress` (windowEnd to buildStart) |
| P0 | `src/runtime/scheduler.ts` | 41-49 | `stateAt` reads `commandEnd`, `buildStart`, `createdAt` and `duration`, never `windowEnd`: why `windowEnd = commandEnd` is safe |
| P0 | `src/runtime/effect-timing.ts` | 6-24, 50-70, 186-208 | Constants, `EFFECT_DURATION_MS`, `staggerChildProgress`, `cardPhases` |
| P0 | `src/runtime/effects.ts` | 278-333, 375-461 | The `pop`, `stagger` and `build-card` runners |
| P0 | `src/sections/pacing.ts` | 10-35 | `pacedSteps` (pitch to gap/overlap; settle from `createdRel`) |
| P0 | `src/sections/hero.build.ts` | 8-74 | The hero script, `photoFileName`, timing overrides and pitches |
| P0 | `src/sections/about.build.ts` | 9-43 | The About script |
| P0 | `src/sections/projects.build.ts` | 6-37 | The Projects script (card pitches 450/330, `createdRel` 1990) |
| P0 | `src/sections/stack.build.ts` | 8-38 | The Stack script (group pitches 400/150, `createdRel` 1350) |
| P0 | `src/sections/contact.build.ts` | 8-43 | The Contact script |
| P0 | `src/strings.ts` | 84-87 | `buildStrings` log copy |
| P1 | `src/sections/Hero.astro` | 5-10, 20-30, 57-67 | Where `heroBuild` is called, `sourcePathFor`'s import site and the three hero buttons |
| P1 | `src/sections/About.astro` | 40-52 | The two About buttons (`<a>` children of the `links` target) |
| P1 | `src/sections/Contact.astro` | 36-48 | The two Contact buttons |
| P1 | `src/images/pipeline.ts` | 72-80 | `sourcePathFor(asset)` returns the source path under `src/assets` (never import it into a unit-tested module: it imports `astro:assets`) |
| P1 | `src/content/profile.json` | 4-22 | `headline`, `subtitle`, `bio`, `location`, `links` (labels GitHub and LinkedIn) and `photo` (`../assets/photo-placeholder-body.svg`) |
| P1 | `src/content/stack.json` | 3-13 | Six groups with 4, 2, 5, 3, 2 and 1 items |
| P1 | `tests/e2e/support/runtime.ts` | 96-100 | The regex that reads each section's timeline out of the built HTML (the budget probe reuses it) |
| P1 | `tests/e2e/support/home.ts` | 20-26, 62-99 | `decodeEntities` and the project order (`PROJECTS`) |
| P1 | `docs/04-animations.md` | 56-79, 128-131 | Timings table, the `image-resolve` and `build-card` rows |
| P1 | `docs/domain/areas/build.md` | 29-30, 40-46 | B21, B22, B30, timings and effect mechanics |
| P1 | `docs/05-content.md` | 94-112 | The microcopy table and the "arguments and logs come from the content" paragraph |
| P2 | `tests/unit/runtime-pacing.test.ts`, `tests/unit/effect-timing.test.ts`, `tests/unit/image-resolve-timing.test.ts`, `tests/unit/hero-photo-command.test.ts`, `tests/e2e/effects-scripts.spec.ts`, `tests/e2e/runtime-timeline-contract.spec.ts` | see Notes | The pinned base timings the test pair updates on purpose (read only here) |

## Patterns to Mirror

# SOURCE: src/runtime/compiler.ts:52-58
```ts
  const commandEnd =
    script.timing?.commandEnd ??
    COMMAND_START_MS +
      script.command.length * COMMAND_CHAR_MS +
      COMMAND_ENTER_MS;
  const windowEnd = script.timing?.windowEnd ?? commandEnd + WINDOW_OPEN_MS;
  const buildStart = script.timing?.buildStart ?? windowEnd + WINDOW_HOLD_MS;
```
Task 2 leaves this alone; Task 5's `openAtEnter` produces a `timing` override of the same three fields (the hero already uses `timing`), so no compiler change is needed for the window to open at Enter.

# SOURCE: src/runtime/compiler.ts:79-91
```ts
  const createdAt = previousEnd + (script.settle ?? DEFAULT_SETTLE_MS);
  return {
    v: 1,
    section: script.section,
    file: script.file,
    command: script.command,
    commandEnd,
    windowEnd,
    buildStart,
    steps,
    createdAt,
    duration: createdAt + CLOSING_MS,
  };
```
Task 2 copies this explicit literal and adds `log` only when the script declares one.

# SOURCE: src/runtime/layer.ts:385-399
```ts
      } else if (slot.state !== 'closing') {
        if (queueText !== null) {
          dock.setState('building');
          dock.setLog(null);
          dock.setQueued(queueText);
        } else if (t < tl.windowEnd) {
          dock.setState('typing');
          dock.setCommand(tl.command, typedChars(t, tl.command), true);
          dock.setLog(t >= enterAt ? buildStrings.readingFile(tl.file) : null);
        } else {
          dock.setState('building');
          dock.setLog(null);
          dock.setBuilding(fileName(tl.file), spinnerFrame(loopMs));
        }
      }
```
Task 3 changes the `t < tl.windowEnd` bound to `t < dockLogEnd(tl.windowEnd, enterAt)` and the log text to `tl.log ?? buildStrings.readingFile(tl.file)`.

# SOURCE: src/runtime/layer-timing.ts:33-35
```ts
export function commandEnterAt(length: number): number {
  return COMMAND_START_MS + length * COMMAND_CHAR_MS + COMMAND_ENTER_MS;
}
```
Task 3 adds `dockLogEnd` next to it as a pure function; Task 5's `openAtEnter` calls `commandEnterAt`.

# SOURCE: src/runtime/effect-timing.ts:50-70
```ts
export const EFFECT_DURATION_MS: Record<
  EffectName,
  (step: BuildStep) => number | string
> = {
  select: () => SELECT_MS,
  skeleton: () => SELECT_MS + SKELETON_MS,
  'type-text': (s) =>
    s.text === undefined ? 'needs text' : 150 + s.text.length * TYPE_CHAR_MS,
  decode: (s) => (s.text === undefined ? 'needs text' : SELECT_MS + DECODE_MS),
  'resolve-lines': (s) =>
    s.count === undefined
      ? 'needs count'
      : SELECT_MS + SKELETON_BARS_MS + s.count * LINE_MS,
  pop: () => SELECT_MS + POP_MS,
  stagger: (s) =>
    s.count === undefined
      ? 'needs count'
      : SELECT_MS + POP_MS + Math.max(s.count - 1, 0) * STAGGER_GAP_MS,
  'image-resolve': () => RESOLVE_REVEAL_MS + DISSOLVE_MS,
  'build-card': () => CARD_MS,
};
```
Task 4 copies the `stagger` arithmetic into `pop` (an absent `count` stays one child, 330 ms, so existing `pop` steps are unchanged).

# SOURCE: src/runtime/effect-timing.ts:186-208
```ts
export function staggerChildProgress(localMs: number, index: number): number {
  return popProgress(localMs - index * STAGGER_GAP_MS);
}

export function cardPhases(localMs: number): {
  select: number;
  skeleton: boolean;
  cover: number;
  coverStarted: boolean;
  title: number;
  summary: number;
  tags: number;
} {
  return {
    select: ramp(localMs, 0, 150),
    skeleton: localMs >= 150 && localMs < 250,
    cover: ramp(localMs, 250, 400),
    coverStarted: localMs >= 250,
    title: ramp(localMs, 250, 400),
    summary: ramp(localMs, 300, 420),
    tags: ramp(localMs, 360, 450),
  };
}
```
Task 4 keeps the shape of `cardPhases` and moves its breakpoints so the last phase ends at `CARD_MS` (300 ms).

# SOURCE: src/runtime/effects.ts:278-304
```ts
  pop(ctx) {
    const sel = selection(ctx);
    const parts = ctx.targets.flatMap((t) => {
      const kids = [...t.children] as HTMLElement[];
      return (kids.length > 0 ? kids : [t]).map((el) => ({
        el,
        radius: radiusOf(el),
      }));
    });
    let started = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        if (l < SELECT_MS) return;
        const p = popProgress(l);
        for (const part of parts) poof(part.el, p, part.radius);
        if (!started) {
          started = true;
          for (const t of ctx.targets) live(t);
        }
      },
      destroy() {
        sel.destroy();
        for (const part of parts) clear(part.el);
      },
    };
  },
```
Task 4 replaces the single `p` with `staggerChildProgress(l, index)` per part, mirroring the `stagger` runner just below it (effects.ts:306-333), and drops the now-unused `popProgress` import.

# SOURCE: src/runtime/effects.ts:404-408
```ts
    return {
      render(l) {
        const phase = cardPhases(l);
        sel.update(l, 300, 450);
        skel.setOpacity(phase.skeleton ? 1 : 0);
        if (!phase.coverStarted) return;
```
Task 4 changes the hard-coded selection fade `sel.update(l, 300, 450)` to fade over the last 100 ms of the shorter card (`200, 300`); the rest of the `build-card` runner is driven by `cardPhases` and needs no other change.

# SOURCE: src/sections/pacing.ts:10-35
```ts
export function pacedSteps(
  entries: PacedEntry[],
  createdRel: number,
  minSettle = 60,
): { steps: BuildStep[]; settle: number } {
  const steps: BuildStep[] = [];
  let offset = 0;
  let previousEnd = 0;
  for (const [i, { step, pitch = 0 }] of entries.entries()) {
    const length = EFFECT_DURATION_MS[step.effect](step);
    if (typeof length === 'string') {
      throw new Error(`paced step "${step.call}": ${length}`);
    }
    const start = i === 0 ? 0 : offset + pitch;
    const delta = start - previousEnd;
    const copy: BuildStep = { ...step };
    if (i > 0) {
      if (delta > 0) copy.gap = delta;
      else if (delta < 0) copy.overlap = -delta;
    }
    steps.push(copy);
    offset = start;
    previousEnd = start + length;
  }
  return { steps, settle: Math.max(minSettle, createdRel - previousEnd) };
}
```
Tasks 6-8 keep calling `pacedSteps` and only change entries, pitches, `createdRel` and the `timing`/`log` fields of the returned script. `createdRel` is measured from `buildStart` and `settle` is measured from the LAST step's end.

# SOURCE: src/sections/hero.build.ts:66-73
```ts
  return {
    section: 'top',
    file: 'hero.tsx',
    command: 'startSite();',
    timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 },
    steps,
    settle,
  };
```
Tasks 7 and 8 mirror this script literal for About, Contact, Projects and Stack, with `timing: openAtEnter(COMMAND)` and a `log`.

# SOURCE: src/strings.ts:84-87
```ts
  initializing: 'Initializing application...',
  openingFile: (file: string) => `Opening ${file}...`,
  readingFile: (file: string) => `Reading ${file}...`,
  building: (name: string) => `Building ${name}…`,
```
Task 5 adds the three new log strings in this same object, in the same style.

# SOURCE: tests/e2e/support/runtime.ts:96-100
```ts
export function timelinesOf(html: string): TimelineJson[] {
  return [...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map(
    (m) => JSON.parse(decodeEntities(m[1] ?? '')) as TimelineJson,
  );
}
```
The budget probes in Tasks 6-9 copy this regex and the `decodeEntities` replacements (`tests/e2e/support/home.ts:20-26`) verbatim to read the compiled timelines out of `dist/index.html`.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `docs/04-animations.md` | UPDATE | Docs first: window opens at Enter with the log held 100 ms, staggered `pop`, card 300 ms and its retimed phases (the 250-400 ms cover ramp no longer fits) |
| `docs/domain/areas/build.md` | UPDATE | B30 and the timings and effect-mechanics paragraphs: 300 ms card, staggered `pop`, the optional `log` |
| `docs/02-experience.md` | UPDATE | Its command list still shows `hero.photo(…)`; it becomes `hero.photo("<photo file name>")` and the other arguments follow docs/05 |
| `docs/decisions.md` | UPDATE | Records the Phase 3 tuning decisions (window at Enter, log hold, 300 ms card, staggered `pop`, the hero photo name) |
| `docs/context/architecture.md` | UPDATE | `src/sections/` and `src/runtime/` rows mention `call-args.ts`, `openAtEnter`, the `log` field and `dockLogEnd` |
| `src/runtime/types.ts` | UPDATE | Optional `log` on `BuildScript` and `Timeline` |
| `src/runtime/compiler.ts` | UPDATE | Carries `log` into the Timeline and rejects `<`/`>` in it (as for `command`) |
| `src/runtime/layer-timing.ts` | UPDATE | `DOCK_LOG_HOLD_MS`, `WINDOW_OPEN_MS` and the pure `dockLogEnd` |
| `src/runtime/layer.ts` | UPDATE | The dock reads `tl.log` and keeps the log until `dockLogEnd` |
| `src/runtime/effect-timing.ts` | UPDATE | `pop` duration by `count`, `CARD_MS` 300, retimed `cardPhases` |
| `src/runtime/effects.ts` | UPDATE | `pop` staggers its children; the card's selection fade follows the shorter card |
| `src/strings.ts` | UPDATE | `fetchingProjects`, `resolvingDependencies`, `openingChannels` |
| `src/sections/call-args.ts` | CREATE | Pure `excerpt` and `labelList` for content-derived command arguments |
| `src/sections/pacing.ts` | UPDATE | `openAtEnter(command)` timing helper |
| `src/sections/hero.build.ts` | UPDATE | Photo name parameter, `hero.intro`/`hero.links` arguments, staggered buttons, tightened pitches |
| `src/sections/Hero.astro` | UPDATE | Passes the photo's source file name to `heroBuild` |
| `src/sections/about.build.ts` | UPDATE | `about.text` and `about.links` arguments, `log`, window at Enter, pitches |
| `src/sections/contact.build.ts` | UPDATE | `contact.links`/`contact.location` arguments, `log`, window at Enter, pitches |
| `src/sections/projects.build.ts` | UPDATE | `log` with the count, window at Enter, 300 ms cards with a 120 ms overlap |
| `src/sections/stack.build.ts` | UPDATE | `log`, window at Enter, group pitches |

## NOT Building (Scope Limits)

- Any change to `src/runtime/scheduler.ts`, `clock.ts`, `triggers.ts`, `focus-rule.ts`, `resize.ts`, `keys.ts`, `controls-timing.ts`, `main.ts` or `api.ts` (AC-14); no scheduler change at all.
- Authoring or editing any test file: base-timing tests are updated on purpose by the test pair after the Implementer and Code Review (listed in `## Notes`).
- Project page text (Phase 4) and the quality gates, E2E for every AC, Lighthouse LCP assertion, `docs/context/testing.md` mapping and the asset-swap procedure (Phase 5).
- The "unstyled -> styled" joke effect (v1.1), `warn  Coffee level low` and the window-dot close (Stage 5), the Command Palette, view transitions, `open("slug");` and the `ENOENT` window (Stage 5), OG images and analytics (Stage 6).
- Multi-cursor agents and the interactive dock (D7, D8: v1.1), a third simultaneous card, or relaxing any budget.
- Any change to the Stage 2 layout, section ids, labels, heading structure or the page register; no new page-element property animates beyond `opacity` and `clip-path`.
- New placeholder cover art, the real photo and covers, or any change to the Phase 1 image pipeline or the Phase 2 `image-resolve` runner.

## Step-by-Step Tasks

### Task 1: UPDATE docs (docs first)

- **ACTION**: Before any code, amend the documents so they match what Tasks 2-8 build. (a) `docs/04-animations.md`: in the Timings table, change the "Window opening" note to say sections after the hero open the window at Enter, include the exact sentence `Sections after the hero open their window at Enter and the dock keeps its log for 100 ms.`, and change the "Pop" row's note to say siblings pop 90 ms apart; in the Effects catalog, change the `pop` row to say a group of buttons pops one after another 90 ms apart, and change the `image-resolve` and `build-card` rows (the text `250–400 ms` appears in both) to the new card phases, with the exact phrase `cover opacity ramp 190–270 ms of the card` and a card of 300 ms (select box drawn over 150 ms, skeleton 150–190 ms, cover and title 190–270 ms, summary 210–285 ms, tags 240–300 ms). (b) `docs/domain/areas/build.md`: B30 and the Timings paragraph say 300 ms per card with the 120 ms overlap; the Effect mechanics paragraph says `pop` staggers its children 90 ms apart and that a script may declare an optional dock `log`. (c) `docs/02-experience.md`: find every `hero.photo(…)` in the command list and make it `hero.photo("<photo file name>")`; align the other window commands with the Build microcopy table of docs/05-content.md (`hero.intro("12+ years shipping…")`, `hero.links(["GitHub", "LinkedIn"])`, `about.text("I'm a full-stack software…")`, `contact.location("Brazil (UTC-3)")`). (d) `docs/decisions.md`: add an entry whose heading is exactly `## [2026-11-10] Stage 4 Phase 3 · Section tuning` (same Context/Decision/Reason/Areas affected format as the neighbours) recording: non-hero windows open at Enter with the dock log held 100 ms; `pop` staggers 90 ms; cards last 300 ms with a 120 ms overlap and retimed phases; the optional per-script `log`; the hero command types the photo's original file name; the first card starts while the heading is still typing (a budget lever); and that the scheduler is untouched. (e) `docs/context/architecture.md`: in the `src/sections/` row mention `call-args.ts` and `pacing.ts`'s `openAtEnter`, and in the `src/runtime/` row the optional `log` and `dockLogEnd`. English only; no private data; no em dash.
- **MIRROR**: The existing entry format at the top of `docs/decisions.md` (`## [date] title`, then Context, Decision, Reason, Areas affected) and the table rows already in docs/04-animations.md lines 56-79.
- **VALIDATE**: `set -euo pipefail; pnpm exec prettier --check docs/04-animations.md docs/domain/areas/build.md docs/02-experience.md docs/decisions.md docs/context/architecture.md; grep -qF 'Sections after the hero open their window at Enter and the dock keeps its log for 100 ms.' docs/04-animations.md; grep -qF 'cover opacity ramp 190–270 ms of the card' docs/04-animations.md; grep -qF '## [2026-11-10] Stage 4 Phase 3 · Section tuning' docs/decisions.md; if grep -n 'hero\.photo(…)' docs/02-experience.md; then echo 'FAIL: docs/02-experience.md still lists hero.photo(…)'; exit 1; else echo 'PASS: hero.photo(…) gone from docs/02'; fi` (the deliverable here IS prose, so literal matches are the right check; Prettier proves the files stay formatted). Delivers AC-A1 and AC-A3 (documents them).

### Task 2: UPDATE src/runtime/types.ts and src/runtime/compiler.ts (the optional `log`)

- **ACTION**: In `types.ts` add `log?: string;` to `BuildScript` (after `command`) and to `Timeline` (after `command`, before `commandEnd`), so the Timeline stays a plain JSON-serializable record. In `compiler.ts`, next to the existing `<`/`>` check on `script.command`, reject a `log` containing `<` or `>` with `build script "<section>": log must not contain < or >`, and add the field to the returned Timeline only when declared: `...(script.log === undefined ? {} : { log: script.log })`, so a script without a log serializes exactly as today. Do not touch `commandEnd`, `windowEnd`, `buildStart`, `createdAt` or `duration`. Delivers AC-A2 (the `log` carrier).
- **MIRROR**: `# SOURCE: src/runtime/compiler.ts:79-91` (explicit Timeline literal) and the command check at `src/runtime/compiler.ts:47-51`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm exec vitest run tests/unit/runtime-compiler.test.ts tests/unit/runtime-scheduler.test.ts` (the type check proves the field flows through the types; the existing compiler and scheduler suites prove a script without `log` compiles exactly as before; the built-HTML effect of `log` is exercised by the probes of Tasks 7 and 8).

### Task 3: UPDATE src/runtime/layer-timing.ts and src/runtime/layer.ts (the dock reads the log)

- **ACTION**: In `layer-timing.ts` add `export const DOCK_LOG_HOLD_MS = 100;` (docs/04 "Gap between logs" is 100 ms), `export const WINDOW_OPEN_MS = 280;` (docs/04 "Window opening"), and `export function dockLogEnd(windowEnd: number, enterAt: number): number { return Math.max(windowEnd, enterAt + DOCK_LOG_HOLD_MS); }`. In `layer.ts` (non-hero branch, lines 390-393) replace `t < tl.windowEnd` with `t < dockLogEnd(tl.windowEnd, enterAt)` and replace the log text with `tl.log ?? buildStrings.readingFile(tl.file)`; import `dockLogEnd`. Scripts that keep the default timings (`windowEnd = commandEnd + 100`) behave as before because `max` returns `windowEnd`; the hero branch is not touched. Do not edit `windowOpenProgress`, `foldProgress` or any frozen file. Delivers AC-A8.
- **MIRROR**: `# SOURCE: src/runtime/layer.ts:385-399` and `# SOURCE: src/runtime/layer-timing.ts:33-35`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm exec vitest run tests/unit/runtime-layer-timing.test.ts; node --experimental-strip-types --no-warnings --input-type=module -e "import('./src/runtime/layer-timing.ts').then((m) => { if (m.dockLogEnd(890, 890) !== 990 || m.dockLogEnd(1000, 730) !== 1000 || m.WINDOW_OPEN_MS !== 280) { console.error('FAIL: dockLogEnd'); process.exit(1); } console.log('PASS: dockLogEnd'); })"` (`layer-timing.ts` imports only a type, so Node can load it directly: a window that opens at Enter (windowEnd 890, enter 890) keeps the log until 990, while the hero-style default (1000, 730) is unchanged).

### Task 4: UPDATE src/runtime/effect-timing.ts and src/runtime/effects.ts (staggered `pop`, 300 ms card)

- **ACTION**: In `effect-timing.ts`: (1) `CARD_MS = 300`. (2) `pop: (s) => SELECT_MS + POP_MS + Math.max((s.count ?? 1) - 1, 0) * STAGGER_GAP_MS` (no `count` keeps 330 ms). (3) Retime `cardPhases` so the last phase ends at 300 ms and the cover resolves inside the card: `select: ramp(localMs, 0, 150)`, `skeleton: localMs >= 150 && localMs < 190`, `cover: ramp(localMs, 190, 270)`, `coverStarted: localMs >= 190`, `title: ramp(localMs, 190, 270)`, `summary: ramp(localMs, 210, 285)`, `tags: ramp(localMs, 240, 300)`. In `effects.ts`: (4) the `pop` runner gives each part its child index and uses `staggerChildProgress(l, part.index)` instead of the shared `popProgress(l)`; remove the `popProgress` import if it becomes unused (lint fails on it otherwise). (5) In the `build-card` runner change `sel.update(l, 300, 450)` to `sel.update(l, 200, 300)`. Do not change `stagger`, `image-resolve`, `select`, `skeleton` or any runner's `destroy()`: instant paths already clear every touched element. Only `opacity` and `clip-path` are written, as before. Delivers AC-A3 and AC-A7.
- **MIRROR**: `# SOURCE: src/runtime/effect-timing.ts:50-70`, `# SOURCE: src/runtime/effect-timing.ts:186-208`, `# SOURCE: src/runtime/effects.ts:278-304` (and the `stagger` runner at `src/runtime/effects.ts:306-333`), `# SOURCE: src/runtime/effects.ts:404-408`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; node --experimental-strip-types --no-warnings --input-type=module -e "import('./src/runtime/effect-timing.ts').then((m) => { const s = { call: 'x', target: 't', effect: 'pop' }; const D = m.EFFECT_DURATION_MS; const ok = D.pop({ ...s, count: 3 }) === 510 && D.pop({ ...s, count: 2 }) === 420 && D.pop(s) === 330 && D['build-card'](s) === 300 && m.cardPhases(189).coverStarted === false && m.cardPhases(190).coverStarted === true && m.cardPhases(270).cover === 1 && m.cardPhases(299).tags < 1 && m.cardPhases(300).tags === 1; if (!ok) { console.error('FAIL: effect timing'); process.exit(1); } console.log('PASS: effect timing'); })"` (`effect-timing.ts` imports only types, so Node loads it directly; three buttons last 510 ms, two last 420 ms, an unset count stays 330 ms, the card lasts 300 ms and its cover starts at 190 ms).

### Task 5: UPDATE src/strings.ts, CREATE src/sections/call-args.ts, UPDATE src/sections/pacing.ts

- **ACTION**: (1) `strings.ts`, in the object holding `readingFile`: add `fetchingProjects: (count: number) => \`Fetching projects... ${count} found\``, `resolvingDependencies: 'Resolving dependencies...'` and `openingChannels: 'Opening channels...'` (the exact texts of docs/05-content.md's microcopy table). (2) Create `src/sections/call-args.ts` exporting pure, import-free functions: `ARG_EXCERPT_CHARS = 25`; `excerpt(text: string, max = ARG_EXCERPT_CHARS): string` that collapses whitespace, removes `"`, `<` and `>`, returns the text unchanged when it has at most `max` characters, otherwise returns the longest prefix of whole words that fits in `max` characters followed by `…` (a first word longer than `max` is cut at `max`); and `labelList(labels: readonly string[]): string` returning the JSON-like list `["GitHub", "LinkedIn"]` (double-quoted labels joined by a comma and a space inside brackets). (3) `pacing.ts`: add `openAtEnter(command: string)` returning `{ commandEnd, windowEnd, buildStart }` where `commandEnd = commandEnterAt(command.length)`, `windowEnd = commandEnd` and `buildStart = commandEnd + WINDOW_OPEN_MS` (import both from `../runtime/layer-timing`); it is the one place that expresses "the window opens at Enter". Delivers AC-A2 and AC-A8 (infrastructure for the scripts).
- **MIRROR**: `# SOURCE: src/strings.ts:84-87` and `# SOURCE: src/sections/pacing.ts:10-35` (pure helper module, typed arguments, no side effects).
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; node --experimental-strip-types --no-warnings --input-type=module -e "import('./src/sections/call-args.ts').then((m) => { const bio = \"I'm a full-stack software engineer, and I've been studying programming.\"; const ok = m.excerpt(bio) === \"I'm a full-stack software…\" && m.excerpt('12+ years shipping full-stack apps with React.') === '12+ years shipping…' && m.excerpt('short') === 'short' && m.excerpt('x'.repeat(40)).length === 26 && m.labelList(['GitHub', 'LinkedIn']) === '[\"GitHub\", \"LinkedIn\"]'; if (!ok) { console.error('FAIL: call-args'); process.exit(1); } console.log('PASS: call-args'); })"` (a pure module with no imports, loaded directly; the expected strings are the AC-8 literals; `openAtEnter` is exercised by the build probes of Tasks 7 and 8).

### Task 6: UPDATE src/sections/hero.build.ts and src/sections/Hero.astro (the hero's final script)

- **ACTION**: In `hero.build.ts`: (1) `heroBuild(profile: ProfileData, photoName?: string)`; the typed photo name is `photoName` when given and non-empty, otherwise the existing `photoFileName(profile.photo)` fallback (unchanged, so stubs and unit tests that call `heroBuild(profile)` keep their ellipsis fallback). (2) `call` for the intro becomes `` `hero.intro("${excerpt(profile.subtitle)}")` `` and for the buttons `` `hero.links(${labelList(profile.links.map((l) => l.label))})` ``. (3) The buttons step becomes `{ effect: 'pop', count: profile.links.length + 1 }`, with a comment that the hero renders one "See my work" button plus one button per profile link (`src/sections/Hero.astro:57-67`), so the three buttons pop one after another, 510 ms. (4) Tighten the later pitches around the 1,000 ms photo step: role 200, photo 100, intro 250, links 230; `createdRel` 1350; keep `timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 }` and the title step untouched. Resulting starts 1300, 1500, 1600, 1850 and 2080; the photo ends at 2600, the buttons at 2590, `createdAt` 2650, `duration` 3150, headline step ends at 1842. In `Hero.astro` import `sourcePathFor` from `../images/pipeline` (next to the existing imports), compute `const photoName = sourcePathFor(profile.photo).split(/[\\/]/).pop()` and call `heroBuild(profile, photoName)` so the typed name is the original file name (`photo-placeholder-body.svg`), never Astro's hashed output name. Delivers AC-A4 and AC-A1.
- **MIRROR**: `# SOURCE: src/sections/hero.build.ts:66-73` and `# SOURCE: src/sections/pacing.ts:10-35`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm build; node --input-type=module - <<'EOF'
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tl = Object.fromEntries([...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map((m) => { const t = JSON.parse(dec(m[1])); return [t.section, t]; }));
const bad = [];
const need = (ok, msg) => { if (!ok) bad.push(msg); };
const h = tl.top;
const c = h.steps.map((s) => s.call);
need(c[0] === 'hero.title("Fabio Barreto.")', 'title ' + c[0]);
need(c[1] === 'hero.role("Senior Software Engineer")', 'role ' + c[1]);
need(c[2] === 'hero.photo("photo-placeholder-body.svg")', 'photo ' + c[2]);
need(c[3] === 'hero.intro("12+ years shipping…")', 'intro ' + c[3]);
need(c[4] === 'hero.links(["GitHub", "LinkedIn"])', 'links ' + c[4]);
need(h.steps[0].end <= 2000, 'headline ends ' + h.steps[0].end);
need(h.steps[2].end - h.steps[2].start === 1000, 'photo step length');
need(h.createdAt >= Math.max(...h.steps.map((s) => s.end)), 'created before the last step ends');
need(h.duration <= 3200, 'duration ' + h.duration);
need(h.log === undefined, 'the hero keeps its boot logs, no dock log');
const links = h.steps.find((s) => s.target === 'links');
const anchors = ((html.match(/data-build-target="links"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').match(/<a\b/g) || [];
need((links.end - links.start - 330) / 90 + 1 === anchors.length, 'pop count ' + anchors.length + ' vs step ' + (links.end - links.start));
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('PASS: hero script');
EOF` (builds the site and reads the hero timeline out of the served HTML: the photo command carries the original file name, the headline ends by 2000 ms, the duration stays within 3200 ms, and the button step's length matches the number of buttons actually rendered).

### Task 7: UPDATE src/sections/about.build.ts and src/sections/contact.build.ts

- **ACTION**: Both scripts: define `const COMMAND = 'renderAbout();'` (respectively `'renderContact();'`), use it for `command`, and set `timing: openAtEnter(COMMAND)`. **About**: `file: 'about.md'`; `log: buildStrings.readingFile('about.md')` (import `buildStrings` and `excerpt`, `labelList`); the text step's call is `` `about.text("${excerpt(profile.bio)}")` `` and the buttons step is `{ call: \`about.links(${labelList(labels)})\`, target: 'links', effect: 'pop', count: profile.links.length }`; pitches heading 0, text 250, links 500; `createdRel` 1230. Expected: commandEnd 890, buildStart 1170, text 250-840, buttons 750-1170, `createdAt` 2400. **Contact**: `log: buildStrings.openingChannels`; the links step is `contact.links(${labelList(labels)})` with `count: profile.links.length`; the location call is `` `contact.location("${profile.location}")` `` (full value, the window cuts it to 29 characters); pitches heading 0, links 350, location 230; `createdRel` 1180. Expected: commandEnd 970, buildStart 1250, buttons 350-770, location 580-1122, `createdAt` 2432. Delivers AC-A2, AC-A1 and AC-A3 (buttons one after another, the location last).
- **MIRROR**: `# SOURCE: src/sections/hero.build.ts:66-73` and `# SOURCE: src/sections/pacing.ts:10-35`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm build; node --input-type=module - <<'EOF'
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tl = Object.fromEntries([...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map((m) => { const t = JSON.parse(dec(m[1])); return [t.section, t]; }));
const bad = [];
const need = (ok, msg) => { if (!ok) bad.push(msg); };
const maxEnd = (t) => Math.max(...t.steps.map((s) => s.end));
const calls = (t) => t.steps.map((s) => s.call);
const expected = {
  about: { log: 'Reading about.md...', calls: ['about.heading("About me")', 'about.text("I\'m a full-stack software…")', 'about.links(["GitHub", "LinkedIn"])'] },
  contact: { log: 'Opening channels...', calls: ['contact.heading("Let\'s talk.")', 'contact.links(["GitHub", "LinkedIn"])', 'contact.location("Brazil (UTC-3)")'] },
};
for (const [id, want] of Object.entries(expected)) {
  const t = tl[id];
  need(JSON.stringify(calls(t)) === JSON.stringify(want.calls), id + ' calls ' + calls(t).join(' | '));
  need(t.log === want.log, id + ' log ' + t.log);
  need(t.createdAt <= 2500, id + ' createdAt ' + t.createdAt);
  need(t.createdAt >= maxEnd(t), id + ' created before the last step ends');
  need(t.windowEnd === t.commandEnd && t.buildStart - t.windowEnd === 280, id + ' window does not open at Enter');
}
const bodies = [...html.matchAll(/data-build-target="links"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => (m[1].match(/<a\b/g) || []).length);
[['about', bodies[1]], ['contact', bodies[2]]].forEach(([id, n]) => {
  const s = tl[id].steps.find((x) => x.target === 'links');
  need((s.end - s.start - 330) / 90 + 1 === n, id + ' pop count ' + n + ' vs step ' + (s.end - s.start));
});
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('PASS: about and contact scripts');
EOF` (reads the About and Contact timelines out of the built HTML: AC-8 commands and logs, created at or before 2500 ms, never before the last step ends, the window opening at Enter, and the button steps lasting as long as the rendered buttons).

### Task 8: UPDATE src/sections/projects.build.ts and src/sections/stack.build.ts

- **ACTION**: Both scripts: `const COMMAND` constant plus `timing: openAtEnter(COMMAND)`. **Projects**: `log: buildStrings.fetchingProjects(projects.length)`; keep the heading and one `build-card` step per project (calls and targets unchanged); pitches heading 0, first card 280, every later card 180 (a 300 ms card, so the overlap with the previous card is exactly 120 ms); `createdRel` 1180. Expected: commandEnd 1010, buildStart 1290, cards 280-580, 460-760, 640-940, 820-1120, `createdAt` 2470, never more than two cards at once. **Stack**: `log: buildStrings.resolvingDependencies`; keep the heading and one `stagger` step per group (chips 90 ms apart, as today); pitches heading 0, first group 320, every later group 100; `createdRel` 1270 (the settle is measured from the last group's end, 1150, and `createdAt` must also clear the longest group, `backend`, which ends at 1210). Expected: commandEnd 890, buildStart 1170, `createdAt` 2440. Keep the existing `strings`/`pacedSteps` imports. Delivers AC-A1, AC-A2 and AC-A3.
- **MIRROR**: `# SOURCE: src/sections/hero.build.ts:66-73` and `# SOURCE: src/sections/pacing.ts:10-35`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm lint; pnpm build; node --input-type=module - <<'EOF'
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tl = Object.fromEntries([...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map((m) => { const t = JSON.parse(dec(m[1])); return [t.section, t]; }));
const bad = [];
const need = (ok, msg) => { if (!ok) bad.push(msg); };
const maxEnd = (t) => Math.max(...t.steps.map((s) => s.end));
const p = tl.projects;
const slugs = ['relay', 'ai-track-record', 'praesto-sum', 'site-pro'];
need(JSON.stringify(p.steps.map((s) => s.call)) === JSON.stringify(['projects.heading("Selected work")', ...slugs.map((s) => 'projects.card("' + s + '")')]), 'projects calls');
need(p.log === 'Fetching projects... 4 found', 'projects log ' + p.log);
const cards = p.steps.slice(1);
cards.forEach((c, i) => {
  need(c.end - c.start >= 300 && c.end - c.start <= 350, 'card length ' + (c.end - c.start));
  if (i > 0) need(c.start === cards[i - 1].end - 120, 'card overlap ' + i);
  if (i > 1) need(c.start >= cards[i - 2].end, 'three cards at once at ' + i);
});
const s = tl.stack;
const groups = [['languages', 4], ['frontend', 2], ['backend', 5], ['data', 3], ['cloud', 2], ['ai', 1]];
need(JSON.stringify(s.steps.map((x) => x.call)) === JSON.stringify(['stack.heading("What I work with")', ...groups.map(([g]) => 'stack.group("' + g + '")')]), 'stack calls');
need(s.log === 'Resolving dependencies...', 'stack log ' + s.log);
groups.forEach(([, n], i) => need(s.steps[i + 1].end - s.steps[i + 1].start === 330 + 90 * (n - 1), 'group ' + i + ' length'));
for (const [id, t] of [['projects', p], ['stack', s]]) {
  need(t.createdAt <= 2500, id + ' createdAt ' + t.createdAt);
  need(t.createdAt >= maxEnd(t), id + ' created before the longest step ends');
  need(t.windowEnd === t.commandEnd && t.buildStart - t.windowEnd === 280, id + ' window does not open at Enter');
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('PASS: projects and stack scripts');
EOF` (reads the Projects and Stack timelines out of the built HTML: one card per project in grid order, exactly 120 ms of overlap and never three cards at once, one group per content group with 90 ms chips, the content-derived logs, created at or before 2500 ms and not before the longest step ends).

### Task 9: Run every gate and record the test-pair handoff (no source change)

- **ACTION**: Run Levels 1-3 of `## Validation Commands` against the finished tree. Change nothing except to fix a defect the gates reveal in a file this plan lists. Do not edit, delete or skip any test. If a spec or unit test outside the known-stale list fails ONLY because it pins an old base timing, an old card phase or the old `Reading <file>...` log, add it to the handoff list in the Implementer's report (the test pair updates it on purpose); any other failure is a defect to fix. Confirm that the frozen files are untouched (AC-14) and that runtime + effects stay within 18 KB gzip. Delivers AC-A5, AC-A6 and AC-A7.
- **MIRROR**: `# SOURCE: tests/e2e/support/runtime.ts:96-100` (the probe's timeline reader, already reproduced in Tasks 6-8).
- **VALIDATE**: `set -euo pipefail; git diff --exit-code b4271cb -- src/runtime/scheduler.ts src/runtime/clock.ts src/runtime/triggers.ts src/runtime/focus-rule.ts src/runtime/resize.ts src/runtime/keys.ts src/runtime/controls-timing.ts src/runtime/main.ts src/runtime/api.ts; pnpm build; pnpm check:budgets` (an empty diff on the nine frozen files, and the size check on the fresh build fails above 18 KB runtime, 20 KB critical, 90 KB total JavaScript or 25 KB CSS).

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm check
pnpm lint
pnpm format:check
pnpm check:tokens
```

### Level 2: UNIT_TESTS

The four unit files excluded below pin the OLD base timings, the old card phases or the hero's old step starts; they are updated on purpose by the test pair (see `## Notes`), so they are expected to fail until then. Everything else must pass.

```bash
set -euo pipefail
pnpm exec vitest run \
  --exclude tests/unit/runtime-pacing.test.ts \
  --exclude tests/unit/effect-timing.test.ts \
  --exclude tests/unit/image-resolve-timing.test.ts \
  --exclude tests/unit/hero-photo-command.test.ts
pnpm check:privacy
```

### Level 3: INTEGRATION (built site, compiled-timeline budget probe, budgets, E2E, Lighthouse)

The probe reads every section's compiled timeline out of `dist/index.html` and fails on any budget or content violation: AC-6 (hero headline step ends by 2000 ms and `duration` at most 3200 ms; every other section `createdAt` at most 2500 ms and never before the last step ends), AC-8 (the commands and dock logs from the content), AC-7 (cards overlap exactly 120 ms, never three at once, buttons staggered), and the DOM check that each `pop` step lasts as long as the buttons actually rendered.

```bash
set -euo pipefail
pnpm build
node --input-type=module - <<'EOF'
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tl = Object.fromEntries([...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map((m) => { const t = JSON.parse(dec(m[1])); return [t.section, t]; }));
const bad = [];
const need = (ok, msg) => { if (!ok) bad.push(msg); };
const maxEnd = (t) => Math.max(...t.steps.map((s) => s.end));
const calls = (t) => t.steps.map((s) => s.call);
need(JSON.stringify(Object.keys(tl)) === JSON.stringify(['top', 'about', 'projects', 'stack', 'contact']), 'sections ' + Object.keys(tl));

const h = tl.top;
need(JSON.stringify(calls(h)) === JSON.stringify(['hero.title("Fabio Barreto.")', 'hero.role("Senior Software Engineer")', 'hero.photo("photo-placeholder-body.svg")', 'hero.intro("12+ years shipping…")', 'hero.links(["GitHub", "LinkedIn"])']), 'hero calls ' + calls(h).join(' | '));
need(h.steps[0].end <= 2000, 'hero headline ends ' + h.steps[0].end);
need(h.duration <= 3200, 'hero duration ' + h.duration);
need(h.createdAt >= maxEnd(h), 'hero created before its last step ends');
need(h.log === undefined, 'hero has no dock log');

const want = {
  about: { log: 'Reading about.md...', calls: ['about.heading("About me")', 'about.text("I\'m a full-stack software…")', 'about.links(["GitHub", "LinkedIn"])'] },
  projects: { log: 'Fetching projects... 4 found', calls: ['projects.heading("Selected work")', 'projects.card("relay")', 'projects.card("ai-track-record")', 'projects.card("praesto-sum")', 'projects.card("site-pro")'] },
  stack: { log: 'Resolving dependencies...', calls: ['stack.heading("What I work with")', 'stack.group("languages")', 'stack.group("frontend")', 'stack.group("backend")', 'stack.group("data")', 'stack.group("cloud")', 'stack.group("ai")'] },
  contact: { log: 'Opening channels...', calls: ['contact.heading("Let\'s talk.")', 'contact.links(["GitHub", "LinkedIn"])', 'contact.location("Brazil (UTC-3)")'] },
};
for (const [id, w] of Object.entries(want)) {
  const t = tl[id];
  need(JSON.stringify(calls(t)) === JSON.stringify(w.calls), id + ' calls ' + calls(t).join(' | '));
  need(t.log === w.log, id + ' log ' + t.log);
  need(t.createdAt <= 2500, id + ' createdAt ' + t.createdAt);
  need(t.createdAt >= maxEnd(t), id + ' created before its longest step ends');
  need(t.windowEnd === t.commandEnd && t.buildStart - t.windowEnd === 280, id + ' window does not open at Enter');
}
const cards = tl.projects.steps.slice(1);
cards.forEach((c, i) => {
  need(c.end - c.start >= 300 && c.end - c.start <= 350, 'card length ' + (c.end - c.start));
  if (i > 0) need(c.start === cards[i - 1].end - 120, 'card overlap ' + i);
  if (i > 1) need(c.start >= cards[i - 2].end, 'three cards at once at ' + i);
});
const chips = [4, 2, 5, 3, 2, 1];
chips.forEach((n, i) => need(tl.stack.steps[i + 1].end - tl.stack.steps[i + 1].start === 330 + 90 * (n - 1), 'stack group ' + i + ' length'));
const anchors = [...html.matchAll(/data-build-target="links"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => (m[1].match(/<a\b/g) || []).length);
['top', 'about', 'contact'].forEach((id, i) => {
  const s = tl[id].steps.find((x) => x.target === 'links');
  need((s.end - s.start - 330) / 90 + 1 === anchors[i], id + ' pop count ' + anchors[i] + ' vs step ' + (s.end - s.start));
});
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('PASS: compiled timelines meet the budgets and carry the content-derived commands and logs');
EOF
pnpm check:budgets
git diff --exit-code b4271cb -- src/runtime/scheduler.ts src/runtime/clock.ts src/runtime/triggers.ts src/runtime/focus-rule.ts src/runtime/resize.ts src/runtime/keys.ts src/runtime/controls-timing.ts src/runtime/main.ts src/runtime/api.ts
pnpm exec playwright test $(ls tests/e2e/*.spec.ts | grep -v -e effects-scripts -e runtime-timeline-contract)
pnpm lighthouse
```

`effects-scripts.spec.ts` and `runtime-timeline-contract.spec.ts` pin the old starts, the old strict `commandEnd < windowEnd` and the old placeholder commands, so they are excluded until the test pair updates them. If another E2E spec fails only because it pins an old base timing, an old card phase or the old `Reading <file>...` log, list it in the report for the test pair; any other failure is a defect.

## Acceptance Criteria

- **AC-A1 (PRD AC-6):** On the compiled timelines of the committed content, the hero's headline step ends by 2000 ms and its `duration` is at most 3200 ms (projected: headline ends 1842 ms, created 2650 ms, duration 3150 ms); and each of About, Projects, Stack and Contact has `createdAt` at most 2500 ms and never before its longest step ends (projected 2400, 2470, 2440 and 2432 ms), so the dock shows `✔ <Section> Section created. (<t>s)` with `<t>` at most 2.50.
- **AC-A2 (PRD AC-8):** Every window command argument and dock log comes from the content: `hero.photo("<photo file name>")`, `hero.intro("12+ years shipping…")`, `hero.links(["GitHub", "LinkedIn"])`, `about.text("I'm a full-stack software…")`, `about.links(["GitHub", "LinkedIn"])`, `contact.links(["GitHub", "LinkedIn"])`, `contact.location("Brazil (UTC-3)")`, one `projects.card("<slug>")` per project and one `stack.group("<group>")` per group; the dock logs are `Reading about.md...`, `Fetching projects... 4 found`, `Resolving dependencies...` and `Opening channels...` (the hero's boot logs unchanged); a script built from modified content (another subtitle, a fifth project) follows it, including `5 found`.
- **AC-A3 (PRD AC-7):** Each section's compiled effects are the documented ones: buttons pop one after another 90 ms apart (hero three buttons, About and Contact two), Stack chips pop 90 ms apart per group, Contact types the heading, then the buttons, then the location, and Projects cards run select, skeleton, cover, title, summary and tags inside a 300 ms card with consecutive cards overlapping by exactly 120 ms and never more than two cards building at once.
- **AC-A4 (PRD AC-8):** The hero window types `hero.photo("<photo file name>")` with the source file name (`photo-placeholder-body.svg`), never Astro's hashed output name; the window cuts it to 29 characters with `…`.
- **AC-A5 (PRD AC-14):** `git diff b4271cb` on `src/runtime/scheduler.ts`, `clock.ts`, `triggers.ts`, `focus-rule.ts`, `resize.ts`, `keys.ts`, `controls-timing.ts`, `main.ts` and `api.ts` is empty, and every Stage 3 behavior-rule spec not pinning a base timing still passes.
- **AC-A6 (PRD AC-12):** Runtime and effects stay at or below 18 KB gzip, critical JavaScript at or below 20 KB, total JavaScript at or below 90 KB and CSS at or below 25 KB (`pnpm check:budgets` passes), and Lighthouse on `/` and `/projects/relay` keeps its thresholds.
- **AC-A7 (PRD AC-9 and AC-10):** Layout and instant paths are unchanged: only `opacity` and `clip-path` are written to page elements by the staggered `pop` and the shorter card, every runner's `destroy()` still clears what it touched (skip, run all, focus, resize, `∞`, reduced motion and no JavaScript leave nothing behind), and no overlay piece is added outside the `aria-hidden` build layer.
- **AC-A8 (PRD AC-6 and AC-7):** Sections after the hero open their window at Enter (`windowEnd === commandEnd`, `buildStart === windowEnd + 280`) and the dock keeps its log visible for 100 ms after Enter (`dockLogEnd`), so the `log` is readable while the window opens; a script without a `log` still shows `Reading <file>...`.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Budgets with little slack: Projects lands at 2.47 s, so a fifth project (+180 ms) or a longer heading would exceed 2.5 s | M | M | The Level 3 probe fails early on the committed content; the levers are listed (pitches, `createdRel`, card length); a fifth project is a content change that re-runs the probe, and any overrun goes to the owner instead of relaxing the budget |
| The 300 ms card is the lowest value of the PRD's 300-350 ms and compresses the skeleton to 40 ms and the cover resolve to 80 ms; the first card also starts 234 ms before the heading finishes typing, and a second card starts before it ends | M | M | Recorded in docs/decisions.md as owner-reviewable; the owner reviews the rhythm on the preview (Phase 5); alternatives are 320 ms (Projects would reach about 2.52 s without more heading overlap) or a looser budget, both owner decisions |
| Window opening at Enter hides the dock log after only 100 ms (the log is readable but brief) | M | L | `dockLogEnd` holds the log 100 ms, the documented gap between logs; the owner judges it on the preview; the dock typing pace stays as documented |
| Stack's six groups start 100 ms apart, so up to four groups pop at once while the heading still types | M | L | They are separate elements inside one window (B1 allows overlap inside a section); the owner reviews the rhythm; the probe pins each group's duration and `createdAt` |
| Hero ends at 2.65 s created and 3.15 s done, leaving only 50 ms under the 3.2 s budget | M | M | The probe fails on any `duration` above 3200; pitches 250 and 230 are the levers; the headline still ends at 1842 ms |
| `windowEnd === commandEnd` breaks the strict `commandEnd < windowEnd` assertion in `runtime-timeline-contract.spec.ts` | H | L | The scheduler never reads `windowEnd` (`src/runtime/scheduler.ts:41-49`), so behavior is safe; the spec is listed for the test pair to update deliberately (a lifecycle ledger entry), never loosened silently |
| A pop count that does not match the buttons the page renders (the hero has "See my work" plus one button per profile link; About and Contact use `profile.links.length`) would mistime the stagger | L | M | The probe compares each `pop` step's length with the number of `<a>` children rendered in the built HTML |
| My hand calculation of the Stack baseline (about 2.81 s) differs from the research note (2.62 s) | L | L | Irrelevant to the result: the tuned values are checked by the Level 3 probe on the real compiled timelines, not by either estimate |
| Real photo and covers arrive later and change nothing here (the typed photo name comes from the file; the ASCII and blur data are Phase 1/2) | L | L | Swapping the files is content-only; the probe's expected file name is the committed placeholder's and is updated by the test pair on swap |

## Notes

**TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

**Test-file routing:** this phase's test-file creation and updates are
routed through the `test-writer`/`test-reviewer` pair's lifecycle
ledger (`/relay-write-test` → `/relay-test-write-review`), not authored
by the Implementer — R-X is a blanket straight-fail on any test glob in
the Implementer's diff. No task below and no `## Files to Change` row
targets a test file, so this plan's `**VALIDATE**` commands exercise the
change directly rather than invoking the test framework.

**Pinned base-timing tests the test pair must update ON PURPOSE** (the PRD: base-timing tests are updated to the new intended timings and recorded in the lifecycle ledger; never loosened, skipped or deleted):

| Test | What it pins today | New intended value |
|------|--------------------|--------------------|
| `tests/unit/runtime-pacing.test.ts` (hero, About, Projects, Stack, Contact blocks) | Hero starts 1300/1500/1600/1900/2200, `hero.intro(…)`, `hero.links([…])`, created 2600; About offsets 0/250/850 and 1150; Projects first card 450, spacing 330, created 1990; Stack groups 400 + 150 apart and 1350; Contact offsets 0/450/650 and 1100; all with the default window times | Hero starts 1300/1500/1600/1850/2080, `createdAt` 2650, `duration` 3150, buttons 510 ms; About offsets 0/250/750 with `createdAt - buildStart` 1230, `commandEnd` 890, `buildStart` 1170; Projects first card offset 280, spacing 180, card length 300, 1180; Stack first group 320, spacing 100, 1270; Contact offsets 0/350/580 and 1180; non-hero `windowEnd === commandEnd`, `buildStart === commandEnd + 280`; the AC-8 call strings and `log` values; `pacedSteps` unit tests with `pop` and no `count` stay as they are |
| `tests/unit/effect-timing.test.ts` | "builds a project card in 450 ms"; `cardPhases` breakpoints 150/250/400/420/450 | `CARD_MS` 300; `cardPhases`: skeleton 150-190, cover and title 190-270, summary 210-285, tags 240-300; `pop` with `count` 3 lasts 510 ms (an unset `count` still 330) |
| `tests/unit/image-resolve-timing.test.ts` ("card cover progress") | Cover 0 until 250 ms, 1 at 400 ms, `coverStarted` at 250, last phases 400/420/450 | Cover 0 until 190 ms, 1 at 270 ms, `coverStarted` at 190, title 1 at 270, summary 1 at 285, tags 1 at 300 |
| `tests/unit/hero-photo-command.test.ts` ("keeps every hero step start and the created mark as before") | Starts 1300/1500/1600/1900/2200, photo end 2600, `createdAt` 2600 | Starts 1300/1500/1600/1850/2080, photo end 2600, `createdAt` 2650 (`commandEnd` 730 and `buildStart` 1300 stay) |
| `tests/e2e/effects-scripts.spec.ts` | The hero and section offsets and created times above, `hero.intro(…)`/`about.text(…)`/`*.links([…])`/`contact.location(…)` placeholders, first card offset 450 | The same new values and the AC-8 commands; the hero photo name `photo-placeholder-body.svg` |
| `tests/e2e/runtime-timeline-contract.spec.ts` | Strict `commandEnd < windowEnd < buildStart` for every timeline | `commandEnd <= windowEnd < buildStart` (non-hero sections open the window at Enter); card overlap 120 ms stays |
| `tests/e2e/support/runtime.ts` | `TimelineJson` without `log` | Add `log?: string` to the type |

Unit tests to ADD (the test pair authors them from the ACs): the `excerpt` and `labelList` helpers, `openAtEnter`, `dockLogEnd`, the compiler carrying `log`, the AC-8 command lists and the five `createdAt` budgets on the real content (AC-6), the pop stagger (`pop` duration by `count`), and E2E coverage of the dock log texts and each section's effect order. Other specs that read the dock log text or card timing (for example the build-layer show and effects specs) may also need a deliberate update; the Implementer reports any it finds failing for that reason.

**Projected timings at 1x from trigger to the created line (hand-computed from the compiler, verified by the Level 3 probe):**

| Section | Baseline | Tuned | Notes |
|---------|----------|-------|-------|
| Hero (from load) | created 2.60 s, done 3.10 s | created 2.65 s, done 3.15 s; headline readable 1.84 s | Staggered buttons (510 ms) added; later pitches 250 and 230 |
| About | 2.51 s | 2.40 s | Window at Enter saves 100 ms; buttons 2 x pop staggered |
| Projects | 3.38 s | 2.47 s | 300 ms cards, 120 ms overlap, first card at 280 ms |
| Stack | 2.81 s by hand (the research note says 2.62 s) | 2.44 s | Group pitch 100 ms, first group at 320 ms |
| Contact | 2.60 s | 2.43 s | Buttons staggered, location after them |

**Owner decision candidates (flagged, not blocking):** (1) a 300 ms card with a compressed skeleton and cover resolve, and the first card starting while the heading is still typing, are what makes Projects fit 2.5 s; the alternatives are a 320-350 ms card with a longer budget for Projects or a third simultaneous card, both rejected in the PRD; (2) the dock log is visible for only 100 ms because the window now opens at Enter; (3) Stack groups overlapping at 100 ms pitch; (4) the hero's 50 ms of slack under 3.2 s. All four are rhythm questions for the owner's review on the preview (Phase 5).

**Reading list for the Implementer:** the `scheduler.ts` `stateAt` function is the reason the window can open at Enter without a scheduler change; `src/images/pipeline.ts` `sourcePathFor` is imported only by `Hero.astro`, never by `hero.build.ts`, because it pulls in `astro:assets` and the unit tests import `hero.build.ts` directly.

*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Implemented: 2026-11-10*
*Status: IMPLEMENTED*
