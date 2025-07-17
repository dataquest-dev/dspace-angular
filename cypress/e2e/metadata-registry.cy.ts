import { testA11y } from 'cypress/support/utils';

describe('Metadata Registry', () => {
  beforeEach(() => {
    // 1️⃣ Set intercept first
    cy.intercept('POST', '**/server/api/authn/login*').as('auth');

    // 2️⃣ Visit protected page (triggers redirection to login)
    cy.visit('/admin/registries/metadata');

    // 3️⃣ Perform form login
    cy.loginViaForm(
      Cypress.env('DSPACE_TEST_ADMIN_USER'),
      Cypress.env('DSPACE_TEST_ADMIN_PASSWORD')
    );

    // 4️⃣ Wait for the auth POST (if it happens)
    cy.wait('@auth', { timeout: 10000 }).then(interception => {
      cy.log(`Auth POST caught with status ${interception.response?.statusCode}`);
    });

    // 5️⃣ Finally, assert the redirect always happened
    cy.url({ timeout: 10000 }).should('include', '/admin/registries/metadata');
  });

  it('should pass accessibility tests', () => {
    // Page must first be visible
    cy.get('ds-metadata-registry').should('be.visible');
    // Analyze <ds-metadata-registry> for accessibility issues
    testA11y('ds-metadata-registry');
  });
});
