# How to Configure the WAYF Component — DSpace Client Guide

A step-by-step tutorial for someone who just wants to deploy this.

---

## What "static configuration" means

When we say **static**, we mean: config set once by a DSpace admin/developer,
not something the end-user changes. For example:

- "Always use **our** institution's IdP feed URL"
- "Always pre-select **Charles University** as the default"
- "Only show IdPs tagged **clarin**"

These values live in code/config files, not in the browser.

---

## Overview: 3 places you can set it

```
┌──────────────────────────────────────────────────────────────────┐
│  OPTION 1  config.yml  (for DSpace system admins)                │
│            The YAML file you already edit for REST URL, port etc.│
│            ──────────────────────────────────────────────────── │
│  OPTION 2  clarin-wayf-routes.ts  (simplest for developers)      │
│            Add providers: [ WAYF_CONFIG ] right on the route.    │
│            ──────────────────────────────────────────────────── │
│  OPTION 3  browser-app.config.ts  (app-wide, every instance)     │
│            Put it in the root providers so all WAYF instances     │
│            across the whole app share the same config.           │
└──────────────────────────────────────────────────────────────────┘
```

Pick the option that matches your role. Most DSpace client teams will use
**Option 2** (it's self-contained) or **Option 1** (if they already have a
config.yml workflow).

---

## Option 1 — config.yml + bridge provider

This is the "DSpace-native" approach: add fields to the YAML file, then
write a one-time bridge that reads them into `WAYF_CONFIG`.

### Step 1 — Add fields to `config/config.yml`

Open `config/config.yml` (the file you already edit for your server URL):

```yaml
# existing fields (already there)
rest:
  ssl: true
  host: your-dspace-api.example.org
  port: 443
  nameSpace: /server

# ADD THIS SECTION at the bottom
wayf:
  feedUrl: 'https://ds.aai.cz/clarin-prod/DiscoFeed'
  defaultEntityId: 'https://idp.your-university.org/shibboleth'
  categoryFilter: 'clarin'
  lang: 'cs'
```

### Step 2 — Extend AppConfig to include the new section

Open `src/config/app-config.interface.ts`. Add a `wayf?` optional field:

```typescript
// Somewhere near the top, define the shape
export interface WayfAppConfig {
  feedUrl?: string;
  defaultEntityId?: string;
  categoryFilter?: string;
  lang?: string;
}

// Inside the AppConfig interface, add:
interface AppConfig extends Config {
  ui: UIServerConfig;
  rest: ServerConfig;
  // ... existing fields ...
  wayf?: WayfAppConfig;   // ← ADD THIS
}
```

### Step 3 — Add the bridge provider in `src/app/app.config.ts`

This is the bridge: it reads DSpace's `APP_CONFIG` and converts the `wayf`
section into our `WAYF_CONFIG` token.

```typescript
// At the top of app.config.ts, add these imports:
import { APP_CONFIG, AppConfig } from '../config/app-config.interface';
import { WAYF_CONFIG } from './clarin-wayf/models/wayf-config.model';

// Inside commonAppConfig.providers, add:
export const commonAppConfig: ApplicationConfig = {
  providers: [
    // ... existing providers ...

    // WAYF bridge: reads config.yml's wayf section → WAYF_CONFIG token
    {
      provide: WAYF_CONFIG,
      useFactory: (appConfig: AppConfig) => ({
        feedUrl:         appConfig.wayf?.feedUrl         ?? '',
        defaultEntityId: appConfig.wayf?.defaultEntityId ?? '',
        categoryFilter:  appConfig.wayf?.categoryFilter  ?? null,
        lang:            appConfig.wayf?.lang            ?? '',
      }),
      deps: [APP_CONFIG],
    },
  ],
};
```

### What each field does in config.yml

| Field             | Type           | Effect                                                           |
|-------------------|----------------|------------------------------------------------------------------|
| `feedUrl`         | string (URL)   | The JSON DiscoFeed to download IdPs from                         |
| `defaultEntityId` | string (URI)   | Pre-shows this IdP in the shortcut button above the search bar   |
| `categoryFilter`  | string or null | Only show IdPs that have this tag. Omit to show all              |
| `lang`            | `en`/`cs`/`de` | Language for button labels ("Continue with", "Default institution") |

---

## Option 2 — Edit the route file directly (simplest)

This is the fastest approach. No YAML changes needed. Edit the WAYF route
definition and add `providers` right there.

### File to edit: `src/app/clarin-wayf/clarin-wayf-routes.ts`

**Before** (current state):

```typescript
import { Route } from '@angular/router';
import { ClarinWayfComponent } from './clarin-wayf.component';
import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';

export const ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ClarinWayfComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'wayf', title: 'Select Your Institution' },
  },
];
```

**After** — add `providers`:

```typescript
import { Route } from '@angular/router';
import { ClarinWayfComponent } from './clarin-wayf.component';
import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { WAYF_CONFIG } from './models/wayf-config.model';   // ← ADD

export const ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ClarinWayfComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'wayf', title: 'Select Your Institution' },
    providers: [                                              // ← ADD
      {
        provide: WAYF_CONFIG,
        useValue: {
          feedUrl: 'https://ds.aai.cz/clarin-prod/DiscoFeed',
          defaultEntityId: 'https://idp.your-university.org/shibboleth',
          categoryFilter: 'clarin',
          lang: 'cs',
        },
      },
    ],
  },
];
```

That's it. Two imports, one `providers` block. The WAYF component at `/wayf`
will automatically read these values.

> **Scope note:** This config only applies to the `/wayf` full-page route.
> The WAYF component shown inside the login page or header dropdown will
> NOT pick this up — they use their own injection context.

---

## Option 3 — App-wide in `browser-app.config.ts`

Use this if you want every WAYF instance (full page + login overlay + header)
to share the same config.

### File to edit: `src/modules/app/browser-app.config.ts`

Add the import and the provider block:

```typescript
// Add this import near the top (with other clarin-wayf imports):
import { WAYF_CONFIG } from '../../app/clarin-wayf/models/wayf-config.model';

// Inside browserAppConfig.providers, add:
export const browserAppConfig: ApplicationConfig = mergeApplicationConfig({
  providers: [
    // ... existing providers stay untouched ...

    {
      provide: WAYF_CONFIG,
      useValue: {
        feedUrl: 'https://ds.aai.cz/clarin-prod/DiscoFeed',
        defaultEntityId: 'https://idp.your-university.org/shibboleth',
        categoryFilter: 'clarin',
        lang: 'cs',
      },
    },
  ],
}, commonAppConfig);
```

> **Scope note:** This affects EVERY `<ds-clarin-wayf>` in the entire app,
> including the login page dropdown and any future instances.

---

## What "defaultEntityId" actually looks like in the UI

When the WAYF component loads and the feed resolves the entity:

```
┌──────────────────────────────────────────────────────┐
│  Select your institution                             │
│                                                      │
│  ╔════════════════════════════════════════════════╗  │
│  ║  →  Default institution                       ║  │
│  ║     Charles University                        ║  │
│  ╚════════════════════════════════════════════════╝  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Search for your institution...              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Charles University                          │   │
│  │  Czech Technical University                  │   │
│  │  Masaryk University                          │   │
│  │  ...                                         │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

If you do NOT set `defaultEntityId` but the user has previously logged in,
they see "Continue with [their last IdP]" instead.

If neither is set → the shortcut card is hidden entirely.

---

## How to find your institution's entityID

The `entityID` is a URI that uniquely identifies your institution's Identity
Provider. It's NOT a URL you visit — it's just a unique string identifier that
looks like a URL.

### Method 1 — Browse the DiscoFeed directly

Open the feed URL in your browser:

```
https://ds.aai.cz/clarin-prod/DiscoFeed
```

Search (`Ctrl+F`) for your institution's name. The `entityID` field is right
next to it:

```json
{
  "entityID": "https://idp.your-university.org/shibboleth",
  "DisplayNames": [
    { "value": "Your University", "lang": "en" }
  ]
}
```

### Method 2 — Ask your Shibboleth admin

The entityID is in your institution's Shibboleth IdP metadata file:

```xml
<EntityDescriptor entityID="https://idp.your-university.org/shibboleth">
```

---

## Quick decision table: which option to pick?

| Situation                                            | Use option |
|------------------------------------------------------|-----------|
| You already manage `config.yml` and want one file    | 1         |
| You want zero YAML changes, just edit TypeScript      | 2         |
| You want every WAYF instance in the app configured   | 3         |
| You want different config for `/wayf` vs login page  | 2 + 3     |
| You're building a Docker image and inject env vars   | 1 (YAML supports env var overrides) |

---

## Minimal working example (copy-paste ready)

If you just want to try it right now with the least effort, add this to
`src/app/clarin-wayf/clarin-wayf-routes.ts`:

```typescript
import { WAYF_CONFIG } from './models/wayf-config.model';

// Inside the route object, add:
providers: [
  {
    provide: WAYF_CONFIG,
    useValue: {
      feedUrl: 'assets/mock/wayf-feed.json',   // uses the built-in test data
      defaultEntityId: 'https://idp.example.edu/entity',
    },
  },
],
```

Navigate to `http://localhost:4000/wayf`. The shortcut button will show
"Default institution — [name of that IdP]".
