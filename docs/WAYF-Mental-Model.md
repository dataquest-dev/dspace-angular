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

# 🚨 Overengineered / Suspicious Code

| Area | Concern |
|------|---------|
| **Custom fuzzy search** | Sørensen–Dice bigram implementation (~25 lines for the core algorithm). Justified for international academic federations where users mistype foreign institution names. Zero external deps, 27 tests. |
| **Config resolution chain** | 3-level fallback (`input → WAYF_CONFIG → WAYF_DEFAULTS`) via a 7-line `resolve()` helper. Standard Angular pattern for reusable components — enables host apps to configure via inputs, DI token, or rely on defaults. Necessary for portability across different environments. |
| **SAMLDS protocol handling** | `parseSamldsParams()` + `sanitizeReturnUrl()` + `isPassive` auto-redirect implement a full SAMLDS client. This complexity lives in the UI component rather than a service. |
| **WayfModule.forRoot()** | The module wrapper exists for ergonomic DI setup, but the component is standalone. The module is a thin shell — could be replaced by direct `provide` calls. |
| **3 separate services** | Feed, Search, Persistence — each is small (~40-60 lines). Could arguably be 2 services (DataService = feed+persistence, SearchService stays). |

---

# ✂️ Simplification Suggestions

| Suggestion | Risk | Impact |
|------------|------|--------|
| **Inline persistence into main component** | Low | Removes a file + 8 tests. The service is just 3 `localStorage` calls. |
| **Simplify search** to substring-only, drop Dice coefficient | Medium | Removes ~40 lines + some tests. Loses typo tolerance (e.g. "Univerzita" → "Universita"). |
| **Move SAMLDS logic to a utility function** | Low | Main component becomes cleaner. Pure function is easier to test. |
| **Drop WayfModule**, just export the component | Low | Consumers use `imports: [ClarinWayfComponent]` + `providers: [...]` directly. |
| **Merge feed.service into main component** | Medium | It's only called once. But separating it does help testability. |

> **Safe bet:** Inline persistence + drop the module wrapper. Everything else adds real value.

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
