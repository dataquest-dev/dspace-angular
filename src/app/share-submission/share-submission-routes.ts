import { Route } from '@angular/router';

import { ChangeSubmitterPageComponent } from '../change-submitter-page/change-submitter-page.component';
import { i18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { ShareSubmissionPageComponent } from './share-submission-page/share-submission-page.component';

/**
 * Routes for the "Sharing a submission" feature (share link + change-submitter).
 * Ported from the 7.x ShareSubmissionPageModule to the v9 standalone routes pattern.
 */
export const ROUTES: Route[] = [
  {
    path: '',
    component: ShareSubmissionPageComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'share.submission' },
  },
  {
    path: 'change-submitter',
    component: ChangeSubmitterPageComponent,
    resolve: { breadcrumb: i18nBreadcrumbResolver },
    data: { breadcrumbKey: 'change.submitter' },
  },
];
