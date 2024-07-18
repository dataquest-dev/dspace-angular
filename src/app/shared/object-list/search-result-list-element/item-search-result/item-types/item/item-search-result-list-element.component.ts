import {Component, Inject} from '@angular/core';
import { listableObjectComponent } from '../../../../../object-collection/shared/listable-object/listable-object.decorator';
import { ViewMode } from '../../../../../../core/shared/view-mode.model';
import { ItemSearchResult } from '../../../../../object-collection/shared/item-search-result.model';
import { SearchResultListElementComponent } from '../../../search-result-list-element.component';
import { Item } from '../../../../../../core/shared/item.model';
import { getItemPageRoute } from '../../../../../../item-page/item-page-routing-paths';
import {VocabularyService} from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {TruncatableService} from '../../../../../truncatable/truncatable.service';
import {DSONameService} from '../../../../../../core/breadcrumbs/dso-name.service';
import {APP_CONFIG, AppConfig} from '../../../../../../../config/app-config.interface';
import {
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload,
  getFirstSucceededRemoteListPayload
} from '../../../../../../core/shared/operators';
import {followLink} from '../../../../../utils/follow-link-config.model';
import {map, switchMap} from 'rxjs/operators';
import {Vocabulary} from '../../../../../../core/submission/vocabularies/models/vocabulary.model';
import {VocabularyEntry} from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import {isEmpty, isNotEmpty} from '../../../../../empty.util';
import {BehaviorSubject} from 'rxjs';
import {th} from 'date-fns/locale';

export const ASSETSTORE_PREFIX = 'assets/images/';
export const ALLOWED_ENGLISH_TYPES =
  ['article',
  'conferenceObject',
  'bachelorThesis',
  'masterThesis',
  'doctoralThesis',
  'doctoralThesis',
  'book',
  'bookPart',
  'review',
  'lecture',
  'workingPaper',
  'preprint',
  'report',
  'annotation',
  'contributionToPeriodical',
  'other',
  'patent',
  'video'];

@listableObjectComponent('PublicationSearchResult', ViewMode.ListElement)
@listableObjectComponent(ItemSearchResult, ViewMode.ListElement)
@Component({
  selector: 'ds-item-search-result-list-element',
  styleUrls: ['./item-search-result-list-element.component.scss'],
  templateUrl: './item-search-result-list-element.component.html'
})
/**
 * The component for displaying a list element for an item search result of the type Publication
 */
export class ItemSearchResultListElementComponent extends SearchResultListElementComponent<ItemSearchResult, Item> {
  /**
   * Route to the item's page
   */
  itemPageRoute: string;

  /**
   * The default image for the item is a `other.svg`. If the Item has an image for its type, it will be replaced.
   */
  defaultImage = ASSETSTORE_PREFIX + 'other.svg';

  constructor(protected vocabularyService: VocabularyService,
              protected truncatableService: TruncatableService,
              public dsoNameService: DSONameService,
              @Inject(APP_CONFIG) protected appConfig?: AppConfig) {
    super(truncatableService, dsoNameService, appConfig);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.showThumbnails = this.showThumbnails ?? this.appConfig.browseBy.showThumbnails;
    this.itemPageRoute = getItemPageRoute(this.dso);
    this.loadTypeAndAssingImage();
  }

  /**
   * 1. Load all types from the `nase_typy` vocabulary.
   * 2. The Item has the dc.type in english and in czech - get only english variation.
   * 3. Find the right image for the type.
   * @private
   */
  private loadTypeAndAssingImage() {
    // Load all vocabulary options defined in the `submission-forms.xml` - `nase_typy` vocabulary
    this.vocabularyService.findVocabularyById('nase_typy', true, true, followLink('entries', { shouldEmbed: false })).pipe(
      getFirstSucceededRemoteDataPayload(),
      switchMap((vocabulary: Vocabulary) => vocabulary.entries),
      getFirstSucceededRemoteListPayload(),
      // Filter only the english types
      map((list: VocabularyEntry[]) => {
        // Get all the types (en, cs)
        const itemTypes = this.dso.allMetadata('dc.type');
        // If the Item doesn't have the dc.type, set the default image
        let typeValue = 'other';
        itemTypes.forEach(itemType => {
          if (list.find((entry: VocabularyEntry) => entry.value === itemType.value)) {
            typeValue = itemType.value;
            return;
          }
        });
        return typeValue;
      }))
      .subscribe(typeValue => {
        // Assign the right image for the type
        this.defaultImage = ASSETSTORE_PREFIX + this.findRightImageByType(typeValue) + '.svg';
      });
  }

  /**
   * Find the right image for the type.
   * The images are loaded from the `/assets/images/`
   */
  private findRightImageByType(type): string {
    switch (type) {
      case 'article':
      case 'other':
      case 'book':
      case 'workingPaper':
      case 'report':
      case 'video':
        return type;
      case 'conferenceObject':
        return 'conferPaper';
      case 'bachelorThesis':
      case 'masterThesis':
      case 'doctoralThesis':
        return 'theses';
      case 'bookPart':
        return 'chapter';
      case 'lecture':
        return 'presentation';
      default:
        return 'other';
    }
  }
}
