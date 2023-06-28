import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, of as observableOf } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { DynamicFormLayoutService, DynamicFormValidationService } from '@ng-dynamic-forms/core';
import { PageInfo } from '../../../../../../core/shared/page-info.model';
import { isEmpty } from '../../../../../empty.util';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import { FormFieldMetadataValueObject } from '../../../models/form-field-metadata-value.model';
import { DsDynamicScrollableDropdownComponent } from '../scrollable-dropdown/dynamic-scrollable-dropdown.component';
import {
  DynamicScrollableDropdownModel
} from '../scrollable-dropdown/dynamic-scrollable-dropdown.model';
import { DsDynamicSponsorAutocompleteModel } from '../sponsor-autocomplete/ds-dynamic-sponsor-autocomplete.model';
import { DynamicComplexModel } from '../ds-dynamic-complex.model';
import { DsDynamicInputModel } from '../ds-dynamic-input.model';
import { DYNAMIC_FORM_CONTROL_TYPE_AUTOCOMPLETE } from '../autocomplete/ds-dynamic-autocomplete.model';

const DYNAMIC_INPUT_TYPE = 'INPUT';

/**
 * Component representing a dropdown input field
 */
@Component({
  selector: 'ds-dynamic-sponsor-scrollable-dropdown',
  styleUrls: ['../scrollable-dropdown/dynamic-scrollable-dropdown.component.scss'],
  templateUrl: '../scrollable-dropdown/dynamic-scrollable-dropdown.component.html'
})
export class DsDynamicSponsorScrollableDropdownComponent extends DsDynamicScrollableDropdownComponent implements OnInit {
  @Input() bindId = true;
  @Input() group: FormGroup;
  @Input() model: DynamicScrollableDropdownModel;

  @Output() blur: EventEmitter<any> = new EventEmitter<any>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();
  @Output() focus: EventEmitter<any> = new EventEmitter<any>();

  public currentValue: Observable<string>;
  public loading = false;
  public pageInfo: PageInfo;
  public optionsList: any;

  constructor(protected vocabularyService: VocabularyService,
              protected cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService
  ) {
    super(vocabularyService, cdr, layoutService, validationService);
  }

  /**
   * Sets the current value with the given value.
   * @param value The value to set.
   * @param init Representing if is init value or not.
   */
  setCurrentValue(value: any, init = false): void {
    let result: Observable<string>;

    if (init) {
      result = this.getInitValueFromModel().pipe(
        map((formValue: FormFieldMetadataValueObject) => formValue.display)
      );
    } else {
      if (isEmpty(value)) {
        result = observableOf('');
      } else if (typeof value === 'string') {
        result = observableOf(value);
      } else {
        result = observableOf(value.display);
      }
    }

    result.pipe(take(1)).subscribe(resultValue => {
      this.cleanSponsorInputs(resultValue, this.model?.parent);
    });

    this.currentValue = result;
  }

  /**
   * Clean all input in the sponsor complex input field
   * @private
   */
  private cleanSponsorInputs(fundingTypeValue, complexInputField: any) {
    // the parent must be a complex input field
    if (!(complexInputField instanceof DynamicComplexModel)) {
      return;
    }

    // clean inputs
    complexInputField.group.forEach(input => {
      switch (input.type) {
        case DYNAMIC_FORM_CONTROL_TYPE_AUTOCOMPLETE:
          (input as DsDynamicSponsorAutocompleteModel).value = '';
          break;
        case DYNAMIC_INPUT_TYPE:
          (input as DsDynamicInputModel).value = '';
          break;
        default:
          break;
      }
    });
  }
}
