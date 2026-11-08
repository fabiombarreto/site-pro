# 04 · Animations

## Mental model: the runtime

All animation is orchestrated by a small engine, the **runtime**, which reads a declarative **build script** for each section and runs it. Sections do not animate themselves: they declare steps, and the runtime decides when and how fast to run them.

Each script has two parts: what the **dock** does (the section command and its log) and what the **window** does (the element commands, each one tied to an element of the page and an effect).

Sample script (illustrative format, not final code):

```yaml
- section: projects
  trigger: section-in-view            # the section's top crossed 75% of the viewport
  dock:
    - type: "renderProjects();"
    - log:  { level: info, text: "Fetching projects... {count} found" }
  window:
    title: projects.tsx
    steps:
      - call:   'projects.heading("Selected work")'
        target: heading
        effect: type-text
      - call:   'projects.card("{slug}")'   # one call per card
        target: cards
        effect: build-card
        overlap: 120ms                       # the next call starts before this one ends
        agents: 3                            # v1.1, decision D8
  done: "Projects Section created."
```

Benefits: every section shares the same rhythm and grammar, and controls such as skip, run all, speed and replay work on any section without section-specific code. The commands shown on screen come from this script, so they match the site's real source.

**Authoring and compiling** (Stage 3 PRD). A script is written as a sequence of steps. Each effect's duration comes from its content (a headline types for 28 ms per character after its 150 ms selection), and `gap` or `overlap` shifts the next step. At build time the sequence is compiled into an absolute timeline in milliseconds at 1× and serialized into the section's `data-*` attributes; the runtime only plays that timeline. A longer title moves every later step automatically, and tests can freeze any moment of it.

The runtime is plain TypeScript, independent of React: it manipulates the DOM directly and publishes its state for the rest of the page (see [06 · How React is used](06-architecture.md#how-react-is-used)).

## Section build lifecycle

```
pending ──► queued ──► command ──► window ──► building ──► closing ──► done
   │           │          │           │          │            │
   └───────────┴──────────┴───────────┴──────────┴────────────┴──► skipped
                                   (Esc · Skip · Run all · focus · resize · reduced motion)
```

| State | Dock shows | On the page |
|---|---|---|
| `pending` | — | Content invisible, with a faint dashed outline |
| `queued` | `queued 4/5` while turbo catches up | Same |
| `command` | The section command being typed, then its log | Same |
| `window` | `● Building projects…` | The build window opens |
| `building` | `● Building projects…`, `» Skip`, speed | Elements are created one by one |
| `closing` | `✔ Projects Section created. (2.31s)` | The window's chrome fades |
| `done`, `skipped` | `✓ 3/5 sections   ❯ █` | The final section |

## Timings (1× speed)

| Event | Duration | Notes |
|---|---|---|
| Pause before typing | 250 ms | The "breath" before someone types |
| Dock typing, per character | 40 ms ± 10 ms | Random variation mimics human typing; +100 ms after `(` and `,` |
| Enter (commits the line) | 80 ms | The line gets its full highlighting |
| Gap between logs | 100 ms | Logs appear at once, with no fade, like in a terminal |
| Boot terminal → dock | 300 ms | Only once, when the hero window opens |
| Window opening | 280 ms | Out of the dock |
| Window command typing, per character | 12 ms | Windows type fast; at most 350 ms per command, long arguments are cut with `…` |
| Selection box | 150 ms | Dragged from the top-left corner to the element's size |
| Skeleton | ≥ 150 ms | Until the content is ready |
| Headline typing, per character | 28 ms | |
| Decode | 350 ms | |
| Lines resolving | 40 ms per line | |
| Image resolving | 700 ms | |
| Pop (buttons, chips, tags) | 180 ms | |
| Gap between siblings (stagger) | 90 ms | |
| Card build | ≈ 450 ms per card, 120 ms overlap | |
| Window closing | 300 ms | |
| Cursor | 530 ms on / 530 ms off | A common terminal default |
| **Budget: hero** | **≤ 3.2 s** | From load to the complete hero, boot included |
| **Budget: other sections** | **≤ 2.5 s** | From trigger to usable content |

### Boot timeline (hero)

Each ruler character is 100 ms.

```
ms         0    500  1000 1500 2000 2500 3000
           |····|····|····|····|····|····|
type          █████                         startSite(); typed in the boot terminal
logs               ██                       2 log lines
nav                 ██                      nav bar slides in
window               ███                    terminal folds into the dock · hero.tsx opens
title                   ████                hero.title(…) → headline typed
role                      █████             hero.role(…) → decode
photo                      ████████         hero.photo(…) → skeleton → ASCII → photo
intro                         ████          hero.intro(…) → lines resolve
links                            ███        hero.links(…) → buttons pop in
done                                 █      ✔ Hero Section created.
close                                ███    window chrome fades
idle                                    █   dock: ❯ █
```

**Targets:** the headline readable in **≤ 2.0 s** (≈ 1.7 s in the timeline) and the full hero in **≤ 3.2 s** (≈ 3.0 s) after load.

---

## Effects catalog

### Dock and windows

| Effect | Where | How it works | Duration |
|---|---|---|---|
| `type` | Dock, window command bar | Characters enter one by one, already colored by token (the command is tokenized beforehand). The cursor stays solid while typing. | 40 ms/char (dock), 12 ms/char (window) |
| `log` | Dock | The whole line appears at once. | instant |
| `spinner` | Dock | A spinning braille spinner while a section builds. | 80 ms/frame |
| `boot-fold` | Boot terminal | The terminal shrinks and slides to the bottom of the screen, becoming the dock. | 300 ms |
| `window-open` | Build window | The window scales up from 0.96 and fades in, with its origin at the dock, as if it came out of it. | 280 ms |
| `window-close` | Build window | The title bar, command bar, border and shadow fade; the body (the section) stays. | 300 ms |

### Elements

| Effect | Where | How it works | Duration |
|---|---|---|---|
| `select` | Every element | A selection box with corner handles and a label (`h1`, `card`, `img 800×800`) is dragged to the element's size. | 150 ms |
| `skeleton` | Every element | A gray block with a soft shimmer; images show their dimensions, a nod to the reel's placeholders. | ≥ 150 ms |
| `type-text` | Headlines and titles | Characters typed with a thin caret in `--accent-fg`. The block cursor (`█`) stays in the build layer: at banner size it would cover the photo. | 28 ms/char |
| `decode` | Short labels (role, badges) | Letters scramble through random characters (`!<>-_\/[]{}=+*^?#`) and settle from left to right. | 350 ms |
| `resolve-lines` | Paragraphs | Skeleton bars give way to text, one line at a time. | 40 ms/line |
| `image-resolve` | Hero photo, project covers | The hero photo starts as ASCII art (generated at build time from the photo itself) and dissolves, with dithering, into the real photo (D12). Covers resolve from a blurred version. | 700 ms |
| `pop` | Buttons, chips, tags | Scale from 0.9 to 1 with a slight overshoot, right after the selection box. | 180 ms |
| `stagger` | Groups, lists | Children appear in sequence. | 90 ms between items |
| `build-card` | Project cards | `select` → `skeleton` → cover `image-resolve` → title `type-text` → summary `resolve-lines` → tags `pop`. | ≈ 450 ms |

### Optional effects

To be evaluated in the design prototype:

| Effect | Description |
|---|---|
| **Multi-cursor agents** (decision **D8**: v1.1) | 2 to 4 labeled pointers (`agent-1`, `agent-2`…) build different elements at the same time, in the hero and in Projects. The window's command bar shows one line per active agent, and the dock shows `3 agents`. It is the most direct tribute to the reel's swarm. Desktop only. Tested in the prototype and moved to v1.1. |
| **Unstyled → styled** | An element first appears as raw browser-default HTML (serif text, a blue underlined link), and then its CSS lands. Used in one spot only, such as the hero buttons, as a joke for developers. |
| **Element counter** | The dock shows `23/48 elements` while building, like the reel's layer count. |
| **Keyboard sound** | Very subtle key clicks while typing. **Off by default**. A v2 candidate. |

---

## Motion principles

1. **Text is discrete, UI is smooth.** Typed commands and logs appear in steps, with no easing and no fade, like a terminal. Windows, the dock and elements move with a 150–300 ms ease-out (`cubic-bezier(0.2, 0.8, 0.2, 1)`).
2. **Elements are created, not faded in.** Every element goes through select → skeleton → content. No generic fade-up reveals.
3. **The final layout never moves.** The build layer is an overlay, and elements animate in place.
4. **Only cheap properties.** Animate `transform`, `opacity` and `clip-path`, never layout properties. Blur only on the few build-layer surfaces. Target: 60 fps.
5. **Never move the visitor's scroll** unless they ask for it.
6. **Content never waits for the animation to end** before becoming clickable.

## Visitor controls

| Control | Where | Effect |
|---|---|---|
| **Skip** | `Esc`, the `» Skip` button in the dock, a click on the window's title bar or command bar | Finishes the current section immediately |
| **Run all** | `Shift + Esc`, palette | Finishes every remaining section at once |
| **Speed** | Dock (`1×` → `2×` → `∞`), palette | Multiplies every timing. Saved in the browser |
| **Replay** | Dock (when done), footer, palette | Scrolls to the top, hides every section and builds the site again |
| **Play build** | Dock, only with reduced motion | Plays the build at 1× because the visitor asked for it |

## Reduced motion

With `prefers-reduced-motion: reduce` (or `∞` speed):

| Element | Behavior |
|---|---|
| Boot terminal and windows | Not shown |
| Dock | `✔ Ready · motion reduced` and `▶ Play build` (with `∞` speed: `✓ 5/5 sections`) |
| Content | Appears ready, without any element effect |
| Cursor | Steady (no blinking) |
| UI transitions | At most 100 ms, or none |

## Runtime performance

- A single `requestAnimationFrame` loop for the whole runtime, instead of dozens of `setInterval`s.
- `IntersectionObserver` for the triggers, instead of listening to scroll events.
- Windows are positioned from each section's box and kept in place with `ResizeObserver`; they move with `transform` only.
- Typing writes into a line with reserved width, so it never triggers layout recalculation.
- Blur is applied only while a build-layer surface is visible, and removed when the window closes.
- Execution pauses while `document.visibilityState === "hidden"`.
- A deterministic clock can replace real time, so tests can capture any moment of a build: a manual clock in Vitest and Playwright's `page.clock` (which fakes `requestAnimationFrame` and `performance`) in E2E, with no test hook in production. Every effect is driven from the runtime's clock, with seeded randomness for the decode scramble and the typing jitter; only decorative loops (cursor blink, skeleton shimmer) run in CSS.
- Turbo builds at 5× while a later section is already triggered.
- Budget: runtime + effects **≤ 18 KB** (gzip).
