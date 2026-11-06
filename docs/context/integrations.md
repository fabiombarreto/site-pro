# Integrations

The site is static and presentation-only: no backend, no runtime API calls, no forms that post anywhere. Integrations are links, build-time fetches, hosting and design tools. No secret values are stored in the repository.

| Integration | Purpose | When | Auth | Notes |
|---|---|---|---|---|
| GitHub | Profile and repository links; optional star count per project (`githubRepo` field) | Links at runtime; stars at build time only | Unauthenticated public API, or a CI token if rate limits bite (name to be defined) [INFERRED - VALIDATE] | No user or star counts are cited for relay (docs/09-content-draft.md) |
| LinkedIn | Profile link (hero, About, Contact, mobile menu) | Link only | None | — |
| Cloudflare Workers (Static Assets) | Static hosting; a preview deployment per pull request and production from `main` (D9, amended 2026-11-05) | Deploy | Workers Builds Git integration; no Cloudflare secret stored in GitHub | Not connected yet: the owner connects the repository before the Stage 2 pull request |
| GitHub Actions | CI: lint → typecheck → tests → build → Lighthouse (the deploy is Workers Builds) | CI | None needed for deploy | Planned |
| Analytics | Tune the build pace (Skip usage, Replay, project clicks, palette use, deepest section) | Runtime, cookieless | Site tag, no user auth | Open decision D10 (recommended: Cloudflare Web Analytics) |
| Fonts (Geist, JetBrains Mono) | Page and build-layer type | Build | None | Self-hosted (Fontsource or the fonts' packages), not loaded from Google at runtime. Implemented in Stage 2 Phase 2: the Latin variable woff2 files are copied from `@fontsource-variable/geist` and `@fontsource-variable/jetbrains-mono` (dev dependencies) into `public/fonts/` with their OFL license texts, declared in `src/styles/fonts.css` and preloaded in `src/layouts/Base.astro` |
| Claude Design | Design System, screens and prototype (D11) | Design only | The owner's claude.ai account | Artifacts are private; links in docs/context/architecture.md |
| Figma | Design fallback only | — | — | Not in use (figma_track: false) |

Contact happens only through GitHub and LinkedIn; there is no public email and no contact form.
