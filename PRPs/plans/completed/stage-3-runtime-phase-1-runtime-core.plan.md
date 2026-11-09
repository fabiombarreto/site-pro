# Feature: Runtime core (Phase 1 of stage-3-runtime)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (build-script format and compiler, clock model, runtime outside React, head-script mode and watchdog); cross-cutting patterns (nanostores state mirrored as data-* attributes, one requestAnimationFrame loop, budgets); creation of shared runtime modules (src/runtime, src/stores, build scripts per section); impact on shared UI (Base.astro head script, index.astro, the five section files, check-budgets.mjs); business rules for build (B1, B2, B6, B15-B19, B22) and visual-design (V9 reserved space, layout never moves)
- Decisions found:
  - D2 Astro + React + TypeScript strict; the animation runtime is plain TypeScript outside React and nanostores share its state
  - D6 full build on every visit; a saved infinity speed (`sp-speed`) is the only exception
  - D17 build windows; D19 the dock (both are Phase 2 surfaces, not built here)
  - Stage 2 approved: the runtime adds the build on top without changing layout, content or accessibility, and keeps the section markup contract (ids top, about, projects, stack, contact; aria-label or aria-labelledby; one h1 and one h2 per section)
  - Stage 3 PRD approved 2026-11-08: build scripts are step sequences compiled at build time into absolute 1x timelines in the sections' data-* attributes; turbo is x5; the runtime runs only on `/`; only `sp-speed` is stored; a head-script watchdog (3 s proposed) reveals the page if the runtime never starts; effects and the scheduler are driven by an injectable clock; Playwright `page.clock` in E2E; methodology stays test-after
- Applicable anti-patterns:
  - Hiding pending content with `display` or `visibility` (only `opacity`, and only after JS confirms the build will run)
  - Layout-shifting build animations (nothing here may change a box; only data-* attributes and opacity)
  - Many timers instead of one loop (one requestAnimationFrame loop; the only other timer is the watchdog `setTimeout`)
  - Re-rendering React per typed character (no React in the runtime)
  - Scroll hijacking (the runtime never calls scrollTo or scrollIntoView in this phase)
  - Raw values instead of tokens (check:tokens scans .ts and .astro as well as .css)
  - Publishing private data (commands are built only from approved content)
  - Scope creep into v1 (no palette, agents, interactive dock, image-resolve, build layer surfaces)
  - Weakening tests to get a green run (the Implementer authors no tests and edits no existing test)
  - Writing pipeline artifacts under `.claude/`
- Applicable architectural rules:
  - SSG with complete final HTML and progressive enhancement: an inline head script picks the mode before first paint; no JS renders the final page as is
  - Pending content stays laid out and in the accessibility tree; one requestAnimationFrame loop, IntersectionObserver triggers, pause while hidden, deterministic clock in tests
  - Budgets: runtime + effects <= 18 KB gzip, critical JS (inline head scripts + runtime entry) <= 20 KB gzip, total JS <= 90 KB gzip, CSS <= 25 KB gzip, Lighthouse >= 95, CLS about 0
  - The runtime entry is loaded only by `src/pages/index.astro`; project pages and the 404 load no runtime
  - Folder contract (docs/context/architecture.md): `src/runtime/`, `src/stores/`, `src/sections/` (each section with its build script), tooling scripts in root `scripts/`
  - Relay artifacts live in `PRPs/`, nothing under `.claude/`
- Result: PROCEED
```

## Source PRD

- `PRPs/prds/stage-3-runtime.prd.md` — Implementation Phases row 1: "Runtime core" — Goal: The engine runs on `/`: sections move from pending to done in order as the visitor scrolls, on a single clock, with the no-JS, reduced motion, `∞` and failure paths safe from day one. — Success signal: AC-15, AC-16 and AC-20 pass; the order and trigger parts of AC-2 pass; the size check reports the runtime and critical numbers within budget; the Lighthouse result is reported to the owner.

## Summary

Phase 1 builds the engine and nothing visible on top of it. It adds a mode head script to `Base.astro` (reduced motion, saved `sp-speed`, pending marking, a 3 s watchdog) that runs only on `/`, a pending stylesheet that hides unbuilt sections with `opacity` only, the build-script types and a compiler that turns a sequence of steps into an absolute 1x timeline (validated, and serialized into `data-build` on each of the five sections with `data-build-target` hooks on the elements), an injectable `Clock` (real and manual), a DOM-free scheduler (lifecycle, one loop, overlapping steps, speed 1x/2x/infinity, turbo x5, pause while hidden), `IntersectionObserver` triggers at 75% of the viewport, nanostores mirrored as `data-*` attributes on `<html>`, a runtime entry loaded only by `index.astro` whose minimal reveal flips each section to `done` when its timeline ends, and an extension of `scripts/check-budgets.mjs` that measures the runtime (<= 18 KB) and the critical numbers including the runtime entry (<= 20 KB). The five base build scripts hold only commands, targets, effect names and content-derived sizes; effects themselves, the build layer and every visitor control belong to Phases 2 to 4. Lighthouse is measured by the existing CI job on the pull request and reported to the owner.

## User Story

As the site's owner writing section build scripts in Stage 4
I want a runtime that already handles order, timing, triggers and the safe fallback paths
So that a section is added or tuned by editing its build script only, and a visitor can never be left with invisible content.

## Problem Statement

After Stage 2 the page exists as complete static HTML, but nothing builds it. Until a production runtime exists, Stage 4 has nothing to write section scripts against and none of the behavior rules in docs/02-experience.md can be verified. This phase narrows the problem to the engine: the pending state, the script format and compiler, the clock, the scheduler and the triggers, with the no-JS, reduced-motion, saved-infinity and failure paths safe from day one.

## Solution Statement

Follow docs/06-architecture.md in plain TypeScript outside React. The scheduler and compiler are pure logic (no DOM) so Vitest can drive them with a manual clock later; the DOM-touching parts are small (`triggers.ts`, `main.ts`). The head script is inline JavaScript that mirrors the pure helpers in `src/scripts/build-mode.ts`, the same way the Stage 2 theme script mirrors `src/scripts/theme.ts`. Targets are verified against the rendered HTML by an Astro `astro:build:done` hook backed by a plain script in `scripts/`, so a bad effect or target fails `pnpm build` naming the section and step.

## Metadata

| Key | Value |
|-----|-------|
| Type | NEW_CAPABILITY (runtime engine) |
| Complexity | HIGH (compiler, scheduler, head script, budget script, five sections touched) |
| Systems Affected | package.json, pnpm-lock.yaml, astro.config.mjs, src/layouts/Base.astro, src/pages/index.astro, src/sections/*.astro (5), src/sections/*.build.ts (5, new), src/runtime/ (new), src/stores/ (new), src/scripts/build-mode.ts (new), src/styles/build-pending.css (new), scripts/check-budgets.mjs, scripts/verify-build-targets.mjs (new) |
| Dependencies | Stage 2 (complete); one new dependency `nanostores` (needs registry access once, to add it) |
| Estimated Tasks | 10 |
| Source PRD line ref | PRPs/prds/stage-3-runtime.prd.md:200 (row 1), :208-211 (Phase Details) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-3-runtime.prd.md` | 58-91 (ACs), 119-181 (Solution Detail and Technical Approach), 208-211 (Phase 1) | The contract: AC-2, AC-15, AC-16, AC-20 and the Technical Approach bullets this phase implements |
| P0 | `src/layouts/Base.astro` | 1-61 | Where the mode head script goes (head script at 20-33, shared body module script at 56-59) |
| P0 | `src/pages/index.astro` | 1-46 | Home-only composition; the runtime entry and pending CSS are imported here only |
| P0 | `scripts/check-budgets.mjs` | 1-167 | The size check to extend: parsePage 27-49, per-page critical 79-103, totals 105-109, limits 120-134 |
| P0 | `src/scripts/theme-toggle.ts` | 1-35 | The `try`/`catch` storage pattern and `data-js` flag the runtime follows |
| P0 | `src/sections/Hero.astro` | 1-46 | Hero frontmatter (headline split at 17) and markup that receives `data-build` and targets |
| P0 | `src/sections/Projects.astro` | 1-44 | Section with a per-project cell (target per card) |
| P1 | `src/sections/About.astro`, `src/sections/Stack.astro`, `src/sections/Contact.astro` | whole files | The other three sections to wire |
| P1 | `src/styles/home.css` | 1-21, 123-148 | Section and grid layout the pending state must not disturb |
| P1 | `docs/04-animations.md` | section "Runtime performance" and the lifecycle section | Lifecycle names and the one-loop rule |
| P1 | `docs/06-architecture.md` | section "The runtime (design)" | Module split, nanostores keys, `data-*` mirror |
| P1 | `docs/domain/areas/build.md` | rules B1, B2, B6, B15-B19, B22 | Behavior the scheduler and compiler implement |
| P2 | `src/components/page/SectionHeading.tsx`, `src/components/page/StackGroup.tsx` | whole files | Check whether they pass extra attributes through before choosing a wrapper (Task 6) |

## Patterns to Mirror

```ts
# SOURCE: src/layouts/Base.astro:5
import { THEME_STORAGE_KEY } from '../scripts/theme';
```
Copied by Task 3 (a `src/scripts/build-mode.ts` constants module imported by Base.astro the same way) and Task 9.

```astro
# SOURCE: src/layouts/Base.astro:20-33
    <script is:inline define:vars={{ storageKey: THEME_STORAGE_KEY }}>
      (function () {
        let theme = 'midnight';
        try {
          if (localStorage.getItem(storageKey) === 'daylight')
            theme = 'daylight';
        } catch {
          // Storage may be blocked; keep the default theme.
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme =
          theme === 'daylight' ? 'light' : 'dark';
      })();
    </script>
```
Copied by Task 9 (the mode head script is a second `is:inline define:vars` IIFE, storage read inside `try`/`catch`).

```ts
# SOURCE: src/scripts/theme-toggle.ts:25-29
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage may be blocked; the in-page theme still changes.
    }
```
Copied by Task 8 (any storage access in the runtime is wrapped the same way).

```astro
# SOURCE: src/sections/Projects.astro:12-19
const { projects } = Astro.props;
---

<section
  id="projects"
  aria-labelledby="projects-title"
  class="sp-section sp-projects"
>
```
Copied by Task 6 (compile in the frontmatter, then spread `data-build` onto the existing `<section>` opening tag without touching id, aria or class).

```js
# SOURCE: scripts/check-budgets.mjs:30-37
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = attr(m[1], 'src');
    const blocking =
      !/\btype\s*=\s*["']module["']/i.test(m[1]) &&
      !/\b(async|defer)\b/i.test(m[1]);
    const critical = headEnd !== -1 && m.index < headEnd;
    if (src) page.scripts.push({ src, critical: critical && blocking });
    else if (m[2].trim()) page.inlineJs.push({ body: m[2], critical });
  }
```
Copied by Task 10 (module scripts are already parsed here; the runtime set is derived from these entries and their static imports).

```js
# SOURCE: scripts/check-budgets.mjs:147-165
function main() {
  const flag = process.argv.indexOf('--dist');
  const distDir = resolve(flag === -1 ? 'dist' : process.argv[flag + 1]);
  const r = measureBudgets(distDir);
  console.log(`JS total ${r.jsTotal.toFixed(1)} / ${JS_TOTAL_KB} KB gzip`);
  console.log(
    `JS critical ${r.jsCritical.toFixed(1)} / ${JS_CRITICAL_KB} KB gzip`,
  );
```
Copied by Tasks 7 and 10 (an exported pure function plus a `main()` that runs only when executed directly; problems become `FAIL ...` lines and a non-zero exit).

```css
# SOURCE: src/styles/home.css:5-7
.sp-section {
  padding: clamp(80px, 10vw, 128px) 0;
}
```
Copied by Task 9 (plain class and attribute selectors, tokens only, no raw colors).

```astro
# SOURCE: src/pages/index.astro:31-46
<Base title={title} description={description}>
  <div class="sp-page">
    <Backdrop glows={DEFAULT_GLOWS} />
    <div class="sp-page-content">
      <NavBar githubHref={links.github} linkedinHref={links.linkedin} />
      <main id="main" tabindex="-1">
        <Hero profile={profile} />
```
Copied by Task 9 (the runtime `<script>` import goes inside `<Base>` after `.sp-page`, so only `/` bundles it).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `package.json`, `pnpm-lock.yaml` | UPDATE | Add the `nanostores` dependency |
| `src/runtime/types.ts` | CREATE | Build-script, step, timeline and state types; effect names |
| `src/runtime/compiler.ts` | CREATE | Sequence to absolute 1x timeline, validation, serialization |
| `src/runtime/clock.ts` | CREATE | `Clock` interface, real clock, manual clock |
| `src/scripts/build-mode.ts` | CREATE | Mode, speed and watchdog constants and pure helpers shared with Base.astro |
| `src/stores/build.ts` | CREATE | nanostores `currentSection`, `progress`, `status`, `speed` |
| `src/runtime/scheduler.ts` | CREATE | DOM-free scheduler: lifecycle, queue, one loop, speed, turbo, pause |
| `src/sections/hero.build.ts`, `about.build.ts`, `projects.build.ts`, `stack.build.ts`, `contact.build.ts` | CREATE | The five base scripts (commands, targets, effects, content-derived sizes) |
| `src/sections/Hero.astro`, `About.astro`, `Projects.astro`, `Stack.astro`, `Contact.astro` | UPDATE | Compile in the frontmatter, add `data-build` and `data-build-target` attributes only |
| `scripts/verify-build-targets.mjs` | CREATE | Checks every compiled step's target exists in the rendered HTML |
| `astro.config.mjs` | UPDATE | `astro:build:done` integration that runs the verifier and fails the build |
| `src/runtime/triggers.ts`, `src/runtime/main.ts` | CREATE | `IntersectionObserver` triggers at 75%; entry, store mirror, guard, reveal |
| `src/layouts/Base.astro` | UPDATE | Optional `build` prop and the mode head script with the watchdog |
| `src/pages/index.astro` | UPDATE | Pass `build`, import the runtime entry and pending CSS (home only) |
| `src/styles/build-pending.css` | CREATE | Pending state: `opacity: 0` on unbuilt sections, only under `data-build-mode='pending'` |
| `scripts/check-budgets.mjs` | UPDATE | Runtime (<= 18 KB) and critical-with-entry (<= 20 KB) numbers, static-import following |

## NOT Building (Scope Limits)

- Effect implementations (`select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger`, `build-card`) and the effects registry, seeded randomness, typing speeds, and tuning the base-script timings to prototype v2 (the hero 3.2 s target) — Phase 3. Phase 1 effect durations are provisional constants in one table.
- `image-resolve`, the photo to ASCII script, real assets, project page text, per-section tuning — Stage 4.
- Every build-layer surface (BootTerminal, CommandDock, BuildWindow, CommandLine, LogLine, SelectionBox, Skeleton, the pending outline, the nav entrance, the footer slot) — Phase 2. The runtime creates no overlay root and no element in Phase 1.
- Skip, Run all, speed toggle UI and `sp-speed` writing, Replay, Play build, the collapsed dock, `queued <n>/5` status, deep-link and nav-click catch-up beyond what the scheduler's order rule gives, the focus rule, resize handling, the scroll hint, the controls API — Phase 4. The scheduler exposes `finish`, `setSpeed` and `trigger` as internal methods only.
- E2E, axe and layout-invariance specs, Vitest suites, the rewrite of `tests/e2e/home-no-build-layer.spec.ts`, docs/context/testing.md mapping — the test pair and Phase 5.
- Command Palette, analytics, a build on project pages or the 404, the interactive dock (D7), agents (D8) — Stages 5, 6 and v1.1.
- Any change to the Stage 2 layout, content, section ids, labels or heading structure.

## Step-by-Step Tasks

### Task 1: UPDATE package.json (add nanostores)

- **ACTION**: Run `pnpm add nanostores` so it lands in `dependencies` (not devDependencies) and `pnpm-lock.yaml` updates. Infrastructure task: delivers no acceptance criterion directly; it enables the stores used by AC-A4 and AC-A8 (Task 3 and Task 4).
- **MIRROR**: n/a (dependency install; the existing `dependencies` block in `package.json:24-28` is the shape).
- **VALIDATE**: `node --input-type=module -e "import('nanostores').then((m) => { if (typeof m.atom !== 'function') process.exit(1); })"`

### Task 2: CREATE src/runtime/types.ts and src/runtime/compiler.ts

- **ACTION**: Delivers AC-A3. In `types.ts` export: `EFFECTS` as a const tuple `['select','skeleton','type-text','decode','resolve-lines','pop','stagger','build-card']` and `EffectName`; `SectionId = 'top' | 'about' | 'projects' | 'stack' | 'contact'`; `BuildStep { call: string; target: string; effect: EffectName; text?: string; count?: number; gap?: number; overlap?: number }`; `BuildScript { section: SectionId; file: string; command: string; steps: BuildStep[]; settle?: number; timing?: Partial<Pick<Timeline,'commandEnd'|'windowEnd'|'buildStart'>> }`; `Timeline { v: 1; section: SectionId; file: string; command: string; commandEnd: number; windowEnd: number; buildStart: number; steps: { call: string; target: string; effect: EffectName; start: number; end: number }[]; createdAt: number; duration: number }`; `SectionState = 'pending'|'queued'|'command'|'window'|'building'|'closing'|'done'|'skipped'`. In `compiler.ts` export `compileScript(script): Timeline` and `serializeTimeline(t): string` (`JSON.stringify`). Rules: `commandEnd = 250 + command.length * 40 + 80`, `windowEnd = commandEnd + 100`, `buildStart = windowEnd + 280` unless `timing` overrides; step 0 starts at `buildStart + (gap ?? 0)`; each later step starts at `previous.end + (gap ?? 0) - (overlap ?? 0)`; `createdAt = lastStep.end + (settle ?? 300)`; `duration = createdAt + 500`. Effect durations come from ONE table `EFFECT_DURATION_MS` documented as provisional (Phase 3 tunes): `select` 150, `skeleton` 300, `type-text` `150 + n * 28` where `n = text.length`, `decode` `150 + n * 20`, `resolve-lines` `150 + count * 60`, `pop` 300, `stagger` `150 + count * 80`, `build-card` 600; an effect needing `text` or `count` that lacks it is an error. Validation throws an `Error` whose message is exactly `build script "<section>" step <i> (<call>): <problem>` with problems `unknown effect "<effect>"`, `empty target`, and `needs text` / `needs count`; also throw when `steps` is empty. A step `call` and `command` must not contain `<` or `>` (the serialized value lives in an HTML attribute). No DOM access in either file. Format with `pnpm exec prettier --write` on the new files.
- **MIRROR**: `# SOURCE: scripts/check-budgets.mjs:147-165` (a pure exported function, no side effects at import).
- **VALIDATE**: `pnpm check && pnpm lint`

### Task 3: CREATE src/runtime/clock.ts, src/scripts/build-mode.ts and src/stores/build.ts

- **ACTION**: Delivers AC-A5 (mode resolution) and supplies the clock the scheduler uses for AC-A2 and AC-A8. `clock.ts`: `interface Clock { now(): number; onFrame(cb: (now: number) => void): () => void }`; `realClock` uses `performance.now()` and re-registers `requestAnimationFrame` after every frame (returns a cancel function that calls `cancelAnimationFrame`); `createManualClock(start = 0)` returns a `Clock` plus `advance(ms, step = 16)` that moves `now` in `step` chunks and invokes frame callbacks after each chunk. `build-mode.ts` (pure, no DOM): `SPEED_STORAGE_KEY = 'sp-speed'`, `WATCHDOG_MS = 3000`, `type Speed = '1' | '2' | 'inf'`, `parseSpeed(raw: string | null): Speed` (anything else is `'1'`), `resolveMode(reducedMotion: boolean, speed: Speed): 'instant' | 'pending'` (`instant` when reduced motion or `inf`). `stores/build.ts`: `currentSection = atom<SectionId | null>(null)`, `progress = atom<number>(0)` (active section fraction 0..1 rounded to 0.01), `status = atom<'idle' | 'building' | 'done' | 'instant' | 'failed'>('idle')`, `speed = atom<Speed>('1')`, all from `nanostores`. No colors or hex text anywhere (check:tokens scans .ts).
- **MIRROR**: `# SOURCE: src/layouts/Base.astro:5` (a constants module imported by both the layout and the client code).
- **VALIDATE**: `pnpm check && pnpm lint && pnpm check:tokens`

### Task 4: CREATE src/runtime/scheduler.ts

- **ACTION**: Delivers AC-A4 (order, one active section, built sections never replay), AC-A8 (speed and turbo) and the pause hook for AC-A2. Export `createScheduler({ clock, timelines, speed, host })` where `timelines: Timeline[]` is in document order and `host: { onState(id, state): void; onProgress(section: SectionId | null, fraction: number): void; onIdle(): void; onAllDone(): void; isHidden(): boolean }`. Behavior: `trigger(id)` marks `id` and every earlier section that is still `pending` as `queued` (order rule B1: sections always start in document order, one active at a time); the lowest queued section becomes active; its clock `t` advances by `dt * speedFactor * (turbo ? 5 : 1)` per frame where `dt` is `now - lastNow` capped at 50 ms, `speedFactor` is 1 or 2, and `turbo` is true while the next section in document order is already queued; state follows `t`: `command` while `t < commandEnd`, `window` while `t < windowEnd`, a short hold until `buildStart` still reported as `window`, `building` from `buildStart` until `createdAt`, `closing` from `createdAt`, `done` at `t >= duration`, then the next queued section starts in the same frame. Speed `inf`: the active section and every queued one finish immediately and later triggers finish immediately (state goes straight to `done`). `finish(id)` jumps one section to `done` (also used by Phase 4's Skip). A section already `done` is never re-run by `trigger`. One frame subscription only, registered through `clock.onFrame` while a section is active and cancelled when idle (`host.onIdle()`); while `host.isHidden()` is true a frame advances nothing and does not accumulate time, and on resume the next delta is measured from the first visible frame. Publish `onProgress` as `t / duration` rounded to 0.01 and only when it changes. `onAllDone()` fires once when every section is `done` or `skipped`. No DOM and no direct use of `performance` or `requestAnimationFrame`: time comes only from `clock`. Format with prettier.
- **MIRROR**: `# SOURCE: scripts/check-budgets.mjs:147-165` (exported factory with pure logic; side effects only through the injected host).
- **VALIDATE**: `pnpm check && pnpm lint`

### Task 5: CREATE the five build scripts in src/sections/

- **ACTION**: Delivers AC-A3 (commands built from content, B22). Create `hero.build.ts`, `about.build.ts`, `projects.build.ts`, `stack.build.ts`, `contact.build.ts`; each exports a factory taking the same content the section receives and returning a `BuildScript` (type from `../runtime/types`). Content is interpolated, never typed twice. Hero (`section: 'top'`, `file: 'hero.tsx'`, `command: 'startSite();'`, `timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 }`): steps `hero.title("<headline>")` target `title` effect `type-text` with `text` equal to the profile headline, `hero.role("<role>")` target `role` `type-text`, `hero.photo(…)` target `photo` `skeleton`, `hero.intro(…)` target `intro` `resolve-lines` with `count` from the subtitle's word count, `hero.links([…])` target `links` `pop` with a gap; the literal `effect: 'type-text'` must appear in `hero.build.ts` (Level 2 mutates it). About (`file: 'about.md'`, command `renderAbout();`): `about.heading` (target `heading`), `about.text` (target `text`, one step for all paragraphs), `about.links` (target `links`). Projects (`file: 'projects.tsx'`, command `renderProjects();`): `projects.heading` then one `projects.card("<slug>")` per project (target `card-<slug>`, effect `build-card`, `overlap: 120` on every card after the first), slugs from the collection ids. Stack (`file: 'stack.tsx'`, command `renderStack();`): `stack.heading` then one `stack.group("<name>")` per group (target `group-<index>`, effect `stagger`, `count` = number of items). Contact (`file: 'contact.tsx'`, command `renderContact();`): `contact.heading`, `contact.links`, `contact.location`. Strings in the `call` field must contain no `<` or `>`. The hero command text never includes a private value (names, role and links already published on the page only). Format with prettier.
- **MIRROR**: `# SOURCE: src/sections/Projects.astro:12-19` (content props are the only inputs; slugs come from `id`).
- **VALIDATE**: `pnpm check && pnpm lint && pnpm check:privacy`

### Task 6: UPDATE the five Astro sections (data-build and data-build-target)

- **ACTION**: Delivers AC-A3 (serialization into the sections' `data-*`) and AC-A6 (no box changes). In each of `Hero.astro`, `About.astro`, `Projects.astro`, `Stack.astro`, `Contact.astro`: import `compileScript`/`serializeTimeline` and the section's factory, compile in the frontmatter, and add `data-build={serializeTimeline(timeline)}` to the existing `<section>` opening tag. Add `data-build-target="<target>"` to the element each step names, using the target names from Task 5: Hero `h1.sp-hero-name` = `title`, `p.sp-hero-role` = `role`, `div.sp-hero-photo` = `photo`, the subtitle `<p class="text-lg">` inside `.sp-hero-copy` = `intro`, `div.sp-hero-actions` = `links`; About: every paragraph `<p class="text-lg">` = `text`, `div.sp-actions` = `links`; Projects: each `div.sp-projects-cell` = `card-<id>`; Stack: each group = `group-<index>`; Contact: `div.sp-actions` = `links`, `p.sp-contact-location` = `location`; every heading = `heading`. Before choosing where a heading or group attribute goes, read `SectionHeading.tsx` and `StackGroup.tsx`: if they pass extra attributes through, set it there; otherwise wrap the component in `<div class="sp-build-wrap" data-build-target="...">` and add `.sp-build-wrap { display: contents; }` to `src/styles/home.css` (no box is created, so no layout changes). Do not change ids, aria attributes, classes, text, order or heading structure. Section ids stay `top`, `about`, `projects`, `stack`, `contact`.
- **MIRROR**: `# SOURCE: src/sections/Projects.astro:12-19`
- **VALIDATE**: `pnpm build && node --input-type=module -e "import { readFileSync } from 'node:fs'; const html = readFileSync('dist/index.html', 'utf8'); const dec = (s) => s.replace(/&quot;/g, String.fromCharCode(34)).replace(/&#39;/g, String.fromCharCode(39)).replace(/&amp;/g, '&'); const all = [...html.matchAll(/<section\b[^>]*?\sdata-build=\"([^\"]*)\"/g)].map((m) => JSON.parse(dec(m[1]))); if (all.map((s) => s.section).join() !== 'top,about,projects,stack,contact') { console.error('FAIL: data-build sections'); process.exit(1); } if (all.some((s) => s.steps.length === 0)) { console.error('FAIL: empty steps'); process.exit(1); }"`

### Task 7: CREATE scripts/verify-build-targets.mjs and UPDATE astro.config.mjs

- **ACTION**: Delivers AC-A3 (a target that does not exist in the section fails `pnpm build` naming the section and step). `verify-build-targets.mjs` exports `verifyBuildTargets(html: string): string[]` and has no side effect at import. It finds every `<section ... data-build="...">`, decodes the attribute value (`&quot;`, `&#39;`, `&lt;`, `&gt;`, `&amp;`), `JSON.parse`s it, and for each step index `i` reports `build script "<section>" step <i> (<call>): target "<target>" not found in the page` when the HTML has no `data-build-target="<target>"` attribute. It also reports a section whose `data-build` JSON cannot be parsed. In `astro.config.mjs` add a small inline integration `{ name: 'verify-build-targets', hooks: { 'astro:build:done': ({ dir }) => { ... } } }` that reads `index.html` from `dir` (use `fileURLToPath`), runs the verifier and throws an `Error` joining the problems with newlines when any are found; add it after `react()` in `integrations`. Only `index.html` is checked (the runtime runs only on `/`).
- **MIRROR**: `# SOURCE: scripts/check-budgets.mjs:147-165` (exported pure function plus a thin caller).
- **VALIDATE**: `set -euo pipefail; pnpm build; node --input-type=module -e "import { readFileSync } from 'node:fs'; import { verifyBuildTargets } from './scripts/verify-build-targets.mjs'; const html = readFileSync('dist/index.html', 'utf8'); if (verifyBuildTargets(html).length !== 0) { console.error('FAIL: valid page reported problems'); process.exit(1); } const bad = html.replace('data-build-target=\"title\"', ''); const problems = verifyBuildTargets(bad); if (!problems.some((p) => p.includes('\"top\"') && p.includes('hero.title'))) { console.error('FAIL: missing target not reported'); process.exit(1); }"`

### Task 8: CREATE src/runtime/triggers.ts and src/runtime/main.ts

- **ACTION**: Delivers AC-A4 (trigger at 75%), AC-A1 (guarded start and reveal) and AC-A2 (visibility pause). `triggers.ts`: `observeSections(sections: HTMLElement[], onTrigger: (id: SectionId) => void): () => void` using one `IntersectionObserver` with `rootMargin: '0px 0px -25% 0px'` and `threshold: 0`; a section triggers when `isIntersecting` or its `boundingClientRect.top` is above the viewport (`< 0`), and each section triggers once. `main.ts` (the entry): read the five sections by id in document order, parse each `data-build` with `JSON.parse` into a `Timeline`, read the starting speed from `document.documentElement.dataset.buildSpeed` through `parseSpeed`, and set `data-build-state="pending"` on every section. If `data-build-mode` on `<html>` is `instant` (reduced motion or saved `inf`): set every section `data-build-state="done"`, set status `instant` then `done`, leave `data-build-mode` as `instant` (it is inert: the pending rule in Task 9 matches only `pending`, and AC-A5 and Level 3 scenarios E and F expect `instant` at `DOMContentLoaded`), and stop (no observer, no loop). Otherwise: create the scheduler with `realClock`, a host that writes `data-build-state` per transition, `isHidden: () => document.visibilityState === 'hidden'`, `onAllDone` that sets status `done` and removes `data-build-mode`; mirror the stores to `<html>` as `data-build-section`, `data-build-progress`, `data-build-status` and `data-build-speed` by subscribing; set `data-build-started` on `<html>` as soon as everything above succeeded (the watchdog reads it); listen for `visibilitychange` so the next frame re-measures from the first visible frame. Wrap startup and every scheduler callback in a `guard` that on any thrown error calls `reveal()`: cancel the frame subscription and observer, set every section `data-build-state="done"`, remove `data-build-mode`, set status `failed`, and `console.error` the error. Never call `scrollTo`, `scrollIntoView` or touch `scrollTop`. Wrap any storage access in `try`/`catch`. No React, no timers other than the clock's frame.
- **MIRROR**: `# SOURCE: src/scripts/theme-toggle.ts:25-29` (storage in `try`/`catch`) and `# SOURCE: src/sections/Projects.astro:12-19` (sections are read by id and carry their own data).
- **VALIDATE**: `pnpm check && pnpm lint && pnpm check:tokens`

### Task 9: UPDATE Base.astro and index.astro; CREATE src/styles/build-pending.css

- **ACTION**: Delivers AC-A1 (no JS and the failsafe), AC-A5 (mode before first paint) and AC-A6 (hiding by `opacity` only). `Base.astro`: add `build?: boolean` to `Props` (default false) and, only when `build` is true, a second `<script is:inline define:vars={{ speedKey: SPEED_STORAGE_KEY, watchdogMs: WATCHDOG_MS }}>` IIFE placed right after the theme script: read `localStorage.getItem(speedKey)` inside `try`/`catch` (values `'1'`, `'2'`, `'inf'`, anything else `'1'`), read `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, set `data-build-speed` and `data-build-mode` (`instant` when reduced motion or `inf`, else `pending`) on `document.documentElement`, and when pending start `setTimeout(function () { ... }, watchdogMs)` that, if `<html>` has no `data-build-started` attribute and `data-build-mode` is still `pending`, removes `data-build-mode` and sets `data-build-status="failed"`. Keep it in sync with `resolveMode` and `parseSpeed` in `src/scripts/build-mode.ts` (comment says so). `index.astro`: pass `build` to `<Base>`, import `../styles/build-pending.css` in the frontmatter, and add `<script>import '../runtime/main';</script>` inside `<Base>` after `.sp-page` so only `/` bundles the runtime (the shared body script in Base.astro stays unchanged). `build-pending.css`: one rule hiding a section with `opacity: 0` under `html[data-build-mode='pending'] main > section[data-build]:not([data-build-state='done']):not([data-build-state='skipped'])`; no `display`, no `visibility`, no transition, no raw colors. Do not edit `src/styles/base.css` (its reduced-motion block shape is asserted by a unit test).
- **MIRROR**: `# SOURCE: src/layouts/Base.astro:20-33`, `# SOURCE: src/styles/home.css:5-7`, `# SOURCE: src/pages/index.astro:31-46`
- **VALIDATE**: `set -euo pipefail; pnpm build; test -f dist/404.html -a -f dist/projects/relay/index.html; grep -q 'sp-speed' dist/index.html; if grep -q -e 'sp-speed' -e 'data-build' dist/404.html dist/projects/relay/index.html; then echo "FAIL: runtime or head script leaked onto a non-home page"; exit 1; fi; node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
  await page.clock.install({ time: 0 });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  const before = await page.evaluate(() => ({ mode: document.documentElement.getAttribute('data-build-mode'), about: getComputedStyle(document.getElementById('about')).opacity }));
  if (before.mode !== 'pending' || before.about !== '0') throw new Error('FAIL: pending state not applied before the runtime');
  await page.clock.pauseAt(60000);
  const after = await page.evaluate(() => ({ mode: document.documentElement.getAttribute('data-build-mode'), about: getComputedStyle(document.getElementById('about')).opacity }));
  if (after.mode !== null || after.about !== '1') throw new Error('FAIL: watchdog did not reveal the page');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF`

### Task 10: UPDATE scripts/check-budgets.mjs (runtime and critical-with-entry)

- **ACTION**: Delivers AC-A7. Add constants `JS_RUNTIME_KB = 18`. Extend `measureBudgets` (keeping its return fields and all existing behavior for pages without module imports) to (a) follow static `import` and `import()` specifiers between `.js` files (relative `./x.js` or `../x.js` or root-absolute) so shared chunks are counted in the total and are no longer reported as orphans; (b) compute the runtime set as every JS file (entry and chunks) reachable from module scripts on `index.html` that no other page's scripts reach, plus the gzip size of any inline module script body on `index.html` whose text appears on no other page; return its gzip size in KB as `jsRuntime`; (c) add the gzip size of the home-only module entry files (the files named directly by those `<script type="module" src>` tags, not their imports) and home-only inline module bodies to that page's `critical` value, so `jsCritical` now means inline head scripts + blocking head scripts + the runtime entry; (d) push `JS runtime ${jsRuntime.toFixed(1)} KB exceeds ${JS_RUNTIME_KB} KB` into `problems` when over. In `main()` print `JS runtime ${r.jsRuntime.toFixed(1)} / ${JS_RUNTIME_KB} KB gzip` next to the other lines. No new dependency.
- **MIRROR**: `# SOURCE: scripts/check-budgets.mjs:30-37` and `# SOURCE: scripts/check-budgets.mjs:147-165`
- **VALIDATE**: `set -euo pipefail; pnpm build; pnpm check:budgets | grep -q '^JS runtime '; node --input-type=module <<'EOF'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measureBudgets } from './scripts/check-budgets.mjs';
const real = measureBudgets('dist');
if (!(real.jsRuntime > 0 && real.jsRuntime <= 18)) { console.error('FAIL: real runtime size ' + real.jsRuntime); process.exit(1); }
const fixture = (size) => {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(dir, '_astro'));
  writeFileSync(join(dir, 'index.html'), '<html><head></head><body><script type="module" src="/_astro/r.js"></script></body></html>');
  writeFileSync(join(dir, '404.html'), '<html><head></head><body></body></html>');
  writeFileSync(join(dir, '_astro', 'r.js'), randomBytes(size).toString('base64'));
  return dir;
};
if (!measureBudgets(fixture(25000)).problems.some((p) => /JS runtime/.test(p))) { console.error('FAIL: oversize runtime not reported'); process.exit(1); }
if (measureBudgets(fixture(1000)).problems.length !== 0) { console.error('FAIL: small runtime reported'); process.exit(1); }
EOF`

## Validation Commands

All three levels run from the worktree root. Level 3 needs Playwright's Chromium installed (the Stage 2 e2e job prerequisite: `pnpm exec playwright install chromium`).

### Level 1 STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm lint
pnpm format:check
pnpm check
pnpm check:tokens
pnpm check:privacy
```

### Level 2 CONTENT_INVARIANTS and UNIT_TESTS

```bash
set -euo pipefail
pnpm test
pnpm build
pnpm check:budgets
node --input-type=module <<'EOF'
import { readFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const all = [...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map((m) => JSON.parse(dec(m[1])));
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };
if (all.map((s) => s.section).join() !== 'top,about,projects,stack,contact') fail('section ids');
const by = Object.fromEntries(all.map((s) => [s.section, s]));
const title = by.top.steps.find((s) => s.call.startsWith('hero.title('));
const arg = /^hero\.title\("(.*)"\)$/.exec(title?.call ?? '')?.[1];
if (arg === undefined) fail('hero.title call shape');
if (title.end - title.start !== 150 + arg.length * 28) fail('hero.title duration is not 150 + n * 28');
const cards = by.projects.steps.filter((s) => s.call.startsWith('projects.card('));
const articles = (html.match(/<article\b[^>]*\bsp-card\b/g) ?? []).length;
if (cards.length === 0 || cards.length !== articles) fail('one projects.card per project card');
cards.slice(1).forEach((c, i) => { if (c.start !== cards[i].end - 120) fail('card overlap is not 120 ms'); });
for (const s of all) {
  if (s.steps.some((st) => !(st.end > st.start))) fail(s.section + ' step with no duration');
  if (!(s.createdAt >= s.steps[s.steps.length - 1].end && s.duration > s.createdAt)) fail(s.section + ' phase order');
}
EOF
# A bad effect must fail the build and name the section and step.
f=src/sections/hero.build.ts
cp "$f" "$f.bak"
trap 'mv -f "$f.bak" "$f"' EXIT
node -e "const fs=require('fs');const f=process.argv[1];fs.writeFileSync(f,fs.readFileSync(f,'utf8').split(\"effect: 'type-text'\").join(\"effect: 'bogus-effect'\"));" "$f"
if out=$(pnpm build 2>&1); then echo "FAIL: build accepted an unknown effect"; exit 1; fi
clean=$(printf '%s' "$out" | sed 's/\x1b\[[0-9;]*m//g')
printf '%s' "$clean" | grep -q 'build script "top" step'
printf '%s' "$clean" | grep -q 'unknown effect "bogus-effect"'
```

### Level 3 INTEGRATION (dry-run end to end in Chromium with Playwright's clock)

Run the build block first, then scenario blocks A to G in order. Every block is one self-contained command (its own small heredoc, nothing written to disk) and must exit 0.

```bash
set -euo pipefail
pnpm build
```

Scenario A (pending before the runtime, hero builds, About waits, scroll order and turbo):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';

const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const ACTIVE = ['command', 'window', 'building', 'closing'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };

const snap = (page) => page.evaluate((ids) => {
  const h = document.documentElement;
  return {
    mode: h.getAttribute('data-build-mode'),
    status: h.getAttribute('data-build-status'),
    speed: h.getAttribute('data-build-speed'),
    progress: Number(h.getAttribute('data-build-progress') || 0),
    states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')),
    opacity: ids.map((id) => getComputedStyle(document.getElementById(id)).opacity),
    scrollY: window.scrollY,
  };
}, IDS);

async function runUntil(page, test, maxMs, label) {
  for (let t = 0; t < maxMs; t += 100) {
    await page.clock.runFor(100);
    await sleep(5);
    const s = await snap(page);
    if (test(s)) return s;
  }
  throw new Error('FAIL: timed out waiting for ' + label);
}

async function startClocked(ctx) {
  const page = await ctx.newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  return page;
}

const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };

  // A: pending before the runtime, hero builds, About waits, scroll order and turbo.
  const ctxA = await browser.newContext(desktop);
  const page = await startClocked(ctxA);
  const first = await snap(page);
  check(first.mode === 'pending', 'mode is pending before first paint');
  check(first.opacity[1] === '0', 'About is hidden while pending');
  await page.clock.pauseAt(60000);
  const heroDone = await runUntil(page, (s) => s.states[0] === 'done', 20000, 'hero done');
  check(heroDone.opacity[0] === '1' && heroDone.states[1] === 'pending', 'hero revealed, About still pending');
  await page.clock.runFor(30000);
  const idle = await snap(page);
  check(idle.states[1] === 'pending' && idle.status === 'idle' && idle.scrollY === 0, 'About stays pending without scrolling');
  const dur = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => [id, JSON.parse(document.getElementById(id).getAttribute('data-build')).duration])), IDS);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  const y0 = (await snap(page)).scrollY;
  const order = [];
  let maxActive = 0;
  let elapsed = 0;
  let last;
  for (; elapsed < 90000; elapsed += 100) {
    await page.clock.runFor(100);
    await sleep(5);
    last = await snap(page);
    last.states.forEach((st, i) => { if (ACTIVE.includes(st) && !order.includes(IDS[i])) order.push(IDS[i]); });
    maxActive = Math.max(maxActive, last.states.filter((st) => ACTIVE.includes(st)).length);
    if (last.status === 'done') break;
  }
  check(order.join() === 'about,projects,stack,contact', 'sections start in document order: ' + order.join());
  check(maxActive === 1, 'one active section at a time');
  check(last.status === 'done' && last.mode === null && last.states.every((s) => s === 'done'), 'everything done and pending mode removed');
  check(last.scrollY === y0, 'the runtime never moved the page');
  const expected = (dur.about + dur.projects + dur.stack) / 5 + dur.contact;
  check(Math.abs(elapsed - expected) <= 1500, `turbo x5 timing: elapsed ${elapsed} vs expected ${Math.round(expected)}`);

  console.log('PASS: scenario A');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario B (hidden tab pauses, visible resumes):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const snap = (page) => page.evaluate((ids) => {
  const h = document.documentElement;
  return {
    progress: Number(h.getAttribute('data-build-progress') || 0),
    states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')),
  };
}, IDS);
async function runUntil(page, test, maxMs, label) {
  for (let t = 0; t < maxMs; t += 100) {
    await page.clock.runFor(100);
    await sleep(5);
    const s = await snap(page);
    if (test(s)) return s;
  }
  throw new Error('FAIL: timed out waiting for ' + label);
}
async function startClocked(ctx) {
  const page = await ctx.newPage();
  await page.clock.install({ time: 0 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  return page;
}
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  const pageB = await startClocked(await browser.newContext(desktop));
  await pageB.clock.pauseAt(60000);
  const mid = await runUntil(pageB, (s) => s.progress >= 0.2 && s.states[0] !== 'done', 20000, 'hero at 20%');
  await pageB.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const p1 = (await snap(pageB)).progress;
  await pageB.clock.runFor(10000);
  const p2 = (await snap(pageB)).progress;
  check(p1 === p2, `hidden tab advanced the build (${p1} -> ${p2})`);
  await pageB.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
  await runUntil(pageB, (s) => s.states[0] === 'done', 20000, 'hero resumes and finishes');

  console.log('PASS: scenario B');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario C (runtime module blocked, the watchdog reveals within the failsafe):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const snap = (page) => page.evaluate((ids) => ({
  mode: document.documentElement.getAttribute('data-build-mode'),
  opacity: ids.map((id) => getComputedStyle(document.getElementById(id)).opacity),
}), IDS);
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  const pageC = await (await browser.newContext(desktop)).newPage();
  await pageC.route(/\/_astro\/.*\.js/, (route) => route.abort());
  await pageC.clock.install({ time: 0 });
  await pageC.goto(URL, { waitUntil: 'domcontentloaded' });
  check((await snap(pageC)).mode === 'pending', 'pending before the watchdog');
  await pageC.clock.pauseAt(60000);
  const failed = await snap(pageC);
  check(failed.mode === null && failed.opacity.every((o) => o === '1'), 'watchdog revealed every section');

  console.log('PASS: scenario C');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario D (JavaScript disabled equals the Stage 2 page; asserted on the DOM, never on the serialized page text, because the inlined pending stylesheet legitimately contains the selector text `data-build-state`):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const pageD = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false })).newPage();
  await pageD.goto(URL, { waitUntil: 'load' });
  const dom = await pageD.evaluate(() => ({
    mode: document.documentElement.hasAttribute('data-build-mode'),
    status: document.documentElement.hasAttribute('data-build-status'),
    states: document.querySelectorAll('[data-build-state]').length,
    about: getComputedStyle(document.getElementById('about')).opacity,
  }));
  check(!dom.mode && !dom.status, 'no pending state without JavaScript');
  check(dom.states === 0, 'no runtime state without JavaScript');
  check(dom.about === '1', 'About is visible without JavaScript');
  console.log('PASS: scenario D');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenarios E and F (reduced motion renders ready; a saved `inf` speed renders ready):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const snap = (page) => page.evaluate((ids) => ({
  mode: document.documentElement.getAttribute('data-build-mode'),
  states: ids.map((id) => document.getElementById(id).getAttribute('data-build-state')),
  opacity: ids.map((id) => getComputedStyle(document.getElementById(id)).opacity),
}), IDS);
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  for (const [label, ctxOpts, init] of [
    ['reduced motion', { ...desktop, reducedMotion: 'reduce' }, null],
    ['saved infinity', desktop, () => localStorage.setItem('sp-speed', 'inf')],
  ]) {
    const ctx = await browser.newContext(ctxOpts);
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    const s = await snap(p);
    check(s.mode === 'instant' && s.opacity.every((o) => o === '1'), label + ': ready at DOMContentLoaded');
    await p.waitForFunction(() => document.documentElement.getAttribute('data-build-status') === 'done');
    check((await snap(p)).states.every((st) => st === 'done'), label + ': all sections done');
  }
  console.log('PASS: scenarios E and F');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

Scenario G (pending boxes equal the ready page: the final layout never moves):

```bash
set -euo pipefail
node --input-type=module <<'EOF'
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
const check = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };
const boxes = (page) => page.evaluate(async () => {
  await document.fonts.ready;
  const els = [...document.querySelectorAll('main > section, main h1, main h2, main p, main a, main article')];
  return {
    height: document.documentElement.scrollHeight,
    boxes: els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height]; }),
  };
});
const server = await preview({ root: process.cwd(), logLevel: 'silent', server: { host: '127.0.0.1', port: PORT } });
const browser = await chromium.launch();
try {
  const desktop = { viewport: { width: 1280, height: 800 } };
  const pendingPage = await (await browser.newContext(desktop)).newPage();
  await pendingPage.clock.install({ time: 0 });
  await pendingPage.goto(URL, { waitUntil: 'domcontentloaded' });
  const pendingBoxes = await boxes(pendingPage);
  const readyPage = await (await browser.newContext({ ...desktop, reducedMotion: 'reduce' })).newPage();
  await readyPage.goto(URL, { waitUntil: 'load' });
  await readyPage.waitForFunction(() => document.documentElement.getAttribute('data-build-status') === 'done');
  const ready = await boxes(readyPage);
  check(Math.abs(ready.height - pendingBoxes.height) <= 0.5 && ready.boxes.length === pendingBoxes.boxes.length, 'document height and box count equal');
  ready.boxes.forEach((b, i) => b.forEach((v, j) => check(Math.abs(v - pendingBoxes.boxes[i][j]) <= 0.5, `box ${i} differs while pending`)));
  console.log('PASS: scenario G');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.stop();
}
process.exit(process.exitCode ?? 0);
EOF
```

## Acceptance Criteria

- **AC-A1 (PRD AC-15):** With JavaScript disabled `/` equals the Stage 2 rendering (no pending state, no runtime state, all content visible); with JavaScript enabled but the runtime module blocked or throwing, the head-script watchdog (or the runtime's error path) removes the pending state so every section is visible in its final state within 3 s of clock time.
- **AC-A2 (PRD AC-16):** While `document.visibilityState` is `hidden` the build does not advance; when the tab becomes visible the build resumes from the step it was on.
- **AC-A3 (PRD AC-20):** A section build script is a sequence of steps (call, target, effect, optional gap or overlap) that `compileScript` turns into an absolute 1x timeline in ms (each step starts at the previous end plus its gap, or earlier by its overlap; a headline of n characters lasts 150 + n x 28 ms; each Projects card starts 120 ms before the previous card ends), serialized into `data-build` with `data-build-target` hooks; a script naming an unknown effect, or a target that does not exist in the section, fails `pnpm build` with a message naming the section and the step; every command string comes from the script with arguments from the content (`hero.title("<headline>")`, one `projects.card("<slug>")` per project).
- **AC-A4 (PRD AC-2):** Sections start in document order (hero, about, projects, stack, contact), never two at once; a section triggers when its top crosses 75% of the viewport height; with no scrolling About stays pending and nothing starts; a section already built never runs again when the visitor scrolls back.
- **AC-A5 (PRD AC-1, AC-13, AC-14):** Before first paint `<html>` carries `data-build-mode`: `pending` normally (every section hidden with `opacity` only while staying laid out and in the accessibility tree), `instant` for `prefers-reduced-motion: reduce` or a saved `sp-speed` of `inf`, in which case all content is visible at `DOMContentLoaded` and every section ends `done`.
- **AC-A6 (PRD AC-4):** The pending state and the data attributes change no box: every section, heading, paragraph, link and card box and the document height equal the ready page (+/- 0.5 px at 1280x800); only `opacity` and `data-*` attributes change, and nothing is hidden with `display` or `visibility`.
- **AC-A7 (PRD AC-19):** `pnpm check:budgets` measures the runtime JS that `/` alone loads (nanostores included) against 18 KB gzip and the inline head scripts plus the runtime entry against 20 KB gzip, next to the existing totals, and exits non-zero when any threshold is exceeded.
- **AC-A8 (PRD AC-5, AC-13):** The scheduler runs at 1x or 2x and turbo x5 while the next section in order is already queued (About, Projects and Stack each take one fifth of their 1x clock time, Contact runs at 1x); speed `inf` finishes the current and every triggered section at once.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lighthouse Performance < 0.95 on `/`: Chromium ignores `opacity: 0` elements for LCP, and the hero is hidden until its timeline ends (about 3 s at 1x in this phase) | M | H | Measured by the existing `lighthouse` CI job on the pull request and reported to the owner; no threshold relaxed, nothing else hidden. Phase 3 reveals the headline early (<= 2.0 s) |
| Content stuck invisible when the runtime fails | L | H | Head-script watchdog plus the runtime `guard`/`reveal`; Level 3 scenario C and Task 9's mini scenario exercise it |
| The pending state or the new attributes move layout | L | H | Attributes and `opacity` only; the `display: contents` wrapper is used only when a component cannot take an attribute; Level 3 scenario G compares boxes with the ready page |
| 18 KB runtime budget for engine, effects, build layer and nanostores together | M | M | Only nanostores added; DOM factories later; the size check is extended now so every later phase is measured |
| `IntersectionObserver` and Playwright's fake clock interplay is undocumented (web research gap) | M | M | The Level 3 script waits with real `sleep` between clock slices; if triggers do not fire under the fake clock the scenario fails loudly and the gap is recorded for Phase 5 |
| Astro may inline a small bundled `<script>` into `index.html` instead of emitting a chunk | M | L | Task 10 counts home-only inline module bodies as part of the runtime and the entry |
| Existing Stage 2 e2e and unit tests assert the old static behavior | H | M | Expected, handled by the test pair's lifecycle ledger (see Notes); the Implementer edits no test |
| Level 3 needs Playwright's Chromium locally | L | L | Same prerequisite as the Stage 2 e2e job |

## Notes

**TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.

**Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.

- **Expected test impact (for the test pair, not the Implementer).** `tests/e2e/home-no-build-layer.spec.ts` asserts that the served HTML has no `data-build`; Phase 1 serializes `data-build` on purpose, so that assertion conflicts by design and the spec is rewritten (not weakened) per the PRD's Decisions Log, recorded in the lifecycle ledger. Other `/` specs (`home-axe`, `home-content`, `home-keyboard`, `home-responsive-layout`) now see sections at `opacity: 0` for up to about 3 s with a real clock and no stored speed; they may need reduced motion or a saved `inf` to start from the ready page. `tests/unit/quality-gates.test.ts` spawns `check-budgets.mjs` on fixtures: Task 10 keeps its behavior for pages without module imports, so those cases should still pass. New unit candidates: `compiler`, `scheduler` with the manual clock, `clock`, `build-mode`, `verify-build-targets`, and the new runtime budget case. `pnpm test` is part of Level 2 so a regression in an existing unit test is caught.
- **Why `pnpm test:e2e` is not a validation command here.** The Stage 2 specs above conflict with the runtime by design until the test pair updates them; running them in this phase's Implementer gate would fail against a correct implementation. Level 3 drives the built site with Playwright's library and clock directly instead. Lighthouse is measured by the CI `lighthouse` job on the pull request.
- **Validation conventions carried from Stage 2.** Level 3 greps are scoped to named `dist/*.html` files (never inlined CSS or JS elsewhere); the only text patterns that decide an exit code are literals authored in this plan's own ACTION prose (`unknown effect "bogus-effect"`, `build script "top" step`, `JS runtime `); ANSI codes are stripped from build output before grepping; `check:tokens` counts only color and `box-shadow` literals, so no hex or `rgb(` text may appear in `.ts` or `.astro` files.
- **Open question owned by this phase.** The watchdog timeout is a single constant (`WATCHDOG_MS` = 3000 in `src/scripts/build-mode.ts`); confirm it against real preview load times on the pull request.
- **Effect durations are provisional.** `EFFECT_DURATION_MS` holds placeholders so timelines are deterministic now; Phase 3 tunes them (and the base scripts) to prototype v2's rhythm.

*Generated: 2026-11-08*
*Approved: 2026-11-08*
*Implemented: 2026-11-08*
*Status: IMPLEMENTED*
