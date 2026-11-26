import { of } from 'rxjs';

import { AppConfig } from '../../../config/app-config.interface';
import { ServerAuthService } from './server-auth.service';

describe('ServerAuthService', () => {
  let response: { redirect: jasmine.Spy };

  const createService = (nameSpace: string): ServerAuthService => {
    response = { redirect: jasmine.createSpy('redirect') };
    const appConfig = { ui: { nameSpace } } as AppConfig;
    // On the server there is no browser location, so the expired-session redirect is a 302.
    const nativeWindowRef = { nativeWindow: {} } as any;
    return new ServerAuthService({}, response, nativeWindowRef, null, null, null, null, null, of({}) as any, null, null, null, appConfig);
  };

  it('should send an expired session to the login page under the UI namespace', () => {
    createService('/repository').redirectToLoginWhenTokenExpired();

    expect(response.redirect).toHaveBeenCalledWith(302, '/repository/login?expired=true');
  });

  it('should send an expired session to /login when the UI runs at the root', () => {
    createService('/').redirectToLoginWhenTokenExpired();

    expect(response.redirect).toHaveBeenCalledWith(302, '/login?expired=true');
  });
});
