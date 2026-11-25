import { Injector } from '@angular/core';
import {
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  MatomoInitializerService,
  MatomoTracker,
} from 'ngx-matomo-client';
import { MatomoTestingModule } from 'ngx-matomo-client/testing';
import {
  firstValueFrom,
  of,
} from 'rxjs';

import { environment } from '../../environments/environment';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import {
  NativeWindowRef,
  NativeWindowService,
} from '../core/services/window.service';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { OrejimeService } from '../shared/cookies/orejime.service';
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../shared/remote-data.utils';
import {
  MATOMO_ENABLED,
  MATOMO_SITE_ID,
  MATOMO_TRACKER_URL,
  matomoConsentInterceptor,
  matomoItemDimensionInterceptor,
  MatomoService,
} from './matomo.service';

describe('MatomoService', () => {
  let service: MatomoService;
  let matomoTracker: jasmine.SpyObj<MatomoTracker>;
  let matomoInitializer: jasmine.SpyObj<MatomoInitializerService>;
  let orejimeService: jasmine.SpyObj<OrejimeService>;
  let nativeWindowService: jasmine.SpyObj<NativeWindowRef>;
  let configService: jasmine.SpyObj<ConfigurationDataService>;
  let paq: any[];

  beforeEach(() => {
    paq = [];
    matomoTracker = jasmine.createSpyObj('MatomoTracker', ['setConsentGiven', 'forgetConsentGiven', 'getVisitorId', 'setCustomDimension', 'deleteCustomDimension', 'setCustomRequestProcessing', 'trackPageView']);
    // like ngx-matomo, the tracker queues its commands for matomo.js
    matomoTracker.setConsentGiven.and.callFake(() => paq.push(['setConsentGiven']));
    matomoTracker.forgetConsentGiven.and.callFake(() => paq.push(['forgetConsentGiven']));
    matomoTracker.setCustomRequestProcessing.and.callFake((processor) => paq.push(['setCustomRequestProcessing', processor]));
    matomoTracker.trackPageView.and.callFake(() => paq.push(['trackPageView']));
    matomoInitializer = jasmine.createSpyObj('MatomoInitializerService', ['initializeTracker', 'initialize']);
    orejimeService = jasmine.createSpyObj('OrejimeService', ['getSavedPreferences']);
    orejimeService.getSavedPreferences.and.returnValue(of(undefined));
    nativeWindowService = jasmine.createSpyObj('NativeWindowService', [], { nativeWindow: { _paq: paq } });
    configService = jasmine.createSpyObj('ConfigurationDataService', ['findByPropertyName']);
    configService.findByPropertyName.and.returnValue(createFailedRemoteDataObject$());

    TestBed.configureTestingModule({
      imports: [MatomoTestingModule.forRoot()],
      providers: [
        { provide: MatomoTracker, useValue: matomoTracker },
        { provide: MatomoInitializerService, useValue: matomoInitializer },
        { provide: OrejimeService, useValue: orejimeService },
        { provide: NativeWindowService, useValue: nativeWindowService },
        { provide: ConfigurationDataService, useValue: configService },
        { provide: Injector, useValue: TestBed },
      ],
    });

    service = TestBed.inject(MatomoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set changeMatomoConsent on native window', () => {
    orejimeService.getSavedPreferences.and.returnValue(of({ matomo: true }));
    service.init();
    expect(nativeWindowService.nativeWindow.changeMatomoConsent).toBe(service.changeMatomoConsent);
  });

  it('should initialize tracker with values from angular configuration', () => {
    environment.production = true;
    environment.matomo = { trackerUrl: 'http://localhost:80801' };
    configService.findByPropertyName.withArgs(MATOMO_TRACKER_URL).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(),{ values: ['http://matomo'] })),
    );
    configService.findByPropertyName.withArgs(MATOMO_ENABLED).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(),{ values: ['true'] })),
    );
    configService.findByPropertyName.withArgs(MATOMO_SITE_ID).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { values: ['1'] })));
    orejimeService.getSavedPreferences.and.returnValue(of({ matomo: true }));

    service.init();

    expect(matomoInitializer.initializeTracker).toHaveBeenCalledWith({
      siteId: '1',
      trackerUrl: 'http://localhost:80801',
    });
  });

  it('should initialize tracker with REST configuration correct parameters in production', fakeAsync(() => {
    environment.production = true;
    environment.matomo = { trackerUrl: '' };
    configService.findByPropertyName.withArgs(MATOMO_TRACKER_URL).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(),{ values: ['http://example.com'] })),
    );
    configService.findByPropertyName.withArgs(MATOMO_ENABLED).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(),{ values: ['true'] })),
    );
    configService.findByPropertyName.withArgs(MATOMO_SITE_ID).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { values: ['1'] })));
    orejimeService.getSavedPreferences.and.returnValue(of({ matomo: true }));

    service.init();

    tick();

    expect(matomoInitializer.initializeTracker).toHaveBeenCalledWith({
      siteId: '1',
      trackerUrl: 'http://example.com',
    });
  }));

  it('should not initialize tracker if not in production', () => {
    environment.production = false;

    service.init();

    expect(matomoInitializer.initializeTracker).not.toHaveBeenCalled();
  });

  it('should not initialize tracker if matomo is disabled', () => {
    environment.production = true;
    environment.matomo = { trackerUrl: '' };
    configService.findByPropertyName.withArgs(MATOMO_TRACKER_URL).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(),{ values: ['http://example.com'] })),
    );
    configService.findByPropertyName.withArgs(MATOMO_ENABLED).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(),{ values: ['false'] })),
    );
    configService.findByPropertyName.withArgs(MATOMO_SITE_ID).and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { values: ['1'] })));
    orejimeService.getSavedPreferences.and.returnValue(of({ matomo: true }));

    service.init();

    expect(matomoInitializer.initializeTracker).not.toHaveBeenCalled();
  });

  describe('consent', () => {
    const trackerUrl = 'https://matomo.example.org/';
    let sent: string[];
    let consentCalls: string[];
    let runQueue: () => void;
    let previousEnvironment;

    const consent = (given: boolean) => nativeWindowService.nativeWindow.changeMatomoConsent(given);

    // The router's commands for one page view: url, interceptors, page view
    const routerPageView = (url: string) => {
      paq.push(['setCustomUrl', url]);
      TestBed.runInInjectionContext(() => matomoConsentInterceptor());
      paq.push(['trackPageView']);
    };

    // Runs the commands not run yet, like matomo.js: on load it runs the queued consent names first, requests go
    // through the request processor, and Matomo holds them while consent is required and sends the held ones on
    // setConsentGiven, skipping empty ones
    const createMatomo = () => {
      let processor = (request: string) => request;
      let url: string;
      let held: string[];
      const send = (request: string) => request && sent.push(request);
      const requireConsent = () => held = held ?? [];
      const matomo = {
        setCustomRequestProcessing: (fn) => processor = fn,
        setCustomUrl: (value) => url = value,
        trackPageView: () => held ? held.push(processor(`url=${url}`)) : send(processor(`url=${url}`)),
        requireConsent,
        forgetConsentGiven: () => {
          consentCalls.push('forgetConsentGiven');
          requireConsent();
        },
        setConsentGiven: () => {
          consentCalls.push('setConsentGiven');
          held?.forEach(send);
          held = undefined;
        },
      };
      const runFirstOnLoad = ['requireConsent', 'setConsentGiven'];
      const run = ([command, ...args]) => typeof command === 'function' ? command.apply(matomo, args) : matomo[command]?.(...args);
      let next = 0;
      let loaded = false;
      return () => {
        let commands = paq.slice(next);
        next = paq.length;
        if (!loaded) {
          loaded = true;
          commands = [
            ...commands.filter(([command]) => runFirstOnLoad.includes(command)),
            ...commands.filter(([command]) => !runFirstOnLoad.includes(command)),
          ];
        }
        commands.forEach(run);
      };
    };

    const configureMatomo = (enabled = 'true', siteId = '1') => {
      configService.findByPropertyName.withArgs(MATOMO_ENABLED).and.returnValue(
        createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { values: [enabled] })));
      configService.findByPropertyName.withArgs(MATOMO_SITE_ID).and.returnValue(
        createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { values: [siteId] })));
    };

    beforeEach(() => {
      previousEnvironment = { production: environment.production, matomo: environment.matomo, info: environment.info };
      environment.production = true;
      environment.matomo = { trackerUrl };
      environment.info = { ...environment.info, enableCookieConsentPopup: true };
      sent = [];
      consentCalls = [];
      runQueue = createMatomo();
      configureMatomo();
    });

    afterEach(() => {
      Object.assign(environment, previousEnvironment);
    });

    it('should load Matomo and track the current page only once the visitor consents', () => {
      service.init();
      routerPageView('/items/before-consent');
      routerPageView('/items/current');
      consent(false);

      expect(matomoInitializer.initializeTracker).not.toHaveBeenCalled();

      consent(true);
      runQueue();

      expect(matomoInitializer.initializeTracker).toHaveBeenCalledOnceWith({ siteId: '1', trackerUrl });
      expect(sent).toEqual(['url=/items/current']);
    });

    it('should stop tracking on revocation and never send activity from the declined period', () => {
      orejimeService.getSavedPreferences.and.returnValue(of({ matomo: true }));
      service.init();
      routerPageView('/accepted');
      runQueue();

      consent(false);
      routerPageView('/declined');
      routerPageView('/current');
      runQueue();

      expect(sent).toEqual(['url=/accepted']);
      expect(consentCalls).toEqual(['setConsentGiven', 'forgetConsentGiven']);

      consent(true);
      routerPageView('/next');
      runQueue();

      expect(sent).toEqual(['url=/accepted', 'url=/current', 'url=/next']);
      expect(matomoInitializer.initializeTracker).toHaveBeenCalledTimes(1);
    });

    it('should keep consent changes in order when they happen before Matomo has loaded', () => {
      service.init();
      routerPageView('/landing');
      consent(true);
      consent(false);
      routerPageView('/declined');
      routerPageView('/current');
      consent(true);
      runQueue();

      expect(sent).toEqual(['url=/landing', 'url=/current']);
    });

    it('should not load Matomo without a tracker URL and site ID', () => {
      [['false', '1'], ['true', '']].forEach(([enabled, siteId]) => {
        configureMatomo(enabled, siteId);
        service.init();
        consent(true);
      });
      environment.matomo = { trackerUrl: '' };
      configService.findByPropertyName.withArgs(MATOMO_TRACKER_URL).and.returnValue(createFailedRemoteDataObject$());
      configureMatomo();
      service.init();
      consent(true);

      expect(matomoInitializer.initializeTracker).not.toHaveBeenCalled();
      expect(matomoTracker.trackPageView).not.toHaveBeenCalled();
    });

    it('should track without consent when the consent popup is disabled', () => {
      environment.info = { ...environment.info, enableCookieConsentPopup: false };
      orejimeService.getSavedPreferences.and.returnValue(of({ matomo: false }));
      service.init();
      routerPageView('/items/current');
      runQueue();

      expect(matomoInitializer.initializeTracker).toHaveBeenCalled();
      expect(sent).toEqual(['url=/items/current']);
    });

    it('should add the visitor id to a download link only while the visitor consents', async () => {
      const url = 'http://example.com/';
      matomoTracker.getVisitorId.and.returnValue(Promise.resolve('12345'));
      service.init();

      expect(await firstValueFrom(service.appendVisitorId(url))).toBe(url);

      consent(true);

      expect(await firstValueFrom(service.appendVisitorId(url))).toBe('http://example.com/?trackerId=12345');

      consent(false);

      expect(await firstValueFrom(service.appendVisitorId(url))).toBe(url);
    });
  });

  describe('per-item custom dimension', () => {
    const handle = 'https://hdl.handle.net/123456789/1';
    let previousMatomoConfig;

    beforeEach(() => {
      previousMatomoConfig = environment.matomo;
      environment.matomo = { trackerUrl: '', dimensionId: 7 };
      service.matomoTracker = matomoTracker;
    });

    afterEach(() => {
      environment.matomo = previousMatomoConfig;
    });

    it('should report the item handle as the value of the configured dimension', () => {
      service.setItemHandle(handle);

      service.applyItemCustomDimension();

      expect(matomoTracker.setCustomDimension).toHaveBeenCalledWith(7, handle);
    });

    it('should report the item handle before the tracker has been initialised', () => {
      service.matomoTracker = undefined;
      service.setItemHandle(handle);

      service.applyItemCustomDimension();

      expect(matomoTracker.setCustomDimension).toHaveBeenCalledWith(7, handle);
    });

    it('should clear the dimension on a page that has no item handle', () => {
      service.applyItemCustomDimension();

      expect(matomoTracker.setCustomDimension).not.toHaveBeenCalled();
      expect(matomoTracker.deleteCustomDimension).toHaveBeenCalledWith(7);
    });

    it('should not attribute the next page view to the previous item', () => {
      service.setItemHandle(handle);
      service.applyItemCustomDimension();

      service.applyItemCustomDimension();

      expect(matomoTracker.deleteCustomDimension).toHaveBeenCalledWith(7);
    });

    it('should be applied by the router interceptor on the same service instance', () => {
      spyOn(service, 'applyItemCustomDimension');

      TestBed.runInInjectionContext(() => matomoItemDimensionInterceptor());

      expect(service.applyItemCustomDimension).toHaveBeenCalled();
    });

    it('should send nothing when dimensionId is not configured', () => {
      environment.matomo = { trackerUrl: '' };
      service.setItemHandle(handle);

      expect(() => service.applyItemCustomDimension()).not.toThrow();

      expect(matomoTracker.setCustomDimension).not.toHaveBeenCalled();
      expect(matomoTracker.deleteCustomDimension).not.toHaveBeenCalled();
    });
  });

});
