# dspace-dev Skill

Canonical development commands and validation flow for this repository.

## Environment Baseline
- Use Yarn 1.x commands.
- Follow repository Copilot instructions for local Node runtime selection.
- Always install dependencies before validation runs:
  - `yarn install --frozen-lockfile`

## Canonical Commands
- Install deps: `yarn install --frozen-lockfile`
- Lint: `yarn run lint --quiet`
- Circular dependencies: `yarn run check-circ-deps`
- Production build: `yarn run build:prod`
- Unit tests (headless): `yarn run test:headless`
- Dev server: `yarn run start:dev`
- SSR serve after build: `yarn run serve:ssr`

## Required Validation Order
1. `yarn install --frozen-lockfile`
2. `yarn run lint --quiet`
3. `yarn run check-circ-deps`
4. `yarn run build:prod`
5. `yarn run test:headless`

## Focused Test Runs
- Single or subset unit tests:
  - `yarn run test:headless --include='**/path/to/file.spec.ts'`
- Fast local loop recommendation:
  - run focused tests first
  - then run full required validation order before PR readiness

## E2E Context
- E2E command from package scripts: `yarn run e2e`
- In CI, Cypress runs against SSR server and Docker backend as defined in `.github/workflows/build.yml`.

## PowerShell Note
If circular dependency command parsing fails in PowerShell due to `|`, use stop-parsing form:
- `npx --% madge --exclude "(bitstream|bundle|collection|config-submission-form|eperson|item|version)\.model\.ts$" --circular --extensions ts ./`

## Assumption
- Full local CI-equivalent validation does not require changing repository CI workflow files.
