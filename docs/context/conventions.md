# Conventions

Stage 2 code exists since 2026-11-06 (PR #1). These conventions come from the approved docs and the Design System; code-level ones beyond the Stage 2 foundation are set in later stages and must be added here then.

## Language

- Every artifact is in **English**: site copy, docs, code, comments, commits, pull requests, issues (D1). The owner chats in Brazilian Portuguese; that never leaks into artifacts.
- Interface copy lives in one file (`src/strings.ts`) so another language could be added later.

## Site copy (voice, docs/09-content-draft.md)

- First person, short sentences, contractions, numbers as digits.
- No em dashes in content; use commas, colons, periods or parentheses.
- None of the banned AI vocabulary (leverage, seamless, robust, scalable, innovative…).
- No "this isn't X, it's Y" constructions. Specific beats impressive; only claim numbers that exist in the owner's CV.
- Page copy is plain English for anyone; code-flavored text lives only in the build layer (commands, logs) and small labels.

## Build-layer microcopy

- Section commands: `render<Section>();` (`renderProjects();`); the boot is `startSite();`.
- Window file names: `hero.tsx`, `about.md`, `projects.tsx`, `stack.json`, `contact.tsx`, `error.log`.
- Element commands: `<section>.<element>("…")`, such as `projects.card("relay")`; long arguments end with `…`.
- Logs: `info  Message...`; completion: `✔ <Section> Section created. (2.31s)`; end: `✔ Build complete: 5 sections in 9.6s`.
- Full table: docs/05-content.md, "Build microcopy".

## Naming

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase, the Design System names | `ProjectCard`, `CommandDock` |
| Component states | A `state` prop, never a separate component | `ProjectCard state="select"` |
| Design tokens | kebab-case CSS custom properties | `--bg-raised`, `--glow-1`, `--accent-fg` |
| Type styles | Token names as classes | `.banner`, `.text-3xl`, `.mono-xs` |
| Design System CSS | `sp-` class prefix, reading only tokens | `.sp-dock`, `.sp-window-body` |
| Project slugs | kebab-case | `ai-track-record` |
| Docs | Two-digit prefix for the numbered set | `docs/04-animations.md` |
| Decisions | `D<n>` in docs/07-roadmap-and-decisions.md | D20 |

File naming, import order and folder-per-component rules for `src/` are not fully defined yet [INFERRED - VALIDATE: set in Stage 2]. Observed in `src/components/page/` (Stage 2 Phase 4):

- No folder per component: files are flat in `src/components/page/`. One PascalCase `.tsx` file per component (`Button.tsx`, `ProjectCard.tsx`), with named exports.
- Plain helpers are lowercase `.ts` files in the same folder (`cx.ts`, `resolve-asset.ts`, kebab-case when two words).
- Styles are plain `.css` files imported by the component, named after the component (`NavBar.css`) or the family that shares them (`Actions.css` for Button and TextLink, `Labels.css`), using `sp-` classes.
- In a component file, the CSS import comes first, then sibling components, then types and helpers.
- Small reusable assets used by components live in `src/assets/` and are resolved through `resolveAssetUrl`.

## Styling

- Colors, spacing, radius, shadows and type come only from tokens (docs/03-design-system.md); no raw hex in components.
- Focus: a 2px solid `--accent` ring with a 2px offset on every interactive element.
- Motion: 150–300 ms ease-out `cubic-bezier(0.2, 0.8, 0.2, 1)` for UI; text appears in discrete steps; respect `prefers-reduced-motion` and `prefers-reduced-transparency`.

## Git

- `main` is the default branch; work so far was committed directly to it. The planned cycle is branch → code + tests → pull request with preview → review → merge (docs/08-tools.md).
- Commit messages: Conventional Commits (proposed), as in `docs: make the site one continuous page (D20)`.
- Commits use the GitHub noreply address configured in the repository, never a personal email.
- Commit and push only when the owner asks.

## Errors, logging, tests

Not defined yet: no code exists. Planned test layout: Vitest for the runtime and components, Playwright for E2E/visual/accessibility under `tests/` (docs/06-architecture.md). See docs/context/testing.md.
