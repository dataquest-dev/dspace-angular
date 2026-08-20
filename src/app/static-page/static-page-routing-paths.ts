/**
 * Constants for the `/static` route.
 *
 * The static page component loads `.html` files bundled from `src/static-files`
 * (registered as a build asset in `angular.json`). This is how the deployed-version
 * info is served at `/static/VERSION_D` (issue #813).
 */
export const STATIC_PAGE_PATH = 'static';

export const STATIC_FILES_PROJECT_PATH = 'static-files';

export const HTML_SUFFIX = '.html';
