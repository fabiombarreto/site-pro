# Architecture (developer overview)

A workflow-focused companion to docs/06-architecture.md (the approved design) and docs/context/architecture.md (stack, folders, design sources). No application code exists yet; this describes how the pieces will fit when Stage 2 starts.

## How a page load works

| Step | Where | What happens |
|---|---|---|
| 1 | Build time (Astro) | Content Collections are validated; sections render to complete static HTML; the photo → ASCII and OG image scripts run |
| 2 | Inline `<head>` script | Before first paint: no JS, reduced motion or a saved `∞` speed keep the page as is; otherwise sections are marked pending (invisible, space reserved) and fonts are preloaded |
| 3 | Deferred runtime module | Reads the per-section build scripts, mounts the build layer overlay (boot terminal, dock, windows) and runs the program on one `requestAnimationFrame` loop |
| 4 | After idle | React islands hydrate (Command Palette, theme toggle) and subscribe to runtime state through nanostores; the mobile menu is a static `popover` and needs no hydration |

## Moving parts

| Part | Responsibility | Talks to |
|---|---|---|
| Sections (`src/sections/`) | Final markup of each section plus its build script | Runtime (reads the script and targets elements) |
| Page components (`src/components/page/`) | Readable page UI, from the Design System | Rendered by Astro; a few hydrate as islands |
| Build components (`src/components/build/`) | Dock, windows, selection boxes, skeletons | Driven by the runtime; overlay only, `aria-hidden` |
| Runtime (`src/runtime/`) | Program, scheduler, effects, triggers, overlays, controls, persistence, clock | DOM directly; publishes state to `src/stores/` |
| Stores (`src/stores/`) | Shared state (build progress, speed, theme, palette) | Runtime and islands |
| Styles (`src/styles/`) | Tokens, Midnight/Daylight themes, base | Every component |
| Content (`src/content/`) | profile, projects, stack | Sections and project pages at build time |

## Where to change what

| Change | Start in |
|---|---|
| Copy or projects | `src/content/` (and docs/09-content-draft.md first) |
| Interface strings | `src/strings.ts` |
| A section's layout | `src/sections/<Section>` and the Design System reference |
| A section's build commands or steps | That section's build script |
| An effect's timing or look | `src/runtime/` effects, matching docs/04-animations.md |
| Colors, type, spacing | `src/styles/tokens.css` (from the Design System tokens) |

The exact file names above follow docs/06-architecture.md and will be confirmed when Stage 2 scaffolds the project [INFERRED - VALIDATE].

## Reference implementations

The Design System artifact's `components/src/index.tsx` and `bundle.css`, and prototype v2's timeline runtime, already implement the components and the approved rhythm in a single page. Use them as references, not as code to copy blindly: the production runtime must meet the budgets and test hooks in docs/06-architecture.md.
