# Area: Visual design

Themes, tokens, type, the continuous page (D20) and accessibility. Sources: docs/03-design-system.md, docs/02-experience.md ("One continuous page", Responsive), the Design System "site-pro v2" artifact.

## Business rules

| # | Rule |
|---|---|
| V1 | Two registers never mix: **the page** (modern, readable) and **the build layer** (code look, overlay only) |
| V2 | Themes: **Midnight** (dark, default) and **Daylight** (light), switched from the nav and the palette; accent blue `#2563eb` (D3) |
| V3 | Type: Geist for the page (D18), JetBrains Mono for the build layer and small labels; self-hosted |
| V4 | **One continuous page** (D20): one backdrop behind every section (theme background, soft accent-blue glows centered on section boundaries, film grain); sections have no borders, bands or backgrounds of their own |
| V5 | Banner hero: the name in giant type on two lines (`clamp(64px, 15vw, 216px)`), a full-body cut-out photo in front of it; on desktop and tablet the photo runs into About, on mobile it sits below the name on the right |
| V6 | Photo heights (9:16 cut-out): 960 px desktop, 760 px tablet, 480 px mobile (docs/03-design-system.md) |
| V7 | Projects: staggered 2 × 2 grid (right column lower), the last cover overlaps the top of Stack; one column on mobile |
| V8 | Contact brings the giant type back (`Let's talk.`) |
| V9 | The **dot grid** appears only inside build windows |
| V10 | Colors, spacing, radius, shadows and type come only from tokens; components never use raw values |
| V11 | WCAG 2.2 AA in both themes; every text pair ≥ 4.5:1; glows are capped so `--fg-muted` keeps 4.8:1 |
| V12 | Focus ring: 2px solid `--accent`, 2px offset, on every interactive element |
| V13 | Blur only on a few build-layer surfaces and only while visible; solid fallback with `prefers-reduced-transparency` or no support |
| V14 | Own window chrome (three neutral dots, our type); no operating system or app branding |
| V15 | Breakpoints: ≥ 1024 px desktop, 768–1023 px tablet, < 768 px mobile (16 px side gutter) |
| V16 | Sections keep eyebrows such as `02 / projects` |

## Design sources

The Design System artifact (tokens.json, 32 components on `window.SitePro`, previews, placeholders) and the screens canvas (17 artboards) are the visual source of truth; links in docs/context/architecture.md. A Phosphor theme is a v1.1 easter egg.

## Open Questions

- ~~How the Design System's `components/src/index.tsx` maps onto Astro components vs React islands in Stage 2.~~ Answered by the Stage 2 PRD (2026-11-05): sections are Astro files in `src/sections/`, page components are typed React rendered statically in `src/components/page/`, ThemeToggle is the only hydrated control and the mobile menu is a static `popover`.
- Whether the film grain is an image asset or a generated SVG noise filter in production [INFERRED - VALIDATE].
