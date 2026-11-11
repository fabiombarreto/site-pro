# Test Runner Report — stage-4-sections-effects

**Outcome:** ✅ GREEN
**Duration:** 2m 46s
**Run ID:** `e05e66cf-0a78-41a7-aac4-c1db4d10d761`
**TDD track:** inactive
**Budgets:** max_test_retries = 3, max_test_minutes = 30

## Summary

| Metric | Value |
|--------|-------|
| Attempts | 0 / 4 |
| Total wall-clock | 2m 46s |
| Post-green review | ✅ APPROVED |

## Time breakdown

| Phase | Duration |
|-------|----------|
| attempt_1_suite_ms | 2m 46s |

## Post-green review

**Verdict:** ✅ APPROVED
**Base branch:** `e2acfcb51162a1402b1d416a2cb7d4058f72a2b9 (Phase 5 start tree)`
**Files analyzed:** 6

Notes:

- coverage baseline unavailable (no PRPs/reports/coverage-baseline.json); weakening detection limited to structural checks
- quality-gates.test.ts: additions only (2 new it blocks), consistent with the single EXISTING_TEST_UPDATED ledger row
- image-effects-matrix.spec.ts: scoped axe .exclude() for the fading build-layer selection label in a new spec; not a skip, not a weakening; the scan still asserts empty violations

## Secrets redaction

- Count: 0
- Categories: env_names: 0, url_values: 0, regex_matches: 0

## Open plan-review advisories

Recorded by plan-review as advisory-classed (non-gating) findings and delivered to the Implementer; none of these blocked approval.

| Phase | Check | Note |
|-------|-------|------|
| phase-1 | R-COH-OTHER-INTERNAL-CONTRADICTION | ## Step-by-Step Tasks (Task 4) says "exports `PHOTO_HEIGHTS = [960, 760, 480]` and `PHOTO_SIZES`"; ## Step-by-Step Tasks |

---

_Generated 2026-11-11T13:42:09.290Z from artifacts in `C:\repos\site-pro\PRPs\reports\stage-4-sections-effects`._
