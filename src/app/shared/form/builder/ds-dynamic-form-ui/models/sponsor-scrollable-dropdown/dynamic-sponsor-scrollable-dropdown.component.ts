import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Observable, of as observableOf } from 'rxjs';
import { catchError, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { DynamicFormLayoutService, DynamicFormValidationService } from '@ng-dynamic-forms/core';

import { VocabularyEntry } from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import { PageInfo } from '../../../../../../core/shared/page-info.model';
import { isEmpty } from '../../../../../empty.util';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import { getFirstSucceededRemoteDataPayload } from '../../../../../../core/shared/operators';
import {
  PaginatedList,
  buildPaginatedList
} from '../../../../../../core/data/paginated-list.model';
import { FormFieldMetadataValueObject } from '../../../models/form-field-metadata-value.model';
import {DsDynamicScrollableDropdownComponent} from '../scrollable-dropdown/dynamic-scrollable-dropdown.component';
import { DynamicScrollableDropdownModel } from '../scrollable-dropdown/dynamic-scrollable-dropdown.model';
import {
  DEFAULT_EU_DISPLAY_VALUE,
  DEFAULT_EU_FUNDING_TYPES
} from '../sponsor-autocomplete/ds-dynamic-sponsor-autocomplete.model';
import {SEPARATOR} from '../ds-dynamic-complex.model';

// The default value for the EU sponsor in the complex input type looks like `EU;;;;`
const EU_TYPE_DEFAULT_VALUE = DEFAULT_EU_DISPLAY_VALUE + SEPARATOR.repeat(4);

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

    this.currentValue = result;
  }

}
