import {
  testA11y,
  testLinkNamesOnPage,
} from 'cypress/support/utils';

describe('Item  Page', () => {
  const ITEMPAGE = '/items/'.concat(Cypress.env('DSPACE_TEST_ENTITY_PUBLICATION'));
  const ENTITYPAGE = '/entities/publication/'.concat(Cypress.env('DSPACE_TEST_ENTITY_PUBLICATION'));
  const UNTYPEDITEMPAGE = '/items/'.concat(Cypress.env('DSPACE_TEST_UNTYPED_ITEM'));

  // Test that entities will redirect to /entities/[type]/[uuid] when accessed via /items/[uuid]
  it('should redirect to the entity page when navigating to an item page', () => {
    cy.visit(ITEMPAGE);
    cy.location('pathname').should('eq', ENTITYPAGE);
  });

  it('should pass accessibility tests', () => {
    cy.visit(ENTITYPAGE);

    // <ds-item-page> tag must be loaded
    cy.get('ds-item-page').should('be.visible');
    // ds-item-page is the themed wrapper and is visible while it is still empty, so axe would
    // otherwise scan a page that has not rendered the item yet.
    cy.get('ds-item-page ds-item-page-title-field').should('exist');

    // Analyze <ds-item-page> for accessibility issues
    testA11y('ds-item-page');
  });

  it('should pass accessibility tests on full item page', () => {
    cy.visit(ENTITYPAGE + '/full');

    // <ds-full-item-page> tag must be loaded
    cy.get('ds-full-item-page').should('be.visible');
    cy.get('ds-full-item-page a.clarin-share-buttons').should('have.length', 2);

    // Analyze <ds-full-item-page> for accessibility issues
    testA11y('ds-full-item-page');
  });

  it('should give every link on the item page an accessible name', () => {
    cy.visit(ENTITYPAGE);

    cy.get('ds-item-page').should('be.visible');
    cy.get('ds-item-page ds-item-page-title-field').should('exist');

    testLinkNamesOnPage('ds-item-page');
  });

  it('should give every link on the full item page an accessible name', () => {
    cy.visit(ENTITYPAGE + '/full');

    cy.get('ds-full-item-page').should('be.visible');
    // Name the nodes the guard has to have in scope. A link check that stops seeing the share links
    // goes green by measuring less, which is the failure this spec exists to prevent.
    cy.get('ds-full-item-page a.clarin-share-buttons').should('have.length', 2);

    testLinkNamesOnPage('ds-full-item-page');
  });

  // An item without dspace.entity.type renders through <ds-untyped-item>, which is the layout the
  // CLARIN repositories actually serve. The entity page above never reaches that branch.
  it('should give every link on the untyped item page an accessible name', () => {
    cy.visit(UNTYPEDITEMPAGE);

    cy.get('ds-item-page').should('be.visible');
    cy.get('ds-item-page ds-untyped-item').should('exist');
    cy.get('ds-item-page a.clarin-share-buttons').should('have.length', 2);

    testLinkNamesOnPage('ds-item-page');
  });

  it('should pass accessibility tests on the untyped item page', () => {
    cy.visit(UNTYPEDITEMPAGE);

    cy.get('ds-item-page ds-untyped-item').should('exist');
    cy.get('ds-item-page a.clarin-share-buttons').should('have.length', 2);

    testA11y('ds-item-page');
  });
});
