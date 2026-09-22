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

// How long the scanned subtree has to stay unchanged before axe is allowed to look at it.
const CLIENT_RENDER_QUIET_PERIOD = 750;

// How long the client gets to finish rendering the scanned subtree.
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

/**
 * Wait until the client has finished rendering the subtree axe is about to scan: SSR hands over
 * the wrapper without its contents, so 'be.visible' is satisfied while that subtree is still empty.
 */
const waitForClientRender = (context?: any) => {
  const selector = scannedSubtree(context);
  let settledMarkup: string = null;
  let lastChangeAt = Date.now();
  cy.get(selector, { timeout: CLIENT_RENDER_TIMEOUT }).should(($subtree: JQuery<HTMLElement>) => {
    const markup = renderedMarkup($subtree);
    const now = Date.now();
    if (markup !== settledMarkup) {
      settledMarkup = markup;
      lastChangeAt = now;
    }
    expect(loadingPlaceholders($subtree), `loading placeholders left in ${selector}`).to.equal(0);
    expect(markup.length, `markup rendered in ${selector}`).to.be.greaterThan(0);
    expect(now - lastChangeAt, `ms since ${selector} last changed`).to.be.at.least(CLIENT_RENDER_QUIET_PERIOD);
  });
};

// Custom "testA11y()" method which checks accessibility using cypress-axe
// while also ensuring any violations are logged to the terminal (see terminalLog above)
// This method MUST be called after cy.visit(), as cy.injectAxe() must be called after page load
export const testA11y = (context?: any, options?: Options) => {
  waitForClientRender(context);
  cy.injectAxe();
  cy.configureAxe({
    rules: [
      // Disable color contrast checks as they are inaccurate / result in a lot of false positives
      // See also open issues in axe-core: https://github.com/dequelabs/axe-core/labels/color%20contrast
      { id: 'color-contrast', enabled: false },
    ],
  });
  cy.checkA11y(context, options, terminalLog);
};
