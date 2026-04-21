import { ModuleWithProviders, NgModule } from '@angular/core';

import { ClarinWayfComponent } from './clarin-wayf.component';
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
 *   }),
 * ]
 * ```
 *
 * Only `feedUrl` is required for the standalone widget.
 * Optional widget fields fall back to `WAYF_DEFAULTS`.
 * Host-only integration fields like `loginEndpoint` may still be supplied
 * through the shared `WAYF_CONFIG` token when needed.
 */
@NgModule({
  imports: [ClarinWayfComponent],
  exports: [ClarinWayfComponent],
})
export class WayfModule {
  static forRoot(config: Pick<WayfConfig, 'feedUrl'> & Partial<WayfConfig>): ModuleWithProviders<WayfModule> {
    return {
      ngModule: WayfModule,
      providers: [
        {
          provide: WAYF_CONFIG,
          useValue: { ...WAYF_DEFAULTS, ...config } as Partial<WayfConfig>,
        },
      ],
    };
  }
}
