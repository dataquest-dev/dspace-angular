import { Route } from '@angular/router';

import { LICENSES_MANAGE_TABLE_PATH } from '../app-routing-paths';
import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { siteAdministratorGuard } from '../core/data/feature-authorization/feature-authorization-guard/site-administrator.guard';
import { ClarinAllLicensesPageComponent } from './clarin-all-licenses-page/clarin-all-licenses-page.component';
import { ClarinLicensePageComponent } from './clarin-license-page/clarin-license-page.component';

/**
 * Routes for the CLARIN license pages (public license list + admin manage-table).
 * Ported from the 7.x ClarinLicenseRoutingModule to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  {
    path: '',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    component: ClarinAllLicensesPageComponent,
    data: { breadcrumbKey: 'licenses' },
  },
  {
    path: LICENSES_MANAGE_TABLE_PATH,
    component: ClarinLicensePageComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'licenses.manage-table' },
    canActivate: [siteAdministratorGuard],
  },
];
