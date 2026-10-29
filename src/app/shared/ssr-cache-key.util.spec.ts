import { Request } from 'express';

import { getSsrCacheKey } from './ssr-cache-key.util';
import { LANG_COOKIE } from '../core/locale/locale.service';

describe('getSsrCacheKey', () => {
  function request(protocol: string, host: string, cookies: Record<string, string> = {}): Request {
    return { url: '/static/about', protocol, get: () => host, cookies } as unknown as Request;
  }

  it('should separate renders for different language cookies', () => {
    expect(getSsrCacheKey(request('https', 'repo.example', { [LANG_COOKIE]: 'cs' })))
      .not.toEqual(getSsrCacheKey(request('https', 'repo.example', { [LANG_COOKIE]: 'en' })));
  });

  it('should separate renders for different request origins', () => {
    const key = getSsrCacheKey(request('https', 'repo.example'));
    expect(getSsrCacheKey(request('https', 'attacker.example'))).not.toEqual(key);
    expect(getSsrCacheKey(request('http', 'repo.example'))).not.toEqual(key);
  });
});
