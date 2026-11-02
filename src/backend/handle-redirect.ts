import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

import { TOKENITEM } from '../app/core/auth/models/auth-token-info.model';
import { HandleRedirectConfig } from '../config/ssr-config.interface';

/**
 * Avoid rendering Angular just to send its permanent handle redirect. PID /find only returns a
 * REST Location, which cannot distinguish /items from /entities. Discovery's exact handle lookup
 * embeds the permission-filtered, current database object (not indexed metadata) in one call.
 * Index misses, stale handles and anything uncertain keep the existing Angular behaviour.
 */
/** Default for a missing or invalid timeoutMs, so a bad value cannot turn every lookup into an instant abort. */
const DEFAULT_TIMEOUT_MS = 1000;
/** At most one warning per interval, so a scraper burst cannot flood the log. */
const WARN_INTERVAL_MS = 60_000;

export interface HandleRedirectOptions {
  /** Cache-Control of the 301. The Angular redirect gets the static-file value because handles contain a dot. */
  cacheControl?: string;
  fetchRest?: typeof fetch;
  warn?: (message: string) => void;
  now?: () => number;
}

/**
 * Avoid rendering Angular just to send its permanent handle redirect. PID /find only returns a
 * REST Location, which cannot distinguish /items from /entities. Discovery's exact handle lookup
 * embeds the permission-filtered, current database object (not indexed metadata) in one call.
 * Index misses, stale handles and anything uncertain keep the existing Angular behaviour.
 */
export function createHandleRedirectHandler(
  restBaseUrl: string,
  nameSpace: string,
  config: HandleRedirectConfig,
  options: HandleRedirectOptions = {},
): RequestHandler {
  const fetchRest = options.fetchRest ?? fetch;
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const now = options.now ?? Date.now;
  const timeoutMs = Number.isFinite(config?.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : DEFAULT_TIMEOUT_MS;
  // Failures fall through to Angular silently for the visitor; this keeps them visible to us.
  let failures = 0;
  let lastWarn = -Infinity;
  const failed = (reason: string) => {
    failures++;
    const at = now();
    if (at - lastWarn >= WARN_INTERVAL_MS) {
      warn(`Handle redirect lookup failed (${reason}); ${failures} failure(s) since the last warning, ` +
        'falling back to SSR.');
      failures = 0;
      lastWarn = at;
    }
  };

  const handler = async (req: Request, res: Response, next: NextFunction) => {
    // Keep unusual identifiers, matrix parameters and deeper/legacy bitstream paths in Angular.
    const match = /^\/handle\/(\d+(?:\.\d+)*)\/([a-zA-Z0-9._-]+)\/?$/.exec(req.path);
    if (!config?.enabled || (req.method !== 'GET' && req.method !== 'HEAD') || !match) {
      next();
      return;
    }
    // Logged-in users may see different entity metadata or need the end-user agreement guard.
    if (req.cookies?.[TOKENITEM] || req.headers.authorization) {
      next();
      return;
    }

    let path: string;
    let response: globalThis.Response;
    try {
      const handle = `${match[1]}/${match[2]}`;
      const url = new URL(`${restBaseUrl.replace(/\/$/, '')}/api/discover/search/objects`);
      url.searchParams.set('query', `handle:"${handle}"`);
      url.searchParams.set('size', '2');
      response = await fetchRest(url, {
        // Never follow a redirect or copy request headers: this lookup must remain anonymous.
        redirect: 'manual',
        headers: { Accept: 'application/hal+json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        failed(`HTTP ${response.status}`);
        await response.body?.cancel();
      } else {
        path = handlePath(await response.json(), handle);
      }
    } catch (error) {
      // Includes the body read in the timeout; SSR still owns errors, login and not-found pages.
      const err = error as { name?: string, message?: string };
      failed(err?.name === 'TimeoutError' ? `timeout after ${timeoutMs} ms` : (err?.message ?? err?.name ?? 'unknown error'));
      // Release a body left half-read by a failed json() or an abort.
      if (response?.body && !response.bodyUsed) {
        await response.body.cancel().catch(() => undefined);
      }
    }

    if (path) {
      // Match DsoRedirectService: configured UI namespace, no incoming query, relative Location.
      if (options.cacheControl) {
        res.set('Cache-Control', options.cacheControl);
      }
      res.redirect(301, nameSpace.replace(/\/$/, '') + path);
    } else {
      next();
    }
  };
  // Express 4 does not catch rejected promises from async middleware.
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

function handlePath(data: any, handle: string): string | undefined {
  const result = data?._embedded?.searchResult;
  const objects = result?._embedded?.objects;
  if (result?.page?.totalElements !== 1 || !Array.isArray(objects) || objects.length !== 1) {
    return;
  }
  const dso = objects[0]?._embedded?.indexableObject;
  if (dso?.handle !== handle || typeof dso.uuid !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dso.uuid)) {
    return;
  }
  switch (dso.type) {
    case 'community':
      return `/communities/${dso.uuid}`;
    case 'collection':
      return `/collections/${dso.uuid}`;
    case 'item': {
      if (!dso.metadata || typeof dso.metadata !== 'object' || Array.isArray(dso.metadata)) {
        return;
      }
      const values = dso.metadata['dspace.entity.type'];
      if (values !== undefined && (!Array.isArray(values) ||
          (values.length > 0 && (typeof values[0]?.value !== 'string' && values[0]?.value !== null)))) {
        return;
      }
      // Like getItemPageRoute, use the first visible metadata value, not the entityType property:
      // withdrawn items and hidden metadata can make those two values differ.
      const entityType = values?.[0]?.value;
      return entityType ? `/entities/${encodeURIComponent(entityType.toLowerCase())}/${dso.uuid}` : `/items/${dso.uuid}`;
    }
    default:
      return;
  }
}
