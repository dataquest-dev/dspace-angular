import {Injectable} from '@angular/core';
import {dataService} from '../../../../../../core/cache/builders/build-decorators';
import {ResourceType} from '../../../../../../core/shared/resource-type';
import {RequestService} from '../../../../../../core/data/request.service';
import {RemoteDataBuildService} from '../../../../../../core/cache/builders/remote-data-build.service';
import {Store} from '@ngrx/store';
import {CoreState} from '../../../../../../core/core.reducers';
import {ObjectCacheService} from '../../../../../../core/cache/object-cache.service';
import {HALEndpointService} from '../../../../../../core/shared/hal-endpoint.service';
import {NotificationsService} from '../../../../../notifications/notifications.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {getFirstSucceededRemoteDataPayload} from '../../../../../../core/shared/operators';
import {map} from 'rxjs/operators';
import {PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {DataService} from '../../../../../../core/data/data.service';
import {FindListOptions} from '../../../../../../core/data/request.models';
import {RequestParam} from '../../../../../../core/cache/models/request-param.model';
import {DefaultChangeAnalyzer} from '../../../../../../core/data/default-change-analyzer.service';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {VocabularyEntry} from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';

export const linkName = 'metadatavalues';
export const AUTOCOMPLETE = new ResourceType(linkName);

/**
 * A service responsible for fetching/sending data from/to the REST API on the vocabularies endpoint
 */
@Injectable()
@dataService(MetadataValue.type)
export class AutocompleteService extends DataService<MetadataValue> {
  protected linkPath = linkName;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
    protected notificationsService: NotificationsService,
    protected http: HttpClient,
    protected comparator: DefaultChangeAnalyzer<MetadataValue>,
  ) {
    super();
  }

  /**
   * Retrieve the Site Object
   */
  findByMetadataNameAndByValue(metadataName, term): Observable<PaginatedList<MetadataValue>> {
      const metadataFields = metadataName.split('.');
      const optionParams = Object.assign(new FindListOptions(), {}, {
        searchParams: [
          new RequestParam('schema', metadataFields[0]),
          new RequestParam('element', metadataFields[1]),
          new RequestParam('qualifier', metadataFields[2]),
          new RequestParam('searchValue', term)
        ]
      });
      const remoteData$ = this.searchBy('byValue', optionParams);

      return remoteData$.pipe(
        getFirstSucceededRemoteDataPayload(),
        map((list: PaginatedList<MetadataValue>) => {
          const vocabularyEntryList: VocabularyEntry[] = [];
          for (const metadataValue of list.page) {
            const voc: VocabularyEntry = new VocabularyEntry();
            voc.display = metadataValue.value;
            voc.value = metadataValue.value;
            vocabularyEntryList.push(voc);
          }
          // @ts-ignore
          list.page = vocabularyEntryList;
          return list;
        })
      );
  }
}
