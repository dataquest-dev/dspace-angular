import { InjectionToken } from '@angular/core';
import { IdentityProvider } from './models/idp-entry.model';

// ── Interface ──────────────────────────────────────────────────

/**
 * Configuration for the WAYF (Where Are You From) component.
 *
 * `feedUrl` is the only field required by the standalone widget itself.
 * Host applications may also supply integration fields such as
 * `loginEndpoint` when they build the surrounding sign-in redirect flow.
 * All other widget fields have sensible defaults that can be overridden
 * per-instance via component inputs or via the token.
 *
 * Resolution priority for each field:
 *   1. Component `@Input()` binding  (e.g. `[feedUrl]="…"`)
 *   2. Injected `WAYF_CONFIG` token value
 *   3. Built-in default from `WAYF_DEFAULTS`
 */
export interface WayfConfig {
  // ── Required by the standalone widget ────────────────────────

  /** URL of the JSON IdP feed (Shibboleth DiscoFeed or IdentityProvider[]). */
  feedUrl: string;

  // ── Host integration fields (used outside the core widget) ──

  /** SAML entityID of the Service Provider. */
  spEntityId: string;

  /** Shibboleth SP login endpoint for redirect after IdP selection. */
  loginEndpoint: string;

  // ── Optional widget fields (have defaults in WAYF_DEFAULTS) ──

  /** Branding title shown in the overlay header. */
  serviceName: string;

  /** Always-visible priority IdP entries. */
  pinnedIdps: IdentityProvider[];

  /** Show a "Local authentication" fallback button. */
  localAuthEnabled: boolean;

  /** Guidance text for "Can't find my provider". */
  helpText: string;

  /**
   * Custom redirect builder.
   * Given the selected IdP and a return URL, returns the full redirect URL.
   * `null` → standard Shibboleth redirect.
   */
  redirectStrategy: ((idp: IdentityProvider, returnUrl: string) => string) | null;

  /** ISO 3166-1 alpha-2 default country code (e.g. `"CZ"`). */
  defaultCountry: string;

  /** Enable browser geolocation for sorting by proximity. */
  enableGeolocation: boolean;

  /** Enable the search bar. */
  enableSearch: boolean;

  /** Maximum number of results shown in the list. */
  maxResults: number;

  /** Remember the last-used IdP in localStorage. */
  rememberSelection: boolean;

  /** URL of a country-detection API.  `null` disables auto-detection. */
  countryApiUrl: string | null;

  /** Show country flags next to IdP names. */
  showFlags: boolean;
}

// ── Defaults (optional fields only — zero deployment values) ───

/**
 * Defaults for optional fields.
 * Contains **no URLs, entityIDs, or deployment-specific values**.
 */
export const WAYF_DEFAULTS: Omit<WayfConfig, 'feedUrl' | 'spEntityId' | 'loginEndpoint'> = {
  serviceName: '',
  pinnedIdps: [],
  localAuthEnabled: false,
  helpText: '',
  redirectStrategy: null,
  defaultCountry: '',
  enableGeolocation: true,
  enableSearch: true,
  maxResults: 25,
  rememberSelection: true,
  countryApiUrl: null,
  showFlags: true,
};

// ── Injection token ────────────────────────────────────────────

/**
 * Injection token for WAYF configuration.
 *
 * Provide via `WayfModule.forRoot(config)` or manually:
 *
 * ```ts
 * providers: [{ provide: WAYF_CONFIG, useValue: myConfig }]
 * ```
 *
 * Defaults to an empty object so the standalone component can still be used
 * with direct inputs only.
 */
export const WAYF_CONFIG = new InjectionToken<Partial<WayfConfig>>('WAYF_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

// ── SAMLDS params ──────────────────────────────────────────────

/**
 * SAMLDS protocol parameters extracted from the URL query string.
 * See: https://wiki.oasis-open.org/security/IdpDiscoSvcProto
 */
export interface SamldsParams {
  /** The entityID of the requesting Service Provider. */
  entityID: string | null;
  /** The URL to redirect to after IdP selection. */
  return: string | null;
  /** Query parameter name to append the selected entityID (default: `"entityID"`). */
  returnIDParam: string;
  /** If true, component should attempt silent re-auth without user interaction. */
  isPassive: boolean;
}
