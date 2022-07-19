import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { FormModule } from '../shared/form/form.module';
import {HandleTablePageComponent} from './handle-table-page/handle-table-page.component';
import {HandleTablePageRoutingModule} from './handle-table-page.routing.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    HandleTablePageRoutingModule,
  ],
  declarations: [
    HandleTablePageComponent
  ]
})
/**
 * This module handles all components related to the access control pages
 */
export class HandleTablePageModule {

}
