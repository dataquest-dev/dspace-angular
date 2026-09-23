import {
  DSPACE_XSRF_COOKIE,
  XSRF_REQUEST_HEADER,
} from 'src/app/core/xsrf/xsrf.constants';

const TOMBSTONED_ITEM_MESSAGE = 'This item has been withdrawn';

let restBaseUrl: string;
let adminAuthorization: string;
let withdrawnItemId: string;
let replacedItemId: string;
const createdItemIds: string[] = [];

/**
 * Remove every CSRF cookie (the backend sets its own on another path) and create a single new one,
 * so the backend can only compare the header against that one.
 */
function freshCsrfToken(): Cypress.Chainable<string> {
  cy.task('getRestBaseDomain').then((domain: string) => cy.clearCookie(DSPACE_XSRF_COOKIE, { domain }));
  return cy.createCSRFCookie();
}

/**
 * Send a REST request as the administrator, with a fresh CSRF token.
 */
function adminRequest(method: string, path: string, body?: any, failOnStatusCode = true): Cypress.Chainable<Cypress.Response<any>> {
  return freshCsrfToken().then((csrfToken: string) => cy.request({
    method,
    url: restBaseUrl + path,
    headers: {
      [XSRF_REQUEST_HEADER]: csrfToken,
      Authorization: adminAuthorization,
    },
    body,
    failOnStatusCode,
  }));
}

/**
 * Log the administrator in over REST and keep the token for adminRequest().
 */
function loginAdminOverRest() {
  cy.task('getRestBaseURL').then((url: string) => {
    restBaseUrl = url;
  });
  freshCsrfToken().then((csrfToken: string) => cy.request({
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
    createdItemIds.push(itemId);
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
    // Try every DELETE before failing, so one refused DELETE does not leave the other item behind.
    const statuses: number[] = [];
    createdItemIds.forEach((itemId) => adminRequest('DELETE', '/api/core/items/' + itemId, undefined, false)
      .then((response) => statuses.push(response.status)));
    cy.then(() => expect(statuses).to.deep.equal(createdItemIds.map(() => 204)));
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
