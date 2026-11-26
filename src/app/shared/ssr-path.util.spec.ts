import { Request } from 'express';

import { getSsrPath } from './ssr-path.util';

describe('getSsrPath', () => {
  function request(path: string, query: Record<string, unknown> = {}): Request {
    return { path, query } as unknown as Request;
  }

  it('should return the request path', () => {
    expect(getSsrPath(request('/items/abc'), '/')).toEqual('/items/abc');
  });

  it('should return the redirect target of a reload after login', () => {
    expect(getSsrPath(request('/reload/1', { redirect: '/access-control/bulk-access?page=2' }), '/'))
      .toEqual('/access-control/bulk-access');
  });

  it('should drop the UI namespace from the redirect target', () => {
    expect(getSsrPath(request('/reload/1', { redirect: '/repository/health' }), '/repository')).toEqual('/health');
  });

  it('should resolve a relative redirect target from the root, like the router', () => {
    expect(getSsrPath(request('/reload/1', { redirect: 'health' }), '/')).toEqual('/health');
  });

  it('should return the request path of a reload without a redirect', () => {
    expect(getSsrPath(request('/reload/1'), '/')).toEqual('/reload/1');
  });
});
