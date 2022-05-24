import {Injectable} from '@angular/core';
import {dataService, getClassForType} from '../../../../../../core/cache/builders/build-decorators';
import {ResourceType} from '../../../../../../core/shared/resource-type';
import {RequestService} from '../../../../../../core/data/request.service';
import {RemoteDataBuildService} from '../../../../../../core/cache/builders/remote-data-build.service';
import {Store} from '@ngrx/store';
import {CoreState} from '../../../../../../core/core.reducers';
import {ObjectCacheService} from '../../../../../../core/cache/object-cache.service';
import {HALEndpointService} from '../../../../../../core/shared/hal-endpoint.service';
import {NotificationsService} from '../../../../../notifications/notifications.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {DSOChangeAnalyzer} from '../../../../../../core/data/dso-change-analyzer.service';
import {Site} from '../../../../../../core/shared/site.model';
import {Observable, of as observableOf} from 'rxjs';
import {
  getAllCompletedRemoteData,
  getFirstSucceededRemoteData,
  takeUntilCompletedRemoteData
} from '../../../../../../core/shared/operators';
import {distinctUntilChanged, find, map, skipWhile, take, takeWhile, tap} from 'rxjs/operators';
import {RemoteData} from '../../../../../../core/data/remote-data';
import {PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {DataService} from '../../../../../../core/data/data.service';
import {FollowLinkConfig} from '../../../../../utils/follow-link-config.model';
import {hasValue, isNotEmptyOperator} from '../../../../../empty.util';
import {DSpaceSerializer} from '../../../../../../core/dspace-rest/dspace.serializer';
import {CreateRequest, FindListOptions, GetRequest, PostRequest} from '../../../../../../core/data/request.models';
import {NotificationOptions} from '../../../../../notifications/models/notification-options.model';
import {RequestParam} from '../../../../../../core/cache/models/request-param.model';
import {MetadataValueSuggestion} from '../../../../../../core/shared/metadata-value-suggestion';
import {DefaultChangeAnalyzer} from '../../../../../../core/data/default-change-analyzer.service';
import {HttpOptions} from '../../../../../../core/dspace-rest/dspace-rest.service';
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
      let metadataFields = metadataName.split('.');
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
        getAllCompletedRemoteData(),
        map((remoteData: RemoteData<PaginatedList<MetadataValue>>) => remoteData.payload),
        map((list: PaginatedList<MetadataValue>) => {
          let vocabularyEntryList: VocabularyEntry[] = [];
          for (const metadataValue of list.page) {
            let voc: VocabularyEntry = new VocabularyEntry();
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
