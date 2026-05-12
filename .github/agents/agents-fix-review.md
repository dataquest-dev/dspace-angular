# Agents Review Loop Playbook

Standard process for handling PR review feedback with minimal risk.

## Loop Entry Condition
Use this playbook after PR is opened/updated and review/check statuses are being monitored.

Carry forward the checklist initialized in `.github/agents/agents-pr.md` and keep it updated during each review cycle.

## Parse Review Feedback
- Gather all open comments from PR review and inline threads.
- Normalize each comment into:
  - `type`: blocking or non-blocking
  - `area`: file/component/test/doc
  - `expected_change`: explicit action

Suggested data refresh cadence:
- Default cadence: refresh review data and checks/status every 5 minutes.
- Active cadence: switch to every 2 minutes when new comments appear, checks are failing, or quick follow-up is needed near status transitions.
- Update checklist status after each refresh.

## Prioritize
1. Blocking correctness issues
2. Regressions and failing checks
3. Test gaps for changed behavior
4. Non-blocking cleanups and readability suggestions

## Execution Rules
- Apply small, atomic commits per feedback cluster.
- Do not mix unrelated refactors into review-fix commits.
- Preserve public behavior unless comment explicitly requests behavior change.
- Keep commit messages traceable to review topics.
- For each Copilot/human suggestion, make explicit decision:
  - `accept`: implement and validate
  - `decline`: add concise PR reply with technical rationale

Blocking suggestions must not be ignored silently.

## Test Strategy Per Iteration
- After each review round, re-run relevant tests first.
- Minimum per changed area:
  - targeted test(s) for touched component/service
  - lint for touched code
- Before marking comments resolved, confirm required full checks still pass:
  - `yarn run lint --quiet`
  - `yarn run check-circ-deps`
  - `yarn run build:prod`
  - `yarn run test:headless`

## Reporting Back in PR
For each resolved feedback item, report:
- what was changed
- where it was changed
- what test/validation was run
- why solution is safe

Suggested template:
- `Fixed:` <short description>
- `Files:` <paths>
- `Validation:` <commands/results>
- `Notes:` <compatibility or tradeoff>

For declined suggestions, use:
- `Not applied:` <short description>
- `Reason:` <technical rationale>
- `Risk:` <why current state is safe>

## Polling Completion Rule
Continue adaptive polling loop (5-minute default, 2-minute active mode) until all are true:
- required checks are green
- no unresolved blocking review comments
- no pending requested changes from required reviewers

When complete, mark checklist items `review comments handled` and `checks green` as done.

If loop exceeds 90 minutes or repository API access is insufficient, stop and return `BLOCKER REPORT` with:
- current PR URL
- unresolved checks/comments
- exact next commands for human follow-up
- checklist state at time of stop

## Safety
- If feedback is ambiguous, document assumption in PR comment before deep refactor.
- If comment requests scope expansion, split into follow-up issue unless explicitly approved.
- If repeated failures persist, escalate after third loop as human handoff.
