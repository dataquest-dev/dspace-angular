import {TEST_ADMIN_PASSWORD, TEST_ADMIN_USER, TEST_SUBMIT_COLLECTION_UUID} from '../support';

/**
 * Test menu options for admin
 */
describe('Admin Menu Page', () => {
  it('should pass accessibility tests', () => {
    // Login as admin
    cy.visit('/');
    // Login as admin
    cy.login(TEST_ADMIN_USER, TEST_ADMIN_PASSWORD);

    // Create a new submission
    cy.visit('/submit?collection=' + TEST_SUBMIT_COLLECTION_UUID + '&entityType=none');

    // check handles redirect url in the <a> tag
    cy.get('.sidebar-top-level-items a[href = "/handle-table"]').scrollIntoView().should('be.visible');

    // check licenses redirect url in the <a> tag
    cy.get('.sidebar-top-level-items a[href = "/licenses"]').scrollIntoView().should('be.visible');
  });
});
