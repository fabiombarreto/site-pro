# Development

The project is scaffolded (Stage 2 Phase 1): the commands below are real and match what CI runs.

## Prerequisites

- Node and pnpm are pinned: `.node-version` (Node 24) and the `packageManager` field (pnpm 12.16.1, enabled with `corepack enable`). Git.
- For E2E and visual tests: Playwright browsers (`pnpm exec playwright install --with-deps chromium`).
- The repository's Git `user.email` is the GitHub noreply address; keep it that way for every commit.

## Commands

| Task | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Dev server | `pnpm dev` |
| Type check | `pnpm astro check` |
| Lint / format | `pnpm lint` · `pnpm format` · `pnpm format:check` |
| Unit tests | `pnpm test` (Vitest) |
| E2E, visual, accessibility | `pnpm test:e2e` (Playwright + axe) |
| Production build | `pnpm build` · `pnpm preview` |
| Lighthouse | `pnpm lighthouse` (Lighthouse CI; needs `pnpm build` and `CHROME_PATH`) |
| Token check | `pnpm check:tokens` |
| Privacy check | `pnpm check:privacy` (needs `pnpm build`) |
| Size budgets | `pnpm check:budgets` (needs `pnpm build`) |

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main`, with nine separately reported jobs: `lint`, `check`, `unit`, `build`, `e2e`, `tokens`, `privacy`, `budgets` and `lighthouse`. Deploys are done by Cloudflare Workers Builds, not by CI.

Playwright screenshot baselines (a PRD Should; gate versus advisory is still open) must be generated in CI's Linux environment, so they are a follow-up and not part of the nine jobs.

## Owner steps outside the pipeline

1. Connect the GitHub repository to Cloudflare Workers Builds with production branch `main` and non-production branch builds and preview URLs enabled, before the Stage 2 pull request opens.
2. Add branch protection on `main` requiring the nine CI checks.
3. On the pull request, open the Workers Builds preview URL and confirm it serves that commit's build and matches the five final-page artboards in both themes.

## Workflow

1. **Docs first.** If the change touches a decision, update the relevant doc in `docs/` (and docs/decisions.md) before the code.
2. Run the Decision Gate (docs/decision-gate.md) before planning or coding non-exempt changes.
3. Branch from `main`, implement with tests, open a pull request; Cloudflare Workers Builds builds a preview.
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
