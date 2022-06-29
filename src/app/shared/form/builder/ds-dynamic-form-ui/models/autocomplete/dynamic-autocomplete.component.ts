import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
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
import {isEmpty, isNotEmpty} from '../../../../../empty.util';
import {DsDynamicTagComponent} from '../tag/dynamic-tag.component';
import {MetadataValueDataService} from '../../../../../../core/data/metadata-value-data.service';
import {FormFieldMetadataValueObject} from '../../../models/form-field-metadata-value.model';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {ExternalSourceService} from '../../../../../../core/data/external-source.service';
import {LookupRelationService} from '../../../../../../core/data/lookup-relation.service';
import {ExternalSource} from '../../../../../../core/shared/external-source.model';
import {ExternalSourceEntry} from '../../../../../../core/shared/external-source-entry.model';
import {PaginatedSearchOptions} from '../../../../../search/models/paginated-search-options.model';
import {PaginationComponentOptions} from '../../../../../pagination/pagination-component-options.model';
import {AUTOCOMPLETE_COMPLEX_PREFIX} from './dynamic-autocomplete.model';
import {EU_PROJECT_PREFIX, SEPARATOR, SPONSOR_METADATA_NAME} from '../ds-dynamic-complex.model';
import {startsWith, update} from 'lodash';
import {VocabularyEntry} from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import {DynamicAutocompleteService} from './dynamic-autocomplete.service';
import {BoldPipe} from '../../../../../utils/bold-pipe';

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
  isSponsorInputType = false;

  searching = false;
  searchFailed = false;
  currentValue: any;
  public pageInfo: PageInfo;

  constructor(protected vocabularyService: VocabularyService,
              protected cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected metadataValueService: MetadataValueDataService,
              private lookupRelationService: LookupRelationService
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
    if (isNotEmpty(this.model.metadataFields) && isNotEmpty(this.model.metadataFields[0])) {
      this.isSponsorInputType = this.model.metadataFields[0] === SPONSOR_METADATA_NAME;
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

  onBlur(event: Event) {
    let newValue = this.currentValue;
    this.dispatchUpdate(newValue);
    this.cdr.detectChanges();
    console.log('something');
  }

  updateModel(updateValue) {
    let newValue = updateValue.display;
    if (this.isSponsorInputType) {
      if (updateValue instanceof VocabularyEntry) {
        newValue = AUTOCOMPLETE_COMPLEX_PREFIX + SEPARATOR + updateValue.value;
      } else {
        newValue = this.composeSponsorInput(updateValue);
      }
    }
    this.dispatchUpdate(newValue);
  }

  /**
   * Emits a change event and updates model value.
   * @param updateValue
   */
  dispatchUpdate(newValue: any) {
    this.model.value = newValue;
    this.change.emit(newValue);
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

  formatter = (x: { display: string }) => {
    return x.display;
  }

  suggestionFormatter = (x: TemplateRef<any>) => {
    if (this.isSponsorInputType) {
      let formattedValue = '';
      if (x instanceof VocabularyEntry) {
        formattedValue = x.value;
        if (formattedValue.startsWith(AUTOCOMPLETE_COMPLEX_PREFIX)) {
          formattedValue = DynamicAutocompleteService.removeAutocompletePrefix(x);
        }
        let complexInputList = formattedValue.split(SEPARATOR);
        return DynamicAutocompleteService.pretifyFundingSuggestion(complexInputList[1], complexInputList[2]);
      } else if (x instanceof ExternalSourceEntry) {
        let fundingProjectCode = this.getProjectCodeFromId(x.id);
        let fundingName = x.metadata['project.funder.name'][0].value;
        return DynamicAutocompleteService.pretifyFundingSuggestion(fundingProjectCode, fundingName);
      }
    }
    return x.display;
  }

  updateValuee(aaa) {
    return this.model.value + 'sss'.bold();
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
        // min 3 characters
        if (term === '' || term.length < this.model.minChars) {
          return observableOf({ list: [] });
        } else {
          let response: Observable<PaginatedList<ExternalSourceEntry | MetadataValue>>;
          if (this.isSponsorInputType) {
            // openAIRE request
            // if openAIRE
            let fundingType = this.model.parent.group[0].value;
            if (isNotEmpty(fundingType) && ['euFunds', 'EU'].includes(fundingType.value)) {
              response = this.lookupRelationService.getExternalResults(
                this.getOpenAireExternalSource(), this.getFundingRequestOptions(term));
            } else {
              response = this.metadataValueService.findByMetadataNameAndByValue(SPONSOR_METADATA_NAME, term);
            }
          } else {
            // metadataValue request
            response = this.metadataValueService.findByMetadataNameAndByValue(this.model.name, term);
          }
          return response.pipe(
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

  /**
   * Only for the local.sponsor complex input type
   * zoberiem external funding a narvem ho do jedneho input fieldu, ktory zparsujem v complex.model.ts v metode set
   * @param updateValue external funding from the openAIRE
   */
  composeSponsorInput(updateValue) {
    // set prefix to distinguish composed complex input in the complex.model.ts - get method
    let newValue = AUTOCOMPLETE_COMPLEX_PREFIX + SEPARATOR;
    let fundingType = 'N/A';
    let fundingProjectCode = '';

    if (updateValue.id.startsWith(EU_PROJECT_PREFIX)) {
      fundingType = 'EU';
      fundingProjectCode = this.getProjectCodeFromId(updateValue.id);
    }
    newValue += fundingType + SEPARATOR +
      fundingProjectCode + SEPARATOR +
      updateValue.metadata['project.funder.name'][0].value + SEPARATOR +
      updateValue.value;
    if (updateValue.id.startsWith(EU_PROJECT_PREFIX)) {
      newValue += SEPARATOR + updateValue.id;
    }

    return newValue;
  }

  /**
   * Only for the local.sponsor complex input type
   * If the project type is EU, the second input field must be in the format `Funder/FundingProgram/ProjectID`
   * but in the response the Funder information is not in the right format. The right format is only in the
   * `id` which is in the format: `info:eu-repo/grantAgreement/Funder/FundingProgram/ProjectID/`.
   * `Funder/FundingProgram/ProjectID` is loaded from the `id` in this method
   * @param id
   * @return Funder/FundingProgram/ProjectID
   */
  getProjectCodeFromId(id) {
    let funder = '';
    let fundingProgram = '';
    let projectID = '';

    id = id.substr(id.indexOf('grantAgreement'));
    id = id.substr(id.indexOf('/') + 1);
    funder = id.substr(0, id.indexOf('/'));
    id = id.substr(id.indexOf('/') + 1);
    fundingProgram = id.substr(0, id.indexOf('/'));
    id = id.substr(id.indexOf('/') + 1);
    projectID = id.substr(0, id.indexOf('/'));

    return funder + '/' + fundingProgram + '/' + projectID;
  }

  /**
   * Only for the local.sponsor complex input type
   * Request must contain externalSource definition.
   * @return externalSource openAIREFunding
   */
  getOpenAireExternalSource() {
    const externalSource = Object.assign(new ExternalSource(), {
      id: 'openAIREFunding',
      name: 'openAIREFunding',
      hierarchical: false
    });
    return externalSource;
  }

  /**
   * Only for the local.sponsor complex input type
   * Just pagination options
   * @param term searching value for funding
   */
  getFundingRequestOptions(term) {
    let options: PaginatedSearchOptions;
    const pageOptions = Object.assign(new PaginationComponentOptions(), { pageSize: 20, page: 1 });
    options = new PaginatedSearchOptions({
      pagination: pageOptions,
      query: term,
    });
    return options;
  }
}


