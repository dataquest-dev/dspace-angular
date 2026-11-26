beforeEach(() => {
  cy.visit('/collections/create?parent='.concat(Cypress.env('DSPACE_TEST_COMMUNITY')));
  cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));
});

it('should show loading component while saving', () => {
  const title = 'Test Collection Title';
  cy.get('#title').type(title);

  // the spinner hides as soon as the save is done, so hold the reply
  cy.intercept('POST', '**/api/core/collections*', (req) => {
    req.on('response', (res) => res.setDelay(2000));
  });
  cy.get('button[type="submit"]').click();

  cy.get('ds-loading').should('be.visible');
});
