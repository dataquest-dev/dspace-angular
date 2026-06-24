import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { LicenseContractPageComponent } from './license-contract-page.component';

/**
 * Routes for the CLARIN license contract page (distribution-license display per collection).
 * Ported from the 7.x LicenseContractPageRoutingModule to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  {
    path: '',
    component: LicenseContractPageComponent,
    pathMatch: 'full',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'contract' },
  },
];
