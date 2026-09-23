import { XSRF_REQUEST_HEADER } from 'src/app/core/xsrf/xsrf.constants';

const TOMBSTONED_ITEM_MESSAGE = 'This item has been withdrawn';

let restBaseUrl: string;
let adminAuthorization: string;
let withdrawnItemId: string;
let replacedItemId: string;

/**
 * Send a REST request as the administrator, with a fresh CSRF token.
 */
function adminRequest(method: string, path: string, body?: any): Cypress.Chainable<Cypress.Response<any>> {
  return cy.createCSRFCookie().then((csrfToken: string) => cy.request({
    method,
    url: restBaseUrl + path,
    headers: {
      [XSRF_REQUEST_HEADER]: csrfToken,
      Authorization: adminAuthorization,
    },
    body,
  }));
}

/**
 * Log the administrator in over REST and keep the token for adminRequest().
 */
function loginAdminOverRest() {
  cy.task('getRestBaseURL').then((url: string) => {
    restBaseUrl = url;
  });
  cy.createCSRFCookie().then((csrfToken: string) => cy.request({
    method: 'POST',
    url: restBaseUrl + '/api/authn/login',
    headers: { [XSRF_REQUEST_HEADER]: csrfToken },
    form: true,
    body: { user: Cypress.env('DSPACE_TEST_ADMIN_USER'), password: Cypress.env('DSPACE_TEST_ADMIN_PASSWORD') },
  })).then((response) => {
    adminAuthorization = response.headers.authorization as string;
  });
}

/**
 * Create an archived item in the collection, withdraw it, and yield its id.
 */
function createWithdrawnItem(collectionId: string, metadata: object): Cypress.Chainable<string> {
  return adminRequest('POST', '/api/core/items?owningCollection=' + collectionId, {
    inArchive: true,
    discoverable: true,
    withdrawn: false,
    metadata,
  }).then((response) => {
    const itemId: string = response.body.uuid;
    return adminRequest('PATCH', '/api/core/items/' + itemId, [{ op: 'replace', path: '/withdrawn', value: true }])
      .then(() => itemId);
  });
}

/**
 * An administrator still reaches the item page of a withdrawn item, and a replaced item carries the
 * withdrawal message. The test creates both items itself and deletes them afterwards.
 */
describe('Admin Tombstone Page', () => {
  before(() => {
    loginAdminOverRest();
    adminRequest('GET', '/api/core/collections?size=1').then((response) => {
      const collectionId: string = response.body._embedded.collections[0].uuid;
      createWithdrawnItem(collectionId, {
        'dc.title': [{ value: 'Tombstone e2e withdrawn item' }],
      }).then((itemId) => {
        withdrawnItemId = itemId;
      });
      createWithdrawnItem(collectionId, {
        'dc.title': [{ value: 'Tombstone e2e replaced item' }],
        'dc.relation.isreplacedby': [{ value: 'https://example.org/replacement' }],
      }).then((itemId) => {
        replacedItemId = itemId;
      });
    });
  });

  after(() => {
    [withdrawnItemId, replacedItemId]
      .filter((itemId) => itemId !== undefined)
      .forEach((itemId) => adminRequest('DELETE', '/api/core/items/' + itemId));
  });

  beforeEach(() => {
    cy.visit('/login');
    cy.loginViaForm(Cypress.env('DSPACE_TEST_ADMIN_USER'), Cypress.env('DSPACE_TEST_ADMIN_PASSWORD'));
    cy.get('ds-log-in').should('not.exist');
  });

  it('the admin should see ds-item-page', {
    retries: {
      runMode: 8,
      openMode: 8,
    },
    defaultCommandTimeout: 10000,
  }, () => {
    cy.visit('/items/' + withdrawnItemId);
    cy.get('ds-item-page').should('exist');
  });

  it('the admin should see the withdrawn message on the replaced item', {
    retries: {
      runMode: 8,
      openMode: 8,
    },
    defaultCommandTimeout: 10000,
  }, () => {
    cy.visit('/items/' + replacedItemId);
    cy.get('ds-item-page').contains(TOMBSTONED_ITEM_MESSAGE);
  });
});
