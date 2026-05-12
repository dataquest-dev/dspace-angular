# security Skill

Mandatory safety guardrails for agent-driven changes.

## Hard Prohibitions
- Never commit secrets, tokens, passwords, private keys, or credential dumps.
- Never add real credentials to tests, config, docs, or screenshots.
- Never run destructive git operations without explicit human approval:
  - `git reset --hard`
  - `git checkout -- <path>`
  - history rewrites on shared branches
- Never push directly to protected integration branches (`dtq-dev`, `main`).

## Repository Hygiene
- Do not commit runtime/local artifacts, including:
  - `.env*`
  - `coverage/`
  - `cypress/videos/`
  - `cypress/screenshots/`
  - temporary logs or local debug dumps
- Do not silently change CI policy files unless task explicitly requires it.

## Change Safety
- Keep scope minimal and issue-focused.
- Re-run validation after each meaningful change.
- Stop and request human handoff if fix path becomes unclear or risky.

## Review Safety
- Mark assumptions explicitly when requirements are ambiguous.
- If requested change conflicts with existing policy/docs, document conflict and choose policy-compliant path.

## Incident Rule
If accidental sensitive data appears in working tree:
- stop further edits
- report file path and exposure risk
- wait for human remediation instruction
