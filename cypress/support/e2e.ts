// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import all custom Commands (from commands.ts) for all tests
import './commands';

// Import Cypress Axe tools for all tests
// https://github.com/component-driven/cypress-axe
import 'cypress-axe';
import { DSPACE_XSRF_COOKIE } from 'src/app/core/xsrf/xsrf.constants';


// Runs once before all tests
before(() => {
  // Cypress doesn't have access to the running application in Node.js.
  // So, it's not possible to inject or load the AppConfig or environment of the Angular UI.
  // Instead, we'll read our running application's config.json, which contains the configs &
  // is regenerated at runtime each time the Angular UI application starts up.
  cy.task('readUIConfig').then((str: string) => {
    // Parse config into a JSON object
    const config = JSON.parse(str);

    // Find URL of our REST API & save to global variable via task
    let baseRestUrl = FALLBACK_TEST_REST_BASE_URL;
    if (!config.rest.baseUrl) {
        console.warn("Could not load 'rest.baseUrl' from config.json. Falling back to " + FALLBACK_TEST_REST_BASE_URL);
    } else {
        baseRestUrl = config.rest.baseUrl;
    }
    cy.task('saveRestBaseURL', baseRestUrl);

    // Find domain of our REST API & save to global variable via task.
    let baseDomain = FALLBACK_TEST_REST_DOMAIN;
    if (!config.rest.host) {
        console.warn("Could not load 'rest.host' from config.json. Falling back to " + FALLBACK_TEST_REST_DOMAIN);
    } else {
        baseDomain = config.rest.host;
    }
    cy.task('saveRestBaseDomain', baseDomain);

  });
});

// Runs once before the first test in each "block"
beforeEach(() => {
    // Pre-agree to all Klaro cookies by setting the klaro-anonymous cookie
    // This just ensures it doesn't get in the way of matching other objects in the page.
    cy.setCookie('klaro-anonymous', '{%22authentication%22:true%2C%22preferences%22:true%2C%22acknowledgement%22:true%2C%22google-analytics%22:true%2C%22google-recaptcha%22:true%2C%22accessibility%22:true}');

    // Remove any CSRF cookies saved from prior tests
    cy.clearCookie(DSPACE_XSRF_COOKIE);
});

// Hide the Klaro cookie-consent banner in every test window. Even with a pre-set
// klaro-anonymous cookie, Klaro may still render the notice (e.g. when its
// internal consent version changes after a config update), and that notice
// overlaps interactive elements such as the admin sidebar toggle. Injecting a
// `display: none` rule for the `.klaro` container at every page load keeps the
// banner from intercepting clicks during e2e tests.
Cypress.on('window:before:load', (win) => {
    const injectKlaroHider = () => {
        if (!win.document.getElementById('cypress-hide-klaro')) {
            const style = win.document.createElement('style');
            style.id = 'cypress-hide-klaro';
            style.textContent = '.klaro { display: none !important; }';
            (win.document.head || win.document.documentElement).appendChild(style);
        }
    };
    if (win.document && win.document.head) {
        injectKlaroHider();
    } else {
        win.addEventListener('DOMContentLoaded', injectKlaroHider, { once: true });
    }
});

// NOTE: FALLBACK_TEST_REST_BASE_URL is only used if Cypress cannot read the REST API BaseURL
// from the Angular UI's config.json. See 'before()' above.
const FALLBACK_TEST_REST_BASE_URL = 'http://localhost:8080/server';
const FALLBACK_TEST_REST_DOMAIN = 'localhost';
// Admin account used for administrative tests
export const TEST_ADMIN_USER = Cypress.env('DSPACE_TEST_ADMIN_USER') || 'dspacedemo+admin@gmail.com';
export const TEST_ADMIN_PASSWORD = Cypress.env('DSPACE_TEST_ADMIN_PASSWORD') || 'dspace';
// Community/collection/publication used for view/edit tests
export const TEST_COLLECTION = Cypress.env('DSPACE_TEST_COLLECTION') || '282164f5-d325-4740-8dd1-fa4d6d3e7200';
export const TEST_COMMUNITY = Cypress.env('DSPACE_TEST_COMMUNITY') || '0958c910-2037-42a9-81c7-dca80e3892b4';
export const TEST_ENTITY_PUBLICATION = Cypress.env('DSPACE_TEST_ENTITY_PUBLICATION') || 'e98b0f27-5c19-49a0-960d-eb6ad5287067';
// Search term (should return results) used in search tests
export const TEST_SEARCH_TERM = Cypress.env('DSPACE_TEST_SEARCH_TERM') || 'test';
// Collection used for submission tests
export const TEST_SUBMIT_COLLECTION_NAME = Cypress.env('DSPACE_TEST_SUBMIT_COLLECTION_NAME') || 'Sample Collection';
export const TEST_SUBMIT_COLLECTION_UUID = Cypress.env('DSPACE_TEST_SUBMIT_COLLECTION_UUID') || '9d8334e9-25d3-4a67-9cea-3dffdef80144';
export const TEST_SUBMIT_USER = Cypress.env('DSPACE_TEST_SUBMIT_USER') || 'dspacedemo+submit@gmail.com';
export const TEST_SUBMIT_USER_PASSWORD = Cypress.env('DSPACE_TEST_SUBMIT_USER_PASSWORD') || 'dspace';

export const TEST_SUBMIT_CLARIAH_COLLECTION_UUID = Cypress.env('DSPACE_TEST_SUBMIT_CLARIAH_COLLECTION_UUID') || '7eb3562b-27f5-445f-8303-db771969cbff';
export const TEST_WITHDRAWN_ITEM = Cypress.env('CLARIN_TEST_WITHDRAWN_ITEM') || '921d256f-c64f-438e-b17e-13fb75a64e19';
export const TEST_WITHDRAWN_ITEM_WITH_REASON = Cypress.env('CLARIN_TEST_WITHDRAWN_ITEM_WITH_REASON') || 'ce6ceeb4-8f47-4d5a-ad22-e87b3110cc04';
export const TEST_WITHDRAWN_ITEM_WITH_REASON_AND_AUTHORS = Cypress.env('CLARIN_TEST_WITHDRAWN_ITEM_WITH_REASON_AND_AUTHORS') || 'ad27520a-98c0-40a4-bfc3-2edd857b3418';
export const TEST_WITHDRAWN_REPLACED_ITEM = Cypress.env('CLARIN_TEST_WITHDRAWN_REPLACED_ITEM') || '94c48fc7-0425-48dc-9be6-7e7087534a3d';
export const TEST_WITHDRAWN_REPLACED_ITEM_WITH_AUTHORS = Cypress.env('CLARIN_TEST_WITHDRAWN_REPLACED_ITEM_WITH_AUTHORS') || '0e9ef1cb-5b9f-4acc-a7ca-5a9a66a6ddbd';

export const TEST_WITHDRAWN_REASON = Cypress.env('CLARIN_TEST_WITHDRAWN_REASON') || 'reason';
export const TEST_WITHDRAWN_REPLACEMENT = Cypress.env('CLARIN_TEST_WITHDRAWN_REPLACEMENT') || 'new URL';
export const TEST_WITHDRAWN_AUTHORS = Cypress.env('CLARIN_TEST_WITHDRAWN_AUTHORS') || 'author1, author2';

export const TEST_COLLECTION_NAME = 'Col';
export const TEST_COMMUNITY_NAME = 'Com';


// USEFUL REGEX for testing

// Match any string that contains at least one non-space character
// Can be used with "contains()" to determine if an element has a non-empty text value
export const REGEX_MATCH_NON_EMPTY_TEXT = /^(?!\s*$).+/;
