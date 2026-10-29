import {
  createServer,
  IncomingMessage,
  ServerResponse,
} from 'node:http';

import { LRUCache } from 'lru-cache';

export interface SsrCacheEntry {
  page: string;
  headers?: Record<string, unknown>;
}

export interface SsrCacheEntryStats {
  key: string;
  htmlBytes: number;
  remainingTtlMs: number | null;
  stale: boolean;
}

/** Request lookups since worker start; stale pages served count as hits. */
export interface SsrCacheCounters {
  hits: number;
  misses: number;
}

export interface SsrCacheSnapshot extends SsrCacheCounters {
  name: string;
  enabled: boolean;
  /** Hits / (hits + misses), or null before the first lookup. */
  hitRate: number | null;
  maxEntries: number;
  configuredTtlMs: number;
  entryCount: number;
  staleCount: number;
  totalHtmlBytes: number;
  entries: SsrCacheEntryStats[];
}

export interface SsrCacheStats {
  host: string;
  pid: number;
  instance: number;
  generatedAt: string;
  uptimeSeconds: number;
  memory: {
    rss: number;
    heapUsed: number;
  };
  caches: SsrCacheSnapshot[];
}

export const SSR_CACHE_STATS_PATH = '/app/cache-stats';

/**
 * Describe every entry resident in an SSR page cache, largest page first.
 * `dump()` visits stale entries too (unlike `forEach`, which skips them when `allowStale` is false);
 * `dump()` and `has()` leave recency and TTL untouched. Byte counting is O(total cached HTML).
 */
export function snapshotCache(name: string, cache: LRUCache<string, SsrCacheEntry> | undefined, enabled: boolean, counters?: SsrCacheCounters): SsrCacheSnapshot {
  const entries: SsrCacheEntryStats[] = [];
  if (cache) {
    for (const [key, { value }] of cache.dump()) {
      const remainingTtl = cache.getRemainingTTL(key);
      entries.push({
        key,
        htmlBytes: Buffer.byteLength(value.page, 'utf8'),
        remainingTtlMs: Number.isFinite(remainingTtl) ? Math.max(0, Math.round(remainingTtl)) : null,
        stale: !cache.has(key),
      });
    }
  }
  entries.sort((a, b) => b.htmlBytes - a.htmlBytes || a.key.localeCompare(b.key));
  const hits = counters?.hits ?? 0;
  const misses = counters?.misses ?? 0;
  return {
    name,
    enabled,
    hits,
    misses,
    hitRate: hits + misses > 0 ? hits / (hits + misses) : null,
    maxEntries: cache ? cache.max : 0,
    configuredTtlMs: cache ? cache.ttl : 0,
    entryCount: entries.length,
    staleCount: entries.filter(entry => entry.stale).length,
    totalHtmlBytes: entries.reduce((sum, entry) => sum + entry.htmlBytes, 0),
    entries,
  };
}

const LOOPBACK_ADDRESSES = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
/** Headers a reverse proxy adds; a request carrying one came through the proxy even if its socket is loopback. */
const PROXY_HEADERS = ['forwarded', 'via', 'x-real-ip'];
const PROXY_HEADER_PREFIX = 'x-forwarded-';

/**
 * True when the request was made directly on this host: loopback socket address and no proxy headers.
 * A same-host reverse proxy also connects from loopback, so the socket address alone is not enough.
 * A proxy that adds none of these headers cannot be told apart; use a separate port there instead.
 */
export function isDirectLoopbackRequest(request: IncomingMessage): boolean {
  const address = request.socket.remoteAddress;
  return address !== undefined && LOOPBACK_ADDRESSES.includes(address) &&
    !Object.keys(request.headers).some(header => PROXY_HEADERS.includes(header) || header.startsWith(PROXY_HEADER_PREFIX));
}

/** Request handler answering GET with the stats as JSON; any other method gets 404. */
export function createSsrCacheStatsHandler(getStats: () => SsrCacheStats): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'GET') {
      response.writeHead(404).end();
      return;
    }
    let body: string;
    try {
      body = JSON.stringify(getStats());
    } catch {
      response.writeHead(500).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(body);
  };
}

/**
 * Serve the cache stats on 127.0.0.1:port (0 = ephemeral) under /app/cache-stats only.
 * A failed bind surfaces on the returned server's 'error' event.
 */
export function startSsrCacheStatsServer(port: number, getStats: () => SsrCacheStats): ReturnType<typeof createServer> {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('SSR cache stats port must be an integer from 0 to 65535');
  }
  const handler = createSsrCacheStatsHandler(getStats);
  const server = createServer((request, response) => {
    if ((request.url || '/').split('?')[0] !== SSR_CACHE_STATS_PATH) {
      response.writeHead(404).end();
      return;
    }
    handler(request, response);
  });
  return server.listen(port, '127.0.0.1');
}
