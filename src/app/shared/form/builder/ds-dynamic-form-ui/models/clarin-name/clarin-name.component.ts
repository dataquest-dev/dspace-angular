import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DsDynamicAutocompleteComponent} from '../autocomplete/ds-dynamic-autocomplete.component';
import {VocabularyService} from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {DynamicFormLayoutService, DynamicFormValidationService} from '@ng-dynamic-forms/core';
import {MetadataValueDataService} from '../../../../../../core/data/metadata-value-data.service';
import {LookupRelationService} from '../../../../../../core/data/lookup-relation.service';
import {TranslateService} from '@ngx-translate/core';
import {Observable, of as observableOf} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, merge, switchMap, tap} from 'rxjs/operators';
import {buildPaginatedList, PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {isEmpty} from '../../../../../empty.util';
import {PageInfo} from '../../../../../../core/shared/page-info.model';

@Component({
  selector: 'ds-clarin-name',
  templateUrl: '../autocomplete/ds-dynamic-autocomplete.component.html',
  styleUrls: ['./clarin-name.component.scss']
})
export class ClarinNameComponent extends DsDynamicAutocompleteComponent implements OnInit {

  constructor(protected vocabularyService: VocabularyService,
              protected cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected metadataValueService: MetadataValueDataService,
              protected lookupRelationService: LookupRelationService,
              protected translateService: TranslateService) {
    super(vocabularyService, cdr, layoutService, validationService, metadataValueService,
      lookupRelationService);
  }

  private metadataField = '';

  ngOnInit(): void {
    this.metadataField = this.model?.metadataFields?.pop();
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.changeSearchingStatus(true)),
      switchMap((term) => {
        // min 3 characters
        if (term === '' || term.length < this.model.minChars || term.length > this.model.maxLength) {
          return observableOf({ list: [] });
        } else {
          let response: Observable<PaginatedList<MetadataValue>>;
          // if openAIRE
          response = this.metadataValueService.findByMetadataNameAndByValue(this.metadataField, term);
          if (isEmpty(response)) {
            return observableOf({ list: [] });
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

}
