import { Component, OnInit } from '@angular/core';
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
import {getHandleTableModulePath} from '../../app-routing-paths';
import {HANDLE_TABLE_EDIT_HANDLE_PATH, HANDLE_TABLE_NEW_HANDLE_PATH} from '../handle-page-routing-paths';
import {isEmpty} from '../../shared/empty.util';
import {Router} from '@angular/router';

@Component({
  selector: 'ds-handle-table',
  templateUrl: './handle-table.component.html',
  styleUrls: ['./handle-table.component.scss']
})
export class HandleTableComponent extends ObjectSelectComponent<Handle> implements OnInit {

  constructor(private handleDataService: HandleDataService,
              private paginationService: PaginationService,
              protected objectSelectService: ObjectSelectService,
              protected authorizationService: AuthorizationDataService,
              public router: Router) {
    super(objectSelectService, authorizationService);
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
  options = Object.assign(new PaginationComponentOptions(), {
    id: 'hdl',
    currentPage: 1,
    pageSize: this.pageSize
  });

  /**
   * @TODO docs
   */
  isLoading = false;

  handleRoute: string;

  newHandlePath = HANDLE_TABLE_NEW_HANDLE_PATH;

  editHandlePath = HANDLE_TABLE_EDIT_HANDLE_PATH;

  ngOnInit(): void {
    this.getAllHandles(true);
    this.handleRoute = getHandleTableModulePath();
  }

  getAllHandles(init = false) {
    this.handlesRD$ = new BehaviorSubject<RemoteData<PaginatedList<Handle>>>(null);
    this.isLoading = true;

    const currentPagination$ = this.paginationService.getCurrentPagination(this.options.id, this.options);
    currentPagination$.subscribe(currentPagination => {
      // check if was changed options.currentPage because sometimes it send request with old pagination options
      if (currentPagination.currentPage !== this.options.currentPage || init) {
        this.paginationService.getCurrentPagination(currentPagination.id, currentPagination).pipe(
          switchMap(() => {
            return this.handleDataService.findAll( {
                currentPage: currentPagination.currentPage,
                elementsPerPage: currentPagination.pageSize,
              }
            );
          }),
          getFirstSucceededRemoteData(),
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

    if (!this.isLoading) {
      this.handlesRD$.pipe(
        getRemoteDataPayload()
      ).subscribe(rm => {
        return rm;
      });
    }
  }

  getSelectedHandles() {
    let selectedHandlesIds = [];

    this.objectSelectService.getAllSelected(this.key).subscribe(sele => {
      selectedHandlesIds = sele;
    });
    return selectedHandlesIds;
  }

  redirectWithHandleAndURL() {
    const lastIDOfSelectedHandle = this.getSelectedHandles().pop();

    // check if is selected some handle
    if (isEmpty(lastIDOfSelectedHandle)) {
      return;
    }

    this.handlesRD$.subscribe((handleRD) => {
      handleRD.payload.page.forEach(handle => {
        if (handle.id.toString() === lastIDOfSelectedHandle) {
          // @TODO add URL to the handle object
          this.router.navigate([this.handleRoute, this.editHandlePath],
            { queryParams: { handle: handle.handle, url: 'handle.url' } });
        }
      });
    });
  }

  deleteHandles() {
    console.log('selected handles', this.getSelectedHandles());
  }



  // define table structure
  // load init data from handle repository

}
