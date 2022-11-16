import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { EditBitstreamPageComponent } from './edit-bitstream-page/edit-bitstream-page.component';
import { BitstreamPageRoutingModule } from './bitstream-page-routing.module';
import { BitstreamAuthorizationsComponent } from './bitstream-authorizations/bitstream-authorizations.component';
import { FormModule } from '../shared/form/form.module';
import { ResourcePoliciesModule } from '../shared/resource-policies/resource-policies.module';
import { ClarinBitstreamDownloadPageComponent } from './clarin-bitstream-download-page/clarin-bitstream-download-page.component';
import { ClarinLicenseAgreementPageComponent } from './clarin-license-agreement-page/clarin-license-agreement-page.component';
import {ItemPageResolver} from '../item-page/item-page.resolver';
import {ItemPageByBitstreamResolver} from './item-page-by-bitstream.resolver';
import {HttpClientModule} from '@angular/common/http';

/**
 * This module handles all components that are necessary for Bitstream related pages
 */
@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    BitstreamPageRoutingModule,
    FormModule,
    ResourcePoliciesModule,
    HttpClientModule
  ],
  declarations: [
    BitstreamAuthorizationsComponent,
    EditBitstreamPageComponent,
    ClarinBitstreamDownloadPageComponent,
    ClarinLicenseAgreementPageComponent
  ],
  providers: [
    ItemPageByBitstreamResolver
  ]
})
export class BitstreamPageModule {
}
