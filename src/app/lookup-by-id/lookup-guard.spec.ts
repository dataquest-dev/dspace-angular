import { UrlTree } from '@angular/router';
import { of } from 'rxjs';

import { IdentifierType } from '../core/data/request.models';
import {
  createFailedRemoteDataObject,
  createSuccessfulRemoteDataObject,
} from '../shared/remote-data.utils';
import { lookupGuard } from './lookup-guard';

describe('lookupGuard', () => {
  let dsoService: any;
  let authService: any;
  let router: any;
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
      isAuthenticated: of(false),
      setRedirectUrl: {},
    });
    forbiddenUrlTree = new UrlTree();
    loginUrlTree = new UrlTree();
    router = jasmine.createSpyObj('router', ['parseUrl']);
    router.parseUrl.and.callFake((url: string) => url === '/403' ? forbiddenUrlTree : loginUrlTree);
    guard = lookupGuard;
  });

  it('should call findByIdAndIDType with handle params', () => {
    const scopedRoute = {
      params: {
        id: '1234',
        idType: '123456789',
      },
    };
    guard(scopedRoute as any, state, dsoService, authService, router);
    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('hdl:123456789/1234', IdentifierType.HANDLE);
  });

  it('should call findByIdAndIDType with encoded handle params', () => {
    const scopedRoute = {
      params: {
        id: '123456789%2F1234',
        idType: 'handle',
      },
    };
    guard(scopedRoute as any, state, dsoService, authService, router);
    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('hdl:123456789%2F1234', IdentifierType.HANDLE);
  });

  it('should call findByIdAndIDType with UUID params', () => {
    const scopedRoute = {
      params: {
        id: '34cfed7c-f597-49ef-9cbe-ea351f0023c2',
        idType: 'uuid',
      },
    };
    guard(scopedRoute as any, state, dsoService, authService, router);
    expect(dsoService.findByIdAndIDType).toHaveBeenCalledWith('34cfed7c-f597-49ef-9cbe-ea351f0023c2', IdentifierType.UUID);
  });

  describe('when the object was found', () => {
    it('should return false so the ObjectNotFound page is not shown', (done) => {
      guard(handleRoute, state, dsoService, authService, router).subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });
    });
  });

  describe('when the lookup fails with a 404', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Not found', 404)));
    });

    it('should return true so the ObjectNotFound page is shown', (done) => {
      guard(handleRoute, state, dsoService, authService, router).subscribe((result) => {
        expect(result).toBeTrue();
        expect(authService.setRedirectUrl).not.toHaveBeenCalled();
        expect(router.parseUrl).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('when the lookup fails with a 500', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Server error', 500)));
    });

    it('should return true so the ObjectNotFound page is shown', (done) => {
      guard(handleRoute, state, dsoService, authService, router).subscribe((result) => {
        expect(result).toBeTrue();
        expect(router.parseUrl).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('when the lookup fails with a 401 and the user is not authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Unauthorized', 401)));
      authService.isAuthenticated.and.returnValue(of(false));
    });

    it('should store the requested url and return a UrlTree to the login page', (done) => {
      guard(handleRoute, state, dsoService, authService, router).subscribe((result) => {
        expect(authService.setRedirectUrl).toHaveBeenCalledWith(state.url);
        expect(router.parseUrl).toHaveBeenCalledWith('login');
        expect(result).toBe(loginUrlTree);
        done();
      });
    });
  });

  describe('when the lookup fails with a 403 and the user is not authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Forbidden', 403)));
      authService.isAuthenticated.and.returnValue(of(false));
    });

    it('should store the requested url and return a UrlTree to the login page', (done) => {
      guard(handleRoute, state, dsoService, authService, router).subscribe((result) => {
        expect(authService.setRedirectUrl).toHaveBeenCalledWith(state.url);
        expect(router.parseUrl).toHaveBeenCalledWith('login');
        expect(result).toBe(loginUrlTree);
        done();
      });
    });
  });

  describe('when the lookup fails with a 403 and the user is authenticated', () => {
    beforeEach(() => {
      dsoService.findByIdAndIDType.and.returnValue(of(createFailedRemoteDataObject('Forbidden', 403)));
      authService.isAuthenticated.and.returnValue(of(true));
    });

    it('should return a UrlTree to the forbidden page and not touch the redirect url', (done) => {
      guard(handleRoute, state, dsoService, authService, router).subscribe((result) => {
        expect(authService.setRedirectUrl).not.toHaveBeenCalled();
        expect(router.parseUrl).toHaveBeenCalledWith('/403');
        expect(result).toBe(forbiddenUrlTree);
        done();
      });
    });
  });

});
