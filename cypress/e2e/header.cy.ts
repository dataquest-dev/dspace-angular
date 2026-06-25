import { testA11y } from 'cypress/support/utils';

describe('Header', () => {
  it('should pass accessibility tests', () => {
    cy.visit('/');

    // Header must first be visible
    cy.get('ds-header').should('be.visible');

    // Analyze <ds-header> for accessibility
    testA11y('ds-header');
  });

  // This theme only enables English + Czech,
  it('should allow for changing language to Czech (for example)', () => {
    cy.visit('/');

    // Click the language switcher (globe) in header
    cy.get('button[data-test="lang-switch"]').click();
    // Click on the "Čeština" language in dropdown
    cy.get('#language-menu-list div[role="option"]').contains('Čeština').click();

    // HTML "lang" attribute should switch to "cs"
    cy.get('html').invoke('attr', 'lang').should('eq', 'cs');

    // Login menu should now be in Czech
    cy.get('[data-test="login-menu"]').contains('Přihlásit se');

    // Change back to English from language switcher
    cy.get('button[data-test="lang-switch"]').click();
    cy.get('#language-menu-list div[role="option"]').contains('English').click();

    // HTML "lang" attribute should switch to "en"
    cy.get('html').invoke('attr', 'lang').should('eq', 'en');

    // Login menu should now be in English
    cy.get('[data-test="login-menu"]').contains('Log In');
  });
});
