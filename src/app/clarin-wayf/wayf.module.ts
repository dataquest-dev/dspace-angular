import { ModuleWithProviders, NgModule } from '@angular/core';

import { WayfConfig, WAYF_CONFIG, WAYF_DEFAULTS } from './wayf.config';

/**
 * Angular module wrapper for the WAYF component.
 *
 * Usage in a host application:
 *
 * ```ts
 * imports: [
 *   WayfModule.forRoot({
 *     feedUrl: 'https://sp.example.org/Shibboleth.sso/DiscoFeed',
 *     spEntityId: 'https://sp.example.org/shibboleth',
 *     loginEndpoint: 'https://sp.example.org/Shibboleth.sso/Login',
 *   }),
 * ]
 * ```
 *
 * Only the three required fields must be provided.
 * Optional fields fall back to `WAYF_DEFAULTS`.
 */
@NgModule()
export class WayfModule {
  static forRoot(config: Pick<WayfConfig, 'feedUrl' | 'spEntityId' | 'loginEndpoint'> & Partial<WayfConfig>): ModuleWithProviders<WayfModule> {
    return {
      ngModule: WayfModule,
      providers: [
        {
          provide: WAYF_CONFIG,
          useValue: { ...WAYF_DEFAULTS, ...config } as WayfConfig,
        },
      ],
    };
  }
}
