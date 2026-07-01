import { BuildConfig } from '../config/build-config.interface';

export const environment: Partial<BuildConfig> = {
  production: true,

  // Angular SSR (Server Side Rendering) settings
  //
  // SSR is currently disabled for the CLARIN/LINDAT port: several customized pages (item view,
  // login/register, home) crash during the server-side render because an early HAL root-endpoint
  // request made before the SSR HTTP layer is ready fails and the cached error poisons every
  // later root-link lookup in that render (HTTP 500). The application renders correctly client
  // side, so it is served fully CSR until the SSR root-resolution race is fixed at its source.
  // (DSpace already CSRs many routes via excludePathPatterns below.)
  ssr: {
    enabled: false,
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
