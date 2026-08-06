import { TestBed } from '@angular/core/testing';
import {
  Router,
  UrlTree,
} from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  of,
} from 'rxjs';
import { take } from 'rxjs/operators';

import { AuthService } from '../core/auth/auth.service';
import { DsoRedirectService } from '../core/data/dso-redirect.service';
import { IdentifierType } from '../core/data/request.models';
import { ServerResponseService } from '../core/services/server-response.service';
import {
  createFailedRemoteDataObject,
  createSuccessfulRemoteDataObject,
} from '../shared/remote-data.utils';
import { lookupGuard } from './lookup-guard';

describe('lookupGuard', () => {
  let dsoService: any;
  let authService: any;
  let router: any;
  let serverResponseService: any;
  // the guard is typed as CanActivateFn, so its injected parameters can only be passed positionally through `any`
  let guard: any;
  let forbiddenUrlTree: UrlTree;
  let loginUrlTree: UrlTree;

  const state: any = { url: '/handle/123456789/1234' };
  const handleRoute: any = {
    params: {
      id: '1234',
      idType: '123456789',
    },
  };

  beforeEach(() => {
    dsoService = {
      findByIdAndIDType: jasmine.createSpy('findByIdAndIDType')
        .and.returnValue(of(createSuccessfulRemoteDataObject(undefined))),
    };
    authService = jasmine.createSpyObj('authService', {
      // the real AuthService returns a store selector, which never completes
      isAuthenticated: new BehaviorSubject(false),
      setRedirectUrl: {},
    });
    forbiddenUrlTree = new UrlTree();
    loginUrlTree = new UrlTree();
    router = jasmine.createSpyObj('router', ['parseUrl']);
    router.parseUrl.and.callFake((url: string) => url === '/403' ? forbiddenUrlTree : loginUrlTree);
    serverResponseService = jasmine.createSpyObj('serverResponseService', ['setStatus']);
    guard = (route: any, routerState: any): Observable<boolean | UrlTree> =>
      (lookupGuard as any)(route, routerState, dsoService, authService, router, serverResponseService);
  });

  it('should call findByIdAndIDType with handle params', () => {
    const scopedRoute = {
      params: {
        id: '1234',
        idType: '123456789',
      },
    };
    guard(scopedRoute, state);
    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('hdl:123456789/1234', IdentifierType.HANDLE);
  });

  it('should call findByIdAndIDType with encoded handle params', () => {
    const scopedRoute = {
      params: {
        id: '123456789%2F1234',
        idType: 'handle',
      },
    };
    guard(scopedRoute, state);
    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('hdl:123456789%2F1234', IdentifierType.HANDLE);
  });

  it('should call findByIdAndIDType with UUID params', () => {
    const scopedRoute = {
      params: {
        id: '34cfed7c-f597-49ef-9cbe-ea351f0023c2',
        idType: 'uuid',
      },
    };
    guard(scopedRoute, state);
    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('34cfed7c-f597-49ef-9cbe-ea351f0023c2', IdentifierType.UUID);
  });

  it('should resolve its dependencies from the injector when they are not passed in', (done) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DsoRedirectService, useValue: dsoService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ServerResponseService, useValue: serverResponseService },
      ],
    });

    const result = TestBed.runInInjectionContext(() => lookupGuard(handleRoute, state)) as Observable<boolean | UrlTree>;

    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('hdl:123456789/1234', IdentifierType.HANDLE);
    result.subscribe((activate) => {
      expect(activate).toBeFalse();
      done();
    });
  });

  describe('when the object was found', () => {
    it('should return false so the ObjectNotFound page is not shown', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(result).toBeFalse();
        expect(serverResponseService.setStatus).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('when the lookup fails with a 404', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Not found', 404)));
    });

    it('should return true so the ObjectNotFound page is shown', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(result).toBeTrue();
        expect(authService.setRedirectUrl).not.toHaveBeenCalled();
        expect(router.parseUrl).not.toHaveBeenCalled();
        expect(serverResponseService.setStatus).not.toHaveBeenCalled();
        done();
      });
    });
  });

  // 501 is what the identifier endpoint answers for an unresolvable identifier type; 422 never
  // reaches this guard, but the fallback must treat every non-401/403 status the same way
  [501, 422, 500].forEach((statusCode: number) => {
    describe(`when the lookup fails with a ${statusCode}`, () => {
      beforeEach(() => {
        dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Failed', statusCode)));
      });

      it('should return true so the ObjectNotFound page is shown', (done) => {
        guard(handleRoute, state).subscribe((result) => {
          expect(result).toBeTrue();
          expect(authService.setRedirectUrl).not.toHaveBeenCalled();
          expect(router.parseUrl).not.toHaveBeenCalled();
          expect(serverResponseService.setStatus).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('when the lookup fails without a status code', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Network error', undefined)));
    });

    it('should return true so the ObjectNotFound page is shown', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(result).toBeTrue();
        expect(router.parseUrl).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('when the lookup fails with a 401 and the user is not authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Unauthorized', 401)));
      authService.isAuthenticated.and.returnValue(new BehaviorSubject(false));
    });

    it('should store the requested url and return a UrlTree to the login page', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(authService.setRedirectUrl).toHaveBeenCalledWith(state.url);
        expect(router.parseUrl).toHaveBeenCalledWith('login');
        expect(result).toBe(loginUrlTree);
        done();
      });
    });

    it('should set the server response status so the page is not cached as a 200', (done) => {
      guard(handleRoute, state).subscribe(() => {
        expect(serverResponseService.setStatus).toHaveBeenCalledWith(401);
        done();
      });
    });

    it('should emit exactly once and complete even though isAuthenticated() never completes', (done) => {
      let emissions = 0;
      guard(handleRoute, state).pipe(take(2)).subscribe({
        next: (result) => {
          emissions++;
          expect(result).toBe(loginUrlTree);
        },
        complete: () => {
          expect(emissions).toBe(1);
          done();
        },
      });
    });
  });

  describe('when the lookup fails with a 401 and the user is authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Unauthorized', 401)));
      authService.isAuthenticated.and.returnValue(new BehaviorSubject(true));
    });

    it('should return a UrlTree to the forbidden page', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(authService.setRedirectUrl).not.toHaveBeenCalled();
        expect(router.parseUrl).toHaveBeenCalledWith('/403');
        expect(result).toBe(forbiddenUrlTree);
        done();
      });
    });

    it('should set the server response status so the page is not cached as a 200', (done) => {
      guard(handleRoute, state).subscribe(() => {
        expect(serverResponseService.setStatus).toHaveBeenCalledWith(401);
        done();
      });
    });
  });

  describe('when the lookup fails with a 403 and the user is not authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Forbidden', 403)));
      authService.isAuthenticated.and.returnValue(new BehaviorSubject(false));
    });

    it('should store the requested url and return a UrlTree to the login page', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(authService.setRedirectUrl).toHaveBeenCalledWith(state.url);
        expect(router.parseUrl).toHaveBeenCalledWith('login');
        expect(result).toBe(loginUrlTree);
        done();
      });
    });

    it('should set the server response status so the page is not cached as a 200', (done) => {
      guard(handleRoute, state).subscribe(() => {
        expect(serverResponseService.setStatus).toHaveBeenCalledWith(403);
        done();
      });
    });
  });

  describe('when the lookup fails with a 403 and the user is authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Forbidden', 403)));
      authService.isAuthenticated.and.returnValue(new BehaviorSubject(true));
    });

    it('should return a UrlTree to the forbidden page and not touch the redirect url', (done) => {
      guard(handleRoute, state).subscribe((result) => {
        expect(authService.setRedirectUrl).not.toHaveBeenCalled();
        expect(router.parseUrl).toHaveBeenCalledWith('/403');
        expect(result).toBe(forbiddenUrlTree);
        done();
      });
    });

    it('should set the server response status so the page is not cached as a 200', (done) => {
      guard(handleRoute, state).subscribe(() => {
        expect(serverResponseService.setStatus).toHaveBeenCalledWith(403);
        done();
      });
    });
  });

});
