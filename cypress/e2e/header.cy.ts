describe('Header', () => {
  it('should be visible', () => {
    cy.visit('/');

    // Header must be visible
    cy.get('ds-header').should('be.visible');
  });

  // NOTE (CLARIN/LINDAT): accessibility of the LINDAT header (ported v7 lindat-common markup)
  // is not asserted yet - same as on the reference branch, which disabled this test after the
  // UI was changed to the LINDAT design.
  // it('should pass accessibility tests', () => {
  //   testA11y('ds-header');
  // });

  // NOTE (CLARIN/LINDAT): the vanilla language switcher (globe dropdown) was replaced by the
  // CLARIN top-bar language flags (see clarin-navbar-top); language switching is covered by the
  // LINDAT Playwright suite (dspace-ui-tests).
  // it('should allow for changing language to German (for example)', () => {
  //   ...
  // });
});
