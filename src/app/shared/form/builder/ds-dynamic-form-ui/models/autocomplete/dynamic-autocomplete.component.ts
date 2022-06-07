import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {DynamicTagModel} from '../tag/dynamic-tag.model';
import {NgbTypeahead, NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {Chips} from '../../../../../chips/models/chips.model';
import {Observable, of as observableOf} from 'rxjs';
import {PageInfo} from '../../../../../../core/shared/page-info.model';
import {VocabularyService} from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {DynamicFormLayoutService, DynamicFormValidationService} from '@ng-dynamic-forms/core';
import {catchError, debounceTime, distinctUntilChanged, map, merge, switchMap, tap} from 'rxjs/operators';
import {buildPaginatedList, PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {isEmpty} from '../../../../../empty.util';
import {DsDynamicTagComponent} from '../tag/dynamic-tag.component';
import {MetadataValueDataService} from '../../../../../../core/data/metadata-value-data.service';
import {FormFieldMetadataValueObject} from '../../../models/form-field-metadata-value.model';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {ExternalSourceService} from '../../../../../../core/data/external-source.service';
import {LookupRelationService} from '../../../../../../core/data/lookup-relation.service';
import {ExternalSource} from '../../../../../../core/shared/external-source.model';
import {
  getAllSucceededRemoteData,
  getFirstCompletedRemoteData,
  getRemoteDataPayload
} from '../../../../../../core/shared/operators';
import {RemoteData} from '../../../../../../core/data/remote-data';
import {ExternalSourceEntry} from '../../../../../../core/shared/external-source-entry.model';
import {PaginatedSearchOptions} from '../../../../../search/models/paginated-search-options.model';
import {SortDirection, SortOptions} from '../../../../../../core/cache/models/sort-options.model';
import {PaginationComponentOptions} from '../../../../../pagination/pagination-component-options.model';
import {SearchFilter} from '../../../../../search/models/search-filter.model';
import {DSpaceObjectType} from '../../../../../../core/shared/dspace-object-type.model';

/**
 * Component representing a tag input field
 */
@Component({
  selector: 'ds-dynamic-autocomplete',
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
  currentValue: any;
  public pageInfo: PageInfo;

  constructor(protected vocabularyService: VocabularyService,
              protected cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected metadataValueService: MetadataValueDataService,
              private externalSourceService: ExternalSourceService,
              private lookupRelationService: LookupRelationService
  ) {
    super(vocabularyService, cdr, layoutService, validationService);
  }

  /**
   * Initialize the component, setting up the init form value
   */
  ngOnInit(): void {
    if (this.model.value) {
      this.setCurrentValue(this.model.value, true);
    }
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

  /**
   * Sets the current value with the given value.
   * @param value The value to set.
   * @param init Representing if is init value or not.
   */
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
          const externalSource = Object.assign(new ExternalSource(), {
            id: 'openAIREFunding',
            name: 'openAIREFunding',
            hierarchical: false
          });
          let options: PaginatedSearchOptions;
          const pageOptions = Object.assign(new PaginationComponentOptions(), { pageSize: 40, page: 1 });
          const query = 'mushroom';
          options = new PaginatedSearchOptions({
            pagination: pageOptions,
            query: query,
          });
          return this.lookupRelationService.getExternalResults(externalSource, options).pipe(
            tap(() => this.searchFailed = false),
            catchError((error) => {
              this.searchFailed = true;
              return observableOf(buildPaginatedList(
                new PageInfo(),
                []
              ));
            }));
        }
      }),
      map((list: any) => {
        return list.page;
      }),
      tap(() => this.changeSearchingStatus(false)),
      merge(this.hideSearchingWhenUnsubscribed))
}
