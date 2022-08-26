import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest as observableCombineLatest, combineLatest, Observable} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {Version} from '../../core/shared/version.model';
import {Handle, SUCCESSFUL_RESPONSE_START_CHAR} from '../../core/handle/handle.model';
import {HandleDataService} from '../../core/data/handle-data.service';
import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  first,
  last,
  map, startWith,
  switchMap, take,
  takeLast,
  takeUntil
} from 'rxjs/operators';
import {VersionHistory} from '../../core/shared/version-history.model';
import {PaginatedSearchOptions} from '../../shared/search/models/paginated-search-options.model';
import {followLink} from '../../shared/utils/follow-link-config.model';
import {
  getAllCompletedRemoteData,
  getFirstCompletedRemoteData, getFirstSucceededRemoteData,
  getFirstSucceededRemoteDataPayload, getPaginatedListPayload, getRemoteDataPayload, toDSpaceObjectListRD
} from '../../core/shared/operators';
import {PaginationService} from '../../core/pagination/pagination.service';
import {ObjectSelectComponent} from '../../shared/object-select/object-select/object-select.component';
import {Collection} from '../../core/shared/collection.model';
import {ObjectSelectService} from '../../shared/object-select/object-select.service';
import {AuthorizationDataService} from '../../core/data/feature-authorization/authorization-data.service';
import {getHandleTableModulePath, getPageNotFoundRoute} from '../../app-routing-paths';
import {HANDLE_TABLE_EDIT_HANDLE_PATH, HANDLE_TABLE_NEW_HANDLE_PATH} from '../handle-page-routing-paths';
import {isEmpty, isNotEmpty} from '../../shared/empty.util';
import {Router} from '@angular/router';
import {Operation} from 'fast-json-patch';
import {DeleteRequest, PatchRequest} from '../../core/data/request.models';
import {RequestService} from '../../core/data/request.service';
import wait from 'fork-ts-checker-webpack-plugin/lib/utils/async/wait';
import {
  defaultPagination,
  defaultSortConfiguration,
  paginationID,
  redirectBackWithPaginationOption
} from './handle-table-pagination';
import {TranslateService} from '@ngx-translate/core';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {DSpaceObjectType} from '../../core/shared/dspace-object-type.model';
import {Item} from '../../core/shared/item.model';
import {SortOptions} from '../../core/cache/models/sort-options.model';

/**
 * For changing prefix must be called patch request and patch request must have ID parameter.
 */
export  const DEFAULT_HANDLE_ID = '0';

@Component({
  selector: 'ds-handle-table',
  templateUrl: './handle-table.component.html',
  styleUrls: ['./handle-table.component.scss']
})
export class HandleTableComponent implements OnInit {

  constructor(private handleDataService: HandleDataService,
              private paginationService: PaginationService,
              public router: Router,
              private requestService: RequestService,
              private cdr: ChangeDetectorRef,
              private translateService: TranslateService,
              private notificationsService: NotificationsService) {
  }

  /**
   * The list of Handle object as BehaviorSubject object
   */
  handlesRD$: BehaviorSubject<RemoteData<PaginatedList<Handle>>> = new BehaviorSubject<RemoteData<PaginatedList<Handle>>>(null);

  /**
   * The amount of versions to display per page
   */
  pageSize = 10;

  /**
   * The page options to use for fetching the versions
   * Start at page 1 and always use the set page size
   */
  options: PaginationComponentOptions;

  sortConfiguration: SortOptions;

  /**
   * @TODO docs
   */
  isLoading = false;

  handleRoute: string;

  newHandlePath = HANDLE_TABLE_NEW_HANDLE_PATH;

  editHandlePath = HANDLE_TABLE_EDIT_HANDLE_PATH;

  selectedHandle = null;

  ngOnInit(): void {
    this.handleRoute = getHandleTableModulePath();
    this.initializePaginationOptions();
    this.sortConfiguration = defaultSortConfiguration;
    this.getAllHandles();
  }

  private initializePaginationOptions() {
    this.options = defaultPagination;
  }

  getAllHandles() {
    this.handlesRD$ = new BehaviorSubject<RemoteData<PaginatedList<Handle>>>(null);
    this.isLoading = true;

    const currentPagination$ = this.paginationService.getCurrentPagination(this.options.id, this.options);
    const currentSort$ = this.paginationService.getCurrentSort(this.options.id, this.sortConfiguration);

    observableCombineLatest([currentPagination$, currentSort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.handleDataService.findAll({
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize,
            sort: {field: currentSort.field, direction: currentSort.direction}
          }, false
        );
      }),
      getFirstSucceededRemoteData()
    ).subscribe((res: RemoteData<PaginatedList<Handle>>) => {
      // parse Handle Resource type
      res.payload.page.forEach(handle => {
        if (handle.resourceTypeID === '2') {
          handle.resourceTypeID = 'Item';
        }
      });

      this.handlesRD$.next(res);
      this.isLoading = false;
    });
  }

  /**
   * Updates the page
   */
  onPageChange() {
    this.getAllHandles();
  }

  switchSelectedHandle(handleId) {
    if (this.selectedHandle === handleId) {
      this.selectedHandle = null;
    } else {
      this.selectedHandle = handleId;
    }
  }

  redirectWithCurrentPage() {
    this.router.navigate([this.handleRoute, this.newHandlePath],
      { queryParams: { currentPage: this.options.currentPage } },
    );
  }

  redirectWithHandleParams() {
    // check if is selected some handle
    if (isEmpty(this.selectedHandle)) {
      return;
    }

    this.handlesRD$.pipe(
      // take just one value from subscription because if is the subscription active this code runs after every
      // this.handleRD$ update
      take(1)
    ).subscribe((handleRD) => {
      handleRD.payload.page.forEach(handle => {
        if (handle.id === this.selectedHandle) {
          this.switchSelectedHandle(this.selectedHandle);
          this.router.navigate([this.handleRoute, this.editHandlePath],
            { queryParams: { id: handle.id, _selflink: handle._links.self.href, handle: handle.handle,
                url: handle.url, resourceType: handle.resourceTypeID, resourceId: handle.id,
                currentPage: this.options.currentPage } },
          );
        }
      });
    });
  }

  deleteHandles() {
    // check if is selected some handle
    if (isEmpty(this.selectedHandle)) {
      return;
    }

    let requestId = '';
    // delete handle
    this.handlesRD$.pipe(
      // take just one value from subscription because if is the subscription active this code runs after every
      // this.handleRD$ update
      take(1)
    ).subscribe((handleRD) => {
      handleRD.payload.page.forEach(handle => {
        if (handle.id === this.selectedHandle) {
          requestId = this.requestService.generateRequestId();
          const deleteRequest = new DeleteRequest(requestId, handle._links.self.href);
          // call delete request
          this.requestService.send(deleteRequest);
          // unselect deleted handle
          this.refreshTableAfterDelete(handle.id);
        }
      });
    });

    // check response
    this.requestService.getByUUID(requestId)
      .subscribe(info => {
        // if is empty
        if (!isNotEmpty(info) || !isNotEmpty(info.response) || !isNotEmpty(info.response.statusCode)) {
          // do nothing - in another subscription should be data
          return;
        }

        if (info.response.statusCode.toString().startsWith(SUCCESSFUL_RESPONSE_START_CHAR)) {
          this.notificationsService.success(null, this.translateService.get('handle-table.delete-handle.notify.successful'));
        } else {
          // write error in the notification
          // compose error message with message definition and server error
          let errorMessage = '';
          this.translateService.get('handle-table.delete-handle.notify.error').pipe(
            take(1)
          ).subscribe( message => {
            errorMessage = message + ': ' + info.response.errorMessage;
          });

          this.notificationsService.error(null, errorMessage);
        }
      });
  }

  public refreshTableAfterDelete(deletedHandleId) {
    let counter = 0;
    // The timeout for checking if the handle was daleted in the database
    // The timeout is set to 20 seconds by default.
    const refreshTimeout = 20;

    this.isLoading = true;
    const interval = setInterval( () => {
      let isHandleInTable = false;
      // Load handle from the DB
      this.handleDataService.findAll( {
          currentPage: this.options.currentPage,
          elementsPerPage: this.options.pageSize,
        }, false
      ).pipe(
        getFirstSucceededRemoteData(),
        getRemoteDataPayload()
      ).subscribe(handles => {
        // check if the handle is in the table data
        if (handles.page.some(handle => handle.id === deletedHandleId)) {
          isHandleInTable = true;
        }

        // reload table if the handle was removed from the database
        if (!isHandleInTable) {
          this.switchSelectedHandle(deletedHandleId);
          this.getAllHandles();
          this.cdr.detectChanges();
          clearInterval(interval);
        }
      });

      // Clear interval after 20s timeout
      if (counter === ( refreshTimeout * 1000 ) / 250) {
        this.isLoading = false;
        this.cdr.detectChanges();
        clearInterval(interval);
      }
      counter++;
    }, 250 );
  }

}
