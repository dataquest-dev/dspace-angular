# CLARIN WAYF — Agent Context

This document captures all context needed to continue work on this feature.

---

## What This Is

A **CLARIN WAYF (Where Are You From)** Identity Provider (IdP) picker, implemented as a standalone Angular component inside DSpace Angular 9.2.

It replaces the legacy external DiscoJuice/jQuery solution. Instead of redirecting to a separately deployed discovery service, the IdP selection UI is now embedded directly inside the DSpace frontend — on the `/login` page and in the header dropdown.

The eventual goal is to extract this into a standalone Angular Elements Web Component (`<clarin-wayf>`), but for now it lives here for development and design iteration.

---

## Component Location

```
src/app/clarin-wayf/
├── AGENTS.md                          ← this file
├── clarin-wayf.component.ts           ← main orchestrator component
├── clarin-wayf-routes.ts              ← standalone route at /wayf
├── models/
│   ├── idp-entry.model.ts             ← IdpEntry interface (backend "shrunk" format)
│   └── wayf-config.model.ts           ← WayfConfig, SamldsParams types
├── services/
│   ├── search.service.ts              ← fuzzy search engine (Sørensen–Dice)
│   ├── search.service.spec.ts         ← 33 unit tests (all passing)
│   ├── feed.service.ts                ← HTTP fetch + cache of IdP JSON feed
│   ├── persistence.service.ts         ← localStorage (last IdP, up to 5 recent)
│   └── i18n.service.ts                ← signal-based translation (en/cs/de)
└── components/
    ├── idp-card/
    │   └── wayf-idp-card.component.ts ← single IdP card (logo, name, tag badge)
    ├── search-bar/
    │   └── wayf-search-bar.component.ts ← search input with ARIA combobox
    ├── idp-list/
    │   └── wayf-idp-list.component.ts ← virtualized/filtered list of IdP cards
    └── recent-idps/
        └── wayf-recent-idps.component.ts ← strip of recently used IdPs
```

---

## Integration Points (Files Modified Outside This Folder)

### 1. Standalone Route
- **`src/app/app-routes.ts`** — added lazy route `/wayf` → `clarin-wayf-routes.ts`

### 2. Login Page (`/login`)
- **`src/app/login-page/login-page.component.ts`** — added `wayfOpen` signal, `toggleWayf()`, `onIdpSelected()`, `HardRedirectService` injection
- **`src/app/login-page/login-page.component.html`** — divider + toggle button + collapsible `<ds-clarin-wayf>` panel below password form
- **`src/themes/custom/app/login-page/login-page.component.ts`** — added `ClarinWayfComponent` to `imports` (themed wrapper)

### 3. Header Dropdown Login
- **`src/app/shared/auth-nav-menu/auth-nav-menu.component.ts`** — added `activeLoginTab` signal, `ClarinWayfComponent`, `HardRedirectService`, tab switching logic
- **`src/app/shared/auth-nav-menu/auth-nav-menu.component.html`** — replaced single `<ds-log-in>` with two-tab layout: "Local Login" + "Institution"
- **`src/app/shared/auth-nav-menu/auth-nav-menu.component.scss`** — widened dropdown to 400px, added `.wayf-login-tabs` styling
- **`src/themes/custom/app/shared/auth-nav-menu/auth-nav-menu.component.ts`** — added `ClarinWayfComponent` to `imports`

### 4. Shibboleth Auth Method (for backends with Shibboleth configured)
- **`src/app/shared/log-in/methods/shibboleth-wayf/log-in-shibboleth-wayf.component.ts`** — new component; replaces hard-redirect button with inline WAYF
- **`src/app/shared/log-in/methods/log-in.methods-decorator.ts`** — `AuthMethodType.Shibboleth` now maps to `LogInShibbolethWayfComponent`
- **`src/app/shared/log-in/methods/auth-methods.type.ts`** — added `typeof LogInShibbolethWayfComponent` to union type

### 5. i18n
- **`src/assets/i18n/en.json5`** — added keys:
  - `wayf.title`, `wayf.breadcrumbs`
  - `login.wayf.button`, `login.wayf.header`, `login.wayf.close`
  - `nav.login.tab.local`, `nav.login.tab.institution`

### 6. Mock Feed
- **`src/assets/mock/wayf-feed.json`** — 10 sample IdPs (MUNI, CESNET, Charles University, CVUT, LMU, KU Leuven, Perun, Café Brazil, UW, Example University)

---

## Key Design Decisions

### SAMLDS Protocol
On IdP selection, the component builds a Shibboleth SP redirect URL:
```
/Shibboleth.sso/Login?entityID=<selectedEntityID>&target=<returnUrl>
```
`onIdpSelected()` in both `login-page.component.ts` and `auth-nav-menu.component.ts` calls `hardRedirectService.redirect()` with this URL.

### Feed Loading (`clarin-wayf.component.ts`)
Feed URL resolved in this priority order:
1. `feedUrl` input binding (parent passes it)
2. `WAYF_CONFIG` token `feedUrl` value
3. `?feedUrl=` query parameter (for standalone `/wayf` route)
4. Auto-derived from DSpace REST config: `${APP_CONFIG.rest.baseUrl}/api/discojuice/feeds`

The backend endpoint returns 204 when feeds haven't cached yet (handled gracefully).

### Fuzzy Search (`search.service.ts`)
- Diacritics normalized via `NFD` + strip combining marks
- Sørensen–Dice bigram similarity coefficient (no external deps)
- Scoring: exact match = 2, word boundary = 1 + ratio, fuzzy ≥ 0.4 threshold
- Title-first scoring: bonus applied when query matches the `title` field

### Persistence (`persistence.service.ts`)
- `clarin-wayf-last-idp` key — entityID of last selected IdP
- `clarin-wayf-recent-idps` key — JSON array, max 5 entries, newest first

### Angular Patterns Used
- **Standalone components** throughout (no NgModules)
- **`inject()`** exclusively (no constructor injection)
- **Signals** for all reactive state (`signal()`, `computed()`)
- **`input()`/`output()`** for component I/O (Angular 17+ API)
- **`@if`/`@for`** control flow (Angular 17+ template syntax)
- **OnPush** change detection

---

## Running Tests

```bash
npm test -- --include='src/app/clarin-wayf/**/*.spec.ts'
```

All 33 tests in `search.service.spec.ts` should pass.

---

## TODO / Next Steps

- [x] **Production feed URL**: Auto-derived from `APP_CONFIG.rest.baseUrl` → `/api/discojuice/feeds`
- [ ] **Shibboleth SP path**: Verify `/Shibboleth.sso/Login` matches the actual SP endpoint in the target deployment; make it configurable via `environment.ts`
- [ ] **Proxy/Hub IdPs**: Wire `proxyEntities` input with actual CLARIN hub entityIDs so they pin to the top of the list with a badge
- [ ] **Visual polish**: The component currently uses minimal Bootstrap 5 CSS variables; full UX design pass needed
- [ ] **Component tests**: Only `search.service.spec.ts` exists; add specs for `feed.service.ts`, `persistence.service.ts`, and `clarin-wayf.component.ts`
- [ ] **Angular Elements extraction**: Once stable, extract into a separate library and package as `<clarin-wayf>` custom element (single `<script>` tag, Shadow DOM)

---

## DSpace-Specific Gotchas

- **Themed components**: DSpace uses a `src/themes/custom/` shadow that re-exports base components with their own `imports` array. Whenever you add a new component to a base component's template, you **must also add it to the themed wrapper's `imports`**. Forgetting this causes `Unknown element 'ds-...'` errors only in the themed variant.
- **TypeScript config**: `noImplicitAny: false` and `strictNullChecks: false` — code is permissive but `fullTemplateTypeCheck: true` means template errors are strict.
- **i18n**: After adding keys to `en.json5`, restart the dev server — the asset hash changes and the old bundle won't pick up new keys.
- **Auth method decorator map**: `AUTH_METHOD_FOR_DECORATOR_MAP` in `log-in.methods-decorator.ts` is the single source of truth for which component renders for each `AuthMethodType`. Update both the map and the `AuthMethodTypeComponent` union type together.
