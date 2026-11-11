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
| Type check | `pnpm check` (`astro check`) |
| Lint / format | `pnpm lint` · `pnpm format` · `pnpm format:check` |
| Unit tests | `pnpm test` (Vitest) |
| E2E, visual, accessibility | `pnpm test:e2e` (Playwright + axe) |
| Production build | `pnpm build` · `pnpm preview` |
| Lighthouse | `pnpm lighthouse` (Lighthouse CI; needs `pnpm build` and `CHROME_PATH`) |
| Token check | `pnpm check:tokens` |
| Privacy check | `pnpm check:privacy` (needs `pnpm build`; also scans the source images in `src/assets` for EXIF and XMP metadata; `--dist <dir>` and `--assets <dir>` override the two scanned folders) |
| Size budgets | `pnpm check:budgets` (needs `pnpm build`) |
| Frozen runtime | `pnpm check:frozen` (the nine scheduler and controls files in `src/runtime/` against `b4271cb`; needs git history) |

`pnpm build` also verifies the build scripts: every `data-build` step on the home page must name a `data-build-target` present in the HTML, otherwise the build fails (`scripts/verify-build-targets.mjs`).

### Running Lighthouse locally

Lighthouse CI needs `pnpm build` and a Chrome binary; the CI job points `CHROME_PATH` at Playwright's Chromium. Do the same locally.

In PowerShell:

```powershell
pnpm build
$env:CHROME_PATH = (node -p "require('@playwright/test').chromium.executablePath()")
pnpm lighthouse
```

In bash:

```bash
pnpm build
export CHROME_PATH="$(node -p "require('@playwright/test').chromium.executablePath()")"
pnpm lighthouse
```

If that path does not exist, run `pnpm exec playwright install chromium` first. If lhci still cannot start Chrome (for example "No Chrome installations found" on Windows), the CI `lighthouse` job is authoritative and the pull request records that Lighthouse was not run locally. Lighthouse covers `/` with the build running (the real runtime on the real clock) and `/projects/relay/`, median of 3 runs, every category >= 0.95, CLS <= 0.01 and LCP <= 2.5 s (`lighthouserc.json`).

### Running the E2E suite

Build first, then run `pnpm test:e2e`. The suite drives the animated page on a fake clock; the conventions (reusing the preview on 127.0.0.1:4321, `page.clock`, sampling error, axe setup) are in docs/context/testing.md, "Test conventions for animated pages".

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main`, with nine separately reported jobs: `lint`, `check`, `unit`, `build`, `e2e`, `tokens`, `privacy`, `budgets` and `lighthouse`. The `check` job also runs `pnpm check:frozen` (with full git history), so the job count stays nine. Deploys are done by Cloudflare Workers Builds, not by CI.

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

Add one Markdown file under `src/content/projects/` with the fields in docs/05-content.md (the file name is the slug; `title`, `summary` ≤ 140 chars, `cover` 16:9, 2–4 `tags`, `status`, `order`…). Only personal projects; follow the voice rules in docs/09-content-draft.md.

## Replacing the photo and covers

The real photo and the project covers are a content-only swap: no code changes (docs/05-content.md, docs/06-architecture.md).

1. Prepare the file to its spec: the photo is a full-body 9:16 cut-out (a PNG with a transparent background, at least 1200 x 2133 px); each cover is 16:9 (at least 1280 px wide). Strip EXIF, XMP and GPS metadata before the file enters the repository.
2. Put the file in `src/assets`.
3. Reference it from the content: the `photo` field of `src/content/profile.json`, or the `cover` field of the project file in `src/content/projects/`, using the same relative path form the current content uses (for example `../assets/photo-placeholder-body.svg`).
4. Run `pnpm check:privacy` (fails naming any image with metadata), `pnpm build` (regenerates the responsive AVIF/WebP versions, the ASCII version and the blurred covers; a missing or unreadable file fails the build naming it), `pnpm test`, `pnpm test:e2e`, `pnpm check:budgets` and `pnpm lighthouse`.
5. Open the preview and re-run the review items in docs/stage-4-rhythm-review.md (the ASCII color, `PHOTO_START_OPACITY`, LCP).
6. What CI re-checks: the `privacy` job on `src/assets`, the `budgets` job, the `lighthouse` job (including LCP), the `e2e` job (layout invariance and axe) and the frozen runtime check in the `check` job.
