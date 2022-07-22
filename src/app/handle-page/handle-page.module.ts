import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { FormModule } from '../shared/form/form.module';
import {HandlePageComponent} from './handle-page.component';
import {HandlePageRoutingModule} from './handle-page.routing.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import { HandleTableComponent } from './handle-table/handle-table.component';
import { HandleGlobalActionsComponent } from './handle-global-actions/handle-global-actions.component';
import { NewHandlePageComponent } from './new-handle-page/new-handle-page.component';
import { EditHandlePageComponent } from './edit-handle-page/edit-handle-page.component';
import { ChangeHandlePrefixPageComponent } from './change-handle-prefix-page/change-handle-prefix-page.component';

@NgModule({
  imports: [
    HandlePageRoutingModule,
    TranslateModule,
    SharedModule,
    CommonModule
  ],
  declarations: [
    HandlePageComponent,
    HandleTableComponent,
    HandleGlobalActionsComponent,
    NewHandlePageComponent,
    EditHandlePageComponent,
    ChangeHandlePrefixPageComponent
  ]
})
/**
 * This module handles all components related to the access control pages
 */
export class HandlePageModule {

}
