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
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload, getPaginatedListPayload, getRemoteDataPayload
} from '../../core/shared/operators';
import {PaginationService} from '../../core/pagination/pagination.service';

@Component({
  selector: 'ds-handle-table',
  templateUrl: './handle-table.component.html',
  styleUrls: ['./handle-table.component.scss']
})
export class HandleTableComponent implements OnInit {

  constructor(private handleDataService: HandleDataService,
              private paginationService: PaginationService) { }

  /**
   * The list of Handle object as observable object
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

  ngOnInit(): void {
    this.getAllHandles();
  }

  getAllHandles() {
    this.paginationService.getCurrentPagination(this.options.id, this.options).pipe(
      switchMap((currentPagination) => {
        return this.handleDataService.findAll( {
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize
          }
        );
      }),
      getFirstCompletedRemoteData(),
    ).subscribe((res: RemoteData<PaginatedList<Handle>>) => {
      this.handlesRD$.next(res);
    });
  }

  /**
   * Updates the page
   */
  onPageChange() {
    this.getAllHandles();
  }

  // define table structure
  // load init data from handle repository

}
