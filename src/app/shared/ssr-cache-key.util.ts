import { Request } from 'express';
import { LANG_COOKIE } from '../core/locale/locale.service';

/**
 * Key of a server-side rendered page in the SSR page caches (see server.ts).
 * Besides path and query, an anonymous render depends on the request origin (protocol and Host header,
 * e.g. in `citation_pdf_url`) and on the language cookie, so they are part of the key.
 * @param req current request
 */
export function getSsrCacheKey(req: Request): string {
  return JSON.stringify([req.protocol, req.get('host'), req.cookies?.[LANG_COOKIE], req.url]);
}
