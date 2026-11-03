# 01 · Concept

## Goal

Promote the site owner's work **to the developer community**, not to clients. Within a few seconds, a developer visiting the site should think:

1. *"What a great idea, I want to see how this was built."* → memorable and shareable
2. *"This person really knows front-end, motion and detail."* → technical credibility
3. *"Let me check the projects and the GitHub, and follow them."* → action

The page must also be **easy to read for anyone**, including people who never open an IDE or a terminal: designers, recruiters, friends of friends. The developer flavor lives in the animation and the details, never in the way the content reads.

## Scope

A **presentation-only** website, like an institutional site or a landing page: no login, no accounts, no backend and no API. This is the current goal, and it is not expected to change in the short term.

## Audience

| Who | What they look for | What the site gives them |
|---|---|---|
| Developers (peers) | Inspiration, interesting projects, code | A distinctive experience, links to repositories, a "how this site was built" page |
| Open source community | Contributions, technical profile | Projects, stack, history |
| Event organizers, podcasts and blogs | Someone to speak or write | Talks, articles, direct contact |
| Technical recruiters (secondary) | Experience, stack, seniority | Experience, stack, contact |

## Core concept

> **The site builds itself in front of you.** A typed command opens an application window, the window types its own commands, and each command creates one element of the section, live. When the section is done, the window steps aside and leaves a modern, readable page behind.

There are three visual layers, each with its own role:

| Layer | Inspiration | Role on the site |
|---|---|---|
| **Command dock** | Terminals, the reel's pill-shaped HUD, command launchers | A small terminal. It boots the site in the middle of the first screen (`startSite();`), then folds into a pill at the bottom. It types one command per section, shows progress and holds the controls (skip, speed, replay). |
| **Build windows** (animation only) | Desktop application windows, design-tool selection boxes | Each section command opens a window over the section's place. The window's command bar types element commands (`hero.title("…")`), and each one creates an element in real time. The window disappears when the section is done. |
| **Sections** (the final page) | Modern product and portfolio sites, the reel's final site | The real content: large type, a photo, project cards with images, clear buttons. This is what stays on screen and what visitors read. |

### How one section is built

1. The dock types the section command, such as `renderProjects();`, and logs one line.
2. A build window opens from the dock, framing the exact place where the section will live.
3. The window's command bar types element commands. Each one draws a selection box, shows a skeleton and then the finished element.
4. The dock confirms: `✔ Projects Section created. (2.31s)`.
5. The window's chrome fades. The section stays exactly where it was built, now part of a normal page.

## Reference analysis (Instagram reel)

The reference video (~56 s) shows a portfolio site being **rebuilt live by a swarm of agents**:

| Moment | What happens |
|---|---|
| 0–1 s | Black page, a faded logo in the middle and a flock of ~19 mouse cursors moving together. A pill-shaped HUD at the bottom reads *"Scanning page..."*. |
| ~2 s | The cursors spread out and start building: blue selection boxes with handles (like a design tool), gray placeholder blocks and text appearing inside the boxes. The HUD shows *"19 agents · 80/364 layers"*, a progress bar and a *Running* state. |
| 3–7 s | The hero is finished (name, photo, CTAs) and the cursors move on to the next section. |
| 7–50 s | As the page scrolls, each section (work, awards, about, experience, contact) is built the same way. |
| ~54 s | The HUD wraps up with *"Rebuilt by 19 agents in 51.4s"* and a *Replay* button. |

### What we take, and how it translates

| In the reel | On our site |
|---|---|
| Building the site **is** the show | Each section is built in front of the visitor, by commands they can read |
| A swarm of cursors (agents) | A terminal cursor types the section command, and the window types the element commands. Optionally, a few labeled **agent cursors** build elements in parallel (decision **D8**) |
| Selection boxes and placeholders before the content | Selection boxes with a label (`h1`, `card`, `img 800×800`) and skeletons with their dimensions, before each final element |
| The pill-shaped HUD | The **command dock**, a pill at the bottom of the screen |
| A section-by-section build, triggered by scrolling | One **section build** per section, triggered by scrolling |
| *Rebuilt by 19 agents in 51.4s · Replay* | `✔ Build complete: 5 sections in 9.6s` + `↻ Replay` |
| A modern, attractive final site | The final page is a modern site. Nothing about it needs a terminal to be understood |

### What we leave behind

- The video's pacing. There, the author controls everything; here, the visitor sets the pace by scrolling.
- Nineteen cursors at once. On a page people read, that is noise. At most a few agents, and only if the prototype proves them (D8).
- The design-tool look in the final page. Selection boxes and skeletons exist only while a section is being built.

## From the IDE concept to build windows

The first version of this concept (v1, approved on 2026-11-02) put the whole site inside an IDE: title bar, Explorer, tabs, a console as the page body and every section drawn as a text UI (TUI). On review, the owner found it **too niche and hard to read** for people who don't use IDEs or terminals.

Version 2 keeps what made v1 special (the blinking cursor, the typed function call, the site being drawn by the commands) and moves it into a **build layer that disappears**. What remains is a page anyone can scan. The v1 documents stay in the Git history (commit `7b147b0`).

## Visual references

| Reference | What it inspires |
|---|---|
| **Terminals** | The typed command, the blinking `█` cursor, the `info` logs, the `✔` confirmations |
| **Desktop application windows** | The build window: a title bar with the file name, a window that opens out of the dock and closes when its job is done |
| **Design tools** | Selection boxes with handles and labels, skeletons with dimensions, agent cursors with name tags |
| **Command launchers** | The dock as a floating pill and the Command Palette (`Ctrl/⌘ + K`) |
| **Modern product and portfolio sites** | The final layout: large display type, generous spacing, cards with images, soft depth |

## Design principles

1. **Content first, show second.** All content exists in the HTML from the start, and the animation is a layer on top. Skipping the animation is always one click or key away.
2. **Readable by anyone.** The final page reads like any good modern site. Developer flavor lives in the build layer and in small details, never in how the content is presented.
3. **Technical authenticity.** Commands are real, highlighted JavaScript calls, and they match the site's actual build script in the public repository. Logs are plausible. Shortcuts are real.
4. **Created, not faded in.** Every element appears through a creation gesture: selection box, skeleton, then content. No generic fade-up reveals.
5. **The final layout never moves.** Windows, cursors and selection boxes are overlays. Content is laid out at its final position from the first frame.
6. **Short rhythm.** The hero is complete in about 3 s and every other section is usable in ≤ 2.5 s. Visitors never wait to read.
7. **Accessible by default.** Reduced motion, keyboard navigation, AA contrast and screen readers.
8. **Inspired, not copied.** Our own window chrome, theme and identity, with no operating system or app branding, and our own pacing instead of the reel's.

## Non-goals

- Not a page selling services.
- No login, accounts, backend or API.
- Not a real terminal: it does not run visitors' commands in v1. The v1.1 interactive dock only runs the site's own commands (D7).
- No external CMS in v1. Content lives in the repository as Markdown/JSON.
- No 3D/WebGL in v1.

## How we will know it worked

| Metric | Target |
|---|---|
| Lighthouse (Performance, Accessibility, Best Practices, SEO) | ≥ 95 in all |
| Hero headline readable after load | ≤ 2 s |
| Visitors who reach the Projects section | > 60% |
| Use of "Skip" | Measured to tune the pace: heavy use means the build is too long |
| Readability outside development | Before launch, 3 people who don't code find the projects and the contact without help |
| Community reach | Qualitative: a "how I built this site" launch post, mentions and shares |
