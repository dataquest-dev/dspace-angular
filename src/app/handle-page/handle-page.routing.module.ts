import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { I18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import {
  SiteAdministratorGuard
} from '../core/data/feature-authorization/feature-authorization-guard/site-administrator.guard';
import { HandlePageModule } from './handle-page.module';
import {HandlePageComponent} from './handle-page.component';
import {COMMUNITY_EDIT_PATH} from '../community-page/community-page-routing-paths';
import {CommunityPageAdministratorGuard} from '../community-page/community-page-administrator.guard';
import {HANDLE_TABLE_EDIT_HANDLE_PATH, HANDLE_TABLE_NEW_HANDLE_PATH} from './handle-page-routing-paths';
import {DeleteCommunityPageComponent} from '../community-page/delete-community-page/delete-community-page.component';
import {AuthenticatedGuard} from '../core/auth/authenticated.guard';
import {NewHandlePageComponent} from './new-handle-page/new-handle-page.component';
import {EditHandlePageComponent} from './edit-handle-page/edit-handle-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        resolve: { breadcrumb: I18nBreadcrumbResolver },
        data: {
          breadcrumbKey: 'handle-table',
        },
        component: HandlePageComponent,
      },
      {
        path: HANDLE_TABLE_NEW_HANDLE_PATH,
        resolve: { breadcrumb: I18nBreadcrumbResolver },
        data: {
          breadcrumbKey: 'handle-table.new-handle',
        },
        component: NewHandlePageComponent,
      },
      {
        path: HANDLE_TABLE_EDIT_HANDLE_PATH,
        resolve: { breadcrumb: I18nBreadcrumbResolver },
        data: {
          breadcrumbKey: 'handle-table.edit-handle',
        },
        component: EditHandlePageComponent,
      },
    ])
  ]
})
export class HandlePageRoutingModule {

}
