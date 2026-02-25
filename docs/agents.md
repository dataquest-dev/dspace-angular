# DSpace Angular – Agent & User Guide

> **Audience**: AI coding agents (GitHub Copilot, Cursor, etc.) **and** humans who delegate issues to them.
> Covers the exact steps a user must do manually, the prompt to give the agent, what the agent must do, and hard-won lessons from real CI failures.

---

## 1. Project Facts

| Property | Value |
|----------|-------|
| Framework | Angular 15 + Angular Universal (SSR) |
| Language | TypeScript 4.8 |
| Package manager | **Yarn 1.x** — never use `npm` |
| Node.js | **18.x** (`nvm use 18`) — Node 20+ breaks `eslint-plugin-jsdoc` |
| Unit tests | Jasmine / Karma (~5 300 specs, ~3.5 min) |
| E2E tests | Cypress 13, Chrome headless |
| Main branch | `dtq-dev` |
| CI file | `.github/workflows/build.yml` |
| Repo | `dataquest-dev/dspace-angular` |

---

## 2. User Checklist — What YOU Must Do Before the Agent Starts

The agent cannot start Docker, install nvm, or open VS Code for you. Do these steps **once** per machine / session.

### 2.1 One-time Setup

1. Install **Docker Desktop** and start it.
2. Install **nvm** (or nvm-windows) and run:
   ```bash
   nvm install 18
   nvm use 18
   ```
3. Install Yarn globally: `npm install -g yarn`
4. Clone the repo (if not done):
   ```bash
   git clone https://github.com/dataquest-dev/dspace-angular.git
   cd dspace-angular
   ```

### 2.2 Before Every Agent Session

1. **Start the DSpace backend in Docker** (needed for e2e tests):
   ```bash
   docker compose -p ci -f docker/docker-compose-ci.yml up -d
   docker compose -p ci -f docker/cli.yml -f docker/cli.assetstore.yml run --rm dspace-cli
   ```
   Wait until `docker container ls` shows all containers healthy.
   Verify: `curl http://localhost:8080/server/api/core/sites` returns JSON.

2. **Ensure correct Node version** — `node --version` must say `v18.x`.

3. **Set the heap size** (prevents OOM on build):
   - PowerShell: `$env:NODE_OPTIONS='--max-old-space-size=4096'`
   - Bash: `export NODE_OPTIONS='--max-old-space-size=4096'`

4. **Install dependencies**:
   ```bash
   yarn install --frozen-lockfile
   ```
   If Cypress download fails: `CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile`

5. **Open the project in VS Code** (or your editor).

6. **Create a feature branch**:
   ```bash
   git checkout dtq-dev && git pull
   git checkout -b ufal/<short-issue-description>
   ```

### 2.3 Giving the Issue to the Agent

Paste the agent a prompt like this (adapt the issue URL and description):

> Here is the issue: `<LINK TO GITHUB ISSUE>`
> Here is the agent guide: `docs/agents.md`
>
> Please read the guide first, then implement the fix, and iterate through **every CI step**
> (lint → circ-deps → build → unit tests → e2e tests) until all pass.
> Only then commit and push to the branch `ufal/<branch-name>`.
> If e2e tests fail on known pre-existing issues, that is acceptable — see the guide.

That's it. The rest is the agent's job.

---

## 3. The CI Pipeline (`build.yml`)

Every PR triggers CI on Node 18.x and 20.x. **All steps must pass.**

| # | Step | Command | Time |
|---|------|---------|------|
| 1 | Install | `yarn install --frozen-lockfile` | ~2 min |
| 2 | Lint | `yarn run lint --quiet` | ~76 sec |
| 3 | Circular deps | `yarn run check-circ-deps` | ~34 sec |
| 4 | Build (browser + server) | `yarn run build:prod` | ~6.5 min |
| 5 | Unit tests | `yarn run test:headless` | ~3.5 min |
| 6 | Docker backend up | `docker compose -f docker/docker-compose-ci.yml up -d` + assetstore | ~3 min |
| 7 | E2E tests | `yarn run serve:ssr` + Cypress via `cypress-io/github-action` | ~5 min |
| 8 | SSR verification | `wget` + `grep` on 10 entity pages (Home, Community, Collection, Publication, Person, Project, OrgUnit, Journal, Journal Volume, Journal Issue) | ~1 min |
| 9 | HTTP status codes | 301 `/handle/*`, 403, 404, 500 | ~30 sec |

---

## 4. Agent Workflow — Step-by-Step Iteration

### ⚠️ RULE: Do NOT commit or push until steps 1–5 all pass. Steps 6–7 if Docker backend is available.

```
FOR EACH step below:
  1. Run the command
  2. If it FAILS → fix the code → rerun THAT SAME step
  3. Only proceed to the next step when current one is green
```

### Step 1 — Install Dependencies
```bash
yarn install --frozen-lockfile
```

### Step 2 — Lint
```bash
yarn run lint --quiet
```
Must exit with code 0 and print "All files pass linting."

### Step 3 — Circular Dependencies
```bash
yarn run check-circ-deps
```
Must print "✔ No circular dependency found!"

**⚠️ PowerShell trap**: The underlying `madge --exclude` regex contains `|` pipe characters. PowerShell interprets `|` as a pipeline operator even inside quotes. Use the stop-parsing token:
```powershell
npx --% madge --exclude "(bitstream|bundle|collection|config-submission-form|eperson|item|version)\.model\.ts$" --circular --extensions ts ./
```

### Step 4 — Production Build
```bash
yarn run build:prod
```
Takes ~6.5 min. Run as a background process and poll for completion.
Must produce **two** successful bundles: browser + server. Ignore warnings about unused theme components and CommonJS dependencies — these are pre-existing.

### Step 5 — Unit Tests
```bash
yarn run test:headless
```
Expect ~5 300 specs, 0 failures. If a test fails, read the error, fix the code or test, rerun.

Run a single test file:
```bash
yarn run test:headless --include='**/path/to/component.spec.ts'
```

### Step 6 — E2E Tests (requires Docker backend)

Start the SSR server first (if not already running):
```bash
yarn run serve:ssr &          # background
# Wait for http://localhost:4000 to respond
```

Run safe public-page specs (no login, no specific test data required):
```bash
npx cypress run --spec "cypress/e2e/footer.cy.ts,cypress/e2e/header.cy.ts,cypress/e2e/pagenotfound.cy.ts,cypress/e2e/browse-by-title.cy.ts,cypress/e2e/browse-by-author.cy.ts,cypress/e2e/browse-by-subject.cy.ts,cypress/e2e/community-list.cy.ts,cypress/e2e/search-page.cy.ts,cypress/e2e/feedback.cy.ts,cypress/e2e/browse-by-dateissued.cy.ts" --browser chrome
```

On Windows PowerShell, set the base URL first:
```powershell
$env:CYPRESS_BASE_URL="http://localhost:4000"
npx cypress run --spec "cypress/e2e/footer.cy.ts,..." --browser chrome
```

### Step 7 — Commit & Push (only after all green)

```bash
git add <files>                 # NEVER add config/config.yml or .env.* files
git commit -m "fix: <description>"
git push origin ufal/<branch-name>
```

---

## 5. E2E Test Categories & What to Run

| Category | Spec files | Requires |
|----------|-----------|----------|
| **Public pages** (always safe) | `footer`, `header`, `pagenotfound`, `browse-by-*`, `community-list`, `search-page`, `feedback` | Frontend only |
| **Data-dependent** | `collection-page`, `community-page`, `item-page` | Backend + Demo Entities assetstore |
| **Login-required** | `submission*`, `admin-*`, `my-dspace`, `profile-page`, `handle-page`, `health-page`, `tombstone`, `system-wide-alert` | Backend + Demo Entities + valid credentials |
| **No active tests** | `homepage`, `homepage-statistics`, `search-navbar`, `login-modal` | N/A |

### Cypress Config

- Config: `cypress.config.ts`
- Specs: `cypress/e2e/*.cy.ts`
- Default base URL: `http://localhost:4000` (override with `CYPRESS_BASE_URL`)
- Retries: 2 in run mode, 0 in open mode
- Test data: [Demo Entities Data set](https://github.com/DSpace-Labs/AIP-Files/releases/tag/demo-entities-data)

### Key Test Variables (from `cypress.config.ts`)

| Variable | Value |
|----------|-------|
| `DSPACE_TEST_ADMIN_USER` | `dspacedemo+admin@gmail.com` |
| `DSPACE_TEST_ADMIN_PASSWORD` | `dspace` |
| `DSPACE_TEST_COMMUNITY` | `0958c910-2037-42a9-81c7-dca80e3892b4` |
| `DSPACE_TEST_COLLECTION` | `282164f5-d325-4740-8dd1-fa4d6d3e7200` |
| `DSPACE_TEST_ENTITY_PUBLICATION` | `6160810f-1e53-40db-81ef-f6621a727398` |

---

## 6. Known Pre-existing E2E Failures (Not Your Bug)

Before panicking about a red test, check this list:

| Symptom | Affected Specs | Root Cause | Action |
|---------|---------------|------------|--------|
| `cy.get('.discojuice_close').click()` fails — element is `display: none` | All login-dependent tests | DiscoJuice popup is hidden in Docker env | **Skip** — pre-existing |
| `cy.wait('@viewevent')` timeout | `collection-page.cy.ts` | Matomo/statistics not configured in Docker | **Skip** — pre-existing |
| Entity redirect fails | `item-page.cy.ts` | Backend entity routing not configured | **Skip** — pre-existing |
| `link-in-text-block` a11y violation | `privacy.cy.ts`, `end-user-agreement.cy.ts` | CSS link styling issue | **Skip** — pre-existing |

**Rule**: Only fix failures that YOUR changes caused. If a test was already failing on `dtq-dev`, leave it alone.

---

## 7. Hard-Won Lessons (Pitfalls & Traps)

These come from real agent sessions. Read them before writing code.

### 7.1 Angular Template Binding

❌ **WRONG** — interpolation inside `aria-*` / `attr.*`:
```html
<div aria-labelledby="prefix-{{ variable }}">
```
Angular will throw `Can't bind to 'aria-labelledby' since it isn't a known property` at build time.

✅ **CORRECT** — property binding:
```html
<div [attr.aria-labelledby]="'prefix-' + variable">
```

This applies to **all** `aria-*` and custom HTML attributes. Always use `[attr.X]="expression"` instead of `X="{{ interpolation }}"` for non-standard attributes.

### 7.2 Dynamic HTML IDs Must Be Valid

HTML `id` attributes must not contain whitespace or special characters. If an ID is built from dynamic data (e.g., bundle names, file names, user input), **sanitize it**:

```typescript
sanitizedName = rawName.replace(/\s+/g, '');
```

Then use `sanitizedName` in the template `id` attribute. Never trust that a service will return a "safe" string for an HTML ID.

### 7.3 Conditional `aria-describedby`

If a `<label>` or description element is conditionally rendered (`*ngIf`), the `aria-describedby` pointing to it must also be conditional:

```html
<!-- The label only exists when `label` is truthy -->
<span *ngIf="label" [id]="'desc-' + uniqueId">{{ label }}</span>

<!-- So aria-describedby must be conditional too -->
<input [attr.aria-describedby]="label ? 'desc-' + uniqueId : null">
```

If you always set `aria-describedby` to a non-existent element, screen readers will be confused and accessibility audits (Cypress axe-core) may flag it.

### 7.4 Never Change Form Element IDs Unless You Have To

Submission forms use IDs like `input#dc_title`, `label[for=local_hasCMDI]` etc. These are referenced by:
- Cypress e2e selectors in `cypress/e2e/submission*.cy.ts`
- `formModel` definitions in `src/app/shared/form/builder/`
- DynamicFormControlLayout configs

If you change these IDs (e.g., adding suffixes for uniqueness), **every Cypress selector breaks**. Unless the issue specifically requires changing form IDs, leave them alone.

### 7.5 PowerShell-Specific Issues

| Issue | Solution |
|-------|---------|
| `yarn run check-circ-deps` fails with pipe error | Use `npx --%` stop-parsing token (see Step 3 above) |
| Environment variables don't persist across commands | Set them on the same line or use `$env:VAR='val'` before each command |
| `&&` is not valid in PowerShell 5.1 | Use `;` to chain commands |

### 7.6 Build Output — What to Ignore vs. What Matters

**Ignore** (pre-existing, harmless):
- `Warning: X.component.ts is part of the TypeScript compilation but it's unused`
- `Warning: CommonJS or AMD dependencies can cause optimization bailouts`
- `Warning: bundle initial exceeded maximum budget`
- `Warning: Expected identifier but found "*"` (CSS hack for old IE)

**Do NOT ignore** (real errors):
- `Error: ...` lines in the build output
- `Template parse errors`
- `Property 'X' does not exist on type 'Y'`
- `Module not found`

### 7.7 Files You Must NEVER Commit

| File | Reason |
|------|--------|
| `.env.*` files | Local environment configs |
| `cypress/videos/`, `cypress/screenshots/` | Test artifacts |
| `coverage/` | Generated coverage reports |

### 7.8 Reverting a Bad Approach

If your change looks correct but breaks dozens of tests, **stop and reconsider**. It's cheaper to revert a whole approach than to chase 50 cascading failures. Example: Adding unique ID suffixes to dynamic form elements broke all Cypress `input#dc_*` selectors — the right move was to revert the form changes entirely and fix only the static duplicates.

### 7.9 Unit Test Spec Selectors

When changing an `id`, `class`, or tag in a template, **always check the corresponding `.spec.ts` file**:
```bash
# Find the spec for a component
ls src/app/.../my-component.component.spec.ts

# Search for selectors that reference the changed ID/class
grep -n "By.css" src/app/.../my-component.component.spec.ts
```
If a test uses `By.css('[id^="oldPrefix"]')` and you removed that ID, update the selector or the test will fail.

---

## 8. Docker Reference

### Compose Files (`docker/`)

| File | Purpose |
|------|---------|
| `docker-compose-ci.yml` | CI backend (DSpace REST + PostgreSQL + Solr) |
| `docker-compose.yml` | Full stack dev |
| `docker-compose-rest.yml` | REST backend only |
| `cli.yml` | DSpace CLI commands |
| `cli.assetstore.yml` | Load Demo Entities test data |

### Default CI Ports

| Service | Port |
|---------|------|
| DSpace REST API | 8080 |
| PostgreSQL | 5432 |
| Solr | 8983 |
| Angular Frontend (SSR) | 4000 |

### Docker Commands

```bash
# Start
docker compose -p ci -f docker/docker-compose-ci.yml up -d
docker compose -p ci -f docker/cli.yml -f docker/cli.assetstore.yml run --rm dspace-cli

# Verify
docker container ls
curl http://localhost:8080/server/api/core/sites

# Stop
docker compose -p ci -f docker/docker-compose-ci.yml down
```

---

## 9. Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `The engine "node" is incompatible` | Node 20+ | `nvm use 18` |
| `The Cypress App could not be downloaded` | Network | `CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile` |
| Out of memory during build | Heap too small | `$env:NODE_OPTIONS='--max-old-space-size=4096'` |
| Merge conflicts in `yarn.lock` | Branch diverged | `git checkout --theirs yarn.lock; yarn install; git add yarn.lock` |
| `Can't bind to 'aria-labelledby'` | Template syntax | Use `[attr.aria-labelledby]="'...' + var"` not `aria-labelledby="...{{ var }}"` |
| `Property 'X' does not exist on type` | Missing property | Add the property to the component class or fix the type |
| Cypress can't connect | Frontend not running | Run `yarn run serve:ssr` first; check `CYPRESS_BASE_URL` |
| `cy.wait()` timed out | Backend endpoint unavailable | Ensure Docker backend is up + assetstore loaded |
| Docker images won't pull | Auth issue | `docker login ghcr.io` or check VPN/firewall |
| `madge` pipe error on PowerShell | `|` in regex | Use `npx --%` stop-parsing token |
| Test fails with `Cannot find element with id "..."` | You renamed/removed an ID | Update the test selector too |

---

## 10. Code Conventions

| Convention | Rule |
|------------|------|
| Component prefix | `ds-` (e.g., `<ds-navbar>`) |
| File naming | `*.component.ts`, `*.service.ts`, `*.model.ts`, `*.spec.ts`, `*.module.ts` |
| Strings | Single quotes |
| Indentation | 2 spaces |
| Imports | Avoid barrel imports; import from specific files |
| Lodash | Method imports: `import get from 'lodash/get'` |
| SSR | All code must work with Angular Universal (no `document`/`window` without checks) |
| Tests | Co-located with source (same directory, `.spec.ts` suffix) |
| JSDoc | All new public methods and classes require TypeDoc comments |

---

## 11. Quick Reference

```bash
# === Setup ===
nvm use 18
yarn install --frozen-lockfile

# === Full CI validation (run in this order) ===
yarn run lint --quiet              # ~76 sec
yarn run check-circ-deps           # ~34 sec
yarn run build:prod                # ~6.5 min
yarn run test:headless             # ~3.5 min

# === Single unit test ===
yarn run test:headless --include='**/path/to/test.spec.ts'

# === Dev server (hot reload) ===
yarn run start:dev                 # http://localhost:4000

# === E2E tests ===
docker compose -p ci -f docker/docker-compose-ci.yml up -d
docker compose -p ci -f docker/cli.yml -f docker/cli.assetstore.yml run --rm dspace-cli
yarn run build:prod
yarn run serve:ssr &
yarn run e2e                       # all specs
# or specific:
npx cypress run --spec "cypress/e2e/footer.cy.ts" --browser chrome

# === Cleanup ===
docker compose -p ci -f docker/docker-compose-ci.yml down
yarn run clean:prod
```
