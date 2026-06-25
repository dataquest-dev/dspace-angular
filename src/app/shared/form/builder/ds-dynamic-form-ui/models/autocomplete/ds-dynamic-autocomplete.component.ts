
import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormsModule,
} from '@angular/forms';
import {
  NgbTypeahead,
  NgbTypeaheadModule,
  NgbTypeaheadSelectItemEvent,
} from '@ng-bootstrap/ng-bootstrap';
import {
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  switchMap,
  tap,
} from 'rxjs/operators';

import { RemoteDataBuildService } from '../../../../../../core/cache/builders/remote-data-build.service';
import { ConfigurationDataService } from '../../../../../../core/data/configuration-data.service';
import { LookupRelationService } from '../../../../../../core/data/lookup-relation.service';
import { MetadataValueDataService } from '../../../../../../core/data/metadata-value-data.service';
import {
  buildPaginatedList,
  PaginatedList,
} from '../../../../../../core/data/paginated-list.model';
import { RemoteData } from '../../../../../../core/data/remote-data';
import { GetRequest } from '../../../../../../core/data/request.models';
import { RequestService } from '../../../../../../core/data/request.service';
import { HttpOptions } from '../../../../../../core/dspace-rest/dspace-rest.service';
import { ConfigurationProperty } from '../../../../../../core/shared/configuration-property.model';
import { HALEndpointService } from '../../../../../../core/shared/hal-endpoint.service';
import { getFirstSucceededRemoteDataPayload } from '../../../../../../core/shared/operators';
import { PageInfo } from '../../../../../../core/shared/page-info.model';
import { VocabularyEntry } from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {
  isEmpty,
  isNotEmpty,
  isNull,
} from '../../../../../empty.util';
import { CANONICAL_PREFIX_KEY } from '../../../../../handle.service';
import { FormFieldMetadataValueObject } from '../../../models/form-field-metadata-value.model';
import { DsDynamicTagComponent } from '../tag/dynamic-tag.component';
import {
  AUTOCOMPLETE_CUSTOM_JSON_PREFIX,
  AUTOCOMPLETE_CUSTOM_SOLR_PREFIX,
  DsDynamicAutocompleteModel,
} from './ds-dynamic-autocomplete.model';
import { DsDynamicAutocompleteService } from './ds-dynamic-autocomplete.service';

/**
 * Prefix for custom autocomplete definition from the `submission-forms.xml`.
 * <input-type autocomplete-custom="solr-handle_title_ac">autocomplete</input-type>
 */
const AUTOCOMPLETE_CUSTOM_HANDLE_TITLE = 'solr-handle_title_ac';

/**
 * Prefix for custom autocomplete definition from the `submission-forms.xml`.
 * <input-type autocomplete-custom="son_static-iso_langs.json">autocomplete</input-type>
 */
const AUTOCOMPLETE_CUSTOM_LANGUAGE_JSON = 'json_static-iso_langs.json';

/**
 * The suggestion has a `:` in the result value as a separator.
 */
const AUTOCOMPLETE_CUSTOM_VALUE_SEPARATOR = ':';

/**
 * Component representing a autocomplete input field.
 */
@Component({
  selector: 'ds-dynamic-autocomplete',
  styleUrls: ['../tag/dynamic-tag.component.scss'],
  templateUrl: './ds-dynamic-autocomplete.component.html',
  imports: [
    FormsModule,
    NgbTypeaheadModule,
  ],
})
export class DsDynamicAutocompleteComponent extends DsDynamicTagComponent implements OnInit {

  @Input() bindId = true;
  @Input() group: FormGroup;
  @Input() model: DsDynamicAutocompleteModel;

  @Output() blur: EventEmitter<any> = new EventEmitter<any>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();
  @Output() focus: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('instance') instance: NgbTypeahead;

  hasAuthority: boolean;

  searching = false;
  searchFailed = false;
  currentValue: any;
  public pageInfo: PageInfo;

  /**
   * Handle canonical prefix loaded from the cfg `handle.canonical.prefix`.
   */
  handlePrefix: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(protected vocabularyService: VocabularyService,
    cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected metadataValueService: MetadataValueDataService,
              protected lookupRelationService: LookupRelationService,
              protected requestService: RequestService,
              protected rdbService: RemoteDataBuildService,
              protected halService: HALEndpointService,
              protected configurationService: ConfigurationDataService,
              protected translateService: TranslateService,
  ) {
    super(vocabularyService, cdr, layoutService, validationService);
  }

  /**
   * Initialize the component, setting up the init form value
   */
  ngOnInit(): void {
    if (isNotEmpty(this.model.value)) {
      if (this.model.value instanceof FormFieldMetadataValueObject && isNotEmpty(this.model.value.value)) {
        this.model.value = this.model.value.value;
      }
      this.setCurrentValue(this.model.value, true);
    }

    // Load handle prefix if autocomplete custom is `solr-handle_title_ac` and it is not loaded yet
    if (this.model?.autocompleteCustom === AUTOCOMPLETE_CUSTOM_HANDLE_TITLE && isNull(this.handlePrefix.value)) {
      // Load configuration property for handle prefix
      this.configurationService.findByPropertyName(CANONICAL_PREFIX_KEY)
        .pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((handlePrefixCfgProp: ConfigurationProperty) => {
          const handlePrefix = handlePrefixCfgProp?.values?.[0];
          this.handlePrefix.next(handlePrefix);
        });
    }
  }

  /**
   * Updates model value with the selected value
   * @param event The value to set.
   */
  onSelectItem(event: NgbTypeaheadSelectItemEvent) {
    this.updateModel(event.item);
    this.cdr.detectChanges();
  }

  /**
   * Click outside.
   * @param event
   */
  onBlur(event: Event) {
    this.dispatchUpdate(this.normalizeValue(this.currentValue));
    this.cdr.detectChanges();
  }

  /**
   * Update value from suggestion to the input field.
   * @param updateValue raw suggestion.
   */
  updateModel(updateValue) {
    if (this.model?.autocompleteCustom === AUTOCOMPLETE_CUSTOM_HANDLE_TITLE) {
      const handle_title = updateValue.display.split(AUTOCOMPLETE_CUSTOM_VALUE_SEPARATOR);
      updateValue.display = this.handlePrefix.value + handle_title[0];
      updateValue.value = this.handlePrefix.value + handle_title[0];
    }

    const selectedValue = this.normalizeValue(updateValue);
    this.currentValue = selectedValue;
    this.dispatchUpdate(selectedValue);
  }

  /**
   * Emits a change event and updates model value.
   * @param newValue
   */
  dispatchUpdate(newValue: any) {
    this.model.value = newValue;
    this.change.emit(newValue);
  }

  /**
   * Sets the current value with the given value.
   * @param value given value.
   * @param init is initial value or not.
   */
  public setCurrentValue(value: any, init = false) {
    let result: string;
    if (init) {
      this.getInitValueFromModel()
        .subscribe((formValue: FormFieldMetadataValueObject) => {
          this.currentValue = this.normalizeValue(formValue);
          this.cdr.detectChanges();
        });
    } else {
      result = isEmpty(value) ? '' : this.normalizeValue(value);

      this.currentValue = result;
      this.cdr.detectChanges();
    }
  }

  /**
   * Formats input values for the typeahead.
   * If x is a string (persisted ISO), return it as-is.
   * If x is an object, return value first and fallback to display.
   * @param x raw string/object value from model/typeahead
   */
  formatter = (x: string | { value?: string; display?: string }) => {
    return this.normalizeValue(x);
  };

  /**
   * Normalize autocomplete values to string.
   */
  private normalizeValue(value: string | { value?: string; display?: string }): string {
    if (typeof value === 'string') {
      return value;
    }
    return value?.value || value?.display || '';
  }

  /**
   * Pretify suggestion.
   * @param suggestion
   */
  suggestionFormatter = (suggestion: TemplateRef<any>) => {
    if (this.model.autocompleteCustom === AUTOCOMPLETE_CUSTOM_LANGUAGE_JSON) {
      // Language suggestion has a special format - ISO code and language name
      return DsDynamicAutocompleteService.pretifyLanguageSuggestion(suggestion, this.translateService);
    }
    // @ts-ignore
    return suggestion.display;
  };

  /**
   * Converts a text values stream from the `<input>` element to the array stream of the items
   * and display them in the typeahead popup.
   */
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.changeSearchingStatus(true)),
      switchMap((term) => {
        // min 3 characters
        if (term === '' || term.length < this.model.minChars) {
          return of({ list: [] });
        } else {
          // Custom suggestion request
          if (this.model.autocompleteCustom) {
            if (this.model.autocompleteCustom.startsWith(AUTOCOMPLETE_CUSTOM_SOLR_PREFIX) ||
                this.model.autocompleteCustom.startsWith(AUTOCOMPLETE_CUSTOM_JSON_PREFIX)) {
              return this.getCustomSuggestions(this.model.autocompleteCustom, term)
                .pipe(getFirstSucceededRemoteDataPayload(),
                  map((list: PaginatedList<VocabularyEntry>) => {
                    return this.formatVocabularyEntryList(list);
                  }),
                  tap(() => this.searchFailed = false),
                  catchError(() => {
                    return this.onSearchErrorVocabularyEntries();
                  }));
            }
          } else {
            // MetadataValue request
            const response = this.metadataValueService.findByMetadataNameAndByValue(
              this.model?.metadataFields?.[this.model?.metadataFields?.length - 1], term);
            return response.pipe(
              tap(() => this.searchFailed = false),
              catchError(() => {
                return this.onSearchErrorVocabularyEntries();
              }));
          }
        }
      }),
      map((list: any) => {
        return list.page;
      }),
      tap(() => this.changeSearchingStatus(false)),
      merge(this.hideSearchingWhenUnsubscribed));

  /**
   * If this model is defined to fetch suggestions from a custom endpoint and solr index, fetch them.
   */
  getCustomSuggestions(autocompleteCustom: string, term: string): Observable<RemoteData<any>> {
    const options: HttpOptions = Object.create({});
    options.params = new HttpParams({ fromString: 'autocompleteCustom=' + autocompleteCustom + '&searchValue=' + term });

    const requestId = this.requestService.generateRequestId();
    const url = this.halService.getRootHref() + '/suggestions';
    const getRequest = new GetRequest(requestId, url, null, options);
    this.requestService.send(getRequest);

    return this.rdbService.buildFromRequestUUID(requestId);
  }

  /**
   * Format the vocabulary entry list from `/suggestions` endpoint, because it is not a standard vocabulary endpoint.
   */
  formatVocabularyEntryList(list: PaginatedList<VocabularyEntry>): PaginatedList<VocabularyEntry> {
    const vocabularyEntryList: VocabularyEntry[] = [];
    list.page.forEach((rawVocabularyEntry: VocabularyEntry) => {
      const voc: VocabularyEntry = new VocabularyEntry();
      voc.display = rawVocabularyEntry.display;
      voc.value = rawVocabularyEntry.value;
      vocabularyEntryList.push(voc);
    });
    list.page = vocabularyEntryList;
    return list;
  }

  /**
   * Return empty list on error when fetching suggestions.
   */
  onSearchErrorVocabularyEntries() {
    this.searchFailed = true;
    return of(buildPaginatedList(
      new PageInfo(),
      [],
    ));
  }
}
