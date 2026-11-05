# Development

State on 2026-11-04: Stages 0 and 1 are done; there is no `package.json` yet. The commands below are the planned ones from docs/06-architecture.md and docs/08-tools.md and become real when Stage 2 scaffolds the project [INFERRED - VALIDATE: confirm the script names then].

## Prerequisites

- Node.js LTS, pnpm, Git.
- For E2E and visual tests: Playwright browsers (`pnpm exec playwright install`).
- The repository's Git `user.email` is the GitHub noreply address; keep it that way for every commit.

## Planned commands

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Type check | `pnpm astro check` |
| Lint / format | `pnpm lint` · `pnpm format` |
| Unit tests | `pnpm test` (Vitest) |
| E2E, visual, accessibility | `pnpm test:e2e` (Playwright + axe) |
| Production build | `pnpm build` · `pnpm preview` |
| Lighthouse | Lighthouse CI in GitHub Actions |

## Workflow

1. **Docs first.** If the change touches a decision, update the relevant doc in `docs/` (and docs/decisions.md) before the code.
2. Run the Decision Gate (docs/decision-gate.md) before planning or coding non-exempt changes.
3. Branch from `main`, implement with tests, open a pull request; Cloudflare Pages builds a preview.
4. Review on the preview (desktop and mobile, both themes, reduced motion), then merge.
5. Commit messages follow Conventional Commits; commit and push only when the owner asks.

The relay pipeline (`/relay-prd` → `/relay-plan` → `/relay-implement` → `/relay-test` → `/relay-pr`) can drive features from a PRD; it uses `PRPs/` for its artifacts and `.worktrees/` for isolated feature worktrees (`scripts/worktree-bootstrap.*` prepares each one).

## Adding a section build (Stage 3 onward)

1. Lay out the final section first (static, readable, accessible).
2. Write its build script: dock command and log, window title, element commands with targets and effects, using the microcopy in docs/05-content.md.
3. Check the budget (≤ 2.5 s from trigger, hero ≤ 3.2 s) with the deterministic clock.
4. Cover it with E2E tests for the behavior rules in docs/02-experience.md.

## Adding a project

Add one Markdown file under `src/content/projects/` with the fields in docs/05-content.md (`slug`, `title`, `summary` ≤ 140 chars, `cover` 16:9, 2–4 `tags`, `status`, `order`…). Only personal projects; follow the voice rules in docs/09-content-draft.md.
