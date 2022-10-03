import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ThemedLoginPageComponent} from '../login-page/themed-login-page.component';
import {I18nBreadcrumbResolver} from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import {I18nBreadcrumbsService} from '../core/breadcrumbs/i18n-breadcrumbs.service';
import {LicenseContractPageComponent} from './license-contract-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', pathMatch: 'full', component: LicenseContractPageComponent}
    ])
  ]
})
export class LicenseContractPageRoutingModule {
}
