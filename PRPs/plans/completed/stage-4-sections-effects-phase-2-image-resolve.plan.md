# Feature: image-resolve (Phase 2 of stage-4-sections-effects)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (the `image-resolve` effect and its dissolve technique inside the Stage 3 runtime); cross-cutting patterns (one aria-hidden overlay build layer, effects driven by the runtime clock, the data-build contract, size budgets); creation or change of components (two new overlay factories for the ASCII and blurred-cover pieces); impact on shared UI (the hero photo and the project cards while they build); business rules for build (B4, B21, B24, B26, B29, B30) and visual-design (V5, V6)
- Decisions found:
  - D12 Hero photo: ASCII -> real photo (the photo's build effect starts from an ASCII version generated at build time and dissolves into the real photo)
  - D2 Astro + React + TypeScript strict; the animation runtime is plain TypeScript outside React and writes to the DOM directly
  - D8 Multi-cursor agents in v1.1 (v1 builds one element at a time; cards keep a short overlap)
  - D17 Build windows concept
  - Build layer clips horizontal overflow (2026-11-08): overlay roots use `overflow-x: clip`
  - Stage 3 approved (2026-11-09): the runtime is the base for Stage 4; the final layout never moves
  - Stage 4 PRD approved (2026-11-10): `image-resolve` for the hero (select -> skeleton -> ASCII in the overlay vanishing in a 4x4 Bayer order over 700 ms while the photo rises from a low, non-zero opacity) and for covers (the inlined blurred version fades out in the overlay as the real cover appears); no animated `mask-image` or `filter`; `src/runtime/` boundary: scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts and api.ts stay frozen; the effects files may change
  - Privacy list: only personal projects, no private data in fixtures or commits
- Applicable anti-patterns:
  - Layout-shifting build animations (only `transform`, `opacity` and `clip-path` animate; overlays only)
  - Hiding pending content with `display` or `visibility`
  - Generic fade-up reveals (the photo and covers use `image-resolve`, not a fade)
  - Re-rendering React per typed character (the effect is plain TypeScript DOM writes)
  - Many timers instead of one loop (the effect is driven by the runtime tick, no timers)
  - Mixing the two registers (the ASCII and blurred pieces live only in the overlay)
  - Raw values instead of tokens (CSS for the new pieces uses tokens only)
  - Weakening tests to get a green run (pinned tests are updated by the test pair, never loosened)
  - Scope creep into v1
- Applicable architectural rules:
  - The build layer is one overlay, aria-hidden, animating only `transform`, `opacity` and `clip-path` on page elements
  - Pending content stays laid out and in the accessibility tree; the ASCII and blurred data are build-layer data, never page text
  - Effects are driven by the runtime clock (`createEffects().onTick`); one requestAnimationFrame loop
  - Runtime + effects <= 18 KB gzip (about 12.1 KB today), critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB
  - Instant paths (skip, run all, focus, resize, infinity, reduced motion, no JS) leave nothing behind
  - docs/ is the source of truth; relay artifacts live in PRPs/, nothing under the tool config directory
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-4-sections-effects.prd.md` — Implementation Phases row 2: "image-resolve" — Goal: The hero photo emerges from its ASCII version and covers sharpen from blur, inside the existing runtime. — Success signal: AC-1, AC-3, AC-10 and AC-11 pass; the size check stays within 18 KB; the hero still completes <= 3.2 s.

## Summary

Phase 2 adds the last missing effect, `image-resolve`, to the Stage 3 effects registry. For the hero it is a 1,000 ms step (select 150, skeleton 150, dissolve 700): the ASCII rendering that Phase 1 serialized on the photo target (`data-build-ascii`) is drawn in an aria-hidden overlay piece sized to the photo's box, and its characters vanish in a 4x4 Bayer order (16 discrete steps over 700 ms) while the real `<img>` inline opacity rises from a small non-zero value to 1. For covers, the `build-card` runner's boolean cover phase becomes a progress value, and when the card cell carries `data-build-blur` (Phase 1) an overlay piece shows the inlined blurred cover over the cover's box and fades out as the real cover image fades in; cards with no cover keep the dot-grid placeholder and get no blur phase. The pure timing (dither order, step, opacity ramp, cover progress) goes in `effect-timing.ts` so it stays DOM-free and testable, two small overlay factories mirror the existing Skeleton factory, and the hero script's photo step switches from `skeleton` to `image-resolve` with the final command `hero.photo("<photo file name>")`. Instant finishes need no new hook: skip, run all, focus, resize and infinity already end in `finishSection`, which destroys every mounted runner, so each new runner restores the page elements it touched in `destroy()`.

## User Story

As a visitor watching the site build itself
I want the hero photo to emerge from its ASCII version and project covers to sharpen from blur
So that the build has its signature moments and the layout, accessibility and instant paths stay exactly as promised

## Problem Statement

After Stage 3 and Phase 1, the hero photo step is a plain `skeleton` effect and the `build-card` runner never touches `.sp-card-cover`, so the ASCII and blurred data that Phase 1 generates are never shown. `image-resolve` is not in the effects registry (`EFFECTS` in `src/runtime/types.ts`), and the card's cover phase is a boolean (`cover: localMs >= 250`). Without this phase, D12 is unmet and the approved docs/04 effects catalog is incomplete.

## Solution Statement

Add `image-resolve` to `EFFECTS`, `EFFECT_DURATION_MS` (1,000 ms for the hero) and `RUNNERS`; implement the hero variant (select, skeleton, ASCII overlay, Bayer dissolve, image opacity ramp) and the cover variant (blurred overlay piece, cover opacity crossfade) inside the existing runtime without touching the frozen files. Two new overlay factories (`AsciiOverlay`, `BlurCover`) and their token-only CSS live in the build layer; all timing math is pure and lives in `effect-timing.ts`. Only `opacity` and `clip-path` change on page elements; the overlay pieces are removed in `destroy()`, and the touched `<img>` elements are cleared.

## Metadata

| Key | Value |
|-----|-------|
| Type | ENHANCEMENT (new effect in the runtime registry) |
| Complexity | MEDIUM |
| Systems Affected | `src/runtime/` (types.ts, effect-timing.ts, effects.ts), `src/components/build/` (two new factories), `src/styles/build-layer.css`, `src/sections/hero.build.ts` |
| Dependencies | Phase 1 (complete): `data-build-ascii` on the photo target (src/sections/Hero.astro:43-49) and `data-build-blur` on the card cell (src/sections/Projects.astro:50-54); no new package, nothing added to the browser beyond the effect itself |
| Estimated Tasks | 6 |
| Source PRD line ref | `PRPs/prds/stage-4-sections-effects.prd.md` Implementation Phases row 2; Phase Details "Phase 2: image-resolve" |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-4-sections-effects.prd.md` | 70-80, 197-200, 154-161 | AC-1, AC-3, AC-10, AC-11 and the Phase 2 scope; the `src/runtime/` boundary; the dissolve and cover technique |
| P0 | `src/runtime/effects.ts` | 42-52, 116-145, 328-389, 431-516 | `Ctx`/`Mounted` contract, the `skeleton` runner (hero anchor), the `build-card` runner (cover anchor), `finishStep` and `finishSection` (instant paths) |
| P0 | `src/runtime/effect-timing.ts` | 6-51, 62-71, 171-187 | Constants, `EFFECT_DURATION_MS`, the seeded RNG and `cardPhases` (where `cover` becomes a progress value) |
| P0 | `src/runtime/effect-dom.ts` | 1-4, 153-198 | The only allowed page-element writes (`setStyle`, `live`, `hide`, `clear`) and `labelFor` |
| P0 | `src/runtime/types.ts` | 1-12, 26-34 | `EFFECTS` and `BuildStep` |
| P0 | `src/components/build/Skeleton.ts` | 10-50 | The overlay-factory shape to mirror |
| P0 | `src/styles/build-layer.css` | 343-465 | Overlay classes, tokens and the `.sp-build-fx` root (`overflow-x: clip`) |
| P0 | `src/sections/hero.build.ts` | 8-56 | The photo step to switch, the pacing and the timing overrides |
| P1 | `src/sections/pacing.ts` | 10-35 | How a longer photo step turns into overlap and settle |
| P1 | `src/runtime/compiler.ts` | 28-41, 43-92 | Effect validation and how step ends, `createdAt` and `duration` derive |
| P1 | `src/sections/Hero.astro` | 22-26, 43-49 | Where `data-build-ascii` sits and what the photo target contains |
| P1 | `src/sections/Projects.astro` | 20-29, 48-66 | Where `data-build-blur` sits |
| P1 | `src/components/page/ProjectCard.tsx` | 34-66 | `.sp-card-cover` markup (`<picture>`/`<img>` or the placeholder) |
| P1 | `src/images/ascii.ts` | 3-7 | Grid constants (48 columns, ramp, `CELL_ASPECT`) the overlay sizing must agree with (read only; never import this file into the runtime, it imports `sharp`) |
| P1 | `docs/04-animations.md` | 128, 131 | The documented `image-resolve` and `build-card` mechanics |
| P1 | `docs/domain/areas/build.md` | 29, 37, 38 | B21, B29 and B30 |

## Patterns to Mirror

# SOURCE: src/runtime/effects.ts:42-52
```ts
interface Mounted {
  render(localMs: number): void;
  destroy(): void;
}

interface Ctx {
  targets: HTMLElement[];
  seed: number;
  duration: number;
  fx: HTMLElement;
}
```
Task 4 copies this runner contract: the new `image-resolve` runner is a `(ctx: Ctx) => Mounted`.

# SOURCE: src/runtime/effects.ts:125-145
```ts
  skeleton(ctx) {
    const sel = selection(ctx);
    const skel = createSkeleton(ctx.targets.map(docRect));
    skel.setOpacity(0);
    ctx.fx.append(skel.el);
    let shown = false;
    return {
      render(l) {
        sel.update(l, ctx.duration - FADE_MS, ctx.duration);
        skel.setOpacity(l < SELECT_MS ? 0 : 1 - ramp(l, 350, 450));
        if (l >= 350 && !shown) {
          shown = true;
          for (const t of ctx.targets) live(t);
        }
      },
      destroy() {
        sel.destroy();
        skel.el.remove();
      },
    };
  },
```
Task 4 copies this for the hero variant: selection, then skeleton, then the reveal; the new runner keeps the skeleton until 300 ms, shows the ASCII piece from 300 ms, and clears the photo `<img>` in `destroy()`.

# SOURCE: src/runtime/effects.ts:328-389
```ts
  'build-card'(ctx) {
    const sel = selection(ctx);
    const skel = createSkeleton(ctx.targets.map(docRect));
    skel.setOpacity(0);
    const text = createTextOverlay();
    ctx.fx.append(skel.el, text.el);
    const cells = ctx.targets.map((cell) => {
      const q = (s: string) => [...cell.querySelectorAll<HTMLElement>(s)];
      const titles = q('.sp-card-title, .sp-card-year').map(measure);
      const summary = q('.sp-card-summary').map(measure);
      const tags = [...q('.sp-card-tags > *'), ...q('.sp-card-foot')].map(
        (el) => ({ el, radius: radiusOf(el) }),
      );
      return { cell, titles, summary, tags };
    });
    let covered = false;
    return {
      render(l) {
        const phase = cardPhases(l);
        sel.update(l, 300, 450);
        skel.setOpacity(phase.skeleton ? 1 : 0);
        if (!phase.cover) return;
        if (!covered) {
          covered = true;
          for (const c of cells) {
            for (const m of [...c.titles, ...c.summary]) {
              setStyle(m.el, 'clip-path', HIDDEN_CLIP);
            }
            for (const part of c.tags) poof(part.el, 0, part.radius);
            live(c.cell);
          }
        }
        ...
      },
      destroy() {
        sel.destroy();
        skel.el.remove();
        text.el.remove();
        for (const c of cells) {
          for (const m of [...c.titles, ...c.summary]) clear(m.el);
          for (const part of c.tags) clear(part.el);
        }
      },
    };
  },
```
Task 4 copies this structure: per-cell lookups in the `cells` map (add the `.sp-card-cover` element, its `<img>` and the cell's `data-build-blur`), the one-time `covered` initialization before `live(c.cell)`, and the `destroy()` cleanup list.

# SOURCE: src/runtime/effect-timing.ts:32-51
```ts
export const EFFECT_DURATION_MS: Record<
  EffectName,
  (step: BuildStep) => number | string
> = {
  select: () => SELECT_MS,
  skeleton: () => SELECT_MS + SKELETON_MS,
  ...
  'build-card': () => CARD_MS,
};
```
Task 4 adds the `image-resolve` entry here (`SELECT_MS + SKELETON_MS + DISSOLVE_MS` = 1,000).

# SOURCE: src/runtime/effect-timing.ts:171-187
```ts
export function cardPhases(localMs: number): {
  select: number;
  skeleton: boolean;
  cover: boolean;
  title: number;
  summary: number;
  tags: number;
} {
  return {
    select: ramp(localMs, 0, 150),
    skeleton: localMs >= 150 && localMs < 250,
    cover: localMs >= 250,
    title: ramp(localMs, 250, 400),
    summary: ramp(localMs, 300, 420),
    tags: ramp(localMs, 360, 450),
  };
}
```
Task 1 copies this pure-function shape for the new helpers and changes `cover` into a progress value plus a separate started flag.

# SOURCE: src/components/build/Skeleton.ts:10-50
```ts
export interface Skeleton {
  el: HTMLDivElement;
  setOpacity(value: number): void;
  setVisibleBlocks(from: number): void;
}

export function createSkeleton(rects: Rect[]): Skeleton {
  const el = h('div', 'sp-skel', { 'aria-hidden': 'true' });
  ...
  let lastOpacity = -1;
  ...
  return {
    el,
    setOpacity(value) {
      if (value === lastOpacity) return;
      lastOpacity = value;
      el.style.opacity = String(value);
    },
```
Task 2 copies this factory shape (`h(...)` with `aria-hidden`, last-value caches that skip redundant writes, `translate3d` placement) for `AsciiOverlay` and `BlurCover`.

# SOURCE: src/styles/build-layer.css:404-418
```css
.sp-skel {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.sp-skel-block {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  background: var(--build-skeleton);
  border-radius: var(--radius-sm);
}
```
Task 3 copies this for `.sp-ascii` and `.sp-blur-cover` (absolute, origin at top-left, `pointer-events: none`, token-only values).

# SOURCE: src/runtime/effect-dom.ts:166-198
```ts
export function setStyle(
  el: HTMLElement,
  prop: 'clip-path' | 'opacity',
  value: string,
): void {
  ...
}

export function clear(el: HTMLElement): void {
  el.removeAttribute('data-build-fx');
  written.delete(el);
  el.style.removeProperty('clip-path');
  el.style.removeProperty('opacity');
  el.style.removeProperty('pointer-events');
  if (el.getAttribute('style') === '') el.removeAttribute('style');
}
```
Task 4 writes the photo and cover `<img>` opacity only through `setStyle(img, 'opacity', ...)` and restores them with `clear(img)` in `destroy()` (`finishStep` clears only `step.targets`, not their inner images).

# SOURCE: src/sections/hero.build.ts:28-31
```ts
      {
        step: { call: 'hero.photo(…)', target: 'photo', effect: 'skeleton' },
        pitch: 100,
      },
```
Task 5 edits exactly this step (effect `image-resolve`, final command, same pitch).

# SOURCE: src/sections/Hero.astro:43-49
```astro
    <div
      class="sp-hero-photo"
      data-build-target="photo"
      data-build-ascii={ascii}
    >
      <Photo image={photo} alt={profile.name} priority />
    </div>
```
Read by Task 4: the runner reads `data-build-ascii` from the photo target and finds the real image with `querySelector('img')`.

# SOURCE: src/sections/Projects.astro:50-54
```astro
        <div
          class="sp-projects-cell"
          data-build-target={`card-${id}`}
          data-build-blur={covers[i]?.blur}
        >
```
Read by Task 4: the card runner reads `data-build-blur` (a data URI) from the cell; the attribute is absent for a project without a cover.

# SOURCE: src/images/ascii.ts:3-7
```ts
export const ASCII_COLUMNS = 48;
// Index 0 is the lightest cell (a space), the last character the densest.
export const ASCII_RAMP = ' .:-=+*#%@';
// A character cell is taller than it is wide; this keeps the proportions.
export const CELL_ASPECT = 0.6;
```
Task 1 mirrors these facts as local constants in `effect-timing.ts` (the runtime must not import `src/images/ascii.ts`, which imports `sharp`): the overlay derives its font size from the photo box width, the column count of the string, and a 0.6 em monospace advance.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/runtime/effect-timing.ts` | UPDATE | Dissolve constants, the 4x4 Bayer matrix, pure `dissolveStep`, `ditherAscii`, `photoOpacity`, `asciiGeometry`; `cardPhases` cover becomes a progress value plus a started flag; the `image-resolve` duration entry |
| `src/runtime/types.ts` | UPDATE | Add `'image-resolve'` to `EFFECTS` |
| `src/runtime/effects.ts` | UPDATE | `image-resolve` runner (hero variant) and the cover phase inside the `build-card` runner |
| `src/components/build/AsciiOverlay.ts` | CREATE | Overlay factory for the ASCII piece (a `<pre>` in the aria-hidden effects layer) |
| `src/components/build/BlurCover.ts` | CREATE | Overlay factory for the blurred-cover piece |
| `src/styles/build-layer.css` | UPDATE | `.sp-ascii` and `.sp-blur-cover` classes, tokens only, no animation |
| `src/sections/hero.build.ts` | UPDATE | Photo step uses `image-resolve` and the final command `hero.photo("<photo file name>")` |

## NOT Building (Scope Limits)

- The five final section scripts, the cards' 300-350 ms duration and 120 ms overlap, the optional `log` field and the per-section dock logs, and every other command change: Phase 3 (the card keeps `CARD_MS` = 450 in this phase).
- The project page text: Phase 4. The E2E suite, the axe and layout matrix, the fixture cover wiring, Lighthouse CI with an LCP assertion, the AC-to-spec mapping and the swap procedure: Phase 5.
- Any change to scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts or api.ts (AC-14); any change to layer.ts or layer-timing.ts (not needed).
- Authoring or editing tests: the test pair updates the pinned tests after implementation (see Notes).
- `mask-image`, canvas, per-cell `clip-path` or any animated `filter` for the dissolve or the blur; the "unstyled -> styled" effect; the Coffee easter egg; the window-dot close.
- New cover placeholder art; real photo or cover files; changes to the Phase 1 pipeline or its derivatives.
- Any change to the Stage 2 layout, section ids, labels, headings or the page register.

## Step-by-Step Tasks

### Task 1: UPDATE src/runtime/effect-timing.ts (pure dissolve and cover timing)

- **ACTION**: Delivers AC-A1, AC-A3 and AC-A6. Add, DOM-free, next to the existing constants: `DISSOLVE_MS = 700`; `DISSOLVE_STEPS = 16`; `PHOTO_START_OPACITY` (a single tunable constant, start at `0.12`, commented as the LCP-driven non-zero start from the PRD); `ASCII_ADVANCE = 0.6` (monospace advance in em, mirroring `CELL_ASPECT` in `src/images/ascii.ts`; do not import that file). Add `BAYER_4X4` as `[[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]` (checked against a second source; this is the standard 0-15 dispersed-dot map). Add exported pure functions: `dissolveProgress(localMs)` = `ramp(localMs, SELECT_MS + SKELETON_MS, SELECT_MS + SKELETON_MS + DISSOLVE_MS)`; `dissolveStep(localMs)` = `Math.floor(DISSOLVE_STEPS * dissolveProgress(localMs))` (0 to 16, 16 only once the dissolve ends); `photoOpacity(localMs)` = `PHOTO_START_OPACITY + (1 - PHOTO_START_OPACITY) * dissolveProgress(localMs)`, rounded to two decimals like `poof`; `ditherAscii(ascii, step)` returning the string with every non-newline character at column x, row y replaced by a space when `BAYER_4X4[y % 4][x % 4] < step` (step 0 returns the input, step 16 returns only spaces and newlines, newlines preserved, deterministic); `asciiGeometry(ascii, box)` returning `{ cols, rows, fontSize, lineHeight }` with `cols` the longest row length, `rows` the row count, `fontSize = box.width / (cols * ASCII_ADVANCE)` and `lineHeight = box.height / rows` (guard empty input with zeros). Change `cardPhases`: replace the boolean `cover` with `cover: ramp(localMs, 250, 400)` (progress) and add `coverStarted: localMs >= 250` (the gate the runner used to read from `cover`); leave `select`, `skeleton`, `title`, `summary` and `tags` untouched. Do not add the `image-resolve` entry to `EFFECT_DURATION_MS` here (Task 4 adds it together with the `EFFECTS` entry so the `Record<EffectName, ...>` types stay consistent). Do not write the words `mask-image` or `filter:` anywhere, comments included.
- **MIRROR**: `# SOURCE: src/runtime/effect-timing.ts:171-187` (pure phase functions) and `# SOURCE: src/images/ascii.ts:3-7` (grid constants).
- **VALIDATE**: `pnpm check` (TypeScript strict must still compile; `cardPhases` consumers still type-check because `cover` stays a number-compatible truthy gate until Task 4 switches to `coverStarted`)

### Task 2: CREATE src/components/build/AsciiOverlay.ts and src/components/build/BlurCover.ts

- **ACTION**: Delivers AC-A2, AC-A3 and AC-A5. `AsciiOverlay.ts`: `createAsciiOverlay()` returns `{ el, setPlacement(rect, geometry), setText(text), setOpacity(value) }` where `el = h('pre', 'sp-ascii', { 'aria-hidden': 'true' })`; `setPlacement` writes `translate3d(x, y, 0)` as a transform and the box `width` and `height` once, plus the inline `fontSize` and `lineHeight` in px from the `asciiGeometry` result; `setText` writes `el.textContent` only when the string changed (cache the last value, so the 16-step dissolve costs about 17 writes); `setOpacity` caches like Skeleton. `BlurCover.ts`: `createBlurCover(src: string)` returns `{ el, setPlacement(rect), setOpacity(value) }` where `el` is `h('div', 'sp-blur-cover', { 'aria-hidden': 'true' })` containing one `<img>` (`alt=""`, `src` set to the data URI passed in, `aria-hidden="true"`, `decoding="async"`); placement writes `translate3d`, `width` and `height` from the cover's box. Both pieces are appended by the runner to the existing aria-hidden `.sp-build-fx` layer only, never to `<main>`. Import `h` from `./dom` and use no other module.
- **MIRROR**: `# SOURCE: src/components/build/Skeleton.ts:10-50` (factory shape, `aria-hidden`, last-value caches, `translate3d` placement).
- **VALIDATE**: `pnpm check && pnpm exec eslint src/components/build/AsciiOverlay.ts src/components/build/BlurCover.ts`

### Task 3: UPDATE src/styles/build-layer.css (overlay classes)

- **ACTION**: Delivers AC-A2 and AC-A5. After the `.sp-scramble` rule, in the "Element effects" block, add `.sp-ascii` (`position: absolute; top: 0; left: 0; margin: 0; padding: 0; overflow: clip; white-space: pre; pointer-events: none; font-family: var(--font-mono); color: var(--accent-fg);`; font size and line height come inline from the geometry, so the rule sets neither) and `.sp-blur-cover` (`position: absolute; top: 0; left: 0; overflow: clip; pointer-events: none;` with `border-radius: inherit` not used, because the piece is a sibling in the overlay; give it `border-radius: var(--radius-sm)` only if the cover frame in `ProjectCard.css` uses the same radius, otherwise leave it square) and `.sp-blur-cover > img` (`display: block; width: 100%; height: 100%; object-fit: cover;`). No `animation`, `transition`, `mask-image` or `filter` rule, no raw hex, pixel spacing or shadows: tokens only. The blur comes from the tiny image being upscaled, not from CSS.
- **MIRROR**: `# SOURCE: src/styles/build-layer.css:404-418` (overlay piece rules and token use).
- **VALIDATE**: `pnpm check:tokens && pnpm exec prettier --check src/styles/build-layer.css`

### Task 4: UPDATE src/runtime/types.ts, src/runtime/effect-timing.ts and src/runtime/effects.ts (the effect and its runners)

- **ACTION**: Delivers AC-A1, AC-A2, AC-A3, AC-A4 and AC-A5. (a) `types.ts`: append `'image-resolve'` to `EFFECTS`. (b) `effect-timing.ts`: add `'image-resolve': () => SELECT_MS + SKELETON_MS + DISSOLVE_MS` to `EFFECT_DURATION_MS` (1,000 ms). (c) `effects.ts`, new `'image-resolve'` runner for the hero: build `selection(ctx)` and a skeleton over `ctx.targets` exactly as the `skeleton` runner does but keep the skeleton visible until `SELECT_MS + SKELETON_MS` (300 ms) and then hide it; create the ASCII piece from `ctx.targets[0].getAttribute('data-build-ascii')` (when the attribute is missing or empty, skip the ASCII piece and still ramp the image: content never waits); measure the photo box once at mount with `docRect`, compute `asciiGeometry`, append the piece to `ctx.fx`. At the first render with `l >= 300`: set the real image (`target.querySelector('img')`) inline opacity with `setStyle(img, 'opacity', String(photoOpacity(l)))` BEFORE calling `live(target)` (so the wrapper is released with the photo already at its non-zero start), then show the ASCII at full opacity. On every render from 300 ms: write `ditherAscii(ascii, dissolveStep(l))` to the piece (it caches unchanged strings) and `setStyle(img, 'opacity', ...photoOpacity(l))`; the selection fades out as in the `skeleton` runner. `destroy()` removes the selection, skeleton and ASCII piece and calls `clear(img)` (and `live`/`clear` on the target is already done by `finishStep`). (d) `build-card` runner: add to each `cells` entry the cover frame (`cell.querySelector('.sp-card-cover')`), its real `img` (`cell.querySelector('.sp-card-cover img')`) and the blur data (`cell.getAttribute('data-build-blur')`); replace the `if (!phase.cover) return;` gate with `if (!phase.coverStarted) return;`; in the one-time `covered` initialization, for each cell that has both a blur data URI and a real `img`, create a `BlurCover` piece, place it with `docRect(coverFrame)`, append it to `ctx.fx`, and set the real image's inline opacity to `0` with `setStyle` BEFORE `live(c.cell)`; on every render set the blurred piece opacity to `1 - phase.cover` and the real image opacity to `phase.cover` (rounded to two decimals). A cell without a blur URI (no cover, or the CSS placeholder) gets no piece and no opacity write: no blur phase. `destroy()` removes every blurred piece and calls `clear(img)` for each real cover image, in addition to the existing cleanup. Do not read or write anything in the frozen files; do not add timers or listeners (the existing tick drives everything); the only page-element writes are `setStyle(..., 'opacity' | 'clip-path', ...)`, `live`, `hide` and `clear`. Do not write the words `mask-image` or `filter:` anywhere.
- **MIRROR**: `# SOURCE: src/runtime/effects.ts:125-145` (hero runner), `# SOURCE: src/runtime/effects.ts:328-389` (card runner), `# SOURCE: src/runtime/effects.ts:42-52` (contract), `# SOURCE: src/runtime/effect-dom.ts:166-198` (allowed writes and cleanup).
- **VALIDATE**: `pnpm check && pnpm lint`

### Task 5: UPDATE src/sections/hero.build.ts (the hero script uses the effect)

- **ACTION**: Delivers AC-A1 and AC-A6. Change the photo step to `effect: 'image-resolve'` with `call` equal to `hero.photo("<photo file name>")`, where the file name is the basename of the photo's source file taken from the `profile.photo` image metadata (check the Astro `ImageMetadata` type in the installed Astro for the property that holds the original path, for example `fsPath`, and take its basename; fall back to the basename of `src` only if that property does not exist; if the value is not a string at all, as in a unit-test stub, fall back to `…` so `heroBuild` never throws). Do not escape or cut the name: `truncateCall` already cuts the window command to 29 characters with `…`, and the compiler rejects `<` or `>` in a call (file names never contain them). Keep `pitch: 100` and every other step, the `1300` created offset and the `timing` override unchanged: because later steps are placed by start offsets, the longer photo step only changes the overlap with the intro, the photo ends at the hero's created mark (1,300 ms after build start) and the hero's total time and the 2.0 s headline mark do not move. Confirm that by reading the compiled timeline: `createdAt` must not change from its pre-edit value.
- **MIRROR**: `# SOURCE: src/sections/hero.build.ts:28-31` and `# SOURCE: src/sections/Hero.astro:43-49`.
- **VALIDATE**: `pnpm check && pnpm build && grep -q 'image-resolve' dist/index.html && grep -q 'data-build-ascii' dist/index.html`

### Task 6: VERIFY size, frozen files, privacy and LCP (no file edits)

- **ACTION**: Delivers AC-A6 and AC-A7. Run the full static and size gates and the scheduler diff; measure the photo's LCP with Lighthouse on `/` (the PRD's open question: whether Chromium counts the hero photo while it is revealed under the ASCII at partial opacity); if Performance or LCP falls short of the budgets, record the numbers in the hand-off and do not relax any threshold or change `PHOTO_START_OPACITY` silently. If any gate fails, fix the code in the file that caused it (never loosen a check, never touch a frozen file) and re-run.
- **MIRROR**: none (verification only; the Level 1 to 3 commands below are the contract).
- **VALIDATE**: `set -euo pipefail; pnpm build; pnpm check:budgets; pnpm check:privacy; git diff --quiet b4271cb -- src/runtime/scheduler.ts src/runtime/clock.ts src/runtime/triggers.ts src/runtime/focus-rule.ts src/runtime/resize.ts src/runtime/keys.ts src/runtime/controls-timing.ts src/runtime/main.ts src/runtime/api.ts`

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm check
pnpm lint
pnpm format:check
pnpm check:tokens
```

### Level 2: CONTENT_INVARIANTS

Existing unit tests that pin the old boolean `cardPhases(...).cover` are updated by the test pair after implementation (see Notes), so `pnpm test` is not part of this level; the commands below exercise the change directly.

```bash
set -euo pipefail
# the frozen scheduler and controls files are unchanged against the Stage 3 baseline (AC-14)
git diff --quiet b4271cb -- src/runtime/scheduler.ts src/runtime/clock.ts src/runtime/triggers.ts src/runtime/focus-rule.ts src/runtime/resize.ts src/runtime/keys.ts src/runtime/controls-timing.ts src/runtime/main.ts src/runtime/api.ts
# no animated mask or filter and no new transition or animation rule in the changed effect files (diff-scoped)
if git diff -U0 HEAD -- src/runtime src/components/build src/styles/build-layer.css | grep -E '^\+[^+]' | grep -E 'mask-image|filter:|transition:|animation:'; then
  echo "FAIL: forbidden animated property introduced in the effect files"; exit 1
else
  echo "PASS: no mask, filter, transition or animation introduced"
fi
# the two new untracked factories carry none either
if grep -nE 'mask-image|filter:|transition:|animation:' src/components/build/AsciiOverlay.ts src/components/build/BlurCover.ts; then
  echo "FAIL: forbidden animated property in a new overlay factory"; exit 1
else
  echo "PASS: new factories clean"
fi
# the runtime never imports the sharp-based generator
if grep -nE "images/(ascii|blur|pipeline)" src/runtime/effects.ts src/runtime/effect-timing.ts src/components/build/AsciiOverlay.ts src/components/build/BlurCover.ts; then
  echo "FAIL: runtime imports a build-time image module"; exit 1
else
  echo "PASS: runtime stays free of build-time image modules"
fi
```

### Level 3: INTEGRATION

```bash
set -euo pipefail
pnpm build
# the effect reached the built page and the bundle
grep -q 'image-resolve' dist/index.html
grep -q 'data-build-ascii' dist/index.html
if grep -rq 'image-resolve' dist --include='*.js'; then echo "PASS: effect present in the bundle"; else echo "FAIL: image-resolve missing from the JS bundle"; exit 1; fi
pnpm check:budgets
pnpm check:privacy
pnpm lighthouse
```

## Acceptance Criteria

- **AC-A1 (PRD AC-1):** On `/`, the `hero.tsx` window types `hero.photo("<photo file name>")` (cut to 29 characters with `…`); the photo's selection box and skeleton appear over its box; then the ASCII fills that box in the build overlay and its characters vanish in an ordered 4x4 dither pattern over 700 ms of clock time while the real `<img>` goes from a non-zero opacity (from the moment the ASCII appears) to 1; at the end of the step no ASCII remains, the `<img>` has opacity 1 and no clip-path, and its box equals the no-JS box (+/-0.5 px).
- **AC-A2 (PRD AC-1, AC-9):** The ASCII lives only in the `aria-hidden` overlay (it is read from a data attribute and never written into `<main>`), and the only page-element writes the effect makes are `opacity` and `clip-path` (plus the `data-build-fx` attribute); no `mask-image` or animated `filter` is used.
- **AC-A3 (PRD AC-3):** When a card cell carries a blurred cover (`data-build-blur`), the blurred version shows over the cover's box in the overlay and gives way to the sharp cover within the card's step, with no animated `filter`; at the end of the step no overlay piece remains and the cover's box equals the no-JS box. A card without a cover shows the dot-grid placeholder with no blur phase.
- **AC-A4 (PRD AC-10):** When the visitor skips (`Esc`, `» Skip`, a bar click), runs all (`Shift + Esc`), moves focus into a later section, switches to `∞` or changes the viewport width during the photo dissolve or a cover resolve, the photo and covers are in their final state and no ASCII or blurred piece remains; with reduced motion, a saved `∞` or no JavaScript, no ASCII or blurred piece ever appears and the photo is visible at `DOMContentLoaded`.
- **AC-A5 (PRD AC-11):** At 375x812 the photo (480 px tall) goes through the same select, skeleton, ASCII, photo sequence inside the compact window; the ASCII fits the photo's box (font size derived from the measured box and the string's column count) and `document.documentElement.scrollWidth` equals `clientWidth` at every sampled moment (B26).
- **AC-A6 (PRD AC-6 hero bound, AC-12):** The hero's total time is unchanged (final with its window gone <= 3.2 s from load, headline readable <= 2.0 s) and runtime + effects stay <= 18 KB gzip, critical JS <= 20 KB, total JS <= 90 KB, CSS <= 25 KB; `pnpm check:budgets` passes.
- **AC-A7 (PRD AC-14):** `git diff b4271cb` over scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts and api.ts is empty.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LCP and Lighthouse Performance drop once the hero photo is revealed by script under the ASCII at partial opacity (research found no source on partial opacity or overlay coverage; Chromium ignores opacity-0 paints) | M | H | Photo is eager with `fetchpriority="high"` (Phase 1); the image starts at a non-zero opacity (`PHOTO_START_OPACITY`, one constant); Task 6 measures with Lighthouse; if short, report the numbers to the owner and do not relax a threshold |
| The 18 KB runtime budget (about 5.9 KB headroom) | L | M | No new dependency; the effect reuses the selection and skeleton factories; `pnpm check:budgets` runs in Task 6 and Level 3 |
| The overlay font size does not fit the photo's box on mobile or with the real photo (a monospace advance other than 0.6 em, a different row count) | M | M | Font size and line height derive from the measured box and the string's own columns and rows; `ASCII_ADVANCE` is one constant; AC-A5 and Phase 5's E2E check the fit at 375x812 |
| Resize is not handled inside the effects layer (runners measure once at mount); a width change relies on the scheduler finishing the section (B14) | L | M | The existing `finishSection` destroys every mounted runner; the new runners keep no state outside `destroy()`; confirm in Phase 5 E2E (AC-10) rather than adding a hook to the frozen `resize.ts` |
| A longer photo step changes hero overlaps or `createdAt` | L | H | Starts are placed by pitch, so only the overlap changes; Task 5 confirms the compiled `createdAt` is unchanged; the hero unit tests are re-run by the test pair |
| The runtime accidentally imports the `sharp`-based generator | L | H | Constants are duplicated locally in `effect-timing.ts`; the Level 2 import check fails the run |
| The cover variant cannot be seen with real content (no committed project has a cover, so no `data-build-blur` exists) | H | L | The effect is data-driven and degrades to no blur phase; Phase 5 wires a fixture cover through the same pipeline for AC-3 and AC-9 |
| Bayer matrix values were once reported wrong on a reference page | L | L | The matrix in Task 1 is the standard 0-15 dispersed-dot map and its rows are a permutation of 0-15; the test pair pins it |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- **Existing tests the test pair will need to update (found by research; the list may be incomplete):** `tests/unit/effect-timing.test.ts` lines 294-307 assert `cardPhases(200).cover` is `false` and `cardPhases(250).cover` is `true`, which breaks once `cover` is a progress value and `coverStarted` is the boolean (update to the new intended behavior and record it in the lifecycle ledger); `tests/unit/effect-timing.test.ts` line 61 pins `D['build-card']` at 450 (unchanged in this phase); `tests/unit/runtime-compiler.test.ts` and `tests/unit/runtime-pacing.test.ts` use the `skeleton` and `build-card` names and the hero steps (the photo step's effect and call change here); `tests/unit/runtime-budget*` was not located by research and may pin hero or section times. New coverage the pair should add: the Bayer dissolve helpers (step 0 and 16, determinism, newline preservation), `photoOpacity` bounds, `asciiGeometry`, the `image-resolve` duration (1,000 ms), and the hero script's new command and unchanged `createdAt`.
- **Open owner decision candidates:** (1) `PHOTO_START_OPACITY` (starts at 0.12) and the ASCII color token (`--accent-fg`): both are tuned on the preview, per the PRD's open question; (2) the LCP result from Task 6 if it falls short; (3) whether the blurred cover needs a CSS blur on top of the upscale (this plan uses the upscale only, to avoid any `filter` rule).
- **Divergence callout:** the card keeps `CARD_MS` = 450 in this phase; the 300-350 ms duration and the 120 ms overlap are Phase 3's, so the cover progress ramp (250 to 400 ms of local time) is expressed in local milliseconds and will be re-fitted there.
- **Research gaps:** the research pass could not list the full test directory and did not read the runtime wiring for skip, run all, focus and infinity, only that `effects.ts` reacts to `onState`; the plan relies on `finishSection` (effects.ts:439-446) for every instant path. Web research found no primary source for LCP with a partial-opacity image under an overlay; Task 6 measures it.

*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Implemented: 2026-11-10*
*Status: IMPLEMENTED*
