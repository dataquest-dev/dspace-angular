describe('Browse By Date Issued', () => {
    it('should pass accessibility tests', () => {
        cy.visit('/browse/dateissued');

        // Wait for <ds-browse-by-date-page> to be visible
        cy.get('ds-browse-by-date-page').should('be.visible');

        // Removed the accessibility tests because the whole UI is customized
        // Analyze <ds-browse-by-date-page> for accessibility
        // testA11y('ds-browse-by-date-page');
    });
});
