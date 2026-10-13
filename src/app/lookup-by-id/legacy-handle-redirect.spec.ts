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
    const item = { data: { type: 'item', uuid: 'i1', metadata: {} } };
    let res: any;
    let next: jasmine.Spy;

    function request(url: string, forwardedFor?: string): any {
      return {
        url,
        path: url.split(/[?#]/)[0],
        get: (name: string) => name === 'x-forwarded-for' ? forwardedFor : undefined,
        connection: { remoteAddress: '10.0.0.1' },
      };
    }

    function handle(url: string, get: jasmine.Spy, forwardedFor?: string): Promise<void> {
      return legacyHandleRedirect('http://rest/server', '/', get)(request(url, forwardedFor), res, next);
    }

    // a lookup that only settles when it is aborted
    function pendingGet(): jasmine.Spy {
      return jasmine.createSpy('get').and.callFake((url, headers, signal: AbortSignal) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      }));
    }

    beforeEach(() => {
      const listeners = {};
      res = {
        headersSent: false,
        redirect: jasmine.createSpy('redirect'),
        once: (event, listener) => listeners[event] = listener,
        removeListener: (event) => delete listeners[event],
        emit: (event) => listeners[event] && listeners[event](),
      };
      next = jasmine.createSpy('next');
    });

    it('should redirect a resolvable handle without calling Angular', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve(item));
      await handle('/handle/15240/25', get);
      expect(get).toHaveBeenCalledWith('http://rest/server/api/pid/find?id=hdl%3A15240%2F25', { 'X-Forwarded-For': '10.0.0.1' }, jasmine.anything());
      expect(res.redirect).toHaveBeenCalledWith(302, '/items/i1');
      expect(next).not.toHaveBeenCalled();
    });

    it('should prefix the UI namespace', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'collection', uuid: 'c1' } }));
      await legacyHandleRedirect('http://rest/server', '/repo/', get)(request('/handle/15240/25'), res, next);
      expect(res.redirect).toHaveBeenCalledWith(302, '/repo/collections/c1');
    });

    it('should forward the client IP received from a proxy, like ForwardClientIpInterceptor', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve(item));
      await handle('/handle/15240/25', get, '192.0.2.7');
      expect(get).toHaveBeenCalledWith(jasmine.any(String), { 'X-Forwarded-For': '192.0.2.7' }, jasmine.anything());
    });

    it('should redirect with a plain query string (dropped, like LookupGuard)', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve(item));
      await handle('/handle/15240/25?show=full&q=%C5%BE+x&flag', get);
      expect(res.redirect).toHaveBeenCalledWith(302, '/items/i1');
    });

    it('should leave query strings and fragments that Angular does not parse cleanly to Angular', async () => {
      const get = jasmine.createSpy('get');
      const urls = ['/handle/15240/25?a=%', '/handle/15240/25?a=%E0%A4%A', '/handle/15240/25?hasOwnProperty=x&a=1',
        '/handle/15240/25?__proto__=x', '/handle/15240/25#%', '/handle/15240/25#a'];
      for (const url of urls) {
        await handle(url, get);
      }
      expect(get).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(urls.length);
    });

    it('should fall through to Angular when the lookup fails (404, 401, network error)', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.reject({ response: { status: 404 } }));
      await handle('/handle/15240/999', get);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should fall through to Angular for objects it does not redirect', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: { type: 'bitstream', uuid: 'b1' } }));
      await handle('/handle/15240/25', get);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should fall through to Angular when the REST response cannot be mapped', async () => {
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve(undefined));
      await handle('/handle/15240/25', get);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should not call the REST API for other paths', async () => {
      const get = jasmine.createSpy('get');
      await handle('/handle/15240/25/browse', get);
      expect(get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should do nothing more when the response has already been sent', async () => {
      res.headersSent = true;
      const get = jasmine.createSpy('get').and.returnValue(Promise.resolve(item));
      await handle('/handle/15240/25', get);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    describe('lookup lifetime', () => {
      beforeEach(() => jasmine.clock().install());
      afterEach(() => jasmine.clock().uninstall());

      it('should abort a lookup that takes longer than 10 s and fall through to Angular', async () => {
        const get = pendingGet();
        const done = handle('/handle/15240/25', get);
        jasmine.clock().tick(9999);
        expect((get.calls.mostRecent().args[2] as AbortSignal).aborted).toBeFalse();
        jasmine.clock().tick(1);
        await done;
        expect((get.calls.mostRecent().args[2] as AbortSignal).aborted).toBeTrue();
        expect(res.redirect).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith();
      });

      it('should abort the lookup and do nothing more when the client goes away', async () => {
        const get = pendingGet();
        const done = handle('/handle/15240/25', get);
        res.emit('close');
        await done;
        expect((get.calls.mostRecent().args[2] as AbortSignal).aborted).toBeTrue();
        expect(res.redirect).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
