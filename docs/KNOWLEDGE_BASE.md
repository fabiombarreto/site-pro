# Knowledge Base (Tier 2 — TOC)

Index of detailed documentation for site-pro. One line per file; open the file for details.

---

## Intro

→ README.md — what the site is (a portfolio that builds itself live), status and links to the docs
→ docs/README.md — documentation index, current status line and changelog

## Product and design (approved docs)

→ docs/01-concept.md — goal, audience, the build-windows concept, design principles and success metrics
→ docs/02-experience.md — screen anatomy, first-visit script, section and command map, behavior rules, interactions, responsive
→ docs/03-design-system.md — tokens, Midnight/Daylight themes, type, components and their states
→ docs/04-animations.md — runtime model, section lifecycle, 1× timings, effects catalog, controls, reduced motion
→ docs/05-content.md — v1 sections, content data model, tone, build microcopy, owner checklist
→ docs/06-architecture.md — Astro + React design, runtime layers, folder plan, budgets, testing strategy
→ docs/07-roadmap-and-decisions.md — stages 0–6, v1.1 and post-v1, risks, decisions D1–D20
→ docs/08-tools.md — design tool, Claude Design links, dev tooling and the working cycle
→ docs/09-content-draft.md — approved copy: profile, About, four projects, stack, contact, privacy list

## Architecture & Development

→ docs/architecture.md — developer overview: page-load steps, moving parts, where to change what
→ docs/development.md — prerequisites, commands, docs-first workflow, adding sections and projects
→ docs/api-reference.md — no HTTP API; routes, content schemas and visitor controls
→ docs/troubleshooting.md — Claude Design pitfalls and runtime pitfalls from the design

## AI Governance

→ docs/decision-gate.md — mandatory control mechanism before planning, coding or review
→ docs/decisions.md — stable decisions (D1–D20, scope, privacy, Stage 1 approval) not to re-evaluate
→ docs/anti-patterns.md — forbidden patterns: layout shift, fade-ups, scroll hijack, private data, scope creep

## Project Context

→ docs/context/architecture.md — stack, SSG + progressive enhancement pattern, planned folders, design artifacts
→ docs/context/conventions.md — English everywhere, copy voice, build microcopy, naming, tokens, Git
→ docs/context/integrations.md — GitHub, LinkedIn, Cloudflare Workers, CI, analytics (open), fonts, Claude Design
→ docs/context/constraints.md — scope, privacy, versions, performance budgets, accessibility, behavior rules
→ docs/context/methodology.md — methodology declaration: test-after (TDD off), Vitest and Playwright declared, docs sync on, Figma track off
→ docs/context/testing.md — mandatory test guardrail; Vitest and Playwright suites with run commands (empty until the test pair authors tests)

## Domain

→ docs/domain/glossary.md — terms: page vs build layer, dock, build window, commands, effects, turbo, skip
→ docs/domain/flows.md — visitor flows: first visit, impatient, jumps, projects, contact, a11y, 404
→ docs/domain/areas/build.md — runtime and build-layer rules, timings, lifecycle, responsive build
→ docs/domain/areas/content.md — content rules, privacy, field limits, voice, approved content
→ docs/domain/areas/navigation.md — nav, palette, shortcuts, project pages, 404, footer
→ docs/domain/areas/visual-design.md — themes, type, continuous page (D20), tokens, contrast, breakpoints

## Libraries

→ docs/libs/ — per-library notes via Context7; not generated yet; `package.json` now exists, run `*libs` to generate them
