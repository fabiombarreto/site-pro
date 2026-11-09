# API reference

site-pro has **no HTTP API**: it is a static, presentation-only site with no backend (docs/01-concept.md). This file catalogs the public surfaces that do exist: routes, content schemas and (planned) runtime controls.

## Routes

| Route | Content |
|---|---|
| `/` | The one-page site: Hero, About, Projects, Stack, Contact |
| `/#about`, `/#projects`, `/#stack`, `/#contact` | Deep links: go to the target at once; everything before it builds in turbo, then the target builds |
| `/projects/<slug>` | Project page (D5), one per `projects` entry (`slug` is the file name). Stage 2 renders the project header, plus the Markdown body only when the entry has one; nav links point back to `/#<section>` |
| any unknown path | 404. Stage 2 ships a plain page-register 404 (title and a link home); the `ENOENT` build window is not implemented yet |

## Content schemas

Defined in docs/05-content.md and validated at build time with Astro Content Collections. The Zod schemas live in `src/content-schemas.ts` (strict objects: unknown fields fail the build) and the collections are registered in `src/content.config.ts`. `profile` and `stack` load from `src/content/profile.json` and `src/content/stack.json` (file loader); `projects` loads `src/content/projects/*.md` (glob loader), so a project's `slug` is its file name and is not a frontmatter field. `cover` is optional until the real covers arrive. Every link URL must start with `https://`.

| Collection | Shape |
|---|---|
| `profile` | `name`, `headline`, `role`, `subtitle`, `photo`, `location?`, `bio`, `links[]`, `cv?` |
| `projects` | `slug`, `title`, `summary`, `cover`, `tags[]`, `links{repo?, demo?, article?}`, `year`, `featured`, `order`, `status`, `githubRepo?`, Markdown body |
| `stack` | `groups[].items[]` |

## Visitor controls (runtime surface)

| Control | Input |
|---|---|
| Skip current section | `Esc`, `» Skip`, click on a window's title or command bar |
| Run all | `Shift + Esc`, palette |
| Speed `1× / 2× / ∞` | Dock, palette; saved in the browser |
| Replay | Dock (done), footer, palette |
| Play build | Dock, reduced motion only |
| Command Palette | `Ctrl/⌘ + K`, nav `⌘K`, collapsed dock |
| Shortcut list | `?` |

The runtime's internal design (program, scheduler, effects registry, stores) is in docs/06-architecture.md; its public TypeScript API is documented below (Controls API, Build data contract and Runtime TypeScript API).

### Controls API (Stage 3 Phase 4)

`Controls` from `src/runtime/api.ts`: `skip`, `runAll`, `setSpeed`, `cycleSpeed`, `replay`, `play`. `getControls()` returns `null` on pages without the runtime. The stores `currentSection`, `progress`, `status`, `speed` and `queue` are re-exported for Stage 5.

### Build data contract (Stage 3 Phase 1)

Each home-page `<section>` carries `data-build`, the JSON of a compiled `Timeline` (`v`, `section`, `file`, `command`, `commandEnd`, `windowEnd`, `buildStart`, `steps[]` with `call`, `target`, `effect`, `start`, `end`, `createdAt`, `duration`). Step targets resolve to `data-build-target` elements in the section. `<html>` reflects runtime state: `data-build-mode` (`pending` or `instant`), `data-build-speed` (`1`, `2`, `inf`), `data-build-started`, `data-build-status` (`idle`, `building`, `done`, `instant`, `failed`), `data-build-section`, `data-build-progress` and `data-build-queue` (`<n>/<total>` while turbo is catching up, absent otherwise); sections carry `data-build-state`. Speed persists in `localStorage` key `sp-speed`. Source: `src/runtime/types.ts`, `src/stores/build.ts`.

### Runtime TypeScript API (Stage 3)

**Controls.** `src/runtime/api.ts` exports the `Controls` interface (`skip(): void`, `runAll(): void`, `setSpeed(speed: Speed): void`, `cycleSpeed(): void`, `replay(): void`, `play(): void`), where `Speed` is `'1' | '2' | 'inf'` (from `src/scripts/build-mode.ts`). `getControls(): Controls | null` returns the live controls, or `null` on pages without the runtime. `setControls(next: Controls | null): void` is called by the runtime entry to publish them; Stage 5 consumes `getControls`.

**Stores.** `src/stores/build.ts` exports the nanostores atoms below and `src/runtime/api.ts` re-exports them.

| Store | Value type | Meaning |
|---|---|---|
| `currentSection` | `SectionId \| null` | The section being built, `null` when none |
| `progress` | `number` | Fraction (0 to 1) of the current section build |
| `status` | `BuildStatus` | `'idle'`, `'building'`, `'done'`, `'instant'` or `'failed'` |
| `speed` | `Speed` | `'1'`, `'2'` or `'inf'` |
| `queue` | `{ position: number; total: number } \| null` | The turbo catch-up position, `null` otherwise |

`BuildStatus` is also exported from `src/stores/build.ts`.

**Types.** `src/runtime/types.ts` exports `EFFECTS` (the eight effect names: `select`, `skeleton`, `type-text`, `decode`, `resolve-lines`, `pop`, `stagger`, `build-card`) and `EffectName` (their union); `SectionId` (`'top' | 'about' | 'projects' | 'stack' | 'contact'`); `SectionState` (`pending`, `queued`, `command`, `window`, `building`, `closing`, `done`, `skipped`); `BuildStep` (`call`, `target`, `effect`, optional `text`, `count`, `gap`, `overlap`); `TimelineStep` (`call`, `target`, `effect`, `start`, `end`); `Timeline` (the shape of the Build data contract above); and `BuildScript` (`section`, `file`, `command`, `steps: BuildStep[]`, optional `settle` and `timing`).

**Compiler.** `src/runtime/compiler.ts` exports `compileScript(script: BuildScript): Timeline` and `serializeTimeline(timeline: Timeline): string`. The input is a step sequence, each step with a call, a target, an effect and an optional gap or overlap; the output is an absolute 1x timeline in milliseconds (`start` and `end` per step, `createdAt` and `duration` for the section). An unknown effect or an empty target throws an error naming the section and the step, and a step target missing from the section HTML fails `pnpm build` the same way (`scripts/verify-build-targets.mjs`, run from `astro.config.mjs`).

**Clock.** `src/runtime/clock.ts` exports the `Clock` interface (`now(): number`, `onFrame(cb: (now: number) => void): () => void`), the real implementation `realClock` (`performance.now` and `requestAnimationFrame`) and the manual one, `ManualClock` created by `createManualClock(start?)`, with `advance(ms, step?)`, which Vitest uses. E2E uses Playwright's `page.clock`; no hook exists in production code.

**Entry.** `src/runtime/main.ts` is a side-effect entry with no exports, loaded only by `src/pages/index.astro`.

Stage 4 changes build scripts and effects data only; a scheduler change needs a record in docs/decisions.md.
