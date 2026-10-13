import { getCommunityPageRoute } from '../community-page/community-page-routing-paths';
import { getCollectionPageRoute } from '../collection-page/collection-page-routing-paths';
import { getEntityPageRoute } from '../item-page/item-page-routing-paths';
import { COMMUNITY } from '../core/shared/community.resource-type';
import { COLLECTION } from '../core/shared/collection.resource-type';
import { ITEM } from '../core/shared/item.resource-type';
import { Metadata } from '../core/shared/metadata.utils';
import { hasValue } from '../shared/empty.util';
import axios from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

/**
 * Server-side (Express) fast path for handle permalinks: /handle/<prefix>/<suffix>
 *
 * With Angular 13 and initialNavigation 'enabledBlocking', the SSR render of a resolvable /handle URL never
 * finishes: LookupGuard sends the hard redirect and then cancels the initial navigation, which never releases
 * the app initializer. Each such render stays in memory until the worker runs out of heap.
 * Here the handle is resolved with one REST call before Angular is started and answered with the same redirect
 * as DsoRedirectService (302 to the object's page). Everything else (other path forms, unknown or restricted
 * handles, objects without a page, REST errors) falls through to the normal SSR handling unchanged.
 */

// Only the plain permalink form (optionally with a trailing slash, which Angular ignores as well);
// other forms (extra segments, /handle/handle/..., /handle/uuid/...) are left to Angular.
const LEGACY_HANDLE_PATH = /^\/handle\/([^/]+)\/([^/]+)\/?$/;
const HANDLE_PART = /^[A-Za-z0-9._-]+$/;

/**
 * The handle (<prefix>/<suffix>) of a /handle/<prefix>/<suffix> path, or null for any other path.
 * Segments are percent-decoded like the Angular router does; anything outside [A-Za-z0-9._-] is left to Angular.
 * /handle/handle/... and /handle/uuid/... are excluded because LookupGuard interprets them differently.
 */
export function getLegacyHandle(path: string): string | null {
  const match = LEGACY_HANDLE_PATH.exec(path);
  if (match === null) {
    return null;
  }
  let prefix: string;
  let suffix: string;
  try {
    prefix = decodeURIComponent(match[1]);
    suffix = decodeURIComponent(match[2]);
  } catch (e) {
    return null;
  }
  if (!HANDLE_PART.test(prefix) || !HANDLE_PART.test(suffix) || prefix === 'handle' || prefix === 'uuid') {
    return null;
  }
  return `${prefix}/${suffix}`;
}

/**
 * The route of a DSpaceObject given as REST JSON; mirrors getDSORoute (undefined for other types).
 */
export function getDSORouteFromJson(dso: any): string | undefined {
  if (!hasValue(dso) || !hasValue(dso.uuid)) {
    return undefined;
  }
  switch (dso.type) {
    case COMMUNITY.value:
      return getCommunityPageRoute(dso.uuid);
    case COLLECTION.value:
      return getCollectionPageRoute(dso.uuid);
    case ITEM.value:
      return getEntityPageRoute(Metadata.firstValue(dso.metadata || {}, 'dspace.entity.type'), dso.uuid);
  }
  return undefined;
}

// Deadline for the REST lookup; when it is exceeded the lookup is aborted and the request falls through to SSR
// (which then does its own lookup, as before this fast path).
const LOOKUP_TIMEOUT_MS = 10000;

// Keep-alive agents, reused between requests (like ServerXhrService does for the SSR requests to REST);
// created on first use because this file is also loaded by the (browser) unit tests.
let agents: { httpAgent: HttpAgent, httpsAgent: HttpsAgent };

function restGet(url: string, headers: { [name: string]: string }, signal: AbortSignal): Promise<{ data: any }> {
  if (agents === undefined) {
    agents = { httpAgent: new HttpAgent({ keepAlive: true }), httpsAgent: new HttpsAgent({ keepAlive: true }) };
  }
  return axios.get(url, { ...agents, headers, signal });
}

/**
 * Whether the rest of the URL (query string, fragment) is one the Angular router parses without problems.
 * Anything else (a fragment, an undecodable value, a parameter named like an Object property such as
 * "hasOwnProperty") is left to Angular, which does not reach LookupGuard for some of these.
 */
function hasPlainQuery(url: string): boolean {
  if (url.includes('#')) {
    return false;
  }
  const index = url.indexOf('?');
  if (index < 0) {
    return true;
  }
  try {
    return url.substring(index + 1).split('&').every((param: string) => {
      const separator = param.indexOf('=');
      const key = decodeURIComponent(separator < 0 ? param : param.substring(0, separator));
      decodeURIComponent(separator < 0 ? '' : param.substring(separator + 1));
      return !(key in Object.prototype);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Express handler: redirect /handle/<prefix>/<suffix> to the object's page, or call next() to let SSR handle it.
 * The REST lookup is aborted after LOOKUP_TIMEOUT_MS (then SSR handles the request) or when the client goes away
 * (then nothing more is done).
 * @param restBaseUrl the REST API base URL (e.g. https://host/server)
 * @param nameSpace   the UI namespace (e.g. /)
 * @param get         HTTP GET returning the JSON body as `data`, rejecting on non-2xx or abort; axios by default
 */
export function legacyHandleRedirect(restBaseUrl: string, nameSpace: string,
                                     get: (url: string, headers: { [name: string]: string }, signal: AbortSignal) => Promise<{ data: any }> = restGet) {
  return (req, res, next): Promise<void> => {
    const handle = getLegacyHandle(req.path);
    if (handle === null || !hasPlainQuery(req.url)) {
      next();
      return Promise.resolve();
    }
    // forward the client IP like ForwardClientIpInterceptor does for the SSR requests (IP-based authorization)
    const headers = { 'X-Forwarded-For': req.get('x-forwarded-for') || req.connection.remoteAddress };
    const controller = new AbortController();
    let clientGone = false;
    const onClose = () => {
      clientGone = true;
      controller.abort();
    };
    const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
    res.once('close', onClose);
    return get(`${restBaseUrl}/api/pid/find?id=${encodeURIComponent('hdl:' + handle)}`, headers, controller.signal)
      .then((response) => getDSORouteFromJson(response.data))
      .catch(() => undefined)
      .then((route: string | undefined) => {
        clearTimeout(timer);
        res.removeListener('close', onClose);
        if (clientGone || res.headersSent) {
          return;
        }
        if (hasValue(route)) {
          res.redirect(302, nameSpace.replace(/\/$/, '') + route);
        } else {
          next();
        }
      })
      .catch((err) => next(err));
  };
}
