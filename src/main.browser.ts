import 'zone.js';
import 'reflect-metadata';
import 'core-js/es/reflect';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { BrowserAppModule } from './modules/app/browser-app.module';

import { environment } from './environments/environment';
import { AppConfig } from './config/app-config.interface';
import { extendEnvironmentWithAppConfig } from './config/config.util';
import { enableProdMode } from '@angular/core';

const bootstrap = () => platformBrowserDynamic()
  .bootstrapModule(BrowserAppModule, {});

/**
 * We use this to determine have been serven SSR HTML or not.
 *
 * At this point, {@link environment} may not be in sync with the configuration.
 * Therefore, we cannot depend on it to determine how to bootstrap the app.
 */
const hasTransferState = document.querySelector('script#dspace-angular-state') !== null;

const main = () => {
  if (environment.production) {
    enableProdMode();
  }

  addMatomoStatistics();
  if (hasTransferState) {
    // Configuration will be taken from transfer state during initialization
    return bootstrap();
  } else {
    // Configuration must be fetched explicitly
    return fetch('assets/config.json')
      .then((response) => response.json())
      .then((appConfig: AppConfig) => {
        // extend environment with app config for browser when not prerendered
        extendEnvironmentWithAppConfig(environment, appConfig);
        return bootstrap();
      });
  }
};

function addMatomoStatistics() {
  (window as any)._paq = (window as any)._paq || [];

  void fetch('assets/config.json')
    .then((response) => response.json())
    .then((config) => {
      const matomoConfig = config.matomo;

      // Push all configuration commands first
      (window as any)._paq.push(['setTrackerUrl', matomoConfig.hostUrl + 'matomo.php']);
      (window as any)._paq.push(['setSiteId', matomoConfig.siteId]);
      (window as any)._paq.push(['enableLinkTracking']);

      const g = document.createElement('script');
      g.type = 'text/javascript';
      g.async = true;
      g.defer = true;
      g.src = matomoConfig.hostUrl + 'matomo.js';
      document.getElementsByTagName('head')[0].appendChild(g);
    });
}

// support async tag or hmr
if (document.readyState === 'complete' && !hasTransferState) {
  main();
} else {
  document.addEventListener('DOMContentLoaded', main);
}
