# 01 · Concept

## Goal

Promote the site owner's work **to the developer community**, not to clients. Within a few seconds, a developer visiting the site should think:

1. *"What a great idea, I want to see how this was built."* → memorable and shareable
2. *"This person really knows front-end, motion and detail."* → technical credibility
3. *"Let me check the projects and the GitHub, and follow them."* → action

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

> **The site is a program. Visiting the site is running it.**

There are three visual layers, each with its own role:

| Layer | Inspiration | Role on the site |
|---|---|---|
| **IDE chrome**: title bar, activity bar, Explorer, tabs, status bar | VS Code, IntelliJ IDEA, Eclipse/NetBeans, Antigravity | Fixed frame and navigation. Shows the program state: running, ready, current section. |
| **Console**: the page body | IDE integrated terminals, the Node REPL, DevTools | Where commands are typed and logs appear. It narrates the experience. |
| **TUI output**: each section's content | htop, btop, lazygit, k9s, Midnight Commander, charm.sh | The real content (name, projects, links), drawn with terminal characters but built from real HTML. |

## Reference analysis (Instagram reel)

The reference video (~56 s) shows a portfolio site being **rebuilt live by a swarm of agents**:

| Moment | What happens |
|---|---|
| 0–1 s | Black page, a faded logo in the middle and a flock of ~19 mouse cursors moving together. A pill-shaped HUD at the bottom reads *"Scanning page..."*. |
| ~2 s | The cursors spread out and start building: blue selection boxes with handles (like a design tool), gray placeholder blocks and text appearing inside the boxes. The HUD shows *"19 agents · 80/364 layers"*, a progress bar and a *Running* state. |
| 3–7 s | The hero is finished (name, photo, CTAs) and the cursors move on to the next section. |
| 7–50 s | As the page scrolls, each section (work, awards, about, experience, contact) is built the same way. |
| ~54 s | The HUD wraps up with *"Rebuilt by 19 agents in 51.4s"* and a *Replay* button. |

### What we take, and how it translates to the IDE

| In the reel | On our site |
|---|---|
| Building the site **is** the show | Each section is "executed" in front of the visitor |
| A swarm of cursors (agents) | A terminal cursor typing commands. Optionally, **multi-cursor** (see [04 · Optional effects](04-animations.md#optional-effects)) |
| Selection boxes and placeholders before the content | TUI frames drawn with characters (`┌─┐`) and `░░░` placeholders before the final content |
| The *agents · layers · Running* HUD | The IDE **status bar**: `● Running renderProjects() · 3/7` |
| A section-by-section build, triggered by scrolling | One **execution block** per section, triggered by scrolling |
| *Rebuilt by 19 agents in 51.4s · Replay* | `✔ Build complete — 7 sections rendered in 9.42s` + `[ ↻ Replay ]` |

### What we leave behind

- The design-tool (Figma) look. Ours is IDE + terminal.
- Huge images and giant display type. Our strength is monospaced text and character drawing.
- The video's pacing. There, the author controls everything; here, the visitor sets the pace by scrolling.

## IDE references: what to take from each

| IDE | What it inspires |
|---|---|
| **VS Code** | Activity bar, colored status bar, tabs, breadcrumbs, Command Palette, minimap, notifications in the bottom corner. |
| **IntelliJ IDEA** | The Darcula / New UI theme (neutral grays), the JetBrains Mono font, tool windows, *Run* with an output console. |
| **Eclipse / NetBeans** | The classic light look: the basis for the alternative **Classic** theme, with Eclipse's iconic syntax colors. |
| **Antigravity** | An agent-first IDE, with tasks and agents working in parallel. It strengthens the bridge to the reel (execution status, multi-cursor). |

## Design principles

1. **Content first, show second.** All content exists in the HTML from the start, and the animation is a layer on top. Skipping the animation is always one click or key away.
2. **Technical authenticity.** Every detail must make sense to a developer: real, highlighted JS syntax, plausible logs, real keyboard shortcuts, consistent file names.
3. **Terminal in form, web in function.** It looks like a terminal but behaves like a website: links, hover, focus, text selection, the back button, deep links (`/#projects`).
4. **Short rhythm.** No section takes more than ~2.5 s to become usable. Visitors never wait to read.
5. **Accessible by default.** Reduced motion, keyboard navigation, AA contrast and screen readers.
6. **Inspired, not copied.** Our own theme, icons and identity, with no logos or visual identity from VS Code, JetBrains or Google.

## Non-goals

- Not a page selling services.
- No login, accounts, backend or API.
- Not a real IDE: it does not edit or run visitors' code.
- No external CMS in v1. Content lives in the repository as Markdown/JSON.
- No 3D/WebGL in v1.

## How we will know it worked

| Metric | Target |
|---|---|
| Lighthouse (Performance, Accessibility, Best Practices, SEO) | ≥ 95 in all |
| Hero name and title readable after load | ≤ 2 s |
| Visitors who reach the Projects section | > 60% |
| Use of "Skip" | Measured to tune the pace: heavy use means the animation is too long |
| Community reach | Qualitative: a "how I built this site" launch post, mentions and shares |
