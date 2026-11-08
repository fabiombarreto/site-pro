# 02 · Experience

## Screen anatomy (desktop, after the hero is built)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ fabiombarreto           About   Projects   Stack   Contact     ⌘K  ◐  GitHub │
├──────────────────────────────────────────────────────────────────────────────┤
│  ▒▒▓▓▒▒                                                                      │
│                                                         ┌───────┐            │
│  ██ Fabio ██████████████████████                         │   ◯   │            │  ← the name in giant
│  ██ Barreto. ████████████████████████████████████████████│  /█\  │            │    type, on two lines
│                                                         │ / █ \ │            │
│  Senior Software Engineer                               │   █   │     ▒▒▓▓▒▒ │
│  12+ years shipping full-stack apps with                │  / \  │            │
│  React, Python and Java. Now building                   │  │ │  │            │
│  AI-assisted dev workflows.                             │  │ │  │            │
│                                                         │  │ │  │            │
│  [ See my work ↓ ]   GitHub ↗   LinkedIn ↗              │  │ │  │            │
│                ╭────────────────────────────────────╮   │  │ │  │            │
│                │ ✓ 1/5 sections   ❯ █   scroll ↓  1× │   │  │ │  │            │
│                ╰────────────────────────────────────╯   │  │ │  │            │
└─────────────────────────────────────────────────────────┼──┼─┼──┼────────────┘
                                                          └─ the photo's legs continue into About
```

The hero is a **banner**: the name in giant type on two lines, with a full-body, cut-out photo standing in front of the letters (over the end of `Barreto.` on desktop). The role, the intro and the buttons sit at the bottom left. The photo is taller than the first screen, so its legs continue into About, and the page reads as one piece instead of a stack of boxes (decision **D20**).

| # | Area | Role | Behavior |
|---|---|---|---|
| 1 | **Nav bar** | Identity and navigation | Name on the left, section links in the middle, `⌘K`, theme toggle and GitHub on the right. Transparent at the top of the page, translucent with blur after scrolling. The link of the visible section is highlighted (*scroll-spy*). |
| 2 | **Sections** (the page) | The content | A modern, readable page: hero, about, projects, stack and contact. This is what stays on screen. |
| 3 | **Command dock** | Build HUD and controls | A pill at the bottom center. It types each section command, shows progress and holds Skip, speed and Replay. It collapses into a small button once the whole site is built. |
| 4 | **Build windows** | The show (animation only) | Appear only while a section is being built, over the section's place. See [Build window](#build-window). |
| 5 | **Footer** | Closing | Build summary with Replay, a link to the source and the copyright line. |

> Wireframes use the content draft from [09](09-content-draft.md) as illustrative text. They define structure and behavior, not the visual design, which is done in Claude Design.

### Page overview (final layout)

```
┌────────────────────────────────────────────────────────────┐
│ fabiombarreto            About Projects Stack Contact ⌘K ◐ │  nav (sticky)
├────────────────────────────────────────────────────────────┤
│ ▒▒▓▒▒                                    ┌─────┐           │
│ ██ Fabio Barreto. ███████████████████████│  ◯  │████████   │  hero: a banner
│ Senior Software Engineer                 │ /█\ │           │
│ Intro in two or three lines.             │  █  │    ▒▒▓▓▒▒ │
│ [ See my work ↓ ]  GitHub  LinkedIn      │ / \ │           │
│                                          │ │ │ │           │  ← no hard border:
│ 01 / about                               │ │ │ │           │    the photo and the
│ About me                                 └─────┘           │    glows cross it
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │  about
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                    ▒▒▓▓▒▒ │
│ [ GitHub ↗ ]  [ LinkedIn ↗ ]                               │
│                                                            │
│ 02 / projects                                              │  projects
│ Selected work                                              │
│ ┌─────────────────────────┐                                │
│ │▓▓▓▓ project             │ ┌─────────────────────────┐    │
│ └─────────────────────────┘ │▓▓▓▓ project             │    │  staggered: the right
│ ┌─────────────────────────┐ └─────────────────────────┘    │  column sits lower
│ │▓▓▓▓ project             │ ┌─────────────────────────┐    │
│ └─────────────────────────┘ │▓▓▓▓ project             │    │
│ 03 / stack                  └─────────────────────────┘    │  stack: the last cover
│ What I work with                                           │  overlaps its top
│ ┌─ languages ────┐ ┌─ frontend ─────┐ ┌─ backend ──────┐   │
│ │ java · python  │ │ react · angular│ │ django · node  │   │
│ └────────────────┘ └────────────────┘ └────────────────┘   │
│ ▒▒▓▓▒▒                                                     │
│ 04 / contact                                               │  contact: the giant
│ ██ Let's talk. ██████████████                              │  type comes back
│ [ GitHub ↗ ]  [ LinkedIn ↗ ]    Brazil (UTC-3)             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Built live in 9.6s · ↻ Replay             Source ↗  © 2026 │  footer
└────────────────────────────────────────────────────────────┘
                                                      ╭─────╮
                                                      │ ❯_  │   dock, collapsed
                                                      ╰─────╯
```

### One continuous page

The sections are built one at a time, but the finished page reads as a single piece (decision **D20**):

- **Background:** one continuous field behind the whole page: the theme background, a few large, soft glows in the accent blues and a fine film grain. Each glow sits across the boundary between two sections, so no section starts on a blank band.
- **The photo crosses into About.** The full-body hero photo is taller than the first screen, and its legs continue next to the About text.
- **Images take over from Projects on.** The project grid is staggered (the right column sits lower), and the last cover overlaps the top of Stack.
- **The giant type comes back in Contact**, closing the page the way the hero opened it.
- Sections keep their eyebrows (`02 / projects`) and their spacing, but they have no borders, bands or background of their own.

The **dot grid** now belongs to the build layer: it shows inside build windows, as the canvas each window draws on, and disappears with them.

### Nav bar

| Item | Behavior |
|---|---|
| `fabiombarreto` | Goes to the top of the page |
| About · Projects · Stack · Contact | Scroll to the section at once; sections before it that have not been built yet are queued and built in turbo, and then the target builds |
| `⌘K` | Opens the Command Palette (shows `Ctrl K` on Windows and Linux) |
| `◐` | Switches between the Midnight (dark) and Daylight (light) themes |
| GitHub | Opens the owner's GitHub profile |

On mobile, the links move into a `☰` menu.

### Command dock

| State | What it shows |
|---|---|
| **Boot** | A small terminal in the middle of the first screen: `❯ █`, then `startSite();` and its logs. It folds into the dock when the hero window opens |
| **Typing** | The section command being typed, then one log line. The dock grows to 2 lines while this happens |
| **Building** | `● Building projects…`, `» Skip` and the speed (`1×`) |
| **Idle** | `✓ 2/5 sections   ❯ █   scroll ↓`: waiting for the visitor to scroll |
| **Done** | `✔ Build complete: 5 sections in 9.6s   ↻ Replay`, for about 4 s |
| **Collapsed** | A small round `❯_` button at the bottom right. It opens the Command Palette (and, in v1.1, the interactive dock) |
| **Reduced motion** | `✔ Ready · motion reduced   ▶ Play build` |

Clicking the speed cycles through `1×`, `2×` and `∞` (instant). The choice is saved in the browser. Toasts (such as `warn  Window closed. Building anyway...`) appear just above the dock.

### Build window

A build window is an **overlay** around the place a section occupies on the page. It has three parts:

| Part | Content |
|---|---|
| **Title bar** | Three neutral dots, the section's file name (`projects.tsx`) and the progress (`● building 3/5`) |
| **Command bar** | The window's own commands, typed one after the other: `projects.card("relay")`. This is where the window "executes" the section |
| **Body** | The section itself, at its final size and position. Elements appear here as the commands run |

The title bar and the command bar sit in the section's top padding, so the content never moves. When a section is taller than the screen, the title bar and command bar stick under the nav while the visitor scrolls through it. When the section is done, the chrome fades and only the section stays.

---

## First-visit script

### Scene 0: loading

The first screen is empty, except for the dot grid and a small **boot terminal** in the middle, with the cursor blinking. Then the command starts being typed:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│         ┌─ ● ● ●  terminal ────────────────────────┐         │
│         │ ❯ startSi█                               │         │
│         │                                          │         │
│         │                                          │         │
│         └──────────────────────────────────────────┘         │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Scene 1: boot

```
┌──────────────────────────────────────────────────────────────┐
│ fabiombarreto                About  Projects  Stack  Contact │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│      ┌─ ● ● ●  terminal ──────────────────────────────┐      │
│      │ ❯ startSite();                                 │      │
│      │ info  Initializing application...              │      │
│      │ info  Opening hero.tsx... ⠹                    │      │
│      └────────────────────────────────────────────────┘      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

`startSite();` is typed, two log lines appear and the nav bar slides in from the top.

### Scene 2: the hero window

The terminal folds into the **command dock** at the bottom, and the `hero.tsx` window opens out of it, framing the place where the hero will live. Its command bar types one command per element, and each element is created where it will stay:

| Command | What appears |
|---|---|
| `hero.title("Fabio Barreto.")` | The headline, typed letter by letter in giant banner type, on two lines |
| `hero.role("Senior Software Engineer")` | The role, decoded from scrambled characters |
| `hero.photo("fabio.png")` | A skeleton with its dimensions, then the full-body cut-out photo, emerging from an ASCII version of itself (D12), in front of the name. Its selection box runs past the bottom of the window, into About's place |
| `hero.intro("12+ years shipping…")` | Skeleton lines that resolve into the intro text |
| `hero.links(["GitHub", "LinkedIn"])` | The buttons, popping in one after the other |

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ fabiombarreto           About   Projects   Stack   Contact     ⌘K  ◐  GitHub │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─ ● ● ●  hero.tsx ─────────────────────────────────────── ● building 2/5 ─┐ │
│ │ ❯ hero.role("Senior Software Engineer")█                                 │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ ██ Fabio Barreto. ██████████████████████████████┌┄┄┄┄┄┄┄┄┐█████████████  │ │
│ │ ████████████████████████████████████████████████┆░░░░░░░░┆█████████████  │ │
│ │ ┏━ role ━━━━━━━━━━━━━━━━━┓                      ┆░░░░░░░░┆               │ │
│ │ ┃Senior Softw@r# E%g!n<er┃                      ┆░░░░░░░░┆               │ │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛                      ┆░░░░░░░░┆               │ │
│ │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░           ┆ 900×   ┆               │ │
│ │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                 ┆  1600  ┆               │ │
│ │  ░░░░░░░░░░░░░░░░░░░░                           ┆░░░░░░░░┆               │ │
│ └─────────────────────────────────────────────────┆░░░░░░░░┆───────────────┘ │
│                                                   └┄┄┄┄┄┄┄┄┘  ← runs past the window
│                ╭────────────────────────────────────────────╮                │
│                │ ● Building hero…               » Skip   1× │                │
│                ╰────────────────────────────────────────────╯                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Scene 3: the hero is done

The dock confirms `✔ Hero Section created. (2.9s)`. The window's title bar, command bar, border and shadow fade away, and the hero stays exactly as it was built (see [Screen anatomy](#screen-anatomy-desktop-after-the-hero-is-built)). The dock goes idle: `✓ 1/5 sections   ❯ █   scroll ↓`.

### Scene 4: the visitor scrolls → About

The dock types `renderAbout();` and logs `info  Reading about.md...`. The `about.md` window builds the heading, three short paragraphs (skeleton lines → text) and the GitHub and LinkedIn buttons.

### Scene 5: the visitor scrolls → Projects

The dock types `renderProjects();` and logs `info  Fetching projects... 4 found`. The `projects.tsx` window builds the heading and then the four cards of the 2 × 2 grid, one command per card. Each card goes through the same steps: selection box → skeleton → cover image → title → summary → tags.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ fabiombarreto           About   Projects   Stack   Contact     ⌘K  ◐  GitHub │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─ ● ● ●  projects.tsx ─────────────────────────────────── ● building 3/5 ─┐ │
│ │ ❯ projects.card("ai-track-record")█                                      │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │                                                                          │ │
│ │  Selected work                                                           │ │
│ │  Things I built and what I learned.                                      │ │
│ │                                                                          │ │
│ │  ┌────────────────────────────────┐  ┏━ card ━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ │
│ │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ┃░░░░░░░░░░░ 640×360 ░░░░░░░░░░░░┃  │ │
│ │  │ relay                          │  ┃ AI Track Rec█                  ┃  │ │
│ │  │ PRD to pull request            │  ┃ ░░░░░░░░░░░░░░░░░░░░░░░░░░     ┃  │ │
│ │  │ claude-code · ai-agents · node │  ┃ ░░░░░░░░░░░░░░                 ┃  │ │
│ │  └────────────────────────────────┘  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ │
│ │                                                                          │ │
│ │  2 more cards below ↓                                                    │ │
│ │              ╭────────────────────────────────────────────╮              │ │
│ │              │ ● Building projects…           » Skip   1× │              │ │
│ │              ╰────────────────────────────────────────────╯              │ │
└──────────────────────────────────────────────────────────────────────────────┘
```

In v1, cards are built one after the other with a short overlap. In v1.1 (**D8**), 2 or 3 labeled agent cursors will build cards at the same time, on desktop only.

### Scenes 6 and 7: Stack and Contact

They follow the same grammar: `renderStack();` builds the grouped technologies, and `renderContact();` builds the call to action, the GitHub and LinkedIn links and the location line.

### Final scene: the build is complete

```
✔ Contact Section created. (1.84s)
✔ Build complete: 5 sections in 9.6s   ↻ Replay
```

After about 4 s, the dock collapses into the `❯_` button. The footer keeps the summary: `Built live in 9.6s · ↻ Replay`.

---

## Anatomy of a section build

Every section follows the same structure. This repetition is what makes the site feel like it is being built by commands:

```
dock     ❯ renderProjects();                    ← 1. the section command, typed in the dock
dock     info  Fetching projects... 4 found     ← 2. one log line
window   ● ● ●  projects.tsx                    ← 3. a build window opens over the section's place
window   ❯ projects.heading("Selected work")    ← 4. element commands, each creating one element
window   ❯ projects.card("relay")
dock     ✔ Projects Section created. (2.31s)    ← 5. confirmation with the build time
page     (the window fades; the section stays)  ← 6. the final, readable section
dock     ✓ 3/5 sections   ❯ █                   ← 7. waiting for the next scroll
```

## Section and command map

| # | Section | Dock command | Log | Window | Window commands | Final layout |
|---|---|---|---|---|---|---|
| 1 | Hero | `startSite();` | Initializing application… · Opening hero.tsx… | `hero.tsx` | `title`, `role`, `photo`, `intro`, `links` | A banner: the giant name on two lines, the full-body photo in front of it and running into About, and role, intro and buttons at the bottom left |
| 2 | About | `renderAbout();` | Reading about.md… | `about.md` | `heading`, `text`, `links` | A short introduction (under 100 words) and GitHub and LinkedIn buttons |
| 3 | Projects | `renderProjects();` | Fetching projects… 4 found | `projects.tsx` | `heading`, `card` × 4 | 2 × 2 grid of personal project cards with cover images |
| 4 | Stack | `renderStack();` | Resolving dependencies… | `stack.json` | `heading`, `group` × 6 | Group cards with technology chips |
| 5 | Contact | `renderContact();` | Opening channels… | `contact.tsx` | `heading`, `links`, `location` | A call to action, GitHub and LinkedIn buttons, and `Brazil (UTC-3)` |

**Post-v1** (decision D4): **Experience** (`experience.log`, `renderExperience();`, a vertical timeline) and **Articles and talks** (`writing.md`, `renderWriting();`, a list with type badges). See [05 · Content](05-content.md).

## Behavior rules

| Rule | Description |
|---|---|
| **Trigger** | The next section build starts when the top of that section crosses ~75% of the viewport height. Without scrolling, the dock waits at `❯ █`, like a terminal waiting for input. |
| **Scroll hint** | If the visitor stays still for ~4 s after the hero, the `scroll ↓` hint in the dock pulses gently. |
| **Order** | Sections are always built in order, one at a time. Inside a section, element steps may overlap. |
| **Reserved space** | Each section takes its final height from the start, so the page scrolls normally and nothing shifts. Before its build, a section's content is laid out but invisible, and a faint dashed outline with the window name (`projects.tsx`) marks the area. |
| **The final layout never moves** | Windows, cursors and selection boxes are overlays. Elements animate in place, using only transform, opacity and clip-path. |
| **Fast scrolling (turbo)** | If the visitor scrolls past sections that have not been built, they are queued and built accelerated (5×, the pace approved in prototype v2) until they catch up with what is on screen. |
| **Never hijack scrolling** | The runtime never moves the page on its own, except when the visitor asks: a click in the nav or the palette, a deep link, or Replay. |
| **Skip** | `Esc`, the `» Skip` button in the dock, or a click on the window's title bar or command bar finishes the current section immediately. While the mobile menu is open, `Esc` only closes the menu. |
| **Run all** | `Shift + Esc` or `Run all` in the palette builds every remaining section at once. |
| **Deep links** | Arriving via `/#projects` goes to the target at once, through the browser's own anchor navigation; everything before it is built in turbo mode, in order, and then the target builds at normal speed. |
| **Keyboard focus** | When keyboard focus enters a section that has not been built, that section and every section before it are finished instantly, so sections stay in order. Focus in the nav during the boot finishes the hero. |
| **Scrolling up** | Sections that are already built stay as they are. Nothing animates again. |
| **Immediate interaction** | Elements are clickable as soon as they exist, even while their window is still open. Clicks on the window body go through to the page. |
| **Resize during a build** | When the viewport width changes, the current section finishes instantly (the overlay would no longer match), and the next ones build normally. Height-only changes, such as a phone's address bar showing or hiding, do not count. |
| **Revisits** | Every visit plays the full build again, reloads included (decision **D6**). The only exception is a visitor who set the speed to `∞`: that choice is saved in the browser and kept. |
| **Reduced motion** | With `prefers-reduced-motion`, there are no windows and no typing. Everything appears ready, and the dock offers `▶ Play build` for those who want to watch it anyway. |
| **No JavaScript** | The whole site appears statically in its final state. There is no dock and no window. |
| **Background tab** | The build pauses while the tab is hidden and resumes when the visitor returns. |

---

## Interactions

### Command Palette (`Ctrl/⌘ + K`)

Opened from the shortcut, the `⌘K` button in the nav or the collapsed dock. Wireframe in [03](03-design-system.md#command-palette).

Planned commands: `Go to <section>`, `Open project: <name>`, `Run all`, `Replay the build`, `Speed: 1× / 2× / instant`, `Theme: Midnight / Daylight`, `Open GitHub / LinkedIn`. Search is fuzzy.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Esc` | Skip the current section build |
| `Shift + Esc` | Run all: build every remaining section |
| `Ctrl/⌘ + K` | Open the Command Palette |
| `?` | Show the shortcut list |

Section shortcuts such as `Ctrl + 1…5` were dropped: browsers use them to switch tabs.

### Project pages

Decided (**D5**): internal pages. Clicking a card opens `/projects/<slug>`. The dock types a quick `open("relay");` and the card grows into the page header (a view transition). The page itself is a modern article: cover, summary, metadata, the story and links (wireframe in [03](03-design-system.md#project-page)). The back button returns to the grid at the same position. Cards also carry a direct `repo ↗` shortcut.

### Micro-interactions

- **Card hover and focus:** the card lifts slightly, its border takes the accent color and the cover zooms in a little. Keyboard focus looks the same, plus the focus ring.
- **Buttons:** the primary button is filled with the accent; secondary buttons are outlined.
- **Links:** underlined on hover. External links always carry `↗`.
- **Text selection:** uses an accent-tinted selection color.
- **Window dots (easter egg):** clicking the first dot of a build window "closes" it. The dock logs `warn  Window closed. Building anyway...` and the section finishes instantly.

### Interactive dock (v1.1)

Decided (**D7**): not in v1; it comes after launch.

The collapsed `❯_` button opens a real prompt in the dock: `help`, `ls`, `open <project>`, `theme <name>`, `replay`, `contact`, plus easter eggs such as `sudo hire-me` or `rm -rf /`, with tongue-in-cheek answers. `Tab` autocompletes and `↑` walks the history.

---

## Responsive

| Width | Page | Build layer |
|---|---|---|
| ≥ 1024 px | Hero banner with the name on two lines and a 960 px photo; staggered 2 × 2 project grid; stack in 3 columns | Full window chrome; agent cursors in v1.1 (D8) |
| 768–1023 px | The same banner with a 760 px photo; staggered 2-column grid; stack in 2 columns | Full window chrome, no agent cursors |
| < 768 px | Nav with `☰` menu; the name on two lines, the photo (480 px) below it on the right, next to the role, and the intro and buttons below; 1 column | Windows with a single compact title bar that shows the current command; the dock spans the width (minus 16 px each side) and shows only the status and `» Skip`; a tap on the window's title bar skips |

```
┌────────────────────────────────────┐    ┌────────────────────────────────────┐
│ fabiombarreto                 ◐  ☰ │    │ fabiombarreto                 ◐  ☰ │
├────────────────────────────────────┤    ├────────────────────────────────────┤
│┌─ ❯ hero.role("Senior…") ─── 2/5 ─┐│    │ ▒▒▓▒▒                              │
││ █ Fabio ████      ┌┄┄┄┄┄┄┄┐      ││    │ █ Fabio ████                       │
││ █ Barreto. ███████┆░░░░░░░┆██    ││    │ █ Barreto. █████████               │
││                   ┆░░░░░░░┆      ││    │                    ┌──────┐        │
││┏━ role ━━━━━━━━┓  ┆░░░░░░░┆      ││    │ Senior Software    │  ◯   │        │
││┃Senior Softw@r#┃  ┆ 900×  ┆      ││    │ Engineer           │ /█\  │        │
││┗━━━━━━━━━━━━━━━┛  ┆  1600 ┆      ││    │                    │ / \  │        │
││ ░░░░░░░░░░░░░░    ┆░░░░░░░┆      ││    │                    │ │ │  │        │
││ ░░░░░░░░░░░░      ┆░░░░░░░┆      ││    │                    └──────┘        │
│└──────────────────┆░░░░░░░┆──────┘│    │ 12+ years shipping full-stack…     │
│                   └┄┄┄┄┄┄┄┘       │    │ [ See my work ↓ ]  GitHub ↗        │
│ ╭────────────────────────────────╮ │    │ ╭────────────────────────────────╮ │
│ │ ● Building hero…        » Skip │ │    │ │ ✓ 1/5   ❯ █         scroll ↓   │ │
│ ╰────────────────────────────────╯ │    │ ╰────────────────────────────────╯ │
└────────────────────────────────────┘    └────────────────────────────────────┘
               building                                   built
```

## Other pages

- **404:** the dock types `open("/typed-path");` and a small window opens with `Error: ENOENT: no such file or directory, open '/typed-path'`, a suggestion (`Did you mean /projects?`) and a `Go home` button. On this page, the window is the final state.
- **Project detail:** see [Project pages](#project-pages).
- **How this site was built:** not a separate page in v1. The site-pro project page tells the story (the build runtime, the design system, the stack and credits), and the footer's `Source ↗` links to the repository.
