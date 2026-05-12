# Agents PR Playbook

Canonical end-to-end workflow for: issue -> branch -> fix -> PR -> review loop -> green checks.

## Trigger
Use this playbook automatically when user input includes any of the following:
- issue URL
- issue ID
- phrases like "fix bug", "resolve issue", "implement issue"

Do not require user to explicitly ask for branch/PR creation.

## Input
- `issue_number`: GitHub issue ID, for example `1234`
- `target_branch`: default `dtq-dev` unless issue says otherwise
- `scope`: explicit in-scope change list and out-of-scope list

If user does not provide `target_branch`, assume `dtq-dev`.

## Step 0: Initialize Task Checklist
Create and keep a compact checklist for this run. Suggested statuses: `not-started`, `in-progress`, `done`, `blocked`.

Suggested checklist template:
- issue parsed
- scope confirmed
- branch created
- fix implemented
- local checks passed
- PR opened/updated
- Copilot review requested
- review comments handled
- checks green

Update checklist after every major step and use it as the source of truth for continuation.

## Step 1: Load Issue Context
- Read issue title, description, linked comments, and acceptance criteria.
- Extract explicit constraints: UI behavior, backward compatibility, SSR impact, test expectations.
- If acceptance criteria are missing, add an assumption block in PR notes.
- Mark checklist item `issue parsed` and `scope confirmed`.

## Step 2: Create Branch
- Update local target branch and branch off from it.
- Naming:
  - Feature: `feat/issue-<id>-<slug>`
  - Bugfix: `fix/issue-<id>-<slug>`
- Keep branch scoped to a single issue.
- Mark checklist item `branch created`.

## Step 3: Implement Minimal Fix
- Start with smallest viable code change that satisfies acceptance criteria.
- Keep changes localized.
- Preserve existing architecture patterns and SSR compatibility.
- Add or update tests only where behavior changes.
- Mark checklist item `fix implemented` when done.

## Step 4: Validate Locally (Required Order)
1. `yarn install --frozen-lockfile`
2. `yarn run lint --quiet`
3. `yarn run check-circ-deps`
4. `yarn run build:prod`
5. `yarn run test:headless`

Notes:
- Use Yarn, never npm.
- Node runtime for local agent runs should follow `.github/copilot-instructions.md`.
- If only a focused area changed, run targeted unit tests first, then run full required sequence before final PR-ready state.
- Mark checklist item `local checks passed` only after required sequence succeeds.

## Step 5: Open or Update PR
- Create PR targeting `target_branch`.
- Prefer GitHub CLI for deterministic automation:
  - `gh pr create --base <target_branch> --head <branch_name> --title "<title>" --body-file <file>`
  - or `gh pr edit <pr_number> --title "<title>" --body-file <file>` for updates
- Include:
  - problem statement
  - root cause
  - fix summary
  - test evidence (commands + result)
  - risks and rollback notes
- Link issue using `Fixes #<issue_number>` when appropriate.

If `gh` auth or permissions are missing, stop and return blocker details (see Output Contract below).
- Mark checklist item `PR opened/updated`.

## Step 6: Trigger Review
- Request human reviewer(s).
- Request Copilot review after PR is created/updated.
- Keep discussion on concrete code/test outcomes.

Recommended commands (adapt to org permissions):
- `gh pr comment <pr_number> --body "@copilot review"`
- `gh pr edit <pr_number> --add-reviewer <github-user-or-team>`

If review request cannot be sent due to permissions, continue with polling and return a note in final summary.
- Mark checklist item `Copilot review requested` when request succeeds, otherwise `blocked` with reason.

## Step 7: Post-PR Polling Loop (Adaptive Cadence)
After PR creation/update, start polling loop and continue until exit criteria are met:
1. Refresh review comments and review threads.
2. Refresh CI/check status.
3. If new blocking feedback exists:
  - follow `.github/agents/agents-fix-review.md`
  - decide per comment: implement now or respond with explicit rationale
  - push fixes and continue polling
4. If checks are red:
  - inspect failing jobs/logs
  - apply focused fix
  - re-run relevant local checks
  - push and continue polling

Polling cadence:
- Default: sleep/wait approximately 5 minutes between status refresh cycles.
- Active mode: use 2-minute polling when at least one is true:
  - new review comments arrived in the last cycle
  - any required check is failing
  - required checks are close to completion and frequent refresh is useful
- Keep looping until checks are green and no unresolved blocking comments remain.
- Update checklist on each cycle (`review comments handled`, `checks green`).

Maximum unattended polling window:
- 90 minutes by default.
- If still not converged, return `BLOCKER REPORT` with current PR state and next human commands.

## Exit Criteria
- Required checks are green.
- No unresolved blocking review comments.
- Required approvals are present according to repo policy.
- PR description reflects final code and test state.

Post-PR loop cannot exit early while checks are pending/failing or while blocking comments are unresolved.

## Output Contract (Mandatory)
Issue/bug task is complete only if final output contains exactly one of:
- `PR URL: <https://...>`
  - include final check status summary
  - include review status summary (blocking comments resolved)
  - include final checklist state
- `BLOCKER REPORT:`
  - failing step
  - exact error summary
  - exact follow-up command(s) for human
  - checklist state at time of block

Returning only "code fixed" or "local tests passed" is not sufficient completion.

## Safety Constraints
- Max 3 review/fix iterations by agent.
- If still unstable after 3 iterations, handoff to human with:
  - unresolved blockers
  - tried fixes
  - suspected root cause
  - recommended next step
- Do not expand scope without explicit justification in PR notes.
