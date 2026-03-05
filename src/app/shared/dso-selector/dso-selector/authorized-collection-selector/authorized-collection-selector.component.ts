import { Component, Input } from '@angular/core';
import { DSOSelectorComponent } from '../dso-selector.component';
import { SearchService } from '../../../../core/shared/search/search.service';
import { CollectionDataService } from '../../../../core/data/collection-data.service';
import { Observable } from 'rxjs';
import { getFirstCompletedRemoteData } from '../../../../core/shared/operators';
import { map } from 'rxjs/operators';
import { CollectionSearchResult } from '../../../object-collection/shared/collection-search-result.model';
import { SearchResult } from '../../../search/models/search-result.model';
import { DSpaceObject } from '../../../../core/shared/dspace-object.model';
import { buildPaginatedList, PaginatedList } from '../../../../core/data/paginated-list.model';
import { followLink } from '../../../utils/follow-link-config.model';
import { RemoteData } from '../../../../core/data/remote-data';
import { hasNoValue, hasValue, isNotEmpty } from '../../../empty.util';
import { NotificationsService } from '../../../notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { Collection } from '../../../../core/shared/collection.model';
import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';
import { FindListOptions } from '../../../../core/data/find-list-options.model';
import { NotificationType } from '../../../notifications/models/notification-type';
import { ListableNotificationObject } from '../../../object-list/listable-notification-object/listable-notification-object.model';
import { LISTABLE_NOTIFICATION_OBJECT } from '../../../object-list/listable-notification-object/listable-notification-object.resource-type';

@Component({
  selector: 'ds-authorized-collection-selector',
  styleUrls: ['../dso-selector.component.scss'],
  templateUrl: '../dso-selector.component.html'
})
/**
 * Component rendering a list of collections to select from
 */
export class AuthorizedCollectionSelectorComponent extends DSOSelectorComponent {
  /**
   * If present this value is used to filter collection list by entity type
   */
  @Input() entityType: string;

  constructor(
    protected searchService: SearchService,
    protected collectionDataService: CollectionDataService,
    protected notifcationsService: NotificationsService,
    protected translate: TranslateService,
    protected dsoNameService: DSONameService,
  ) {
    super(searchService, notifcationsService, translate, dsoNameService);
  }

  /**
   * Get a query to send for retrieving the current DSO
   */
  getCurrentDSOQuery(): string {
    return this.currentDSOId;
  }

  /**
   * Perform a search for authorized collections with the current query and page
   * @param query Query to search objects for
   * @param page  Page to retrieve
   * @param useCache Whether or not to use the cache
   */
  search(query: string, page: number, useCache: boolean = true): Observable<RemoteData<PaginatedList<SearchResult<DSpaceObject>>>> {
    let searchListService$: Observable<RemoteData<PaginatedList<Collection>>> = null;
    const findOptions: FindListOptions = {
      currentPage: page,
      elementsPerPage: this.defaultPagination.pageSize
    };

    if (this.entityType) {
      searchListService$ = this.collectionDataService
        .getAuthorizedCollectionByEntityType(
          query,
          this.entityType,
          findOptions);
    } else {
      searchListService$ = this.collectionDataService
        .getAuthorizedCollection(query, findOptions, useCache, false, followLink('parentCommunity'));
    }
    return searchListService$.pipe(
      getFirstCompletedRemoteData(),
      map((rd) => {
        if (!hasValue(rd.payload)) {
          return Object.assign(new RemoteData(null, null, null, null), rd, { payload: null });
        }
        let searchResults = rd.payload.page.map((col) =>
          Object.assign(new CollectionSearchResult(), { indexableObject: col })
        );
        if (isNotEmpty(query)) {
          const lowerQuery = query.trim().toLowerCase();
          searchResults = searchResults.filter((result) => {
            const name = this.dsoNameService.getName(result.indexableObject);
            return hasValue(name) && name.toLowerCase().startsWith(lowerQuery);
          });
        }
        return Object.assign(new RemoteData(null, null, null, null), rd, {
          payload: buildPaginatedList(rd.payload.pageInfo, searchResults),
        });
      })
    );
  }

  /**
   * Override updateList to derive hasNextPage from page-based pagination
   * (currentPage < totalPages) instead of totalElements, because client-side
   * filtering makes totalElements unreliable for next-page detection.
   */
  updateList(rd: RemoteData<PaginatedList<SearchResult<DSpaceObject>>>) {
    this.loading = false;
    const currentEntries = this.listEntries$.getValue();
    if (rd.hasSucceeded) {
      if (hasNoValue(currentEntries)) {
        this.listEntries$.next(rd.payload.page);
      } else {
        this.listEntries$.next([...currentEntries, ...rd.payload.page]);
      }
      // Use page-based check: currentPage is 0-based, totalPages is 1-based
      const pageInfo = rd.payload.pageInfo;
      this.hasNextPage = hasValue(pageInfo) && pageInfo.currentPage < (pageInfo.totalPages - 1);
    } else {
      this.listEntries$.next([
        ...(hasNoValue(currentEntries) ? [] : this.listEntries$.getValue()),
        new ListableNotificationObject(NotificationType.Error, 'dso-selector.results-could-not-be-retrieved', LISTABLE_NOTIFICATION_OBJECT.value)
      ]);
      this.hasNextPage = false;
    }
  }
}
