# Stage 3 · Runtime: the build engine that builds the page live

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (runtime layers, build-script format and compiler, clock model, build layer outside React); cross-cutting patterns (one overlay build layer, nanostores state, data-* contract, budgets); creation of components (BootTerminal, CommandDock, BuildWindow, CommandLine, LogLine, SelectionBox, Skeleton as TypeScript DOM factories); impact on shared UI (Base.astro head script and body script, nav entrance, footer build summary); business rules for build (B1–B24; B25 deferred), navigation (N3, N7, N13) and visual-design (V1, V9, V10, V13, V14, V15)
- Decisions found: Presentation-only scope; D1 English only; D2 Astro + React + TypeScript strict with the runtime in plain TypeScript outside React and nanostores between the runtime and islands; D6 full build on every visit, a saved ∞ speed kept; D7 interactive dock in v1.1; D8 multi-cursor agents in v1.1; D12 ASCII → photo (Stage 4 here); D17 build windows; D19 the dock at the bottom center; D20 the dot grid only inside build windows; Stage 1 approved (prototype v2 is the rhythm reference); Stage 2 PRD approved (no ⌘K button, no dead controls, footer Replay waits for the runtime, tdd: false with Vitest and Playwright); Stage 2 approved (the runtime adds the build on top without changing layout, content or accessibility, and keeps the section markup contract)
- Applicable anti-patterns: layout-shifting build animations; hiding pending content with display or visibility; generic fade-up reveals; scroll hijacking; re-rendering React per typed character; many timers instead of one loop; mixing the two registers; raw values instead of tokens; OS or app branding in the window chrome; publishing private data; scope creep into v1 (no palette, agents, interactive dock or image-resolve here); weakening tests to get a green run
- Applicable architectural rules: SSG with complete final HTML and progressive enhancement (an inline head script picks the mode before first paint; no JS renders the final page); the build layer is one overlay, decorative (aria-hidden except its control buttons), animating only transform, opacity and clip-path; pending content stays laid out and in the accessibility tree; one requestAnimationFrame loop, IntersectionObserver triggers, ResizeObserver placement, pause while hidden, deterministic clock in tests; budgets (critical JS ≤ 20 KB gzip, runtime + effects ≤ 18 KB gzip, total JS ≤ 90 KB gzip, CSS ≤ 25 KB gzip, Lighthouse ≥ 95, CLS ≈ 0); WCAG 2.2 AA in both themes; tokens only (check:tokens); docs/ is the source of truth and is updated before code; relay artifacts live in PRPs/, nothing under .claude/
- Result: PROCEED
```

## Problem Statement

site-pro's whole concept (D17) is a page that builds itself live: a typed command opens a build window that creates each section, then steps aside and leaves a modern, readable page. After Stage 2 the page exists as complete static HTML, but nothing builds it; the show only exists in a disposable prototype that cannot ship. Until a production runtime exists, the site is one more static portfolio, Stage 4 has nothing to write its section scripts against, and none of the behavior rules in docs/02-experience.md can be verified.

## Evidence

- "The build runtime, build-layer components and stores are not built yet (Stage 3)" (docs/context/architecture.md:3).
- The Stage 2 suite asserts the absence of the show: `tests/e2e/home-no-build-layer.spec.ts` checks that no `.sp-boot`, `.sp-dock`, `.sp-window`, `.sp-select` or `.sp-skel` exists and that the served HTML has no `data-build` (Stage 2 AC-12).
- Prototype v2 (the approved rhythm) is not production code: it re-renders the whole React tree on every animation frame (a `setFrame` per `requestAnimationFrame`), positions the hero absolutely with its own numbers, hard-codes the content, and has no deep links, focus rule, scroll hint or tests. "Stage 1 prototypes live in the design tool and are disposable" (docs/07-roadmap-and-decisions.md).
- The roadmap puts Stage 3 next, with the exit criterion "Every scenario in 02 · Behavior rules covered by an E2E test" (docs/07-roadmap-and-decisions.md, Stages table); Stage 4 ("Sections and effects") depends on it.
- The budgets rule out an off-the-shelf animation library: runtime + effects ≤ 18 KB gzip and critical JS ≤ 20 KB gzip (docs/06-architecture.md, docs/04-animations.md "Runtime performance").

## Proposed Solution

Build the runtime exactly as docs/06-architecture.md designs it, in plain TypeScript outside React: an inline head script that picks the mode before first paint (no JS, reduced motion and a saved `∞` render the page as is; otherwise sections are marked pending) with a watchdog that reveals everything if the runtime never starts; a declarative build script per section, written as a sequence of steps and compiled at build time into an absolute per-section timeline that Astro serializes into the section's `data-*` attributes; a scheduler that runs one section at a time on a single `requestAnimationFrame` loop with overlapping steps, speed (1×, 2×, ∞) and turbo ×5; an injectable clock (real by default, manual in Vitest, Playwright's `page.clock` in E2E); the build layer (boot terminal, command dock, build windows, selection boxes, skeletons) as small DOM factories ported from the Design System v2 markup and classes; the element effects catalog except `image-resolve`; base build scripts for the five sections with prototype v2's commands and timings on the current content; and every visitor control and behavior rule (Skip, Run all, speed, Replay, Play build, turbo, deep links, nav clicks, the focus rule, resize, reduced motion, revisits, background tab, scroll hint). This approach over alternatives: it follows decisions already made (D2, D6, D17, D19), reproduces the approved rhythm without the prototype's per-frame React renders, keeps React and every dependency except nanostores off the critical path to hold the budgets, and leaves Stage 4 a data-only job (real assets, `image-resolve`, per-section tuning).

## Key Hypothesis

We believe a declarative-script runtime driven by a single clock, with every control and behavior rule built in, will let Stage 4 add and tune sections as data and give visitors a build show that never blocks reading, keyboard use or screen readers.
We'll know we're right when all 18 behavior rules pass as E2E tests with the base scripts, the budgets and Lighthouse stay green, and Stage 4 lands without changing the scheduler.

## What We're NOT Building

- `image-resolve` (the hero photo from ASCII to the real photo, D12; project covers resolving from a blurred version), the build-time photo → ASCII script, the real photo and covers, and the project page body text — Stage 4.
- Per-section tuning of the scripts against their budgets with the real content — Stage 4 (Stage 3 ships base scripts with prototype v2's timings).
- The Command Palette (and its Go to, Run all, Replay, Speed and Theme commands), the `⌘K` nav button, the `?` shortcut list, scroll-spy, the card → project page view transition with the dock's `open("slug");`, the `ENOENT` 404 build window, toasts and the easter eggs (window-dot close B25, a boot `warn Coffee level low`) — Stage 5.
- Analytics events (Skip usage, Replay, deepest section) — Stage 6 (D10).
- A build on project pages or the 404: the runtime runs only on `/`; those pages keep their Stage 2 rendering.
- The interactive dock prompt (D7), multi-cursor agents (D8), keyboard sound and the element counter — v1.1 or later; v1 scope is closed.
- Any change to the Stage 2 layout, content, section ids, labels or heading structure.

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Behavior rules covered by E2E | 18 of 18 rules in docs/02-experience.md "Behavior rules" | Rule → spec mapping recorded in docs/context/testing.md; Playwright `e2e` CI job green |
| Runtime + effects size | ≤ 18 KB gzip | Extended `pnpm check:budgets` in the `budgets` CI job |
| Critical JS (inline head scripts + runtime entry) | ≤ 20 KB gzip | Extended `pnpm check:budgets` |
| Layout stability during the build | CLS ≤ 0.01; element boxes equal to the no-JS page at fixed clock moments | Playwright layout-shift entries and box comparison with `page.clock`; Lighthouse CI |
| Accessibility during the build | 0 axe violations at 4 clock moments × 2 themes × 2 viewports | Playwright + `@axe-core/playwright` |
| Hero timing at 1× | Headline readable ≤ 2.0 s, hero complete ≤ 3.2 s | Playwright with `page.clock` |
| Lighthouse on `/` with the build running | ≥ 0.95 in every category | Lighthouse CI, median of 3 runs |
| Rhythm parity | Owner approval against prototype v2 | Owner review on the pull request preview |
| Scheduler stable through Stage 4 | No change to the scheduler in `src/runtime/` in the Stage 4 pull requests, except bug fixes recorded in docs/decisions.md | The `src/runtime/` diff reviewed at Stage 4 close-out |

## Acceptance Criteria (test scenarios)

Mandatory. Each criterion is an observable scenario the resulting code must
satisfy. If `tdd: true` in `docs/context/methodology.md`, these are the
contract the test pair authors test-first (before the Implementer). If
`tdd: false` with a declared framework, they are the contract the test pair
authors test-after (after the Implementer + Code Review). With no framework
declared, no tests are authored.

Unless stated otherwise: the built site served by `astro preview`, a 1280×800 viewport, motion allowed, no stored speed, and Playwright's clock installed before navigation. "Clock time" is the time advanced on that clock since navigation.

- **AC-1 Boot and hero within budget:** Given `/`, when the page loads, then before first paint `<html>` is in pending mode and every section's content is visually hidden (opacity 0 or clipped) while staying laid out and in the accessibility tree; the boot terminal in the middle of the screen types `startSite();` and logs `Initializing application...` and `Opening hero.tsx...`; the nav slides in; the terminal folds into the dock and a `hero.tsx` build window opens over `#top` and types `hero.title("Fabio Barreto.")`, `hero.role("Senior Software Engineer")`, `hero.photo(…)`, `hero.intro(…)` and `hero.links([…])` in that order; the `<h1>` "Fabio Barreto." is fully visible by 2.0 s of clock time; and by 3.2 s the hero is in its final state, its window is gone, the dock has shown `✔ Hero Section created. (<t>s)` and is idle with `✓ 1/5 sections`, `❯ █` and `scroll ↓`.
- **AC-2 Trigger, order and scrolling up:** Given the hero built and the dock idle, when the visitor does not scroll for 30 s of clock time, then About stays pending and no window opens; when About's top crosses 75% of the viewport height, then the dock types `renderAbout();`, logs `Reading about.md...` and an `about.md` window builds the section; at no moment are two build windows open, and sections always start in document order (hero, about, projects, stack, contact); after the visitor scrolls back up to built sections and down again, no window opens over a built section and none of its elements animates again.
- **AC-3 Scroll hint:** Given the hero built and the dock idle, when 4 s of clock time pass without a scroll, then the dock's `scroll ↓` hint is in its pulsing state; the pulse stops at the next scroll; with `prefers-reduced-motion: reduce` it never pulses.
- **AC-4 Reserved space and a layout that never moves:** Given the document-relative boxes of every section, heading, paragraph, button, project card and stack group recorded with JavaScript disabled at 1280×800 and at 375×812, when the build runs and the clock is paused during the boot, mid-hero, mid-projects (with two cards overlapping) and after the build is complete, then every box and the document height equal the no-JS values (±0.5 px) and the summed layout-shift entries are ≤ 0.01; each pending section shows a faint dashed outline labeled with its window's file name (for example `projects.tsx`), and that label is not exposed to the accessibility tree; and every build-layer element (boot terminal, dock, windows, selection boxes, skeletons, outlines) lives in one overlay root outside `<main>`, is `aria-hidden` except the dock's control buttons, and animates only `transform`, `opacity` or `clip-path`.
- **AC-5 Turbo:** Given the hero built, when the visitor scrolls straight to Contact (past About, Projects and Stack within 1 s), then About, Projects and Stack are queued and build in order at 5× speed while the dock shows `queued <n>/5` (n being the section being caught up), each taking one fifth of its 1× clock time (± one frame), and Contact builds at 1× right after them.
- **AC-6 Never hijack scrolling:** Given any build in progress and no visitor input, when the clock runs through the complete build of the hero and of every triggered section, then `window.scrollY` never changes; the runtime moves the page only on Replay (to the top) and Play build, while nav links and deep links use the browser's own anchor navigation.
- **AC-7 Skip:** Given a section building with its window open, when the visitor presses `Esc`, or activates the dock button named "Skip this section's build", or clicks the window's title bar or command bar, then within one frame that section is in its final state, its window is gone, the dock shows `✔ <Section> Section created. (<t>s)`, and the next section still waits for its own trigger; a click on the window body does not skip; and when the mobile menu popover is open, `Esc` only closes the menu.
- **AC-8 Run all:** Given the hero built and the other sections pending (triggered or not), when the visitor presses `Shift + Esc`, then every remaining section reaches its final state within one frame, no window remains, and the dock shows `✔ Build complete: 5 sections in <t>s` with `↻ Replay`.
- **AC-9 Deep links and nav clicks:** Given a first visit to `/#projects`, when the page loads, then the browser's anchor navigation puts Projects in view at once and the runtime does not scroll; the hero (boot included) and About build in turbo, in order, while Projects shows its pending outline; and then Projects builds at 1×. Given only the hero built, when the visitor activates the nav's Stack link, then the page goes to Stack at once, About and Projects build in turbo in order, and Stack builds at 1× after them. The same holds for `#about` and `#contact`.
- **AC-10 Keyboard focus:** Given About, Projects and Stack pending, when keyboard focus enters an element inside Stack (for example `element.focus()` on a link in it, or Tab from the last control before it), then Stack and every section before it reach their final state within one frame, focus stays on that element and its 2px accent focus ring is visible; and given the boot in progress, when keyboard focus moves into the nav, the skip link's target or the hero, then the hero reaches its final state within one frame.
- **AC-11 Immediate interaction:** Given the Projects window open, with the relay card created and later cards still building, when the visitor clicks the relay card's title, then the browser navigates to `/projects/relay`; the window body has `pointer-events: none`, so clicks reach the page; only the title bar and the command bar catch clicks; and elements not yet created do not receive pointer events.
- **AC-12 Resize during a build:** Given a section building at 1280×800, when the viewport width changes to 1024 or to 800, then that section reaches its final state within one frame and the next section builds normally on its trigger, with its window aligned to the section's new box; given a section building at 375×812, when only the viewport height changes (the mobile URL bar showing or hiding), then the build continues.
- **AC-13 Speed and revisits:** Given the dock's speed control showing `1×`, when the visitor activates it repeatedly, then it cycles `1×` → `2×` → `∞` → `1×`, its accessible name follows the state ("Build speed: 1x. Switch to 2x", …) and `localStorage` key `sp-speed` holds the choice; at `2×` the hero completes in half its 1× clock time; switching to `∞` finishes the current section and every triggered one instantly; on a reload with `1×` or `2×` saved, the full build plays again from the boot at that speed (D6); and on a reload with `∞` saved, the page is ready before first paint, no boot terminal, window or typing appears, and the dock shows `✓ 5/5 sections`.
- **AC-14 Reduced motion and Play build:** Given `prefers-reduced-motion: reduce`, when `/` loads, then no boot terminal, window, selection box, skeleton or typing appears, all content is visible at `DOMContentLoaded`, the dock's cursor is steady and the dock shows `✔ Ready · motion reduced` with a button named "Play the build animation"; when the visitor activates it, then the page scrolls to the top and the build plays at 1× from the boot.
- **AC-15 No JavaScript and the failsafe:** Given JavaScript disabled, when `/` loads, then the page equals the Stage 2 rendering: all content visible, no pending state, no dock or window, and no build summary in the footer. Given JavaScript enabled but the runtime module request aborted (or the runtime throwing while it starts), when `/` loads, then within 3 s of clock time the pending state is removed, every section is visible in its final state and no build-layer element remains on screen.
- **AC-16 Background tab:** Given a section building, when the tab becomes hidden (`document.visibilityState === "hidden"`) for 10 s of clock time, then the build does not advance; when the tab becomes visible again, then the build resumes from the step it was on.
- **AC-17 Done, collapsed dock and Replay:** Given every section built at 1×, then the dock shows `✔ Build complete: 5 sections in <t>s` with `↻ Replay` for about 4 s and then collapses into the round `❯_` button; activating `❯_` expands the dock back into its done state; the footer shows `Built live in <t>s · ↻ Replay`, with the same `<t>` as the dock, in a slot reserved in the static footer (filling it moves nothing); in instant mode (`∞` or reduced motion) the footer slot shows only `↻ Replay`; and when the visitor activates Replay (dock or footer), then the page scrolls to the top, every section returns to pending and the build replays from the boot.
- **AC-18 Accessibility during the build:** Given the clock paused during the boot, mid-hero, mid-projects and after the build is complete, in Midnight and Daylight, at 1280×800 and 375×812, when `@axe-core/playwright` runs with the WCAG 2.0, 2.1 and 2.2 A/AA tags, then it reports 0 violations; at each of those moments the text content of `<main>` and its accessibility tree equal the no-JS rendering (typing never rewrites page text and is never announced); and the dock's controls are real `<button>` elements named "Skip this section's build", "Build speed: …", "Replay the build" and "Play the build animation", reachable by Tab, each showing the 2px accent focus ring.
- **AC-19 Budgets and Lighthouse:** Given a CI run, when the size check runs on `dist/`, then the JavaScript that `/` loads for the runtime and its effects (nanostores included) is ≤ 18 KB gzip, the inline head scripts plus the runtime entry chunk are ≤ 20 KB gzip, the total JavaScript is ≤ 90 KB gzip and the total CSS is ≤ 25 KB gzip, and the job fails when any threshold is exceeded; and Lighthouse CI on `/` and `/projects/relay`, with the build running on `/`, keeps the median score ≥ 0.95 in Performance, Accessibility, Best Practices and SEO and the median CLS ≤ 0.01.
- **AC-20 Build scripts and the compiler:** Given a section build script written as a sequence of steps (each with a call, a target, an effect and an optional gap or overlap), when Vitest compiles it, then it produces an absolute 1× timeline in ms in which each step starts where the previous one ends plus its gap, or earlier by its overlap (each Projects card starts 120 ms before the previous card ends), and each effect lasts its content-derived duration (a headline of n characters selects for 150 ms, then types for n × 28 ms); a script naming an unknown effect or a target that does not exist in the section fails `pnpm build` with a message naming the section and the step; and every command shown on screen (dock and window) is a string from the script whose arguments come from the content (`hero.title("Fabio Barreto.")` from the profile headline, one `projects.card("<slug>")` per project, B22).
- **AC-21 Mobile build layer and tall sections:** Given 375×812, when the hero builds, then its build window shows a single compact bar with the current command, the dock spans the viewport width minus 16 px on each side and shows only the status and `» Skip`, and a tap on the window's bar skips the section; and given a section taller than the viewport building at 1280×800 or 375×812, when the visitor scrolls through it, then its title bar and command bar stay stuck under the nav until the section's end.

**Behavior rule coverage** (docs/02-experience.md "Behavior rules" → AC): Trigger → AC-2 · Scroll hint → AC-3 · Order → AC-2, AC-5 · Reserved space → AC-4 · The final layout never moves → AC-4 · Fast scrolling (turbo) → AC-5 · Never hijack scrolling → AC-6 · Skip → AC-7 · Run all → AC-8 · Deep links → AC-9 · Keyboard focus → AC-10 · Scrolling up → AC-2 · Immediate interaction → AC-11 · Resize during a build → AC-12 · Revisits → AC-13 · Reduced motion → AC-14 · No JavaScript → AC-15 · Background tab → AC-16.

## Open Questions

- [ ] Whether a page receives `Shift + Esc` in Chrome on Windows and Linux, where Chrome lists it as the Task Manager shortcut; verified on real Chrome in Phase 4. If Chrome swallows it, the gap is recorded in docs/02 and the Stage 5 palette's Run all is the keyboard path (the E2E test dispatches the key to the page, so it proves the handler, not the browser's reservation).
- [ ] Whether `/` keeps Lighthouse Performance ≥ 0.95 with the hero revealed by the runtime (Chromium ignores `opacity: 0` elements for LCP); measured from Phase 1. If it falls short, the numbers go to the owner; no threshold is relaxed and nothing changes in what is hidden without the owner's decision.
- [ ] The watchdog timeout: 3 s proposed (AC-15); confirmed in Phase 1 against real load times on the preview.
- [ ] Whether Playwright screenshot baselines of build states at fixed clock moments gate CI or stay advisory (Stage 2 left visual baselines out of the gates).
- [ ] The "unstyled → styled" joke effect (docs/04 optional effects) and the boot `warn Coffee level low` easter egg: decided in Stage 4 and Stage 5.

---

## Users & Context

**Primary User**
- **Who:** The owner, as the site's only developer, who writes and tunes the per-section build scripts in Stage 4 on top of this engine. The end consumer is the visitor (the international developer community and people who don't code), who watches the site build itself and must keep full control: reading, Skip and speed, keyboard, screen reader, reduced motion and a phone.
- **Current behavior:** The page is static; the build show only runs in the Claude Design prototype, which cannot be reused.
- **Trigger:** Opening `/` (visitor); writing or tuning a section's build script (owner).
- **Success state:** A section is added or tuned by editing its build script only, and every control and behavior rule works on it without section-specific code; the visitor sees the approved rhythm and can always skip it.

**Job to Be Done**
When I write a section's build script in Stage 4, I want a runtime that already handles order, timing, triggers, controls and accessibility, so I can focus on content and effects without touching the engine.

**Non-Users**
Recruiters and clients looking for a résumé (the site is a short, presentation-only invitation); visitors without JavaScript, who get the Stage 2 page untouched; people expecting the interactive dock prompt (D7) or agent cursors (D8), which come in v1.1.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Mode head script in `Base.astro` (reduced motion, saved `sp-speed`, pending marking before first paint) with a watchdog that reveals everything if the runtime does not confirm its start | Progressive enhancement and the "hide only after JS confirms" rule; content can never stay invisible |
| Must | Build-script format and compiler: sequence of steps (call, target, effect, gap/overlap) compiled at build time into an absolute 1× timeline and serialized into each section's `data-*` attributes, with `data-*` targets on the elements; commands built from the content | Owner decision; deterministic moments for tests; B22 technical authenticity |
| Must | Scheduler: one section at a time, lifecycle `pending → queued → command → window → building → closing → done` (+ `skipped`), overlapping steps, one `requestAnimationFrame` loop, speed 1×/2×/∞, turbo ×5, pause while hidden | B1, B6, B18, B19; the docs/04 lifecycle |
| Must | Clock interface: real time by default, a manual clock for Vitest, compatible with Playwright's `page.clock` (no test hook in production); seeded randomness for the decode scramble and the typing jitter | Deterministic tests (docs/04, docs/06) |
| Must | Triggers: `IntersectionObserver` at 75% of the viewport; `focusin` for the focus rule; width-only resize | B2, B11, B14 |
| Must | Build layer as TypeScript DOM factories from the Design System v2: BootTerminal, CommandDock (typing, building, created, idle, done, reduced, collapsed; compact under 768 px), BuildWindow (opening, building, closing; compact; bars sticky under the nav), CommandLine with the tokenizer, Cursor, LogLine with the spinner, SelectionBox, Skeleton, the pending outline; tokens only; blur only while visible and solid with `prefers-reduced-transparency` | D19, D20, V9, V13, V14; React stays off the critical path |
| Must | Element effects: `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger`, `build-card`, each able to finish instantly; the window commands typed at 12 ms per character (≤ 350 ms) and the dock at 40 ± 10 ms | docs/04 effects catalog (minus `image-resolve`, Stage 4) |
| Must | Base build scripts for Hero, About, Projects, Stack and Contact with prototype v2's commands and timings on the current content and placeholders | Owner decision on the Stage 4 boundary; needed to test every rule end to end |
| Must | Controls: Skip (`Esc`, `» Skip`, title or command bar click), Run all (`Shift + Esc`), the speed toggle with persistence, Replay (dock and footer), Play build (reduced motion), the collapsed `❯_` button reopening the done state | docs/04 "Visitor controls"; owner decision on `❯_` |
| Must | Navigation: deep links and nav clicks scroll at once through the browser's anchor navigation while earlier sections catch up in turbo; the focus rule finishes the focused section and every one before it | Owner decision; B7, B10, B11, N3 |
| Must | Reduced motion, `∞` and no-JS paths; the scroll hint after 4 s idle; the footer build summary slot | B3, B15, B16, B17, N13 |
| Must | nanostores state (`currentSection`, `progress`, `status`, `speed`) mirrored as `data-*` attributes, and a controls API (`skip`, `runAll`, `setSpeed`, `replay`, `play`) for the Stage 5 palette | docs/06 "The runtime (design)" |
| Must | Quality gates: E2E for all 18 behavior rules, axe during the build, layout invariance, the extended size check (runtime ≤ 18 KB, critical ≤ 20 KB), Lighthouse kept ≥ 95, the Stage 2 "no build layer" spec rewritten to the new behavior | Stage 3 exit criterion and budgets |
| Should | The runtime's public TypeScript API documented in docs/api-reference.md | Stage 5 consumes it |
| Should | Playwright screenshot baselines of build states at fixed clock moments, advisory | docs/06 "Quality and testing"; gating is an open question |
| Could | The Design System `title` tooltips on the dock buttons (`Skip (Esc)`) | Small discoverability aid |
| Won't | `image-resolve`, the photo → ASCII script and real assets; per-section budget tuning | Stage 4 |
| Won't | Palette, `⌘K`, `?`, scroll-spy, view transitions, `open("slug");`, `ENOENT` window, toasts, easter eggs | Stage 5 |
| Won't | Analytics; a build on project pages or the 404; D7, D8, keyboard sound, element counter | Stage 6, out of scope, v1.1 |

### MVP Scope

The runtime building the five sections of `/` with the base scripts and the Stage 3 effects, every visitor control, and all 18 behavior rules passing as E2E tests in CI, within the budgets and with Lighthouse ≥ 95.

### User Flow

- **Visitor, first visit:** loads `/` → the boot terminal types `startSite();` → the nav slides in, the terminal folds into the dock, and `hero.tsx` builds the hero (≤ 3.2 s) → the dock waits at `❯ █` → scrolling past 75% builds About, then Projects, Stack and Contact (turbo if they scroll fast; `Esc` skips, `Shift + Esc` runs all, the speed toggle changes the pace) → `✔ Build complete` → the dock collapses into `❯_`; Replay is in the dock and the footer.
- **Visitor, other paths:** a deep link or nav click goes to the target at once while earlier sections catch up in turbo; with reduced motion the page is ready and `▶ Play build` plays the show; with a saved `∞` the page is ready on every visit; without JavaScript the Stage 2 page appears.
- **Owner:** writes a section's build script → `pnpm build` compiles it (or fails naming the bad step) → `pnpm dev` shows it with every control → E2E and budgets run in CI on the pull request → reviews the rhythm on the preview.

---

## Technical Approach

**Feasibility:** MEDIUM. The model is proven by prototype v2 (per-section timelines, one loop, triggers at 75%, turbo ×5, every control) and the Design System supplies the build-layer markup and styles. The risks are the 18 KB budget for engine, effects and build layer together, effects that must run in place on the real page without moving layout or rewriting text, and Lighthouse Performance with a hero revealed by script.

### TDD routing

Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

`test_frameworks: [vitest, playwright]` is declared, so the test pair authors and maintains the suite for every phase.

### Architecture Notes

- **Docs amendments after approval (docs first).** Made in the PRD authoring session right after approval, left uncommitted for the owner: a "Stage 3 PRD approved" entry in docs/decisions.md (the Stage 3/4 boundary, the script model, the collapsed dock in Stage 3, the nav and deep-link timing, turbo ×5, the focus rule scope, width-only resize, the footer slot, runtime only on `/`, the watchdog); docs/02-experience.md (deep links and nav clicks scroll at once while earlier sections catch up in turbo; the focus rule finishes every section up to the focused one; resize means a width change; `Esc` with the menu open); docs/04-animations.md (the script grammar: sequence with gap/overlap compiled to a timeline; turbo ×5; `image-resolve` in Stage 4); docs/06-architecture.md (build components as TypeScript DOM factories, the Clock and `page.clock`, how the budgets are measured); docs/domain/areas/build.md (B6 resolved at ×5, B11 and B14 wording, open questions); docs/context/architecture.md (the [INFERRED - VALIDATE] timeline note resolved); the PRD link on the Stage 3 row of docs/07-roadmap-and-decisions.md; the docs/README.md changelog.
- **Modes before first paint.** The `Base.astro` inline head script (today it applies the theme, `src/layouts/Base.astro:20-33`) also reads `prefers-reduced-motion` and `sp-speed` and sets a build mode on `<html>`: none without JS, `instant` for reduced motion or `∞`, `pending` otherwise. Pending CSS hides each section's content with `opacity`/`clip-path` (never `display`/`visibility`) and only on `/`. The head script starts a watchdog (3 s proposed) that removes the pending mode unless the runtime has confirmed its start; the runtime also reveals everything if it throws.
- **Build scripts.** One script per section, authored next to its Astro section (for example `src/sections/hero.build.ts`) as a sequence of steps whose commands interpolate the content; compiled in the section's frontmatter at build time into an absolute 1× timeline and serialized into a `data-build` attribute on the section, with `data-build-target` hooks on the elements it creates. The Stage 2 contract (section ids `top`, `about`, `projects`, `stack`, `contact`; `aria-label`/`aria-labelledby`; one `<h1>` and one `<h2>` per section) does not change. The compiler validates effects and targets and fails the build on a bad step.
- **Runtime layout.** `src/runtime/` (program, compiler types, scheduler, clock, effects, triggers, overlays, controls, persistence), `src/components/build/` (DOM factories ported from the Design System `index.tsx` build components and the build section of `bundle.css`), `src/stores/` (nanostores). The entry is a module loaded only by `src/pages/index.astro`, so project pages and the 404 load no runtime.
- **Clock.** The scheduler reads time only through a `Clock` (`now()`, `onFrame()`): `performance.now()` + `requestAnimationFrame` in production, a manual clock in Vitest. Playwright's `page.clock` fakes `requestAnimationFrame` and `performance`, so E2E tests freeze and advance the real runtime without a production hook. Frame deltas are capped (prototype: 50 ms). Effects are driven from this clock (per-frame writes of `transform`, `opacity`, `clip-path` and overlay text); only decorative loops (cursor blink, skeleton shimmer, spinner glyphs) may be CSS or loop-driven without affecting state. Randomness (decode scramble, typing jitter) comes from a seeded generator.
- **In-place effects without moving layout.** Page text is never rewritten: typing and decoding reveal the real text visually (for example `clip-path` reveals with the caret and the scrambled glyphs drawn in the overlay), so the text content and accessibility tree of `<main>` stay equal to the no-JS page (AC-4, AC-18). The plan chooses the technique; the invariants are the ACs.
- **The build layer.** One overlay root, a sibling of `.sp-page` outside `<main>` (`src/pages/index.astro:31-46`), created by the runtime and absent from the static HTML. Windows are placed from each section's box and kept aligned with `ResizeObserver`, move with `transform` only and keep their bars in the section's top padding (sticky under the nav for tall sections). The window body has `pointer-events: none`; the title and command bars catch clicks. Everything is `aria-hidden` except the dock's control buttons, which carry the Design System's accessible names inside a `role="group"` named "Site build". Blur only while a surface is visible; solid `--bg-raised` with `prefers-reduced-transparency` or without `backdrop-filter`. The tokens already exist in `src/styles/tokens.css` (`--syn-*`, `--log-*`, `--build-*`, `--shadow-window`, `--shadow-dock`, `--dock-*`, `--window-bar`), so no raw value is needed.
- **Reduced motion.** `src/styles/base.css:147-194` disables every CSS animation and transition under reduced motion; the runtime checks `matchMedia` itself, renders the page ready and only plays the build when the visitor asks (Play build).
- **State and controls.** nanostores (added as a dependency) holds `currentSection`, `progress`, `status` and `speed`; the runtime mirrors them as `data-*` attributes on `<html>` for CSS and tests. One `keydown` listener handles `Esc` and `Shift + Esc` and ignores `Esc` while an open popover or dialog owns it. `localStorage` stores only `sp-speed` (inside `try`/`catch`, as `src/scripts/theme-toggle.ts` does for the theme).
- **Footer.** `Footer.tsx` gets an empty slot for the build summary in the static HTML, reserved so that filling it moves nothing; the runtime fills it (`Built live in <t>s · ↻ Replay`, or `↻ Replay` alone in instant mode); without JavaScript it stays empty. New copy lives in `src/strings.ts`.
- **Budgets.** `scripts/check-budgets.mjs` counts only blocking head scripts as critical today (lines 30-37); it is extended to measure the runtime's chunks (≤ 18 KB gzip) and the inline head scripts plus the runtime entry (≤ 20 KB gzip), next to the existing totals.
- **Tests.** Vitest (node environment) covers the compiler, scheduler, clock and effects' timing as pure logic; Playwright covers the behavior rules with `page.clock`, axe at fixed moments and layout invariance. `tests/e2e/home-no-build-layer.spec.ts` (Stage 2 AC-12) is rewritten, not weakened: after the build settles, and in instant mode, no build-layer element remains and the text of `<main>` equals the no-JS page; the ban on `data-build` in the served HTML is removed because Stage 3 adds those attributes. The rule → spec mapping is recorded in docs/context/testing.md.

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Lighthouse Performance < 0.95 on `/`: LCP only counts once the hero's headline or photo is visible, and Lighthouse throttles a mobile CPU | M | Measure on the Phase 1 pull request; load the runtime early (module preload) and start the boot as soon as it evaluates; keep the headline readable by ~1.7 s and the photo loaded with priority; report the numbers to the owner instead of relaxing a threshold |
| Content stuck invisible when the runtime fails (blocked request, error, old browser) | L | Head-script watchdog, a runtime error path that reveals everything, and an E2E test with the module request aborted (AC-15) |
| Effects on real page elements move layout or change the accessible text (typing, decoding, late fonts) | M | Never rewrite page text; reveal with `clip-path`/`opacity`; measure after `document.fonts.ready`; box comparison against the no-JS page at fixed clock moments (AC-4, AC-18) |
| The 18 KB budget for engine, effects, build layer, tokenizer and nanostores | M | No dependency besides nanostores, DOM factories instead of React, the size check extended in Phase 1 and watched on every phase |
| Overlays out of place: sticky bars in tall sections, `ResizeObserver`, mobile URL bar resizes | M | Windows placed from section boxes and kept aligned with `ResizeObserver`; width-only resize rule; AC-12 and AC-21 at both viewports |
| `Shift + Esc` reserved by Chrome on Windows and Linux | H | Verified in Phase 4; the gap recorded in docs/02 and covered by the Stage 5 palette (Open Questions) |
| Flaky E2E on an animated page | M | Playwright's clock, seeded randomness, effects driven by the runtime's clock, assertions only on clock-frozen states |

---

## Implementation Phases

| # | Phase | Description | Status | Repo | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|------|----------|---------|----------|
| 1 | Runtime core | Mode head script and watchdog, pending state, build-script format and compiler with the `data-*` contract, Clock, scheduler (order, lifecycle, one loop, speed, turbo, pause when hidden), 75% triggers, nanostores, the size check extension | pending | - | - | - | - |
| 2 | Build layer | BootTerminal, CommandDock (every state, compact), BuildWindow (open/close, sticky bars, compact, `ResizeObserver`, pointer events), CommandLine with the tokenizer, LogLine and spinner, the pending outline, the footer summary slot | pending | - | - | 1 | - |
| 3 | Element effects and base scripts | `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger`, `build-card`, and the five base scripts with prototype v2's commands and timings | pending | - | - | 2 | - |
| 4 | Controls and navigation | Skip, Run all, speed and persistence, Replay, Play build, the collapsed dock, turbo queue status, deep links, nav clicks, the focus rule, width-only resize, the scroll hint, the `Shift + Esc` check | pending | - | - | 3 | - |
| 5 | Quality gates | E2E for the 18 behavior rules, axe during the build in both themes, layout invariance, mobile, budgets and Lighthouse, the rewritten Stage 2 spec, docs/context/testing.md and the runtime API docs | pending | - | - | 4 | - |

### Phase Details

**Phase 1: Runtime core**
- **Goal:** The engine runs on `/`: sections move from pending to done in order as the visitor scrolls, on a single clock, with the no-JS, reduced motion, `∞` and failure paths safe from day one.
- **Scope:** The mode head script in `Base.astro` (reduced motion, `sp-speed`, pending marking on `/` only) with the watchdog; pending CSS (opacity/clip-path); the build-script types, the sequence → timeline compiler with validation, and the `data-build`/`data-build-target` serialization in the five Astro sections (scripts may hold only the steps' commands and targets at this point); the `Clock` (real and manual); the scheduler with the lifecycle, overlapping steps, speed 1×/2×/∞, turbo ×5 and the hidden-tab pause; `IntersectionObserver` triggers at 75%; nanostores and the `data-*` mirror; a minimal reveal so each section appears in its final state when its timeline ends; the runtime entry loaded only by `index.astro`; `nanostores` added; `check-budgets.mjs` extended; Lighthouse measured on the pull request.
- **Success signal:** AC-15, AC-16 and AC-20 pass; the order and trigger parts of AC-2 pass; the size check reports the runtime and critical numbers within budget; the Lighthouse result is reported to the owner.

**Phase 2: Build layer**
- **Goal:** The show's surfaces exist and follow the scheduler: the boot terminal, the dock and a build window per section.
- **Scope:** TypeScript DOM factories for BootTerminal (waiting, typing, logging, folding), CommandDock (typing, building, created, idle, done, reduced, collapsed; compact under 768 px), BuildWindow (opening, building, closing; compact; bars sticky under the nav), CommandLine with the tokenizer and syntax tokens, Cursor, LogLine with the spinner, the pending outline with its file-name label kept out of the accessibility tree; the overlay root outside `<main>`; window placement from section boxes with `ResizeObserver`; `pointer-events: none` on window bodies; the nav entrance during the boot; build-layer CSS ported from the Design System with tokens only, blur only while visible and the reduced-transparency fallback; the reserved footer slot and the build-layer copy in `src/strings.ts`.
- **Success signal:** The boot types `startSite();`, folds into the dock, and each section's window opens and closes on its timeline; AC-11 passes; the layer parts of AC-1, AC-4 and AC-21 pass; check:tokens and the size check stay green.

**Phase 3: Element effects and base scripts**
- **Goal:** The page builds element by element with the approved rhythm.
- **Scope:** The effects registry with `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger` and `build-card`, each with an instant finish, driven by the clock, with seeded randomness, never rewriting page text; window command typing (12 ms per character, ≤ 350 ms, long arguments cut with `…`) and dock typing (40 ± 10 ms, +100 ms after `(` and `,`); the five base scripts with prototype v2's commands (`hero.title`, `hero.role`, `hero.photo`, `hero.intro`, `hero.links`; `about.heading`, `about.text`, `about.links`; `projects.heading`, `projects.card` × 4 with 120 ms overlap; `stack.heading`, `stack.group` × 6; `contact.heading`, `contact.links`, `contact.location`) and timings on the current content and placeholders; the hero photo step uses `select` → `skeleton` → the placeholder until Stage 4's `image-resolve`.
- **Success signal:** AC-1, AC-4 and AC-18 pass; the page builds like prototype v2 (without the ASCII photo); hero ≤ 3.2 s at 1×; the size check stays within 18 KB.

**Phase 4: Controls and navigation**
- **Goal:** The visitor is always in control, and every behavior rule holds.
- **Scope:** Skip (`Esc`, `» Skip`, title and command bar clicks; `Esc` yields to an open popover), Run all (`Shift + Esc`), the speed toggle with its accessible names and `sp-speed` persistence, Replay from the dock and the footer, Play build under reduced motion, the done state and the collapsed `❯_` button reopening it, the `queued <n>/5` status during turbo, deep links and nav clicks (anchor navigation at once, earlier sections in turbo), the focus rule (focused section and every one before it; the hero during the boot), width-only resize, the scroll hint after 4 s idle, the reduced motion and `∞` dock states, the footer summary; the `Shift + Esc` check on real Chrome on Windows recorded in docs/02; the controls API and stores for Stage 5.
- **Success signal:** AC-3, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-12, AC-13, AC-14 and AC-17 pass.

**Phase 5: Quality gates**
- **Goal:** Every Stage 3 target is enforced in CI and visible on the preview.
- **Scope:** The complete E2E suite with `page.clock` covering the 18 behavior rules (the rule → spec mapping in docs/context/testing.md); the axe matrix at fixed clock moments (boot, mid-hero, mid-projects, done) × Midnight and Daylight × 1280×800 and 375×812; the layout-invariance check against the no-JS boxes; mobile (AC-21); the rewritten `tests/e2e/home-no-build-layer.spec.ts`; the size budgets and Lighthouse CI on `/` with the build running; advisory screenshot baselines of build states (Should); the runtime's public API in docs/api-reference.md; the owner's rhythm review on the preview against prototype v2.
- **Success signal:** All 21 ACs pass in CI on the pull request; all nine CI jobs are green; the owner approves the rhythm on the preview.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Stage 3 / Stage 4 boundary | Stage 3 ships the engine, the effects catalog except `image-resolve`, and base scripts for the five sections with prototype v2's timings on the current content; Stage 4 adds `image-resolve` (ASCII → photo with the build-time script, covers from blur), the real photo, covers and project page text, and per-section tuning to the budgets | Engine + minimal fixtures (Stage 4 writes every effect and script); everything except real assets (Stage 3 also ships `image-resolve` and the ASCII script) | Every behavior rule must be testable end to end, and the rhythm must be reviewable in Stage 3; the ASCII effect needs the real photo to be worth tuning. Chosen by the owner |
| Build-script model | Authored as a sequence of steps with gap/overlap and content-derived durations; compiled at build time into an absolute 1× timeline in ms serialized into the section's `data-*` | Absolute `at` per step, as in prototype v2 | A longer title shifts every later step automatically; the compiled timeline gives the deterministic clock exact moments. Resolves the [INFERRED - VALIDATE] note in docs/context/architecture.md. Chosen by the owner |
| Collapsed dock before the palette | The `❯_` button expands the dock back into its done state; Stage 5 rewires it to open the palette | Do not collapse in Stage 3; collapse and hide the button until Stage 5 | No dead control, and the button already sits in its final place. Chosen by the owner |
| Nav clicks and deep links to unbuilt sections | Scroll at once with the browser's anchor navigation; earlier sections are queued and built in turbo; the target builds at 1× when its turn comes | Finish earlier sections instantly; build earlier sections in turbo first, then scroll | Content never waits, it matches the approved prototype, and it reuses the fast-scroll mechanism. Chosen by the owner |
| Turbo multiplier | ×5, active while a later section is already triggered; the dock shows `queued <n>/5` | Anything in the documented 5–10× range | The value tested and approved in prototype v2; resolves the B6 open question. Proposed default accepted by the owner |
| Focus rule scope | Focus entering an unbuilt section finishes it and every section before it; focus in the nav, the skip link's target or the hero during the boot finishes the hero | Finish only the focused section | Keeps the order rule (B1) true. Proposed default accepted by the owner |
| What counts as a resize | A viewport width change | Any resize event | On phones the URL bar changes the height while scrolling; counting it would cut every mobile build short. Proposed default accepted by the owner |
| `Esc` with an open popover or dialog | Closes it and does not skip | Skip and close at once | The mobile menu's light dismiss must keep working. Proposed default accepted by the owner |
| `Shift + Esc` | Kept as documented; verified on real Chrome on Windows in Phase 4; any gap recorded and covered by the Stage 5 palette | A new shortcut now; a Run all button in the dock | No design change before the facts are known. Proposed default accepted by the owner |
| Footer build summary | Arrives in Stage 3 in a slot reserved in the static footer; `Built live in <t>s · ↻ Replay`, or `↻ Replay` alone in instant mode; empty without JavaScript | Wait for a later stage | Stage 2 deferred it to the runtime (Stage 2 PRD); no layout shift and no dead control. Proposed default accepted by the owner |
| Where the runtime runs | Only on `/` | Also on project pages and the 404 | `open("slug");` and the `ENOENT` window are Stage 5. Proposed default accepted by the owner |
| Persistence | Only `sp-speed` (1×, 2× or ∞); a saved `∞` means instant mode before first paint | Remember built sections or the theme in the runtime | D6: every visit plays the full build; the theme is already persisted by Stage 2. Proposed default accepted by the owner |
| Failsafe | A head-script watchdog (3 s proposed) and a runtime error path that reveal everything | No failsafe; a CSS-only timeout | Content must never stay invisible; vendor anti-flicker snippets use 3–5 s. Proposed default accepted by the owner |
| How effects are timed | Driven by the runtime's clock with seeded randomness; only decorative loops in CSS | CSS keyframes and the Web Animations API on their own timelines | Playwright's clock documents `requestAnimationFrame` and `performance`, not CSS animations; tests must freeze any moment. Proposed default accepted by the owner |
| Build-layer components | TypeScript DOM factories ported from the Design System v2 markup and classes | React components or an island | Keeps React off the critical path and inside the 18 KB budget (D2). Proposed default accepted by the owner |
| State | nanostores + `data-*` mirror + a controls API for Stage 5 | Custom events only | docs/06 design; Stage 5's palette needs the controls. Proposed default accepted by the owner |
| Test clock | Playwright's `page.clock` in E2E, a manual clock in Vitest; no test hook in production | A query-string switch exposing a clock | Fakes `requestAnimationFrame` and `performance` without shipping test code. Proposed default accepted by the owner |
| Stage 2 "no build layer" spec | Rewritten to the new behavior and recorded in the test lifecycle ledger | Deleted, or kept with the runtime disabled | The behavior changes on purpose; tests follow intended behavior and are never weakened (docs/context/testing.md). Proposed default accepted by the owner |
| Methodology | Unchanged: `tdd: false`, `test_frameworks: [vitest, playwright]` | `tdd: true` | Stage 2 setting; the test pair authors after the Implementer and Code Review |
| Docs amendments | Done in the PRD session right after approval, before Phase 1, uncommitted for the owner | A docs-only phase in the pipeline | Docs first; same practice as Stage 2. Proposed default accepted by the owner |

---

## Research Summary

**Market Context**
- Playwright's Clock API (since 1.45) installs fake `requestAnimationFrame`, `cancelAnimationFrame`, `performance` and timers; `install` must come before any other clock call, then `pauseAt` and `runFor` step time while timers and animation frames fire; `fastForward` fires due timers at most once, so it does not suit stepping an animation (https://playwright.dev/docs/api/class-clock, https://playwright.dev/docs/clock, https://playwright.dev/docs/release-notes). The docs do not say whether CSS animations or the Web Animations API follow the fake clock.
- Chrome's keyboard shortcut help lists `Shift + Esc` as "Open the Chrome Task Manager" on Windows and Linux (https://support.google.com/chrome/answer/157179); secondary sources give `Search + Esc` on ChromeOS (https://androidguys.com/tips-tools/how-to-open-the-task-manager-on-a-chromebook/). No primary source says whether the page still receives the keydown.
- Chromium's LCP heuristics exclude elements with `opacity: 0`; LCP entries are emitted again when a larger element appears and stop at the first input (https://web.dev/articles/lcp). Lighthouse's mobile LCP bands: green up to 2.5 s, orange 2.5–4 s (https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint).
- Gaps (web research hit its scope cap): no official source on watchdog or CSS-animation failsafes for a pending class (anti-flicker snippets use 3–5 s timeouts); no official Google statement on hidden-then-revealed content beyond indexing what the rendered page shows; the second half of the Playwright release notes and the Chromium source were not read.

**Technical Context**
- `src/layouts/Base.astro:20-33` holds the only inline head script (the no-flash theme) and `:56-59` the body module script importing `theme-toggle` and `nav`; `src/scripts/theme-toggle.ts:35` sets `data-js` on `<html>`.
- `src/pages/index.astro:31-46` composes `.sp-page` (Backdrop + `.sp-page-content`), `main#main[tabindex=-1]` with Hero, About, Projects, Stack and Contact, and the Footer; the overlay root belongs outside `<main>`.
- `src/sections/Hero.astro:21-46`: `section#top[aria-label=Introduction]`, `h1.banner.sp-hero-name` split by a `<br />`, `.sp-hero-photo`, `p.sp-hero-role`, `.sp-hero-copy` and `.sp-hero-actions` with three buttons; `src/sections/Projects.astro:15-44`: `section#projects[aria-labelledby=projects-title]`, `.sp-projects-grid > .sp-projects-cell > article.sp-card`.
- `src/styles/base.css:147-194`: reduced motion forces `animation: none` and `transition: none` with `!important` everywhere; reduced transparency only covers the scrolled nav.
- `src/styles/tokens.css` already defines `--syn-*`, `--log-*`, `--build-select`, `--build-skeleton`, `--build-shine`, `--agent-*`, `--shadow-window`, `--shadow-dock`, `--bg-overlay`, `--grid-dot`, `--dock-height`, `--dock-width` and `--window-bar` in both themes.
- `tests/e2e/home-no-build-layer.spec.ts:5-107` (Stage 2 AC-12) asserts no build layer after 2 s, no `data-build` in the served HTML, transitions of 150–300 ms only and nothing animating under reduced motion; Stage 3 rewrites it.
- `scripts/check-budgets.mjs:8-10, 30-37` counts as critical only blocking head scripts and inline head JS, with 20/90/25 KB limits; the runtime's own size is not measured yet. `lighthouserc.json` audits `/` and `/projects/relay/` (median of 3, ≥ 0.95, CLS ≤ 0.01). `vitest.config.ts` runs `tests/unit/**` in the node environment. `nanostores` is not a dependency yet.
- Prototype v2 (https://claude.ai/artifact/ABxEwc9LHKR7cwy3rjQvDj): per-section timelines in ms at 1× (hero: typing 250–730 ms, logs 810/910, nav 900, fold and window 1000, steps at 1300/1500/1600/1900/2200, created 2600, done 3100); one `requestAnimationFrame` loop with deltas capped at 50 ms; turbo ×5 while the next section is already triggered; triggers when a section's top is above 75% of the viewport; Skip jumps the section's clock to its end; Run all triggers and finishes everything; resize finishes the active section; `sp-speed` in `localStorage`; the done state lasts 4 s before the dock collapses. It re-renders React every frame and has no deep links, focus rule or scroll hint.
- Design System v2 (https://claude.ai/artifact/CvbHWjN6GHJoYxCTCmk91o): the build components and their states (CommandDock, BuildWindow, BootTerminal, SelectionBox, Skeleton, CommandLine, LogLine, SkipButton, SpeedToggle, ReplayButton, PlayBuildButton) with their accessible names, the tokenizer, and the build-layer section of `bundle.css`; the chrome is `aria-hidden` while the window body is the real section; the dock's status text is hidden from screen readers while its controls stay reachable.

---

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Status: APPROVED*
