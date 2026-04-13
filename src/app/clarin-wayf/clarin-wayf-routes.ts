import { Route } from '@angular/router';

import { ClarinWayfComponent } from './clarin-wayf.component';
import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { WAYF_CONFIG } from './models/wayf-config.model';

export const ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ClarinWayfComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'wayf', title: 'wayf.title' },
    /**
     * Static WAYF configuration for the /wayf full-page route.
     *
     * When feedUrl is empty (default), the component auto-derives it from
     * the DSpace REST base URL: `${rest.baseUrl}/api/discojuice/feeds`.
     *
     * All fields are optional — the component falls back gracefully:
     *   feedUrl        → DSpace REST base + /api/discojuice/feeds
     *   defaultEntityId → last-used IdP from localStorage → nothing
     *   categoryFilter → null (show all IdPs)
     *   lang           → browser default
     */
    providers: [
      {
        provide: WAYF_CONFIG,
        useValue: {
          // feedUrl:         '/api/discojuice/feeds',
          // defaultEntityId: 'https://idp.your-university.org/shibboleth',
          // categoryFilter:  'clarin',
          // lang:            'en',
        },
      },
    ],
  },
];
