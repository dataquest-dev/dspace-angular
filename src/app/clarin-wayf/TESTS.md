# WAYF Unit Test Cases

**112 tests** across **9 spec files**. Run with:

```bash
npm test -- --include='src/app/clarin-wayf/**/*.spec.ts'
```

---

## ClarinWayfComponent (13 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should create | Verifies the root WAYF component bootstraps without errors when all required providers are injected. |
| 2 | should call loadFeed on init | Ensures `ngOnInit` triggers `WayfFeedService.loadFeed()` exactly once so IdPs are fetched on page load. |
| **Security: sanitizeReturnUrl()** | |
| 3 | should accept https URLs | Confirms that a valid `https://` return URL passes sanitization and is kept as-is. |
| 4 | should accept http URLs | Confirms that a valid `http://` return URL is accepted (needed for local dev environments). |
| 5 | should reject javascript: URLs | Guards against XSS — a `javascript:alert(1)` return URL must be stripped to `null`. |
| 6 | should reject data: URLs | Guards against XSS — a `data:text/html,...` return URL must be stripped to `null`. |
| 7 | should reject malformed URLs | Non-parseable strings like `"not a url"` are rejected so they cannot be injected into redirects. |
| 8 | should handle null input | A `null` return param (absent query string) must not throw and should return `null`. |
| 9 | should handle empty string | An empty string return param must not throw and should return `null`. |
| **Security: feedUrl validation** | |
| 10 | should NOT fetch javascript: feedUrl | If a malicious `feedUrl` config is set to `javascript:...`, the component must refuse to call `fetch()`. |
| **SAMLDS params** | |
| 11 | should parse entityID from query params | Reads `entityID` and `return` from the URL query string to support the SAMLDS protocol auto-select flow. |
| 12 | should reject non-HTTPS return URLs in SAMLDS | When SAMLDS provides a `javascript:` return URL, it must be sanitized to `null` before any redirect. |
| **Config & events** | |
| 13 | should resolve serviceName from WAYF_CONFIG | Verifies the 3-level config resolution chain: explicit input → `WAYF_CONFIG` token → built-in default. |

---

## WayfFeedService (14 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should be created | Verifies the service instantiates via DI without errors. |
| 2 | should start with empty entries | The `entries` signal must be `[]` before any feed is loaded, preventing undefined access in templates. |
| 3 | should start with loading = false | The `loading` signal defaults to `false` so no spinner is shown on initial render. |
| 4 | should start with error = null | The `error` signal defaults to `null` so no error banner appears before a fetch attempt. |
| **loadFeed()** | |
| 5 | should parse a standard DiscoFeed response | A JSON array of DiscoFeed objects (with `DisplayNames`, `Logos`, etc.) is normalized into `IdentityProvider[]`. |
| 6 | should parse a flat IdentityProvider response | A pre-normalized JSON array (already has `title`, `entityID`) passes through without transformation. |
| 7 | should set error on HTTP failure | An HTTP 500 response sets the `error` signal so the UI can display a user-facing error message. |
| 8 | should set error on network failure | A network-level failure (e.g. DNS error, timeout) sets the `error` signal instead of throwing. |
| 9 | should handle non-array JSON gracefully | If the endpoint returns a JSON object instead of an array, entries stay empty and no error is thrown. |
| 10 | should handle HTTP 204 (no content) | A 204 response (backend not ready) results in empty entries without triggering an error state. |
| 11 | should set loading to true during fetch | The `loading` signal is `true` while the fetch is in-flight, enabling a spinner in the template. |
| 12 | should call fetch with credentials: omit | Cookies are excluded from the fetch request to avoid CORS issues with third-party DiscoFeed endpoints. |
| 13 | should deduplicate entries with same entityID | If the feed contains the same IdP twice (same `entityID`), only the first occurrence is kept. |
| **SSR** | |
| 14 | should skip fetch on server platform | On the server (`PLATFORM_ID === 'server'`), `fetch()` is never called because there is no browser context. |

---

## WayfSearchService (27 tests)

| # | Test | Description |
|---|------|-------------|
| **normalize()** | |
| 1 | should lowercase text | Input `"HELLO"` becomes `"hello"` — all comparisons are case-insensitive. |
| 2 | should strip diacritics | Czech `"Příkladová"` normalizes to `"prikladova"` via Unicode NFD decomposition + accent removal. |
| 3 | should strip accented characters | French `"café"` normalizes to `"cafe"` — important for international institution names. |
| 4 | should handle German umlauts | `"München"` normalizes to `"munchen"` so German users can search without typing umlauts. |
| 5 | should collapse multiple spaces | Multiple whitespace characters are collapsed to a single space to prevent matching gaps. |
| 6 | should handle empty string | An empty input returns `""` without errors — guards against uninitialized query values. |
| **extractDomain()** | |
| 7 | should extract hostname words | Parses a URL like `https://idp.muni.cz/shibboleth` into `"idp muni cz"` for domain-based matching. |
| 8 | should return empty for invalid URL | A malformed URL returns `""` instead of throwing, so scoring continues gracefully. |
| **resolveDisplayName()** | |
| 9 | should return title field | The `title` property is returned directly as the display name shown in the card. |
| 10 | should return the title as-is for non-English text | A Czech title like `"Masarykova univerzita"` is preserved verbatim — no locale transformation occurs. |
| 11 | should return entityID as fallback | When `title` equals the `entityID` (no friendly name available), the raw entityID is shown. |
| **diceCoefficient()** | |
| 12 | should return 1 for identical strings | Two identical strings yield a Sørensen–Dice coefficient of exactly 1.0 (perfect match). |
| 13 | should return 0 for completely different strings | Two strings with zero shared bigrams yield 0.0, so unrelated IdPs are excluded from results. |
| 14 | should return 0–1 for similar strings | Partially overlapping strings yield a score between 0 and 1, enabling ranked fuzzy results. |
| 15 | should return 1 for two empty strings | Edge case: two empty strings share all (zero) bigrams equally, returning 1.0 by convention. |
| 16 | should handle single character strings | Single-char inputs produce no bigrams — verifies no division-by-zero or crash occurs. |
| 17 | should score "masarky" vs "masaryk" highly | A common user typo (transposed letters) still scores ≥ 0.6, proving typo tolerance works. |
| **scoreEntry()** | |
| 18 | should return 1 for empty query | An empty search query assigns score 1 to every entry so all IdPs are shown by default. |
| 19 | should return 2 for exact substring | An exact substring match in the title gets the highest score (2), placing it at the top of results. |
| 20 | should return 2 for diacritics-normalized match | Searching `"masarykova"` matches the NFD-normalized title, proving diacritics-insensitive search works. |
| 21 | should match by entityID domain | Searching `"muni.cz"` matches an IdP whose entityID URL contains that domain fragment. |
| 22 | should match by keyword | Searching `"brno"` matches an IdP that has `"brno"` in its keywords array, not its title. |
| 23 | should return 0 for unrelated query | A completely unrelated search term like `"xyznonexistent"` scores 0, filtering the IdP out. |
| 24 | should score fuzzy typo above 0 | Searching `"masarky"` (typo) still produces a positive score via Dice coefficient fuzzy matching. |
| **filterEntries()** | |
| 25 | should return all for empty query | With no search input, every IdP is included in the result list unfiltered. |
| 26 | should filter to matching entries only | Searching `"Masaryk"` reduces the list to only IdPs whose title/domain/keywords match. |
| 27 | should rank exact matches higher | Searching `"charles"` returns Charles University before other partial matches, verifying sort order. |

---

## WayfPersistenceService (8 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should be created | Verifies the service instantiates via DI without errors. |
| 2 | should start with null lastIdp | Before any user selection, the `lastIdp` signal is `null` (no prior localStorage entry). |
| **selectIdp()** | |
| 3 | should update the lastIdp signal | Calling `selectIdp(entityID)` immediately updates the reactive `lastIdp` signal with the new value. |
| 4 | should persist to localStorage | The selected entityID is written to `localStorage` under the `wayf:last-idp` key for cross-session recall. |
| 5 | should overwrite previous selection | A second `selectIdp()` call overwrites the first — only the most recent IdP is remembered. |
| **Init from storage** | |
| 6 | should read existing value on creation | If `wayf:last-idp` already exists in localStorage (from a prior session), the service loads it on construction. |
| **SSR** | |
| 7 | should return null on server platform | On the server, `localStorage` is unavailable — the service returns `null` instead of crashing. |
| 8 | should not throw on selectIdp() in SSR | Calling `selectIdp()` on the server updates the signal but skips the `localStorage` write silently. |

---

## WayfIdpCardComponent (10 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should create | Verifies the card component renders without errors when given a minimal `IdentityProvider` input. |
| 2 | should display the IdP title | The institution name appears inside the `.wayf-idp-card__name` element for user identification. |
| 3 | should display the entityID | The entityID is shown as secondary text beneath the title for disambiguation of similarly-named IdPs. |
| 4 | should show logo when logoUrl provided | When the IdP has a logo URL, an `<img>` element is rendered with that URL as its `src`. |
| 5 | should show placeholder when no logoUrl | When no logo is available, a Font Awesome university icon is shown as a visual placeholder. |
| 6 | should show placeholder on logo load error | If the logo image fails to load (broken URL), the component falls back to the placeholder icon. |
| 7 | should emit selected on click | Clicking the card emits a `selected` output event carrying the full `IdentityProvider` object. |
| 8 | should show hub badge when isHub=true | A `.badge` element appears when the IdP is marked as a federation hub (e.g. eduGAIN). |
| 9 | should not show badge when isHub=false | No `.badge` element is rendered for regular IdPs, keeping the card clean. |
| 10 | should apply active class when isActive=true | The `.wayf-idp-card--active` CSS class is applied when the card is highlighted via keyboard navigation. |

---

## WayfIdpListComponent (11 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should create | Verifies the list component renders without errors when given an empty entries array. |
| 2 | should render one card per entry | Three input entries produce exactly three `<ds-wayf-idp-card>` child components in the DOM. |
| 3 | should show "no results" when empty | An empty entries array renders a "no results" message instead of a blank space. |
| **Keyboard navigation** | |
| 4 | ArrowDown moves activeIndex down | Pressing ↓ advances the highlight from no selection (-1) to the first card (0). |
| 5 | ArrowDown stops at last entry | Pressing ↓ at the last card does not wrap around — it stays on the final entry. |
| 6 | ArrowUp moves activeIndex up | Pressing ↑ moves the highlight from index 2 to index 1. |
| 7 | ArrowUp at index 0 emits focusSearch | Pressing ↑ when the first card is active returns focus to the search bar via the `focusSearch` event. |
| 8 | Enter emits idpSelected for active item | Pressing Enter on a highlighted card emits `idpSelected` with the corresponding `IdentityProvider`. |
| 9 | Enter does nothing when no item active | Pressing Enter when `activeIndex` is -1 does not emit any event — prevents accidental selections. |
| 10 | Escape emits focusSearch | Pressing Escape returns focus to the search bar, providing a keyboard escape route from the list. |
| **resetActive()** | |
| 11 | should reset activeIndex to -1 | Calling `resetActive()` clears the keyboard highlight, used when the search query changes. |

---

## WayfSearchBarComponent (7 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should create | Verifies the search bar component renders without errors. |
| 2 | should render input[type="search"] | An `<input type="search">` element exists in the DOM so browsers show native search affordances. |
| 3 | should have accessible label | A `<label for="wayf-search-input">` element is present, ensuring screen readers announce the field. |
| 4 | should emit queryChange on input | Each keystroke emits a `queryChange` event with the current input value for live filtering. |
| 5 | should have role="combobox" | The input has `role="combobox"` per the ARIA combobox pattern for search-with-listbox UIs. |
| 6 | should set aria-expanded from hasResults | The `aria-expanded` attribute reflects whether results are visible, announcing state to screen readers. |
| 7 | focusInput() should focus the input | Calling the public `focusInput()` method programmatically focuses the input (used by keyboard nav). |

---

## WayfRecentIdpsComponent (10 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | should create | Verifies the recent-IdPs shortcut component renders without errors. |
| 2 | should render nothing without defaults | When neither `defaultEntityId` nor `lastIdpEntityId` is set, no shortcut card is rendered. |
| **With defaultEntityId** | |
| 3 | should show default IdP as shortcut | A statically configured default IdP appears as a one-click shortcut above the search results. |
| 4 | should display "Default institution" label | The shortcut card label reads "Default institution" to distinguish it from a last-used suggestion. |
| 5 | should display the IdP name | The resolved display name of the default IdP is shown on the shortcut card. |
| **With lastIdpEntityId** | |
| 6 | should show last-used IdP as shortcut | The IdP last selected by the user (from localStorage) appears as a quick-access shortcut. |
| 7 | should display "Continue with" label | The shortcut card label reads "Continue with" to indicate it is based on the user's prior choice. |
| **Priority** | |
| 8 | should prefer default over last-used | When both default and last-used IdP are set, only the static default is shown (admin intent wins). |
| **Unknown IDs** | |
| 9 | should render nothing for unknown default | If the `defaultEntityId` does not match any entry in the feed, no shortcut card is rendered. |
| 10 | should emit idpSelected on click | Clicking the shortcut card emits `idpSelected` with the matched `IdentityProvider` entry. |

---

## idp-entry.model (12 tests)

| # | Test | Description |
|---|------|-------------|
| **resolveLocalized()** | |
| 1 | should return exact lang match | Given a `{lang:'cs', value:'...'}` array, requesting `'cs'` returns the Czech value directly. |
| 2 | should fall back to en | When the requested locale is unavailable, the `'en'` entry is returned as a universal fallback. |
| 3 | should fall back to first entry | When neither the requested locale nor `'en'` exists, the first array element is used. |
| 4 | should return fallback for undefined array | A `undefined` localized array returns the provided fallback string instead of crashing. |
| 5 | should return fallback for empty array | An empty `[]` localized array returns the provided fallback string. |
| 6 | should return empty string as default | When no explicit fallback is given, `""` is returned — prevents `undefined` in templates. |
| **normalizeDiscoFeedEntry()** | |
| 7 | should normalize a DiscoFeed entry | Transforms a full DiscoFeed JSON object (DisplayNames, Logos, entityID) into the flat `IdentityProvider` model. |
| 8 | should use entityID as title fallback | When `DisplayNames` is missing or empty, the raw `entityID` URL becomes the display title. |
| 9 | should prefer small logos (height ≤ 60) | When multiple logos are available, the one with `height ≤ 60` is chosen for consistent card sizing. |
| **normalizeEntry()** | |
| 10 | should detect DiscoFeed entries | An object containing `DisplayNames` is routed through `normalizeDiscoFeedEntry()` for transformation. |
| 11 | should pass through flat entries | An already-normalized object (has `title`, `entityID`) passes through without modification. |
| 12 | should use entityID as fallback for flat | A flat entry missing `title` gets its `entityID` copied into the `title` field as a fallback. |
