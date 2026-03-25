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
 * Metadata link descriptor returned by MetadataLinkService.getMetadataLink().
 */
export interface MetadataLink {
  external: boolean;
  /** Full URL for external links */
  href?: string;
}
