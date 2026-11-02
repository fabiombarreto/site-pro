# 08 · Tools and workflow

> Part of **Stage 0 — Foundations**. Items marked ✅ are decided; the rest are proposals. Nothing has been installed or configured yet.

## Language policy

Every project artifact is in English: the site, this documentation, code, comments, commit messages, pull requests and issues.

## Overall flow

```
docs/ (this repository)
   │  decisions, concept, rules
   ▼
Design project (Stage 1) in Claude Design
   │  design system · screens · animated prototype · review through comments
   ▼
CLAUDE.md generated with relay's context-builder
   │  once documentation and planning are complete
   ▼
Handoff to Claude Code
   │  tokens → CSS · components → React/Astro · prototype → rhythm reference
   ▼
Implementation (Stages 2 to 6)
   │  branch → code + tests → pull request with preview → review → merge
   ▼
Deployment
```

---

## Design tool

✅ **Claude Design** (decision D11).

### Why

| Need | How Claude Design covers it |
|---|---|
| **Motion** is the heart of the site (typing, logs, frames being drawn, scroll rhythm) | Artboards are real HTML, so prototypes can run the actual typing and timing instead of jumping between static frames |
| **Character grid**: monospaced font, ASCII art and `┌─┐` borders must line up | Rendered by the browser, exactly as on the final site |
| **Design system with themes** | Tokens for colors and typography, with live component previews |
| **Handoff to Claude Code** | The approved design is packaged for implementation |
| **Low cost and effort** for a personal project | Included in paid Claude plans; no extra tool to buy |

Caveat: Claude Design is still a *research preview*. Mitigation: the design system and every decision are also documented here in `docs/`, and Figma (whose official MCP is already connected on this machine) is the fallback.

### Options considered

| Tool | Why not the main choice |
|---|---|
| **Figma** | Industry standard with precise manual control, but prototypes are frame-based and do not represent typing and terminal timing well; full Dev Mode and MCP usage requires a paid plan |
| **Penpot** | Open source and free, but with a smaller AI and integration ecosystem and the same motion limitations as Figma |
| **Hand-coded prototype** | Full fidelity, but no canvas and no visual comments, and slower to iterate |
| **Rive / Jitter** | Great for promotional videos, but they do not design the interface itself |

### What to produce in Stage 1

| Deliverable | Content |
|---|---|
| **Design System** | Theme tokens (Midnight, Classic, Phosphor), typography, TUI character kit, components with previews (IDE chrome, console, cards, frames) |
| **Screens** | Desktop, tablet and mobile: hero, projects, one tool-style section (stack or experience), contact, Command Palette, 404 |
| **Animated prototype** | Hero boot + scroll to Projects, with the timings from [04](04-animations.md#timings-1-speed) and the skip and speed controls, to approve the rhythm |
| **Review** | Comments directly on the canvas |
| **Handoff** | Tokens become `tokens.css`, components become React/Astro components, and the prototype becomes the reference for visual tests |

### ASCII helpers

| Tool | Use |
|---|---|
| [TAAG](https://patorjk.com/software/taag/) | Try figlet fonts for the name banner |
| `figlet` (npm) | Generate the banner at build time |
| [ASCIIFlow](https://asciiflow.com/) | Sketch ASCII wireframes in the browser |
| REXPaint (Windows) | Hand-edit ASCII art, if something beyond the generated output is needed |

---

## Development tools

| Area | Tool | Status | Notes |
|---|---|---|---|
| Version control | **Git + GitHub** | ✅ | — |
| Repository visibility | **Public** | ✅ D13 | The code is part of the showcase; `File › View Source` points to it |
| Framework | **Astro + React + TypeScript** (strict) | ✅ D2 | See [06](06-architecture.md#stack) |
| Package manager | **pnpm** | ✅ | — |
| Linting | **ESLint** | ✅ | Flat config with `typescript-eslint`, `eslint-plugin-astro`, the React and React Hooks plugins and `eslint-plugin-jsx-a11y` |
| Formatting | **Prettier** | ✅ | With `prettier-plugin-astro` |
| Unit tests | **Vitest** | ✅ | Runtime, scheduler and React components |
| E2E, visual and accessibility tests | **Playwright** | ✅ | Also used for visual checks during development (through the Playwright MCP). Accessibility via `@axe-core/playwright` (proposed) |
| Node.js | **LTS** | Proposed | — |
| Type checking | **`astro check`** | Proposed | Covers `.astro` and TypeScript files |
| Performance | **Lighthouse CI** | Proposed | — |
| Commit messages | **Conventional Commits** | Proposed | A readable history in a public repository |
| Hosting | **Cloudflare Pages** | ✅ D9 | Preview deployment for every pull request |
| CI | **GitHub Actions** | Proposed | Lint → typecheck → tests → build → Lighthouse → deploy |
| Font | **JetBrains Mono via Fontsource** | Proposed | Self-hosted, so the same font renders everywhere |
| Icons | **`@vscode/codicons`** | Proposed | See [03 · Iconography](03-design-system.md#iconography) |
| License | **MIT** for the code | ✅ D16 | Personal content (text, photo, images) stays all rights reserved |
| Task management | **GitHub Issues** | ⏸ D14 | A suggestion; adopt when needed |
| Editor | Whatever the owner prefers + **Claude Code** | — | — |

## Working with Claude Code

- **`CLAUDE.md`** will be generated with the **relay plugin's `context-builder` command** once documentation and planning are complete. It is not written by hand before that.
- **`docs/` is the source of truth.** Any change to a decision updates the documentation before the code.
- **MCP servers available on this machine:**
  - **Playwright**, for visual checks and browser testing;
  - **Context7**, for up-to-date Astro, React and library documentation;
  - **Figma**, only as the design fallback.
- **Task cycle:** branch → implementation → tests → pull request with preview → review → merge (with an issue first, if D14 is adopted).
