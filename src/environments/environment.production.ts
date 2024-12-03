import { BuildConfig } from '../config/build-config.interface';

export const environment: Partial<BuildConfig> = {
  production: true,

  // Angular Universal settings
  universal: {
    preboot: true,
    async: true,
    time: false,
    inlineCriticalCss: false,
  },

  matomo: {
    hostUrl: 'http://localhost:8135/',
    siteId: '1',
  }
};
