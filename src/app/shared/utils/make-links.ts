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

/**
 * For specific metadata fields, build an appropriate hyperlink.
 * Returns null when the field needs no special treatment (fall back to makeLinks).
 */
export function getMetadataLink(key: string, value: string): MetadataLink | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  switch (key) {
    case 'local.identifier.doi':
      // If the DOI value is already a full URL, let makeLinks handle it
      if (/^https?:\/\//i.test(trimmed)) {
        return null;
      }
      return { external: true, href: `https://doi.org/${encodeURIComponent(trimmed)}` };

    case 'local.identifier.scopus':
      return { external: true, href: `https://www.scopus.com/record/display.uri?eid=${encodeURIComponent(trimmed)}` };

    case 'local.identifier.wos':
      return { external: true, href: `https://www.webofscience.com/wos/woscc/full-record/${encodeURIComponent(trimmed)}` };

    case 'dc.subject':
      return { external: false, routerLink: '/search', queryParams: { 'f.subject': `${trimmed},equals` } };

    case 'dc.contributor.author':
      return { external: false, routerLink: '/search', queryParams: { 'f.author': `${trimmed},equals` } };

    default:
      return null;
  }
}
