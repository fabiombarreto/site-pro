Status: awaiting owner review

# Stage 4 rhythm review (owner hand-off)

The autonomous pipeline cannot perform this review: it is a judgement of feel on the pull request preview. No box below is checked by the pipeline, and no measured value is filled in. The phase's success signal ("the owner approves the rhythm") is completed by the owner.

## How to run it

1. Open the pull request's Workers Builds preview.
2. Watch the build at 1x speed on desktop (1280x800) and on a phone (375x812), in both themes (Midnight and Daylight).
3. Compare it with prototype v2 and with docs/04-animations.md.
4. Record the numbers you measure in the pull request, not in this file's checklist.

## Budgets to eyeball

Figures below are compiled timelines of the committed content (`tests/unit/runtime-pacing.test.ts` and `src/sections/*.build.ts`).

| Section | Created at | Budget |
|---|---|---|
| Hero | 2650 ms from load (done at 3150 ms, window gone) | 3.2 s |
| About | about 2400 ms after its trigger | 2.5 s |
| Projects | about 2470 ms after its trigger | 2.5 s |
| Stack | about 2440 ms after its trigger | 2.5 s |
| Contact | about 2432 ms after its trigger | 2.5 s |

## Open items

- [ ] 300 ms cards squeeze the skeleton to 40 ms and the cover resolve to 80 ms: is that readable?
- [ ] The first card starts while the Projects heading is still typing: is the overlap acceptable?
- [ ] The dock log is visible only about 100 ms: is it legible?
- [ ] Up to 4 stack groups pop at once: is the group pop distinct enough?
- [ ] Slack is thin: hero 50 ms and projects 30 ms. A fifth project would overrun the 2.5 s budget, so adding a project needs re-tuning.
- [ ] `PHOTO_START_OPACITY` (0.12) and the ASCII color need tuning on the preview with the placeholder, and again with the real photo.
- [ ] LCP measured on the preview (a trace or Lighthouse) and reported as numbers in the pull request.

## Levers

| What | Where |
|---|---|
| `CARD_MS`, `STAGGER_GAP_MS`, `DISSOLVE_MS`, `PHOTO_START_OPACITY` | `src/runtime/effect-timing.ts` |
| Step pitches and overlaps, minimum settle | `src/sections/pacing.ts` and `src/sections/*.build.ts` |
| ASCII color token | `src/styles/build-layer.css`, rule `.sp-ascii` (`color: var(--accent-fg)`, defined in `src/styles/tokens.css`) |

Any change re-runs the unit timing tests, `pnpm check:budgets` and `pnpm lighthouse`. No budget or Lighthouse threshold is relaxed to pass.

## Decision

Owner approval: pending
