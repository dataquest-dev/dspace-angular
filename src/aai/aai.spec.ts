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
});
