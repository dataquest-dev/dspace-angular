import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {Version} from '../../core/shared/version.model';
import {Handle} from '../../core/handle/handle.model';
import {HandleDataService} from '../../core/data/handle-data.service';
import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  first,
  last,
  map,
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
  getFirstSucceededRemoteDataPayload, getPaginatedListPayload, getRemoteDataPayload
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
import {defaultPagination, paginationID} from './handle-table-pagination';

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
              private cdr: ChangeDetectorRef) {
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
    this.getAllHandles(true);
  }

  private initializePaginationOptions() {
    this.options = defaultPagination;
  }

  getAllHandles(init = false) {
    this.handlesRD$ = new BehaviorSubject<RemoteData<PaginatedList<Handle>>>(null);
    this.isLoading = true;

    const currentPagination$ = this.paginationService.getCurrentPagination(this.options.id, this.options);
    const currentPagination = Object.assign(new PaginationComponentOptions(), {
      currentPage: null,
      pageSize: null
    });

    currentPagination$.subscribe(pagination => {
      currentPagination.currentPage = pagination.currentPage;
      currentPagination.pageSize = pagination.pageSize;

      if (isEmpty(currentPagination.currentPage) || isEmpty(this.options.currentPage)) {
        return;
      }

      if (currentPagination.currentPage !== this.options.currentPage || init) {
        this.options.currentPage = currentPagination.currentPage;
        this.handleDataService.findAll({
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize,
          }, false
        ).pipe(
          getFirstSucceededRemoteData()
        ).subscribe((res: RemoteData<PaginatedList<Handle>>) => {
          this.handlesRD$.next(res);
          this.isLoading = false;
        });
      }
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
          // @TODO add URL to the handle object
          this.router.navigate([this.handleRoute, this.editHandlePath],
            { queryParams: { id: handle.id, _selflink: handle._links.self.href, handle: handle.handle, url: 'handle.url', currentPage: this.options.currentPage } },
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

    // delete handle
    this.handlesRD$.pipe(
      // take just one value from subscription because if is the subscription active this code runs after every
      // this.handleRD$ update
      take(1)
    ).subscribe((handleRD) => {
      handleRD.payload.page.forEach(handle => {
        if (handle.id === this.selectedHandle) {
          const requestId = this.requestService.generateRequestId();
          const deleteRequest = new DeleteRequest(requestId, handle._links.self.href);
          // call delete request
          this.requestService.send(deleteRequest);
          // unselect deleted handle
          this.refreshTableAfterDelete(handle.id);
        }
      });
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
          this.getAllHandles(true);
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
