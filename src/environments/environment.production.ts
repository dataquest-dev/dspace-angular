import { BuildConfig } from '../config/build-config.interface';

export const environment: Partial<BuildConfig> = {
  production: true,

  // Angular Universal settings
  universal: {
    preboot: true,
    async: true,
    time: false,
    inlineCriticalCss: false,
    transferState: true,
    replaceRestUrl: true,
    excludePathPatterns: [
      {
        pattern: '^/communities/[a-f0-9-]{36}/browse(/.*)?$',
        flag: 'i',
      },
      {
        pattern: '^/collections/[a-f0-9-]{36}/browse(/.*)?$',
        flag: 'i',
      },
      // Scoped search + its facet links: the crawler trap that saturated SSR in production.
      {
        pattern: '^/communities/[a-f0-9-]{36}/search(/.*)?$',
        flag: 'i',
      },
      {
        pattern: '^/collections/[a-f0-9-]{36}/search(/.*)?$',
        flag: 'i',
      },
      { pattern: '^/browse/' },
      { pattern: '^/search' },
      { pattern: '^/community-list$' },
      { pattern: '^/statistics/?' },
      { pattern: '^/admin/' },
      { pattern: '^/processes/?' },
      { pattern: '^/notifications/' },
      { pattern: '^/access-control/' },
      { pattern: '^/health$' },
    ],
    enableSearchComponent: false,
    enableBrowseComponent: false,
  },
};
