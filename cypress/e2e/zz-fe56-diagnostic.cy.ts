// TEMPORARY DIAGNOSTIC SPEC - not part of any deliverable.
// It answers, with a run in the real CI, why the existing item-page a11y spec is green on a base
// that carries two live link-name violations. It never fails; it only prints facts.
describe('FE-56 diagnostic', () => {
  const ENTITYPAGE = '/entities/publication/'.concat(Cypress.env('DSPACE_TEST_ENTITY_PUBLICATION'));

  const dumpDom = (label: string) => {
    cy.document().then((doc) => {
      const shareAnchors = Array.from(doc.querySelectorAll('a.clarin-share-buttons')).map((el) => ({
        outerHTML: el.outerHTML,
        hasHrefAttribute: el.hasAttribute('href'),
        hrefAttribute: el.getAttribute('href'),
        hrefProperty: String((el as HTMLAnchorElement).href),
        textContent: el.textContent,
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        ariaHiddenAncestor: el.closest('[aria-hidden="true"]') !== null,
      }));
      const emptyAnchors = Array.from(doc.querySelectorAll('a')).filter(
        (el) => (el.textContent || '').trim() === '' && !el.getAttribute('aria-label') && !el.getAttribute('title') && el.querySelector('img[alt]') === null,
      );
      cy.task('log', 'FE56-DIAG-DOM ' + JSON.stringify({
        label,
        url: doc.location.href,
        dsItemPage: doc.querySelectorAll('ds-item-page').length,
        dsFullItemPage: doc.querySelectorAll('ds-full-item-page').length,
        dsUntypedItem: doc.querySelectorAll('ds-untyped-item').length,
        refBox: doc.querySelectorAll('ds-clarin-ref-box').length,
        refBoxInsideFullItemPage: doc.querySelectorAll('ds-full-item-page ds-clarin-ref-box').length,
        featuredServices: doc.querySelectorAll('ds-clarin-ref-featured-services').length,
        anchorsTotal: doc.querySelectorAll('a').length,
        anchorsWithHrefAttribute: doc.querySelectorAll('a[href]').length,
        anchorsWithoutHrefAttribute: doc.querySelectorAll('a:not([href])').length,
        shareAnchors,
        emptyNameAnchors: emptyAnchors.map((el) => el.outerHTML),
      }));
    });
  };

  const dumpAxeLinkName = (label: string, context: string) => {
    cy.injectAxe();
    cy.configureAxe({ rules: [{ id: 'color-contrast', enabled: false }] });
    cy.checkA11y(
      context,
      { runOnly: { type: 'rule', values: ['link-name'] } },
      (violations) => {
        cy.task('log', 'FE56-DIAG-AXE-VIOLATIONS ' + JSON.stringify({
          label,
          context,
          count: violations.length,
          nodes: violations.map((violation) => violation.nodes.map((node) => node.html)),
        }));
      },
      true,
    );
    cy.window().then((win) => {
      const axe = (win as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<{ passes: unknown[]; violations: unknown[]; incomplete: unknown[]; inapplicable: unknown[] }> } }).axe;
      return axe.run(win.document, { runOnly: { type: 'rule', values: ['link-name'] } }).then((results) => {
        const summarize = (list: unknown[]) => (list as { id: string; nodes: { html: string }[] }[]).map((entry) => ({
          id: entry.id,
          nodes: entry.nodes.length,
          html: entry.nodes.map((node) => node.html).slice(0, 8),
        }));
        cy.task('log', 'FE56-DIAG-AXE-FULLDOC ' + JSON.stringify({
          label,
          passes: summarize(results.passes),
          violations: summarize(results.violations),
          incomplete: summarize(results.incomplete),
          inapplicable: (results.inapplicable as { id: string }[]).map((entry) => entry.id),
        }));
      });
    });
  };

  it('prints what the CI backend actually holds', () => {
    cy.task('getRestBaseURL').then((restBase: string) => {
      cy.request(restBase + '/api/discover/search/objects?dsoType=ITEM&size=1').then((response) => {
        cy.task('log', 'FE56-DIAG-REST-ITEMS ' + JSON.stringify({
          status: response.status,
          totalElements: response.body?._embedded?.searchResult?.page?.totalElements,
        }));
      });
      cy.request(restBase + '/api/discover/facets/entityType?size=50').then((response) => {
        cy.task('log', 'FE56-DIAG-REST-ENTITYTYPE ' + JSON.stringify({
          status: response.status,
          page: response.body?.page,
          values: (response.body?._embedded?.values || []).map((value) => ({ label: value.label, count: value.count })),
        }));
      });
      cy.request(restBase + '/api/core/items/' + Cypress.env('DSPACE_TEST_ENTITY_PUBLICATION')).then((response) => {
        cy.task('log', 'FE56-DIAG-REST-TESTITEM ' + JSON.stringify({
          status: response.status,
          name: response.body?.name,
          entityType: response.body?.metadata?.['dspace.entity.type'],
          identifierUri: response.body?.metadata?.['dc.identifier.uri'],
          metadataKeys: Object.keys(response.body?.metadata || {}),
        }));
      });
    });
  });

  it('prints the simple entity page', () => {
    cy.visit(ENTITYPAGE);
    cy.get('ds-item-page').should('be.visible');
    dumpDom('entity-simple');
    dumpAxeLinkName('entity-simple', 'ds-item-page');
  });

  it('prints the full entity page', () => {
    cy.visit(ENTITYPAGE + '/full');
    cy.get('ds-full-item-page').should('be.visible');
    dumpDom('entity-full-immediately-after-visible');
    cy.get('ds-clarin-ref-box', { timeout: 20000 }).should('exist');
    dumpDom('entity-full-after-refbox-exists');
    dumpAxeLinkName('entity-full', 'ds-full-item-page');
  });

  const snapshot = (win: Window) => {
    const doc = win.document;
    const page = doc.querySelector('ds-full-item-page');
    return {
      t: Math.round(win.performance.now()),
      refBox: doc.querySelectorAll('ds-clarin-ref-box').length,
      featuredServices: doc.querySelectorAll('ds-clarin-ref-featured-services').length,
      shareAnchors: doc.querySelectorAll('a.clarin-share-buttons').length,
      anchors: doc.querySelectorAll('a').length,
      fullItemPageInnerLength: page === null ? -1 : page.innerHTML.length,
    };
  };

  it('replicates the existing gate and records what axe sees at that exact moment', () => {
    cy.visit(ENTITYPAGE + '/full');
    cy.get('ds-full-item-page').should('be.visible');
    cy.injectAxe();
    cy.configureAxe({ rules: [{ id: 'color-contrast', enabled: false }] });
    cy.window().then((win) => {
      const axe = (win as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }).axe;
      const before = snapshot(win);
      return axe.run(win.document.querySelector('ds-full-item-page'), {}).then((results) => {
        cy.task('log', 'FE56-RACE ' + JSON.stringify({
          before,
          after: snapshot(win),
          violations: results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })),
        }));
      });
    });
    cy.get('ds-clarin-ref-box', { timeout: 20000 }).should('exist');
    cy.window().then((win) => {
      const axe = (win as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }).axe;
      const before = snapshot(win);
      return axe.run(win.document.querySelector('ds-full-item-page'), {}).then((results) => {
        cy.task('log', 'FE56-RACE-AFTERWAIT ' + JSON.stringify({
          before,
          violations: results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })),
        }));
      });
    });
  });

  it('prints the untyped item page', () => {
    cy.visit('/items/'.concat(Cypress.env('DSPACE_TEST_UNTYPED_ITEM')));
    cy.get('ds-item-page').should('be.visible');
    dumpDom('untyped-immediately-after-visible');
    cy.get('ds-untyped-item', { timeout: 20000 }).should('exist');
    cy.get('ds-clarin-ref-box', { timeout: 20000 }).should('exist');
    dumpDom('untyped-after-refbox-exists');
    dumpAxeLinkName('untyped', 'ds-item-page');
  });
});
