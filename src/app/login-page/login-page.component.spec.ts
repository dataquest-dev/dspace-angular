import { NO_ERRORS_SCHEMA } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { of as observableOf, of } from 'rxjs';

import { XSRFService } from '../core/xsrf/xsrf.service';
import { LoginPageComponent } from './login-page.component';
import { ActivatedRouteStub } from '../shared/testing/active-router.stub';
import { AuthService } from '../core/auth/auth.service';
import { EPersonMock } from '../shared/testing/eperson.mock';

describe('LoginPageComponent', () => {
  let comp: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser = EPersonMock;
  const activatedRouteStub = Object.assign(new ActivatedRouteStub(), {
    params: observableOf({})
  });

  const store: Store<LoginPageComponent> = jasmine.createSpyObj('store', {
    /* eslint-disable no-empty,@typescript-eslint/no-empty-function */
    dispatch: {},
    /* eslint-enable no-empty, @typescript-eslint/no-empty-function */
    select: observableOf(true)
  });

  beforeEach(waitForAsync(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getAuthenticatedUserFromStore',
    ]);

    authServiceSpy.isAuthenticated.and.returnValue(of(false));
    authServiceSpy.getAuthenticatedUserFromStore.and.returnValue(of(mockUser));

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot()
      ],
      declarations: [LoginPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Store, useValue: store },
        { provide: XSRFService, useValue: {} },
        { provide: AuthService, useValue: authServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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
    it('should set authenticated user to user when user is authenticated', () => {
      authService.isAuthenticated.calls.reset();
      authService.getAuthenticatedUserFromStore.calls.reset();

      authService.isAuthenticated.and.returnValue(of(true));
      authService.getAuthenticatedUserFromStore.and.returnValue(of(mockUser));

      comp.initializeTheAuthenticationState();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(authService.getAuthenticatedUserFromStore).toHaveBeenCalled();

      expect(comp.authenticatedUser).toEqual(mockUser);
    });

    it('should set authenticatedUser to null when user is not authenticated', () => {
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
