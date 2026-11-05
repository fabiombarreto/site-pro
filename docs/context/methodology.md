---
tdd: false                # true | false — the only key consulted by the TDD track
tdd_evidence: "user-declared"        # null | "<path-or-short-reason>" | "user-declared"
test_frameworks: [vitest, playwright]       # array of frameworks detected in the scan (informative only)
docs_sync: true           # true | false — per-project master switch for automated docs/ sync (docs-updater/docs-reviewer)
figma_track: false        # true | false — opt-in switch for the Figma implementation track (design-to-code); default off, never heuristically flipped
visual_first_approval: auto  # auto | human — default approval mode for the Figma Visual-First Track's visual-first blocking gate; only meaningful when figma_track: true
lane_runtime_safe: false  # true | false — declares the project's test stage does not contend on shared runtime resources (ports, containers, databases); default off, never heuristically flipped
formatter_cmd: null   # null | "<command string>" — project formatter command; null means undeclared; never heuristically inferred
hybrid_code_review: false  # true | false — opt-in switch for the hybrid /code-review evidence pass inside code-reviewer's R-SEM row; default off, never heuristically flipped
hybrid_code_review_level: "medium"   # "medium" | "high" — configured /code-review effort level for the hybrid pass; any other value (xhigh, max, ultra, etc.) is refused by name inside code-reviewer, never heuristically inferred
---

# Methodology

## TDD (Test-Driven Development)

Current state: **test-after** (`tdd: false`), declared by the owner on 2026-11-05 in the Stage 2 PRD (PRPs/prds/stage-2-foundation.prd.md). Vitest and Playwright are declared in `test_frameworks` ahead of their installation in Stage 2 Phase 1, so the relay test pair authors and maintains tests after the Implementer and Code Review.

The TDD track (agents B7 and B8) activates only when `tdd: true` in the
frontmatter above. Heuristics MUST NOT flip this value — only a human edit
or an explicit user declaration during `*init` can.

### Observed signals

- No code and no test suite exist yet (2026-11-04). On 2026-11-05 the owner declared `test_frameworks: [vitest, playwright]` before installation, so the test pair does not self-skip; Stage 2 Phase 1 installs both.
- docs/06-architecture.md and docs/08-tools.md choose **Vitest** (runtime, scheduler, React components) and **Playwright** (E2E, visual, axe accessibility), with a deterministic clock so tests can capture any moment of a build.
- docs/07-roadmap-and-decisions.md sets the Stage 3 exit as "every scenario in docs/02 Behavior rules covered by an E2E test". This is test-heavy, but it is not a TDD declaration.

### How to activate

1. Confirm with the team that TDD is the declared methodology.
2. Change `tdd: false` to `tdd: true` above.
3. Set `tdd_evidence` to `"user-declared"` or the path that records the
   decision.
4. Ensure `test_frameworks` lists frameworks the plugin should drive.

## Design source

The design lives in Claude Design (D11), not Figma, so `figma_track` stays `false`. The Design System, screens and prototype links are in docs/context/architecture.md.
