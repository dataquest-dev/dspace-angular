const assert = require('node:assert/strict');
const { once } = require('node:events');
const { connect } = require('node:net');
const { test } = require('node:test');
const { setTimeout: sleep } = require('node:timers/promises');
const LRU = require('lru-cache');

process.env.TS_NODE_PROJECT = 'tsconfig.ts-node.json';
require('ts-node/register/transpile-only');
const { snapshotCache, renderStatsHtml, startSsrCacheStatsServer } = require('../src/backend/ssr-cache-stats.ts');

const statsOf = (caches) => ({
  host: 'node-1', pid: 1, instance: 0, generatedAt: 'now', uptimeSeconds: 2,
  memory: { rss: 1, heapUsed: 1 }, caches
});

test('snapshot reports entries, HTML byte sizes and TTL without changing LRU order', () => {
  const cache = new LRU({ max: 3, ttl: 60000 });
  cache.set('/small', { page: 'é', headers: { 'content-type': 'text/html' } });
  cache.set('/large', { page: 'larger', headers: {} });
  const before = [...cache.keys()];

  const stats = snapshotCache('bot', cache, true);

  assert.equal(stats.entryCount, 2);
  assert.equal(stats.totalHtmlBytes, 8);
  assert.deepEqual(stats.entries.map(e => e.key), ['/large', '/small']);
  assert.equal(stats.maxEntries, 3);
  assert.equal(stats.configuredTtlMs, 60000);
  assert.equal(stats.entries[0].remainingTtlMs > 0, true);
  assert.equal(stats.entries[0].stale, false);
  assert.deepEqual([...cache.keys()], before);
});

test('snapshot counts expired entries even when the cache does not serve stale pages', async () => {
  const cache = new LRU({ max: 2, ttl: 1, allowStale: false });
  cache.set('/expired', { page: 'x' });
  await sleep(5);
  assert.equal(cache.size, 1);

  const stats = snapshotCache('anonymous', cache, true);

  assert.equal(stats.entryCount, 1);
  assert.equal(stats.staleCount, 1);
  assert.deepEqual(stats.entries[0], { key: '/expired', htmlBytes: 1, remainingTtlMs: 0, stale: true });
  assert.equal(cache.size, 1);
});

test('snapshot of a missing cache and of a cache without TTL', () => {
  assert.deepEqual(snapshotCache('bot', undefined, false), {
    name: 'bot', enabled: false, maxEntries: 0, configuredTtlMs: 0, entryCount: 0, staleCount: 0, totalHtmlBytes: 0, entries: []
  });
  const cache = new LRU({ max: 1 });
  cache.set('/forever', { page: 'x' });
  assert.equal(snapshotCache('bot', cache, true).entries[0].remainingTtlMs, null);
});

test('stats HTML escapes cache paths', () => {
  const cache = new LRU({ max: 2 });
  cache.set('/<script>alert(1)</script>', { page: 'x' });
  const html = renderStatsHtml(statsOf([snapshotCache('bot', cache, true)]));
  assert.match(html, /SSR cache stats/);
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;/);
});

test('stats server listens on loopback and answers only GET /app/cache-stats', async () => {
  const payload = statsOf([]);
  const server = startSsrCacheStatsServer(0, () => payload);
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.equal(address.address, '127.0.0.1');
    const base = `http://127.0.0.1:${address.port}`;

    const json = await fetch(`${base}/app/cache-stats?format=json`);
    assert.equal(json.status, 200);
    assert.equal(json.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await json.json(), payload);

    const html = await fetch(`${base}/app/cache-stats`);
    assert.equal(html.status, 200);
    assert.match(html.headers.get('content-type'), /^text\/html/);

    assert.equal((await fetch(`${base}/other`)).status, 404);
    assert.equal((await fetch(`${base}/app/cache-stats`, { method: 'POST' })).status, 404);

    const socket = connect(address.port, '127.0.0.1');
    await once(socket, 'connect');
    socket.end('GET //[ HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
    const chunks = [];
    socket.on('data', chunk => chunks.push(chunk));
    await once(socket, 'close');
    assert.match(Buffer.concat(chunks).toString(), /^HTTP\/1\.1 400 /);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('stats server reports a failed bind on its error event instead of throwing', async () => {
  const blocker = startSsrCacheStatsServer(0, () => statsOf([]));
  await once(blocker, 'listening');
  try {
    const clash = startSsrCacheStatsServer(blocker.address().port, () => statsOf([]));
    const [error] = await once(clash, 'error');
    assert.equal(error.code, 'EADDRINUSE');
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
});
