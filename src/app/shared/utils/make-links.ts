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
