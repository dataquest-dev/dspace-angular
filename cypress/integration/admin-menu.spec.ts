import {TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_COMMUNITY} from '../support';
import {testA11y} from '../support/utils';

describe('Community Page', () => {

  it('should pass accessibility tests', () => {
    cy.visit('/');
    // click on login dropdown
    cy.get('.navbar-container .dropdownLogin ').click();
    // type email
    cy.get('.navbar-container form input[type = "email"] ').type(TEST_ADMIN_EMAIL);
    // type password
    cy.get('.navbar-container form input[type = "password"] ').type(TEST_ADMIN_PASSWORD);
    // submit
    cy.get('.navbar-container form button[type = "submit"] ').click();
    // check handles redirect url in the <a> tag
    cy.get('.sidebar-top-level-items a[href = "/admin/handles"]').scrollIntoView().should('be.visible');
  });
});
