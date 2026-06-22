import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { ThemedContactPageComponent } from './themed-contact-page.component';

/**
 * Routes for the CLARIN contact page.
 * Ported from the 7.x ContactPageRoutingModule to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  {
    path: '',
    component: ThemedContactPageComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'contact-us', title: 'contact-us.title' },
  },
];
