# Agent Automation Framework

This repository uses a lightweight agent automation framework for the loop:
Issue -> fix -> PR -> review loop -> checks green.

## Purpose
- Define one entrypoint for agent behavior.
- Keep issue-to-PR flow deterministic and auditable.
- Reuse canonical project commands and CI-aligned checks.

## Auto-Dispatch Rules
When a user gives a high-level request (for example: "fix this issue", "resolve this bug", or shares an issue URL), the agent must use this routing automatically:
1. Read this file (`AGENTS.md`) first.
2. If request is issue/bug implementation, load `.github/agents/agents-pr.md`.
3. Run implementation and local validation from that playbook.
4. After PR is opened/updated, if review feedback exists, load `.github/agents/agents-fix-review.md` and execute review loop.
5. Use `.github/skills/*.SKILL.md` files only when the current step needs that capability (dev commands, PR quality, security constraints).

This means users do not need a specialized prompt to trigger the full workflow.

## Progress Tracking Contract
For long-running issue/PR tasks, the agent must maintain a short live checklist of steps and status.

Minimum checklist items:
- issue parsed and scope confirmed
- branch created
- implementation done
- local validation done
- PR opened/updated
- review loop status
- checks status

Rules:
- initialize checklist near the beginning of execution
- update checklist after each major step
- use checklist state to avoid skipping steps or repeating completed work
- include final checklist state in completion summary

## Entry Documents
- Main PR workflow playbook: `.github/agents/agents-pr.md`
- Review iteration playbook: `.github/agents/agents-fix-review.md`
- Project dev commands skill: `.github/skills/dspace-dev.SKILL.md`
- PR quality skill: `.github/skills/pr-quality.SKILL.md`
- Security guardrails skill: `.github/skills/security.SKILL.md`
- Extended human+agent operational guide: `docs/agents.md`

## Hard Rules
- Never push directly to `dtq-dev` or `main`.
- Always use an issue branch (`feat/issue-<id>-<slug>` for features, `fix/issue-<id>-<slug>` for bugfixes).
- Run required validation before requesting final review: lint, circular dependency check, build, unit tests.
- Do not expand issue scope without explicit reason documented in PR.
- No destructive git commands (`git reset --hard`, `git checkout -- <path>`) unless explicitly approved by a human owner.
- Do not commit local/runtime artifacts (for example `.env*`, `coverage/`, `cypress/videos/`, `cypress/screenshots/`).

## PR Workflow Pointer
Use `.github/agents/agents-pr.md` as the canonical issue-to-PR workflow document.

## Completion Contract
For issue/bug requests, "done" means one of the following:
- PR successfully opened or updated, required checks are green, no unresolved blocking review comments remain, and agent returns `PR URL` + validation summary.
- PR could not be opened due to a concrete blocker, and agent returns `BLOCKER REPORT` with exact failing step and exact commands for human follow-up.
- PR exists but post-PR loop could not finish (for example missing API permission for review/check status), and agent returns `BLOCKER REPORT` with exact failing step and exact commands for human follow-up.

A local code fix without `PR URL` or `BLOCKER REPORT` is not considered complete.

## Assumptions
- Default integration branch in this fork is `dtq-dev` (from repository workflow configuration).
- If a specific issue or maintainer instruction requires another target branch, that instruction overrides this default.
