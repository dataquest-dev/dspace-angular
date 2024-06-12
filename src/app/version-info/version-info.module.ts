import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionInfoRoutingModule } from './version-info-routing.module';
import { VersionInfoComponent } from './version-info.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [VersionInfoComponent],
  imports: [
    CommonModule,
    TranslateModule,
    SharedModule,
    VersionInfoRoutingModule
  ],
})
export class VersionInfoModule { }
