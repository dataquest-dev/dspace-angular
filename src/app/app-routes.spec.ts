import { Route } from '@angular/router';

import { APP_ROUTES } from './app-routes';
import { REGISTER_PATH } from './app-routing-paths';
import { notAuthenticatedGuard } from './core/auth/not-authenticated.guard';

describe('APP_ROUTES', () => {
  const childRoute = (path: string): Route => APP_ROUTES
    .find((route: Route) => route.path === '')
    .children.find((route: Route) => route.path === path);

  it('should let a logged-in user open the login page to see the already logged in panel', () => {
    const login: Route = childRoute('login');
    expect(login).toBeTruthy();
    expect(login.canActivate ?? []).not.toContain(notAuthenticatedGuard);
  });

  it('should keep the register page for anonymous users only', () => {
    expect(childRoute(REGISTER_PATH).canActivate).toContain(notAuthenticatedGuard);
  });
});
