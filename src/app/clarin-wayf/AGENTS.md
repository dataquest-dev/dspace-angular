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
├── index.ts                           ← barrel file (public API surface)
├── wayf.config.ts                     ← WayfConfig, WAYF_CONFIG token, WAYF_DEFAULTS, SamldsParams
├── wayf.module.ts                     ← WayfModule (forRoot() convenience wrapper)
├── clarin-wayf.component.ts           ← main orchestrator component
├── clarin-wayf.component.spec.ts      ← 13 unit tests
├── clarin-wayf-routes.ts              ← standalone route at /wayf
├── models/
│   ├── idp-entry.model.ts             ← IdentityProvider, DiscoFeedEntry interfaces + normalize helpers
│   └── idp-entry.model.spec.ts        ← 12 unit tests
├── services/
│   ├── search.service.ts              ← fuzzy search engine (Sørensen–Dice)
│   ├── search.service.spec.ts         ← 27 unit tests
│   ├── feed.service.ts                ← HTTP fetch + cache of IdP JSON feed
│   ├── feed.service.spec.ts           ← 14 unit tests
│   ├── persistence.service.ts         ← localStorage (last IdP), SSR-safe
│   └── persistence.service.spec.ts    ← 8 unit tests
└── components/
    ├── idp-card/
    │   ├── wayf-idp-card.component.ts ← single IdP card (logo, name, tag badge)
    │   └── wayf-idp-card.component.spec.ts  ← 10 unit tests
    ├── search-bar/
    │   ├── wayf-search-bar.component.ts     ← search input with ARIA combobox
    │   └── wayf-search-bar.component.spec.ts ← 7 unit tests
    ├── idp-list/
    │   ├── wayf-idp-list.component.ts       ← filtered list of IdP cards
    │   └── wayf-idp-list.component.spec.ts  ← 11 unit tests
    └── recent-idps/
        ├── wayf-recent-idps.component.ts    ← strip of recently used IdPs
        └── wayf-recent-idps.component.spec.ts ← 10 unit tests
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

### 5. Mock Feed
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
A three-tier scoring algorithm designed for international academic federations where institution names appear in local scripts (Czech, German, Portuguese, etc.).

**Tier 1 — Exact substring** (score = 2): the normalized query appears verbatim in the entry's searchable text (title, keywords, description, country, domain). Fastest path.

**Tier 2 — Word-level match** (score = 1 + word-hit ratio): each query word is checked individually against the searchable text. Handles multi-word queries like `"charles university"`.

**Tier 3 — Fuzzy bigram / Sørensen–Dice coefficient** (score = 0.4–1.0): character bigrams of each query word are compared against each text word. Provides typo tolerance — e.g. `"univerzita"` matches `"universita"`, `"masarik"` matches `"masaryk"`. Entries scoring below 0.4 similarity are filtered out.

**Bonus**: +0.5 when the query matches the `title` field directly (promotes title-first results).

**Preprocessing**:
- Diacritics stripped via Unicode NFD decomposition + combining-mark removal
- Lowercased, whitespace-collapsed
- Searchable text includes: title, keywords, description, country, domain extracted from entityID URL

**Why not use a library?** The implementation is ~25 lines for the Dice coefficient, zero external dependencies, and fully covered by 27 unit tests. A library (e.g. Fuse.js) would add ~30 KB for the same result.

### Persistence (`persistence.service.ts`)
- `wayf:last-idp` key — entityID of last selected IdP
- SSR-safe: all `localStorage` calls guarded with `isPlatformBrowser()`
- Gracefully handles `QuotaExceededError` and disabled storage

> **Breaking change (April 2026):** localStorage key was renamed from `clarin-wayf-last-idp` to `wayf:last-idp`. Existing users will lose their remembered IdP selection on first visit after upgrade.

### Security (`clarin-wayf.component.ts`)
- **`sanitizeReturnUrl()`** — validates SAMLDS `return` URL; only `http:` and `https:` schemes allowed (blocks `javascript:`, `data:`, and malformed URLs)
- **Feed URL validation** — `loadFeed()` rejects non-HTTP(S) feed URLs
- **SSR guards** — all `window.location.href` assignments wrapped in `isPlatformBrowser()`

### Service Scoping
- All 4 services use bare `@Injectable()` (no `providedIn: 'root'`)
- Services are provided at component level via `ClarinWayfComponent.providers`
- This enables multiple independent WAYF instances on the same page

### Angular Patterns Used
- **Standalone components** throughout (plus `WayfModule` convenience wrapper)
- **`inject()`** exclusively (no constructor injection)
- **Signals** for all reactive state (`signal()`, `computed()`)
- **`input()`/`output()`** for component I/O (Angular 17+ API)
- **`@if`/`@for`** control flow (Angular 17+ template syntax)
- **OnPush** change detection
- **`InjectionToken`** (`WAYF_CONFIG`) for external configuration

---

## Running Tests

```bash
npm test -- --include='src/app/clarin-wayf/**/*.spec.ts'
```

All **112 tests** across 9 spec files should pass (verified April 2026).

---

## TODO / Next Steps

- [x] **Production feed URL**: Auto-derived from `APP_CONFIG.rest.baseUrl` → `/api/discojuice/feeds`
- [x] **Component tests**: 112 tests across all services, components, and models (April 2026)
- [x] **Security hardening**: URL sanitization, feed URL validation, SSR guards (April 2026)
- [x] **Type safety**: Zero `as any` casts; fully typed config resolution (April 2026)
- [x] **Barrel file / public API**: `index.ts` exports all public symbols (April 2026)
- [ ] **Shibboleth SP path**: Verify `/Shibboleth.sso/Login` matches the actual SP endpoint in the target deployment; make it configurable via `environment.ts`
- [ ] **Proxy/Hub IdPs**: Wire `proxyEntities` input with actual CLARIN hub entityIDs so they pin to the top of the list with a badge
- [ ] **Visual polish**: The component currently uses minimal Bootstrap 5 CSS variables; full UX design pass needed
- [ ] **Angular Elements extraction**: Once stable, extract into a separate library and package as `<clarin-wayf>` custom element (single `<script>` tag, Shadow DOM)

---

## DSpace-Specific Gotchas

- **Themed components**: DSpace uses a `src/themes/custom/` shadow that re-exports base components with their own `imports` array. Whenever you add a new component to a base component's template, you **must also add it to the themed wrapper's `imports`**. Forgetting this causes `Unknown element 'ds-...'` errors only in the themed variant.
- **TypeScript config**: `noImplicitAny: false` and `strictNullChecks: false` — code is permissive but `fullTemplateTypeCheck: true` means template errors are strict.
- **i18n**: The WAYF component has no i18n dependency — all UI text is hardcoded English. It is fully portable to any Angular host app.
- **Auth method decorator map**: `AUTH_METHOD_FOR_DECORATOR_MAP` in `log-in.methods-decorator.ts` is the single source of truth for which component renders for each `AuthMethodType`. Update both the map and the `AuthMethodTypeComponent` union type together.
