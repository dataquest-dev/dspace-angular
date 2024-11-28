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
  // @ts-ignore
  let _paq = _paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  // _paq.push(['trackPageView']); // DELETE THIS LINE
  _paq.push(['enableLinkTracking']);
  (function() {
    let u = 'http://localhost:8135/';
    _paq.push(['setDocumentTitle', location.hostname + '/' + document.title]);
    _paq.push(['setCookieDomain', '*dev-5.pc*']);
    _paq.push(['setDomains', ['*dev-5.pc*']]);
    _paq.push(['setUserId', this.getUserId()]);
    // _paq.push(['setCustomVariable', 1, 'lang', 'en', 'visit']);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    _paq.push(['setTrackerUrl', u + 'matomo.php']);
    _paq.push(['setSiteId', 1]);

    let d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
    g.type = 'text/javascript'; g.async = true; g.defer = true; g.src = u + 'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
}

// support async tag or hmr
if (document.readyState === 'complete' && !hasTransferState) {
  main();
} else {
  document.addEventListener('DOMContentLoaded', main);
}
