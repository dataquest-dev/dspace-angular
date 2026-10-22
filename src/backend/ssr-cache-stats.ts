import { createServer } from 'http';
import LRU from 'lru-cache';

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

export interface SsrCacheSnapshot {
  name: string;
  enabled: boolean;
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
 * `dump()`, `peek()` and `has()` leave recency and TTL untouched. Byte counting is O(total cached HTML).
 */
export function snapshotCache(name: string, cache: LRU<string, SsrCacheEntry> | undefined, enabled: boolean): SsrCacheSnapshot {
  const entries: SsrCacheEntryStats[] = [];
  if (cache) {
    for (const [key, { value }] of cache.dump()) {
      const remainingTtl = cache.getRemainingTTL(key);
      entries.push({
        key,
        htmlBytes: Buffer.byteLength(value.page, 'utf8'),
        remainingTtlMs: Number.isFinite(remainingTtl) ? Math.max(0, Math.round(remainingTtl)) : null,
        stale: !cache.has(key)
      });
    }
  }
  entries.sort((a, b) => b.htmlBytes - a.htmlBytes || a.key.localeCompare(b.key));
  return {
    name,
    enabled,
    maxEntries: cache ? cache.max : 0,
    configuredTtlMs: cache ? cache.ttl : 0,
    entryCount: entries.length,
    staleCount: entries.filter(entry => entry.stale).length,
    totalHtmlBytes: entries.reduce((sum, entry) => sum + entry.htmlBytes, 0),
    entries
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function renderStatsHtml(stats: SsrCacheStats): string {
  const summary = stats.caches.map(cache =>
    `<tr><th>${escapeHtml(cache.name)}</th><td>${cache.enabled}</td><td>${cache.entryCount} / ${cache.maxEntries}</td>` +
    `<td>${cache.staleCount}</td><td>${cache.totalHtmlBytes}</td></tr>`
  ).join('');
  const details = stats.caches.map(cache =>
    `<h2>${escapeHtml(cache.name)} entries</h2><p>Configured TTL: ${cache.configuredTtlMs} ms. ` +
    'HTML byte counts exclude object and V8 overhead.</p>' +
    '<table border="1"><thead><tr><th>Path</th><th>HTML bytes</th><th>Remaining TTL (ms)</th><th>Stale</th></tr></thead><tbody>' +
    cache.entries.map(entry =>
      `<tr><td>${escapeHtml(entry.key)}</td><td>${entry.htmlBytes}</td>` +
      `<td>${entry.remainingTtlMs === null ? 'unlimited' : entry.remainingTtlMs}</td><td>${entry.stale}</td></tr>`
    ).join('') + '</tbody></table>'
  ).join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><title>SSR cache stats</title><h1>SSR cache stats</h1>' +
    `<p>Node: ${escapeHtml(stats.host)}; PID: ${stats.pid}; instance: ${stats.instance}; generated: ${escapeHtml(stats.generatedAt)}; ` +
    `uptime: ${stats.uptimeSeconds} s; RSS: ${stats.memory.rss} bytes; heap used: ${stats.memory.heapUsed} bytes.</p>` +
    '<p>Each Node process has its own cache; this page reports this process only. <a href="?format=json">JSON</a></p>' +
    '<table border="1"><thead><tr><th>Cache</th><th>Enabled</th><th>Entries / limit</th><th>Stale</th><th>HTML bytes</th></tr></thead>' +
    `<tbody>${summary}</tbody></table>${details}</html>`;
}

/**
 * Serve the cache stats on 127.0.0.1:port (0 = ephemeral). Only GET /app/cache-stats answers; `?format=json` for JSON.
 * The request handler never throws; a failed bind surfaces on the returned server's 'error' event.
 */
export function startSsrCacheStatsServer(port: number, getStats: () => SsrCacheStats): ReturnType<typeof createServer> {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('SSR cache stats port must be an integer from 0 to 65535');
  }
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    let url: URL;
    try {
      url = new URL(request.url || '/', 'http://localhost');
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (request.method !== 'GET' || url.pathname !== SSR_CACHE_STATS_PATH) {
      response.writeHead(404).end();
      return;
    }
    const stats = getStats();
    if (url.searchParams.get('format') === 'json') {
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(stats));
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(renderStatsHtml(stats));
    }
  });
  return server.listen(port, '127.0.0.1');
}
