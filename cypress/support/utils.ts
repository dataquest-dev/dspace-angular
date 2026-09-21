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
  cy.checkA11y(context, options, terminalLog);
};

// Accessible name of a link, following the checks axe runs for "link-name":
// aria-label, aria-labelledby, visible text, alt text of a contained image, title.
const accessibleNameOf = (element: Element): string => {
  const ariaLabel = (element.getAttribute('aria-label') || '').trim();
  if (ariaLabel !== '') {
    return ariaLabel;
  }
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy !== null) {
    const labelled = labelledBy.split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id))
      .map((target) => (target === null ? '' : (target.textContent || '').trim()))
      .join(' ')
      .trim();
    if (labelled !== '') {
      return labelled;
    }
  }
  const text = (element.textContent || '').trim();
  if (text !== '') {
    return text;
  }
  const alt = Array.from(element.querySelectorAll('img[alt], area[alt]'))
    .map((image) => (image.getAttribute('alt') || '').trim())
    .join(' ')
    .trim();
  if (alt !== '') {
    return alt;
  }
  return (element.getAttribute('title') || '').trim();
};

const isExposedToAssistiveTech = (element: Element, view: Window): boolean => {
  if (element.closest('[aria-hidden="true"]') !== null) {
    return false;
  }
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
  }
  return true;
};

// Every link rendered inside `context` must have a non-empty accessible name. Walks the anchors
// rather than the axe rule, whose a[href] selector skips an anchor whose href arrives async.
export const testLinkNamesOnPage = (context: string) => {
  cy.window().then((view) => {
    cy.get(context).then(($page) => {
      const anchors = Array.from($page[0].querySelectorAll('a'))
        .filter((element) => isExposedToAssistiveTech(element, view));
      // Without this the check passes on an empty subtree, which is the way the run it replaces
      // was green in the first place.
      expect(anchors.length, 'links exposed in ' + context).to.be.greaterThan(0);
      const nameless = anchors
        .filter((element) => accessibleNameOf(element) === '')
        .map((element) => element.outerHTML);
      expect(nameless, 'links rendered in ' + context + ' with no accessible name').to.deep.equal([]);
    });
  });
};
