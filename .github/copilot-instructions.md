# GitHub Copilot Instructions for dspace-angular

## Project Overview

**dspace-angular** is the Angular-based frontend UI for DSpace 7, a turnkey digital repository application. This is a fork customized for [clarin-dspace](https://github.com/ufal/clarin-dspace/tree/clarin-v7), built with Angular 15, TypeScript 4.8, and Angular Universal for server-side rendering (SSR).

- **Size**: ~2,800 TypeScript files, 813 components, 805 test files
- **Framework**: Angular 15 with Angular Universal (SSR)
- **Language**: TypeScript 4.8
- **Package Manager**: Yarn 1.x (NOT npm)
- **Build Tool**: Angular CLI with custom webpack config
- **Testing**: Jasmine/Karma (unit), Cypress (e2e)
- **Target Runtimes**: Node.js 16.x or 18.x
- **Main Branch**: `clarin-v7`

## Critical Build Requirements

### Node Version Requirements
**ALWAYS use Node.js 16.x or 18.x**. Node 20+ is NOT compatible due to dependency constraints (eslint-plugin-jsdoc requires Node 14-19).

```bash
# If using nvm (RECOMMENDED):
nvm install 18
nvm use 18
```

### Environment Setup (REQUIRED BEFORE ANY BUILD)

1. **Always install dependencies first**:
   ```bash
   yarn install --frozen-lockfile
   ```
   - Use `--frozen-lockfile` to ensure consistent versions
   - If Cypress download fails due to network restrictions, use: `CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile`

2. **Never use npm** - this project uses Yarn 1.x exclusively. Package manager commands:
   - Add dependency: `yarn add <package>`
   - Remove dependency: `yarn remove <package>`
   - Upgrade dependency: `yarn upgrade <package>`

## Build & Validation Commands

### Standard Workflow (ALWAYS run in this order)
```bash
# 1. Install dependencies (required after any branch switch or pull)
yarn install --frozen-lockfile

# 2. Lint the code (MUST pass - ~76 seconds)
yarn run lint --quiet

# 3. Check for circular dependencies (MUST pass - ~34 seconds)
yarn run check-circ-deps

# 4. Build for production (~6.5 minutes)
yarn run build:prod

# 5. Run unit tests (~3.5 minutes, 4801 tests)
yarn run test:headless
```

### Alternative Commands
- **Development server**: `yarn run start:dev` (localhost:4000)
- **Production server**: `yarn start` (builds then runs with SSR)
- **Build only**: `yarn run build:prod`
- **Unit tests with watch**: `yarn run test:watch`
- **E2E tests**: `yarn run e2e` (requires running DSpace REST backend)
- **Clean everything**: `yarn run clean` (removes node_modules, requires reinstall)
- **Clean build artifacts**: `yarn run clean:prod`

### Build Time Expectations
- Lint: ~76 seconds
- Circular dependency check: ~34 seconds
- Production build: ~6.5 minutes (390+ seconds)
- Unit tests: ~3.5 minutes (212 seconds), 4801 tests
- Full CI pipeline: ~15-20 minutes

### Common Build Issues & Solutions

**Issue**: Node version incompatibility
- **Error**: `The engine "node" is incompatible with this module`
- **Solution**: Switch to Node 16.x or 18.x using nvm

**Issue**: Cypress installation failure
- **Error**: `The Cypress App could not be downloaded`
- **Solution**: Use `CYPRESS_INSTALL_BINARY=0` flag during yarn install

**Issue**: Out of memory during build
- **Solution**: The CI sets `NODE_OPTIONS='--max-old-space-size=4096'`

**Issue**: Merge conflicts in yarn.lock
- **Solution**: 
  ```bash
  git checkout --theirs yarn.lock
  yarn install
  git add yarn.lock
  git commit
  ```

## Code Quality Requirements (CI CHECKS)

All pull requests MUST pass these checks:

1. **ESLint validation**: `yarn run lint --quiet` (MUST pass)
2. **No circular dependencies**: `yarn run check-circ-deps` (MUST pass)
3. **TypeDoc comments**: All new/modified public methods and classes require JSDoc comments
4. **Unit tests**: All tests must pass, new features require new tests
5. **Code coverage**: Currently ~77% statements, 74% functions
6. **Build success**: Production build must complete without errors

### Linting Configuration
- Config file: `.eslintrc.json`
- Rules: TypeScript strict mode, Angular style guide
- Auto-fix: `yarn run lint-fix` (use cautiously)

## Project Structure

### Root Directory Files
```
angular.json          # Angular CLI configuration
karma.conf.js         # Karma test runner config
cypress.config.ts     # Cypress e2e test config
package.json          # Dependencies & scripts
tsconfig.json         # TypeScript base config
.eslintrc.json        # ESLint rules
nodemon.json          # Development server hot reload
server.ts             # Express server for SSR
```

### Key Directories
```
/config               # App configuration (config.yml)
/src/app              # Main application code (components, services, modules)
/src/assets           # Static files (i18n, images, fonts)
/src/config           # TypeScript config interfaces
/src/environments     # Environment-specific configs
/src/themes           # UI themes (dspace, custom)
/cypress/e2e          # E2E integration tests
/webpack              # Custom webpack configurations
/docker               # Docker compose files for dev/test
/scripts              # Build and utility scripts
/docs                 # Documentation (Configuration.md)
```

### Source Code Organization
- **Components**: `/src/app/<feature>/<component>.component.ts`
- **Services**: `/src/app/core/services/`
- **Models**: `/src/app/core/shared/`
- **Tests**: Co-located with source files (`.spec.ts`)
- **Themes**: `/src/themes/dspace/` and `/src/themes/custom/`

### Configuration Files

**Application Configuration**:
- Default: `config/config.yml`
- Environment-specific: `config/config.(dev|prod).yml`
- Runtime: Can be overridden via environment variables (prefix: `DSPACE_`)

**Environment Variables** (for testing/CI):
```bash
DSPACE_REST_HOST=localhost
DSPACE_REST_PORT=8080
DSPACE_REST_NAMESPACE=/server
DSPACE_REST_SSL=false
DSPACE_UI_HOST=localhost
DSPACE_UI_PORT=4000
```

## Testing

### Unit Tests (Jasmine/Karma)
- **Location**: `src/**/*.spec.ts` (co-located with source)
- **Run**: `yarn run test:headless` (CI mode) or `yarn test` (watch mode)
- **Run single test**: `yarn run test:headless --include='**/path/to/test.spec.ts'`
  - Use glob patterns relative to workspace root
  - Example: `yarn run test:headless --include='**/date-picker/date-picker.component.spec.ts'`
- **Config**: `karma.conf.js`
- **Coverage**: Generated in `/coverage/dspace-angular/`
- **Expectations**: ~4801 tests, ~77% coverage, ~3.5 minute runtime

### E2E Tests (Cypress)
- **Location**: `/cypress/e2e/**/*.spec.ts`
- **Run**: `yarn run e2e` (requires backend at localhost:8080)
- **Config**: `cypress.config.ts`
- **Prerequisites**: 
  - DSpace REST API running (see docker/README.md)
  - Test data loaded (Entities dataset)
- **Browser**: Chrome by default

### Test Best Practices
- Always run unit tests before creating a PR
- Co-locate test files with source code
- Use existing test patterns for consistency
- E2E tests require backend - document this in PRs

## GitHub Actions CI Workflow

**Main workflow**: `.github/workflows/build.yml`

CI runs on:
- Push to `clarin-v7` or `customer/*` branches
- All pull requests
- Daily schedule
- Manual workflow dispatch

**CI Steps** (matrix: Node 16.x, 18.x):
1. Checkout code
2. Install Node.js (specified version)
3. Install Chrome (for e2e tests)
4. Cache Yarn dependencies
5. Install dependencies: `yarn install --frozen-lockfile`
6. Lint: `yarn run lint --quiet`
7. Check circular deps: `yarn run check-circ-deps`
8. Build: `yarn run build:prod`
9. Unit tests: `yarn run test:headless`
10. Start Docker backend (for e2e)
11. E2E tests with Cypress
12. Verify SSR rendering

**Artifacts**: Coverage reports, e2e videos/screenshots (on failure)

## Docker Support

Docker configurations are in `/docker/` directory (see docker/README.md):

- `docker-compose.yml`: Start Angular UI from current branch
- `docker-compose-rest.yml`: Start DSpace REST API backend
- `docker-compose-ci.yml`: CI testing configuration
- `cli.yml`: DSpace CLI commands
- `cli.assetstore.yml`: Load test data

**Note**: Docker images are for development/testing only, NOT production-ready.

## Architecture & Patterns

### Angular Universal (SSR)
- Server entry: `src/main.server.ts`
- Browser entry: `src/main.browser.ts`
- Express server: `server.ts`
- SSR is REQUIRED - all changes must support SSR

### State Management
- Uses NgRx for state management
- Store configuration: `/src/app/store/`

### Theming
- Themeable components in `/src/themes/`
- Base theme: `dspace`
- Custom theme: `custom`

### Key Dependencies
- Angular 15.2.8
- TypeScript 4.8.4
- Bootstrap 4.6.x
- NgRx 15.4.x
- RxJS 7.8.x

## Making Code Changes

### Before Starting
1. Switch to Node 16 or 18: `nvm use 18`
2. Install dependencies: `yarn install --frozen-lockfile`
3. Run linter baseline: `yarn run lint --quiet`
4. Run tests baseline: `yarn run test:headless`

### During Development
1. Make minimal, focused changes
2. Add TypeDoc comments for public APIs
3. Keep changes SSR-compatible
4. Run lint frequently: `yarn run lint --quiet`
5. Add/update tests as needed

### Before Committing
1. Lint: `yarn run lint --quiet` (MUST pass)
2. Check circular deps: `yarn run check-circ-deps` (MUST pass)
3. Build: `yarn run build:prod` (MUST succeed)
4. Test: `yarn run test:headless` (MUST pass)
5. Manual smoke test if UI changes made

### Pull Request Requirements
- PR must pass all CI checks
- Include description of changes
- Link to related issues
- Update documentation if needed
- Add tests for new functionality
- Follow Angular style guide

## Common Patterns & Conventions

### File Naming
- Components: `*.component.ts`
- Services: `*.service.ts`
- Models: `*.model.ts`
- Tests: `*.spec.ts`
- Module: `*.module.ts`

### Code Style
- Prefix for components: `ds-` (e.g., `<ds-navbar>`)
- TypeScript strict mode enabled
- Single quote for strings
- 2-space indentation
- No trailing spaces
- End files with newline

### Import Conventions
- Avoid barrel imports where possible
- Import from specific files for better tree-shaking
- Use lodash method imports: `import get from 'lodash/get'`

## Troubleshooting Checklist

If builds/tests fail:

1. **Check Node version**: `node --version` (should be 16.x or 18.x)
2. **Clean install**: `yarn run clean && yarn install --frozen-lockfile`
3. **Clear Angular cache**: `yarn run clean:cli`
4. **Check for merge conflicts** in yarn.lock
5. **Verify environment variables** if configuration seems wrong
6. **Check disk space** - builds create large artifacts
7. **Increase Node memory** if OOM: `export NODE_OPTIONS='--max-old-space-size=4096'`

## Additional Resources

- **Documentation**: https://wiki.lyrasis.org/display/DSDOC7x/
- **REST API Contract**: https://github.com/DSpace/RestContract
- **Contributing Guide**: CONTRIBUTING.md
- **Configuration Guide**: docs/Configuration.md
- **Docker Guide**: docker/README.md

## Important Notes

- **ALWAYS** use Yarn, never npm
- **ALWAYS** use Node 16 or 18, not 20+
- **ALWAYS** run `yarn install --frozen-lockfile` after branch changes
- **ALWAYS** validate changes with lint, build, and test before PR
- This project uses Angular Universal - all code must be SSR-compatible
- Default backend: Demo DSpace REST API (no local backend required for basic testing)
- Branch naming: Feature branches should target `clarin-v7`

## Trust These Instructions

These instructions have been validated by running all commands successfully. If you encounter discrepancies or errors:
1. First verify you're using Node 16 or 18
2. Ensure dependencies are installed: `yarn install --frozen-lockfile`
3. Only search for additional information if these instructions are incomplete or proven incorrect
