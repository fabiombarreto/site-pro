# Testing — mandatory guardrail for every change

This file is a binding behavioral contract, not a reference doc. Any
agent or human who changes code in this project MUST follow the guardrail
below on EVERY change — including small, single-file, or "quick" ones,
and whether or not a relay command was used. Skipping any step silently
is a violation.

`docs/context/methodology.md` governs whether the TDD track (writing
tests first) is active. THIS file governs keeping the existing suites
green afterward. They are independent: even with `tdd: false`, the
guardrail below is always in force. This guardrail is also NOT subject to
the `docs/decision-gate.md` scope exemptions — a change that is "exempt"
from the gate still requires every step here.

## The guardrail (every code change)

1. Detect. Before finishing, state explicitly whether automated tests
   exist for the code you touched (see "Detected test suites" below) and
   which suites cover it.
2. Keep tests in sync. If your change alters behavior a test asserts,
   UPDATE that test to match the intended new behavior. Never leave a
   test asserting the old behavior. Never delete, skip, comment out, or
   weaken a test just to get a green run — that is a separate
   anti-pattern (see docs/anti-patterns.md).
3. Run. Run the suites that cover the changed code. Treat all tiers
   (unit, integration, e2e) with equal weight — at minimum run the e2e
   suite; a green unit run does not excuse an unrun e2e suite.
4. Report honestly. State which suites ran, the pass/fail result, and
   what you changed in the tests and why.

## Fallback — when you CANNOT run the tests

If for ANY reason a suite cannot run (missing dependency, no browser or
display for e2e, services not up, unknown command, timeout, sandbox or
permission limit, etc.), you MUST NOT stay silent. At the END of your
response:

1. Warn the user, in plain language, that the tests were not run.
2. Name which suite(s) could not run and the specific reason (the actual
   error or the missing precondition).
3. Give exact, copy-pasteable commands to run them manually, including
   any setup required first (install browsers, start services, set env
   vars, seed the database).

A change that touched test-covered code and ends with neither a test run
nor this explicit warning is incomplete.

## Detected test suites

The guardrail above applies to both suites below: keep them green on every
change. Both suites have specs (`tests/unit/` and `tests/e2e/`), so an empty
run fails; the test files are authored and maintained by the test pair.

### Vitest (unit)

- Command: `pnpm test`
- Config: `vitest.config.ts`
- Test files: under `tests/unit/`

### Playwright (E2E and axe)

- Command: `pnpm test:e2e`
- Config: `playwright.config.ts`
- Test files: under `tests/e2e/`
- Prerequisite: `pnpm exec playwright install --with-deps chromium`
- Served by `astro preview`, so run `pnpm build` first.

The axe matrix (the boot, mid-hero, mid-projects and done moments, in both themes, at 1280x800 and 375x812) runs inside `pnpm test:e2e` (the `e2e` CI job). Screenshot baselines of build states are advisory and not generated yet: they must be created in CI's Linux environment (docs/development.md) and are not a gate.

### Quality gate scripts (CI)

Each gate is its own CI job and exits non-zero on a violation.

- `pnpm check:tokens` (CI job `tokens`, AC-9): no color or `box-shadow` literal in `src/` outside `src/styles/tokens.css` and `src/assets/`.
- `pnpm check:privacy` (CI job `privacy`, AC-8): privacy rules over `dist/`; run `pnpm build` first.
- `pnpm check:budgets` (CI job `budgets`, AC-10): gzip budgets over `dist/` (JS total 90 KB, JS before first paint 20 KB, runtime 18 KB, CSS 25 KB; the runtime is the JS only the home page loads, followed through its module imports); run `pnpm build` first. Measured on 2026-11-08 (Stage 3 Phase 5): JS total 13.9 KB, runtime 12.1 KB, critical 12.8 KB, CSS 7.4 KB gzip.
- `pnpm lighthouse` (CI job `lighthouse`, AC-10): Lighthouse CI per `lighthouserc.json`, median of 3 runs on `/` and `/projects/relay/`, every category >= 0.95 and CLS <= 0.01. It needs `pnpm build` and Chrome; locally set `CHROME_PATH=$(node -p "require('@playwright/test').chromium.executablePath()")`. Local Windows recipe: docs/development.md.

## Behavior rule coverage (Stage 3)

The 18 rules of the "Behavior rules" section of docs/02-experience.md map to PRD ACs and specs as below. The specs in the "Covered by" column exist today; the specs in the "Gap closed by" column are authored by the test pair in Stage 3 Phase 5 to close the gaps, and `-` means the rule has no gap.

| Rule | ACs | Covered by | Gap closed by |
|---|---|---|---|
| **Trigger** | AC-2 | `tests/e2e/runtime-build-order.spec.ts` (About stays pending after 30 s without scrolling), `tests/unit/runtime-scheduler.test.ts` | `tests/e2e/behavior-gaps.spec.ts` (the 75 % boundary and the `renderAbout();` window) |
| **Scroll hint** | AC-3 | `tests/e2e/controls-done-replay.spec.ts`, `tests/e2e/controls-speed.spec.ts` (reduced motion never pulses), `tests/unit/runtime-controls-timing.test.ts` | - |
| **Order** | AC-2, AC-5 | `tests/e2e/runtime-build-order.spec.ts` (order and at most one window), `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/unit/runtime-scheduler.test.ts` | - |
| **Reserved space** | AC-4 | `tests/e2e/runtime-fallbacks.spec.ts` (pending content stays laid out and in the tree), `tests/e2e/build-layer-show.spec.ts` (outline file names, outlines hidden), `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/e2e/controls-done-replay.spec.ts` (footer slot) | `tests/e2e/behavior-gaps.spec.ts` (dashed outline style, hero at first paint) |
| **The final layout never moves** | AC-4 | `tests/e2e/build-layer-layout.spec.ts`, `tests/e2e/effects-layout.spec.ts`, `tests/e2e/runtime-build-order.spec.ts` (all at 1280x800), `tests/e2e/effects-layout.spec.ts` (no horizontal scroll at 375x812) | `tests/e2e/layout-invariance.spec.ts` (against the no-JS page, at 375x812, at the done moment) |
| **Fast scrolling (turbo)** | AC-5 | `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/unit/runtime-scheduler-controls.test.ts` | - |
| **Never hijack scrolling** | AC-6 | `tests/e2e/controls-turbo-navigation.spec.ts`, `tests/e2e/controls-done-replay.spec.ts`, `tests/e2e/controls-speed.spec.ts` | - |
| **Skip** | AC-7, AC-21 | `tests/e2e/controls-skip.spec.ts` (Esc, dock button, bars, body, the open menu), `tests/unit/runtime-scheduler-controls.test.ts` | `tests/e2e/mobile-build.spec.ts` (tap on the compact bar) |
| **Run all** | AC-8 | `tests/e2e/controls-skip.spec.ts`, `tests/unit/runtime-scheduler-controls.test.ts` | - |
| **Deep links** | AC-9 | `tests/e2e/controls-turbo-navigation.spec.ts` (`#projects`, `#about`, `#contact`, nav Stack link) | - |
| **Keyboard focus** | AC-10 | `tests/e2e/controls-focus-resize.spec.ts`, `tests/unit/runtime-scheduler-controls.test.ts` | - |
| **Scrolling up** | AC-2 | `tests/unit/runtime-scheduler.test.ts` only (never replays a built section) | `tests/e2e/behavior-gaps.spec.ts` |
| **Immediate interaction** | AC-11 | `tests/e2e/effects-pointer.spec.ts` (hit tests, pointer events), `tests/e2e/build-layer-show.spec.ts` (window body ignores the pointer) | `tests/e2e/behavior-gaps.spec.ts` (a real click navigates to `/projects/relay`) |
| **Resize during a build** | AC-12 | `tests/e2e/controls-focus-resize.spec.ts`, `tests/e2e/build-layer-layout.spec.ts`, `tests/unit/runtime-controls-timing.test.ts` | - |
| **Revisits** | AC-13 | `tests/e2e/runtime-fallbacks.spec.ts` (saved speed still builds), `tests/e2e/controls-speed.spec.ts` | - |
| **Reduced motion** | AC-14 | `tests/e2e/controls-speed.spec.ts`, `tests/e2e/runtime-fallbacks.spec.ts`, `tests/e2e/build-layer-absent.spec.ts`, `tests/e2e/effects-absent.spec.ts` | - |
| **No JavaScript** | AC-15 | `tests/e2e/runtime-fallbacks.spec.ts` (no JS, aborted runtime, throwing runtime; the aborted-runtime test reveals the page after 1.5 s paused plus 3 s run of clock time), `tests/e2e/build-layer-absent.spec.ts`, `tests/e2e/effects-absent.spec.ts`, `tests/unit/runtime-mode-clock.test.ts` (the watchdog constant is 3 s) | `tests/e2e/behavior-gaps.spec.ts` (an explicit 3 s end-to-end bound) |
| **Background tab** | AC-16 | `tests/e2e/runtime-build-order.spec.ts`, `tests/unit/runtime-scheduler.test.ts`, `tests/unit/runtime-scheduler-tick.test.ts` | - |

### Other acceptance criteria

- **AC-1** (hero build): `tests/e2e/effects-scripts.spec.ts`, `tests/e2e/effects-hero.spec.ts`, `tests/e2e/build-layer-show.spec.ts` and `tests/unit/runtime-pacing.test.ts` cover the order, the 2.0 s headline, the compiled duration of at most 3200 ms and the idle dock. The first-paint pending state and the clock-measured 3.2 s are gaps closed by `tests/e2e/behavior-gaps.spec.ts`.
- **AC-17** (done state and Replay): `tests/e2e/controls-done-replay.spec.ts` and `tests/e2e/controls-speed.spec.ts`.
- **AC-18** (accessibility): `tests/e2e/controls-dock-a11y.spec.ts` (dock buttons and names), `tests/e2e/effects-layout.spec.ts` (the tree equals the no-JS page at six hero moments, mid-projects and mid-stack, desktop), `tests/e2e/effects-axe.spec.ts` (mid-hero and mid-projects, desktop, both themes) and `tests/e2e/home-axe.spec.ts` (ready dock, both themes, three viewports). The 12 axe cells still missing (boot and done on desktop, all four moments on mobile, both themes) and the mobile tree comparison are closed by `tests/e2e/axe-build-matrix.spec.ts`.
- **AC-19** (budgets): `tests/unit/runtime-budget.test.ts`, `tests/unit/quality-gates.test.ts` (Lighthouse config), `tests/e2e/quality-gates.spec.ts` and `tests/e2e/css-budget.spec.ts`; the Lighthouse medians are measured only by the CI `lighthouse` job.
- **AC-20** (build script contract): `tests/unit/runtime-compiler.test.ts`, `tests/unit/runtime-pacing.test.ts`, `tests/unit/verify-build-targets.test.ts` and `tests/e2e/runtime-timeline-contract.spec.ts`.
- **AC-21** (mobile build layer): `tests/e2e/build-layer-layout.spec.ts` covers the compact bar and the dock width and inset at 375x812; the mobile tap and the sticky bars of tall sections are closed by `tests/e2e/mobile-build.spec.ts`.

The Stage 2 spec `tests/e2e/home-no-build-layer.spec.ts` was rewritten in Phase 4 for the real build layer (not weakened).

### Test conventions for animated pages

- Always run `pnpm build` before `pnpm test:e2e`.
- Locally Playwright reuses an `astro preview` already serving `dist/` on 127.0.0.1:4321 (`reuseExistingServer`), so rebuild instead of restarting it.
- Playwright's `page.clock` is installed before navigation and time is advanced with `runFor`.
- Under the fake clock click page controls with `element.click()` inside `page.evaluate`, because `locator.click()` waits for animation frames.
- Progress is rounded to 1 %, and sampled moments carry about 52 ms late and 16 ms early error; effects have a 150 ms selection phase before a target goes live, so never sample on a phase boundary.
- `@axe-core/playwright` needs `browser.newContext()` before `newPage()`.
- The dock is hidden while the boot terminal is on screen, so wait for it to be visible before checking a dock control.
