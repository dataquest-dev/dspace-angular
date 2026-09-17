import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
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
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let comp: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: any;

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
    });

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        LoginPageComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: AuthService, useValue: authService },
        { provide: XSRFService, useValue: {} },
        { provide: APP_DATA_SERVICES_MAP, useValue: {} },
        provideMockStore({}),
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
});
