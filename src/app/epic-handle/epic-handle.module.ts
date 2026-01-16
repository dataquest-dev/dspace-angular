import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpicHandleRoutingModule } from './epic-handle-routing.module';
import { EpicHandleComponent } from './epic-handle.component';
import { TranslateModule } from '@ngx-translate/core';
import { EpicHandleTableComponent } from './epic-handle-table/epic-handle-table.component';
import { CoreModule } from '../core/core.module';
import { EpicHandleNewComponent } from './epic-handle-new/epic-handle-new.component';
import { EpicHandleEditComponent } from './epic-handle-edit/epic-handle-edit.component';
import { SharedModule } from '../shared/shared.module';
import { EpicHandlePrefixComponent } from './epic-handle-prefix/epic-handle-prefix.component';

@NgModule({
  declarations: [
    EpicHandleComponent,
    EpicHandleTableComponent,
    EpicHandleNewComponent,
    EpicHandleEditComponent,
    EpicHandlePrefixComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    CoreModule,
    EpicHandleRoutingModule,
    TranslateModule
  ]
})
export class EpicHandleModule { }
