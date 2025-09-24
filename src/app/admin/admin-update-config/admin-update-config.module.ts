import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AdminUpdateConfigComponent } from './admin-update-config.component';
import { AdminUpdateConfigService } from './admin-update-config.service';
import { AdminUpdateConfigRoutingModule } from './admin-update-config-routing.module';

@NgModule({
  declarations: [
    AdminUpdateConfigComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    AdminUpdateConfigRoutingModule
  ],
  providers: [
    AdminUpdateConfigService
  ]
})
export class AdminUpdateConfigModule { }