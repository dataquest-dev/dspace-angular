import './aai.js';

import { DefaultUrlSerializer } from '@angular/router';

describe('aai.js', () => {
  const aai = (window as any).aai;

  describe('localLoginUrl', () => {
    const redirectUrlOf = (loginUrl: string): string => {
      const url = new URL(loginUrl);
      return new DefaultUrlSerializer().parse(url.pathname + url.search).queryParams.redirectUrl;
    };

    it('keeps the query string of the page the user came from', () => {
      const page = 'http://localhost:4000/search?query=test&page=2';

      expect(redirectUrlOf(aai.localLoginUrl(page))).toBe(page);
    });

    it('keeps the page stored by the auth guard when local login starts on the login page', () => {
      const page = 'http://localhost:4000/login?redirectUrl=%2Fmydspace%3Fconfiguration%3Dworkflow';

      expect(redirectUrlOf(aai.localLoginUrl(page))).toBe(page);
    });
  });

  describe('shibbolethReturnUrl', () => {
    it('keeps a URL of this site, as local login puts it into the login URL', () => {
      const page = window.location.origin + '/items/1?query=test';

      expect(aai.shibbolethReturnUrl(page)).toBe(page);
    });

    it('turns a path into a URL of this site', () => {
      // The karma page has <base href="/">, so no namespace goes in front of the path.
      expect(aai.shibbolethReturnUrl('/mydspace')).toBe(window.location.origin + '/mydspace');
    });

    it('keeps the return on this site when the URL is of another site', () => {
      expect(aai.shibbolethReturnUrl('https://example.org/items/1').startsWith(window.location.origin + '/')).toBeTrue();
    });
  });

  describe('shibbolethLoginUrl', () => {
    const opts = { host: 'https://ui.example', port: '', target: 'https://ui.example/server/api/authn/shibboleth' };

    it('gives the backend the whole redirectUrl, with its own query string', () => {
      const page = 'https://ui.example/search?query=corpus&page=2';

      const loginUrl = new URL(aai.shibbolethLoginUrl(opts, page, 'https://idp.example/idp'));
      // The SP decodes `target` once and sends the user there; the backend then reads `redirectUrl` from it.
      const target = new URL(loginUrl.searchParams.get('target'));

      expect(target.origin + target.pathname).toBe(opts.target);
      expect(target.searchParams.get('redirectUrl')).toBe(page);
      expect(loginUrl.searchParams.get('entityID')).toBe('https://idp.example/idp');
    });
  });
});
