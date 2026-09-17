/**
 * The handle administration page must render after the redirect to /handle-table.
 */
describe('Handle Page', () => {

  it('should render the handle table and its global actions', {
    retries: {
      runMode: 8,
      openMode: 8,
    },
    defaultCommandTimeout: 10000,
  }, () => {
    cy.visit('/handle-table');
    cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));

    // <ds-handle-page> tag must be loaded
    cy.get('ds-handle-page').should('exist');

    // <ds-handle-table> tag must be loaded
    cy.get('ds-handle-table').should('exist');

    // <ds-handle-global-actions> tag must be loaded
    cy.get('ds-handle-global-actions').should('exist');
  });
});
