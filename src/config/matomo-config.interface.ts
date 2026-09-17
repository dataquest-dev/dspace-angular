import { Config } from './config.interface';

/**
 * Configuration interface for Matomo tracking
 */
export interface MatomoConfig extends Config {
  /**
   * This tracker url will be used instead of the one configured on REST side (matomo.tracker.url)
   * only if set inside the config.*.yml configuration file
   */
  trackerUrl?: string;

  /**
   * Id of the Matomo custom dimension the item handle is reported in. Leave it unset when the
   * deployment has no such dimension: no custom dimension is then sent.
   */
  dimensionId?: number;
}
