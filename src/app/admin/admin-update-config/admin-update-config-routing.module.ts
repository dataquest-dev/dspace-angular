import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminUpdateConfigComponent } from './admin-update-config.component';
import { I18nBreadcrumbResolver } from '../../core/breadcrumbs/i18n-breadcrumb.resolver';
import { SiteAdministratorGuard } from '../../core/data/feature-authorization/feature-authorization-guard/site-administrator.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminUpdateConfigComponent,
    resolve: { breadcrumb: I18nBreadcrumbResolver },
    canActivate: [SiteAdministratorGuard],
    data: { title: 'admin.update-config.title', breadcrumbKey: 'admin.update-config.breadcrumbs' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminUpdateConfigRoutingModule { }