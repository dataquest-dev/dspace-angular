import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Params,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { APP_DATA_SERVICES_MAP } from '../../config/app-config.interface';
import { AuthService } from '../core/auth/auth.service';
import { XSRFService } from '../core/xsrf/xsrf.service';
import { AuthServiceMock } from '../shared/mocks/auth.service.mock';
import { ActivatedRouteStub } from '../shared/testing/active-router.stub';
import { EPersonMock } from '../shared/testing/eperson.mock';
import { RouterStub } from '../shared/testing/router.stub';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let comp: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: any;
  let router: RouterStub;

  const mockUser = EPersonMock;
  const activatedRouteStub = Object.assign(new ActivatedRouteStub(), {
    params: of({}),
  });

  const store: Store<LoginPageComponent> = jasmine.createSpyObj('store', {
    /* eslint-disable no-empty,@typescript-eslint/no-empty-function */
    dispatch: {},
    /* eslint-enable no-empty, @typescript-eslint/no-empty-function */
    select: of(true),
  });

  beforeEach(waitForAsync(() => {
    authService = Object.assign(new AuthServiceMock(), {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(of(false)),
      getAuthenticatedUserFromStore: jasmine.createSpy('getAuthenticatedUserFromStore').and.returnValue(of(mockUser)),
      getRedirectUrl: jasmine.createSpy('getRedirectUrl').and.returnValue(of(undefined)),
    });
    router = new RouterStub();

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        LoginPageComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: XSRFService, useValue: {} },
        { provide: APP_DATA_SERVICES_MAP, useValue: {} },
        provideMockStore({ initialState: { core: { auth: { authenticated: false } } } }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    comp = fixture.componentInstance; // SearchPageComponent test instance
    fixture.detectChanges();
  });

  it('should create instance', () => {
    expect(comp).toBeDefined();
  });

  describe('initializeTheAuthenticationState', () => {
    it('should set authenticatedUser to the user when the user is authenticated', () => {
      authService.isAuthenticated.calls.reset();
      authService.getAuthenticatedUserFromStore.calls.reset();

      authService.isAuthenticated.and.returnValue(of(true));
      authService.getAuthenticatedUserFromStore.and.returnValue(of(mockUser));

      comp.initializeTheAuthenticationState();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(authService.getAuthenticatedUserFromStore).toHaveBeenCalled();
      expect(comp.authenticatedUser).toEqual(mockUser);
    });

    it('should set authenticatedUser to null when the user is not authenticated', () => {
      authService.isAuthenticated.calls.reset();
      authService.getAuthenticatedUserFromStore.calls.reset();

      authService.isAuthenticated.and.returnValue(of(false));

      comp.initializeTheAuthenticationState();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(authService.getAuthenticatedUserFromStore).not.toHaveBeenCalled();
      expect(comp.authenticatedUser).toBeNull();
    });
  });

  // aai.js (DiscoJuice) takes the post-login target only from the `redirectUrl` query param of the page.
  describe('redirectUrl query param', () => {
    const initWith = (storedRedirectUrl: string, queryParams: Params = {}) => {
      authService.getRedirectUrl.and.returnValue(of(storedRedirectUrl));
      (comp as any).route = { queryParams: of(queryParams), snapshot: { queryParams } };
      comp.ngOnInit();
    };

    it('puts the page stored by the auth guard into the login URL', () => {
      initWith('/mydspace');

      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { redirectUrl: '/mydspace' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    it('keeps a redirectUrl that is already in the URL', () => {
      initWith('/mydspace', { redirectUrl: 'http://localhost:4000/login?redirectUrl=/mydspace' });

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('keeps a stored URL with an access token out of the login URL', () => {
      initWith('/bitstreams/123/download?accessToken=abc');

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('leaves the URL alone when no page is stored', () => {
      initWith(undefined);

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate on the server', () => {
      (comp as any).platformId = 'server';
      initWith('/mydspace');

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
