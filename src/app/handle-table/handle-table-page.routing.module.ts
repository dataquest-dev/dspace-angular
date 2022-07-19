import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { I18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import {
  SiteAdministratorGuard
} from '../core/data/feature-authorization/feature-authorization-guard/site-administrator.guard';
import { HandleTablePageModule } from './handle-table-page.module';
import {HandleTablePageComponent} from './handle-table-page/handle-table-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        resolve: { breadcrumb: I18nBreadcrumbResolver },
        data: {
          breadcrumbKey: 'handle-table',
          title: 'home.top-level-communities.help',
        },
        canActivate: [SiteAdministratorGuard],
        component: HandleTablePageComponent
      }
    ])
  ]
})
export class HandleTablePageRoutingModule {

}
