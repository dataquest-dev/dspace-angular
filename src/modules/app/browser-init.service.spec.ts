import { of as observableOf } from 'rxjs';
import { MATOMO_CONSENT_CALLBACK } from '../../app/statistics/matomo-consent-tracker';
import { BrowserInitService } from './browser-init.service';

describe('BrowserInitService', () => {
  const unrelatedInitSteps = ['checkAuthenticationToken', 'externalAuthCheck', 'initCorrelationId', 'checkEnvironment',
    'initI18n', 'initAngulartics', 'initGoogleAnalytics', 'initRouteListeners', 'trackAuthTokenExpiration', 'initKlaro'];
  let matomoQueue: any;

  beforeEach(() => {
    matomoQueue = (window as any)._paq;
    (window as any)._paq = [];
  });

  afterEach(() => {
    (window as any)._paq = matomoQueue;
    delete (window as any)[MATOMO_CONSENT_CALLBACK];
  });

  it('should route Angulartics Matomo tracking through the consent gate', async () => {
    const service = Object.create(BrowserInitService.prototype);
    const sendPageView = jasmine.createSpy('pageTrack');
    service.angulartics2Matomo = { pageTrack: sendPageView, eventTrack: undefined, startTracking: jasmine.createSpy() };
    service.themeService = jasmine.createSpyObj('themeService', ['listenForThemeChanges']);
    spyOn(service, 'loadAppState').and.resolveTo(true);
    spyOn(service, 'authenticationReady$').and.returnValue(observableOf(true));
    unrelatedInitSteps.forEach((step) => spyOn(service, step));

    await service.init()();
    service.angulartics2Matomo.eventTrack('page_view', { dc_identifier: 'item' });
    service.angulartics2Matomo.pageTrack('/items/item');

    expect(service.angulartics2Matomo.startTracking).toHaveBeenCalled();
    expect(sendPageView).not.toHaveBeenCalled();
    expect((window as any)._paq).toEqual([]);
  });
});
