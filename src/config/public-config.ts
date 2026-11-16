import { AppConfig } from './app-config.interface';

/**
 * Returns only the part of the app config the browser needs.
 * It is written to config.json and to the SSR transfer state.
 */
export const buildPublicConfig = (appConfig: AppConfig) => ({
  production: appConfig.production,
  ...(appConfig.rest && {
    rest: {
      baseUrl: appConfig.rest.baseUrl,
      nameSpace: appConfig.rest.nameSpace,
    },
  }),
  ...(appConfig.ui ? { ui: { nameSpace: appConfig.ui.nameSpace } } : {}),
  auth: {
    ui: {
      timeUntilIdle: appConfig.auth?.ui?.timeUntilIdle,
      idleGracePeriod: appConfig.auth?.ui?.idleGracePeriod,
    },
    rest: {
      timeLeftBeforeTokenRefresh: appConfig.auth?.rest?.timeLeftBeforeTokenRefresh,
    },
  },
  cache: {
    msToLive: appConfig.cache?.msToLive,
    control: appConfig.cache?.control,
    autoSync: appConfig.cache?.autoSync,
  },
  languages: appConfig.languages,
  defaultLanguage: appConfig.defaultLanguage,
  themes: appConfig.themes,
  form: appConfig.form,
  notifications: appConfig.notifications,
  submission: appConfig.submission,
  browseBy: appConfig.browseBy,
  communityList: appConfig.communityList,
  homePage: appConfig.homePage,
  item: appConfig.item,
  collection: appConfig.collection,
  mediaViewer: appConfig.mediaViewer,
  bundle: appConfig.bundle,
  info: appConfig.info,
  markdown: appConfig.markdown,
  vocabularies: appConfig.vocabularies,
  comcolSelectionSort: appConfig.comcolSelectionSort,
  liveRegion: appConfig.liveRegion,
  search: appConfig.search,
  accessibility: appConfig.accessibility,
  signpostingEnabled: appConfig.signpostingEnabled,
  ...(appConfig.matomo && {
    matomo: {
      enabled: appConfig.matomo.enabled,
      hostUrl: appConfig.matomo.hostUrl,
      siteId: appConfig.matomo.siteId,
      dimensionId: appConfig.matomo.dimensionId,
    },
  }),
  debug: appConfig.debug,
});
