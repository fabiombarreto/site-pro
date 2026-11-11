# Stage 4 · Sections and effects: the final per-section builds with image-resolve

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (an image pipeline on astro:assets + sharp; build-time ASCII and blurred derivatives; the image-resolve effect and its technique; per-section dock logs carried by the build script; per-section timing levers inside the Stage 3 runtime); cross-cutting patterns (one aria-hidden overlay build layer, effects driven by the runtime clock, the data-build contract, budgets); creation or change of components (Photo, ProjectCard, ProjectHeader page components; the effects registry; overlay pieces for the ASCII and blurred layers); impact on shared UI (hero, project cards, project pages); business rules for build (B4, B5, B13, B16, B17, B21, B22, B23, B24, B26), content (C7, C10, C12, C13, C14, C15, C16), visual-design (V5, V6, V7, V10, V11, V13) and navigation (project pages, D5)
- Decisions found: Presentation-only scope; D1 English only; D2 Astro + React + TypeScript strict with the runtime in plain TypeScript outside React; D5 internal project pages; D6 full build on every visit; D8 multi-cursor agents in v1.1 (v1 builds one element at a time in each window, so cards keep a short overlap); D12 ASCII → real photo as the photo's build effect; D16 personal content (photo, images, text) all rights reserved; D17 build windows; D20 one continuous page (the cut-out photo runs into About, covers carry continuity from Projects on); only personal projects and the privacy list; Stage 1 approved (prototype v2 is the rhythm reference); Stage 3 PRD approved (Stage 4 adds image-resolve, the real assets and per-section tuning; scheduler unchanged except recorded bug fixes); build layer clips horizontal overflow (B26); Stage 3 Phase 4 controls (skip, run all, instant paths); Stage 3 approved (the runtime is the base for Stage 4)
- Applicable anti-patterns: layout-shifting build animations; hiding pending content with display or visibility; generic fade-up reveals (the photo and covers use the catalog's image-resolve, not a fade); re-rendering React per typed character; many timers instead of one loop; mixing the two registers (ASCII and blurred layers only in the overlay); raw values instead of tokens; publishing private data (image metadata such as GPS must never reach the public repository or the site); invented numbers and banned copy patterns (project page text); scope creep into v1 (unstyled → styled moves to v1.1); weakening tests to get a green run (base-timing tests are updated to the new intended timings and recorded)
- Applicable architectural rules: SSG with complete final HTML (the real photo and cover images are in the static HTML from the start; the ASCII and blurred versions are build-layer data) and progressive enhancement; the build layer is one overlay, aria-hidden except the dock's controls, animating only transform, opacity and clip-path on page elements; pending content stays laid out and in the accessibility tree; one requestAnimationFrame loop and the runtime's injectable clock (Playwright page.clock in E2E); budgets (critical JS ≤ 20 KB gzip, runtime + effects ≤ 18 KB gzip, total JS ≤ 90 KB gzip, CSS ≤ 25 KB gzip, Lighthouse ≥ 95, LCP ≤ 2.5 s, CLS ≈ 0); WCAG 2.2 AA in both themes; tokens only; docs/ is the source of truth and is updated before code; relay artifacts live in PRPs/, nothing under .claude/
- Result: PROCEED
```

## Problem Statement

After Stage 3 the page builds itself, but the moments that give the show its identity are missing and the rhythm is not yet the final one. The hero photo goes from a skeleton straight to the placeholder with no ASCII → photo dissolve (D12), project covers have no resolve-from-blur, several on-screen commands and dock logs are generic, the base scripts run prototype v2's timings on stand-in content and miss their budgets (Projects needs about 3.4 s against 2.5 s), and the four project pages hold only a header. Until this is done, v1 cannot launch (launch = Stages 2 to 4 plus parts of 5 and 6), and the visitor gets a slower, less memorable build than the approved design.

## Evidence

- `image-resolve` is not in the effects registry: `EFFECTS` lists `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger`, `build-card` (src/runtime/types.ts:1-12); the hero photo step is `{ call: 'hero.photo(…)', target: 'photo', effect: 'skeleton' }` (src/sections/hero.build.ts:28-31).
- The card's cover phase is a boolean (`cover: localMs >= 250`, src/runtime/effect-timing.ts) and the `build-card` runner never touches `.sp-card-cover` (src/runtime/effects.ts), so covers do nothing visible while a card builds.
- Compiled timelines at 1× (computed from src/runtime/compiler.ts and the base scripts), from trigger to the `✔ … Section created.` moment: About ≈ 2.51 s, Projects ≈ 3.38 s, Stack ≈ 2.62 s, Contact ≈ 2.60 s; the budget is ≤ 2.5 s (docs/04-animations.md, B21). About 1.27–1.39 s of each goes to the prelude (250 ms pause, 40 ms per command character, Enter, log, 280 ms window opening).
- Every section's dock log reads `Reading <file>...` (`buildStrings.readingFile(tl.file)`, src/runtime/layer.ts:393), while docs/05-content.md specifies `Fetching projects... 4 found`, `Resolving dependencies...` and `Opening channels...`.
- There is no image pipeline: `profile.photo` and `project.cover` are plain strings resolved to raw URLs (src/content-schemas.ts:27,59; src/components/page/resolve-asset.ts); no `astro:assets` use and no `sharp` dependency (package.json); no project has a cover; no photo → ASCII script exists although docs/06-architecture.md plans one.
- Project pages render a body only when the entry has one (src/pages/projects/[slug].astro:28-29); relay's body is one sentence and docs/05-content.md's launch checklist still lists "Project page text for each project".
- The Stage 3 PRD hands these to Stage 4: "`image-resolve` …, the build-time photo → ASCII script, the real photo and covers, and the project page body text — Stage 4" and "Per-section tuning of the scripts against their budgets with the real content — Stage 4" (PRPs/prds/stage-3-runtime.prd.md, What We're NOT Building).

## Proposed Solution

Finish each section's build on top of the Stage 3 runtime without touching its scheduler. Add an image pipeline on `astro:assets` + `sharp` (responsive AVIF/WebP for raster sources, the hero photo eager with `fetchpriority="high"`, covers lazy, every image with intrinsic dimensions) that also generates, at build time, an ASCII rendering of the photo (about 48 columns, ramp `@%#*+=-:. `, transparent pixels as spaces) and a tiny blurred version of each cover. Add `image-resolve` to the effects registry: for the hero photo, select → skeleton → the ASCII fills the photo's box in the aria-hidden overlay → its characters vanish in an ordered (Bayer) dither over 700 ms while the real image rises from a non-zero opacity to 1; inside `build-card`, the inline blurred cover shows in the overlay and gives way to the real cover. Tune the five scripts to their budgets with the levers the runtime already offers (script timing overrides, step pitches and effect durations), make every window command and dock log come from the content (B22), and add the approved body text to the four project pages. The real photo and covers are not needed to ship: the pipeline runs on the current placeholder and a test cover, and dropping the real files in later is a content-only change. This approach over waiting for the assets or changing budgets: it keeps the approved budgets and grammar, follows docs/04 and docs/06 as designed, adds no JavaScript to the critical path beyond the effect itself, and leaves the launch blocked only on content the owner provides.

## Key Hypothesis

We believe the final section scripts, with the hero photo emerging from its ASCII version and covers sharpening from blur, tuned to their budgets, will make the build read as a quick, memorable show instead of a wait for visitors.
We'll know we're right when every section meets its budget in E2E with Playwright's clock, Lighthouse stays ≥ 0.95 with LCP ≤ 2.5 s, layout and accessibility stay invariant during the new effects, and the owner approves the rhythm on the preview.

## What We're NOT Building

- The "unstyled → styled" joke effect — moved to v1.1 (never in prototype v2; v1 scope is closed).
- The boot `warn  Coffee level low` easter egg and the window-dot close (B25) — Stage 5 easter eggs.
- The Command Palette, `⌘K`, scroll-spy, the card → project page view transition with `open("slug");`, the `ENOENT` 404 window and a build on project pages — Stage 5.
- OG images and analytics — Stage 6.
- Delivering the real full-body photo and project covers — the owner provides them before launch (docs/05-content.md checklist); Stage 4 ships with the placeholders and a documented swap.
- New cover placeholder art: projects without a cover keep the theme-aware CSS dot-grid placeholder.
- Any change to the scheduler and controls in `src/runtime/` (scheduler, clock, triggers, focus rule, resize, keys, controls timing, entry, API) except bug fixes recorded in docs/decisions.md.
- Any change to the Stage 2 layout, section ids, labels, heading structure or the page register.
- The interactive dock (D7), agent cursors (D8), keyboard sound and the element counter — v1.1 or later.

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Section time at 1× | Hero: headline readable ≤ 2.0 s and hero final with its window gone ≤ 3.2 s from load; About, Projects, Stack and Contact: `✔ <Section> Section created.` ≤ 2.5 s after the trigger | Playwright with `page.clock`; Vitest on the compiled timelines of the real content |
| Lighthouse on `/` and `/projects/relay` | ≥ 0.95 in every category, CLS ≤ 0.01, LCP ≤ 2.5 s (median of 3) | Lighthouse CI (LCP assertion added) |
| JavaScript size | Runtime + effects ≤ 18 KB gzip; critical JS ≤ 20 KB gzip; total ≤ 90 KB; CSS ≤ 25 KB | `pnpm check:budgets` in the `budgets` CI job |
| Scheduler unchanged | Empty diff against `b4271cb` for scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts and api.ts, except hunks with a docs/decisions.md bug-fix entry | `git diff` reviewed at Stage 4 close-out |
| Image privacy | 0 committed images with EXIF, XMP or GPS metadata | Extended `pnpm check:privacy` |
| Rhythm | Owner approval | Owner review on the pull request preview |

## Acceptance Criteria (test scenarios)

Mandatory. Each criterion is an observable scenario the resulting code must
satisfy. If `tdd: true` in `docs/context/methodology.md`, these are the
contract the test pair authors test-first (before the Implementer). If
`tdd: false` with a declared framework, they are the contract the test pair
authors test-after (after the Implementer + Code Review). With no framework
declared, no tests are authored.

Unless stated otherwise: the built site served by `astro preview`, a 1280×800 viewport, motion allowed, no stored speed, Playwright's clock installed before navigation, and the content as committed (the placeholder photo, no project covers). "Clock time" is the time advanced on that clock since navigation, or since the section's trigger where stated.

- **AC-1 Hero photo from ASCII:** Given `/`, when the hero builds, then the `hero.tsx` window types `hero.photo("<photo file name>")` (cut to 29 characters with `…` when longer), the photo's selection box and skeleton appear over the photo's box, then an ASCII rendering of the photo fills that box in the build overlay, then its characters disappear in an ordered dither pattern over 700 ms of clock time while the real `<img>` goes from an opacity above 0 (from the moment the ASCII appears) to 1; at the end of the step no ASCII remains in the overlay, the `<img>` has opacity 1 and no clip-path, and its box equals the no-JS box (±0.5 px). The ASCII lives only in the `aria-hidden` overlay and is never part of `<main>`'s text.
- **AC-2 ASCII generated at build time:** Given the image named by `profile.photo`, when `pnpm build` runs, then the ASCII is generated from that image itself: a fixed number of columns (about 48) and rows matching the image's aspect with monospace cells, characters only from ` .:-=+*#%@`, fully transparent pixels as spaces, brighter pixels as denser characters; the same image always yields the same string. Given test fixtures (a fully transparent image, an opaque white image, a two-tone image), when Vitest runs the generator, then it returns all spaces, all `@`, and the expected split respectively. Given `profile.photo` pointing at a missing or unreadable file, when `pnpm build` runs, then it fails with a message naming the file.
- **AC-3 Covers resolve from blur:** Given a project with a cover image (in tests, a fixture cover wired through the same pipeline), when its card builds, then a blurred version of that cover, generated at build time and inlined in the HTML (no extra request), shows over the cover's box in the overlay and gives way to the sharp cover within the card's step, with no animated `filter`; at the end of the step no overlay piece remains and the cover's box equals the no-JS box. Given a project without a cover, when its card builds, then the card shows the dot-grid placeholder with no blur phase.
- **AC-4 Swapping in the real assets:** Given a new photo (9:16, cut out) or cover (16:9) file added to `src/assets` and referenced from `src/content/profile.json` or a project's `cover` field, when `pnpm build` runs, then the responsive versions, the ASCII and the blurred cover are regenerated with no code change, and every section, heading, paragraph, button, project card and stack group box at 1280×800 and 375×812 equals its value before the swap (the photo box comes from V6, covers from their 16:9 frame). Given an image file under `src/assets` carrying EXIF, XMP or GPS metadata, when `pnpm check:privacy` runs, then it fails naming the file.
- **AC-5 Image delivery:** Given the built `/`, when its HTML is inspected, then the hero photo is served from the static HTML with intrinsic `width` and `height`, `fetchpriority="high"`, no `loading="lazy"`, and, for a raster source, AVIF and WebP candidates sized for the 960, 760 and 480 px photo heights; every cover image is served with intrinsic dimensions, `loading="lazy"` and, for a raster source, AVIF and WebP candidates; SVG placeholders are served as they are.
- **AC-6 Section budgets:** Given `/` at 1×, when the page loads, then the `<h1>` "Fabio Barreto." is fully visible by 2.0 s of clock time and the hero is in its final state with its window gone by 3.2 s; and when each of About, Projects, Stack and Contact is triggered on its own (the previous section built and the dock idle), then the dock shows `✔ <Section> Section created. (<t>s)` within 2.5 s of clock time after the trigger, with `<t>` ≤ 2.50. Given the compiled timelines of the committed content, when Vitest runs, then each non-hero section's `createdAt` is ≤ 2500 ms and the hero's `duration` is ≤ 3200 ms with its headline step ending by 2000 ms.
- **AC-7 Every section with its docs/04 effects:** Given each section building, when the clock is paused inside each of its steps, then the visible effect is the documented one: hero — title typed with the caret, role scrambling, photo per AC-1, intro skeleton bars resolving line by line, the three buttons popping one after another 90 ms apart; About — heading typed, paragraphs resolving line by line, the two buttons popping one after another; Projects — heading typed, then each card going selection → skeleton → cover (per AC-3) → title typed → summary lines → tags popping, with consecutive cards overlapping by about 120 ms and never more than two cards building at once; Stack — heading typed, then each group's chips popping 90 ms apart; Contact — heading typed in giant type, the two buttons popping one after another, then the location.
- **AC-8 Commands and logs from the content:** Given the committed content, when the five sections build, then the window commands are, in order: `hero.title("Fabio Barreto.")`, `hero.role("Senior Software Engineer")`, `hero.photo("<photo file name>")`, `hero.intro("12+ years shipping…")`, `hero.links(["GitHub", "LinkedIn"])`; `about.heading("About me")`, `about.text("I'm a full-stack software…")`, `about.links(["GitHub", "LinkedIn"])`; `projects.heading("Selected work")` and one `projects.card("<slug>")` per project in grid order; `stack.heading("What I work with")` and one `stack.group("<group>")` per group; `contact.heading("Let's talk.")`, `contact.links(["GitHub", "LinkedIn"])`, `contact.location("Brazil (UTC-3)")`; and the dock logs are `Reading about.md...`, `Fetching projects... 4 found`, `Resolving dependencies...` and `Opening channels...` (the hero's boot logs unchanged). Given a script built in Vitest from modified content (a different subtitle, a fifth project), then the `hero.intro` argument and the card calls and `5 found` follow the content.
- **AC-9 Layout and accessibility hold during the new effects:** Given Midnight and Daylight at 1280×800 and 375×812, when the clock is paused mid photo dissolve, mid card cover resolve (with a fixture cover) and after the build, then every box and the document height equal the no-JS values (±0.5 px), the summed layout-shift entries are ≤ 0.01, `@axe-core/playwright` with the WCAG 2.0, 2.1 and 2.2 A/AA tags reports 0 violations, the text content and accessibility tree of `<main>` equal the no-JS rendering, and the ASCII and blurred pieces are inside the `aria-hidden` overlay and only `opacity`, `clip-path` or `transform` change on page elements.
- **AC-10 Instant paths leave nothing behind:** Given the photo dissolve or a card's cover resolve in progress, when the visitor skips (`Esc`, `» Skip`, a bar click), runs all (`Shift + Esc`), moves focus into a later section, switches to `∞` or changes the viewport width, then within one frame the photo and covers are in their final state and no ASCII or blurred piece remains. Given `prefers-reduced-motion: reduce`, a saved `∞` or JavaScript disabled, when `/` loads, then no ASCII or blurred piece ever appears and the photo is visible at `DOMContentLoaded`.
- **AC-11 Mobile:** Given 375×812, when the hero builds, then the photo (480 px tall) goes through the same select → skeleton → ASCII → photo sequence inside the compact window, the ASCII fits the photo's box, and `document.documentElement.scrollWidth` equals `clientWidth` at every sampled moment (B26).
- **AC-12 Budgets and Lighthouse:** Given a CI run, when the size check runs on `dist/`, then the runtime and its effects (image-resolve included) are ≤ 18 KB gzip, the inline head scripts plus the runtime entry are ≤ 20 KB gzip, total JavaScript ≤ 90 KB gzip and total CSS ≤ 25 KB gzip, and the job fails above any threshold; and Lighthouse CI on `/` and `/projects/relay`, with the build running on `/`, keeps the median ≥ 0.95 in Performance, Accessibility, Best Practices and SEO, the median CLS ≤ 0.01 and the median LCP ≤ 2.5 s.
- **AC-13 Project pages:** Given `/projects/relay`, `/projects/ai-track-record`, `/projects/praesto-sum` and `/projects/site-pro`, when each page loads, then its body shows the text approved in docs/09-content-draft.md for that project (relay's states that the repository is a fork of Wirasm/prp and relay is the plugin built inside it); the bodies contain no em dash, no number absent from docs/09 and none of the privacy-list data (`pnpm check:privacy` passes); and axe reports 0 violations on each page in both themes.
- **AC-14 Scheduler unchanged:** Given the Stage 4 pull request, when `git diff b4271cb -- src/runtime/scheduler.ts src/runtime/clock.ts src/runtime/triggers.ts src/runtime/focus-rule.ts src/runtime/resize.ts src/runtime/keys.ts src/runtime/controls-timing.ts src/runtime/main.ts src/runtime/api.ts` runs, then it is empty, or every hunk is a bug fix with its own docs/decisions.md entry; and every Stage 3 behavior-rule E2E spec still passes.

## Open Questions

- [ ] Whether Chromium takes the hero photo as the LCP element while it is revealed under the ASCII overlay with partial opacity, and when; measured with a trace in Phase 2 and Lighthouse in every phase. If LCP or Performance falls short, the numbers go to the owner; no threshold is relaxed.
- [ ] The ASCII grid size (about 48 columns, from prototype v2), its color token and the photo's starting opacity: tuned on the preview with the placeholder, re-checked when the real photo arrives.
- [ ] When the real photo and covers arrive (launch checklist in docs/05-content.md); the swap re-runs the budgets, Lighthouse and the visual review.
- [ ] Whether `sharp` installs and runs in the Cloudflare Workers Builds image as it does in GitHub Actions; verified on the Phase 1 preview build.
- [ ] Whether Playwright screenshot baselines of the new build moments gate CI or stay advisory (still advisory after Stage 3).

---

## Users & Context

**Primary User**
- **Who:** The owner, as the site's only developer, who tunes the build scripts, the effects and the assets. The end consumer is the visitor (the international developer community and people who don't code), who watches the site build itself and keeps full control: reading, Skip and speed, keyboard, screen reader, reduced motion and a phone.
- **Current behavior:** The page builds with stand-in timings and content: no ASCII photo, no cover resolve, generic commands and logs, header-only project pages.
- **Trigger:** Opening `/` (visitor); receiving the real photo and covers (owner).
- **Success state:** The owner swaps the assets by editing only `src/assets` and the content files, and the ASCII, blurred and responsive versions are generated at build time; the visitor sees each section created with its signature effect within its budget.

**Job to Be Done**
When a visitor opens the site, I want each section to build with its signature effect (my photo emerging from ASCII, the covers sharpening from blur) inside its budget, so they watch the show without waiting and leave remembering it.

**Non-Users**
Recruiters and clients looking for a résumé (the site is a short, presentation-only invitation); visitors without JavaScript, who get the static page untouched; people expecting the interactive dock (D7) or agent cursors (D8), which come in v1.1.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Image pipeline: `photo` and `cover` as Astro `image()` fields from `src/assets`; responsive AVIF/WebP for raster sources; the hero photo eager with `fetchpriority="high"`; covers lazy; intrinsic dimensions everywhere; `sharp` as a dependency | docs/06 performance table; LCP and CLS; real assets must not cost megabytes |
| Must | Build-time ASCII generator for `profile.photo` (about 48 columns, ramp `@%#*+=-:. `, transparent → space, deterministic) serialized as build-layer data on the photo target | D12; docs/06 "ASCII art" row: generated once at build time, no cost in the browser |
| Must | Build-time tiny blurred version of each cover, inlined in the HTML | docs/04: covers resolve from a blurred version; no extra request while the card builds |
| Must | `image-resolve` in the effects registry: the hero variant (select → skeleton → ASCII → ordered-dither dissolve over 700 ms with the photo rising from a non-zero opacity) and the cover variant inside `build-card` (blurred → sharp within the card); instant finish; driven by the runtime clock | docs/04 effects catalog; the last missing effect |
| Must | Final scripts for the five sections: effects as in docs/04 (links and buttons staggered 90 ms; cards per AC-7), timings tuned to the budgets, cards about 300–350 ms with a 120 ms overlap (never more than two at once) | B21 budgets; owner decision (tighten to fit 2.5 s); D8 rationale |
| Must | Window commands and dock logs from the content: a per-section log in the build script (`Fetching projects... <n> found`, `Resolving dependencies...`, `Opening channels...`) read by the dock; the final command arguments | B22; docs/05 build microcopy |
| Must | No metadata in committed images: `check:privacy` extended to fail on EXIF, XMP or GPS in `src/assets` | Privacy list (a photo's GPS would reveal the city) |
| Must | Project page body text for the four projects, approved by the owner in docs/09 before it is copied into `src/content/projects/*.md` | D5; launch checklist; owner decision (Claude drafts, owner approves) |
| Must | Quality gates: E2E for AC-1 to AC-14, the axe and layout-invariance matrix at the new moments, the budgets and Lighthouse with an LCP assertion, base-timing unit tests updated to the new intended timings, docs/context/testing.md mapping | Stage 4 exit criterion |
| Should | A short "Replacing the photo and covers" procedure in docs/development.md (file specs, where to reference them, what CI re-checks) | Makes the swap a content-only task for the owner |
| Should | Owner rhythm review on the preview against prototype v2 and docs/04 | The rhythm changes for the budgets |
| Could | Advisory Playwright screenshots of the ASCII and cover-resolve moments | Visual reference without gating CI |
| Won't | Unstyled → styled; `warn  Coffee level low`; B25 window-dot close | v1.1; Stage 5 easter eggs |
| Won't | Palette, view transitions, `open("slug");`, `ENOENT` window, build on project pages; OG images; analytics | Stage 5; Stage 6 |
| Won't | Real assets delivery; new cover placeholder art; scheduler changes | Owner content task; out of scope; Stage 3 boundary |

### MVP Scope

The five sections building with their docs/04 effects (the hero photo from ASCII, covers from blur when a cover exists) and their final commands and logs, each within its budget at 1×, on the placeholder photo and a test cover, with the four project pages carrying approved text, all within the size budgets and Lighthouse ≥ 0.95 with LCP ≤ 2.5 s.

### User Flow

- **Visitor:** loads `/` → `startSite();` → the hero window builds the giant name, the role, the photo (skeleton → ASCII → photo), the intro and the buttons (≤ 3.2 s) → scrolls → each section's window builds it in ≤ 2.5 s, cards with their covers sharpening from blur → `✔ Build complete` → opens a card → reads the project page.
- **Owner:** drops the real photo or a cover into `src/assets` and references it in the content → `pnpm build` regenerates the responsive, ASCII and blurred versions → CI re-runs the budgets, Lighthouse and the E2E suite on the pull request → reviews the ASCII effect on the preview.

---

## Technical Approach

**Feasibility:** MEDIUM. The engine, the overlay and every other effect exist and are tested; the compiler already accepts per-script timing overrides; `sharp` is the standard tool for the derivatives. The risks are LCP once the real photo becomes the largest element and is revealed by script, budgets with little slack (Projects lands near 2.45 s), and the dissolve's cost on low-end phones.

### TDD routing

Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

`test_frameworks: [vitest, playwright]` is declared, so the test pair authors and maintains the suite for every phase.

### Architecture Notes

- **Docs amendments after approval (docs first).** Made in the PRD authoring session right after approval, left uncommitted for the owner: a "Stage 4 PRD approved" entry in docs/decisions.md (placeholders with a content-only swap; budgets measured at the `✔ created` line for sections after the hero; cards about 300–350 ms with a 120 ms overlap; the image pipeline and `sharp`; the ASCII and blur derivatives; the dissolve technique; per-section dock logs in the build script; the refined `src/runtime/` boundary; unstyled → styled to v1.1 and the Coffee easter egg to Stage 5; project page text approved in docs/09); docs/04-animations.md (card duration and overlap, `image-resolve` mechanics for the hero and covers, the budget definition, the optional effects table); docs/05-content.md (the final commands and logs, image specs and metadata stripping, checklist); docs/06-architecture.md (the image pipeline, `sharp`, where the ASCII and blur data live); docs/domain/areas/build.md (B21 definition, B22, new rules for image-resolve, open questions closed) and content.md (no image metadata); docs/07-roadmap-and-decisions.md (PRD link on the Stage 4 row, unstyled → styled on the v1.1 row); docs/README.md changelog. In the same session, Claude drafts the four project page bodies into docs/09-content-draft.md from its "Detail page material" and the voice rules; the owner approves them before Phase 4 runs.
- **The `src/runtime/` boundary.** Frozen (AC-14): scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts and api.ts. Allowed, each change listed in its phase plan: the effects files (the effect list in types.ts, effect-timing.ts, effects.ts, effect-dom.ts) for `image-resolve` and the card's cover phase; an additive, optional `log` field carried from `BuildScript` through compiler.ts into the `Timeline`; layer.ts reading that log instead of `readingFile` and, if a budget needs it, keeping the log visible while the window opens. Layer constants in layer-timing.ts (typing pace, pause, opening) stay as documented.
- **Timing levers.** The compiler accepts `timing.windowEnd` and `timing.buildStart` overrides per script (the hero already uses them); the layer animates the window opening between `windowEnd` and `buildStart`, and dock typing always follows the documented pace, so `commandEnd` cannot be shortened. The levers are: opening the window at Enter (saves 100 ms per section), step pitches, overlaps and effect durations, and the cards' shorter duration. Estimates with these levers: About ≈ 2.4 s, Projects ≈ 2.45–2.5 s, Stack ≈ 2.45–2.5 s, Contact ≈ 2.4 s. The hero keeps its boot timing; adding the 1,000 ms photo step (select 150 + skeleton 150 + dissolve 700) and staggered buttons needs its later pitches tightened to stay ≤ 3.2 s. Base-timing tests (tests/unit/runtime-pacing.test.ts) are updated to the new intended values and recorded in the test lifecycle ledger.
- **Image pipeline.** The content schemas switch `photo` and `cover` to Astro's `image()` helper; Hero.astro, Projects.astro and the project page call `getImage()` (or `<Picture>` where an Astro component fits) and pass the sources to the static React components (`Photo`, `ProjectCard`, `ProjectHeader`), which keep their markup and classes. Raster sources get AVIF and WebP; SVG placeholders pass through. Output images carry no metadata; source files under `src/assets` are checked by `check:privacy`.
- **ASCII generation.** A build-time module reads the photo with `sharp` (`ensureAlpha().raw()`), averages each cell, maps transparent cells to spaces and brightness to the ramp, and returns a string; the section serializes it as data on the photo target (an attribute, not text), so `<main>`'s text and accessibility tree are unchanged and no-JS visitors see nothing of it. Unit tests use small fixture images (AC-2).
- **The dissolve.** The runtime draws the ASCII in a `<pre>`-like overlay piece sized to the photo's box (font size from the box width and column count, line height from the box height and row count, as in prototype v2), with a color token; the dissolve removes characters in a 4×4 Bayer threshold order (16 discrete steps over 700 ms, so about 16 overlay text writes, not per-frame DOM churn) while the page `<img>`'s inline opacity rises from a small non-zero value to 1. No `mask-image` and no animated `filter`: page elements only get `opacity` and `clip-path`, as the anti-patterns require.
- **Covers.** The tiny blurred cover (a few dozen pixels wide, inlined as a data URI at build time) is drawn in the overlay over the cover box, upscaled with a static blur, and faded out with `opacity` as the real cover is revealed; it never waits for the real image to load (content never waits), and covers below the fold stay lazy. Cards without a cover keep the CSS placeholder.
- **Per-section logs.** Each build script declares its dock log (`Fetching projects... ${projects.length} found`), so the count comes from the collection (B22); copy templates live in `src/strings.ts`.
- **Tests.** Vitest covers the ASCII generator, the image-resolve timing (pure, in effect-timing.ts), the compiled budgets of the real content and the script commands; Playwright covers the dissolve and cover moments with `page.clock`, the instant paths, mobile, the axe and layout matrix, and the project pages; the fixture cover is wired through the same pipeline (the plan chooses how, for example a test-only content entry or a served-HTML fixture). The AC → spec mapping goes into docs/context/testing.md.

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| LCP and Lighthouse Performance drop once the real photo is the largest element and is revealed by script (Chromium ignores opacity-0 paints) | M | Photo eager with `fetchpriority="high"` and responsive AVIF/WebP; it starts at a non-zero opacity when the ASCII appears; LCP measured on every phase's preview and asserted in Lighthouse CI; numbers go to the owner instead of relaxing a threshold |
| Budgets with little slack (Projects ≈ 2.45–2.5 s), or a budget that needs the log kept visible while the window opens | M | Unit test on the compiled timelines of the real content (AC-6) fails early; the levers are listed in Architecture Notes; a layer change stays outside the frozen files and is recorded |
| The dissolve costs frames on low-end phones (2–3k overlay characters, a 960 px image) | L | 16 discrete dither steps instead of per-frame writes; opacity-only on the image; profiled at 375×812 with CPU throttling |
| The ASCII tuned on the placeholder looks different with the real photo (contrast, background) | M | Columns, ramp and threshold in one configuration; the photo spec asks for good contrast (C10); re-check on the swap pull request |
| `sharp` fails to install or run in Cloudflare Workers Builds | L | Verified on the Phase 1 preview build; Astro's image service already depends on it; fallback recorded in the plan if it fails |
| A source photo with GPS metadata reaches the public repository | L | `check:privacy` fails on image metadata (AC-4); the swap procedure tells the owner to strip metadata first |
| The 18 KB runtime budget (≈ 5.9 KB headroom today) | L | No new dependency in the browser; the effect reuses the overlay factories; size checked on every phase |

---

## Implementation Phases

| # | Phase | Description | Status | Repo | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|------|----------|---------|----------|
| 1 | Image pipeline and derivatives | `image()` fields, responsive photo and covers through `astro:assets` + `sharp`, the build-time ASCII generator and blurred covers as build-layer data, the image-metadata privacy check; the final page unchanged | complete | - | - | - | PRPs/plans/stage-4-sections-effects-phase-1-image-pipeline-and-derivatives.plan.md |
| 2 | image-resolve | The effect in the registry: the hero ASCII dither dissolve and the cover resolve inside `build-card`, instant finishes, the hero script using it | complete | - | - | 1 | PRPs/plans/stage-4-sections-effects-phase-2-image-resolve.plan.md |
| 3 | Section tuning | The five final scripts: docs/04 effects, commands and per-section dock logs from the content, timings tuned to the budgets, base-timing tests updated | complete | - | - | 2 | PRPs/plans/stage-4-sections-effects-phase-3-section-tuning.plan.md |
| 4 | Project page text | The owner-approved bodies from docs/09 copied into the four project entries | complete | - | - | - | PRPs/plans/stage-4-sections-effects-phase-4-project-page-text.plan.md |
| 5 | Quality gates | E2E for AC-1 to AC-14, the axe and layout matrix at the new moments, Lighthouse with LCP, budgets, the scheduler diff check, docs/context/testing.md, the asset swap procedure, the owner's rhythm review | complete | - | - | 3, 4 | PRPs/plans/stage-4-sections-effects-phase-5-quality-gates.plan.md |

### Phase Details

**Phase 1: Image pipeline and derivatives**
- **Goal:** Every image goes through one build-time pipeline that also produces the data the effects need, with no visible change to the final page.
- **Scope:** `sharp` added; `photo` and `cover` switched to Astro `image()` fields with the schema and content updated; `getImage()`/`<Picture>` in Hero.astro, Projects.astro and the project page passing sources to `Photo`, `ProjectCard` and `ProjectHeader` (eager + `fetchpriority="high"` for the photo, lazy covers, intrinsic dimensions, AVIF/WebP for raster sources); the ASCII generator with fixture-based unit tests, serialized on the photo target; the tiny blurred cover for any project with a cover, inlined on its card; `check:privacy` extended to image metadata; `sharp` verified on the Workers Builds preview; Lighthouse and LCP measured.
- **Success signal:** AC-2, AC-4 and AC-5 pass; the no-JS boxes at 1280×800 and 375×812 are unchanged; budgets and Lighthouse stay green.

**Phase 2: image-resolve**
- **Goal:** The hero photo emerges from its ASCII version and covers sharpen from blur, inside the existing runtime.
- **Scope:** `image-resolve` added to the effect list, `EFFECT_DURATION_MS` (hero: select 150 + skeleton 150 + dissolve 700) and `RUNNERS`; the overlay ASCII piece with the 4×4 Bayer dissolve and the image's opacity ramp; the card's cover phase made a progress value and the blurred-cover overlay in the `build-card` runner; instant finish on skip, run all, focus, resize and `∞`; the hero script's photo step switched to `image-resolve` with its final command; an LCP trace of the dissolve.
- **Success signal:** AC-1, AC-3, AC-10 and AC-11 pass; the size check stays within 18 KB; the hero still completes ≤ 3.2 s.

**Phase 3: Section tuning**
- **Goal:** Every section builds with its final effects, commands and logs within its budget.
- **Scope:** The five build scripts: docs/04 effects per AC-7 (staggered buttons, card phases, staggered chips); every command argument and dock log from the content (the optional `log` field through the compiler into the timeline, read by the dock); timing overrides, pitches and the cards' ≈ 300–350 ms duration with a 120 ms overlap to meet the budgets; the hero's later pitches tightened around the 1,000 ms photo step; tests/unit/runtime-pacing.test.ts updated to the new intended values (recorded in the lifecycle ledger); new copy in `src/strings.ts`.
- **Success signal:** AC-6, AC-7 and AC-8 pass; all Stage 3 behavior-rule specs stay green.

**Phase 4: Project page text**
- **Goal:** Each project page tells its story.
- **Scope:** The bodies the owner approved in docs/09-content-draft.md copied into `src/content/projects/*.md` (relay keeps the fork note); Prose rendering checked; privacy and voice checks. Starts only after the owner has approved the text.
- **Success signal:** AC-13 passes; Lighthouse on `/projects/relay` stays ≥ 0.95.

**Phase 5: Quality gates**
- **Goal:** Every Stage 4 target is enforced in CI and visible on the preview.
- **Scope:** The E2E suite for AC-1 to AC-14 with `page.clock`; the axe and layout-invariance matrix at the new moments (mid dissolve, mid cover resolve with the fixture cover, done) in both themes and both viewports; Lighthouse CI with an LCP ≤ 2.5 s assertion; the size budgets; the scheduler diff check (AC-14); the AC → spec mapping in docs/context/testing.md; the "Replacing the photo and covers" procedure in docs/development.md; advisory screenshots (Could); the owner's rhythm review on the preview.
- **Success signal:** All 14 ACs pass in CI on the pull request; all nine CI jobs are green; the owner approves the rhythm.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Real assets | Ship with the placeholder photo and no covers; build the whole pipeline now and make the real files a content-only swap, re-checked by CI | Leave a final phase pending until the assets arrive; wait for the assets before starting | Stage 4 is not blocked on content; the launch checklist already tracks the photo and covers. Chosen by the owner |
| Section budgets | Tighten the rhythm to fit the documented budgets, measured at the `✔ <Section> Section created.` line for sections after the hero (the hero keeps "final with its window gone ≤ 3.2 s from load") | A Projects exception (≤ 3.5 s) keeping the prototype rhythm; more card overlap (up to three cards at once) | Keeps B21 and the one-element-at-a-time grammar behind D8. Chosen by the owner |
| Card duration | About 300–350 ms per card with a 120 ms overlap, never more than two cards building at once (docs/04 said ≈ 450 ms) | Keep 450 ms with a 250 ms overlap | The only way to fit Projects in 2.5 s without a three-card swarm; the exact value is the plan's, within the AC-6 and AC-7 bounds. Follows the owner's budget choice; refined after reading the layer: the window opening cannot overlap the first element, so the card estimate moved from ≈ 350 ms to ≈ 300–350 ms |
| `image-resolve` durations | Hero: select 150 + skeleton 150 + dissolve 700 ms; covers: inside the card's duration | 700 ms for covers too (the card would last over 1 s) | docs/04's 700 ms keeps its meaning for the signature effect; covers follow the card budget. Proposed default |
| Project page text | Claude drafts the four bodies from docs/09's "Detail page material" and the voice rules into docs/09 after PRD approval; the owner approves them before Phase 4 | The owner writes them; leave them out of Stage 4 | Docs first, no invented numbers, one approval point. Chosen by the owner |
| Optional effects | Unstyled → styled moves to v1.1; `warn  Coffee level low` goes to the Stage 5 easter eggs | Ship one or both in Stage 4 | Neither was in prototype v2; v1 scope is closed. Chosen by the owner |
| Image pipeline | `astro:assets` with `image()` fields and `sharp`; responsive AVIF/WebP; photo eager with `fetchpriority="high"`, covers lazy | Raw URLs as today; a custom image script | docs/06 performance rules; Astro's own pipeline already uses `sharp`. Proposed default accepted by the owner |
| ASCII generation | Build-time from the photo with `sharp`, about 48 columns, ramp `@%#*+=-:. `, transparent → space, serialized as data on the photo target | A hand-made string as in prototype v2; generated in the browser | docs/06: generated once at build time, no browser cost; follows the real photo automatically. Proposed default accepted by the owner |
| Dissolve technique | ASCII in the overlay vanishing in a 4×4 Bayer order (16 steps over 700 ms) while the photo's opacity rises from a non-zero value | `mask-image` dither on the photo; canvas; per-cell `clip-path` | Respects the transform/opacity/clip-path rule, keeps DOM writes low, and a non-zero opacity helps LCP. Proposed default accepted by the owner |
| Cover blur | A tiny build-time blurred cover inlined in the HTML, shown in the overlay and faded out with opacity; no animated `filter` | Animating `filter: blur()` on the real cover; ThumbHash/BlurHash decoded in the browser | No extra request or decoder in the browser; blur stays static and off the page element. Proposed default accepted by the owner |
| Commands and logs | All window commands and dock logs come from the content, per docs/02 and docs/05 (docs/05's `about.text(3)` becomes `about.text("I'm a full-stack software…")`); a per-section log carried by the build script | Keep the generic `Reading <file>...` log and the `…` placeholders | B22 technical authenticity; the approved microcopy. Proposed default accepted by the owner; the log mechanism found while reading src/runtime/layer.ts |
| `src/runtime/` boundary | Frozen: scheduler.ts, clock.ts, triggers.ts, focus-rule.ts, resize.ts, keys.ts, controls-timing.ts, main.ts, api.ts. Allowed: the effects files, an additive optional `log` field through types.ts and compiler.ts, and layer.ts for the log | Freeze compiler.ts and layer.ts too (proposed in the Q&A) | The per-section logs cannot reach the dock without carrying them in the timeline and reading them in the layer; neither is the scheduler the Stage 3 PRD froze. Refined after the Q&A; flagged to the owner for review |
| Image metadata | `check:privacy` fails on EXIF, XMP or GPS in `src/assets`; output images carry none | Trust manual stripping | A photo's GPS would publish the city, which the privacy list forbids. Proposed by the writer |
| Methodology | Unchanged: `tdd: false`, `test_frameworks: [vitest, playwright]` | `tdd: true` | Stage 2 setting; the test pair authors after the Implementer and Code Review |
| Docs amendments | Done in the PRD session right after approval, before Phase 1, uncommitted for the owner | A docs-only phase in the pipeline | Docs first; same practice as Stages 2 and 3 |

---

## Research Summary

**Market Context**
- Chromium's LCP ignores paints at opacity 0 (Chrome 86), low-entropy images (Chrome 112), removed content (Chrome 88) and transparent text (Chrome 130) (https://chromium.googlesource.com/chromium/src/+show/main/docs/speed/metrics_changelog/lcp.md); an element animated from opacity 0 is not a candidate until it repaints visibly, so fades should start at a non-zero opacity (https://www.debugbear.com/blog/opacity-animation-poor-lcp).
- web.dev recommends `fetchpriority="high"` on the likely LCP image, never lazy-loading it, and warns that an element hidden until JavaScript runs adds render delay (https://web.dev/articles/optimize-lcp).
- `mask-image` and `mask-position` are Baseline widely available since December 2023 and `mask-image` animates discretely (https://developer.mozilla.org/docs/Web/CSS/mask-image); web.dev keeps animations to `opacity` and `transform` for the compositor and notes that blur is costly to paint (https://web.dev/articles/animations-guide).
- `sharp`'s `raw()` output with `ensureAlpha()` gives RGBA pixels for a build-time generator (https://sharp.pixelplumbing.com/api-output#raw); Astro's image service is `sharp`-based, offers `getImage()`, `<Image>` and `<Picture>` with AVIF/WebP, and has no built-in blur placeholder.
- Gaps (web research hit its scope cap): no source says whether an image under `clip-path` or partial opacity beneath an overlay is an LCP candidate (needs a trace); no primary numbers for animating masks or `filter: blur()` on low-end phones; ASCII ramp and grid conventions were not researched beyond prototype v2.

**Technical Context**
- Effect registry: `EFFECTS` (src/runtime/types.ts:1-12), `EFFECT_DURATION_MS` and `cardPhases` (src/runtime/effect-timing.ts; `cover: localMs >= 250`), `RUNNERS` (src/runtime/effects.ts; the `build-card` runner never touches `.sp-card-cover`); compiler.ts validates through the registry only. Effects mount each step from its start time on every tick (`createEffects().onTick`).
- Timing: compiler.ts:52-91 computes `commandEnd` (250 + 40 × length + 80, overridable), `windowEnd` (+100, overridable), `buildStart` (+280, overridable), `createdAt` and `duration` (+500); layer.ts animates the window opening between `windowEnd` and `buildStart` and switches the dock from the log to "Building…" at `windowEnd` (layer.ts:381-400); dock typing follows the layer-timing constants regardless of `commandEnd`. Base-script estimates at 1×: About ≈ 2.51 s, Projects ≈ 3.38 s, Stack ≈ 2.62 s, Contact ≈ 2.60 s to `createdAt`; hero 2.60 s created and 3.10 s done from load, headline readable ≈ 1.84 s.
- The dock log for every section is `buildStrings.readingFile(tl.file)` (src/runtime/layer.ts:393; src/strings.ts:86).
- Images: `photo: nonEmpty` and `cover: nonEmpty.optional()` (src/content-schemas.ts:27,59) resolved by `import.meta.glob` `?url` (src/components/page/resolve-asset.ts); `Photo.tsx` hard-codes 900 × 1600; `ProjectCard` and `ProjectHeader` render `<img>` or `CoverPlaceholder`; no `sharp`, no `astro:assets` (package.json, Astro 6.4).
- Project pages: `[slug].astro` renders `<Content />` inside `<Prose>` only when the body has text; relay's body is one sentence.
- Quality gates: `scripts/check-budgets.mjs:8-11` (90/18/20/25 KB); measured on 2026-11-08: total JS 13.9, runtime 12.1, critical 12.8, CSS 7.4 KB (docs/context/testing.md); `lighthouserc.json` audits `/` and `/projects/relay/`; `verify-build-targets.mjs` requires every step target to exist; tests/unit/runtime-pacing.test.ts pins the base timings; no spec covers image-resolve or per-section budgets yet.
- Prototype v2 (https://claude.ai/artifact/ABxEwc9LHKR7cwy3rjQvDj): `hero.photo("fabio.png")` at 1600 ms shows a skeleton for 150 ms, a 48 × 48 ASCII string of the silhouette (ramp ` .:-=+*#%@`, font size from the box width over the columns, line height from the box height over the rows) until 500 ms, then the photo; cards show `.sp-card-cover.is-resolving` while the title types; section plans add the pause, 40 ms per character, Enter, a 100 ms log gap and a 280 ms opening before the first element.

---

*Generated: 2026-11-09*
*Approved: 2026-11-10*
*Status: APPROVED*
