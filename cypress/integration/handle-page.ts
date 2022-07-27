import {loginProcess} from './submission-ui.spec';

/**
 * Test for checking if the handle page is loaded after redirecting.
 */
describe('Handle Page', () => {

  it('should pass accessibility tests', () => {
    // Login as admin
    cy.visit('/');
    loginProcess.clickOnLoginDropdown();
    loginProcess.typeEmail();
    loginProcess.typePassword();
    loginProcess.submit();

    cy.visit('/handle-table');

    // <ds-handle-page> tag must be loaded
    cy.get('ds-handle-page').should('exist');
  });
});
