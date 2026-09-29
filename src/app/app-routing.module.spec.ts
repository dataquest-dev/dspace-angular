import { LOCATION_INITIALIZED } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Route, ROUTES } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { REGISTER_PATH } from './app-routing-paths';
import { notAuthenticatedGuard } from './core/auth/not-authenticated.guard';

describe('AppRoutingModule', () => {
  let childRoute: (path: string) => Route;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule],
      // never resolves, so the router does not start its initial navigation in the test
      providers: [{ provide: LOCATION_INITIALIZED, useValue: new Promise(() => undefined) }],
    });
    const routes: Route[] = [].concat(...TestBed.inject(ROUTES));
    childRoute = (path: string) => routes
      .find((route: Route) => route.path === '')
      .children.find((route: Route) => route.path === path);
  });

  it('should let a logged-in user open the login page to see the already logged in panel', () => {
    const login: Route = childRoute('login');
    expect(login).toBeTruthy();
    expect(login.canActivate ?? []).not.toContain(notAuthenticatedGuard);
  });

  it('should keep the register page for anonymous users only', () => {
    expect(childRoute(REGISTER_PATH).canActivate).toContain(notAuthenticatedGuard);
  });
});
