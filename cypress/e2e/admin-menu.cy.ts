/**
 * The CLARIN admin sidebar entries: handle administration and licence administration.
 */
describe('Admin Menu Page', () => {
  beforeEach(() => {
    // Create a new submission
    cy.visit('/submit?collection=' + Cypress.env('DSPACE_TEST_SUBMIT_COLLECTION_UUID') + '&entityType=none');

    // This page is restricted, so we will be shown the login form. Fill it out & submit.
    cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));
  });

  it('should link to the CLARIN handle and licence administration', () => {
    // Check handles redirect url in the <a> tag
    cy.get('ds-admin-sidebar-section a[href = "/handle-table"]').scrollIntoView().should('be.visible');

    // Check licenses redirect url in the <a> tag
    cy.get('ds-admin-sidebar-section a[href = "/licenses/manage-table"]').scrollIntoView().should('be.visible');
  });
});
