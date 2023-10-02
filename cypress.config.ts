import { defineConfig } from 'cypress';

export default defineConfig({
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixtures',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  env: {
    DSPACE_TEST_ADMIN_USER: 'dspacedemo+admin@gmail.com',
    DSPACE_TEST_ADMIN_PASSWORD: 'dspace',
    DSPACE_TEST_COMMUNITY: 'c4c8da3d-8105-49a1-94fa-f89ad3e9a887',
    DSPACE_TEST_COLLECTION: 'c6579e21-4d9b-44c7-a557-186c5e3471eb',
    DSPACE_TEST_ENTITY_PUBLICATION: 'e98b0f27-5c19-49a0-960d-eb6ad5287067',
    DSPACE_TEST_SEARCH_TERM: 'test',
    DSPACE_TEST_SUBMIT_COLLECTION_NAME: 'Sample Collection',
    DSPACE_TEST_SUBMIT_COLLECTION_UUID: '9d8334e9-25d3-4a67-9cea-3dffdef80144',
    DSPACE_TEST_SUBMIT_CLARIAH_COLLECTION_UUID:
      '7eb3562b-27f5-445f-8303-db771969cbff',
    DSPACE_TEST_SUBMIT_USER: 'dspacedemo+submit@gmail.com',
    DSPACE_TEST_SUBMIT_USER_PASSWORD: 'dspace',
    CLARIN_TEST_WITHDRAWN_ITEM: '7282fc76-0941-4055-a5a3-1f582c638050',
    CLARIN_TEST_WITHDRAWN_ITEM_WITH_REASON:
      '8ae76fcf-b26b-42f2-84d3-9a85e0517bca',
    CLARIN_TEST_WITHDRAWN_ITEM_WITH_REASON_AND_AUTHORS:
      'cd368b6a-0019-4813-bad9-5050e50ba36d',
    CLARIN_TEST_WITHDRAWN_REPLACED_ITEM: '566b1b8b-840d-476c-9fb0-b92fb92d4aad',
    CLARIN_TEST_WITHDRAWN_REPLACED_ITEM_WITH_AUTHORS:
      '600a9e09-dd31-428e-9328-2ed6631aa50a',
    CLARIN_TEST_WITHDRAWN_REASON: 'reason',
    CLARIN_TEST_WITHDRAWN_REPLACEMENT: 'new URL',
    CLARIN_TEST_WITHDRAWN_AUTHORS: 'author1, author2',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config)
    },
    baseUrl: 'http://127.0.0.1:4000',
  },
});
