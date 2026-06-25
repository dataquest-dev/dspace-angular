import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Injector,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import isEqual from 'lodash/isEqual';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import {
  Observable,
  of,
} from 'rxjs';
import {
  map,
  take,
} from 'rxjs/operators';
import {
  APP_DATA_SERVICES_MAP,
  LazyDataServicesMap,
} from 'src/config/app-config.interface';

import { PageInfo } from '../../../../../../core/shared/page-info.model';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import { isEmpty } from '../../../../../empty.util';
import { FormFieldMetadataValueObject } from '../../../models/form-field-metadata-value.model';
import { DYNAMIC_FORM_CONTROL_TYPE_AUTOCOMPLETE } from '../autocomplete/ds-dynamic-autocomplete.model';
import {
  DynamicComplexModel,
  EU_IDENTIFIER_INDEX,
} from '../ds-dynamic-complex.model';
import { DsDynamicInputModel } from '../ds-dynamic-input.model';
import { DsDynamicScrollableDropdownComponent } from '../scrollable-dropdown/dynamic-scrollable-dropdown.component';
import {
  DYNAMIC_FORM_CONTROL_TYPE_SCROLLABLE_DROPDOWN,
  DynamicScrollableDropdownModel,
} from '../scrollable-dropdown/dynamic-scrollable-dropdown.model';
import {
  DEFAULT_EU_DISPLAY_VALUE,
  DsDynamicSponsorAutocompleteModel,
} from '../sponsor-autocomplete/ds-dynamic-sponsor-autocomplete.model';

const DYNAMIC_INPUT_TYPE = 'INPUT';

/**
 * Component representing a dropdown input field
 */
@Component({
  selector: 'ds-dynamic-sponsor-scrollable-dropdown',
  styleUrls: ['../scrollable-dropdown/dynamic-scrollable-dropdown.component.scss'],
  templateUrl: '../scrollable-dropdown/dynamic-scrollable-dropdown.component.html',
  imports: [
    AsyncPipe,
    InfiniteScrollModule,
    NgbDropdownModule,
    TranslateModule,
  ],
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
              protected validationService: DynamicFormValidationService,
              protected translateService: TranslateService,
              parentInjector: Injector,
              @Inject(APP_DATA_SERVICES_MAP) dataServiceMap: LazyDataServicesMap,
  ) {
    super(vocabularyService, cdr, layoutService, validationService, parentInjector, dataServiceMap);
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
        map((formValue: FormFieldMetadataValueObject) => formValue.display),
      );
    } else {
      if (isEmpty(value)) {
        result = of('');
      } else if (typeof value === 'string') {
        result = of(value);
      } else {
        result = of(value.display);
      }
    }

    result.pipe(take(1)).subscribe(resultValue => {
      if (!this.shouldCleanInputs(resultValue, this.model?.parent)) {
        return;
      }
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

    if (!this.shouldCleanInputs(fundingTypeValue, complexInputField)) {
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
        case DYNAMIC_FORM_CONTROL_TYPE_SCROLLABLE_DROPDOWN:
          // Remove it only if the funding type is `N/A`
          if (this.fundingTypeIsNotApplicable(fundingTypeValue)) {
            (input as DynamicScrollableDropdownModel).value = '';
          }
          break;
        default:
          break;
      }
    });
  }

  /**
   * The inputs shouldn't be cleaned after every funding type change.
   * Change the funding type if the funding type is EU and the complex input field doesn't have EU identifier
   * `info:eu..`
   * or the if the funding type is Non EU and the complex input field has EU identifier `info:eu..`
   * @param fundingTypeValue
   * @param complexInputField
   * @private
   */
  private shouldCleanInputs(fundingTypeValue, complexInputField) {
    const euIdentifierValue = (complexInputField?.group?.[EU_IDENTIFIER_INDEX] as DsDynamicInputModel)?.value;

    // if the funding type is EU and doesn't have EU identifier `info:eu..` -> clean inputs
    if (isEqual(fundingTypeValue, DEFAULT_EU_DISPLAY_VALUE) && isEmpty(euIdentifierValue)) {
      return true;
    }

    // if the funding type is Non EU and has EU identifier `info:eu..` -> clean inputs
    if (!isEqual(fundingTypeValue, DEFAULT_EU_DISPLAY_VALUE) && !isEmpty(euIdentifierValue)) {
      return true;
    }

    // if the funding type is `N/A` -> clean inputs
    if (this.fundingTypeIsNotApplicable(fundingTypeValue)) {
      return true;
    }

    return false;
  }

  /**
   * Check if the funding type is `N/A`
   */
  fundingTypeIsNotApplicable(fundingTypeValue) {
    return isEqual(fundingTypeValue, this.translateService.instant('autocomplete.suggestion.sponsor.empty'));
  }
}
