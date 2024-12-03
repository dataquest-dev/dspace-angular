import { Config } from './config.interface';

/**
 * Configuration for Matomo statistics.
 */
export class MatomoConfig implements Config {

  public hostUrl: string;

  public siteId: string;
}
