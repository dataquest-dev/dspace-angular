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
  // When the include context is a CSS selector string, axe-core re-resolves
  // that selector at axe.run time via document.querySelectorAll. Between
  // Cypress commands (injectAxe + configureAxe take a few ms each) Angular
  // may re-render and the host element can briefly disappear from the
  // document, causing axe to throw
  // "No elements found for include in page Context".
  //
  // Fix: wait for the host to exist with rendered content, then resolve the
  // selector to a live DOM Element here and pass that Element reference (not
  // the selector string) to cy.checkA11y. axe-core uses the Element directly
  // and does not re-query the document by selector, eliminating the race.
  if (typeof context === 'string') {
    cy.get(context, { timeout: 30000 }).should('exist');
    cy.get(`${context} *`, { timeout: 30000 }).should('exist');
    cy.get(context).then(($el) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.checkA11y($el[0] as any, options, terminalLog);
    });
    return;
  }
  cy.checkA11y(context, options, terminalLog);
};
