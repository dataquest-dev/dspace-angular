import { Component } from '@angular/core';
import { AbstractDsoEditMetadataValueFieldComponent } from '../abstract-dso-edit-metadata-value-field.component';

/**
 * The component used to gather input for plain-text metadata fields
 */
@Component({
  selector: 'ds-dso-edit-metadata-text-field',
  templateUrl: './dso-edit-metadata-text-field.component.html',
  styleUrls: ['./dso-edit-metadata-text-field.component.scss'],
})
export class DsoEditMetadataTextFieldComponent extends AbstractDsoEditMetadataValueFieldComponent {
}
