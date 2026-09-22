import { Result } from 'axe-core';
import { Options } from 'cypress-axe';

// Log violations to terminal/commandline in a table format.
// Uses 'log' and 'table' tasks defined in ../plugins/index.ts
// Borrowed from https://github.com/component-driven/cypress-axe#in-your-spec-file
function terminalLog(violations: Result[]) {
  cy.task(
    'log',
    `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected`,
  );
  const violationData = violations.map(
    ({ id, impact, description, helpUrl, nodes }) => ({
      id,
      impact,
      description,
      helpUrl,
      nodes: nodes.length,
      html: nodes.map(node => node.html),
    }),
  );
  cy.task('log', violationData);
}

// ---------------------------------------------------------------------------
// FE-58 DIAGNOSTIC BUILD #2 - NOT FOR MERGE
// Same predicate as the delivered fix, used as the measuring instrument.
// ---------------------------------------------------------------------------

const CLIENT_RENDER_QUIET_PERIOD = 750;
const CLIENT_RENDER_TIMEOUT = 30000;

const scannedSubtree = (context?: any): string => {
  if (typeof context === 'string') {
    return context;
  }
  const included = Array.isArray(context?.include) ? context.include : [];
  const selectors = included.filter((entry: any) => typeof entry === 'string');
  return selectors.length > 0 ? selectors.join(', ') : 'ds-app';
};

const renderedMarkup = ($subtree: JQuery<HTMLElement>): string =>
  $subtree.toArray().map((element: HTMLElement) => element.innerHTML).join('');

const loadingPlaceholders = ($subtree: JQuery<HTMLElement>): number =>
  $subtree.toArray().reduce((total: number, element: HTMLElement) =>
    total + element.querySelectorAll('ds-loading, ds-themed-loading').length, 0);

const fe58Log = (payload: any) => {
  cy.task('log', 'FE58D2 ' + JSON.stringify(payload), { log: false });
};

const fe58Snapshot = (win: any, context: any, phase: string): any => {
  const doc = win.document;
  const selector = scannedSubtree(context);
  const matched: any[] = Array.prototype.slice.call(doc.querySelectorAll(selector));
  let text = '';
  let markup = '';
  let loading = 0;
  matched.forEach((element: any) => {
    text += element.innerText || '';
    markup += element.innerHTML || '';
    loading += element.querySelectorAll('ds-loading, ds-themed-loading').length;
  });
  return {
    phase,
    spec: Cypress.spec.relative,
    test: Cypress.currentTest ? Cypress.currentTest.title : '?',
    ctx: typeof context === 'string' ? context : 'OBJECT',
    selector,
    matched: matched.length,
    t: Math.round(win.performance.now()),
    len: text.length,
    htmlLen: markup.length,
    loading,
  };
};

const fe58Violations = (phase: string, context: any, options: Options) => {
  cy.checkA11y(context, options, (violations: Result[]) => {
    fe58Log({
      phase: phase + '-VIOL',
      spec: Cypress.spec.relative,
      test: Cypress.currentTest ? Cypress.currentTest.title : '?',
      ctx: typeof context === 'string' ? context : 'OBJECT',
      total: violations.length,
      rules: violations.map((v: Result) => v.id + ':' + v.nodes.length).join(','),
    });
  }, true);
};

// The delivered predicate, plus counters for how much work it actually did.
const waitForClientRender = (context?: any) => {
  const selector = scannedSubtree(context);
  let settledMarkup: string = null;
  let lastChangeAt = Date.now();
  const startedAt = Date.now();
  let changes = -1;
  let polls = 0;
  cy.get(selector, { timeout: CLIENT_RENDER_TIMEOUT }).should(($subtree: JQuery<HTMLElement>) => {
    polls++;
    const markup = renderedMarkup($subtree);
    const now = Date.now();
    if (markup !== settledMarkup) {
      settledMarkup = markup;
      lastChangeAt = now;
      changes++;
    }
    expect(loadingPlaceholders($subtree), `loading placeholders left in ${selector}`).to.equal(0);
    expect(markup.length, `markup rendered in ${selector}`).to.be.greaterThan(0);
    expect(now - lastChangeAt, `ms since ${selector} last changed`).to.be.at.least(CLIENT_RENDER_QUIET_PERIOD);
  });
  cy.then(() => fe58Log({
    phase: 'WAIT',
    spec: Cypress.spec.relative,
    test: Cypress.currentTest ? Cypress.currentTest.title : '?',
    ctx: typeof context === 'string' ? context : 'OBJECT',
    selector,
    waitedMs: Date.now() - startedAt,
    markupChanges: changes,
    polls,
  }));
};

export const testA11y = (context?: any, options?: Options) => {
  cy.injectAxe();
  cy.configureAxe({
    rules: [
      { id: 'color-contrast', enabled: false },
    ],
  });

  cy.window({ log: false }).then((win: any) => fe58Log(fe58Snapshot(win, context, 'T0')));
  fe58Violations('T0', context, options);

  waitForClientRender(context);

  cy.window({ log: false }).then((win: any) => fe58Log(fe58Snapshot(win, context, 'T2')));
  fe58Violations('T2', context, options);

  cy.checkA11y(context, options, terminalLog, true);
};
