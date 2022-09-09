import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedModule} from '../shared/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import {ReactiveFormsModule} from '@angular/forms';
import { ClarinLicensePageComponent } from './clarin-license-page/clarin-license-page.component';
import {ClarinLicenseRoutingModule} from './clarin-license-routing.module';
import { ClarinLicenseTableComponent } from './clarin-license-table/clarin-license-table.component';

@NgModule({
  declarations: [
    ClarinLicensePageComponent,
    ClarinLicenseTableComponent
  ],
  imports: [
    CommonModule,
    ClarinLicenseRoutingModule,
    TranslateModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ClarinLicenseModule { }
