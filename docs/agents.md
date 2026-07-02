# DSpace Angular – Agent & Human Collaboration Guide

> **Purpose**: A universal playbook for fixing **any** frontend issue through AI agent + human collaboration.
> The human prepares the environment and provides the issue. The agent investigates the problem visually
> (Playwright MCP), implements the fix, verifies it, and iterates until all CI checks pass.
>
> **Architecture**: Only the Angular frontend runs locally (for hot reload and code changes).
> The backend services (DSpace REST API, PostgreSQL, Solr) run in Docker containers.

---

## 1. Project Facts

| Property | Value |
|----------|-------|
| Framework | Angular 15 + Angular Universal (SSR) |
| Language | TypeScript 4.8 |
| Package manager | **Yarn 1.x** — never use `npm` |
| Node.js | **18.x** (`nvm use 18`) — Node 20+ breaks `eslint-plugin-jsdoc` |
| Unit tests | Jasmine / Karma (~5 300 specs) |
| E2E tests | Cypress 13, Chrome headless |
| Main branch | `dtq-dev` |
| Repo | `dataquest-dev/dspace-angular` |

---

## 2. Human Setup — Do This Before Handing Off to the Agent

### 2.1 One-Time Setup

1. Install **Docker Desktop** and start it.
2. Install **nvm** (or nvm-windows):
   ```bash
   nvm install 18
   nvm use 18
   ```
3. Install Yarn: `npm install -g yarn`
4. Clone the repo:
   ```bash
   git clone https://github.com/dataquest-dev/dspace-angular.git
   cd dspace-angular
   ```

### 2.2 Before Every Session

1. **Start the backend services in Docker** (REST API, PostgreSQL, Solr — needed for e2e and live verification):
   ```bash
   docker compose -p ci -f docker/docker-compose-ci.yml up -d
   docker compose -p ci -f docker/cli.yml -f docker/cli.assetstore.yml run --rm dspace-cli
   ```
   Verify: `curl http://localhost:8080/server/api/core/sites` returns JSON.
   > The frontend is NOT started here — it runs locally (see §3).

2. **Node version**: `node --version` → must be `v18.x`

3. **Heap size** (prevents OOM):
   - PowerShell: `$env:NODE_OPTIONS='--max-old-space-size=4096'`
   - Bash: `export NODE_OPTIONS='--max-old-space-size=4096'`

4. **Install dependencies**:
   ```bash
   yarn install --frozen-lockfile
   ```
   If Cypress download fails: `CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile`

5. **Create a feature branch**:
   ```bash
   git checkout dtq-dev && git pull
   git checkout -b <dspace-customer>/<short-issue-description>
   ```

6. **Open the project in VS Code** with Copilot / agent enabled.

### 2.3 Prompt Template — Copy, Fill In, Paste to Agent

```
Here is the GitHub issue to fix: <PASTE ISSUE URL>

Read the agent guide at docs/agents.md first.

Environment info:
- Backend services (REST API, Solr, PostgreSQL) are running in Docker on default ports
- Frontend will run locally (you start it with yarn start:dev or yarn serve:ssr)
- Admin credentials if necessary for the issue: <PASTE EMAIL>/<PASTE PASSWORD>

Please:
1. Read the issue and understand the problem
2. Use Playwright MCP to navigate to the affected page and visually confirm the bug
3. Investigate the codebase to find the root cause
4. Implement a fix
5. Use Playwright MCP again to verify the fix is working
6. Run all CI checks (lint → circ-deps → build → unit tests) and iterate until all pass
7. Only commit and push when everything is green

If the issue involves a specific page, here is the direct URL: <OPTIONAL URL>
```

That's it. Everything below is the agent's responsibility.

---

## 3. Agent Workflow

### 3.1 The Loop: Investigate → Fix → Verify → CI

```
1. READ the issue — understand what's broken and where
2. DETECT with Playwright MCP — navigate to the affected page, take snapshots,
   confirm the bug visually (duplicate IDs, broken layout, wrong behavior, etc.)
3. SEARCH the codebase — find the root cause in the source files
4. IMPLEMENT the fix — minimal, focused changes
5. VERIFY with Playwright MCP — navigate to the same page, confirm the fix works
6. RUN CI checks in order — fix any failures, re-verify after each code change
7. COMMIT & PUSH — only when everything passes
```

### 3.2 CI Pipeline — Run In This Order

Every step must pass before proceeding to the next.

| # | Step | Command | Time | Pass Criteria |
|---|------|---------|------|---------------|
| 1 | Lint | `yarn run lint --quiet` | ~76s | Exit 0, "All files pass linting." |
| 2 | Circular deps | `yarn run check-circ-deps` | ~34s | "No circular dependency found!" |
| 3 | Build | `yarn run build:prod` | ~6.5min | Two bundles (browser + server), no `Error:` lines |
| 4 | Unit tests | `yarn run test:headless` | ~3.5min | ~5300 specs, 0 failures |
| 5 | E2E tests | See §3.5 | ~5min | No new failures vs. `dtq-dev` baseline |

**If any step fails**: fix the code → rerun **that same step** → only proceed when green.

### 3.3 Running a Single Unit Test

```bash
yarn run test:headless --include='**/path/to/component.spec.ts'
```

### 3.4 PowerShell Trap — Circular Dependency Check

The `check-circ-deps` script uses `madge --exclude` with regex containing `|`. PowerShell interprets `|` as a pipeline operator. Use the stop-parsing token:

```powershell
npx --% madge --exclude "(bitstream|bundle|collection|config-submission-form|eperson|item|version)\.model\.ts$" --circular --extensions ts ./
```

### 3.5 E2E Tests (Requires Docker Backend)

Start the SSR server:
```bash
yarn run build:prod
yarn run serve:ssr &
# Wait for http://localhost:4000 to respond
```

Run public-page specs (always safe, no login needed):
```bash
npx cypress run --spec "cypress/e2e/footer.cy.ts,cypress/e2e/header.cy.ts,cypress/e2e/pagenotfound.cy.ts,cypress/e2e/browse-by-title.cy.ts,cypress/e2e/browse-by-author.cy.ts,cypress/e2e/browse-by-subject.cy.ts,cypress/e2e/community-list.cy.ts,cypress/e2e/search-page.cy.ts" --browser chrome
```

On PowerShell, set the base URL first:
```powershell
$env:CYPRESS_BASE_URL="http://localhost:4000"
```

### 3.6 E2E Test Categories

| Category | Spec files | Requires |
|----------|-----------|----------|
| **Public pages** (always safe) | `footer`, `header`, `pagenotfound`, `browse-by-*`, `community-list`, `search-page`, `feedback` | Frontend only |
| **Data-dependent** | `collection-page`, `community-page`, `item-page` | Backend + Demo Entities assetstore |
| **Login-required** | `submission*`, `admin-*`, `my-dspace`, `profile-page`, `handle-page`, `health-page` | Backend + Demo Entities + valid credentials |

### 3.7 Commit & Push

```bash
git add <changed-files>
# NEVER commit: config/config.yml, .env.* files, coverage/, cypress/videos/
git commit -m "fix: <concise description>"
git push origin ufal/<branch-name>
```

---

## 4. Using Playwright MCP for Detection & Verification

Playwright MCP is the agent's **eyes**. Use it to **see** the problem and **confirm** the fix.

### 4.1 Navigating to a Page

```
browser_navigate → http://localhost:4000/path/to/page
browser_snapshot → get the accessibility tree of the page
```

### 4.2 Running JavaScript on the Page

Use `browser_evaluate` to inspect the DOM. Examples:

**Check for duplicate HTML IDs**:
```javascript
async (page) => {
  return await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id).filter(Boolean);
    const counts = {};
    ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const dupes = Object.entries(counts).filter(([_, c]) => c > 1);
    return { total: ids.length, unique: new Set(ids).size, duplicates: dupes };
  });
}
```

**Verify specific selectors still work** (backward compatibility):
```javascript
async (page) => {
  return await page.evaluate(() => {
    const selectors = ['input#dc_title', 'label[for=dc_title]', '.some-class'];
    return selectors.map(s => `${s}: ${document.querySelectorAll(s).length}`);
  });
}
```

**Check console errors**:
```javascript
async (page) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.reload();
  await page.waitForTimeout(3000);
  return errors;
}
```

### 4.3 Logging In (When Needed)

Some pages require authentication (submission forms, admin panels).
Test credentials are defined in `cypress.config.ts` (look for `DSPACE_TEST_ADMIN_USER` / `DSPACE_TEST_ADMIN_PASSWORD`).

1. Navigate to the login page
2. Dismiss the DiscoJuice/Shibboleth overlay if it appears:
   ```javascript
   await page.evaluate(() => {
     document.querySelectorAll('[class*="discojuice"]').forEach(el => el.remove());
   });
   ```
3. Fill in credentials and submit the login form
4. Navigate to the target page

### 4.4 Screenshots for Evidence

Use `browser_take_screenshot` before and after the fix to document the change.

### 4.5 Dev Server vs. SSR Mode

| Mode | Command | CORS | Hot Reload |
|------|---------|------|------------|
| Dev server | `yarn start:dev` | ⚠️ Must match backend's `dspace.ui.url` port | ✅ Yes |
| SSR mode | `yarn build:prod` → `yarn serve:ssr` | ✅ No issues (server-side proxy) | ❌ No |

**Prefer SSR mode** for Playwright verification. It avoids CORS issues and reflects the real production behavior. Use dev server only when you need rapid iteration.

---

## 5. Known Pre-Existing E2E Failures

Before panicking about a red test, check if it was already failing on `dtq-dev`:

| Symptom | Affected Specs | Cause |
|---------|---------------|-------|
| DiscoJuice `display: none` click fails | Login-dependent tests | Docker env popup issue |
| `cy.wait('@viewevent')` timeout | `collection-page.cy.ts` | Matomo not configured |
| Entity redirect fails | `item-page.cy.ts` | Backend routing issue |
| `link-in-text-block` a11y violation | `privacy.cy.ts`, `end-user-agreement.cy.ts` | CSS styling issue |

**Rule**: Only fix failures that YOUR changes caused. If a test was already failing on `dtq-dev`, leave it alone.

---

## 6. Pitfalls & Lessons Learned

These come from real agent sessions. Read them before writing code.

### 6.1 Angular Template Binding

```html
<!-- ❌ WRONG — interpolation in non-standard attributes -->
<div aria-labelledby="prefix-{{ var }}">

<!-- ✅ CORRECT — property binding -->
<div [attr.aria-labelledby]="'prefix-' + var">
```

This applies to all `aria-*` and custom HTML attributes. Always use `[attr.X]="expression"` instead of `X="{{ interpolation }}"`.

### 6.2 Dynamic HTML IDs Must Be Valid

HTML `id` attributes must not contain whitespace or special characters. Sanitize dynamic data:
```typescript
sanitizedName = rawName.replace(/\s+/g, '');
```

### 6.3 Conditional `aria-describedby`

If a description element is conditionally rendered (`*ngIf`), the `aria-describedby` pointing to it must also be conditional:
```html
<span *ngIf="label" [id]="'desc-' + uniqueId">{{ label }}</span>
<input [attr.aria-describedby]="label ? 'desc-' + uniqueId : null">
```

### 6.4 Never Change Form Element IDs Unless You Have To

Submission forms use IDs like `input#dc_title`, `label[for=local_hasCMDI]` etc. These are referenced by Cypress e2e selectors and `formModel` definitions. Changing them cascades into dozens of broken tests. Unless the issue specifically requires it, leave form IDs alone.

### 6.5 `aria-labelledby` Must Match Label IDs

Many child form components reference `'label_' + model.id` in `[attr.aria-labelledby]`. If you change a label's `[id]`, you break accessibility wiring in 13+ template files. Keep label IDs stable — if deduplicating, change the form control ID, not the label.

### 6.6 Static State Leaks Between Tests

This project uses `{ teardown: { destroyAfterEach: false } }` (see `src/test.ts`), so `ngOnDestroy` does NOT run between unit tests. Any static registry or singleton must be explicitly cleared in the global `afterEach` in `src/test.ts`, or it will leak state across specs.

### 6.7 When to Revert Your Approach

If your change causes dozens of cascading test failures, **stop and rethink**. It's cheaper to revert the whole approach than to chase 50 broken selectors. A minimal, targeted fix is always better than a sweeping refactor.

### 6.8 PowerShell-Specific Issues

| Issue | Solution |
|-------|---------|
| `check-circ-deps` fails with pipe error | Use `npx --%` stop-parsing token |
| `&&` not valid in PowerShell 5.1 | Use `;` to chain commands |
| Env vars don't persist | Use `$env:VAR='val'` before each command |

### 6.9 Build Warnings to Ignore

These are pre-existing and harmless:
- `Warning: X.component.ts is unused` (theme components)
- `Warning: CommonJS or AMD dependencies`
- `Warning: bundle exceeded maximum budget`

Real errors always start with `Error:`.

### 6.10 SSR Compatibility

All code must work with Angular Universal. Never use `document` or `window` directly:
```typescript
import { isPlatformBrowser } from '@angular/common';
if (isPlatformBrowser(this.platformId)) {
  // browser-only code
}
```

### 6.11 Always Check `.spec.ts` When Changing Templates

When changing an `id`, `class`, or tag in a template, check the corresponding `.spec.ts`:
```bash
grep -n "By.css" src/app/.../my-component.component.spec.ts
```
If a test uses a selector you changed, update it or the test will fail.

---

## 7. Example: Duplicate HTML IDs in ng-dynamic-forms

> This section documents a real fix for reference. The patterns here apply to similar problems.

**Problem**: The submission edit page renders dynamic form fields via `@ng-dynamic-forms`. When the same metadata field appears in multiple `DynamicRowGroupModel` groups, each instance gets the **same HTML ID**, producing duplicates.

**Root cause**: `@ng-dynamic-forms/core` `getElementId(model)` only handles `DynamicFormArrayGroupModel` parents. It does NOT handle `DynamicFormGroupModel` / `DynamicRowGroupModel` parents, even though they have unique auto-generated IDs.

**Solution**: A `UniqueIdRegistry` static class that:
1. First occurrence of a base ID → returns the original ID (preserves Cypress selectors)
2. Subsequent occurrences → appends `_1`, `_2`, etc. via a monotonic counter
3. Components call `register()` on init and `release()` on destroy

The `get id()` override was added to `DsDynamicFormControlContainerComponent` and `DsDynamicScrollableDropdownComponent`.

**Also fixed**: `id="license_option_{{ license.id }}"` → `[id]="'license_option_' + license.id"` (interpolation rendered empty because Angular consumed it before DOM render).

---

## 8. Docker Reference (Backend Services Only)

Docker runs only the backend services. The Angular frontend always runs locally.

### Compose Files

| File | Purpose |
|------|--------|
| `docker-compose-ci.yml` | Backend stack for CI/testing (DSpace REST + PostgreSQL + Solr) |
| `docker-compose.yml` | Full stack dev (includes a frontend container — but we run frontend locally instead) |
| `docker-compose-rest.yml` | REST backend only |
| `cli.yml` + `cli.assetstore.yml` | Load Demo Entities test data |

### Default Ports

| Service | Port | Where |
|---------|------|-------|
| DSpace REST API | 8080 | Docker |
| PostgreSQL | 5432 | Docker |
| Solr | 8983 | Docker |
| Angular Frontend | 4000 | **Local** (not Docker) |

### Test Variables

Test credentials and UUIDs for e2e tests are defined in `cypress.config.ts` under the `env` section. Look for `DSPACE_TEST_ADMIN_USER`, `DSPACE_TEST_ADMIN_PASSWORD`, `DSPACE_TEST_COMMUNITY`, etc. These are standard DSpace demo-instance values — do **not** replace them with real credentials.

### Connecting the Local Frontend to Docker Backend

The backend's `dspace.ui.url` determines CORS allowed origins. Your local dev server port **must match** this URL, or browser XHR requests will be blocked.

1. Check which UI port the backend expects (look at the Docker compose env vars for `dspace.ui.url`)
2. Edit `config/config.yml` temporarily to match those ports
3. Run: `yarn start:dev`
4. **Never commit** `config/config.yml` changes — add it to your local `.gitignore` or always `git checkout` before committing

Alternatively, use SSR mode (`yarn build:prod` → `yarn serve:ssr`) which proxies API calls server-side and avoids CORS entirely. This is the **recommended approach** for Playwright verification.

### Docker Commands

```bash
# Start
docker compose -p ci -f docker/docker-compose-ci.yml up -d
docker compose -p ci -f docker/cli.yml -f docker/cli.assetstore.yml run --rm dspace-cli

# Verify
curl http://localhost:8080/server/api/core/sites

# Stop
docker compose -p ci -f docker/docker-compose-ci.yml down
```

---

## 9. Common Errors & Solutions

| Error | Fix |
|-------|-----|
| `The engine "node" is incompatible` | `nvm use 18` |
| `Cypress App could not be downloaded` | `CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile` |
| Out of memory during build | `$env:NODE_OPTIONS='--max-old-space-size=4096'` |
| `yarn.lock` merge conflicts | `git checkout --theirs yarn.lock; yarn install; git add yarn.lock` |
| `Can't bind to 'aria-labelledby'` | Use `[attr.aria-labelledby]="expr"` not interpolation |
| Cypress can't connect | Run `yarn serve:ssr` first; check `CYPRESS_BASE_URL` |
| CORS errors with dev server | Match port to backend's `dspace.ui.url`, or use SSR mode |
| `madge` pipe error on PowerShell | Use `npx --%` stop-parsing token |
| Test fails with `Cannot find element` | You renamed an ID — update the test selector too |
| DiscoJuice overlay blocks login | `document.querySelector('.discojuice-overlay')?.remove()` |

---

## 10. Code Conventions

| Convention | Rule |
|------------|------|
| Component prefix | `ds-` |
| Strings | Single quotes |
| Indentation | 2 spaces |
| Imports | Specific files, not barrels |
| Lodash | `import get from 'lodash/get'` |
| SSR | No raw `document`/`window` — use `isPlatformBrowser()` |
| Tests | Co-located `.spec.ts` files |
| JSDoc | Required on all new public methods |

---

## 11. Quick Reference

```bash
# Setup
nvm use 18
yarn install --frozen-lockfile

# CI validation (run in order)
yarn run lint --quiet
yarn run check-circ-deps
yarn run build:prod
yarn run test:headless

# Single test
yarn run test:headless --include='**/path/to/test.spec.ts'

# Dev server
yarn run start:dev

# E2E
yarn run build:prod
yarn run serve:ssr &
npx cypress run --spec "cypress/e2e/footer.cy.ts" --browser chrome

# Docker backend
docker compose -p ci -f docker/docker-compose-ci.yml up -d
docker compose -p ci -f docker/cli.yml -f docker/cli.assetstore.yml run --rm dspace-cli
docker compose -p ci -f docker/docker-compose-ci.yml down
```
