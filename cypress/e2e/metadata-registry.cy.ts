import { testA11y } from 'cypress/support/utils';

describe('Metadata Registry', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/server/api/authn/login*').as('auth');
    // Must login as an Admin to see the page
    cy.visit('/admin/registries/metadata');
    cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));
// Gather all matching requests (if any)
    // 4) wait for auth POST if it happens (no .catch())
    cy.wait('@auth', {timeout: 10000, log: false})
      .then(interception => {
        cy.log(`Auth POST seen (${interception.response?.statusCode})`);
      })
      .then(() => {
        // 5) Always assert URL redirect
        cy.url({timeout: 10000}).should('include', '/admin/registries/metadata');
      });
  });

  it('should pass accessibility tests', () => {
    // Page must first be visible
    cy.get('ds-metadata-registry').should('be.visible');
    // Analyze <ds-metadata-registry> for accessibility issues
    testA11y('ds-metadata-registry');
  });
});
