# 03 · Design System

> The first Design System published in Claude Design ([site-pro Design System](https://claude.ai/artifact/VtbNMjiH7N1q9buK1pFQ5K), private) implements the **v1 IDE concept** and is now superseded by this document. Version 2 will be rebuilt there once this document is approved. When the two disagree, update this document first.

## Visual direction

**A modern product site, with a developer's build layer on top.** There are two registers, and they never mix:

| Register | Where | Look |
|---|---|---|
| **The page** | Nav, sections, project pages, footer | Modern and readable: large display type, generous spacing, cards with images, soft depth from the accent color. Monospace appears only in small labels and tags. |
| **The build layer** | Command dock, build windows, selection boxes, skeletons, agent cursors | Technical: monospaced type, syntax-highlighted commands, `info` logs, translucent windows. It exists only while sections are being built. |

The page is restrained: neutral surfaces, high-contrast text and one accent color. The "wow" comes from watching it being built, not from heavy visual effects.

## Themes

Themes are sets of tokens (CSS custom properties). Visitors switch themes from the nav or the Command Palette, and the choice is saved in the browser.

| Theme | Use |
|---|---|
| **Midnight** (default, dark) | The main theme and the site's identity (decision **D3**) |
| **Daylight** (light) | Alternative, for those who prefer a light background |

The v1 **Phosphor** theme (green CRT) is retired. It may come back as an easter egg after launch.

### Color tokens

Every text/background pair used for content meets **WCAG AA (≥ 4.5:1)**. `--fg-subtle` is only for decorative elements.

**Surfaces**

| Token | Midnight | Daylight | Use |
|---|---|---|---|
| `--bg` | `#141519` | `#f6f7f9` | Page background |
| `--bg-raised` | `#1d1e24` | `#ffffff` | Cards, the facts box, group cards |
| `--bg-overlay` | `rgb(35 36 43 / 0.78)` | `rgb(255 255 255 / 0.82)` | Build windows, dock, palette, menus, toasts (with backdrop blur) |
| `--bg-hover` | `#23242b` | `#eef0f3` | Hover on list items and chips |
| `--bg-selection` | `#2f4a73` | `#cfe0fc` | Text selection |
| `--border` | `#2c2e36` | `#d4d6dc` | Card and window borders, dividers |
| `--border-strong` | `#3a3d47` | `#b9bdc6` | Dock border, hovered borders |
| `--grid-dot` | `#23252c` | `#e2e4e9` | The dot grid in the page background |

**Text**

| Token | Midnight | Daylight | Use |
|---|---|---|---|
| `--fg` | `#d6d8de` | `#1f2328` | Main text |
| `--fg-muted` | `#8b8f9c` | `#59606b` | Secondary text, metadata |
| `--fg-subtle` | `#5c606c` | `#9aa0aa` | Decorative only |

**Accent** (the site's signature color: blue, decision **D3**)

| Token | Midnight | Daylight | Use |
|---|---|---|---|
| `--accent` | `#2563eb` | `#2563eb` | Primary buttons, focus ring, selection boxes, active nav link |
| `--accent-hover` | `#1d4ed8` | `#1d4ed8` | Primary button hover |
| `--accent-fg` | `#6ea8ff` | `#1d4ed8` | Links and highlighted text |
| `--on-accent` | `#ffffff` | `#ffffff` | Text on `--accent` |
| `--accent-glow` | `rgb(37 99 235 / 0.28)` | `rgb(37 99 235 / 0.14)` | The hero glow and the card hover glow |

**Syntax** (commands in the dock and in build windows, code snippets on project pages)

| Token | Midnight | Daylight | Example |
|---|---|---|---|
| `--syn-keyword` | `#c792ea` | `#7f0055` | `const`, `await`, `return` |
| `--syn-function` | `#e5c07b` | `#795e26` | `renderProjects`, `card` |
| `--syn-string` | `#98c379` | `#2a00ff` | `"Senior Software Engineer"` |
| `--syn-number` | `#f78c6c` | `#098658` | `6`, `true` |
| `--syn-type` | `#4fd1c5` | `#267f99` | `hero`, `projects` |
| `--syn-comment` | `#868b96` | `#3f7f5f` | `// comments` |
| `--syn-punct` | `#d6d8de` | `#1f2328` | `( ) { } ;` |

Daylight keeps the classic Eclipse syntax colors from the v1 concept. Syntax and log colors are used only on `--bg-overlay` (dock, windows) and `--bg-raised` (code blocks), where every pair passes AA; three Daylight syntax colors fall just below 4.5:1 on the page background, so they never sit directly on it.

**Log levels**

| Token | Midnight | Daylight | Use |
|---|---|---|---|
| `--log-info` | `#60a5fa` | `#1d4ed8` | `info` |
| `--log-success` | `#4ade80` | `#15803d` | `✔ ... created.` |
| `--log-warn` | `#fbbf24` | `#a16207` | `warn` (used sparingly, for humor) |
| `--log-error` | `#f87171` | `#b91c1c` | `error` (404 page) |

**Build layer**

| Token | Midnight | Daylight | Use |
|---|---|---|---|
| `--build-select` | `#2563eb` | `#2563eb` | Selection box border and label |
| `--build-skeleton` | `#23242b` | `#e9ebef` | Skeleton blocks |
| `--build-shine` | `#2c2e36` | `#f3f4f6` | The skeleton shimmer |
| `--agent-1` … `--agent-4` | `#c792ea` `#e5c07b` `#98c379` `#4fd1c5` | `#9333ea` `#b45309` `#15803d` `#0f766e` | Agent cursors and their labels (D8) |

## Typography

Two families with clear jobs: a **sans-serif** for everything people read, and a **monospace** for the build layer and small technical labels.

| Item | Choice | Why |
|---|---|---|
| Text and headings | A modern sans-serif, decision **D18** (recommendation: **Geist**; alternatives: Inter, Space Grotesk) | Very legible at small sizes, variable weights, and a technical feel without being a code font |
| Build layer and labels | **JetBrains Mono** (OFL license, variable), kept from v1 | Commands, logs, window titles, section eyebrows (`02 / projects`), tags and dimension labels |
| Fallbacks | Sans: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` · Mono: `"Cascadia Code", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | The chosen fonts are self-hosted, so fallbacks only show if loading fails |
| Weights | Sans 400, 500, 600 and 700 (one variable file) · Mono 400 and 500 | Few files, fast loading |

### Scale

| Token | Desktop / mobile | Line height | Tracking | Use |
|---|---|---|---|---|
| `--text-display` | `clamp(44px, 7vw, 88px)` | 1.02 | -0.03em | Hero headline |
| `--text-3xl` | `clamp(32px, 4.5vw, 48px)` | 1.1 | -0.02em | Section titles (`<h2>`), project page title |
| `--text-2xl` | 28 / 22 px | 1.2 | -0.01em | Hero role |
| `--text-xl` | 22 / 20 px | 1.3 | — | Card titles, fact values |
| `--text-lg` | 19 / 18 px | 1.6 | — | Hero intro, lead paragraphs |
| `--text-md` | 16 / 16 px | 1.65 | — | Body text |
| `--text-sm` | 14 / 14 px | 1.5 | — | Nav, metadata, card summaries |
| `--mono-sm` | 13 / 12 px | 1.5 | — | Commands, logs, window titles, eyebrows, tags |
| `--mono-xs` | 12 / 11 px | 1.4 | — | Selection labels, agent labels, dimension labels |

- Body text is at most **68ch** wide.
- Ligatures on in commands and code; tabular numerals in facts and build times.

## Layout and spacing

- **Container:** at most 1200 px wide, 12-column grid, 24 px gutters (16 px on mobile), 32 px side padding (16 px on mobile).
- **Spacing scale (4 px base):** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`.
- **Section padding:** 128 px top and bottom on desktop, 80 px on mobile. The top padding holds the build window's title bar and command bar, so the content never moves.

| Element | Size |
|---|---|
| Nav bar | 64 px tall, sticky |
| Boot terminal | 560 px wide (full width minus 32 px on mobile), centered in the first screen |
| Command dock | 44 px tall (2 lines while typing), up to 560 px wide, centered, 24 px from the bottom |
| Collapsed dock | 44 px round button, bottom right |
| Window title bar | 36 px (28 px on mobile, where it also shows the command) |
| Window command bar | 36 px (merged into the title bar on mobile) |
| Window outset | Windows extend 24 px past the content on each side (12 px on mobile) |
| Hero photo | Square, 360–400 px on desktop, 96 px on mobile |
| Project cover | 16:9 |

### Radii, shadows and effects

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6 px | Tags, chips, selection labels |
| `--radius-md` | 10 px | Buttons, the email field |
| `--radius-lg` | 16 px | Cards, windows, the photo, the palette |
| `--radius-full` | 9999 px | The dock, pills |
| `--shadow-card` | `0 1px 2px rgb(0 0 0 / .3), 0 8px 24px rgb(0 0 0 / .25)` (lighter in Daylight) | Cards at rest |
| `--shadow-window` | `0 24px 64px rgb(0 0 0 / .5)` (lighter in Daylight) | Build windows, palette |
| `--shadow-dock` | `0 12px 32px rgb(0 0 0 / .4)` (lighter in Daylight) | Dock |

- **Glass:** `backdrop-filter: blur(16px) saturate(140%)` only on build-layer surfaces, the scrolled nav and the palette. With `prefers-reduced-transparency`, or where blur is not supported, these surfaces use `--bg-raised`.
- **Hero glow:** a soft radial gradient of `--accent-glow` behind the photo.
- **Dot grid:** 1 px dots every 24 px in `--grid-dot`, faded out behind each section's content with a mask.

## Build layer glyphs

Used only in the dock and in build windows:

| Role | Glyphs |
|---|---|
| Prompt and cursor | `❯ █` |
| Status | `✔ ✓ ● ○ ⚠` |
| Controls | `» ↻ ▶ 1× 2× ∞` |
| Spinner | `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` (fallback `\| / - \`) |
| Window dots | three neutral circles, drawn in CSS |

Box-drawing characters (`┌─┐`) no longer appear on the site. They are only used in these documents' wireframes.

## Iconography

- **UI icons:** [Lucide](https://lucide.dev/) (ISC license): arrows, copy, theme, menu, external link.
- **Brand icons:** [Simple Icons](https://simpleicons.org/) (CC0) for GitHub and LinkedIn links only.
- **No operating system or app chrome:** window dots are neutral gray, not traffic-light colors, and no OS or IDE logo appears anywhere.

---

## Components

React components are rendered to static HTML at build time, and only hydrated where they need interactivity (see [06 · How React is used](06-architecture.md#how-react-is-used)).

### Page

| Component | Description | States and variants |
|---|---|---|
| `NavBar` | Name, section links, `⌘K`, theme toggle, GitHub | transparent (top), translucent (scrolled), active link; mobile `☰` menu |
| `MobileMenu` | The `☰` menu on small screens (island) | open, closed |
| `ThemeToggle` | Midnight / Daylight | — |
| `SectionHeading` | Mono eyebrow (`02 / projects`), `<h2>` and an optional lead | — |
| `Button` | Primary (filled), secondary (outlined), ghost; optional icon | rest, hover, focus, active, disabled |
| `TextLink` / `IconLink` | Inline and icon links; external links carry `↗` | rest, hover, focus |
| `Tag` | Mono chip (`node`) | — |
| `Photo` | The hero photo | built; building (skeleton, ASCII) |
| `FactList` | Value + label pairs (`12+  years shipping code`) | — |
| `ProjectCard` | Cover, title, year, summary, tags, status badge, `repo ↗` | rest, hover/focus (lift + accent border); building stages |
| `StatusBadge` | `active`, `in development`, `planning`, `case study` | — |
| `StackGroup` / `StackChip` | A group card with technology chips | — |
| `FrequencyMeter` | `●●●` daily, `●●○` often, `●○○` sometimes, with a text alternative | — |
| `EmailCopy` | The email address and a copy button | rest, copied |
| `Footer` | Build summary, Replay, source link, copyright | — |
| `Toast` | Notification just above the dock | info, success |
| `CommandPalette` | Command search (island) | empty, filtering, no results |
| `ProjectHeader` / `Prose` | The project page header and its Markdown body | — |

### Build layer

| Component | Description | States and variants |
|---|---|---|
| `BootTerminal` | The terminal in the middle of the first screen | typing, logging, folding into the dock |
| `CommandDock` | The pill HUD at the bottom | typing, building, idle, done, collapsed, reduced |
| `CommandLine` | `❯` + a highlighted command + cursor | waiting, typing, entered |
| `Cursor` | Blinking `█` block | blinking, solid (while typing), hidden |
| `LogLine` | `info  message` | info, success, warn, error; with spinner |
| `BuildWindow` | The overlay around a section: title bar, command bar, body frame | opening, building, closing |
| `SelectionBox` | Border, corner handles and a label (`h1`, `card`, `img 800×800`) | drawing, active, fading |
| `Skeleton` | A block with an optional dimension label and a shimmer | — |
| `AgentCursor` | Pointer with a name label (D8) | moving, idle |
| `SkipButton`, `SpeedToggle`, `ReplayButton`, `PlayBuildButton` | Dock controls | visible only in the states that need them |

---

## Wireframes

Wireframes use the [content draft](09-content-draft.md) as illustrative text. The full-page and mobile wireframes are in [02 · Experience](02-experience.md#screen-anatomy-desktop-after-the-hero-is-built).

**Legend**

| Drawing | Meaning |
|---|---|
| `┌─┐` single line | A finished element (card, window, box) |
| `╭─╮` rounded | The dock, pills and the email field |
| `┏━┓` heavy line | A selection box, while an element is being created |
| `┌┄┐ ┆` dashed | A pending area or placeholder |
| `░` | Skeleton |
| `▓ ▒` | Image (`▒` while it resolves) |

### Build window

```
┌─ ● ● ●  projects.tsx ───────────── ● building 4/6 ─┐  ← title bar: file name + progress
│ ❯ projects.card("ai-track-record")█                │  ← command bar: the window types
├────────────────────────────────────────────────────┤    its own commands here
│  Selected work                                     │  ← body: the section itself, at its
│  ┏━ card ━━━━━━━━━━━━━┓   ┌────────────────────┐   │    final size and position
│  ┃░░░░░░░░░░░░░░░░░░░░┃   │ relay              │   │
│  ┃░░░░░ 640×360 ░░░░░░┃   │ PRD to pull request│   │  ← an element being created
│  ┃░░░░░░░░░░░░░░░░░░░░┃   │ claude-code · node │   │
│  ┗━━━━━━━━━━━━━━━━━━━━┛   └────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### Command dock

```
           ┌─ ● ● ●  terminal ──────────────────────────────┐
boot       │ ❯ startSite();█                                │
           │                                                │
           └────────────────────────────────────────────────┘
           ╭────────────────────────────────────────────────╮
typing     │ ❯ renderProjects();█                           │
           ╰────────────────────────────────────────────────╯
           ╭────────────────────────────────────────────────╮
building   │ ● Building projects…               » Skip   1× │
           ╰────────────────────────────────────────────────╯
           ╭────────────────────────────────────────────────╮
idle       │ ✓ 2/5 sections   ❯ █             scroll ↓   1× │
           ╰────────────────────────────────────────────────╯
           ╭────────────────────────────────────────────────╮
done       │ ✔ Build complete: 5 sections in 9.6s  ↻ Replay │
           ╰────────────────────────────────────────────────╯
           ╭────────────────────────────────────────────────╮
reduced    │ ✔ Ready · motion reduced          ▶ Play build │
           ╰────────────────────────────────────────────────╯
```

### Project card: how it is built

```
┏━ card ━━━━━━━━━━━━━━━┓  ┌──────────────────────┐  ┌──────────────────────┐
┃░░░░░░░░░░░░░░░░░░░░░░┃  │▓▓▓▓▓▓▓▓▓▒▒▒▒▒░░░░░░░░│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
┃░░░░░░ 640×360 ░░░░░░░┃  │▓▓▓▓▓▓▒▒▒▒▒░░░░░░░░░░░│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
┃░░░░░░░░░░░░░░░░░░░░░░┃  │▓▓▓▒▒▒▒░░░░░░░░░░░░░░░│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
┃                      ┃  │                      │  │                      │
┃ ░░░░░░░░             ┃  │ relay█               │  │ relay           2026 │
┃ ░░░░░░░░░░░░░░░░░░░░ ┃  │ ░░░░░░░░░░░░░░░░░░░░ │  │ A Claude Code plugin │
┃ ░░░░░░░░░░░░░░       ┃  │ ░░░░░░░░░░░░░░       │  │ from PRD to PR.      │
┃ ░░░░░░░  ░░░░        ┃  │                      │  │ claude-code · node   │
┗━━━━━━━━━━━━━━━━━━━━━━┛  └──────────────────────┘  └──────────────────────┘
1  select + skeleton      2  content                3  built
```

On hover and focus, the finished card lifts, its border takes the accent color and the cover zooms in slightly.

### About

```
01 / about
About me

I've been writing software for 12+ years.       ┌─ at a glance ──────────────┐
I started as the first QA hire at a company     │                            │
building a retail ERP, then moved into          │ 12+   years shipping code  │
full-stack work, system architecture and        │ 2020  remote contractor    │
leading a small team.                           │ 322+  schools served       │
                                                │ Now   AI-assisted dev      │
Since 2020 I've worked as a remote (…)          │                            │
                                                └────────────────────────────┘
```

### Stack

Each technology shows how often it is used, instead of percentage bars (which the developer community tends to distrust). The meter always has a text alternative ("daily").

```
03 / stack
What I work with                          ●●● daily  ●●○ often  ●○○ sometimes

┌─ languages ───────────┐ ┌─ frontend ────────────┐ ┌─ backend ─────────────┐
│ java ●●●  python ●●●  │ │ react ●●●             │ │ spring-boot ●●●       │
│ typescript ●●●        │ │ angular ●○○           │ │ django ●●●            │
│ sql ●●○               │ │                       │ │ graphql ●●●  node ●●○ │
│                       │ │                       │ │ fastapi ●○○           │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
┌─ data ────────────────┐ ┌─ cloud ───────────────┐ ┌─ ai ──────────────────┐
│ postgresql ●●○        │ │ aws ●●○               │ │ claude-code ●●●       │
│ redis ●○○             │ │ ci-cd ●●○             │ │                       │
│ rabbitmq ●○○          │ │                       │ │                       │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

### Contact

```
04 / contact
Let's talk.
Questions, ideas or a project in mind? My inbox is open.

╭────────────────────────────────────────────────╮
│ you@your-domain.dev                   [ Copy ] │
╰────────────────────────────────────────────────╯

  GitHub ↗     LinkedIn ↗
```

### Command Palette

```
╭──────────────────────────────────────────────────╮
│ > proj█                                          │
├──────────────────────────────────────────────────┤
│ ▸ Go to Projects                                 │
│   Open project: relay                            │
│   Open project: Praesto Sum                      │
│   Copy email                                     │
│   Replay the build                               │
╰──────────────────────────────────────────────────╯
```

### Project page

```
┌──────────────────────────────────────────────────────────────────────┐
│ fabiombarreto                    About  Projects  Stack  Contact  ⌘K │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ← All projects                                                     │
│                                                                      │
│   relay                                                              │
│   A Claude Code plugin that takes a feature from PRD to PR.          │
│   2026 · active · claude-code · node                    [ Repo ↗ ]   │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                                                              │   │
│   │                          cover 16:9                          │   │
│   │                                                              │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   The problem           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│   The solution          ░░░░░░░░░░░░░░░░░░░░░░░░░░                   │
│   Technical decisions   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │
│   Lessons learned       ░░░░░░░░░░░░░░░░░░░░░░                       │
│   ← Previous project                                Next project →   │
└──────────────────────────────────────────────────────────────────────┘
```

### Post-v1 sections

- **Experience:** a vertical timeline. Each entry shows the role, the organization, the dates and 1 to 3 highlights. Window commands: `experience.entry("Grupo Azul")`.
- **Articles and talks:** a list. Each row shows a type badge (`article`, `talk`), the title, the venue, the date, the language and `↗`. Window commands: `writing.item("…")`.
