import { BuildConfig } from '../config/build-config.interface';

export const environment: Partial<BuildConfig> = {
  production: true,

  // Angular SSR (Server Side Rendering) settings
  //
  // NOTE (CLARIN/LINDAT port): a transiently failing HAL root-endpoint request during the server
  // render used to get cached and poison every root-link lookup in that render (HTTP 500 on all
  // SSR pages). HALEndpointService now retries such payload-less responses with a fresh, uncached
  // request (see getEndpointMapAt), which keeps SSR stable.
  ssr: {
    enabled: true,
    enablePerformanceProfiler: false,
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
