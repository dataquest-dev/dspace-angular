# pr-quality Skill

Checklist and structure for high-quality PRs in this repository.

## PR Narrative Template
- Problem: What user-facing or system behavior is wrong.
- Root Cause: Why current code fails.
- Change Set: What was modified and why this is minimal.
- Test Evidence: Exact commands run and summary outcomes.
- Risk: Potential side effects and mitigations.
- Rollback: How to revert safely if needed.

## Required Checklist
- Issue linked (for example `Fixes #1234`) when applicable.
- Scope is limited to the issue.
- Lint passed.
- Circular dependency check passed.
- Build passed.
- Unit tests passed.
- Public API changes include required docs/comments where applicable.
- New behavior has tests or explicit justification if tests are not possible.

## Review Readiness
- Diff is easy to review and split into logical commits.
- No unrelated file churn.
- PR description includes assumptions and non-goals.
- Known pre-existing failures (if any) are explicitly separated from new failures.

## Suggested Validation Section
- `yarn run lint --quiet` -> pass
- `yarn run check-circ-deps` -> pass
- `yarn run build:prod` -> pass
- `yarn run test:headless` -> pass

## Definition of Done for PR Quality
- Reviewer can verify fix from PR text plus command evidence, without guessing intent.
