import { Config } from './config.interface';

/**
 * CLARIN: configuration for the per-item views/downloads statistics page.
 * `baseUrl` + `endpoint` point at the external statistics (Matomo-backed) service.
 */
export class StatisticsConfig implements Config {
  public baseUrl: string;
  public endpoint: string;
}
