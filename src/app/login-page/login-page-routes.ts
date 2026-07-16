import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { AuthFailedPageComponent } from './auth-failed-page/auth-failed-page.component';
import { AutoregistrationLoaderComponent } from './autoregistration/autoregistration-loader.component';
import { DuplicateUserErrorComponent } from './duplicate-user-error/duplicate-user-error.component';
import { MissingIdpHeadersComponent } from './missing-idp-headers/missing-idp-headers.component';
import { ThemedLoginPageComponent } from './themed-login-page.component';

export const ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ThemedLoginPageComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'login', title: 'login.title' },
  },
  // CLARIN shibboleth login outcome pages
  {
    path: 'auth-failed',
    component: AuthFailedPageComponent,
    data: { title: 'login.title' },
  },
  {
    path: 'missing-headers',
    component: MissingIdpHeadersComponent,
    data: { title: 'login.title' },
  },
  {
    path: 'autoregistration',
    component: AutoregistrationLoaderComponent,
    data: { title: 'login.title' },
  },
  {
    path: 'duplicate-user',
    component: DuplicateUserErrorComponent,
    data: { title: 'login.title' },
  },
];
