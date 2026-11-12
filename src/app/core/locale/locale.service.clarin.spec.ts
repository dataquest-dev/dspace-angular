import { TestBed, waitForAsync } from '@angular/core/testing';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { CookieService } from '../services/cookie.service';
import { CookieServiceMock } from '../../shared/mocks/cookie.service.mock';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { LANG_COOKIE, LocaleService } from './locale.service';
import { AuthService } from '../auth/auth.service';
import { NativeWindowRef } from '../services/window.service';
import { RouteService } from '../services/route.service';
import { routeServiceStub } from '../../shared/testing/route-service.stub';
import { environment } from '../../../environments/environment';

/**
 * CLARIN-only additions to LocaleService.
 *
 * Kept in a separate file so `locale.service.spec.ts` stays byte-identical to upstream and does not
 * re-conflict on the next vanilla merge.
 */
describe('LocaleService CLARIN additions', () => {
  let service: LocaleService;
  let cookieService: CookieService;
  let translateService: TranslateService;
  let window;
  let spyOnGet;
  let authService;
  let routeService;
  let document;

  authService = jasmine.createSpyObj('AuthService', {
    isAuthenticated: jasmine.createSpy('isAuthenticated'),
    isAuthenticationLoaded: jasmine.createSpy('isAuthenticationLoaded'),
    getAuthenticatedUserFromStore: jasmine.createSpy('getAuthenticatedUserFromStore'),
  });

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
    spyOnGet = spyOn(cookieService, 'get');
  });

  describe('getCurrentLanguageCodeSync', () => {
    it('should return the language the UI is currently rendering in', () => {
      translateService.use('cs');
      expect(service.getCurrentLanguageCodeSync()).toBe('cs');
    });

    it('should fall back to the cookie before any language has been applied', () => {
      spyOnGet.withArgs(LANG_COOKIE).and.returnValue('de');
      expect(service.getCurrentLanguageCodeSync()).toBe('de');
    });

    it('should fall back to the default language when there is neither', () => {
      spyOnGet.and.returnValue(undefined);
      expect(service.getCurrentLanguageCodeSync()).toBe(environment.defaultLanguage);
    });

    it('should track setCurrentLanguageCode', () => {
      service.setCurrentLanguageCode('cs');
      expect(service.getCurrentLanguageCodeSync()).toBe('cs');
    });

    it('should be synchronous - the header and licence templates call it directly', () => {
      translateService.use('en');
      const result: string = service.getCurrentLanguageCodeSync();
      expect(typeof result).toBe('string');
    });
  });
});
