import { loginProcess } from './submission-ui.spec';

/**
 * Test for checking if the license administration page is loaded after redirecting.
 */
describe('License Administration Page', () => {

  it('should pass accessibility tests', () => {
    // Login as admin
    cy.visit('/');
    loginProcess.clickOnLoginDropdown();
    loginProcess.typeEmail();
    loginProcess.typePassword();
    loginProcess.submit();

    cy.visit('/licenses');

    // <ds-clarin-license-table> tag must be loaded
    cy.get('ds-clarin-license-table').should('exist');
  });
});
