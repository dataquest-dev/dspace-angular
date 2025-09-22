import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgComponentOutlet, NgIf } from '@angular/common';

import { Context } from '../../../../core/shared/context.model';
import { DSpaceObject } from '../../../../core/shared/dspace-object.model';
import { DsoEditMetadataValue } from '../../dso-edit-metadata-form';
import { EditMetadataValueFieldType } from '../dso-edit-metadata-field-type.enum';
import { DsoEditMetadataAuthorityFieldComponent } from '../dso-edit-metadata-authority-field/dso-edit-metadata-authority-field.component';
import { DsoEditMetadataEntityFieldComponent } from '../dso-edit-metadata-entity-field/dso-edit-metadata-entity-field.component';
import { DsoEditMetadataTextFieldComponent } from '../dso-edit-metadata-text-field/dso-edit-metadata-text-field.component';

/**
 * A component responsible for dynamically loading and rendering the appropriate edit metadata value field components
 * based on the type of the metadata field ({@link EditMetadataValueFieldType}) and the place where it's used
 * ({@link Context}).
 */
@Component({
  selector: 'ds-dso-edit-metadata-value-field-loader',
  template: `
    <ng-container [ngSwitch]="type">
      <ds-dso-edit-metadata-authority-field 
        *ngSwitchCase="EditMetadataValueFieldType.AUTHORITY"
        [context]="context"
        [dso]="dso"
        [dsoType]="dsoType"
        [mdField]="mdField"
        [mdValue]="mdValue"
        (confirm)="confirm.emit($event)">
      </ds-dso-edit-metadata-authority-field>
      
      <ds-dso-edit-metadata-entity-field 
        *ngSwitchCase="EditMetadataValueFieldType.ENTITY_TYPE"
        [context]="context"
        [dso]="dso"
        [dsoType]="dsoType"
        [mdField]="mdField"
        [mdValue]="mdValue"
        (confirm)="confirm.emit($event)">
      </ds-dso-edit-metadata-entity-field>
      
      <ds-dso-edit-metadata-text-field 
        *ngSwitchDefault
        [context]="context"
        [dso]="dso"
        [dsoType]="dsoType"
        [mdField]="mdField"
        [mdValue]="mdValue"
        (confirm)="confirm.emit($event)">
      </ds-dso-edit-metadata-text-field>
    </ng-container>
  `,
})
export class DsoEditMetadataValueFieldLoaderComponent {

  /**
   * The optional context
   */
  @Input() context: Context;

  /**
   * The {@link DSpaceObject}
   */
  @Input() dso: DSpaceObject;

  /**
   * The type of the DSO, used to determines i18n messages
   */
  @Input() dsoType: string;

  /**
   * The type of the field
   */
  @Input() type: EditMetadataValueFieldType;

  /**
   * The metadata field
   */
  @Input() mdField: string;

  /**
   * Editable metadata value to show
   */
  @Input() mdValue: DsoEditMetadataValue;

  /**
   * Emits when the user clicked confirm
   */
  @Output() confirm: EventEmitter<boolean> = new EventEmitter();

  // Make enum available in template
  readonly EditMetadataValueFieldType = EditMetadataValueFieldType;

}
