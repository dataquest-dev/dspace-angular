// ***********************************************
// This File is for Custom Cypress commands.
// See docs at https://docs.cypress.io/api/cypress-api/custom-commands
// ***********************************************

import { AuthTokenInfo, TOKENITEM } from 'src/app/core/auth/models/auth-token-info.model';
import { DSPACE_XSRF_COOKIE, XSRF_REQUEST_HEADER } from 'src/app/core/xsrf/xsrf.constants';
import { v4 as uuidv4 } from 'uuid';

// Declare Cypress namespace to help with Intellisense & code completion in IDEs
// ALL custom commands MUST be listed here for code completion to work
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable<Subject = any> {
            /**
             * Login to backend before accessing the next page. Ensures that the next
             * call to "cy.visit()" will be authenticated as this user.
             * @param email email to login as
             * @param password password to login as
             */
            login(email: string, password: string): typeof login;

            /**
             * Login via form before accessing the next page. Useful to fill out login
             * form when a cy.visit() call is to an a page which requires authentication.
             * @param email email to login as
             * @param password password to login as
             */
             loginViaForm(email: string, password: string): typeof loginViaForm;

            /**
             * Generate view event for given object. Useful for testing statistics pages with
             * pre-generated statistics. This just generates a single "hit", but can be called multiple times to
             * generate multiple hits.
             * @param uuid  UUID of object
             * @param dsoType type of DSpace Object (e.g. "item", "collection", "community")
             */
            generateViewEvent(uuid: string, dsoType: string): typeof generateViewEvent;

            /**
             * Create a new CSRF token and add to required Cookie. CSRF Token is returned
             * in chainable in order to allow it to be sent also in required CSRF header.
             * @returns Chainable reference to allow CSRF token to also be sent in header.
             */
            createCSRFCookie(): Chainable<any>;
        }
    }
}

/**
 * Login user via REST API directly, and pass authentication token to UI via
 * the UI's dsAuthInfo cookie.
 * WARNING: WHILE THIS METHOD WORKS, OCCASIONALLY RANDOM AUTHENTICATION ERRORS OCCUR.
 * At this time "loginViaForm()" seems more consistent/stable.
 * @param email email to login as
 * @param password password to login as
 */
function login(email: string, password: string): void {
    // Create a fake CSRF cookie/token to use in POST
    cy.createCSRFCookie().then((csrfToken: string) => {
        // get our REST API's base URL, also needed for POST
        cy.task('getRestBaseURL').then((baseRestUrl: string) => {
            // Now, send login POST request including that CSRF token
            cy.request({
                method: 'POST',
                url: baseRestUrl + '/api/authn/login',
                headers: { [XSRF_REQUEST_HEADER]: csrfToken},
                form: true, // indicates the body should be form urlencoded
                body: { user: email, password: password }
            }).then((resp) => {
                // We expect a successful login
                expect(resp.status).to.eq(200);
                // We expect to have a valid authorization header returned (with our auth token)
                expect(resp.headers).to.have.property('authorization');

                // Initialize our AuthTokenInfo object from the authorization header.
                const authheader = resp.headers.authorization as string;
                const authinfo: AuthTokenInfo = new AuthTokenInfo(authheader);

                // Save our AuthTokenInfo object to our dsAuthInfo UI cookie
                // This ensures the UI will recognize we are logged in on next "visit()"
                cy.setCookie(TOKENITEM, JSON.stringify(authinfo));
            });
        });
    });
}
// Add as a Cypress command (i.e. assign to 'cy.login')
Cypress.Commands.add('login', login);

/**
 * Login the given user via the REST API and inject the resulting auth token
 * into the UI session cookie. Despite the historical "ViaForm" name this is
 * now a fully programmatic login — clicking through the UI form is unreliable
 * on the CI runners (the browser-side POST /api/authn/login routinely fails
 * to receive a response within Cypress' default 30s wait, which previously
 * caused every login-protected spec to fail with "No response ever
 * occurred"). Going through cy.request() instead bypasses the SSR layer and
 * any browser-side CORS/XSRF timing problems, then a single cy.visit('/')
 * forces Angular to rehydrate as an authenticated user.
 *
 * @param email email to login as
 * @param password password to login as
 */
function loginViaForm(email: string, password: string): void {
  // Each invocation needs a fresh CSRF cookie/token pair, since prior tests
  // (or this test's own beforeEach) explicitly clear the XSRF cookie.
  cy.createCSRFCookie().then((csrfToken: string) => {
    cy.task('getRestBaseURL').then((baseRestUrl: string) => {
      cy.request({
        method: 'POST',
        url: baseRestUrl + '/api/authn/login',
        headers: { [XSRF_REQUEST_HEADER]: csrfToken },
        // form-urlencoded body, matching what the Angular login form sends
        form: true,
        body: { user: email, password: password },
        // Be generous: the very first login on a freshly-started DSpace
        // backend in CI can take well over 30s while Hibernate warms up.
        timeout: 120000,
      }).then((resp) => {
        expect(resp.status, 'login POST status').to.eq(200);
        expect(resp.headers, 'login response headers').to.have.property('authorization');

        // Persist the auth token into the UI cookie that Angular reads on
        // bootstrap so the subsequent navigation is already authenticated.
        const authHeader = resp.headers.authorization as string;
        const authInfo: AuthTokenInfo = new AuthTokenInfo(authHeader);
        cy.setCookie(TOKENITEM, JSON.stringify(authInfo));
      });
    });
  });

  // Force Angular to re-bootstrap with the new auth cookie. cy.reload()
  // preserves the current URL, so specs that visit a restricted page first
  // (e.g. /mydspace -> redirected to /login?returnUrl=/mydspace) still end up
  // back at the original destination after login. For specs that visit
  // /login directly, the login page sees the authenticated user on bootstrap
  // and redirects to /home.
  cy.reload();
  cy.location('pathname', { timeout: 30000 }).should('not.match', /\/login$/);
}
// Add as a Cypress command (i.e. assign to 'cy.loginViaForm')
Cypress.Commands.add('loginViaForm', loginViaForm);

// Do not fail test if an uncaught exception occurs in the application
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});


/**
 * Generate statistic view event for given object. Useful for testing statistics pages with
 * pre-generated statistics. This just generates a single "hit", but can be called multiple times to
 * generate multiple hits.
 *
 * NOTE: This requires that "solr-statistics.autoCommit=false" be set on the DSpace backend
 * (as it is in our docker-compose-ci.yml used in CI).
 * Otherwise, by default, new statistical events won't be saved until Solr's autocommit next triggers.
 * @param uuid UUID of object
 * @param dsoType type of DSpace Object (e.g. "item", "collection", "community")
 */
function generateViewEvent(uuid: string, dsoType: string): void {
    // Create a fake CSRF cookie/token to use in POST
    cy.createCSRFCookie().then((csrfToken: string) => {
        // get our REST API's base URL, also needed for POST
        cy.task('getRestBaseURL').then((baseRestUrl: string) => {
            // Now, send 'statistics/viewevents' POST request including that fake CSRF token in required header
            cy.request({
                method: 'POST',
                url: baseRestUrl + '/api/statistics/viewevents',
                headers: {
                    [XSRF_REQUEST_HEADER] : csrfToken,
                    // use a known public IP address to avoid being seen as a "bot"
                    'X-Forwarded-For': '1.1.1.1',
                    // Use a user-agent of a Firefox browser on Windows. This again avoids being seen as a "bot"
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                },
                //form: true, // indicates the body should be form urlencoded
                body: { targetId: uuid, targetType: dsoType },
            }).then((resp) => {
                // We expect a 201 (which means statistics event was created)
                expect(resp.status).to.eq(201);
            });
        });
    });
}
// Add as a Cypress command (i.e. assign to 'cy.generateViewEvent')
Cypress.Commands.add('generateViewEvent', generateViewEvent);

export const loginProcess = {
  clickOnLoginDropdown() {
    cy.get('.navbar-container .dropdownLogin ').click();
  },
  typeEmail(email: string) {
    cy.get('ds-log-in-container form input[type = "email"] ').type(email);
  },
  typePassword(password: string) {
    cy.get('ds-log-in-container form input[type = "password"] ').type(password);
  },
  submit() {
    cy.get('ds-log-in-container form button[type = "submit"] ').click();
  },
  login(email: string, password: string) {
    cy.visit('/login');
    // loginProcess.clickOnLoginDropdown();
    loginProcess.typeEmail(email);
    loginProcess.typePassword(password);
    loginProcess.submit();
    // wait for redirecting after login - end of login process
    cy.url().should('contain', '/home');
  }
};

export const createItemProcess = {
  checkLocalHasCMDIVisibility() {
    cy.get('#traditionalpageone form div[role = "group"] label[for = "local_hasCMDI"]').should('be.visible');
  },
  checkIsInputVisible(inputName, formatted = false, inputOrder = 0) {
    let inputNameTag = 'input[';
    inputNameTag += formatted ? 'ng-reflect-name' : 'name';
    inputNameTag += ' = ';

    cy.get('#traditionalpageone form div[role = "group"] ' + inputNameTag + '"' + inputName + '"]')
      .eq(inputOrder).should('be.visible');
  },
  checkIsNotInputVisible(inputName, formatted = false, inputOrder = 0) {
    let inputNameTag = 'input[';
    inputNameTag += formatted ? 'ng-reflect-name' : 'name';
    inputNameTag += ' = ';

    cy.get('#traditionalpageone form div[role = "group"] ' + inputNameTag + '"' + inputName + '"]')
      .eq(inputOrder).should('not.be.visible');
  },
  clickOnSelectionInput(inputName, inputOrder = 0) {
    cy.get('#traditionalpageone form div[role = "group"] input[name = "' + inputName + '"]').eq(inputOrder).click();
  },
  clickOnInput(inputName, force = false) {
    cy.get('#traditionalpageone form div[role = "group"] input[ng-reflect-name = "' + inputName + '"]')
      .click(force ? {force: true} : {});
  },
  writeValueToInput(inputName, value, formatted = false, inputOrder = 0) {
    if (formatted) {
      cy.get('#traditionalpageone form div[role = "group"] input[ng-reflect-name = "' + inputName + '"]').eq(inputOrder).click({force: true}).type(value);
    } else {
      cy.get('#traditionalpageone form div[role = "group"] input[name = "' + inputName + '"]').eq(inputOrder).click({force: true}).type(value);
    }
  },
  blurInput(inputName, formatted) {
    if (formatted) {
      cy.get('#traditionalpageone form div[role = "group"] input[ng-reflect-name = "' + inputName + '"]').blur();
    } else {
      cy.get('#traditionalpageone form div[role = "group"] input[name = "' + inputName + '"]').blur();
    }
  },
  clickOnTypeSelection(selectionName) {
    cy.get('#traditionalpageone form div[role = "group"] div[role = "listbox"]' +
      ' button[title = "' + selectionName + '"]').click();
  },
  clickOnSuggestionSelection(selectionNumber) {
    cy.get('#traditionalpageone form div[role = "group"] ngb-typeahead-window[role = "listbox"]' +
      ' button[type = "button"]').eq(selectionNumber).click();
  },

  clickOnDivById(id, force) {
    cy.get('div[id = "' + id + '"]').click(force ? {force: true} : {});
  },
  checkInputValue(inputName, observedInputValue) {
    cy.get('#traditionalpageone form div[role = "group"] div[role = "combobox"] input[name = "' + inputName + '"]')
      .should('contain',observedInputValue);
  },
  checkCheckbox(inputName) {
    cy.get('#traditionalpageone form div[role = "group"] div[id = "' + inputName + '"] input[type = "checkbox"]')
      .check({force: true});
  },
  controlCheckedCheckbox(inputName, checked) {
    const checkedCondition = checked === true ? 'be.checked' : 'not.be.checked';
    cy.get('#traditionalpageone form div[role = "group"] div[id = "' + inputName + '"] input[type = "checkbox"]')
      .should(checkedCondition);
  },
  clickOnSave() {
    cy.get('.submission-form-footer button[id = "save"]').click();
  },
  clickOnSelection(nameOfSelection, optionNumber) {
    cy.get('.dropdown-menu button[title="' + nameOfSelection + '"]').eq(optionNumber).click();
  },
  clickAddMore(inputFieldOrder) {
    cy.get('#traditionalpageone form div[role = "group"] button[title = "Add more"]').eq(inputFieldOrder)
      .click({force: true});
  },
  checkDistributionLicenseStep() {
    cy.get('ds-clarin-license-distribution').should('be.visible');
  },
  checkDistributionLicenseToggle() {
    cy.get('ds-clarin-license-distribution ng-toggle').should('be.visible');
  },
  checkDistributionLicenseStatus(statusTitle: string) {
    cy.get('div[id = "license-header"] button i[title = "' + statusTitle + '"]').should('be.visible');
  },
  clickOnDistributionLicenseToggle() {
    cy.get('ds-clarin-license-distribution ng-toggle').click();
  },
  checkLicenseResourceStep() {
    cy.get('ds-submission-section-clarin-license').should('be.visible');
  },
  checkClarinNoticeStep() {
    cy.get('ds-clarin-notice').should('be.visible');
  },
  checkClarinNoticeStepNotExist() {
    cy.get('ds-clarin-notice').should('not.exist');
  },
  clickOnLicenseSelectorButton() {
    cy.get('ds-submission-section-clarin-license div[id = "aspect_submission_StepTransformer_item_"] button').click();
  },
  checkLicenseSelectorModal() {
    cy.get('section[class = "license-selector is-active"]').should('be.visible');
  },
  pickUpLicenseFromLicenseSelector() {
    cy.get('section[class = "license-selector is-active"] ul li').eq(0).dblclick();
  },
  checkLicenseSelectionValue(value: string) {
    cy.get('ds-submission-section-clarin-license input[id = "aspect_submission_StepTransformer_field_license"]').should('have.value', value);
  },
  selectValueFromLicenseSelection(id: number) {
    cy.get('ds-submission-section-clarin-license li[value = "' + id + '"]').click();
  },
  clickOnLicenseSelectionButton() {
    cy.get('ds-submission-section-clarin-license input[id = "aspect_submission_StepTransformer_field_license"]').click();
  },
  checkResourceLicenseStatus(statusTitle: string) {
    cy.get('div[id = "clarin-license-header"] button i[title = "' + statusTitle + '"]').should('be.visible');
  },
  showErrorMustChooseLicense() {
    cy.get('div[id = "sectionGenericError_clarin-license"] ds-alert').contains('You must choose one of the resource licenses.');
  },
  showErrorNotSupportedLicense() {
    cy.get('div[class = "form-group alert alert-danger in"]').contains('The selected license is not supported at the moment. Please follow the procedure described under section "None of these licenses suits your needs".');
  },
  checkAuthorLastnameField() {
    cy.get('ds-dynamic-autocomplete input[placeholder = "Last name"]').should('be.visible');
  },
  checkAuthorLastnameFieldValue(value) {
    cy.get('ds-dynamic-autocomplete input[placeholder = "Last name"]').should('have.value', value);
  },
  checkAuthorFirstnameField() {
    cy.get('dynamic-ng-bootstrap-input input[placeholder = "First name"]').should('be.visible');
  },
  checkAuthorFirstnameFieldValue(value) {
    cy.get('dynamic-ng-bootstrap-input input[placeholder = "First name"]').should('have.value', value);
  },
  writeAuthorInputField(value) {
    cy.get('ds-dynamic-autocomplete input[placeholder = "Last name"]').eq(0).click({force: true}).type(value);
  }
};



/**
 * Can be used by tests to generate a random XSRF/CSRF token and save it to
 * the required XSRF/CSRF cookie for usage when sending POST requests or similar.
 * The generated CSRF token is returned in a Chainable to allow it to be also sent
 * in the CSRF HTTP Header.
 * @returns a Cypress Chainable which can be used to get the generated CSRF Token
 */
function createCSRFCookie(): Cypress.Chainable {
    // Generate a new token which is a random UUID
    const csrfToken: string = uuidv4();

    // Save it to our required cookie
    cy.task('getRestBaseDomain').then((baseDomain: string) => {
        // Create a fake CSRF Token.  Set it in the required server-side cookie
        cy.setCookie(DSPACE_XSRF_COOKIE, csrfToken, { 'domain': baseDomain });
    });

    // return the generated token wrapped in a chainable
    return cy.wrap(csrfToken);
}
// Add as a Cypress command (i.e. assign to 'cy.createCSRFCookie')
Cypress.Commands.add('createCSRFCookie', createCSRFCookie);
