import { getDSORouteFromJson, getLegacyHandle, legacyHandleRedirect } from './legacy-handle-redirect';

describe('legacyHandleRedirect (server-side /handle fast path)', () => {

  describe('getLegacyHandle', () => {
    it('should return the handle for /handle/<prefix>/<suffix>', () => {
      expect(getLegacyHandle('/handle/15240/25')).toEqual('15240/25');
      expect(getLegacyHandle('/handle/123456789.1/a_b-c')).toEqual('123456789.1/a_b-c');
      // the Angular router ignores a trailing slash and decodes the segments
      expect(getLegacyHandle('/handle/15240/25/')).toEqual('15240/25');
      expect(getLegacyHandle('/handle/15240/%32%35')).toEqual('15240/25');
    });

    it('should return null for every other form, so that it is left to Angular', () => {
      expect(getLegacyHandle('/handle/15240')).toBeNull();
      expect(getLegacyHandle('/handle/15240/25/browse')).toBeNull();
      expect(getLegacyHandle('/handle/15240/%C5%BE')).toBeNull();
      expect(getLegacyHandle('/handle/15240%2F25')).toBeNull();
      expect(getLegacyHandle('/handle/15240/%E0%A4%A')).toBeNull();
      expect(getLegacyHandle('/handle/15240/25//')).toBeNull();
      expect(getLegacyHandle('/handle//25')).toBeNull();
      // /handle/handle/... and /handle/uuid/... are interpreted differently by LookupGuard
      expect(getLegacyHandle('/handle/handle/25')).toBeNull();
      expect(getLegacyHandle('/handle/uuid/25')).toBeNull();
      expect(getLegacyHandle('/items/15240/25')).toBeNull();
    });
  });

  describe('getDSORouteFromJson', () => {
    it('should return the same routes as getDSORoute', () => {
      expect(getDSORouteFromJson({ type: 'item', uuid: 'i1', metadata: {} })).toEqual('/items/i1');
      expect(getDSORouteFromJson({ type: 'item', uuid: 'i1', metadata: { 'dspace.entity.type': [{ value: 'Publication' }] } }))
        .toEqual('/entities/publication/i1');
      expect(getDSORouteFromJson({ type: 'collection', uuid: 'c1' })).toEqual('/collections/c1');
      expect(getDSORouteFromJson({ type: 'community', uuid: 'm1' })).toEqual('/communities/m1');
    });

    it('should return undefined for objects that LookupGuard does not redirect', () => {
      expect(getDSORouteFromJson({ type: 'bitstream', uuid: 'b1' })).toBeUndefined();
      expect(getDSORouteFromJson({ type: 'item' })).toBeUndefined();
      expect(getDSORouteFromJson(undefined)).toBeUndefined();
    });
  });

  describe('middleware', () => {
    let res: any;
    let next: jasmine.Spy;

    function request(url: string, forwardedFor?: string): any {
      return {
        url,
        path: url.split('?')[0],
        get: (name: string) => name === 'x-forwarded-for' ? forwardedFor : undefined,
        connection: { remoteAddress: '10.0.0.1' },
      };
    }

    beforeEach(() => {
      res = { headersSent: false, redirect: jasmine.createSpy('redirect') };
      next = jasmine.createSpy('next');
    });

    it('should redirect a resolvable handle without calling Angular', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'item', uuid: 'i1', metadata: {} } }));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25'), res, next);
      expect(get).toHaveBeenCalledWith('http://rest/server/api/pid/find?id=hdl%3A15240%2F25', { 'X-Forwarded-For': '10.0.0.1' });
      expect(res.redirect).toHaveBeenCalledWith(302, '/items/i1');
      expect(next).not.toHaveBeenCalled();
    });

    it('should prefix the UI namespace', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'collection', uuid: 'c1' } }));
      await legacyHandleRedirect('http://rest/server', '/repo/', get)(request('/handle/15240/25'), res, next);
      expect(res.redirect).toHaveBeenCalledWith(302, '/repo/collections/c1');
    });

    it('should fall through to Angular when the lookup fails (404, 401, network error)', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.reject({ response: { status: 404 } }));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/999'), res, next);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should fall through to Angular for objects it does not redirect', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'bitstream', uuid: 'b1' } }));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25'), res, next);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should not call the REST API for other paths', async () => {
      const get = jasmine.createSpy('get');
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25/browse'), res, next);
      expect(get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should forward the client IP received from a proxy, like ForwardClientIpInterceptor', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'item', uuid: 'i1', metadata: {} } }));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25', '192.0.2.7'), res, next);
      expect(get).toHaveBeenCalledWith(jasmine.any(String), { 'X-Forwarded-For': '192.0.2.7' });
    });

    it('should leave a malformed query string to Angular', async () => {
      const get = jasmine.createSpy('get');
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25?a=%'), res, next);
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25?a=%E0%A4%A'), res, next);
      expect(get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(2);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect with a valid query string (dropped, like LookupGuard)', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'item', uuid: 'i1', metadata: {} } }));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25?show=full&a=%C5%BE'), res, next);
      expect(res.redirect).toHaveBeenCalledWith(302, '/items/i1');
    });

    it('should fall through to Angular when the REST response cannot be mapped', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve(undefined));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25'), res, next);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should not redirect when the response has already been sent', async () => {
      res.headersSent = true;
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'item', uuid: 'i1', metadata: {} } }));
      await legacyHandleRedirect('http://rest/server', '/', get)(request('/handle/15240/25'), res, next);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
