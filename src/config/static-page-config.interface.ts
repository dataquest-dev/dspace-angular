import { Config } from './config.interface';

/**
 * Configuration for static pages served from the `static-files` folder.
 */
export class StaticPageConfig implements Config {
  /**
   * Values substituted for `${key}` placeholders in static page HTML, e.g. `${dspace.name}`.
   * Values are plain text; they are HTML-escaped on insert.
   * Placeholders are for text content only, not for URL or attribute values.
   */
  public variables: { [key: string]: string } = {};
}
