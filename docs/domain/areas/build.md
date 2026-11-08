# Area: Build (runtime and build layer)

The self-building show: boot terminal, command dock, build windows, element effects and visitor controls. Sources: docs/02-experience.md (Behavior rules), docs/04-animations.md, prototype v2.

## Business rules

| # | Rule |
|---|---|
| B1 | Sections are built **in order, one at a time**; inside a section, element steps may overlap (cards overlap by 120 ms) |
| B2 | A section build starts when its top crosses **~75% of the viewport**; without scrolling the dock waits at `❯ █` |
| B3 | After the hero, if the visitor stays still for ~4 s, the dock's `scroll ↓` hint pulses |
| B4 | **The final layout never moves**: windows, cursors and selection boxes are overlays; animate only `transform`, `opacity`, `clip-path` |
| B5 | Every section keeps its final height before building (reserved space, dashed outline with the window name) |
| B6 | Scrolling past unbuilt sections queues them and builds them in **turbo (×5)** while a later section is already triggered; the dock shows `queued n/5` |
| B7 | **Never hijack scrolling**, except nav/palette clicks, deep links and Replay |
| B8 | **Skip** (`Esc`, `» Skip`, click on window title or command bar) finishes the current section immediately |
| B9 | **Run all** (`Shift + Esc`, palette) finishes every remaining section |
| B10 | Deep link `/#<section>` goes to the target at once; everything before it builds in turbo, in order, then the target builds at 1× |
| B11 | Keyboard focus entering an unbuilt section finishes it and every section before it instantly; focus in the nav during the boot finishes the hero |
| B12 | Built sections never animate again when scrolling up |
| B13 | Elements are clickable as soon as they exist; clicks on a window body reach the page |
| B14 | A viewport **width** change during a build finishes the current section instantly; height-only changes (a phone's address bar) do not |
| B15 | Every visit plays the full build (D6); a saved `∞` speed is the only exception |
| B16 | Reduced motion: no windows or typing; content ready; dock offers `▶ Play build` |
| B17 | No JavaScript: the final page renders statically; no dock, no windows |
| B18 | The build pauses while the tab is hidden and resumes on return |
| B19 | Speed cycles `1× → 2× → ∞`, multiplies every timing and is saved in the browser |
| B20 | Replay scrolls to the top, hides every section and builds again |
| B21 | Budgets: hero ≤ 3.2 s from load (headline readable ≈ 1.7 s, ≤ 2.0 s); other sections ≤ 2.5 s from trigger |
| B22 | On-screen commands come from the build scripts and must match the real public source (technical authenticity) |
| B23 | Every element is **created**, not faded in: `select → skeleton → content` |
| B24 | The build layer is `aria-hidden`; typing is never announced letter by letter |
| B25 | Clicking a window's first dot "closes" it: `warn  Window closed. Building anyway...` and the section finishes (easter egg) |

## Timings (1×, docs/04-animations.md)

Dock typing 40 ms ± 10 ms per character (+100 ms after `(` and `,`); window typing 12 ms per character, ≤ 350 ms per command; headline 28 ms/char; window open 280 ms, close 300 ms; boot fold 300 ms; select 150 ms; skeleton ≥ 150 ms; decode 350 ms; lines 40 ms/line; image 700 ms; pop 180 ms; stagger 90 ms; card ≈ 450 ms; cursor 530/530 ms.

## Lifecycle

`pending → queued → command → window → building → closing → done`; `skipped` from any state (Esc, Skip, Run all, focus, resize, reduced motion).

## Responsive

Below 768 px: windows show a single compact title bar with the current command; the dock spans the width (16 px gutters) and shows only status and `» Skip`; a tap on the title bar skips. Agent cursors (v1.1) are desktop only.

## Out of scope for v1

Interactive dock (D7), multi-cursor agents (D8), keyboard sound, element counter.

## Open Questions

- ~~Final turbo multiplier inside the 5–10× range (the prototype uses 5×) [INFERRED - VALIDATE].~~ Answered by the Stage 3 PRD (2026-11-08): ×5.
- Whether Chrome on Windows and Linux lets the page receive `Shift + Esc`, which Chrome lists as its Task Manager shortcut; checked in Stage 3 Phase 4.
- Whether the "unstyled → styled" joke effect ships in v1 (listed as optional in docs/04-animations.md); decided in Stage 4.
- Whether the rare `warn  Coffee level low` boot easter egg ships.
