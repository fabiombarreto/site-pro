# 02 · Experience

## Screen anatomy (desktop)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  File  Edit  View  Run  Help        your-name — portfolio        ⌘K  │
├────┬────────────────────┬──────────────────────────────────────────────────┤
│ ▣  │ EXPLORER           │ ▶ terminal  × │ README.md │                      │
│ ◎  │ ▾ PORTFOLIO        ├──────────────────────────────────────────────────┤
│ ◇  │   ✓ main.ts        │ portfolio › src › projects › renderProjects()    │
│ ▷  │   ✓ about.md       │                                                  │
│    │   ⠹ projects/      │ ❯ renderProjects({ featured: true });            │
│    │   ○ stack.json     │ [21:05:02] info  Fetching projects... 6 found    │
│    │   ○ contact.sh     │ [21:05:02] info  Creating Projects Section... ⠹  │
│    │                    │ ┌─ projects/ ─────────────────────────────────┐  │
│    │                    │ │ ░░░░░░░░░░░░ ░░░░░░░░░░░░ ░░░░░░░░░░░░      │  │
│    │                    │ │ ░░░░░░░░░░░░ ░░░░░░░░░░░░ ░░░░░░░░░░░░      │  │
│ ◐  │   README.md        │ │ (drawing cards...)                          │  │
├────┴────────────────────┴──────────────────────────────────────────────────┤
│ git:main  ● Running renderProjects()  3/5    Ln 128  1×  UTF-8  ◐ Midnight │
└────────────────────────────────────────────────────────────────────────────┘
```

| # | Area | Role | Behavior |
|---|---|---|---|
| 1 | **Title bar** | Identity and menus | Window dots (decorative, with easter eggs), working `File · Edit · View · Run · Help` menus, a centered `your-name — portfolio` title and a `⌘K` shortcut for the Command Palette. |
| 2 | **Activity bar** | Global shortcuts | Explorer (opens/closes the side menu), Search (opens the Command Palette), GitHub, Replay and, at the bottom, Theme. |
| 3 | **Explorer** (side menu) | Main navigation | A file tree where **each file is a section**. It shows each section's execution state (see below). |
| 4 | **Tabs** | Context | `terminal` is the main tab (the page). Project details and `README.md` open as new tabs. |
| 5 | **Breadcrumbs** | Where am I | The path of the visible section, such as `portfolio › src › projects › renderProjects()`. |
| 6 | **Console** (body) | The program | Where commands are typed and sections are rendered. |
| 7 | **Status bar** | Execution HUD and preferences | Program state, progress, position, speed and theme. |

> In the wireframes, personal content (name, projects, subtitle) is placeholder text.

### Title bar menus

| Menu | Items |
|---|---|
| File | Open Project… (filtered palette) · View Source ↗ · Download CV (if any) |
| Edit | Copy Email · Copy Link to Section |
| View | Command Palette · Toggle Explorer · Zen Mode · Theme ▸ |
| Run | Skip Current Block (`Esc`) · Run All · Replay · Speed ▸ |
| Help | Keyboard Shortcuts (`?`) · About This Site (`README.md`) |

### Explorer: files are sections

```
PORTFOLIO
▾ src
    ✓ main.ts           → Hero
    ✓ about.md          → About
    ⠹ projects/         → Projects (expands to one file per project)
    ○ stack.json        → Stack
    ○ contact.sh        → Contact
  README.md             → About this site (how it was built)
```

| State | Look | Meaning |
|---|---|---|
| Pending | `○` and dimmed text | The section has not run yet |
| Running | `⠹` spinner | The section is being rendered right now |
| Done | green `✓` | The section has been rendered |
| Active | selection background and an accent bar on the left | The section is on screen (*scroll-spy*) |

Clicking a pending file runs every section up to it in turbo mode and scrolls there.

### Status bar

| Side | Item | Role |
|---|---|---|
| Left | `git:main` | Link to the site's GitHub repository |
| Left | `○ Idle` · `● Running renderProjects()` · `✓ Ready` | Program state (the reel's "HUD") |
| Left | `3/5` | Sections executed |
| Right | `Ln 128` | Scroll position shown as a "line" (a playful detail) |
| Right | `1×` | Animation speed. Clicking cycles through `1×`, `2×` and `∞` (instant) |
| Right | `UTF-8` | Decorative, as in IDEs |
| Right | `◐ Midnight` | Theme. Clicking opens the theme list |

Notifications appear as IDE-style toasts in the bottom-right corner (e.g. `✔ Email copied`).

---

## First-visit script

### Scene 0: loading

- The IDE chrome appears immediately. In the Explorer, every file is `○ pending`, and the status bar shows `○ Idle`.
- The console is empty, with the cursor blinking on the first line: `❯ █`

### Scene 1: boot and hero

```
❯ startSite();
[21:04:31] info   Initializing application...
[21:04:31] info   Loading modules [██████████████████] 5/5
[21:04:32] info   Rendering Hero Section... ⠹
```

The hero frame is drawn and the content appears inside it: an ASCII banner with the name, the photo (first as ASCII, then the real photo), the title, the subtitle and the links. Details in [03 · Wireframes](03-design-system.md#wireframes).

```
✔ Hero Section created. (1.21s)

❯ █
  // scroll to continue ↓
```

### Scene 2: the visitor scrolls → Projects

```
❯ renderProjects({ featured: true });
[21:05:02] info   Fetching projects... 6 found
[21:05:02] info   Creating Projects Section... ⠹
```

The card grid is drawn: frame → `░` placeholders with their dimensions → image, title, description and tags, one card at a time.

```
✔ Projects Section created. (0.92s)

❯ █
```

> **Design note:** in the original brief, *"Creating Projects Section..."* was the typed command. Here, what gets **typed** is always a function call (`renderProjects();`), and *"Creating Projects Section..."* is the **log output**. This way every section follows the same pattern as `startSite();` → *"Initializing application..."*.

### Scenes 3 to 5: the remaining sections

They follow the same grammar (below), each with its own output format (see the section map).

### Final scene: the program ends

```
❯ renderContact();
[21:07:05] info   Opening channels...
  (...)
✔ Contact Section created. (0.64s)

✔ Build complete — 5 sections rendered in 6.84s
  [ ↻ Replay ]   [ ⌘K Command Palette ]   [ ↑ Back to top ]

❯ █
```

In v1.1, this last prompt accepts real commands (see [Interactive terminal](#interactive-terminal-v11)).

---

## Anatomy of an execution block

Every section follows the same structure. This repetition is what makes the site feel like a program:

```
❯ <function call>                          ← 1. typed character by character, with syntax highlighting
[hh:mm:ss] info   <preparation log>        ← 2. zero to two log lines
[hh:mm:ss] info   Rendering <Section>... ⠹ ← 3. log with a spinner while the content is drawn
<TUI content>                              ← 4. real HTML, revealed with effects
✔ <Section> Section created. (0.84s)       ← 5. confirmation with the execution time

❯ █                                        ← 6. new prompt, waiting for the next scroll
```

## Section and command map

| # | Section | Explorer file | Typed command | Logs | Output format |
|---|---|---|---|---|---|
| 1 | Hero | `main.ts` | `startSite();` | Initializing application… · Loading modules… · Rendering Hero Section… | ASCII name banner, photo (ASCII → photo), title, subtitle, links |
| 2 | About | `about.md` | `renderAbout();` | Reading about.md… | Rendered Markdown (headings with `#`, lists with `-`) |
| 3 | Projects | `projects/` | `renderProjects({ featured: true });` | Fetching projects… N found · Creating Projects Section… | Grid of clickable TUI cards |
| 4 | Stack | `stack.json` | `renderStack();` | Resolving dependencies… | `npm ls`-style tree |
| 5 | Contact | `contact.sh` | `renderContact();` | Opening channels… | Clickable commands (`$ open github`) and a copyable email |

**Post-v1** (decision D4): **Experience** (`experience.log`, `renderExperience();`, a `git log --graph`-style graph) and **Articles and talks** (`writing/`, `renderWriting({ limit: 5 });`, an `ls -la`-style listing). Their specs stay in these docs for later. See [05 · Content](05-content.md).

## Behavior rules

| Rule | Description |
|---|---|
| **Trigger** | The next block starts when the waiting prompt (`❯ █`) crosses ~70% of the viewport height. Without scrolling, the program stays idle at the prompt, exactly like a terminal waiting for input. |
| **Scroll hint** | If the visitor stays still for ~4 s after the hero, a dimmed comment appears: `// scroll to continue ↓`. It disappears on the first scroll. |
| **Order** | Blocks always run in order, one at a time. The program is single-threaded. |
| **Reserved space** | Each section takes its final height from the start. This makes the page scrollable, avoids layout shifts and keeps the content in the HTML for SEO. Before a block runs, its area is just empty terminal background. |
| **Fast scrolling (turbo)** | If the visitor scrolls past blocks that have not run yet, they are queued and run accelerated (5–10×) until they catch up with what is on screen. |
| **Never hijack scrolling** | The runtime never moves the page on its own, except when the visitor asks: a click in the Explorer or the palette, a deep link, or Replay. |
| **Skip** | `Esc`, the `» Skip` button (next to the active prompt) or a tap on the running block finishes the current block immediately. |
| **Run all** | `Run › Run All` (or the palette) renders every section at once. |
| **Deep links** | Arriving via `/#projects` or clicking in the Explorer runs everything before the target in turbo mode and scrolls to it. |
| **Scrolling up** | Sections that already ran stay as they are. Nothing animates again. |
| **Immediate interaction** | Content is clickable as soon as it is drawn, even while the block is still finishing. |
| **Revisits** | Every visit plays the full animation again, reloads included (decision **D6**). The only exception is a visitor who set the speed to `∞`: that choice is saved in the browser and kept. |
| **Reduced motion** | With `prefers-reduced-motion`, everything appears ready, with no typing and a steady cursor. |
| **No JavaScript** | The whole site appears statically in its final state, with the logs as plain text. |
| **Background tab** | Execution pauses while the tab is hidden and resumes when the visitor returns. |

---

## IDE interactions

### Command Palette (`Ctrl/⌘ + K` or `Ctrl/⌘ + Shift + P`)

```
╭──────────────────────────────────────────────╮
│ > proj█                                      │
├──────────────────────────────────────────────┤
│ ▸ Go to: Projects                    Ctrl+3  │
│   Open project: project-name                 │
│   Open project: another-project              │
│   Run: Replay                                │
╰──────────────────────────────────────────────╯
```

Planned commands: `Go to: <section>`, `Open project: <name>`, `Run: Skip`, `Run: Run all`, `Run: Replay`, `Speed: 1× / 2× / instant`, `Theme: <theme>`, `Copy email`, `Open: GitHub / LinkedIn / …`. Search is fuzzy.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Esc` | Skip the current block |
| `Ctrl/⌘ + K` | Open the Command Palette |
| `Ctrl/⌘ + B` | Show/hide the Explorer |
| `Ctrl/⌘ + 1…5` | Go to section 1…5 |
| `?` | Show the shortcut list |

### Projects open as tabs

Clicking a project card **opens a file**: a `project-name.md` tab appears, showing the project detail page rendered as a Markdown file inside the IDE (line numbers in the gutter, headings with `#`, links to the repository and the demo). The page has its own URL (`/projects/project-name`), which helps SEO and sharing. Closing the tab returns to the terminal at the same position.

Decided (**D5**): internal pages. Cards still carry direct shortcuts to the repository and the demo.

### Micro-interactions

- **Card hover and focus:** the frame switches from a single line (`─`) to a double line (`═`) in the accent color, and the title turns to inverse video, like focus in a TUI. Keyboard focus looks the same.
- **Links:** `[ GitHub ↗ ]`, underlined on hover. External links always carry `↗`.
- **Copy email:** one click copies it and shows a `✔ Email copied to clipboard` toast.
- **Text selection:** uses the IDE selection color (translucent blue).
- **Window dots (easter eggs):** the red one "exits" the program (a `Process exited with code 0` screen + `[ Restart ]`), the yellow one collapses the Explorer and the green one turns on Zen mode (hides the chrome).

### Interactive terminal (v1.1)

Decided (**D7**): not in v1; it comes after launch.

The last prompt accepts real commands: `help`, `ls`, `cd projects`, `open <project>`, `theme <name>`, `clear`, `replay`, `contact`. There are also easter eggs such as `sudo hire-me` or `rm -rf /`, with tongue-in-cheek answers. `Tab` autocompletes and `↑` walks the history.

---

## Responsive

| Width | Chrome | Body |
|---|---|---|
| ≥ 1280 px | Full: activity bar + open Explorer (+ optional minimap) | 3-column project grid |
| 1024–1279 px | Activity bar + collapsible Explorer (open by default) | 2 columns |
| 768–1023 px | Activity bar; the Explorer becomes an overlay drawer | 2 columns |
| < 768 px | Compact title bar (☰ · title · ⌘K), no activity bar, Explorer as a drawer, reduced status bar | 1 column, compact ASCII banner, 13–14 px font, no timestamps in the logs, tap on a block = skip |

```
┌──────────────────────────────────────┐
│ ☰   your-name — portfolio         ⌘K │
├──────────────────────────────────────┤
│ ❯ startSite();                       │
│ info  Initializing application...    │
│ info  Rendering Hero Section... ⠹    │
│ ╭─ hero ───────────────────────────╮ │
│ │ ┌────────┐                       │ │
│ │ │ ▓▓▓▓▓▓ │  YOUR NAME            │ │
│ │ │ ▓▓▓▓▓▓ │  Software Engineer    │ │
│ │ └────────┘                       │ │
│ │ // subtitle in one or            │ │
│ │ // two lines                     │ │
│ │ [ projects ↓ ] [ GitHub ↗ ]      │ │
│ ╰──────────────────────────────────╯ │
│ ✔ Hero Section created. (1.2s)       │
│ ❯ █                                  │
├──────────────────────────────────────┤
│ ✓ Ready  1/5                UTF-8  ◐ │
└──────────────────────────────────────┘
```

## Other pages

- **404:** `Error: ENOENT: no such file or directory, open '/typed-path'`, followed by a suggestion (`Did you mean: /projects ?`) and `[ cd ~ ]` to go back home.
- **Project detail:** see [Projects open as tabs](#projects-open-as-tabs).
