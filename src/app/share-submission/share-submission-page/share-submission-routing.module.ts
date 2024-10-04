import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ShareSubmissionPageComponent } from './share-submission-page.component';
import { I18nBreadcrumbResolver } from '../../core/breadcrumbs/i18n-breadcrumb.resolver';

const routes: Routes = [
  { path: '',
    component: ShareSubmissionPageComponent,
    resolve: { breadcrumb: I18nBreadcrumbResolver },
    data: {
      breadcrumbKey: 'share.submission',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShareSubmissionPageModule { }
