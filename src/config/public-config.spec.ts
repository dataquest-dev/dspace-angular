import { AppConfig } from './app-config.interface';
import { BuildConfig } from './build-config.interface';
import { DefaultAppConfig } from './default-app-config';
import {
  buildPublicConfig,
  PublicAppConfig,
  SERVER_ONLY_KEYS,
} from './public-config';

const valueAt = (source: any, path: string): any =>
  path.split('.').reduce((value, segment) => (value === undefined || value === null ? undefined : value[segment]), source);

/**
 * A resolved configuration as config.server.ts hands it over: defaults plus the values that only
 * exist once the yaml/environment overrides and buildBaseUrl() have run.
 */
const resolvedConfig = (): AppConfig => {
  const config = new DefaultAppConfig() as unknown as BuildConfig;
  config.ui.baseUrl = 'https://repository.example.org';
  config.ui.nameSpace = '/repository';
  config.rest.host = 'rest-internal';
  config.rest.port = 8080;
  config.rest.nameSpace = '/server';
  config.rest.baseUrl = 'https://repository.example.org/server';
  config.rest.ssrBaseUrl = 'http://dspace-internal:8080/server';
  config.rest.hasSsrBaseUrl = true;
  config.auth.target = { host: 'https://idp.example.org', page: '/login' };
  config.matomo = { trackerUrl: 'https://matomo.example.org/', dimensionId: 7 };
  config.statistics = { baseUrl: 'https://stats.example.org', endpoint: '/api/views' };
  config.ssr = { transferState: true, replaceRestUrl: true, enabled: true } as BuildConfig['ssr'];
  return config as unknown as AppConfig;
};

describe('buildPublicConfig', () => {
  let pristine: DefaultAppConfig;
  let resolved: AppConfig;
  let publicConfig: PublicAppConfig;

  beforeEach(() => {
    pristine = new DefaultAppConfig();
    resolved = resolvedConfig();
    publicConfig = buildPublicConfig(resolved);
  });

  describe('server-only values', () => {
    it('should not expose the UI server internals', () => {
      expect(valueAt(publicConfig, 'ui.host')).toBeUndefined();
      expect(valueAt(publicConfig, 'ui.port')).toBeUndefined();
      expect(valueAt(publicConfig, 'ui.ssl')).toBeUndefined();
      expect(valueAt(publicConfig, 'ui.rateLimiter')).toBeUndefined();
      expect(valueAt(publicConfig, 'ui.useProxies')).toBeUndefined();
      expect(Object.keys(publicConfig.ui).sort()).toEqual(['baseUrl', 'nameSpace']);
    });

    it('should not expose the REST server internals or the internal SSR base url', () => {
      expect(valueAt(publicConfig, 'rest.host')).toBeUndefined();
      expect(valueAt(publicConfig, 'rest.port')).toBeUndefined();
      expect(valueAt(publicConfig, 'rest.ssl')).toBeUndefined();
      expect(valueAt(publicConfig, 'rest.ssrBaseUrl')).toBeUndefined();
      expect(valueAt(publicConfig, 'rest.hasSsrBaseUrl')).toBeUndefined();
      expect(Object.keys(publicConfig.rest).sort()).toEqual(['baseUrl', 'nameSpace']);
    });

    it('should not expose the actuators block', () => {
      expect(valueAt(publicConfig, 'actuators')).toBeUndefined();
      expect(resolved.actuators.endpointPath).toEqual('/actuator/health');
    });

    it('should not expose the server-side render caches', () => {
      expect(valueAt(publicConfig, 'cache.serverSide')).toBeUndefined();
      expect(valueAt(publicConfig, 'cache.noCacheFiles')).toBeUndefined();
      expect(Object.keys(publicConfig.cache).sort()).toEqual(['autoSync', 'control', 'msToLive']);
    });

    it('should not expose the authentication target', () => {
      expect(valueAt(publicConfig, 'auth.target')).toBeUndefined();
      expect(Object.keys(publicConfig.auth).sort()).toEqual(['rest', 'ui']);
    });

    it('should not expose any path listed in SERVER_ONLY_KEYS', () => {
      SERVER_ONLY_KEYS.forEach((path: string) => {
        expect(valueAt(publicConfig, path)).withContext(path).toBeUndefined();
        expect(valueAt(resolved, path)).withContext(`${path} is set on the source config`).toBeDefined();
      });
    });
  });

  describe('values the browser reads', () => {
    it('should pass through the public UI and REST urls', () => {
      expect(publicConfig.ui.baseUrl).toEqual('https://repository.example.org');
      expect(publicConfig.ui.nameSpace).toEqual('/repository');
      expect(publicConfig.rest.baseUrl).toEqual('https://repository.example.org/server');
      expect(publicConfig.rest.nameSpace).toEqual('/server');
    });

    it('should pass through the cache settings used by the client', () => {
      expect(publicConfig.cache.msToLive).toEqual(resolved.cache.msToLive);
      expect(publicConfig.cache.control).toEqual(resolved.cache.control);
      expect(publicConfig.cache.autoSync).toEqual(resolved.cache.autoSync);
    });

    it('should pass through the idle and token refresh timings', () => {
      expect(publicConfig.auth.ui.timeUntilIdle).toEqual(resolved.auth.ui.timeUntilIdle);
      expect(publicConfig.auth.ui.idleGracePeriod).toEqual(resolved.auth.ui.idleGracePeriod);
      expect(publicConfig.auth.rest.timeLeftBeforeTokenRefresh).toEqual(resolved.auth.rest.timeLeftBeforeTokenRefresh);
    });

    it('should pass through the language settings', () => {
      expect(publicConfig.fallbackLanguage).toEqual(resolved.fallbackLanguage);
      expect(publicConfig.languages).toEqual(resolved.languages);
    });

    it('should pass through the community and collection page configuration', () => {
      expect(publicConfig.community).toEqual(resolved.community);
      expect(publicConfig.collection).toEqual(resolved.collection);
      expect(publicConfig.community.defaultBrowseTab).toEqual('search');
    });

    it('should pass through the item, browse, search and theme configuration', () => {
      expect(publicConfig.item).toEqual(resolved.item);
      expect(publicConfig.browseBy).toEqual(resolved.browseBy);
      expect(publicConfig.search).toEqual(resolved.search);
      expect(publicConfig.themes).toEqual(resolved.themes);
    });

    it('should pass through the suggestion, quality assurance and notify dashboards', () => {
      expect(publicConfig.suggestion).toEqual(resolved.suggestion);
      expect(publicConfig.qualityAssuranceConfig).toEqual(resolved.qualityAssuranceConfig);
      expect(publicConfig.notifyMetrics).toEqual(resolved.notifyMetrics);
    });

    it('should pass through the geospatial, accessibility and live region configuration', () => {
      expect(publicConfig.geospatialMapViewer).toEqual(resolved.geospatialMapViewer);
      expect(publicConfig.accessibility).toEqual(resolved.accessibility);
      expect(publicConfig.liveRegion).toEqual(resolved.liveRegion);
    });

    it('should pass through the CLARIN statistics block', () => {
      expect(publicConfig.statistics).toEqual({ baseUrl: 'https://stats.example.org', endpoint: '/api/views' });
    });

    it('should expose the matomo tracker url and dimension id and nothing else of matomo', () => {
      expect(publicConfig.matomo).toEqual({ trackerUrl: 'https://matomo.example.org/', dimensionId: 7 });
    });

    it('should expose ssr.transferState and nothing else of ssr', () => {
      expect(publicConfig.ssr).toEqual({ transferState: true });
    });

    it('should pass through the remaining client blocks', () => {
      expect(publicConfig.production).toEqual(resolved.production);
      expect(publicConfig.debug).toEqual(resolved.debug);
      expect(publicConfig.form).toEqual(resolved.form);
      expect(publicConfig.notifications).toEqual(resolved.notifications);
      expect(publicConfig.submission).toEqual(resolved.submission);
      expect(publicConfig.communityList).toEqual(resolved.communityList);
      expect(publicConfig.homePage).toEqual(resolved.homePage);
      expect(publicConfig.mediaViewer).toEqual(resolved.mediaViewer);
      expect(publicConfig.bundle).toEqual(resolved.bundle);
      expect(publicConfig.info).toEqual(resolved.info);
      expect(publicConfig.markdown).toEqual(resolved.markdown);
      expect(publicConfig.vocabularies).toEqual(resolved.vocabularies);
      expect(publicConfig.comcolSelectionSort).toEqual(resolved.comcolSelectionSort);
    });
  });

  describe('completeness guard', () => {
    it('should classify every top level AppConfig key as public or server-only', () => {
      const serverOnlyBlocks = SERVER_ONLY_KEYS.filter((path: string) => !path.includes('.'));
      Object.keys(pristine).forEach((key: string) => {
        const classified = Object.prototype.hasOwnProperty.call(publicConfig, key) || serverOnlyBlocks.includes(key);
        expect(classified).withContext(`AppConfig key '${key}' is neither in the allow-list nor in SERVER_ONLY_KEYS`).toBeTrue();
      });
    });

    it('should classify every key of a partially exposed block as public or server-only', () => {
      ['ui', 'rest', 'cache', 'auth'].forEach((block: string) => {
        Object.keys(pristine[block]).forEach((key: string) => {
          const path = `${block}.${key}`;
          const exposed = Object.prototype.hasOwnProperty.call(publicConfig[block] ?? {}, key);
          expect(exposed || SERVER_ONLY_KEYS.includes(path)).withContext(`AppConfig key '${path}' is neither in the allow-list nor in SERVER_ONLY_KEYS`).toBeTrue();
        });
      });
    });
  });

  it('should tolerate an empty configuration', () => {
    expect(() => buildPublicConfig(undefined)).not.toThrow();
    expect(buildPublicConfig({} as AppConfig).ui).toEqual({ baseUrl: undefined, nameSpace: undefined });
  });
});
