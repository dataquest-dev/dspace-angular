import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Item } from '../../../../core/shared/item.model';
import { Version } from '../../../../core/shared/version.model';
import { RemoteData } from '../../../../core/data/remote-data';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { VersionHistory } from '../../../../core/shared/version-history.model';
import {
  getAllSucceededRemoteData,
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload,
  getRemoteDataPayload
} from '../../../../core/shared/operators';
import { map, switchMap } from 'rxjs/operators';
import { PaginatedList } from '../../../../core/data/paginated-list.model';
import { PaginationComponentOptions } from '../../../../shared/pagination/pagination-component-options.model';
import { VersionHistoryDataService } from '../../../../core/data/version-history-data.service';
import { PaginatedSearchOptions } from '../../../../shared/search/models/paginated-search-options.model';
import { followLink } from '../../../../shared/utils/follow-link-config.model';
import { hasValue, hasValueOperator } from '../../../../shared/empty.util';
import { PaginationService } from '../../../../core/pagination/pagination.service';
import { getItemVersionRoute } from '../../../item-page-routing-paths';
import { WorkspaceItem } from '../../../../core/submission/models/workspaceitem.model';
import { WorkspaceitemDataService } from '../../../../core/submission/workspaceitem-data.service';
import { WorkflowItemDataService } from '../../../../core/submission/workflowitem-data.service';

interface VersionsDTO {
  totalElements: number;
  versionDTOs: VersionDTO[];
}

interface VersionDTO {
  version: Version;
}

@Component({
  selector: 'ds-clarin-item-versions-field',
  templateUrl: './clarin-item-versions-field.component.html',
  styleUrls: ['./clarin-item-versions-field.component.scss']
})

/**
 * Component for displaying item versions as a field in the clarin item page
 */
export class ClarinItemVersionsFieldComponent implements OnDestroy, OnInit {

  /**
   * The item to display version history for
   */
  @Input() item: Item;

  /**
   * Fontawesome v5. icon name with default settings.
   */
  @Input() iconName: string;

  /**
   * Array of active subscriptions
   */
  subs: Subscription[] = [];

  /**
   * The item's version
   */
  versionRD$: Observable<RemoteData<Version>>;

  /**
   * The item's full version history (remote data)
   */
  versionHistoryRD$: Observable<RemoteData<VersionHistory>>;

  /**
   * The item's full version history
   */
  versionHistory$: Observable<VersionHistory>;

  /**
   * The version history information that is used to render the HTML
   */
  versionsDTO$: Observable<VersionsDTO>;

  /**
   * Verify if there is an inprogress submission in the version history
   */
  hasDraftVersion$: Observable<boolean>;

  /**
   * The amount of versions to display per page
   */
  pageSize = 10;

  /**
   * The page options to use for fetching the versions
   * Start at page 1 and always use the set page size
   */
  options = Object.assign(new PaginationComponentOptions(), {
    id: 'clarin-ivo',
    currentPage: 1,
    pageSize: this.pageSize
  });

  /**
   * Toggle state for version history
   */
  showVersionHistory = false;

  /**
   * Observable to check if component should be displayed
   */
  showMetadataValue: Observable<boolean>;

  constructor(private versionHistoryService: VersionHistoryDataService,
              private paginationService: PaginationService,
              private workspaceItemDataService: WorkspaceitemDataService,
              private workflowItemDataService: WorkflowItemDataService
  ) {
  }

  /**
   * Toggle the visibility of version history
   */
  toggleVersionHistory(): void {
    this.showVersionHistory = !this.showVersionHistory;
  }

  /**
   * Get the route to the specified version
   * @param versionId the ID of the version for which the route will be retrieved
   */
  getVersionRoute(versionId: string) {
    return getItemVersionRoute(versionId);
  }

  /**
   * Get all versions for the given version history and store them in versionsDTO$
   * @param versionHistory$
   */
  getAllVersions(versionHistory$: Observable<VersionHistory>): void {
    const currentPagination = this.paginationService.getCurrentPagination(this.options.id, this.options);
    this.versionsDTO$ = combineLatest([versionHistory$, currentPagination]).pipe(
      switchMap(([versionHistory, options]: [VersionHistory, PaginationComponentOptions]) => {
        return this.versionHistoryService.getVersions(versionHistory.id,
          new PaginatedSearchOptions({pagination: Object.assign({}, options, {currentPage: options.currentPage})}),
          false, true, followLink('item'));
      }),
      getFirstCompletedRemoteData(),
      getRemoteDataPayload(),
      map((versions: PaginatedList<Version>) => ({
        totalElements: versions.totalElements,
        versionDTOs: (versions?.page ?? []).reverse().map((version: Version) => ({
          version: version,
        })),
      })),
    );
  }

  /**
   * Get the ID of the workspace item, if present, otherwise return undefined
   * @param versionItem the item for which retrieve the workspace item id
   */
  getWorkspaceId(versionItem: Observable<RemoteData<Item>>): Observable<string> {
    return versionItem.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((item: Item) => item.uuid),
      switchMap((itemUuid: string) => this.workspaceItemDataService.findByItem(itemUuid, true)),
      getFirstCompletedRemoteData<WorkspaceItem>(),
      map((res: RemoteData<WorkspaceItem>) => res?.payload?.id ),
    );
  }

  /**
   * Get the ID of the workflow item, if present, otherwise return undefined
   * @param versionItem the item for which retrieve the workspace item id
   */
  getWorkflowId(versionItem: Observable<RemoteData<Item>>): Observable<string> {
    return versionItem.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((item: Item) => item.uuid),
      switchMap((itemUuid: string) => this.workflowItemDataService.findByItem(itemUuid, true)),
      getFirstCompletedRemoteData<WorkspaceItem>(),
      map((res: RemoteData<WorkspaceItem>) => res?.payload?.id ),
    );
  }

  /**
   * Get the display name for a version item
   * @param versionItem the item to get the name for
   */
  getVersionItemDisplayName(versionItem: Item): string {
    return versionItem.firstMetadataValue('dc.title') || versionItem.name || 'Untitled';
  }

  /**
   * Initialize all observables
   */
  ngOnInit(): void {
    if (hasValue(this.item?.version)) {
      this.versionRD$ = this.item.version;
      this.versionHistoryRD$ = this.versionRD$.pipe(
        getAllSucceededRemoteData(),
        getRemoteDataPayload(),
        hasValueOperator(),
        switchMap((version: Version) => version.versionhistory),
      );
      this.versionHistory$ = this.versionHistoryRD$.pipe(
        getFirstSucceededRemoteDataPayload(),
        hasValueOperator(),
      );

      // If there is a draft item in the version history
      this.hasDraftVersion$ = this.versionHistoryRD$.pipe(
        getFirstSucceededRemoteDataPayload(),
        map((res) => Boolean(res?.draftVersion)),
      );

      this.getAllVersions(this.versionHistory$);

      // Determine if component should be displayed (when there are multiple versions)
      this.showMetadataValue = this.versionsDTO$.pipe(
        map((versionsDTO: VersionsDTO) => versionsDTO && versionsDTO.totalElements > 1)
      );
    } else {
      // No version history available
      this.showMetadataValue = of(false);
    }
  }

  /**
   * Unsub all subscriptions
   */
  cleanupSubscribes() {
    this.subs.filter((sub) => hasValue(sub)).forEach((sub) => sub.unsubscribe());
  }

  ngOnDestroy(): void {
    this.cleanupSubscribes();
    this.paginationService.clearPagination(this.options.id);
  }
}
