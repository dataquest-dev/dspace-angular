import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {DsDynamicVocabularyComponent} from '../dynamic-vocabulary.component';
import {FormGroup} from '@angular/forms';
import {DynamicTagModel} from '../tag/dynamic-tag.model';
import {NgbTypeahead, NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {Chips} from '../../../../../chips/models/chips.model';
import {Observable, of as observableOf} from 'rxjs';
import {PageInfo} from '../../../../../../core/shared/page-info.model';
import {VocabularyService} from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {DynamicFormLayoutService, DynamicFormValidationService} from '@ng-dynamic-forms/core';
import {catchError, debounceTime, distinctUntilChanged, map, merge, switchMap, tap} from 'rxjs/operators';
import {getFirstSucceededRemoteDataPayload} from '../../../../../../core/shared/operators';
import {buildPaginatedList, PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {VocabularyEntry} from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import {hasValue, isEmpty, isNotEmpty} from '../../../../../empty.util';
import {environment} from '../../../../../../../environments/environment';
import {isEqual} from 'lodash';
import {DsDynamicTagComponent} from '../tag/dynamic-tag.component';
// import {AutocompleteService} from './autocomplete.service';
import {SiteDataService2} from './autocomplete.service';
import {FormFieldMetadataValueObject} from '../../../models/form-field-metadata-value.model';
//
/**
 * Component representing a tag input field
 */
@Component({
  selector: 'ds-autocomplete',
  styleUrls: ['../tag/dynamic-tag.component.scss'],
  templateUrl: './dynamic-autocomplete.component.html'
})
export class DsDynamicAutocompleteComponent extends DsDynamicTagComponent implements OnInit {

  @Input() bindId = true;
  @Input() group: FormGroup;
  @Input() model: DynamicTagModel;

  @Output() blur: EventEmitter<any> = new EventEmitter<any>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();
  @Output() focus: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('instance') instance: NgbTypeahead;

  chips: Chips;
  hasAuthority: boolean;

  searching = false;
  searchFailed = false;
  // hideSearchingWhenUnsubscribed = new Observable(() => () => this.changeSearchingStatus(false));
  currentValue: any;
  public pageInfo: PageInfo;

  constructor(protected vocabularyService: VocabularyService,
              protected cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected autocompleteService: SiteDataService2
  ) {
    super(vocabularyService, cdr, layoutService, validationService);
  }

  /**
   * Updates model value with the selected value and add a new tag to chips.
   * @param event The value to set.
   */
  onSelectItem(event: NgbTypeaheadSelectItemEvent) {
    this.updateModel(event.item);
    this.cdr.detectChanges();
  }

  updateModel(updateValue) {
    this.dispatchUpdate(updateValue);
  }

  /**
   * Emits a change event and updates model value.
   * @param updateValue
   */
  dispatchUpdate(updateValue: any) {
    this.model.value = updateValue.display;
    this.change.emit(updateValue);
  }

  ngOnInit(): void {
    if (this.model.value) {
      this.setCurrentValue(this.model.value, true);
    }
  }

  public setCurrentValue(value: any, init = false) {
    let result: string;
    if (init) {
      this.getInitValueFromModel()
        .subscribe((formValue: FormFieldMetadataValueObject) => {
          this.currentValue = formValue;
          this.cdr.detectChanges();
        });
    } else {
      if (isEmpty(value)) {
        result = '';
      } else {
        result = value.value;
      }

      this.currentValue = result;
      this.cdr.detectChanges();
    }
  }

  /**
   * Converts a stream of text values from the `<input>` element to the stream of the array of items
   * to display in the typeahead popup.
   */
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.changeSearchingStatus(true)),
      switchMap((term) => {
        if (term === '' || term.length < this.model.minChars) {
          return observableOf({ list: [] });
        } else {
          return this.autocompleteService.find().pipe(
            tap(() => this.searchFailed = false),
            catchError((error) => {
              console.log(error);
              this.searchFailed = true;
              return observableOf(buildPaginatedList(
                new PageInfo(),
                []
              ));
            }));
        }
      }),
      map((list: PaginatedList<VocabularyEntry>) => {
        return list.page;
      }),
      tap(() => this.changeSearchingStatus(false)),
      merge(this.hideSearchingWhenUnsubscribed))

  /**
   * Initialize the component, setting up the init form value
   */
  // ngOnInit() {
  //   this.hasAuthority = this.model.vocabularyOptions && hasValue(this.model.vocabularyOptions.name);
  //
  //   this.chips = new Chips(
  //     this.model.value as any[],
  //     'display',
  //     null,
  //     environment.submission.icons.metadata);
  //
  //   this.chips.chipsItems
  //     .subscribe((subItems: any[]) => {
  //       const items = this.chips.getChipsItems();
  //       Does not emit change if model value is equal to the current value
        // if (!isEqual(items, this.model.value)) {
        //   this.dispatchUpdate(items);
        // }
      // });
  // }
}
