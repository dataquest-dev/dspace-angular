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

// When a command from ./commands is ready to use, import with `import './commands'` syntax
// import './commands';

// Import Cypress Axe tools for all tests
// https://github.com/component-driven/cypress-axe
import 'cypress-axe';

// Global constants used in tests
export const TEST_COLLECTION = '282164f5-d325-4740-8dd1-fa4d6d3e7200';
export const TEST_COMMUNITY = '0958c910-2037-42a9-81c7-dca80e3892b4';
export const TEST_ENTITY_PUBLICATION = 'e98b0f27-5c19-49a0-960d-eb6ad5287067';

export const TEST_WITHDRAWN_ITEM = '0cb397d7-3965-4668-bb70-06e6e9c70b48';
export const TEST_WITHDRAWN_ITEM_WITH_REASON = 'd803489f-adfe-4c75-9a51-0b1cd3a11eda';
export const TEST_WITHDRAWN_ITEM_WITH_REASON_AND_AUTHORS = 'e92d687c-4959-4b39-a4d5-167eaea4fc93';
export const TEST_WITHDRAWN_REPLACED_ITEM = 'd424ffab-6506-400c-a2eb-8abb471de383';
export const TEST_WITHDRAWN_REPLACED_ITEM_WITH_AUTHORS = 'deefd2d3-e475-409b-90fb-fb53c44ac832';


export const TEST_WITHDRAWN_REASON = 'reason';
export const TEST_WITHDRAWN_REPLACEMENT = 'new URL';
export const TEST_WITHDRAWN_AUTHORS = 'author1, author2';

