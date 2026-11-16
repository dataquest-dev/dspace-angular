import { AppConfig } from './app-config.interface';
import { DefaultAppConfig } from './default-app-config';
import { buildPublicConfig } from './public-config';

describe('buildPublicConfig', () => {
  const appConfig: AppConfig = {
    ...new DefaultAppConfig(),
    ui: {
      ssl: false,
      host: 'dspace-angular',
      port: 4000,
      nameSpace: '/',
      baseUrl: 'http://dspace-angular:4000/',
      rateLimiter: { windowMs: 60000, max: 500 },
      useProxies: true,
    },
    rest: {
      ssl: true,
      host: 'repository.example.org',
      port: 443,
      nameSpace: '/server',
      baseUrl: 'https://repository.example.org/server',
      ssrBaseUrl: 'http://dspace:8080/server',
    },
  };

  let publicConfig: any;

  beforeEach(() => {
    publicConfig = buildPublicConfig(appConfig);
  });

  it('should not contain the server settings', () => {
    expect(Object.keys(publicConfig.ui)).toEqual(['nameSpace']);
    expect(Object.keys(publicConfig.rest)).toEqual(['baseUrl', 'nameSpace']);
    expect(publicConfig.cache.serverSide).toBeUndefined();
    expect(publicConfig.actuators).toBeUndefined();
    expect(publicConfig.universal).toBeUndefined();
  });

  it('should contain the settings the browser reads', () => {
    expect(publicConfig.rest.baseUrl).toEqual('https://repository.example.org/server');
    expect(publicConfig.ui.nameSpace).toEqual('/');
    expect(publicConfig.cache.msToLive).toEqual(appConfig.cache.msToLive);
    expect(publicConfig.cache.control).toEqual(appConfig.cache.control);
    expect(publicConfig.cache.autoSync).toEqual(appConfig.cache.autoSync);
    expect(publicConfig.auth).toEqual({
      ui: appConfig.auth.ui,
      rest: { timeLeftBeforeTokenRefresh: appConfig.auth.rest.timeLeftBeforeTokenRefresh },
    });
    expect(publicConfig.matomo).toEqual(appConfig.matomo);
    expect(publicConfig.themes).toEqual(appConfig.themes);
  });
});
