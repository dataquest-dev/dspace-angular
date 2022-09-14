import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedModule} from '../shared/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import {ReactiveFormsModule} from '@angular/forms';
import { ClarinLicensePageComponent } from './clarin-license-page/clarin-license-page.component';
import {ClarinLicenseRoutingModule} from './clarin-license-routing.module';
import { ClarinLicenseTableComponent } from './clarin-license-table/clarin-license-table.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { DefineLicenseFormComponent } from './clarin-license-table/modal/define-license-form/define-license-form.component';
import { DefineLicenseLabelFormComponent } from './clarin-license-table/modal/define-license-label-form/define-license-label-form.component';
import { EditLicenseLabelFormComponent } from './clarin-license-table/modal/edit-license-label-form/edit-license-label-form.component';
import { EditLicenseFormComponent } from './clarin-license-table/modal/edit-license-form/edit-license-form.component';

@NgModule({
  declarations: [
    ClarinLicensePageComponent,
    ClarinLicenseTableComponent,
    DefineLicenseFormComponent,
    DefineLicenseLabelFormComponent,
    EditLicenseLabelFormComponent,
    EditLicenseFormComponent
  ],
    imports: [
        CommonModule,
        ClarinLicenseRoutingModule,
        TranslateModule,
        SharedModule,
        ReactiveFormsModule
    ],
  providers: [
    NgbActiveModal
  ],
})
export class ClarinLicenseModule { }
