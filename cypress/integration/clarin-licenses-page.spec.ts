import {TEST_ADMIN_PASSWORD, TEST_ADMIN_USER} from '../support';

/**
 * Test for checking if the license administration page is loaded after redirecting.
 */
describe('License Administration Page', () => {

  it('should pass accessibility tests', () => {
    // Login as admin
    cy.visit('/');
    // Login as admin
    cy.login(TEST_ADMIN_USER, TEST_ADMIN_PASSWORD);

    cy.visit('/licenses');

    // <ds-clarin-license-table> tag must be loaded
    cy.get('ds-clarin-license-table').should('exist');
  });
});
