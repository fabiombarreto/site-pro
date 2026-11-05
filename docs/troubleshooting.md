# Troubleshooting

Known pitfalls so far come from Stage 1 work in Claude Design and from the approved runtime design. Add code-level issues here once Stage 2 starts.

## Claude Design (Design System, canvas, prototype)

| Symptom | Cause | Fix |
|---|---|---|
| Components inside a flex row ignore their width or stack in one column | A `style` on an `x-import` lands on an inner wrapper, so flex sizing never reaches the item | Use a grid parent with columns from a `renderVals` value, or wrap the import in a sized `div` |
| Extra wrappers break a layout | `sc-for` adds wrapper elements | Account for them in the parent's grid or flex rules |
| Your edit to `canvas.json` disappears | The open canvas page auto-saves and normalizes `canvas.json` | Re-read the live version right before writing, and rebuild from it |
| A prototype looks frozen on claude.ai | The tab was in the background, so `requestAnimationFrame` paused | Focus the tab; this matches the "pause while hidden" rule |
| Slow screenshots or rendering of the backdrop | `mask-image` on large glow layers is expensive | Use plain radial gradients for the glows |
| The block cursor covers the hero photo | The `█` cursor at banner size | Use the thin caret in `--accent-fg` for `type-text`; keep `█` in the build layer |
| Mobile board shows a scrollbar | Frame shorter than the content | Increase the frame height |

## Runtime (from the design, Stage 3)

| Symptom | Likely cause | Fix |
|---|---|---|
| Page jumps while a section builds | Animating layout properties or putting overlays in the flow | Animate `transform`, `opacity`, `clip-path` only; overlays positioned from the section box |
| Overlay out of place after resize or late fonts | Stale geometry | `ResizeObserver` repositioning; preload fonts before the boot; a resize finishes the current section |
| Controls act on old state after Replay | Closures captured the previous run's state | Read the current model through a ref or store at call time (bug seen and fixed in prototype v2) |
| Screen reader reads commands and logs | Build layer not hidden | `aria-hidden` on the whole build layer; pending content stays in the accessibility tree |
| Flaky visual tests | Real time in animations | Use the deterministic clock |

## Repository

| Symptom | Fix |
|---|---|
| A commit shows a personal email | Set the repository's `user.email` to the GitHub noreply address before committing |
| `.worktrees/` shows up in `git status` | It should be ignored by `.gitignore` (added by the relay context-builder) |
