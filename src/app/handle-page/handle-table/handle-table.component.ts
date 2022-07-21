import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {Version} from '../../core/shared/version.model';
import {Handle} from '../../core/handle/handle.model';
import {HandleDataService} from '../../core/data/handle-data.service';
import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';
import {map, switchMap} from 'rxjs/operators';
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

@Component({
  selector: 'ds-handle-table',
  templateUrl: './handle-table.component.html',
  styleUrls: ['./handle-table.component.scss']
})
export class HandleTableComponent implements OnInit {

  constructor(private handleDataService: HandleDataService,
              private paginationService: PaginationService,
              protected authorizationService: AuthorizationDataService,
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

  @ViewChild('paginationComponent') paginationComponent;

  ngOnInit(): void {
    this.handleRoute = getHandleTableModulePath();
    this.initializePaginationOptions();
    // this.resetRoute();
    // this.paginationComponent.ngOnDestroy();
    // this.paginationComponent.ngOnInit();
    this.getAllHandles(true);

    // this.paginationService.clearPagination(paginationID);
    // this.paginationService.updateRouteWithUrl(paginationID, [this.handleRoute], {
    //   page: this.options.currentPage,
    //   pageSize: this.options.pageSize
    // });
    // this.cdr.detectChanges();
  }

  private initializePaginationOptions() {
    this.options = defaultPagination;
  }

  getAllHandles(init = false) {
    this.handlesRD$ = new BehaviorSubject<RemoteData<PaginatedList<Handle>>>(null);
    this.isLoading = true;
    // this.paginationService.clearPagination(paginationID);
    // this.paginationService.updateRouteWithUrl(paginationID, [this.handleRoute], {
    //   page: null,
    //   pageSize: null
    // });
    // this.cdr.detectChanges();

    const currentPagination$ = this.paginationService.getCurrentPagination(this.options.id, this.options);
    const currentPagination = Object.assign(new PaginationComponentOptions(), {
      currentPage: null,
      pageSize: null
    });

    currentPagination$.subscribe(pagination => {
      currentPagination.currentPage = pagination.currentPage;
      currentPagination.pageSize = pagination.pageSize;
    });

    if (isNotEmpty(currentPagination.currentPage)) {
      if (currentPagination.currentPage !== this.options.currentPage || init) {
        this.handleDataService.findAll({
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize,
          }, false
        ).pipe(
          getFirstSucceededRemoteData()
        ).subscribe((res: RemoteData<PaginatedList<Handle>>) => {
          this.handlesRD$.next(res);
          this.isLoading = false;
          // this.paginationService.clearPagination(paginationID);
          // this.paginationService.updateRouteWithUrl(paginationID, [this.handleRoute], {
          //   page: null,
          //   pageSize: null
          // });
          // this.cdr.detectChanges();
        });
      }
    }

    // currentPagination$.subscribe(currentPagination => {
    //   // check if was changed options.currentPage because sometimes it send request with old pagination options
    //   if (currentPagination.currentPage !== this.options.currentPage || init) {
    //     // this.paginationService.getCurrentPagination(currentPagination.id, currentPagination).pipe(
    //     this.handleDataService.findAll( {
    //         currentPage: currentPagination.currentPage,
    //         elementsPerPage: currentPagination.pageSize,
    //       }, false
    //     ).pipe(
    //       getFirstSucceededRemoteData()
    //     ).subscribe((res: RemoteData<PaginatedList<Handle>>) => {
    //       this.handlesRD$.next(res);
    //       this.isLoading = false;
    //       // this.paginationService.clearPagination(paginationID);
    //       // this.paginationService.updateRouteWithUrl(paginationID, [this.handleRoute], {
    //       //   page: null,
    //       //   pageSize: null
    //       // });
    //       // this.cdr.detectChanges();
    //     });
    //       // switchMap(() => {
    //       //   this.options.currentPage = currentPagination.currentPage;
    //       //   return
    //       // }),
    //       // getFirstSucceededRemoteData(),
    //     // ).subscribe((res: RemoteData<PaginatedList<Handle>>) => {
    //     //   this.handlesRD$.next(res);
    //     //   this.isLoading = false;
    //     // });
    //   }
    // });
  }

  /**
   * Updates the page
   */
  onPageChange() {
    this.ngOnInit();
    // this.getAllHandles();
  }

  switchSelectedHandle(handleId) {
    if (this.selectedHandle === handleId) {
      this.selectedHandle = null;
    } else {
      this.selectedHandle = handleId;
    }
  }

  redirectWithHandleParams() {
    const lastIDOfSelectedHandle = this.selectedHandle;

    // check if is selected some handle
    if (isEmpty(lastIDOfSelectedHandle)) {
      return;
    }

    this.handlesRD$.subscribe((handleRD) => {
      handleRD.payload.page.forEach(handle => {
        if (handle.id === lastIDOfSelectedHandle) {

          // this.paginationService.updateRouteWithUrl(paginationID,[getHandleTableModulePath()], {
          //   page: this.currentPage,
          //   pageSize: 10
          // }, {
          //   handle: null,
          //   url: null,
          //   id: null,
          //   _selflink: null,
          //   currentPage: null
          // });
          // this.paginationService.clearPagination(paginationID);
          // this.paginationService.updateRouteWithUrl(paginationID, [this.handleRoute, this.editHandlePath], {
          //   page: this.options.currentPage,
          //   pageSize: this.options.pageSize
          // }, {
          //   id: handle.id, _selflink: handle._links.self.href, handle: handle.handle, url: 'handle.url', currentPage: this.options.currentPage
          // });

          // this.paginationService.clearPagination(paginationID);
          // this.paginationService.updateRouteWithUrl(paginationID, [this.handleRoute], {
          //   page: null,
          //   pageSize: null
          // });
          // this.cdr.detectChanges();
          // @TODO add URL to the handle object
          this.router.navigate([this.handleRoute, this.editHandlePath],
            { queryParams: { id: handle.id, _selflink: handle._links.self.href, handle: handle.handle, url: 'handle.url', currentPage: this.options.currentPage } },
            );
          // this.cdr.detectChanges();
        }
      });
    });

    // @TODO add notification if none handle was selected
  }

  deleteHandles() {
    const lastIDOfSelectedHandle = this.selectedHandle;

    // check if is selected some handle
    if (isEmpty(lastIDOfSelectedHandle)) {
      return;
    }

    // delete handle
    this.handlesRD$.subscribe((handleRD) => {
      handleRD.payload.page.forEach(handle => {
        if (handle.id === lastIDOfSelectedHandle) {
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

  private refreshTableAfterDelete(deletedHandleId) {
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

  /**
   * Method to reset the route when the tab is opened to make sure no strange pagination issues appears
   */
  resetRoute() {
    // this.router.resetConfig()ngOnDestroy();
    // this.router.resetConfig(this.router.config);
    // this.paginationService.updateRouteWithUrl(paginationID,[this.handleRoute], {
    //   page: this.options.currentPage,
    //   pageSize: this.pageSize
    // });
  }

}
