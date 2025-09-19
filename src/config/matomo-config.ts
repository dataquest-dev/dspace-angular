import { Config } from './config.interface';

/**
 * Configuration for Matomo statistics.
 */
export class MatomoConfig implements Config {

  public enabled: boolean;

  public hostUrl: string;

  public siteId: string;

  public dimensionId: number;
}
