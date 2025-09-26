/// <reference types="cypress" />
import { testA11y } from 'cypress/support/utils';

describe('System Wide Alert', () => {
  beforeEach(() => {
    // Login first to ensure access to admin routes, then visit the target page
    cy.visit('/login');
    cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));
    cy.visit('/admin/system-wide-alert');
  });

  it('should pass accessibility tests', () => {
    // Ensure the page component is present and visible
    cy.get('ds-system-wide-alert-form').should('be.visible').then(($el) => {
      // Analyze <ds-system-wide-alert-form> for accessibility issues
      testA11y($el);
    });
  });
});
