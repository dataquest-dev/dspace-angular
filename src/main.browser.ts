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

  if (hasTransferState) {
    // Configuration will be taken from transfer state during initialization
    addMatomoStatistics();
    return bootstrap();
  } else {
    // Configuration must be fetched explicitly
    return fetch('assets/config.json')
      .then((response) => response.json())
      .then((appConfig: AppConfig) => {
        // extend environment with app config for browser when not prerendered
        extendEnvironmentWithAppConfig(environment, appConfig);
        addMatomoStatistics();
        return bootstrap();
      });
  }
};

function addMatomoStatistics() {
  // Check if Matomo is configured with required properties
  if (!environment.matomo || !environment.matomo.hostUrl || !environment.matomo.siteId) {
    return;
  }

  try {
    (window as any)._paq = (window as any)._paq || [];

    // Push all configuration commands first
    (window as any)._paq.push(['setTrackerUrl', environment.matomo.hostUrl + 'matomo.php']);
    (window as any)._paq.push(['setSiteId', environment.matomo.siteId]);
    (window as any)._paq.push(['enableLinkTracking']);

    const g = document.createElement('script');
    g.type = 'text/javascript';
    g.async = true;
    g.defer = true;
    g.src = environment.matomo.hostUrl + 'matomo.js';
    document.getElementsByTagName('head')[0].appendChild(g);
  } catch (error) {
    // Log error unless in a test environment to aid debugging in production
    if (!('test' in environment && environment.test)) {
      // Log the error to the console for visibility in production and development
      console.error('Matomo initialization failed:', error);
    }
    // Silently fail in test environments to avoid interfering with tests
    return;
  }
}

// support async tag or hmr
if (document.readyState === 'complete' && !hasTransferState) {
  void main();
} else {
  document.addEventListener('DOMContentLoaded', () => void main());
}
