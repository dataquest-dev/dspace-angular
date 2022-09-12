import { Component, OnInit } from '@angular/core';
import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';
import { BehaviorSubject, combineLatest as observableCombineLatest, fromEvent } from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {getFirstSucceededRemoteData} from '../../core/shared/operators';
import {switchMap} from 'rxjs/operators';
import {PaginationService} from '../../core/pagination/pagination.service';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {SortDirection, SortOptions} from '../../core/cache/models/sort-options.model';
import {defaultPagination, defaultSortConfiguration} from '../clarin-license-table-pagination';

@Component({
  selector: 'ds-clarin-license-table',
  templateUrl: './clarin-license-table.component.html',
  styleUrls: ['./clarin-license-table.component.scss']
})
export class ClarinLicenseTableComponent implements OnInit {

  // tslint:disable-next-line:no-empty
  constructor(private paginationService: PaginationService,
              private clarinLicenseService: ClarinLicenseDataService) { }

  /**
   * The list of Handle object as BehaviorSubject object
   */
  licensesRD$: BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>> = new BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>>(null);

  /**
   * The page options to use for fetching the versions
   * Start at page 1 and always use the set page size
   */
  options: PaginationComponentOptions;

  /**
   * The configuration which is send to the server with search request.
   */
  sortConfiguration: SortOptions;

  selectedLicense: number;

  /**
   * If the request isn't processed show to loading bar.
   */
  isLoading = false;


  // tslint:disable-next-line:no-empty
  ngOnInit(): void {
    this.initializePaginationOptions();
    this.initializeSortingOptions();
    this.getAllLicenses();
  }

  private initializePaginationOptions() {
    this.options = defaultPagination;
  }

  private initializeSortingOptions() {
    this.sortConfiguration = defaultSortConfiguration;
  }

  /**
   * Updates the page
   */
  onPageChange() {
    this.getAllLicenses();
  }

  getAllLicenses() {
    this.licensesRD$ = new BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>>(null);
    this.isLoading = true;

    // load the current pagination and sorting options
    const currentPagination$ = this.paginationService.getCurrentPagination(this.options.id, this.options);
    const currentSort$ = this.paginationService.getCurrentSort(this.options.id, defaultSortConfiguration);

    observableCombineLatest([currentPagination$, currentSort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.clarinLicenseService.findAll({
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize,
            sort: {field: currentSort.field, direction: currentSort.direction}
          }, false
        );
      }),
      getFirstSucceededRemoteData()
    ).subscribe((res: RemoteData<PaginatedList<ClarinLicense>>) => {
      this.licensesRD$.next(res);
      this.isLoading = false;
    });
  }

  /**
   * Mark the handle as selected or unselect if it is already clicked.
   * @param handleId id of the selected handle
   */
  switchSelectedHandle(licenseId) {
    if (this.selectedLicense === licenseId) {
      this.selectedLicense = null;
    } else {
      this.selectedLicense = licenseId;
    }
  }

}
