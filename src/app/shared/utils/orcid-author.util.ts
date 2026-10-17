import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';

/**
 * Bare ORCID iD: four groups of four digits, the last character may be the `X` checksum.
 */
export const ORCID_ID_PATTERN = /^(\d{4}-){3}\d{3}[\dX]$/i;

/**
 * ORCID iD as a full profile URL, e.g. `https://orcid.org/0000-0002-1825-0097`.
 */
export const ORCID_URL_PATTERN = /^https?:\/\/[^/]+\/(\d{4}-){3}\d{3}[\dX]$/i;

/**
 * Backend property with the ORCID base URL, e.g. `https://orcid.org` or `https://sandbox.orcid.org`.
 */
export const ORCID_DOMAIN_URL_PROPERTY = 'orcid.domain-url';

/**
 * Backend property selecting where the name of an author with an ORCID iD links to.
 */
export const AUTHOR_ORCID_LINK_TARGET_PROPERTY = 'orcid.author.link-target';

/**
 * Values of `orcid.author.link-target`.
 */
export enum AuthorOrcidLinkTarget {
  /** The name keeps its repository link; the ORCID icon links to the profile. */
  Browse = 'browse',
  /** The name and the ORCID icon link to the profile. */
  Orcid = 'orcid',
}

const DEFAULT_AUTHOR_ORCID_LINK_TARGET = AuthorOrcidLinkTarget.Browse;

const HTTP_URL_PATTERN = /^https?:\/\//i;

/**
 * Build the ORCID profile URL for an authority value.
 *
 * A bare iD is appended to `orcidDomainUrl`; a full ORCID URL is accepted only on the host of
 * `orcidDomainUrl`, so an authority can never turn into a link to an arbitrary site.
 *
 * @param authority      the metadata authority value
 * @param orcidDomainUrl the ORCID base URL from the backend, or `null` when not available
 * @returns the profile URL, or `null` when the authority is not an ORCID iD or no domain is known
 */
export function buildOrcidProfileUrl(authority: string | null | undefined, orcidDomainUrl: string | null): string | null {
  const value = authority?.trim();
  if (!value || !orcidDomainUrl) {
    return null;
  }
  if (ORCID_ID_PATTERN.test(value)) {
    return `${orcidDomainUrl.replace(/\/$/, '')}/${value}`;
  }
  const domainHost = getHost(orcidDomainUrl);
  if (ORCID_URL_PATTERN.test(value) && domainHost !== null && getHost(value) === domainHost) {
    return value;
  }
  return null;
}

/**
 * Load `orcid.domain-url` from the backend.
 *
 * @returns the URL, or `null` when the property is not exposed or is not an http(s) URL
 */
export function loadOrcidDomainUrl(configurationService: ConfigurationDataService): Promise<string | null> {
  return loadFirstPropertyValue(configurationService, ORCID_DOMAIN_URL_PROPERTY)
    .then((url) => (url !== null && HTTP_URL_PATTERN.test(url) ? url : null));
}

/**
 * Load `orcid.author.link-target` from the backend.
 *
 * @returns the configured target; {@link DEFAULT_AUTHOR_ORCID_LINK_TARGET} when unset or unknown
 */
export function loadAuthorOrcidLinkTarget(configurationService: ConfigurationDataService): Promise<AuthorOrcidLinkTarget> {
  return loadFirstPropertyValue(configurationService, AUTHOR_ORCID_LINK_TARGET_PROPERTY)
    .then((value) => (value?.toLowerCase() === AuthorOrcidLinkTarget.Orcid
      ? AuthorOrcidLinkTarget.Orcid
      : DEFAULT_AUTHOR_ORCID_LINK_TARGET));
}

/**
 * Resolve with the first value of a backend property; `null` when the request fails (e.g. the
 * property is not exposed), so callers never wait on a property an older backend doesn't have.
 */
function loadFirstPropertyValue(configurationService: ConfigurationDataService, property: string): Promise<string | null> {
  return firstValueFrom(configurationService.findByPropertyName(property).pipe(
    getFirstCompletedRemoteData(),
    map((rd: RemoteData<ConfigurationProperty>) => (rd.hasSucceeded ? rd.payload?.values?.[0]?.trim() : null) || null),
  ), { defaultValue: null });
}

function getHost(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}
