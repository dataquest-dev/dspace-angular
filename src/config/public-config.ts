import { AppConfig } from './app-config.interface';
import { BuildConfig } from './build-config.interface';

/**
 * The subset of the application configuration that is served to unauthenticated clients.
 */
export interface PublicAppConfig extends Partial<Omit<BuildConfig, 'actuators' | 'auth' | 'cache' | 'matomo' | 'rest' | 'ssr' | 'ui'>> {
  ui?: Pick<AppConfig['ui'], 'baseUrl' | 'nameSpace'>;
  rest?: Pick<AppConfig['rest'], 'baseUrl' | 'nameSpace'>;
  auth?: Pick<NonNullable<AppConfig['auth']>, 'rest' | 'ui'>;
  cache?: Pick<AppConfig['cache'], 'autoSync' | 'control' | 'msToLive'>;
  matomo?: Pick<NonNullable<AppConfig['matomo']>, 'trackerUrl' | 'dimensionId'>;
  ssr?: Pick<BuildConfig['ssr'], 'transferState'>;
}

/**
 * Configuration paths that stay on the server and are never handed to a client.
 */
export const SERVER_ONLY_KEYS: string[] = [
  'actuators',
  'auth.target',
  'cache.noCacheFiles',
  'cache.serverSide',
  'rest.hasSsrBaseUrl',
  'rest.host',
  'rest.port',
  'rest.ssl',
  'rest.ssrBaseUrl',
  'ui.host',
  'ui.port',
  'ui.rateLimiter',
  'ui.ssl',
  'ui.useProxies',
];

/**
 * Build the public configuration from a resolved application configuration.
 * A key that is not listed here is undefined in the browser, not its default value.
 */
export const buildPublicConfig = (appConfig: AppConfig): PublicAppConfig => {
  const config = (appConfig ?? {}) as Partial<BuildConfig>;

  return {
    production: config.production,
    debug: config.debug,
    ui: {
      baseUrl: config.ui?.baseUrl,
      nameSpace: config.ui?.nameSpace,
    },
    rest: {
      baseUrl: config.rest?.baseUrl,
      nameSpace: config.rest?.nameSpace,
    },
    auth: {
      ui: {
        timeUntilIdle: config.auth?.ui?.timeUntilIdle,
        idleGracePeriod: config.auth?.ui?.idleGracePeriod,
      },
      rest: {
        timeLeftBeforeTokenRefresh: config.auth?.rest?.timeLeftBeforeTokenRefresh,
      },
    },
    cache: {
      msToLive: config.cache?.msToLive,
      control: config.cache?.control,
      autoSync: config.cache?.autoSync,
    },
    ssr: {
      transferState: config.ssr?.transferState,
    },
    matomo: {
      trackerUrl: config.matomo?.trackerUrl,
      dimensionId: config.matomo?.dimensionId,
    },
    fallbackLanguage: config.fallbackLanguage,
    languages: config.languages,
    themes: config.themes,
    form: config.form,
    notifications: config.notifications,
    submission: config.submission,
    browseBy: config.browseBy,
    communityList: config.communityList,
    homePage: config.homePage,
    item: config.item,
    community: config.community,
    collection: config.collection,
    mediaViewer: config.mediaViewer,
    bundle: config.bundle,
    info: config.info,
    markdown: config.markdown,
    vocabularies: config.vocabularies,
    comcolSelectionSort: config.comcolSelectionSort,
    suggestion: config.suggestion,
    qualityAssuranceConfig: config.qualityAssuranceConfig,
    notifyMetrics: config.notifyMetrics,
    liveRegion: config.liveRegion,
    search: config.search,
    geospatialMapViewer: config.geospatialMapViewer,
    accessibility: config.accessibility,
    statistics: config.statistics,
    signpostingEnabled: config.signpostingEnabled,
  };
};
