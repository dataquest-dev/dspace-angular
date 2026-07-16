import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { EpicHandleComponent } from './epic-handle.component';
import { EpicHandleEditComponent } from './epic-handle-edit/epic-handle-edit.component';
import { EpicHandleNewComponent } from './epic-handle-new/epic-handle-new.component';
import { EpicHandlePrefixComponent } from './epic-handle-prefix/epic-handle-prefix.component';
import {
  EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH,
  EPIC_HANDLE_TABLE_NEW_HANDLE_PATH,
} from './epic-handle-routing-paths';

/**
 * Routes for the EPIC PID handle management feature (table + prefix + new/edit).
 * Ported from the 7.x EpicHandleRoutingModule to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  {
    path: 'prefix',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'epic-handle-table' },
    component: EpicHandlePrefixComponent,
  },
  {
    path: EPIC_HANDLE_TABLE_NEW_HANDLE_PATH,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'epic-handle-table.new-handle' },
    component: EpicHandleNewComponent,
  },
  {
    path: EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'epic-handle-table.edit-handle' },
    component: EpicHandleEditComponent,
  },
  {
    path: '',
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'epic-handle-table' },
    component: EpicHandleComponent,
  },
];
