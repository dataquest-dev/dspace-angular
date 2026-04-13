import { InjectionToken } from '@angular/core';

/**
 * Runtime configuration for the WAYF component.
 * Can be provided via the WAYF_CONFIG injection token from any host app,
 * or overridden per-instance via component inputs.
 *
 * Resolution priority for each field:
 *   1. Component input binding  (e.g. [feedUrl]="...")
 *   2. Injected WAYF_CONFIG token value
 *   3. Built-in default (see DEFAULT_WAYF_CONFIG)
 */
export interface WayfConfig {
  /**
   * URL to the JSON IdP feed.
   * In DSpace deployments this is the backend endpoint `/api/discojuice/feeds`.
   * When empty, the component will try to auto-derive the URL from
   * the current DSpace REST base URL.
   */
  feedUrl: string;

  /** Tag to filter IdPs by (e.g. "clarin"). */
  categoryFilter: string | null;

  /** Array of entityIDs to pin as proxy/hub IdPs. */
  proxyEntities: string[];

  /** Language code for UI and name resolution. */
  lang: string;

  /** EntityID to always pin at the top as "default institution" (optional). */
  defaultEntityId: string;
}

/**
 * Built-in defaults — used when no token is provided and no input is set.
 */
export const DEFAULT_WAYF_CONFIG: WayfConfig = {
  feedUrl: '',
  categoryFilter: null,
  proxyEntities: [],
  lang: '',
  defaultEntityId: '',
};

/**
 * Injection token for WAYF configuration.
 *
 * Host apps provide this at the module/route/component level:
 *
 * ```ts
 * providers: [
 *   { provide: WAYF_CONFIG, useValue: { feedUrl: 'https://...', defaultEntityId: 'https://...' } }
 * ]
 * ```
 *
 * When not provided, DEFAULT_WAYF_CONFIG is used.
 */
export const WAYF_CONFIG = new InjectionToken<Partial<WayfConfig>>('WAYF_CONFIG', {
  factory: () => DEFAULT_WAYF_CONFIG,
});

/**
 * SAMLDS protocol parameters extracted from the URL query string.
 * See: https://wiki.oasis-open.org/security/IdpDiscoSvcProto
 */
export interface SamldsParams {
  /** The entityID of the requesting Service Provider. */
  entityID: string | null;

  /** The URL to redirect to after IdP selection. */
  return: string | null;

  /** Query parameter name to append the selected IdP entityID (default: "entityID"). */
  returnIDParam: string;

  /** If true, component should attempt silent re-auth without user interaction. */
  isPassive: boolean;
}
