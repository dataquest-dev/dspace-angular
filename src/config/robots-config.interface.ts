import { Config } from './config.interface';

/**
 * Config for the optional, per-instance blocks of the served `robots.txt`
 * (see `src/robots.txt.ejs`). The facet-trap rules that protect SSR are always
 * emitted; only these extra blocks are switchable, because each de-indexes
 * content some instances intentionally expose.
 */
export interface RobotsConfig extends Config {

  /**
   * Emit `Disallow: /handle`. Off by default: a blanket handle block de-indexes
   * persistent identifiers on instances that rely on handle redirects.
   */
  disallowHandle: boolean;

  /**
   * Emit `Disallow: /browse`.
   */
  disallowBrowse: boolean;

  /**
   * Emit `Disallow: /bitstream/` and `Disallow: /bitstreams/` to keep crawlers
   * out of bitstream content (reachable by handle path or by UUID).
   */
  disallowBitstreams: boolean;
}
