import { Route } from '@angular/router';

import { ClarinWayfComponent } from './clarin-wayf.component';
import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';

export const ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ClarinWayfComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'wayf', title: 'wayf.title' },
  },
];
