import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EpicHandleComponent } from './epic-handle.component';
import { I18nBreadcrumbResolver } from '../core/breadcrumbs/i18n-breadcrumb.resolver';
import { EpicHandlePrefixComponent } from './epic-handle-prefix/epic-handle-prefix.component';
import { EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH, EPIC_HANDLE_TABLE_NEW_HANDLE_PATH } from './epic-handle-routing-paths';
import { EpicHandleNewComponent } from './epic-handle-new/epic-handle-new.component';
import { EpicHandleEditComponent } from './epic-handle-edit/epic-handle-edit.component';

const routes: Routes = [
  {
    path: 'prefix',
    resolve: { breadcrumb: I18nBreadcrumbResolver },
    data: {
      breadcrumbKey: 'epic-handle-table'
    },
    component: EpicHandlePrefixComponent,
  },
  {
    path: EPIC_HANDLE_TABLE_NEW_HANDLE_PATH,
    resolve: { breadcrumb: I18nBreadcrumbResolver },
    data: {
      breadcrumbKey: 'epic-handle-table.new-handle'
    },
    component: EpicHandleNewComponent
  },
  {
    path: EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH,
    resolve: { breadcrumb: I18nBreadcrumbResolver },
    data: {
      breadcrumbKey: 'epic-handle-table.edit-handle'
    },
    component: EpicHandleEditComponent
  },
  {
    path: '',
    resolve: { breadcrumb: I18nBreadcrumbResolver },
    data: {
      breadcrumbKey: 'epic-handle-table'
    },
    component: EpicHandleComponent,
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EpicHandleRoutingModule { }
