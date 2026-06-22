import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { ChangeHandlePrefixPageComponent } from './change-handle-prefix-page/change-handle-prefix-page.component';
import { EditHandlePageComponent } from './edit-handle-page/edit-handle-page.component';
import { HandlePageComponent } from './handle-page.component';
import {
  GLOBAL_ACTIONS_PATH,
  HANDLE_TABLE_EDIT_HANDLE_PATH,
  HANDLE_TABLE_NEW_HANDLE_PATH,
} from './handle-page-routing-paths';
import { NewHandlePageComponent } from './new-handle-page/new-handle-page.component';

/**
 * Routes for the handle management feature (admin handle table + new/edit/change-prefix).
 * Ported from the 7.x HandlePageRoutingModule to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  {
    path: '',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'handle-table' },
    component: HandlePageComponent,
    pathMatch: 'full',
  },
  {
    path: HANDLE_TABLE_NEW_HANDLE_PATH,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'handle-table.new-handle' },
    component: NewHandlePageComponent,
  },
  {
    path: HANDLE_TABLE_EDIT_HANDLE_PATH,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'handle-table.edit-handle' },
    component: EditHandlePageComponent,
  },
  {
    path: GLOBAL_ACTIONS_PATH,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'handle-table.global-actions' },
    component: ChangeHandlePrefixPageComponent,
  },
];
