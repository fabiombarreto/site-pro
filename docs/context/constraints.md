# Constraints

## Scope

- **Presentation-only**: no login, accounts, backend, API or forms that post to a server. Not expected to change soon (docs/01-concept.md).
- **English only** for the site and every artifact (D1).
- **Docs first**: `docs/` is the source of truth. A decision change updates the docs before the code (docs/08-tools.md).
- **v1 scope is closed** (docs/07-roadmap-and-decisions.md): new ideas go to v1.1 (interactive dock D7, multi-cursor agents D8, Phosphor easter egg) or post-v1 (Experience, Articles and talks, D4).

## Privacy (hard rule)

Never publish on the site or in the public repository: phone number, email address, compensation targets, the city, relocation and visa policy, application and interview data, recruiter notes. Past employers and client projects are left out too; they live in the CV and on LinkedIn (docs/09-content-draft.md). Location is "Brazil (UTC-3)" only.

## Runtime and tooling versions

| Item | Constraint |
|---|---|
| Node.js | LTS (proposed) |
| Astro | Latest stable when Stage 2 starts |
| TypeScript | Strict mode |
| Browsers | Last two versions of Chrome, Edge, Firefox and Safari, desktop and mobile |

## Performance budgets (docs/06-architecture.md, docs/04-animations.md)

| Item | Budget |
|---|---|
| Lighthouse | ≥ 95 |
| LCP / CLS / INP | ≤ 2.5 s / ≈ 0 / ≤ 200 ms |
| Critical JS | ≤ 20 KB gzip (inline head script + runtime) |
| Total JS | ≤ 90 KB gzip after idle (React + islands) |
| CSS | ≤ 25 KB gzip |
| Runtime + effects | ≤ 18 KB gzip |
| Hero build | ≤ 3.2 s from load (headline readable by ~1.7 s) |
| Other sections | ≤ 2.5 s from trigger to usable content (the `✔ <Section> Section created.` line, Stage 4 PRD) |

## Accessibility

WCAG 2.2 AA in both themes; every text pair ≥ 4.5:1 (the background glows are capped so `--fg-muted` keeps 4.8:1); the build layer is `aria-hidden`, except the dock's real buttons (a `role="group"` named "Site build"; its status text, log and hint stay `aria-hidden`); typing is never announced letter by letter; visible focus everywhere; a "Skip to content" link; `prefers-reduced-motion` respected.

## Behavior that must hold (docs/02-experience.md, "Behavior rules")

- The final layout never moves: the build layer is an overlay; animate only `transform`, `opacity`, `clip-path`.
- Never hijack scrolling, except when the visitor asks (nav, palette, deep link, Replay).
- Content works without JS; elements are clickable as soon as they exist.
- Every visit plays the full build (D6), except a saved `∞` speed.

## Design-tool constraints

- Claude Design is a research preview; Figma is the fallback (docs/08-tools.md).
- Stage 1 prototypes live in the design tool and are disposable; production code starts in Stage 2.

## Pending content

The real full-body photo (9:16, cut out) and the project covers arrive before launch; placeholders stand in until then (docs/05-content.md).

## TODO / FIXME

No code yet, so none. Open decisions: D10 analytics, D14 task management, D15 domain.
