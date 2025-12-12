import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { I18nBreadcrumbsService } from '../core/breadcrumbs/i18n-breadcrumbs.service';
import { ThemedContactPageComponent } from './themed-contact-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'full',
        component: ThemedContactPageComponent,
        resolve: { breadcrumb: i18nBreadcrumbResolver },
        data: { breadcrumbKey: 'contact-us', title: 'contact-us.title' },
      },
    ]),
  ],
  providers: [
    I18nBreadcrumbsService,
  ],
})
export class ContactPageRoutingModule {
}
