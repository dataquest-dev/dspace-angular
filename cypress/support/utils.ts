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
  // pluck specific keys to keep the table readable
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

  // Print violations as an array, since 'node.html' above often breaks table alignment
  cy.task('log', violationData);
  // Optionally, uncomment to print as a table
  // cy.task('table', violationData);

}

// ---------------------------------------------------------------------------
// FE-58 DIAGNOSTIC BUILD - NOT FOR MERGE
// ---------------------------------------------------------------------------

const fe58Target = (win: any, context: any): any => {
  const doc = win.document;
  if (typeof context === 'string') {
    return doc.querySelector(context);
  }
  if (context && typeof context === 'object' && (context as any).nodeType === 1) {
    return context;
  }
  return doc.body;
};

const fe58Snapshot = (win: any, context: any, phase: string): any => {
  const doc = win.document;
  const el = fe58Target(win, context);
  const scope: any = el || doc.body;
  const all: any[] = scope ? Array.prototype.slice.call(scope.getElementsByTagName('*')) : [];
  const themed = all.filter((e: any) => String(e.tagName).toLowerCase().indexOf('ds-themed-') === 0);
  const themedResolved = themed.filter((e: any) => e.hasAttribute('data-used-theme'));
  const loading = all.filter((e: any) => {
    const t = String(e.tagName).toLowerCase();
    return t === 'ds-loading' || t === 'ds-themed-loading';
  });
  return {
    phase,
    spec: Cypress.spec.relative,
    test: Cypress.currentTest ? Cypress.currentTest.title : '?',
    ctx: typeof context === 'string' ? context : (context ? 'OBJECT' : 'DOCUMENT'),
    t: Math.round(win.performance.now()),
    exists: !!el,
    len: scope && scope.innerText ? scope.innerText.length : 0,
    htmlLen: scope && scope.innerHTML ? scope.innerHTML.length : 0,
    kids: scope ? scope.childElementCount : -1,
    descendants: all.length,
    themed: themed.length,
    themedResolved: themedResolved.length,
    loading: loading.length,
    selfTheme: el && el.hasAttribute && el.hasAttribute('data-used-theme') ? el.getAttribute('data-used-theme') : (el && el.closest && el.closest('[data-used-theme]') ? 'ANCESTOR' : 'NONE'),
    ngh: doc.querySelectorAll('[ngh]').length,
    winNg: typeof win.ng,
    winTestability: typeof win.getAllAngularTestabilities,
    winStabilizers: typeof win.frameworkStabilizers,
    bodyLen: doc.body && doc.body.innerText ? doc.body.innerText.length : 0,
  };
};

const fe58Log = (payload: any) => {
  cy.task('log', 'FE58-DIAG ' + JSON.stringify(payload), { log: false });
};

const fe58Violations = (phase: string, context: any, options: Options) => {
  cy.checkA11y(context, options, (violations: Result[]) => {
    fe58Log({
      phase: phase + '-VIOL',
      spec: Cypress.spec.relative,
      test: Cypress.currentTest ? Cypress.currentTest.title : '?',
      ctx: typeof context === 'string' ? context : (context ? 'OBJECT' : 'DOCUMENT'),
      total: violations.length,
      rules: violations.map((v: Result) => v.id + ':' + v.nodes.length).join(','),
    });
  }, true);
};

/**
 * Diagnostic settle loop: poll the target's innerText length until it stops changing.
 * Used ONLY to measure how much content arrives AFTER the current gate has already run.
 */
const fe58Settle = (context: any, maxPolls = 24, interval = 250) => {
  let last = -1;
  let stable = 0;
  const step = (i: number) => {
    if (i >= maxPolls) {
      return;
    }
    cy.window({ log: false }).then((win: any) => {
      const el = fe58Target(win, context);
      const scope: any = el || win.document.body;
      const len = scope && scope.innerText ? scope.innerText.length : 0;
      if (len === last && len > 0) {
        stable++;
      } else {
        stable = 0;
      }
      last = len;
      if (stable < 3) {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(interval, { log: false });
        step(i + 1);
      }
    });
  };
  step(0);
};

// Custom "testA11y()" method which checks accessibility using cypress-axe
// while also ensuring any violations are logged to the terminal (see terminalLog above)
// This method MUST be called after cy.visit(), as cy.injectAxe() must be called after page load
export const testA11y = (context?: any, options?: Options) => {
  cy.injectAxe();
  cy.configureAxe({
    rules: [
      // Disable color contrast checks as they are inaccurate / result in a lot of false positives
      // See also open issues in axe-core: https://github.com/dequelabs/axe-core/labels/color%20contrast
      { id: 'color-contrast', enabled: false },
    ],
  });

  // ---- FE-58 diagnostic: what the CURRENT gate sees, at the moment it runs ----
  cy.window({ log: false }).then((win: any) => fe58Log(fe58Snapshot(win, context, 'T0')));
  fe58Violations('T0', context, options);

  // ---- FE-58 diagnostic: what is actually there once the client has finished ----
  fe58Settle(context);
  cy.window({ log: false }).then((win: any) => fe58Log(fe58Snapshot(win, context, 'T1')));
  fe58Violations('T1', context, options);

  cy.checkA11y(context, options, terminalLog, true);
};
