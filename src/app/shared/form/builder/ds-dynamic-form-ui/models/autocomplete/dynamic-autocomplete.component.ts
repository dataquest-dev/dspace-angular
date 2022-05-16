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
import {hasValue, isNotEmpty} from '../../../../../empty.util';
import {environment} from '../../../../../../../environments/environment';
import {isEqual} from 'lodash';
import {DsDynamicTagComponent} from '../tag/dynamic-tag.component';

/**
 * Component representing a tag input field
 */
@Component({
  selector: 'ds-autocomplete',
  styleUrls: ['../tag/dynamic-tag.component.scss'],
  templateUrl: '../tag/dynamic-tag.component.html'
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
  hideSearchingWhenUnsubscribed = new Observable(() => () => this.changeSearchingStatus(false));
  currentValue: any;
  public pageInfo: PageInfo;

  constructor(protected vocabularyService: VocabularyService,
              cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService
  ) {
    super(vocabularyService, cdr, layoutService, validationService);
  }
  //
  // /**
  //  * Converts a stream of text values from the `<input>` element to the stream of the array of items
  //  * to display in the typeahead popup.
  //  */
  // search = (text$: Observable<string>) =>
  //   text$.pipe(
  //     debounceTime(300),
  //     distinctUntilChanged(),
  //     tap(() => this.changeSearchingStatus(true)),
  //     switchMap((term) => {
  //       if (term === '' || term.length < this.model.minChars) {
  //         return observableOf({ list: [] });
  //       } else {
  //         return this.vocabularyService.getVocabularyEntriesByValue(term, false, this.model.vocabularyOptions, new PageInfo()).pipe(
  //           getFirstSucceededRemoteDataPayload(),
  //           tap(() => this.searchFailed = false),
  //           catchError(() => {
  //             this.searchFailed = true;
  //             return observableOf(buildPaginatedList(
  //               new PageInfo(),
  //               []
  //             ));
  //           }));
  //       }
  //     }),
  //     map((list: PaginatedList<VocabularyEntry>) => list.page),
  //     tap(() => this.changeSearchingStatus(false)),
  //     merge(this.hideSearchingWhenUnsubscribed))
  //
  // /**
  //  * Initialize the component, setting up the init form value
  //  */
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
  //       // Does not emit change if model value is equal to the current value
  //       if (!isEqual(items, this.model.value)) {
  //         this.dispatchUpdate(items);
  //       }
  //     });
  // }
}
