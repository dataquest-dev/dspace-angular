import { Route } from '@angular/router';

import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { DSpaceObjectType } from '../core/shared/dspace-object-type.model';
import { configurationSearchPageGuard } from './configuration-search-page.guard';
import { ThemedConfigurationSearchPageComponent } from './themed-configuration-search-page.component';
import { ThemedSearchPageComponent } from './themed-search-page.component';

export const ROUTES: Route[] = [{
  path: '',
  resolve: { breadcrumb: i18nBreadcrumbResolver }, data: { title: 'search.title', breadcrumbKey: 'search' },
  children: [
    { path: '', component: ThemedSearchPageComponent },
    {
      path: ':configuration',
      component: ThemedConfigurationSearchPageComponent,
      canActivate: [configurationSearchPageGuard],
      // Bound to the component input: public search lists items only, like /search.
      data: { forcedDsoTypes: [DSpaceObjectType.ITEM] },
    },
  ],
}];
