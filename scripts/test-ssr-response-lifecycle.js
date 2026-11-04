const assert = require('node:assert/strict');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { setTimeout: sleep } = require('node:timers/promises');
const vm = require('node:vm');
const express = require('express');
const LRUCache = require('lru-cache');
const { resolve } = require('node:path');
const ts = require('typescript');

process.env.TS_NODE_PROJECT = 'tsconfig.ts-node.json';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'commonjs', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

// Execute the actual server functions without booting Angular or reading a production config.
function loadServerFunctions(cache, render, errors, mount = '/', foreground = false) {
  const source = ts.createSourceFile('server.ts', readFileSync('server.ts', 'utf8'), ts.ScriptTarget.Latest, true);
  const names = new Set(['serverSideRender', 'cacheCheck', 'checkCacheForRequest',
    'saveToCache', 'hasNotSucceeded', 'retrieveHeaders', 'isUserAuthenticated', 'botCacheEnabled', 'anonymousCacheEnabled']);
  const functions = source.statements.filter(statement => ts.isFunctionDeclaration(statement) && names.has(statement.name?.text));
  assert.equal(functions.length, names.size);
  const warnings = [];
  const context = {
    URL, botCache: cache,
    anonymousCache: undefined,
    cacheCounters: { bot: { hits: 0, misses: 0 }, anonymous: { hits: 0, misses: 0 } },
    environment: {
      universal: { preboot: true }, ui: { baseUrl: 'http://localhost' },
      rest: { baseUrl: 'http://backend' },
      cache: { serverSide: { botCache: { max: 3 }, anonymousCache: { max: 0 }, headers: ['Link'] } },
    },
    indexHtml: resolve('src/index.html'), REST_BASE_URL: 'http://backend',
    APP_BASE_HREF: 'base', REQUEST: 'request', RESPONSE: 'response', APP_CONFIG: 'config',
    TOKENITEM: 'token', LANG_COOKIE: 'dsLanguage', isbot: () => true, hasValue: value => value != null, hasNoValue: value => value == null,
    console: { log() {}, warn(message) { warnings.push(message); } },
  };
  Object.assign(context, require('../src/backend/ssr-response-context.ts'));
  vm.createContext(context);
  const keySource = ts.createSourceFile('key.ts', readFileSync('src/app/shared/ssr-cache-key.util.ts', 'utf8'), ts.ScriptTarget.Latest, true);
  const keyFunction = keySource.statements.find(statement => ts.isFunctionDeclaration(statement) && statement.name.text === 'getSsrCacheKey');
  vm.runInContext(ts.transpileModule(functions.map(fn => fn.getText(source)).join('\n') + '\n' + keyFunction.getText(keySource).replace('export ', ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  const app = express();
  app.locals.renderWarnings = warnings;
  app.engine('html', (path, options, callback) => {
    Promise.resolve(render({ providers: [
      { provide: 'response', useValue: options.req.res },
      { provide: 'request', useValue: options.req },
    ] })).then(html => {
      try { callback(null, html); } catch (error) { errors.push(error); }
    }, error => {
      try { callback(error); } catch (failure) { errors.push(failure); }
    });
  });
  const router = express.Router();
  router.use((req, res, next) => {
    req.cookies = {};
    req.headers.host = '127.0.0.1';
    app.locals.originalRequest = req;
    if (foreground) { context.serverSideRender(req, res); return; }
    context.cacheCheck(req, res, error => {
      if (error === 'router') { next('router'); } else { errors.push(error); }
    });
  });
  app.use(mount, router);
  return app;
}

test('stale cache refresh owns an independent response and saves fresh headers after client response ends', async () => {
  const cache = new LRUCache({ max: 3, ttl: 1, allowStale: true });
  cache.set(JSON.stringify(['http', '127.0.0.1', undefined, '/cached']), { page: 'stale', headers: { Link: 'old' } });
  await sleep(10);
  let finishRender;
  let renderResponse;
  let renderRequest;
  const errors = [];
  const app = loadServerFunctions(cache, options => {
    renderResponse = options.providers.find(provider => provider.provide === 'response').useValue;
    renderRequest = options.providers.find(provider => provider.provide === 'request').useValue;
    return new Promise(resolve => { finishRender = resolve; });
  }, errors, '/ui');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/ui/cached`);
    assert.equal(await response.text(), 'stale');
    assert.equal(response.headers.get('Link'), 'old');
    assert.equal(renderResponse.headersSent, false, 'background response must remain writable');
    assert.equal(renderRequest.res, renderResponse, 'cache save must read the rendered response');
    assert.equal(renderRequest.url, '/cached');
    assert.equal(app.locals.originalRequest.url, '/ui/cached', 'Express restored the mounted URL on the visitor request');
    renderResponse.setHeader('Link', 'fresh');
    finishRender('fresh html');
    await sleep(10);
    assert.equal(cache.peek(JSON.stringify(['http', '127.0.0.1', undefined, '/cached']))?.page, 'fresh html');
    assert.equal(cache.peek(JSON.stringify(['http', '127.0.0.1', undefined, '/cached']))?.headers.Link, 'fresh');
    assert.deepEqual(errors, []);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});


test('background render redirects cannot redirect the visitor or enter the cache', async () => {
  const cache = new LRUCache({ max: 3, ttl: 1, allowStale: true });
  cache.set(JSON.stringify(['http', '127.0.0.1', undefined, '/cached']), { page: 'stale' });
  await sleep(10);
  let finishRender;
  let renderResponse;
  const errors = [];
  const app = loadServerFunctions(cache, options => {
    renderResponse = options.providers.find(provider => provider.provide === 'response').useValue;
    return new Promise(resolve => { finishRender = resolve; });
  }, errors);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/cached`);
    assert.equal(await response.text(), 'stale');
    renderResponse.redirect(302, '/different');
    finishRender('redirect page');
    await sleep(10);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Location'), null);
    assert.equal(cache.peek(JSON.stringify(['http', '127.0.0.1', undefined, '/cached'])), undefined);
    assert.deepEqual(errors, []);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('background rendering failures do not call the completed client error pipeline', async () => {
  const cache = new LRUCache({ max: 3, ttl: 1, allowStale: true });
  cache.set(JSON.stringify(['http', '127.0.0.1', undefined, '/cached']), { page: 'stale' });
  await sleep(10);
  let failRender;
  const errors = [];
  const app = loadServerFunctions(cache, () => new Promise((resolve, reject) => { failRender = reject; }), errors);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/cached`);
    assert.equal(await response.text(), 'stale');
    failRender(new Error('render failed'));
    await sleep(10);
    assert.equal(cache.peek(JSON.stringify(['http', '127.0.0.1', undefined, '/cached'])), undefined);
    assert.deepEqual(errors, []);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

function loadClass(path, name, context) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const declaration = source.statements.find(statement => ts.isClassDeclaration(statement) && statement.name?.text === name);
  assert.ok(declaration, name);
  const sandbox = {
    exports: {}, Component: () => target => target, Injectable: () => target => target,
    Inject: () => () => undefined, Optional: () => () => undefined,
    ...context,
  };
  vm.createContext(sandbox);
  vm.runInContext(ts.transpileModule(declaration.getText(source), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
  }).outputText, sandbox);
  return sandbox.exports[name];
}

for (const metadata of ['ready', 'pending', 'invalid-header']) {
test(`download redirects with optional signposting ${metadata}`, async () => {
  const { Subject, of, combineLatest } = require('rxjs');
  const operators = require('rxjs/operators');
  const warnings = [];
  const context = {
    console: { warn: message => warnings.push(message) },
    ...operators, Observable: Object, of, observableOf: of, observableCombineLatest: combineLatest,
    inject: () => ({}), Subject, environment: { signpostingEnabled: true }, PLATFORM_ID: {},
    AsyncPipe: {}, TranslateModule: {}, isPlatformServer: platform => platform === 'server',
    takeUntilDestroyed: () => source => source,
    getRemoteDataPayload: () => operators.map(data => data.payload),
    redirectOn4xx: () => source => source,
    hasValue: value => value != null, isNotEmpty: value => value != null && value !== '',
    FeatureID: { CanDownload: 'download' }, getForbiddenRoute: () => '/forbidden',
  };
  const ResponseService = loadClass('src/app/core/services/server-response.service.ts', 'ServerResponseService', { RESPONSE: {}, console: { warn: message => warnings.push(message) } });
  const RedirectService = loadClass('src/app/core/services/server-hard-redirect.service.ts', 'ServerHardRedirectService', {
    APP_CONFIG: {}, REQUEST: {}, RESPONSE: {}, HardRedirectService: class {},
    isNotEmpty: context.isNotEmpty, environment: { ui: { baseUrl: 'https://ui.example' } }, console,
  });
  const DownloadComponent = loadClass('src/app/bitstream-page/bitstream-download-page/bitstream-download-page.component.ts', 'BitstreamDownloadPageComponent', context);
  const links = new Subject();
  const authorization = new Subject();
  let requestStarted;
  const started = new Promise(resolve => { requestStarted = resolve; });
  const app = express();
  let pendingResponse;
  app.get('/download', (req, res) => {
    pendingResponse = res;
    const bitstream = { _links: { content: { href: 'https://backend.example/content' } } };
    const route = { queryParams: of({}), data: of({ bitstream: { payload: bitstream } }), params: of({ id: 'test' }) };
    const component = new DownloadComponent(route, {}, { isAuthorized: () => authorization },
      { isAuthenticated: () => of(false) }, {},
      new RedirectService({ rest: { baseUrl: 'https://backend.example' } }, req, res), {}, {},
      { getLinks: () => links }, new ResponseService(res), 'server');
    component.ngOnInit();
    requestStarted();
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const fetching = fetch(`http://127.0.0.1:${server.address().port}/download`, { redirect: 'manual' });
    await started;
    assert.ok(pendingResponse);
    assert.equal(pendingResponse.headersSent, false, 'authorization is not ready');
    if (metadata !== 'pending') {
      links.next([{ href: metadata === 'invalid-header' ? 'https://example.org/\r\ninvalid' : 'https://example.org/item', rel: 'item' }]);
    }
    authorization.next(true);
    const response = await fetching;
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), 'https://backend.example/content');
    assert.equal(response.headers.get('Link'), metadata === 'ready' ? '<https://example.org/item> ; rel="item" ' : null);
    await response.text();
    assert.equal(links.observers.length, 0, 'optional request unsubscribed in the decision turn');
    links.next([{ href: 'https://late.example/item', rel: 'item' }]);
    assert.deepEqual(warnings, metadata === 'invalid-header'
      ? ['Unable to load signposting links for the download response.'] : [],
    'late metadata must not attempt a committed response write');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

}

test('background 404 results cannot replace the successful cached visitor response or enter cache', async () => {
  const cache = new LRUCache({ max: 3, ttl: 1, allowStale: true });
  cache.set(JSON.stringify(['http', '127.0.0.1', undefined, '/cached']), { page: 'stale' });
  await sleep(10);
  let finishRender;
  let renderResponse;
  const errors = [];
  const app = loadServerFunctions(cache, options => {
    renderResponse = options.providers.find(provider => provider.provide === 'response').useValue;
    return new Promise(resolve => { finishRender = resolve; });
  }, errors);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/cached`);
    assert.equal(await response.text(), 'stale');
    renderResponse.statusCode = 404;
    finishRender('not found');
    await sleep(10);
    assert.equal(response.status, 200);
    assert.equal(cache.peek(JSON.stringify(['http', '127.0.0.1', undefined, '/cached'])), undefined);
    assert.deepEqual(errors, []);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('completed foreground redirect is not overwritten by the later SSR callback', async () => {
  const cache = new LRUCache({ max: 3, ttl: 1000 });
  let finishRender;
  let renderResponse;
  let started;
  const rendering = new Promise(resolve => { started = resolve; });
  const errors = [];
  const app = loadServerFunctions(cache, options => {
    renderResponse = options.providers.find(provider => provider.provide === 'response').useValue;
    started();
    return new Promise(resolve => { finishRender = resolve; });
  }, errors, '/', true);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const fetching = fetch(`http://127.0.0.1:${server.address().port}/download`, { redirect: 'manual' });
    await rendering;
    renderResponse.redirect(302, '/target');
    const response = await fetching;
    await response.text();
    finishRender('later rendered page');
    await sleep(10);
    assert.equal(response.status, 302);
    assert.deepEqual(errors, []);
    assert.equal(cache.size, 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('rendering errors after a foreground redirect remain visible without another response write', async () => {
  const cache = new LRUCache({ max: 3, ttl: 1000 });
  let failRender;
  let renderResponse;
  let started;
  const rendering = new Promise(resolve => { started = resolve; });
  const errors = [];
  const app = loadServerFunctions(cache, options => {
    renderResponse = options.providers.find(provider => provider.provide === 'response').useValue;
    started();
    return new Promise((resolve, reject) => { failRender = reject; });
  }, errors, '/', true);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const fetching = fetch(`http://127.0.0.1:${server.address().port}/download`, { redirect: 'manual' });
    await rendering;
    renderResponse.redirect(302, '/target');
    const response = await fetching;
    await response.text();
    failRender(new Error('render failed'));
    await sleep(10);
    assert.equal(response.status, 302);
    assert.deepEqual(errors, []);
    assert.deepEqual(app.locals.renderWarnings, ['Server-side rendering failed after the response was committed.']);
    assert.equal(cache.size, 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
