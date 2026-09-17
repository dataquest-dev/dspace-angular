import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  Store,
  StoreModule,
} from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';

import { storeModuleConfig } from '../../../../app.reducer';
import { authReducer } from '../../../../core/auth/auth.reducer';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthMethod } from '../../../../core/auth/models/auth.method';
import { AuthMethodType } from '../../../../core/auth/models/auth.method-type';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { AuthorizationDataService } from '../../../../core/data/feature-authorization/authorization-data.service';
import { CookieService } from '../../../../core/services/cookie.service';
import { HardRedirectService } from '../../../../core/services/hard-redirect.service';
import { ConfigurationProperty } from '../../../../core/shared/configuration-property.model';
import { HELP_DESK_PROPERTY } from '../../../../item-page/tombstone/tombstone.constants';
import { CookieServiceMock } from '../../../mocks/cookie.service.mock';
import { getMockThemeService } from '../../../mocks/theme-service.mock';
import { NotificationsService } from '../../../notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../../remote-data.utils';
import { ActivatedRouteStub } from '../../../testing/active-router.stub';
import { AuthServiceStub } from '../../../testing/auth-service.stub';
import { AuthorizationDataServiceStub } from '../../../testing/authorization-service.stub';
import { NotificationsServiceStub } from '../../../testing/notifications-service.stub';
import { ThemeService } from '../../../theme-support/theme.service';
import {
  LogInPasswordComponent,
  SHOW_DISCOJUICE_POPUP_CACHE_NAME,
} from './log-in-password.component';

describe('LogInPasswordComponent', () => {

  let component: LogInPasswordComponent;
  let fixture: ComponentFixture<LogInPasswordComponent>;
  let page: Page;
  let initialState: any;
  let hardRedirectService: HardRedirectService;
  let configurationServiceSpy: jasmine.SpyObj<ConfigurationDataService>;
  let themeService = getMockThemeService();

  const HELP_DESK_EMAIL = 'help@example.org';

  beforeEach(() => {
    hardRedirectService = jasmine.createSpyObj('hardRedirectService', {
      getCurrentRoute: {},
    });

    configurationServiceSpy = jasmine.createSpyObj('configurationService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: HELP_DESK_PROPERTY,
        values: [HELP_DESK_EMAIL],
      })),
    });

    initialState = {
      core: {
        auth: {
          authenticated: false,
          loaded: false,
          blocking: false,
          loading: false,
          authMethods: [],
        },
      },
    };
  });

  beforeEach(waitForAsync(() => {
    // refine the test module by declaring the test component
    void TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        StoreModule.forRoot({ auth: authReducer }, storeModuleConfig),
        TranslateModule.forRoot(),
        LogInPasswordComponent,
      ],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: AuthorizationDataService, useClass: AuthorizationDataServiceStub },
        { provide: 'authMethodProvider', useValue: new AuthMethod(AuthMethodType.Password, 0) },
        { provide: 'isStandalonePage', useValue: true },
        { provide: HardRedirectService, useValue: hardRedirectService },
        { provide: CookieService, useValue: new CookieServiceMock() },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
        { provide: ThemeService, useValue: themeService },
        provideMockStore({ initialState }),
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
      ],
    })
      .compileComponents();

  }));

  beforeEach(async () => {
    // create component and test fixture
    fixture = TestBed.createComponent(LogInPasswordComponent);

    // get test component from the fixture
    component = fixture.componentInstance;

    // create page
    page = new Page(component, fixture);

    // verify the fixture is stable (no pending tasks)
    await fixture.whenStable();
    page.addPageElements();
  });

  it('should create a FormGroup comprised of FormControls', () => {
    fixture.detectChanges();
    expect(component.form instanceof UntypedFormGroup).toBe(true);
  });

  it('should authenticate', () => {
    fixture.detectChanges();

    // set FormControl values
    component.form.controls.email.setValue('user');
    component.form.controls.password.setValue('password');

    // submit form
    component.submit();

    // verify Store.dispatch() is invoked
    expect(page.navigateSpy.calls.any()).toBe(true, 'Store.dispatch not invoked');
  });

  describe('DiscoJuice auto-popup (SHOW_DISCOJUICE_POPUP cookie)', () => {
    let storage: any; // CookieServiceMock — typed as any so get() can return the stored boolean
    let popUpSpy: jasmine.Spy;

    beforeEach(() => {
      storage = TestBed.inject(CookieService) as unknown as CookieServiceMock;
      // Spy so we assert the trigger *decision* without scheduling the real timer/DOM popup.
      popUpSpy = spyOn(component as any, 'popUpDiscoJuiceLogin');
    });

    it('seeds the cookie to true on the first visit (cookie unset)', () => {
      storage.remove(SHOW_DISCOJUICE_POPUP_CACHE_NAME);
      (component as any).initializeDiscoJuiceCache();
      expect(storage.get(SHOW_DISCOJUICE_POPUP_CACHE_NAME)).toBe(true);
    });

    it('opens the popup when the cookie is true and keeps it true for the next visit', () => {
      storage.set(SHOW_DISCOJUICE_POPUP_CACHE_NAME, true);
      (component as any).toggleDiscojuiceLogin();
      expect(popUpSpy).toHaveBeenCalledTimes(1);
      expect(storage.get(SHOW_DISCOJUICE_POPUP_CACHE_NAME)).toBe(true);
    });

    it('suppresses the popup once when the cookie is false (user chose local login), then resets it to true', () => {
      storage.set(SHOW_DISCOJUICE_POPUP_CACHE_NAME, false);
      (component as any).toggleDiscojuiceLogin();
      expect(popUpSpy).not.toHaveBeenCalled();
      expect(storage.get(SHOW_DISCOJUICE_POPUP_CACHE_NAME)).toBe(true);
    });
  });

  // Standalone login reads the redirect target from the `redirectUrl` query param (set by aai.js).
  describe('standalone login redirect (redirectUrl query param)', () => {
    let authService: AuthServiceStub;
    let setRedirectUrlSpy: jasmine.Spy;
    let setRedirectUrlIfNotSetSpy: jasmine.Spy;

    const setQueryParams = (queryParams: Record<string, unknown>) => {
      (component as any).route = { snapshot: { queryParams } };
    };

    beforeEach(() => {
      authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
      setRedirectUrlSpy = spyOn(authService, 'setRedirectUrl').and.callThrough();
      setRedirectUrlIfNotSetSpy = spyOn(authService, 'setRedirectUrlIfNotSet').and.callThrough();
      // Avoid scheduling the real DiscoJuice popup timer during ngOnInit.
      spyOn(component as any, 'popUpDiscoJuiceLogin');

      fixture.detectChanges();
      component.form.controls.email.setValue('user');
      component.form.controls.password.setValue('password');
    });

    it('redirects back to the redirectUrl page, reduced to an app-relative path', () => {
      setQueryParams({ redirectUrl: 'http://dev-6.pc:8603/repository/search' });

      component.submit();

      expect(setRedirectUrlSpy).toHaveBeenCalledWith('/repository/search');
      expect(setRedirectUrlIfNotSetSpy).not.toHaveBeenCalled();
    });

    it('keeps the query string of the originating page', () => {
      setQueryParams({ redirectUrl: 'http://dev-6.pc:8603/repository/search?query=test' });

      component.submit();

      expect(setRedirectUrlSpy).toHaveBeenCalledWith('/repository/search?query=test');
    });

    it('prefers a nested redirectUrl so the login page is not the redirect target', () => {
      setQueryParams({
        redirectUrl: 'http://dev-6.pc:8603/repository/login?redirectUrl=http://dev-6.pc:8603/repository/items/1',
      });

      component.submit();

      expect(setRedirectUrlSpy).toHaveBeenCalledWith('/repository/items/1');
    });

    it('passes through an already-relative redirectUrl unchanged', () => {
      setQueryParams({ redirectUrl: '/repository/search' });

      component.submit();

      expect(setRedirectUrlSpy).toHaveBeenCalledWith('/repository/search');
    });

    it('falls back to setRedirectUrlIfNotSet("/") when no redirectUrl query param is present', () => {
      setQueryParams({});

      component.submit();

      expect(setRedirectUrlIfNotSetSpy).toHaveBeenCalledWith('/');
      expect(setRedirectUrlSpy).not.toHaveBeenCalled();
    });

    it('falls back cleanly when redirectUrl is not a string (repeated query param)', () => {
      setQueryParams({ redirectUrl: ['/repository/a', '/repository/b'] });

      component.submit();

      expect(setRedirectUrlIfNotSetSpy).toHaveBeenCalledWith('/');
      expect(setRedirectUrlSpy).not.toHaveBeenCalled();
    });
  });

  // The backend redirects a failed Shibboleth login to /login?error=shibboleth-authentication-failed.
  describe('failed Shibboleth login (error query param)', () => {
    let notificationsService: NotificationsServiceStub;

    const initWithQueryParams = (queryParams: Record<string, unknown>) => {
      (component as any).route = { snapshot: { queryParams } };
      component.ngOnInit();
    };

    beforeEach(() => {
      notificationsService = TestBed.inject(NotificationsService) as unknown as NotificationsServiceStub;

      // The real en.json5 strings, so the message below is genuinely interpolated rather than a key.
      const translateService = TestBed.inject(TranslateService);
      translateService.setTranslation('en', {
        'login.auth.failed.shibboleth.title': 'Shibboleth authentication failed',
        'login.auth.failed.shibboleth.message': 'Authentication failed because your IDP did not send the ' +
          'required Shibboleth headers. Please contact the Help Desk by email: {{ email }} .',
      }, true);
      translateService.use('en');

      // Avoid scheduling the real DiscoJuice popup timer during ngOnInit.
      spyOn(component as any, 'popUpDiscoJuiceLogin');
    });

    it('asks the server for the configured help desk address', () => {
      initWithQueryParams({ error: 'shibboleth-authentication-failed' });

      expect(configurationServiceSpy.findByPropertyName).toHaveBeenCalledWith(HELP_DESK_PROPERTY);
    });

    it('raises a persistent error notification carrying the help desk address', () => {
      initWithQueryParams({ error: 'shibboleth-authentication-failed' });

      expect(notificationsService.error).toHaveBeenCalledTimes(1);
      const [title, message, options] = notificationsService.error.calls.mostRecent().args;
      expect(title).toBe('Shibboleth authentication failed');
      expect(message).toContain(HELP_DESK_EMAIL);
      expect(message).not.toContain('{{');
      expect(options.timeOut).toBe(-1);
      expect(options.clickToClose).toBe(true);
    });

    it('stays silent for an unrelated error value', () => {
      initWithQueryParams({ error: 'something-else' });

      expect(notificationsService.error).not.toHaveBeenCalled();
    });

    it('stays silent on an ordinary login page with no error param', () => {
      initWithQueryParams({});

      expect(notificationsService.error).not.toHaveBeenCalled();
    });
  });

});

/**
 * I represent the DOM elements and attach spies.
 *
 * @class Page
 */
class Page {

  public emailInput: HTMLInputElement;
  public navigateSpy: jasmine.Spy;
  public passwordInput: HTMLInputElement;

  constructor(private component: LogInPasswordComponent, private fixture: ComponentFixture<LogInPasswordComponent>) {
    // use injector to get services
    const injector = fixture.debugElement.injector;
    const store = injector.get(Store);

    // add spies
    this.navigateSpy = spyOn(store, 'dispatch');
  }

  public addPageElements() {
    const emailInputSelector = 'input[formcontrolname=\'email\']';
    this.emailInput = this.fixture.debugElement.query(By.css(emailInputSelector)).nativeElement;

    const passwordInputSelector = 'input[formcontrolname=\'password\']';
    this.passwordInput = this.fixture.debugElement.query(By.css(passwordInputSelector)).nativeElement;
  }
}
