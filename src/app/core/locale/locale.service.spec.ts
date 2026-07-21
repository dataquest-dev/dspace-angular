import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';

import { CookieService } from '../services/cookie.service';
import { CookieServiceMock } from '../../shared/mocks/cookie.service.mock';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { LANG_COOKIE, LANG_ORIGIN, LocaleService } from './locale.service';
import { AuthService } from '../auth/auth.service';
import { NativeWindowRef } from '../services/window.service';
import { RouteService } from '../services/route.service';
import { routeServiceStub } from '../../shared/testing/route-service.stub';

describe('LocaleService test suite', () => {
  let service: LocaleService;
  let serviceAsAny: any;
  let cookieService: CookieService;
  let translateService: TranslateService;
  let window;
  let spyOnGet;
  let spyOnSet;
  let authService;
  let routeService;
  let document;

  authService = jasmine.createSpyObj('AuthService', {
    isAuthenticated: jasmine.createSpy('isAuthenticated'),
    isAuthenticationLoaded: jasmine.createSpy('isAuthenticationLoaded')
  });

  const langList = ['en', 'xx', 'de'];

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock
          }
        }),
      ],
      providers: [
        { provide: CookieService, useValue: new CookieServiceMock() },
        { provide: AuthService, userValue: authService },
        { provide: RouteService, useValue: routeServiceStub },
        { provide: Document, useValue: document },
      ]
    });
  }));

  beforeEach(() => {
    cookieService = TestBed.inject(CookieService);
    translateService = TestBed.inject(TranslateService);
    routeService = TestBed.inject(RouteService);
    window = new NativeWindowRef();
    document = { documentElement: { lang: 'en' } };
    service = new LocaleService(window, cookieService, translateService, authService, routeService, document);
    serviceAsAny = service;
    spyOnGet = spyOn(cookieService, 'get');
    spyOnSet = spyOn(cookieService, 'set');
  });

  describe('getCurrentLanguageCode', () => {
    beforeEach(() => {
      spyOn(translateService, 'getLangs').and.returnValue(langList);
    });

    it('should return the language saved on cookie if it\'s a valid & active language', () => {
      spyOnGet.and.returnValue('de');
      expect(service.getCurrentLanguageCode()).toBe('de');
    });

    it('should return the default language if the cookie language is disabled', () => {
      spyOnGet.and.returnValue('disabled');
      expect(service.getCurrentLanguageCode()).toBe('en');
    });

    it('should return the default language if the cookie language does not exist', () => {
      spyOnGet.and.returnValue('does-not-exist');
      expect(service.getCurrentLanguageCode()).toBe('en');
    });

    it('should return language from browser setting', () => {
      spyOn(translateService, 'getBrowserLang').and.returnValue('xx');
      expect(service.getCurrentLanguageCode()).toBe('xx');
    });

    it('should return default language from config', () => {
      spyOn(translateService, 'getBrowserLang').and.returnValue('fr');
      expect(service.getCurrentLanguageCode()).toBe('en');
    });
  });

  describe('getLanguageCodeFromCookie', () => {
    it('should return language from cookie', () => {
      spyOnGet.and.returnValue('de');
      expect(service.getLanguageCodeFromCookie()).toBe('de');
    });

  });

  describe('saveLanguageCodeToCookie', () => {
    it('should save language to cookie', () => {
      service.saveLanguageCodeToCookie('en');
      expect(spyOnSet).toHaveBeenCalledWith(LANG_COOKIE, 'en');
    });
  });

  describe('setCurrentLanguageCode', () => {
    beforeEach(() => {
      spyOn(service, 'saveLanguageCodeToCookie');
      spyOn(translateService, 'use');
    });

    it('should set the given language', () => {
      service.setCurrentLanguageCode('xx');
      expect(translateService.use).toHaveBeenCalledWith('xx');
      expect(service.saveLanguageCodeToCookie).toHaveBeenCalledWith('xx');
    });

    it('should set the current language', () => {
      spyOn(service, 'getCurrentLanguageCode').and.returnValue('es');
      service.setCurrentLanguageCode();
      expect(translateService.use).toHaveBeenCalledWith('es');
      expect(service.saveLanguageCodeToCookie).toHaveBeenCalledWith('es');
    });

    it('should set the current language on the html tag', () => {
      spyOn(service, 'getCurrentLanguageCode').and.returnValue('es');
      service.setCurrentLanguageCode();
      expect((service as any).document.documentElement.lang).toEqual('es');
    });
  });

  describe('', () => {
    it('should set quality to current language list', () => {
      const langListWithQuality = ['en;q=1', 'xx;q=0.9', 'de;q=0.8'];
      spyOn(service, 'setQuality').and.returnValue(langListWithQuality);
      service.setQuality(langList, LANG_ORIGIN.BROWSER, false);
      expect(service.setQuality).toHaveBeenCalledWith(langList, LANG_ORIGIN.BROWSER, false);
    });

    it('should return the list of language with quality factor', () => {
      spyOn(service, 'getLanguageCodeList');
      service.getLanguageCodeList();
      expect(service.getLanguageCodeList).toHaveBeenCalled();
    });
  });

  describe('refreshAfterChangeLanguage', () => {
    let originalUi;
    let originalGetCurrentUrl;

    beforeEach(() => {
      // Pin the tested nameSpace value: environment is a shared mutable object and some specs
      // replace environment.ui entirely, so this test must not rely on the suite order.
      originalUi = (environment as any).ui;
      (environment as any).ui = Object.assign({}, originalUi, { nameSpace: '/angular-dspace' });
      originalGetCurrentUrl = (routeService as any).getCurrentUrl;
    });

    afterEach(() => {
      (environment as any).ui = originalUi;
      // routeServiceStub is a shared module-level singleton - restore it
      (routeService as any).getCurrentUrl = originalGetCurrentUrl;
    });

    it('should hard redirect to the absolute (nameSpace-aware) reload URL', fakeAsync(() => {
      // A relative 'reload/...' URL would be resolved against the current URL
      // (e.g. /items/<uuid>) and produce an invalid nested URL like /items/<uuid>/reload/...
      const currentUrl = '/items/1234';
      const fakeLocation = { href: '' };
      serviceAsAny._window = { nativeWindow: { location: fakeLocation } };
      (routeService as any).getCurrentUrl = jasmine.createSpy('getCurrentUrl').and.returnValue(of(currentUrl));

      service.refreshAfterChangeLanguage();
      tick();

      expect(fakeLocation.href).toMatch(new RegExp('^/angular-dspace/reload/[0-9]+\\?redirect=' + encodeURIComponent(currentUrl) + '$'));
    }));
  });
});
