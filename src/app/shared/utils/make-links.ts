import { addOperatorToFilterValue } from '../search/search.utils';

/**
 * Escape HTML special characters so that non-URL parts of a metadata value
 * are rendered as plain text when inserted via [innerHTML].
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert raw text URLs into clickable HTML links.
 * Detects http, https, ftp URLs and www. addresses.
 * Non-URL parts are HTML-escaped to prevent markup injection via [innerHTML].
 *
 * Ported from dtq-dev clarin-shared-util.ts to be reused across components.
 */
export function makeLinks(text: string | null | undefined): string | undefined {
  if (text == null) {
    return undefined;
  }
  const regex = /(?:https?|ftp):\/\/[^\s)]+|www\.[^\s)]+/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Escape the plain text segment before this URL
    result += escapeHtml(text.slice(lastIndex, match.index));
    const url = match[0];
    const href = url.startsWith('www.') ? `https://${url}` : url;
    result += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    lastIndex = regex.lastIndex;
  }

  // Escape the remaining plain text after the last URL
  result += escapeHtml(text.slice(lastIndex));
  return result;
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
export function getMetadataLink(key: string, value: string | null | undefined): MetadataLink | null {
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
    return { external: false, routerLink: SEARCH_PATH, queryParams: { [filterParam]: addOperatorToFilterValue(trimmed, 'equals') } };
  }

  return null;
}
