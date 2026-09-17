const ITEMPAGE_WITHDRAWN = '/items/' + Cypress.env('CLARIN_TEST_WITHDRAWN_ITEM');
const ITEMPAGE_WITHDRAWN_REPLACED = '/items/' + Cypress.env('CLARIN_TEST_WITHDRAWN_REPLACED_ITEM');
const TOMBSTONED_ITEM_MESSAGE = 'This item has been withdrawn';

/**
 * An administrator still reaches the item page of a withdrawn item, and a replaced item carries the
 * withdrawal message.
 */
describe('Admin Tombstone Page', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Cancel discojuice login - only if it is popped up
    cy.wait(500);
    cy.get('.discojuice_close').should('exist').click();
    // Login as admin
    cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));
    cy.visit('/');
  });

  it('the admin should see ds-item-page', {
    retries: {
      runMode: 8,
      openMode: 8,
    },
    defaultCommandTimeout: 10000,
  }, () => {
    cy.visit(ITEMPAGE_WITHDRAWN);
    cy.get('ds-item-page').should('exist');
  });

  it('the admin should see the withdrawn message on the replaced item', {
    retries: {
      runMode: 8,
      openMode: 8,
    },
    defaultCommandTimeout: 10000,
  }, () => {
    cy.visit(ITEMPAGE_WITHDRAWN_REPLACED);
    cy.get('ds-item-page').contains(TOMBSTONED_ITEM_MESSAGE);
  });
});
