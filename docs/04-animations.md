# 04 · Animations

## Mental model: the runtime

All animation is orchestrated by a small engine, the **runtime**, which reads a declarative **script** for each section and executes it step by step. Sections do not animate themselves: they declare steps, and the runtime decides when and how fast to run them.

Sample script (illustrative format, not final code):

```yaml
- section: projects
  trigger: prompt-in-view          # the waiting prompt crossed 70% of the viewport
  steps:
    - type:   "renderProjects({ featured: true });"
    - log:    { level: info, text: "Fetching projects... {count} found" }
    - log:    { level: info, text: "Creating Projects Section...", spinner: true }
    - render: { effect: frame-draw }
    - render: { effect: stagger, target: cards, each: [placeholder, image, text] }
    - done:   "Projects Section created."
```

Benefits: every section shares the same rhythm and grammar, and controls such as skip, run all, speed and replay work on any section without section-specific code.

The runtime is plain TypeScript, independent of React: it manipulates the DOM directly and publishes its state for the IDE chrome (see [06 · How React is used](06-architecture.md#how-react-is-used)).

## Block lifecycle

```
pending ──► queued ──► typing ──► logging ──► rendering ──► done
   │           │          │           │            │
   └───────────┴──────────┴───────────┴────────────┴──► skipped
                                          (Esc · Skip · Run All · reduced motion)
```

| State | Explorer | Status bar |
|---|---|---|
| `pending` | dimmed `○` | — |
| `queued` | `○` | `3/7 · queued` |
| `typing`, `logging`, `rendering` | `⠹` spinner | `● Running renderProjects()` |
| `done`, `skipped` | `✓` | `✓ Ready` |

## Timings (1× speed)

| Event | Duration | Notes |
|---|---|---|
| Pause before typing | 300 ms | The "breath" before someone types |
| Typing, per character | 45 ms ± 15 ms | Random variation mimics human typing; +120 ms after `(` `,` `.` |
| Enter (commits the line) | 80 ms | The line gets its full highlighting |
| Gap between logs | 100–150 ms | Logs appear at once, with no fade, like in a terminal |
| Spinner | 80 ms per frame | Visible for at least 300 ms |
| Frame drawing | 250–350 ms | |
| Line-by-line reveal | 16–24 ms per line | |
| Title *decode* | 400–600 ms | |
| ASCII → photo | 700–900 ms | |
| Gap between cards | 90 ms | |
| Completion line | 100–150 ms after render | |
| Cursor | 530 ms on / 530 ms off | A common terminal default |
| **Budget per section** | **≤ 2.5 s** | From trigger to usable content |

### Boot timeline (hero)

Each ruler character is 100 ms.

```
ms         0    500  1000 1500 2000 2500
           |····|····|····|····|····|····
typing        ██████                       startSite();
logs                ████                   3 lines + progress bar
frame                   ███                frame-draw
name                     ███               banner via scanline
photo                    ████████          ASCII → photo
title                      █████           decode
links                           ███        stagger
done                               █       ✔ Hero Section created.
prompt                               █     ❯ █
```

**Targets:** name and title readable in **≤ 1.8 s**, and the full hero in **≤ 2.7 s** after load.

---

## Effects catalog

| Effect | Where | How it works | Duration |
|---|---|---|---|
| `type` | Commands | Characters enter one by one, already colored by token (the command is tokenized beforehand). The cursor stays solid while typing. | 45 ms/char |
| `log` | Logs | The whole line appears at once, with a timestamp. | instant |
| `spinner` / `progress` | Logs | A spinning braille spinner; a filling `█░` bar. | 300–600 ms |
| `frame-draw` | Frames | Top border drawn left to right, sides going down, then the bottom, like a TUI being painted. | 250–350 ms |
| `scanline` | Banner, text blocks | Content revealed top to bottom, one line at a time (a mask in 1-line steps). | 16–24 ms/line |
| `decode` | Short titles | Letters scramble through random characters (`!<>-_\/[]{}=+*^?#`) and settle from left to right. | 400–600 ms |
| `ascii-to-image` | Hero photo, project images | The image starts as ASCII art (generated at build time from the image itself) and dissolves, with dithering, into the real photo. | 700–900 ms |
| `placeholder` | Images | A `░░░ 640×360 ░░░` block showing the dimensions, a nod to the reel's placeholders. Then the image comes in. | until the image loads |
| `stagger` | Cards, links, lists | Children appear in sequence. | 90 ms between items |

### Optional effects

To be evaluated in the design prototype (open decision **D8**):

| Effect | Description |
|---|---|
| **Multi-cursor ("agents")** | In the hero and projects, 3 to 5 labeled text cursors (`agent-1`, `agent-2`…) appear and "write" different parts at the same time. It is the most direct tribute to the reel's swarm, and it echoes IDE multi-cursor editing and Antigravity's agents. |
| **CRT** | Scanlines and a slight glow, only in the Phosphor theme. |
| **Keyboard sound** | Very subtle key clicks while typing. **Off by default**, with a toggle in the status bar. A v2 candidate. |
| **Minimap** | A page thumbnail on the right edge (as in VS Code), showing the visible area and the sections already rendered. |

---

## Motion principles

1. **The terminal is discrete.** Console text appears in steps (`steps()`), with no easing and no fade. Terminals do not fade.
2. **The chrome is smooth.** The Explorer drawer, the palette, menus and toasts use a 150–200 ms `ease-out`.
3. **Only cheap properties.** Animate `transform`, `opacity` and `clip-path`, never layout properties. Target: 60 fps.
4. **Never move the visitor's scroll** unless they ask for it.
5. **Content never waits for the animation to end** before becoming clickable.

## Visitor controls

| Control | Where | Effect |
|---|---|---|
| **Skip** | `Esc`, the `⏭ Skip` button, a tap on the block | Finishes the current block immediately |
| **Run all** | `Run` menu, palette | Finishes every block at once |
| **Speed** | Status bar (`1×` → `2×` → `∞`), palette | Multiplies every timing. Saved in the browser |
| **Replay** | Activity bar, `Run` menu, button at the end of the page | Clears the console (like `clear`), scrolls to the top and runs everything again |

## Reduced motion

With `prefers-reduced-motion: reduce` (or `∞` speed):

| Element | Behavior |
|---|---|
| Commands | Appear already typed |
| Logs | Appear immediately, with a static spinner (`·`) |
| Content | Appears ready, without `decode`, `scanline` or `ascii-to-image` |
| Cursor | Steady (no blinking) |
| Chrome | Transitions of at most 100 ms, or none |

## Runtime performance

- A single `requestAnimationFrame` loop for the whole runtime, instead of dozens of `setInterval`s.
- `IntersectionObserver` for the triggers, instead of listening to scroll events.
- Typing writes into a line with reserved width, so it never triggers layout recalculation.
- Execution pauses while `document.visibilityState === "hidden"`.
- Budget: runtime + effects **≤ 15 KB** (gzip).
