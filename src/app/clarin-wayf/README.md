# WAYF Component Documentation

**CLARIN WAYF** is a standalone, portable identity provider picker (Where Are You From) component for Shibboleth federated login. This documentation covers all aspects of the component when used as an importable package/library.

---

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| **[MENTAL-MODEL.md](./MENTAL-MODEL.md)** | Architecture overview, data flow, component responsibilities, design decisions | Engineers, architects, contributors |
| **[CONFIG-GUIDE.md](./CONFIG-GUIDE.md)** | How to configure and deploy the component in your DSpace instance | System admins, developers |
| **[AGENTS.md](./AGENTS.md)** | Component state, architecture guidelines, and integration patterns | Developers extending the component |
| **[TESTS.md](./TESTS.md)** | Complete test case reference (112 tests across 9 spec files) | QA, test maintenance, contributors |

---

## 🎯 Quick Navigation

### I want to...

- **Deploy WAYF in my DSpace client** → Start with [CONFIG-GUIDE.md](./CONFIG-GUIDE.md)
- **Understand how WAYF works** → Read [MENTAL-MODEL.md](./MENTAL-MODEL.md)
- **View all tests & coverage** → See [TESTS.md](./TESTS.md)
- **Extend or modify WAYF** → Check [AGENTS.md](./AGENTS.md) and [MENTAL-MODEL.md](./MENTAL-MODEL.md)
- **Debug a test failure** → Look up the test in [TESTS.md](./TESTS.md) for context

---

## 📦 Component Structure

```
src/app/clarin-wayf/
├── Documentation
│   ├── README.md                    ← You are here
│   ├── MENTAL-MODEL.md             ← Architecture & design
│   ├── CONFIG-GUIDE.md             ← Deployment & setup
│   ├── AGENTS.md                   ← Developer guidelines
│   └── TESTS.md                    ← Test reference
│
├── Core Component
│   ├── clarin-wayf.component.ts    ← Main orchestrator
│   ├── wayf.config.ts              ← Config interface + DI token
│   ├── wayf.module.ts              ← Module wrapper (forRoot)
│   └── clarin-wayf-routes.ts       ← Route config with title
│
├── Services (signal-based, zero external dependencies)
│   ├── feed.service.ts             ← HTTP fetch + DiscoFeed normalize
│   ├── search.service.ts           ← Fuzzy search engine (Sørensen–Dice)
│   └── persistence.service.ts      ← localStorage wrapper (SSR-safe)
│
├── Models & Types
│   └── idp-entry.model.ts          ← IdentityProvider + normalization logic
│
├── UI Components (pure, no business logic)
│   ├── components/search-bar/      ← Input with ARIA combobox pattern
│   ├── components/idp-list/        ← Keyboard-navigable result list
│   ├── components/idp-card/        ← Single institution card + logo
│   └── components/recent-idps/     ← "Default" / "Continue with" shortcut
│
└── Tests (9 spec files, 112 tests)
    ├── *.spec.ts files             ← Unit test suites
    └── /fixtures                   ← Test data (mock feeds, entities)
```

---

## 🚀 Key Features

| Feature | Details |
|---------|---------|
| **Fuzzy Search** | Sørensen–Dice bigram matching for typo tolerance. Diacritics-insensitive via NFD normalization. ~25 line implementation. |
| **SAMLDS Protocol** | Auto-redirect flow: `entityID` + `return` query params → sign in at IdP → redirect back with session. |
| **LastIdP Memory** | Persists user's last institution to localStorage for quick re-login. |
| **Keyboard Navigation** | Full keyboard control: Arrow keys, Enter, Escape. Screen reader compatible. |
| **SSR Safe** | All side effects (fetch, localStorage, navigation) guarded by platform checks. |
| **Explicit Peer Deps** | Library declares Angular, RxJS, Bootstrap, and Font Awesome peer dependencies for predictable host integration. |
| **Portable** | Single config token (`WAYF_CONFIG`). Can be used in 3+ ways: routes, config.yml bridge, app config. |

---

## 📦 Package Peer Dependencies

The extractable package manifest is in `src/app/clarin-wayf/package.json`.

Required peer dependencies:

- `@angular/core` `^20.0.0`
- `@angular/common` `^20.0.0`
- `@angular/router` `^20.0.0`
- `rxjs` `^7.8.0`
- `bootstrap` `^5.3.0`
- `@fortawesome/fontawesome-free` `^6.7.0`

### Consumer setup (mandatory)

In the consuming app, ensure both CSS files are loaded globally:

```json
{
    "styles": [
        "node_modules/bootstrap/dist/css/bootstrap.min.css",
        "node_modules/@fortawesome/fontawesome-free/css/all.min.css"
    ]
}
```

If these packages are installed but the styles are not imported, visual appearance may degrade.

---

## 🧪 Test Coverage

- **Total:** 112 tests across 9 spec files
- **Components:** 40 tests (4 UI components + 1 orchestrator)
- **Services:** 49 tests (3 services)
- **Models:** 12 tests (data normalization + utilities)
- **Security:** 11 dedicated XSS/open-redirect prevention tests
- **SSR:** 4 dedicated platform-safe tests

Run tests:
```bash
npm test -- --include='src/app/clarin-wayf/**/*.spec.ts'
```

---

## 🔌 Integration Points

The component can be used in three contexts:

| Context | Example | Config |
|---------|---------|--------|
| **Full Page** | `/wayf` route | Route-level `providers` |
| **Login Page** | Tab below password form | App-level provider or input binding |
| **Header Dropdown** | "Institution" tab in auth menu | App-level provider or input binding |

Each integration point can have independent config if needed (see [CONFIG-GUIDE.md](./CONFIG-GUIDE.md)).

---

## 🛠️ Development Workflow

### Run tests while developing
```bash
npm test -- --include='src/app/clarin-wayf/**/*.spec.ts' --watch
```

### Build the component as a library
(When WAYF becomes a publishable package)
```bash
ng build clarin-wayf --configuration production
```

### Add a new test
1. Create `file.spec.ts` in the component's folder
2. Match it against an existing suite for patterns
3. Run the full test suite to verify

### Modify search algorithm
1. Edit `search.service.ts` and the scoring logic
2. Add/update tests in `search.service.spec.ts`
3. Verify the fuzzy match tests still pass (test #17, #24)

---

## 📖 For DSpace Admins

If you're deploying this in your DSpace instance:

1. **First read:** [CONFIG-GUIDE.md](./CONFIG-GUIDE.md) — pick your configuration method
2. **Get your feed URL:** Ask your federation operator (e.g., CLARIN, eduGAIN) for the DiscoFeed endpoint
3. **Set default IdP:** (Optional) Find your institution's `entityID` in the feed
4. **Test:** Navigate to `/wayf` or the login page and verify the UI appears

For troubleshooting, check the browser console and [MENTAL-MODEL.md](./MENTAL-MODEL.md) to understand the flow.

---

## 🤝 For Contributors

If you're extending or maintaining this component:

1. **Understand the architecture:** [MENTAL-MODEL.md](./MENTAL-MODEL.md)
2. **Check what's been tested:** [TESTS.md](./TESTS.md)
3. **Follow the guidelines:** [AGENTS.md](./AGENTS.md)
4. **Run the full test suite before committing:** Ensure all 112 tests pass

All architectural decisions are documented in [MENTAL-MODEL.md](./MENTAL-MODEL.md) under "Architecture Review" — justify any changes against those rationales.

---

## 📝 Documentation Maintenance

- **MENTAL-MODEL.md:** Update whenever you change architecture or add a new service
- **CONFIG-GUIDE.md:** Update when you add new config options or integration points
- **AGENTS.md:** Update when you change component APIs or add new features
- **TESTS.md:** Auto-generated from spec files; update test descriptions when clarifying intent

---

## 🔗 External References

- **CLARIN AAI:** https://www.clarin.eu/
- **Shibboleth SP:** https://www.shibboleth.net/
- **DiscoFeed Format:** Referenced in CONFIG-GUIDE.md
- **Angular Signals:** https://angular.io/guide/signals

---

## 📄 License & Attribution

This component is part of the DSpace project.

---

**Last Updated:** April 2026  
**Status:** Production-ready  
**Maintainer:** CLARIN WAYF Team
