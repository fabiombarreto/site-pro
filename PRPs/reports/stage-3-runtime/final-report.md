# Test Runner Report — stage-3-runtime

**Outcome:** ✅ GREEN
**Duration:** 1m 18s
**Run ID:** `49038d6a-bc6f-490b-9fd0-46cbbf2aa3c5`
**TDD track:** inactive
**Budgets:** max_test_retries = 3, max_test_minutes = 30

## Summary

| Metric | Value |
|--------|-------|
| Attempts | 1 / 4 |
| Total wall-clock | 1m 18s |
| Post-green review | ✅ APPROVED |

## Time breakdown

| Phase | Duration |
|-------|----------|
| attempt_1_suite_ms | 1m 18s |

## Attempts

### Attempt 1 — ✅ PASSED

- **Duration:** 6m 10s
- **Tests:** 693 passed, 0 failed, 0 skipped (total 693)
- **Tier:** unit+e2e
- **Framework:** vitest+playwright
- **Log:** `attempts/1/stdout.log`

## Post-green review

**Verdict:** ✅ APPROVED
**Base branch:** `main`
**Files analyzed:** 42

Notes:

- coverage baseline unavailable; structural checks only
- ledger: APPROVED Phase 5 manifest, one UPDATE row (support/layer.ts startPaused)
- no removed test functions (2 in-place renames in home-no-build-layer, net 0), no skip markers, no file deletions
- 4 new Phase 5 specs scanned directly (untracked at review time)

## Secrets redaction

- Count: 0
- Categories: env_names: 0, url_values: 0, regex_matches: 0

## Open plan-review advisories

Recorded by plan-review as advisory-classed (non-gating) findings and delivered to the Implementer; none of these blocked approval.

| Phase | Check | Note |
|-------|-------|------|
| phase-2 | R-COH-OTHER-INTERNAL-CONTRADICTION | ## Metadata (Complexity row) says "five files in src/components/build/"; ## Metadata (Systems Affected row) says "src/co |

---

_Generated 2026-11-09T12:36:08.692Z from artifacts in `C:\repos\site-pro\PRPs\reports\stage-3-runtime`._

🤖 Generated with [Claude Code](https://claude.com/claude-code)
