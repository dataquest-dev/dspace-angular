import { RobotsConfig } from './robots-config.interface';

/**
 * Build the optional, per-instance `Disallow` lines for the served robots.txt
 * (see `src/robots.txt.ejs`) from config. The always-on facet-trap rules live in
 * the template itself; only these switchable blocks are assembled here so the
 * toggle logic has a unit-testable seam.
 *
 * Returns a string that already starts with a newline when non-empty, so it can
 * be appended directly after the last static rule without leaving a blank line
 * inside the `User-agent: *` group record (blank lines end a group).
 */
export function buildOptionalRobotsDisallows(robots: RobotsConfig): string {
  const lines: string[] = [];
  if (robots?.disallowBrowse) {
    lines.push('Disallow: /browse');
  }
  if (robots?.disallowHandle) {
    lines.push('Disallow: /handle');
  }
  if (robots?.disallowBitstreams) {
    // Bitstream content is reachable by handle path and by UUID; block both.
    lines.push('Disallow: /bitstream/');
    lines.push('Disallow: /bitstreams/');
  }
  return lines.length ? '\n' + lines.join('\n') : '';
}
