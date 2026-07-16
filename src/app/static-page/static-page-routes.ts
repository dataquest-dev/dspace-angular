import { Route } from '@angular/router';

import { StaticPageComponent } from './static-page.component';

/**
 * Routes for the CLARIN static (HTML) pages.
 * Ported from the 7.x StaticPageModule routing to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  { path: '', component: StaticPageComponent },
  { path: ':htmlFileName', component: StaticPageComponent },
];
