/**
 * Configuration for the WAYF component, derived from element attributes
 * and URL query parameters (SAMLDS protocol).
 */
export interface WayfConfig {
  /** URL to the JSON IdP feed (DiscoFeed). */
  feedUrl: string;

  /** Tag to filter IdPs by (e.g. "clarin"). */
  categoryFilter: string | null;

  /** JSON array of entityIDs to pin as proxy/hub IdPs. */
  proxyEntities: string[];

  /** Language code for UI and name resolution. */
  lang: string;
}

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
