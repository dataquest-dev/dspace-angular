import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FormModule } from '../shared/form/form.module';
import { DsoEditMetadataComponent } from './dso-edit-metadata/dso-edit-metadata.component';
import { MetadataFieldSelectorComponent } from './dso-edit-metadata/metadata-field-selector/metadata-field-selector.component';
import { DsoEditMetadataFieldValuesComponent } from './dso-edit-metadata/dso-edit-metadata-field-values/dso-edit-metadata-field-values.component';
import { DsoEditMetadataValueComponent } from './dso-edit-metadata/dso-edit-metadata-value/dso-edit-metadata-value.component';
import { DsoEditMetadataHeadersComponent } from './dso-edit-metadata/dso-edit-metadata-headers/dso-edit-metadata-headers.component';
import { DsoEditMetadataValueHeadersComponent } from './dso-edit-metadata/dso-edit-metadata-value-headers/dso-edit-metadata-value-headers.component';
import { ThemedDsoEditMetadataComponent } from './dso-edit-metadata/themed-dso-edit-metadata.component';
import { DsoEditMetadataValueFieldLoaderComponent } from './dso-edit-metadata/dso-edit-metadata-value-field/dso-edit-metadata-value-field-loader/dso-edit-metadata-value-field-loader.component';
import { DsoEditMetadataAuthorityFieldComponent } from './dso-edit-metadata/dso-edit-metadata-value-field/dso-edit-metadata-authority-field/dso-edit-metadata-authority-field.component';
import { DsoEditMetadataEntityFieldComponent } from './dso-edit-metadata/dso-edit-metadata-value-field/dso-edit-metadata-entity-field/dso-edit-metadata-entity-field.component';
import { DsoEditMetadataTextFieldComponent } from './dso-edit-metadata/dso-edit-metadata-value-field/dso-edit-metadata-text-field/dso-edit-metadata-text-field.component';

@NgModule({
  imports: [
    SharedModule,
    FormModule,
  ],
  declarations: [
    DsoEditMetadataComponent,
    ThemedDsoEditMetadataComponent,
    MetadataFieldSelectorComponent,
    DsoEditMetadataFieldValuesComponent,
    DsoEditMetadataValueComponent,
    DsoEditMetadataHeadersComponent,
    DsoEditMetadataValueHeadersComponent,
    DsoEditMetadataValueFieldLoaderComponent,
    DsoEditMetadataAuthorityFieldComponent,
    DsoEditMetadataEntityFieldComponent,
    DsoEditMetadataTextFieldComponent,
  ],
  exports: [
    DsoEditMetadataComponent,
    ThemedDsoEditMetadataComponent,
    MetadataFieldSelectorComponent,
    DsoEditMetadataFieldValuesComponent,
    DsoEditMetadataValueComponent,
    DsoEditMetadataHeadersComponent,
    DsoEditMetadataValueHeadersComponent,
    DsoEditMetadataValueFieldLoaderComponent,
    DsoEditMetadataAuthorityFieldComponent,
    DsoEditMetadataEntityFieldComponent,
    DsoEditMetadataTextFieldComponent,
  ],
})
export class DsoSharedModule {

}
