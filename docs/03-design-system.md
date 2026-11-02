# 03 · Design System

> This is a starting proposal. Final colors, content and features are decided in **Stage 1 — Design project** (see [07](07-roadmap-and-decisions.md)).

## Visual direction

**Modern dark IDE + retro TUI.** The look is as restrained as a real IDE: neutral grays and high-contrast text. Color comes from *syntax highlighting* and log levels, not from a neon or cyberpunk look. The "wow" comes from motion and character drawing, not from heavy visual effects.

## Themes

Themes are sets of tokens (CSS custom properties). Visitors switch themes from the status bar or the Command Palette, and the choice is saved in the browser.

| Theme | Inspiration | Use |
|---|---|---|
| **Midnight** (default) | VS Code Dark Modern + IntelliJ New UI | The main theme and the site's identity |
| **Classic** (light) | Classic Eclipse / NetBeans | Alternative, for those who prefer a light background |
| **Phosphor** | Green phosphor CRT monitors | Easter egg (palette or `theme phosphor`): green monochrome, with scanlines and a slight glow |

### Color tokens

Every text/background pair used for content meets **WCAG AA (≥ 4.5:1)**. `--fg-subtle` is only for decorative elements (line numbers, `░` placeholders).

**Surfaces**

| Token | Midnight | Classic | Use |
|---|---|---|---|
| `--bg-chrome` | `#141519` | `#e4e5e9` | Title bar, activity bar |
| `--bg-sidebar` | `#18191e` | `#eeeff2` | Explorer |
| `--bg-editor` | `#1d1e24` | `#ffffff` | Console (body) |
| `--bg-surface` | `#23242b` | `#f6f7f9` | Cards, palette, menus, toasts |
| `--bg-line` | `#262830` | `#eef3fb` | Active line, list hover |
| `--bg-selection` | `#2f4a73` | `#cfe0fc` | Text selection, active Explorer item |
| `--border` | `#2c2e36` | `#d4d6dc` | Chrome dividers, frames at rest |

**Text**

| Token | Midnight | Classic | Use |
|---|---|---|---|
| `--fg` | `#d6d8de` | `#1f2328` | Main text |
| `--fg-muted` | `#8b8f9c` | `#59606b` | Secondary text, timestamps |
| `--fg-subtle` | `#5c606c` | `#9aa0aa` | Decorative only |

**Accent** (the site's signature color, open decision **D3**)

| Token | Midnight | Classic | Use |
|---|---|---|---|
| `--accent` | `#2563eb` | `#2563eb` | Status bar background, focus ring, active tab |
| `--accent-fg` | `#6ea8ff` | `#1d4ed8` | Links and highlighted text |
| `--on-accent` | `#ffffff` | `#ffffff` | Text on `--accent` |

**Syntax** (typed commands, code snippets, project details)

| Token | Midnight | Classic | Example |
|---|---|---|---|
| `--syn-keyword` | `#c792ea` | `#7f0055` | `const`, `await`, `return` |
| `--syn-function` | `#e5c07b` | `#795e26` | `renderProjects` |
| `--syn-string` | `#98c379` | `#2a00ff` | `"Software Engineer"` |
| `--syn-number` | `#f78c6c` | `#098658` | `2026`, `true` |
| `--syn-type` | `#4fd1c5` | `#267f99` | `Project`, `Promise` |
| `--syn-comment` | `#868b96` | `#3f7f5f` | `// scroll to continue` |
| `--syn-punct` | `#d6d8de` | `#1f2328` | `( ) { } ;` |

Classic's keyword, string and comment colors are a direct tribute to classic Eclipse.

**Log levels**

| Token | Midnight | Classic | Use |
|---|---|---|---|
| `--log-info` | `#60a5fa` | `#1d4ed8` | `info` |
| `--log-success` | `#4ade80` | `#15803d` | `✔ ... created.` |
| `--log-warn` | `#fbbf24` | `#a16207` | `warn` (used sparingly, for humor) |
| `--log-error` | `#f87171` | `#b91c1c` | `error` (404 page) |

## Typography

**A single monospaced family across the whole site**, chrome included, to keep the terminal feel.

| Item | Choice | Why |
|---|---|---|
| Main family | **JetBrains Mono** (OFL license, variable) | IntelliJ's font, with ligatures, great legibility and full coverage of box-drawing and block characters (`┌─┐ █▓▒░`), which is essential for the drawings to line up. |
| Fallback | `"JetBrains Mono", "Cascadia Code", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | Common terminal fonts on each system |
| Weights | 400 (text), 500 (active chrome), 700 (headings) and italic 400 (comments) | Few files, fast loading |
| ASCII banner | Generated with **figlet**: `ANSI Shadow` font on desktop, `Small` on mobile | The name drawn with `█╗╔═╝` is the most striking element of the hero |

### Scale

| Token | Desktop / mobile | Line height | Use |
|---|---|---|---|
| `--text-xs` | 12 / 12 px | 1.4 | Status bar, labels, timestamps |
| `--text-sm` | 13 / 13 px | 1.5 | Explorer, tabs, breadcrumbs, menus |
| `--text-md` | 15 / 14 px | 1.6 | Console, body text, cards |
| `--text-lg` | 18 / 16 px | 1.5 | Card titles, hero subtitle |
| `--text-xl` | 22 / 18 px | 1.4 | Section titles |
| `--text-2xl` | 32 / 24 px | 1.2 | Role/title in the hero |
| `--text-ascii` | 8–14 px (fitted to the width) | 1.0 | ASCII banner and images |

- Body text is at most **72ch** wide.
- Ligatures are on in code snippets and off in body text.

## Grid and spacing

- **Character grid:** inside the console, horizontal spacing uses `ch` and vertical spacing uses lines (`lh`), so everything lands on a terminal grid.
- **Chrome:** a 4 px scale (`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`).

| Element | Size |
|---|---|
| Title bar | 36 px tall |
| Activity bar | 48 px wide |
| Explorer | 240 px wide (resizable in v1.1) |
| Tabs | 36 px tall |
| Breadcrumbs | 24 px tall |
| Status bar | 24 px tall |
| Console | `2ch` padding, content at most ~120ch wide |

## TUI character kit

| Role | Characters |
|---|---|
| Single frame (default) | `┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼` |
| Rounded frame (cards, palette) | `╭ ╮ ╰ ╯` |
| Double frame (hover/focus) | `╔ ═ ╗ ║ ╚ ╝` |
| Fill and dithering | `█ ▓ ▒ ░` |
| Progress bar | `[██████████░░░░░░] 62%` |
| Spinner | `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` (fallback `\| / - \`) |
| Trees | `├── └── │ ├─┬` |
| Markers | `❯ ✔ ✖ ⚠ ● ○ ▸ ▾ ↗ ↓` |

## Iconography

- **IDE chrome:** [Codicons](https://github.com/microsoft/vscode-codicons), the VS Code icon set (CC BY 4.0, credited in the site's `README.md`). They feel authentic without using any brand.
- **Explorer:** file-type "badges" made of text and color (`TS`, `MD`, `{}`, `$_`) instead of third-party icons.
- **No logos** from VS Code, JetBrains, Eclipse, NetBeans or Google.

---

## Components

React components are rendered to static HTML at build time, and only hydrated where they need interactivity (see [06 · How React is used](06-architecture.md#how-react-is-used)).

### IDE chrome

| Component | Description | States and variants |
|---|---|---|
| `TitleBar` | Dots, menus, title, palette shortcut | Compact version on mobile |
| `Menu` | Title bar dropdown | open, item hover/focus, disabled |
| `ActivityBar` | Icon column | active item (accent bar on the left), hover, tooltip |
| `Explorer` / `FileItem` | Section tree | pending, running, done, active; folder open/closed |
| `TabBar` / `Tab` | Open tabs | active (accent underline), inactive, with close button |
| `Breadcrumbs` | Path of the visible section | — |
| `StatusBar` / `StatusItem` | Execution HUD and preferences | `Idle`, `Running`, `Ready`; clickable items with hover |
| `CommandPalette` | Command search | empty, filtering, no results |
| `Toast` | Bottom-right notification | info, success |

### Console

| Component | Description | States and variants |
|---|---|---|
| `PromptLine` | `❯` + command with syntax highlighting | waiting, typing, executed |
| `Cursor` | Blinking `█` block | blinking, solid (while typing), hidden |
| `LogLine` | `[hh:mm:ss] level message` | info, success, warn, error; with spinner or progress bar |
| `CompletionLine` | `✔ X Section created. (0.84s)` | — |
| `SkipButton` | `⏭ Skip` next to the active block | visible only while running |
| `BuildSummary` | Final summary + Replay | — |

### TUI (content)

| Component | Description | States and variants |
|---|---|---|
| `TuiFrame` | Frame with a title in its top border (`┌─ projects/ ──┐`) | single, rounded, double; rest, hover, focus |
| `TuiButton` / `TuiLink` | `[ View projects ↓ ]` | rest, hover (inverse video), focus, external (`↗`) |
| `Tag` | `#typescript` | — |
| `AsciiBanner` | Name in figlet | desktop, mobile |
| `AsciiImage` | Image that starts as ASCII and becomes the photo | ASCII, transition, photo |
| `ProjectCard` | Image, title, year, description, tags, links | rest, hover/focus (double frame) |
| `TreeView` | `npm ls`-style tree | — |
| `GitGraph` | `git log --graph`-style timeline | — |
| `ListTable` | `ls -la`-style listing | — |
| `ProgressBar` / `Spinner` | Log indicators | — |

---

## Wireframes

Personal content (name, subtitle, projects, experience) is placeholder text.

### Hero (desktop)

```
❯ startSite();
[21:04:31] info   Initializing application...
[21:04:31] info   Loading modules [██████████████████] 7/7
[21:04:32] info   Rendering Hero Section... ⠹
╭─ main.ts ─────────────────────────────────────────────────────────────╮
│                                                                       │
│  ┌──────────────────┐   ███  YOUR NAME AS ASCII ART    ███            │
│  │░░▒▒▓▓████▓▓▒▒░░░░│   ███  (figlet "ANSI Shadow")    ███            │
│  │░▒▓██████████▓▒░░░│                                                 │
│  │▒▓███▓▒░░▒▓███▓▒░░│   Software Engineer · Open Source               │
│  │▒▓██▓▒░░░░▒▓██▓▒░░│                                                 │
│  │░▒▓███▓▓▓▓███▓▒░░░│   // Subtitle: what you build, for whom,        │
│  │░░▒▓████████▓▒░░░░│   // and why it matters.                        │
│  └──────────────────┘                                                 │
│   photo: ASCII → real                                                 │
│                                                                       │
│  [ view projects ↓ ]  [ GitHub ↗ ]  [ LinkedIn ↗ ]  [ email ]         │
│                                                                       │
╰───────────────────────────────────────────────────────────────────────╯
✔ Hero Section created. (1.21s)

❯ █
  // scroll to continue ↓
```

- The name also exists as a real `<h1>` (the banner is decorative for screen readers).
- The title uses `--text-2xl`; the subtitle appears as a code comment (`--syn-comment`).

### Project card

At rest the frame is rounded (`╭─╮`). On hover and focus it becomes double (`╔═╗`) in the accent color.

```
╭────────────────────────────╮
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░ 640×360 ░░░░░░░░░ │   ← placeholder with its dimensions,
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │     then the real image
├────────────────────────────┤
│ project-name          2026 │
│ Short project description  │
│ in up to two lines.        │
│                            │
│ #typescript #react   ★ 128 │
│ [ repo ↗ ]  [ demo ↗ ]     │
╰────────────────────────────╯
```

### Stack (`npm ls` style)

Each item's "version" shows how often it is used, instead of percentage bars (which the developer community tends to distrust).

```
❯ renderStack();
[21:06:10] info   Resolving dependencies...
your-name@2026.11.0 /portfolio
├─┬ languages
│ ├── typescript@daily
│ ├── go@often
│ └── python@sometimes
├─┬ frontend
│ ├── react@daily
│ └── astro@often
├─┬ backend
│ ├── node@daily
│ └── postgres@often
└─┬ tools
  ├── docker@daily
  └── neovim@daily
✔ Stack Section created. (0.41s)
```

### Experience (`git log --graph` style)

```
❯ renderExperience();
[21:06:30] info   Reading git history...
* a1f3c9e (HEAD -> main)  2024–now    Senior Engineer @ Company C
|                                     Led migration X; created library Y.
* 7be21d4                 2021–2024   Software Engineer @ Company B
|\
| * 3c9d0aa               2022        Talk "Title" @ Event
|/
* 0f8e112                 2019–2021   Developer @ Company A
* 9d2b7f0                 2018        git init — first line of code
✔ Experience Section created. (0.57s)
```

### Articles and talks (`ls -la` style)

```
❯ renderWriting({ limit: 5 });
[21:06:52] info   Fetching posts... 3 found
total 3
-rw-r--r--  article en  2026-09-14  Latest article title              ↗
-rw-r--r--  talk    en  2026-06-02  Talk title @ Event                ↗
-rw-r--r--  article pt  2026-03-21  Another article                   ↗
drwxr-xr-x  all                 →   dev.to/your-user                  ↗
✔ Writing Section created. (0.38s)
```

### Contact

```
❯ renderContact();
[21:07:05] info   Opening channels...
╭─ contact.sh ───────────────────────────────────────────╮
│ $ echo $EMAIL    you@your-domain.dev        [ copy ]   │
│ $ open github    github.com/your-user       [ open ↗ ] │
│ $ open linkedin  linkedin.com/in/your-user  [ open ↗ ] │
│ $ open x         x.com/your-user            [ open ↗ ] │
╰────────────────────────────────────────────────────────╯
✔ Contact Section created. (0.64s)
```

The full IDE and mobile wireframes are in [02 · Experience](02-experience.md#screen-anatomy-desktop).
