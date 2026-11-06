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

The axe matrix runs inside `pnpm test:e2e` (the `e2e` CI job). Screenshot
baselines are not part of Stage 2 yet.

### Quality gate scripts (CI)

Each gate is its own CI job and exits non-zero on a violation.

- `pnpm check:tokens` (CI job `tokens`, AC-9): no color or `box-shadow` literal in `src/` outside `src/styles/tokens.css` and `src/assets/`.
- `pnpm check:privacy` (CI job `privacy`, AC-8): privacy rules over `dist/`; run `pnpm build` first.
- `pnpm check:budgets` (CI job `budgets`, AC-10): gzip budgets over `dist/` (JS total 90 KB, JS before first paint 20 KB, CSS 25 KB); run `pnpm build` first.
- `pnpm lighthouse` (CI job `lighthouse`, AC-10): Lighthouse CI per `lighthouserc.json`, median of 3 runs on `/` and `/projects/relay/`, every category >= 0.95 and CLS <= 0.01. It needs `pnpm build` and Chrome; locally set `CHROME_PATH=$(node -p "require('@playwright/test').chromium.executablePath()")`.
