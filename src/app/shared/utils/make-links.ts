/**
 * Convert raw text URLs into clickable HTML links.
 * Detects http, https, ftp URLs and www. addresses.
 *
 * Ported from dtq-dev clarin-shared-util.ts to be reused across components.
 */
export function makeLinks(text: string): string {
  const regex = /(?:https?|ftp):\/\/[^\s)]+|www\.[^\s)]+/g;
  return text?.replace(regex, (url) => {
    const href = url.startsWith('www.') ? `https://${url}` : url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

/**
 * Metadata link descriptor returned by getMetadataLink().
 */
export interface MetadataLink {
  external: boolean;
  /** Full URL for external links */
  href?: string;
  /** Router path for internal links */
  routerLink?: string;
  /** Query parameters for internal links */
  queryParams?: Record<string, string>;
}

// --- External resolver base URLs ---
const DOI_RESOLVER = 'https://doi.org/';
const SCOPUS_RECORD = 'https://www.scopus.com/record/display.uri?eid=';
const WOS_RECORD = 'https://www.webofscience.com/wos/woscc/full-record/';

// --- Internal search configuration ---
const SEARCH_PATH = '/search';
const SEARCH_FILTER_SUFFIX = ',equals';

/** Maps metadata keys to their corresponding search filter parameter. */
const SEARCH_FIELD_FILTERS: Record<string, string> = {
  'dc.subject': 'f.subject',
  'dc.contributor.author': 'f.author',
};

/** Maps metadata keys to their external resolver base URL. */
const EXTERNAL_RESOLVERS: Record<string, string> = {
  'local.identifier.scopus': SCOPUS_RECORD,
  'local.identifier.wos': WOS_RECORD,
};

const HTTP_URL_PATTERN = /^https?:\/\//i;

/**
 * For specific metadata fields, build an appropriate hyperlink.
 * Returns null when the field needs no special treatment (fall back to makeLinks).
 */
export function getMetadataLink(key: string, value: string): MetadataLink | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  // DOI: bare identifiers → doi.org resolver; full URLs fall through to makeLinks
  if (key === 'local.identifier.doi') {
    return HTTP_URL_PATTERN.test(trimmed)
      ? null
      : { external: true, href: `${DOI_RESOLVER}${encodeURIComponent(trimmed)}` };
  }

  // External resolvers (Scopus, WOS, …)
  const resolver = EXTERNAL_RESOLVERS[key];
  if (resolver) {
    return { external: true, href: `${resolver}${encodeURIComponent(trimmed)}` };
  }

  // Internal search links (subject, author, …)
  const filterParam = SEARCH_FIELD_FILTERS[key];
  if (filterParam) {
    return { external: false, routerLink: SEARCH_PATH, queryParams: { [filterParam]: `${trimmed}${SEARCH_FILTER_SUFFIX}` } };
  }

  return null;
}
