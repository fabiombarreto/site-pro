# CLAUDE.md

site-pro is a personal, static, presentation-only portfolio for the developer community that builds itself live: a typed command opens a build window that creates each section, then steps aside and leaves a modern, readable page. Stages 0 (docs) and 1 (design) are approved; Stage 2 scaffolded the project (Astro, tokens, runtime, CI with nine jobs).

## Tech stack

- Astro (SSG) + React components rendered to static HTML, a few islands
- TypeScript strict; plain TypeScript animation runtime outside React; nanostores
- Plain CSS with token custom properties; Geist + JetBrains Mono, self-hosted
- pnpm, ESLint, Prettier, Vitest, Playwright + axe, Lighthouse CI
- Cloudflare Workers Static Assets via Workers Builds (preview per PR), GitHub Actions; design in Claude Design

## Essential commands

Scaffolded in Stage 2 Phase 1: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm check` (astro check), `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e`, `pnpm check:tokens`, `pnpm check:privacy`, `pnpm check:budgets`, `pnpm check:frozen` (Stage 4, needs git history), `pnpm lighthouse`. Details: docs/development.md.

## Key patterns

1. Two registers never mix: the page (readable, modern) and the build layer (code look, overlay only, `aria-hidden`).
2. The final layout never moves: overlays only; animate `transform`, `opacity`, `clip-path`; content exists in the HTML from the start.
3. Docs first: `docs/` is the source of truth; update docs (and docs/decisions.md) before code.

## Working rules

- Every artifact in English (code, docs, commits, PRs); chat with the owner may be in Portuguese.
- Never publish private data (phone, email, compensation, city, visa, recruiter notes, past employers, client projects).
- Commits use the repository's GitHub noreply email; commit and push only when the owner asks.
- v1 scope is closed: new ideas go to v1.1 or post-v1.

## Context & Domain

Before implementing anything, read:
- docs/context/architecture.md — stack and patterns
- docs/context/conventions.md — naming and code standards
- docs/context/constraints.md — what NOT to do
- docs/context/methodology.md — methodology declaration (TDD opt-in)
- docs/context/testing.md — mandatory test guardrail (see section below)
- docs/domain/areas/[relevant-area].md — business rules for the area being changed
- docs/decision-gate.md — mandatory gate before planning or coding

Domain areas:
build
content
navigation
visual-design

## Test Guardrail (mandatory — every change)

Applies to EVERY code change, including small or single-file ones, and
whether or not a relay command was used. Do NOT skip this silently. It is
NOT waived by the Decision Gate scope exemptions.

- Before finishing, check which test suites cover the code you changed
  (see docs/context/testing.md) and state whether tests exist.
- If your change alters tested behavior, UPDATE those tests to match —
  never leave them stale, never delete/skip/weaken them to force a pass.
- Run the suites covering your change; treat all tiers equally and at a
  minimum run the e2e suite.
- If you CANNOT run them for any reason, do not stay silent: at the end of
  your response warn the user, say exactly why, and give copy-pasteable
  manual run instructions. Full protocol: docs/context/testing.md

## More

Full index: docs/KNOWLEDGE_BASE.md
