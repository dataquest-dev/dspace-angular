const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const { setTimeout: sleep } = require('node:timers/promises');

process.env.TS_NODE_PROJECT = 'tsconfig.ts-node.json';
// tsconfig.json uses moduleResolution 'bundler', which ts-node cannot combine with the commonjs output it needs.
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'commonjs', moduleResolution: 'node10' });
require('ts-node/register/transpile-only');
const {
  SsrPageCache, snapshotCache, startSsrCacheStatsServer, isDirectLoopbackRequest
} = require('../src/backend/ssr-cache-stats.ts');

const statsOf = (caches) => ({
  host: 'node-1', pid: 1, instance: 0, generatedAt: 'now', uptimeSeconds: 2,
  memory: { rss: 1, heapUsed: 1 }, caches
});

test('request lookups count hits and misses independently of cache population and stats polling', () => {
  const bot = new SsrPageCache({ max: 2 });
  const anonymous = new SsrPageCache({ max: 2 });
  bot.set('/page', { page: 'html' });
  assert.equal(bot.get('/page').page, 'html');
  assert.equal(bot.has('/page'), true);
  assert.equal(snapshotCache('bot', bot, true).hitRate, null);

  assert.equal(bot.getForRequest('/page').page, 'html');
  assert.equal(bot.getForRequest('/missing'), undefined);
  assert.equal(bot.getForRequest('/page').page, 'html');
  for (let i = 0; i < 2; i++) {
    const stats = snapshotCache('bot', bot, true);
    assert.equal(stats.hits, 2);
    assert.equal(stats.misses, 1);
    assert.equal(stats.hitRate, 2 / 3);
  }
  const other = snapshotCache('anonymous', anonymous, true);
  assert.equal(other.hits, 0);
  assert.equal(other.misses, 0);
  assert.equal(other.hitRate, null);
});

test('expired pages count as hits only when served stale', async () => {
  for (const allowStale of [true, false]) {
    const cache = new SsrPageCache({ max: 2, ttl: 1, allowStale });
    cache.set('/expired', { page: 'html' });
    await sleep(10);
    assert.equal(cache.getForRequest('/expired')?.page, allowStale ? 'html' : undefined);
    assert.equal(cache.hits, allowStale ? 1 : 0);
    assert.equal(cache.misses, allowStale ? 0 : 1);
    assert.equal(cache.getForRequest('/expired'), undefined);
    assert.equal(cache.misses, allowStale ? 1 : 2);
  }
});

test('eviction does not reset request counters', () => {
  const cache = new SsrPageCache({ max: 1 });
  cache.set('/first', { page: 'first' });
  cache.getForRequest('/first');
  cache.set('/second', { page: 'second' });
  cache.getForRequest('/first');
  assert.equal(cache.hits, 1);
  assert.equal(cache.misses, 1);
});

test('snapshot reports entries, HTML byte sizes and TTL without changing LRU order', () => {
  const cache = new SsrPageCache({ max: 3, ttl: 60000 });
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
  const cache = new SsrPageCache({ max: 2, ttl: 1, allowStale: false });
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
    name: 'bot', enabled: false, hits: 0, misses: 0, hitRate: null,
    maxEntries: 0, configuredTtlMs: 0, entryCount: 0, staleCount: 0, totalHtmlBytes: 0, entries: []
  });
  const cache = new SsrPageCache({ max: 1 });
  cache.set('/forever', { page: 'x' });
  assert.equal(snapshotCache('bot', cache, true).entries[0].remainingTtlMs, null);
});

test('stats server listens on loopback and answers only GET /app/cache-stats', async () => {
  const cache = new SsrPageCache({ max: 2 });
  cache.set('/page', { page: 'html' });
  cache.getForRequest('/page');
  cache.getForRequest('/missing');
  const payload = statsOf([snapshotCache('bot', cache, true)]);
  const server = startSsrCacheStatsServer(0, () => statsOf([snapshotCache('bot', cache, true)]));
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.equal(address.address, '127.0.0.1');
    const base = `http://127.0.0.1:${address.port}`;

    const json = await fetch(`${base}/app/cache-stats`);
    assert.equal(json.status, 200);
    assert.equal(json.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await json.json(), payload);

    assert.equal((await fetch(`${base}/app/cache-stats?x=1`)).status, 200);
    assert.equal((await fetch(`${base}/other`)).status, 404);
    assert.equal((await fetch(`${base}/app/cache-stats/`)).status, 404);
    assert.equal((await fetch(`${base}/app/cache-stats`, { method: 'HEAD' })).status, 404);
    assert.equal((await fetch(`${base}/app/cache-stats`, { method: 'POST' })).status, 404);
    assert.equal(cache.hits, 1);
    assert.equal(cache.misses, 1);

  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('stats server answers 500 when the snapshot throws', async () => {
  const server = startSsrCacheStatsServer(0, () => { throw new Error('boom'); });
  try {
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/app/cache-stats`);
    assert.equal(response.status, 500);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('direct loopback check accepts local sockets without proxy headers only', () => {
  const request = (remoteAddress, headers = {}) => ({ socket: { remoteAddress }, headers });
  for (const address of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    assert.equal(isDirectLoopbackRequest(request(address)), true, address);
  }
  for (const address of ['10.0.0.5', '::ffff:10.0.0.5', '0.0.0.0', '', undefined]) {
    assert.equal(isDirectLoopbackRequest(request(address)), false, String(address));
  }
  for (const header of ['forwarded', 'via', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port', 'x-forwarded-ssl', 'x-real-ip']) {
    assert.equal(isDirectLoopbackRequest(request('127.0.0.1', { [header]: '' })), false, header);
  }
  assert.equal(isDirectLoopbackRequest(request('127.0.0.1', { 'user-agent': 'curl' })), true);
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
