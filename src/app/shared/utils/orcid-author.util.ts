import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { getFirstSucceededRemoteDataPayload } from '../../core/shared/operators';

/**
 * Pattern that matches a bare ORCID iD (16 digits in groups of 4, last char may be X).
 * Example: `0000-0001-2345-6789` or `0000-0001-2345-678X`.
 */
export const ORCID_ID_PATTERN = /^(\d{4}-){3}\d{3}[\dX]$/i;

/**
 * Pattern that matches a full ORCID URL authority value.
 * Example: `https://orcid.org/0000-0001-2345-6789`.
 */
export const ORCID_URL_PATTERN = /^https?:\/\/[^/]+\/((\d{4}-){3}\d{3}[\dX])$/i;

/**
 * Type of the backend property `orcid.author.link-target`.
 * Controls the target of the link rendered on the author name for an ORCID-authority author.
 * Any unknown / unset value falls back to the default (`browse`).
 */
export type AuthorOrcidLinkTarget = string;

/**
 * Name of the backend configuration property that controls the author-name link target
 * for ORCID-authority authors.
 */
export const AUTHOR_ORCID_LINK_TARGET_PROPERTY = 'orcid.author.link-target';

/**
 * Default value used when `orcid.author.link-target` is unset, invalid, or unreachable.
 */
export const DEFAULT_AUTHOR_ORCID_LINK_TARGET: AuthorOrcidLinkTarget = 'browse';

/**
 * Load `orcid.domain-url` from the backend configuration. Returns null when unset
 * or when the value does not look like an absolute http(s) URL.
 */
export function loadOrcidDomainUrl(
  configurationService: ConfigurationDataService,
): Promise<string | null> {
  return configurationService.findByPropertyName('orcid.domain-url')
    .pipe(getFirstSucceededRemoteDataPayload())
    .toPromise()
    .then((rd: any) => {
      const value = rd?.values?.[0]?.trim();
      return value && /^https?:\/\//i.test(value) ? value : null;
    })
    .catch(() => null);
}

/**
 * Load `orcid.author.link-target` from the backend configuration.
 * Returns the default (`browse`) when the property is unset or invalid.
 */
export function loadAuthorOrcidLinkTarget(
  configurationService: ConfigurationDataService,
): Promise<AuthorOrcidLinkTarget> {
  return configurationService.findByPropertyName(AUTHOR_ORCID_LINK_TARGET_PROPERTY)
    .pipe(getFirstSucceededRemoteDataPayload())
    .toPromise()
    .then((rd: any) => {
      const value = rd?.values?.[0]?.trim()?.toLowerCase();
      return value ? value : DEFAULT_AUTHOR_ORCID_LINK_TARGET;
    })
    .catch(() => DEFAULT_AUTHOR_ORCID_LINK_TARGET);
}

/**
 * Extract the lowercase host of an absolute http(s) URL. Returns null on invalid input.
 */
function getHost(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True when the authority string is a recognised ORCID value (bare iD or full URL).
 * Bare iDs require `orcidDomainUrl` so the link can be built without guessing the domain.
 * URL authorities are only accepted when their host matches the configured ORCID domain.
 */
export function isOrcidAuthorityValue(authority: string | undefined | null, orcidDomainUrl: string | null): boolean {
  if (!authority) {
    return false;
  }
  const trimmed = authority.trim();
  if (ORCID_URL_PATTERN.test(trimmed)) {
    const expectedHost = getHost(orcidDomainUrl);
    return !!expectedHost && getHost(trimmed) === expectedHost;
  }
  return !!orcidDomainUrl && ORCID_ID_PATTERN.test(trimmed);
}

/**
 * Build the full ORCID profile URL for the given authority. Returns an empty string when
 * the authority is not an ORCID value or when the ORCID domain URL is required but missing.
 * URL authorities are only accepted when their host matches the configured ORCID domain.
 */
export function buildOrcidProfileUrl(authority: string | undefined | null, orcidDomainUrl: string | null): string {
  if (!authority) {
    return '';
  }
  const trimmed = authority.trim();
  if (ORCID_URL_PATTERN.test(trimmed)) {
    const expectedHost = getHost(orcidDomainUrl);
    if (expectedHost && getHost(trimmed) === expectedHost) {
      return trimmed;
    }
    return '';
  }
  if (orcidDomainUrl && ORCID_ID_PATTERN.test(trimmed)) {
    const domain = orcidDomainUrl.endsWith('/') ? orcidDomainUrl.slice(0, -1) : orcidDomainUrl;
    return `${domain}/${trimmed}`;
  }
  return '';
}
