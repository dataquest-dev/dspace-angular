const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('node:http');
const { test } = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');

process.env.TS_NODE_PROJECT = 'tsconfig.ts-node.json';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'commonjs', moduleResolution: 'node10' });
require('ts-node/register/transpile-only');
const { createHandleRedirectHandler } = require('../src/backend/handle-redirect.ts');

const uuid = '0a5dea88-11ae-445f-851e-e336e06b1278';
const handle = '20.500.14390/47366';
const handleUrl = `/handle/${handle}`;
const object = (type = 'item', metadata = {}) => ({ type, uuid, handle, metadata });
const searchResult = (dso) => ({ _embedded: { searchResult: {
  page: { totalElements: dso ? 1 : 0 },
  _embedded: { objects: dso ? [{ _embedded: { indexableObject: dso } }] : [] }
} } });

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

async function fixture(t, options = {}) {
  const requests = [];
  const backend = createServer((req, res) => {
    requests.push({ url: req.url, headers: req.headers, method: req.method });
    if (options.backend) {
      options.backend(req, res);
    } else {
      res.setHeader('Content-Type', 'application/hal+json');
      res.end(JSON.stringify(options.data ?? searchResult(object())));
    }
  });
  const rest = await listen(backend);
  const app = express();
  app.use(cookieParser());
  const router = express.Router();
  router.get(/^\/handle\/[^/]+\/[^/]+\/?$/, createHandleRedirectHandler(
    `${rest}/internal/server/`, options.namespace ?? '/',
    { enabled: options.enabled ?? true, timeoutMs: options.timeoutMs ?? 1000 }, options.fetchRest
  ));
  router.use((req, res) => res.status(418).json({
    method: req.method, url: req.url, originalUrl: req.originalUrl, cookies: req.cookies
  }));
  app.use(options.namespace ?? '/', router);
  const ui = createServer(app);
  const base = await listen(ui);
  t.after(async () => {
    for (const server of [ui, backend]) {
      const closed = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      server.closeAllConnections();
      await closed;
    }
  });
  return { requests, get: (path = handleUrl, init = {}) => fetch(base + path, { ...init, redirect: 'manual' }) };
}

for (const [type, path] of [['item', 'items'], ['community', 'communities'], ['collection', 'collections']]) {
  test(`${type} redirects with one anonymous server-side lookup`, async (t) => {
    const { get, requests } = await fixture(t, { data: searchResult(object(type)) });
    const response = await get(handleUrl, { headers: { Cookie: 'preferences=cs; DSPACE-XSRF-COOKIE=secret' } });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `/${path}/${uuid}`);
    assert.equal(requests.length, 1);
    const lookup = new URL(requests[0].url, 'http://internal');
    assert.equal(lookup.pathname, '/internal/server/api/discover/search/objects');
    assert.equal(lookup.searchParams.get('query'), `handle:"${handle}"`);
    assert.equal(lookup.searchParams.get('size'), '2');
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[0].headers.cookie, undefined);
    assert.equal(requests[0].headers.authorization, undefined);
  });
}

test('entity redirects use the first visible metadata value, lowercase and URL encoding', async (t) => {
  const dso = object('item', { 'dspace.entity.type': [{ value: 'Research Project/É' }, { value: 'Person' }] });
  dso.entityType = 'Ignored';
  const { get } = await fixture(t, { data: searchResult(dso) });
  const response = await get();
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), `/entities/research%20project%2F%C3%A9/${uuid}`);
});

test('entityType property alone does not determine the route (hidden or withdrawn metadata)', async (t) => {
  const { get } = await fixture(t, { data: searchResult({ ...object(), entityType: 'Person', withdrawn: true }) });
  assert.equal((await get()).headers.get('location'), `/items/${uuid}`);
});

for (const suffix of ['/', '?x=1', '/?x=1']) {
  test(`trailing slash/query ${suffix} is dropped`, async (t) => {
    const { get } = await fixture(t);
    const response = await get(handleUrl + suffix);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `/items/${uuid}`);
  });
}

test('HEAD redirects like GET, uses a backend GET and returns no body', async (t) => {
  const { get, requests } = await fixture(t);
  const response = await get(handleUrl, { method: 'HEAD' });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), `/items/${uuid}`);
  assert.equal(await response.text(), '');
  assert.equal(requests[0].method, 'GET');
});

for (const namespace of ['/repository', '/repository/']) {
  test(`configured namespace ${namespace} is preserved exactly once`, async (t) => {
    const { get } = await fixture(t, { namespace });
    const response = await get('/repository' + handleUrl);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `/repository/items/${uuid}`);
  });
}

const invalidResults = [
  ['unknown or unindexed handle', searchResult()],
  ['stale index handle', searchResult({ ...object(), handle: 'other/handle' })],
  ['unsupported bitstream', searchResult(object('bitstream'))],
  ['invalid UUID', searchResult({ ...object(), uuid: '../other' })],
  ['missing metadata', searchResult({ ...object(), metadata: undefined })],
  ['malformed entity metadata', searchResult(object('item', { 'dspace.entity.type': [{}] }))],
  ['missing permission-filtered object', { _embedded: { searchResult: { page: { totalElements: 1 }, _embedded: { objects: [{}] } } } }],
  ['ambiguous results', { _embedded: { searchResult: { page: { totalElements: 2 }, _embedded: { objects: [] } } } }],
  ['unexpected response shape', {}]
];
for (const [description, data] of invalidResults) {
  test(`${description} falls through with request unchanged`, async (t) => {
    const { get } = await fixture(t, { data });
    const url = handleUrl + '/?x=1';
    const response = await get(url);
    assert.equal(response.status, 418);
    assert.equal(response.headers.get('location'), null);
    assert.deepEqual(await response.json(), { method: 'GET', url, originalUrl: url, cookies: {} });
  });
}

for (const status of [301, 302, 401, 403, 404, 500]) {
  test(`backend ${status} falls through without following redirects`, async (t) => {
    const { get, requests } = await fixture(t, { backend: (_req, res) => {
      res.writeHead(status, { Location: '/must-not-follow' }); res.end();
    } });
    assert.equal((await get()).status, 418);
    assert.equal(requests.length, 1);
  });
}

test('invalid JSON falls through', async (t) => {
  const { get } = await fixture(t, { backend: (_req, res) => res.end('not JSON') });
  assert.equal((await get()).status, 418);
});

test('network error falls through', async (t) => {
  const { get } = await fixture(t, { fetchRest: async () => { throw new Error('ECONNREFUSED'); } });
  assert.equal((await get()).status, 418);
});

for (const bodyStarted of [false, true]) {
  test(`backend timeout ${bodyStarted ? 'during body read' : 'before headers'} falls through`, async (t) => {
    const { get } = await fixture(t, { timeoutMs: 50, backend: (_req, res) => {
      if (bodyStarted) { res.writeHead(200); res.write('{'); }
      // Deliberately never complete: the handler must abort instead of blocking SSR.
    } });
    assert.equal((await get()).status, 418);
  });
}

test('config disabled skips REST', async (t) => {
  const { get, requests } = await fixture(t, { enabled: false });
  assert.equal((await get()).status, 418);
  assert.equal(requests.length, 0);
});

for (const path of [handleUrl + '/full', handleUrl + '/file.pdf', '/bitstream' + handleUrl,
  '/handle/handle/suffix', handleUrl + ';matrix=1', '/handle/20.500.14390/%34%37%33%36%36']) {
  test(`unhandled path ${path} skips REST`, async (t) => {
    const { get, requests } = await fixture(t);
    assert.equal((await get(path)).status, 418);
    assert.equal(requests.length, 0);
  });
}

test('POST skips REST', async (t) => {
  const { get, requests } = await fixture(t);
  assert.equal((await get(handleUrl, { method: 'POST' })).status, 418);
  assert.equal(requests.length, 0);
});

for (const headers of [{ Cookie: 'dsAuthInfo=private' }, { Authorization: 'Bearer private' }]) {
  test(`authenticated request ${Object.keys(headers)[0]} stays in Angular`, async (t) => {
    const { get, requests } = await fixture(t);
    assert.equal((await get(handleUrl, { headers })).status, 418);
    assert.equal(requests.length, 0);
  });
}
