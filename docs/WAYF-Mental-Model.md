# 🧩 Feature Overview

**CLARIN WAYF** (Where Are You From) is an **identity provider picker** for Shibboleth-based federated login.

- Users see a searchable list of universities/institutions (fetched from a JSON feed)
- They pick one and get redirected to that institution's login page
- It replaces an external discovery page with an inline UI inside the DSpace login flow

---

# 🗺️ High-Level Architecture

| Part | Responsibility |
|------|---------------|
| **Orchestrator** (`ClarinWayfComponent`) | Loads IdP feed, wires search/pagination/selection, handles SAMLDS redirect protocol |
| **UI Kit** (4 sub-components) | Card, list, search bar, recent-IdP shortcut — pure presentation, no business logic |
| **Service Layer** (3 services) | Feed fetching, fuzzy search, localStorage persistence |
| **Integration Glue** (3 touch points) | Login page toggle, header dropdown tab, Shibboleth auth method button |

---

# 🔄 Main Flow (Step-by-step)

1. User opens login page → clicks **"Select your institution"** button
2. `ClarinWayfComponent` initializes → calls `WayfFeedService.loadFeed(feedUrl)`
3. Feed service fetches JSON via `fetch()`, normalizes raw entries → `IdentityProvider[]`
4. Entries stored in signal → template renders `WayfIdpListComponent`
5. User types in search bar → `searchQuery` signal updates → `filteredEntries` computed re-runs
6. `WayfSearchService.filterEntries()` scores each entry (exact > word-boundary > fuzzy bigram)
7. User clicks an IdP card → `idpSelected` event bubbles up to orchestrator
8. Orchestrator saves selection to `localStorage` (via `WayfPersistenceService`)
9. Component builds Shibboleth redirect URL with `entityID` query param
10. `window.location.href` → user lands at their institution's login page

---

# 📁 File Map (Simplified)

```
src/app/clarin-wayf/
├── Core Logic
│   ├── clarin-wayf.component.ts      ← Main orchestrator
│   ├── wayf.config.ts                ← Config interface + DI token
│   ├── wayf.module.ts                ← Module wrapper (forRoot)
│   └── models/idp-entry.model.ts     ← Data model + normalization
│
├── Services (all signal-based, no external deps)
│   ├── feed.service.ts               ← HTTP fetch + cache
│   ├── search.service.ts             ← Fuzzy search engine
│   └── persistence.service.ts        ← localStorage wrapper
│
├── UI Components (pure presentation)
│   ├── components/search-bar/        ← Text input with ARIA
│   ├── components/idp-list/          ← Keyboard-navigable list
│   ├── components/idp-card/          ← Single institution card
│   └── components/recent-idps/       ← "Continue with..." shortcut
│
└── Tests (9 spec files, 112 tests total)

Integration points (outside the module):
├── login-page.component.ts/html      ← Toggle button + collapsible panel
├── auth-nav-menu.component.ts/html   ← Tab-based switch in header dropdown
└── log-in-shibboleth-wayf.component  ← Auth method provider for Shibboleth backends
```

---

# ⚫ Black Box Summary

### ClarinWayfComponent
- **Inputs:** `feedUrl`, `spEntityId`, `loginEndpoint`, `serviceName`, `pinnedIdps`, `localAuthEnabled`, `helpText`, `enableSearch`, `maxResults`, `rememberSelection`
- **Outputs:** `idpSelected`, `localAuthSelected`, `cancelled`
- **Side effects:** Fetches feed URL on init, writes to `localStorage`, may redirect via `window.location.href`

### WayfFeedService
- **Input:** `feedUrl: string`, `locale: string` (defaults to `'en'`)
- **Output:** `entries` signal with `IdentityProvider[]`
- **Side effects:** HTTP `fetch()` call (credentials: omit)

### WayfSearchService
- **Input:** `entries: IdentityProvider[]`, `query: string`
- **Output:** Filtered + scored `IdentityProvider[]`
- **Side effects:** None (pure functions)
- **Algorithm:** Three-tier scoring — (1) exact substring → score 2, (2) word-level match → 1 + ratio, (3) Sørensen–Dice bigram fuzzy match → 0.4–1.0 threshold. Diacritics are stripped via NFD normalization. Title matches get a +0.5 bonus. This enables typo tolerance for international institution names (e.g. "univerzita" → "universita"). Zero external dependencies, 27 unit tests.

### WayfPersistenceService
- **Input:** `entityID: string` (on select)
- **Output:** `lastIdp` signal with last-used entityID
- **Side effects:** Reads/writes `localStorage` key `wayf:last-idp`

---

# � Architecture Review

| Area | Verdict | Rationale |
|------|---------|-----------|
| **Custom fuzzy search** | ✅ Keep | Sørensen–Dice bigram (~25 lines). Needed for international institution names with typos. Zero deps, 27 tests. |
| **Config resolution chain** | ✅ Keep | Standard Angular `resolve()` pattern (7 lines). Enables inputs, DI token, or defaults — required for portability. |
| **SAMLDS protocol handling** | ✅ Keep in component | This *is* the component's primary job. `parseSamldsParams()` + `sanitizeReturnUrl()` run once in `ngOnInit` — no reuse to justify a service. |
| **WayfModule.forRoot()** | ✅ Keep | 15-line ergonomic wrapper. Enforces required config at compile time. Standard pattern (NgRx, Angular Material). |
| **3 separate services** | ✅ Keep | Feed (HTTP), Search (pure logic), Persistence (localStorage) — each has a distinct I/O target. Enables independent mocking in tests. |

---

# ✂️ Potential Simplifications (Not Recommended)

| Suggestion | Risk | Why not |
|------------|------|---------|
| **Inline persistence** into main component | Low | Adds SSR boilerplate noise to orchestrator. Service isolates localStorage side effects. |
| **Drop Dice coefficient**, substring-only search | Medium | Loses typo tolerance for international names — the component's key differentiator. |
| **Move SAMLDS to a service** | Low | Would create a class with one method called once. No reuse benefit. |
| **Drop WayfModule** | Low | Consumers lose compile-time required-field enforcement and ergonomic setup. |
| **Merge feed + persistence** | Medium | Combines HTTP and localStorage concerns. Breaks independent testability. |

---

# 🧠 Mental Model Cheat Sheet

```
User clicks "Select institution"
  → ClarinWayfComponent opens
    → FeedService fetches IdP list from JSON URL
    → List renders in IdpListComponent (cards)
    → User types → SearchService filters (fuzzy match)
    → User clicks a card
      → Component builds Shibboleth redirect URL
        → Browser navigates to institution login
```

**Three places the WAYF appears:**
1. **Login page** — collapsible panel below the password form
2. **Header dropdown** — second tab ("Institution") in the auth menu
3. **Shibboleth auth method** — button in the log-in methods list (if backend has Shibboleth)

**Key config:** 3 required URLs (`feedUrl`, `spEntityId`, `loginEndpoint`) — everything else has defaults.

**Data flow:** `JSON feed → normalize → signal → computed (filter) → computed (paginate) → template`
