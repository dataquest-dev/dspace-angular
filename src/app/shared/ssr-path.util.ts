import { Request } from 'express';

/**
 * Path that server.ts checks against ssr.excludePathPatterns.
 * A hard reload (after login, for example) goes through /reload/<time>?redirect=<url>.
 * That request follows the rules of its target.
 * @param req current request
 * @param nameSpace UI namespace, which the redirect url may start with
 */
export function getSsrPath(req: Request, nameSpace: string): string {
  const redirect = req.query.redirect;
  if (!req.path.startsWith('/reload/') || typeof redirect !== 'string') {
    return req.path;
  }
  const path = redirect.split(/[?#]/)[0];
  const prefix = nameSpace.replace(/\/$/, '');
  return prefix && path.startsWith(prefix + '/') ? path.substring(prefix.length) : path;
}
