import { MatomoConfig } from '../../config/matomo-config';
import { klaroConfiguration, MATOMO_KLARO_KEY } from '../shared/cookies/klaro-configuration';
import { MATOMO_CONSENT_CALLBACK, MatomoConsentTracker } from './matomo-consent-tracker';

describe('MatomoConsentTracker', () => {
  const config: MatomoConfig = { hostUrl: 'https://matomo.example.org/', siteId: '7', dimensionId: 3 };
  let browser: any;
  let page: Document;

  const createTracker = (matomoConfig: MatomoConfig, consentRequired = true) => new MatomoConsentTracker(
    browser, page, matomoConfig, (path: string) => browser._paq.push(['trackPageView', path]), consentRequired);
  const applyKlaroConsent = (consent: boolean) => browser[MATOMO_CONSENT_CALLBACK]?.(consent);
  const loadedScripts = () => page.querySelectorAll('script').length;
  const trackedPages = () => browser._paq.filter(([name]) => name === 'trackPageView').map(([, path]) => path);
  const requestProcessor = () => browser._paq.find(([name]) => name === 'setCustomRequestProcessing')?.[1];

  beforeEach(() => {
    browser = { _paq: [] };
    page = document.implementation.createHTMLDocument('matomo');
  });

  it('should load Matomo and track the current page only once the visitor consents', () => {
    const tracker = createTracker(config);
    tracker.eventTrack('page_view', { dc_identifier: 'current-item' });
    tracker.trackPage('/items/current');
    applyKlaroConsent(false);

    expect(loadedScripts()).toBe(0);
    expect(browser._paq).toEqual([]);

    applyKlaroConsent(true);

    expect(loadedScripts()).toBe(1);
    expect(trackedPages()).toEqual(['/items/current']);
    expect(browser._paq).toContain(['setCustomDimension', config.dimensionId, 'current-item']);
  });

  it('should stop tracking on revocation and never send activity from the declined period', () => {
    const tracker = createTracker(config);
    applyKlaroConsent(true);
    tracker.trackPage('/accepted');

    applyKlaroConsent(false);
    tracker.eventTrack('page_view', { dc_identifier: 'declined-item' });
    tracker.trackPage('/declined');
    tracker.trackPage('/current');
    tracker.eventTrack('page_view', { dc_identifier: 'declined-unfinished-navigation' });

    expect(browser._paq).toContain(['forgetConsentGiven']);
    expect(trackedPages()).toEqual(['/accepted']);
    expect(requestProcessor()?.('link=declined')).toBe('');

    applyKlaroConsent(true);
    tracker.trackPage('/next');

    expect(trackedPages()).toEqual(['/accepted', '/current', '/next']);
    expect(JSON.stringify(browser._paq)).not.toContain('declined');
    expect(requestProcessor()?.('link=accepted')).toBe('link=accepted');
    expect(loadedScripts()).toBe(1);
  });

  it('should not load Matomo without a tracker URL and site ID', () => {
    [undefined, { ...config, hostUrl: '' }, { ...config, siteId: '' }, { ...config, siteId: ' ' }].forEach((matomoConfig) => {
      const tracker = createTracker(matomoConfig);
      applyKlaroConsent(true);
      tracker.trackPage('/items/current');
    });

    expect(loadedScripts()).toBe(0);
    expect(browser._paq).toEqual([]);
  });

  it('should track without Klaro consent when the consent popup is explicitly disabled', () => {
    createTracker(config, false).trackPage('/items/current');

    expect(loadedScripts()).toBe(1);
    expect(trackedPages()).toEqual(['/items/current']);
  });

  describe('Klaro service', () => {
    afterEach(() => delete (window as any)[MATOMO_CONSENT_CALLBACK]);

    it('should ask for individual opt-in consent and forward it to the tracker', () => {
      const changeConsent = jasmine.createSpy(MATOMO_CONSENT_CALLBACK);
      (window as any)[MATOMO_CONSENT_CALLBACK] = changeConsent;
      const matomo = klaroConfiguration.services.find((service) => service.name === MATOMO_KLARO_KEY);

      expect(matomo?.required).toBeFalse();
      expect(matomo?.default).toBeFalsy();
      matomo?.callback?.(true);
      expect(changeConsent).toHaveBeenCalledWith(true);
    });
  });
});
