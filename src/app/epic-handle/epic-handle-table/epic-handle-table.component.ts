import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  BehaviorSubject,
  combineLatest,
  Subscription,
} from 'rxjs';
import {
  scan,
  switchMap,
  take,
} from 'rxjs/operators';
import {
  defaultPagination,
  defaultSortConfiguration,
} from 'src/app/clarin-licenses/clarin-license-table-pagination';
import { SortOptions } from 'src/app/core/cache/models/sort-options.model';
import { EpicHandleDataService } from 'src/app/core/data/epic-handle-data.service';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';

import { BtnDisabledDirective } from '../../shared/btn-disabled.directive';
import {
  hasValue,
  isEmpty,
} from '../../shared/empty.util';
import { ThemedLoadingComponent } from '../../shared/loading/themed-loading.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { VarDirective } from '../../shared/utils/var.directive';
import {
  EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH,
  EPIC_HANDLE_TABLE_NEW_HANDLE_PATH,
  getEpicHandleTableModulePath,
} from '../epic-handle-routing-paths';

@Component({
  imports: [
    BtnDisabledDirective,
    CommonModule,
    FormsModule,
    PaginationComponent,
    ThemedLoadingComponent,
    TranslateModule,
    VarDirective,
  ],
  selector: 'ds-epic-handle-table',
  templateUrl: './epic-handle-table.component.html',
  styleUrls: ['./epic-handle-table.component.scss'],
})
export class EpicHandleTableComponent implements OnInit, OnDestroy {
  constructor(private epicHandleDataService: EpicHandleDataService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService,
    private notificationsService: NotificationsService,
    private route: ActivatedRoute,
    private paginationService: PaginationService) {
  }

  handlesRD$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  pageSize = 10;
  options: PaginationComponentOptions;
  sortConfiguration: SortOptions;
  searchQuery = '';
  pidQuery = '';
  isLoading = false;
  handleRoute: string;
  newHandleRoute = EPIC_HANDLE_TABLE_NEW_HANDLE_PATH;
  editHandlePath = EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH;
  selectedHandle = null;
  prefix = '';
  totalElements: number = null;
  private subs: Subscription[] = [];

  ngOnInit(): void {
    // get the prefix from query params and initialize inside the subscription so we only
    // proceed once we have the prefix available
    this.subs.push(
      this.route.queryParams.pipe(take(1)).subscribe(params => {
        this.prefix = params.prefix;
        if (!this.prefix) {
          this.router.navigate(['/epic-handle-table/prefix']);
          return;
        }

        this.handleRoute = getEpicHandleTableModulePath();
        this.initializePaginationOptions();
        this.initializeSortingOptions();
        this.getAllHandles();
      }),
    );

  }

  getAllHandles() {
    this.isLoading = true;
    // load the current pagination and sorting options
    const currentPagination$ = this.getCurrentPagination();
    const currentSort$ = this.getCurrentSort();
    const searchTerm$ = new BehaviorSubject<string>(this.searchQuery);

    const getAllSub = combineLatest([currentPagination$, currentSort$, searchTerm$]).pipe(
      scan((prevState, [currentPagination, currentSort, searchTerm]) => {
        // If search term has changed, reset to page 1; otherwise, keep current page
        const currentPage = prevState.searchTerm !== searchTerm ? 1 : currentPagination.currentPage;
        return { currentPage, currentPagination, currentSort, searchTerm };
      }, { searchTerm: '', currentPage: 1, currentPagination: this.getCurrentPagination(),
        currentSort: this.getCurrentSort() }),
      switchMap(({ currentPage, currentPagination, currentSort, searchTerm }) => {
        return this.epicHandleDataService.findAll({
          currentPage: currentPage,
          elementsPerPage: currentPagination.pageSize,
          sort: { field: currentSort.field, direction: currentSort.direction },
        }, this.prefix, searchTerm?.trim() !== '' ? searchTerm?.trim() : undefined, this.totalElements,
        );
      }),
    ).pipe(take(1)).subscribe((response) => {
      this.handlesRD$.next(response);
      this.isLoading = false;
      if (response?.payload?.pageInfo?.totalElements !== undefined) {
        this.totalElements = response.payload.pageInfo?.totalElements;
      }
      this.cdr.detectChanges();
    }, (error: unknown) => {
      this.isLoading = false;
      if ((error as any)?.error?.status){
        this.notificationsService.error(null, this.translateService.instant((error as any)?.error?.message));
      } else {
        this.notificationsService.error(null, this.translateService.instant('error'));
      }
      this.cdr.detectChanges();
    });

    this.subs.push(getAllSub);
  }

  clearSearch() {
    this.searchQuery = '';
    this.totalElements = null;
    this.getAllHandles();
  }

  private initializeSortingOptions() {
    this.sortConfiguration = defaultSortConfiguration;
  }

  private initializePaginationOptions() {
    this.options = Object.assign({}, defaultPagination, {
      id: 'epic-handle-pagination',
      pageSize: this.pageSize,
      currentPage: 1,
    });
  }


  redirectToNewHandle() {
    this.router.navigate([this.handleRoute, this.newHandleRoute],
      { queryParams: { currentPage: this.options.currentPage, prefix: this.prefix } },
    );
  }
  redirectToEditHandle() {

    if (isEmpty(this.selectedHandle)) {
      return;
    }

    const editSub = this.handlesRD$.pipe(
      take(1),
    ).subscribe(handlesRD => {
      const handles = handlesRD?.payload?.page || [];
      const handle = handles.find(h => h.id === this.selectedHandle);

      if (handle) {
        this.switchSelectedHandle(this.selectedHandle);
        this.router.navigate([this.handleRoute, this.editHandlePath],
          {
            queryParams: {
              id: handle.id,
              url: handle.url,
              prefix: this.prefix,
            },
          },
        );
      }
    });

    this.subs.push(editSub);
  }

  deleteHandle() {
    if (isEmpty(this.selectedHandle)) {
      return;
    }

    this.isLoading = true;

    const deleteSub = this.epicHandleDataService.deleteByHandleId(this.selectedHandle)
      .pipe(take(1))
      .subscribe(
        (response) => {
          if (response?.hasSucceeded || response?.statusCode === 204) {
            this.notificationsService.success(
              null,
              this.translateService.instant('epic-handle-table.delete-handle.notify.successful'),
            );
            this.switchSelectedHandle(this.selectedHandle);
            this.totalElements = null;
            this.getAllHandles();
          } else {
            this.isLoading = false;
            this.notificationsService.error(
              null,
              this.translateService.instant('epic-handle-table.delete-handle.notify.error'),
            );
          }
        },
        (error: unknown) => {
          this.isLoading = false;
          const errorMessage = (error as any)?.message ||
            this.translateService.instant('epic-handle-table.delete-handle.notify.error');
          this.notificationsService.error(null, errorMessage);
        },
      );

    this.subs.push(deleteSub);
  }

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

  searchHandles() {
    this.totalElements = null;
    this.getAllHandles();
  }


  changePrefix() {
    this.router.navigate(['/epic-handle-table/prefix']);
  }


  goToPID() {
    const raw = (this.pidQuery || '').trim();
    if (!raw) {
      return;
    }

    if (!this.isPidInputValid()) {
      this.notificationsService.error(null, this.translateService.instant('epic-handle-table.pid.invalid'));
      return;
    }

    const pidSub = this.handlesRD$.pipe(
      take(1),
    ).subscribe(handlesRD => {
      const handles = handlesRD?.payload?.page || [];

      let handle = null;
      if (raw.includes('/')) {
        handle = handles.find(h => h.id === raw);
      } else {
        handle = handles.find(h => {
          const parts = h.id.split('/');
          return parts[1] === raw;
        });
      }

      if (handle) {
        this.switchSelectedHandle(handle.id);
        this.router.navigate([this.handleRoute, this.editHandlePath],
          {
            queryParams: {
              id: handle.id,
              url: handle.url,
              prefix: this.prefix,
            },
          },
        );
      } else {
        const suffix = raw.includes('/') ? raw.split('/')[1] : raw;
        this.isLoading = true;
        const findSub = this.epicHandleDataService.findByPrefixAndSuffix(this.prefix, suffix).pipe(take(1)).subscribe(handleResponse => {
          this.isLoading = false;
          this.cdr.detectChanges();
          if (handleResponse) {
            const fetchedHandle = handleResponse;
            this.switchSelectedHandle(fetchedHandle.id);
            this.router.navigate([this.handleRoute, this.editHandlePath],
              {
                queryParams: {
                  id: fetchedHandle.id,
                  url: fetchedHandle.url,
                  prefix: this.prefix,
                },
              },
            );
          } else {
            this.notificationsService.error(null, this.translateService.instant('epic-handle-table.pid.notfound'));
          }
        }, (error: unknown) => {
          this.isLoading = false;
          this.cdr.detectChanges();
          if ((error as any)?.error?.status){
            this.notificationsService.error(null, this.translateService.instant((error as any)?.error?.message));
          } else {
            this.notificationsService.error(null, this.translateService.instant('error'));
          }
        });

        this.subs.push(findSub);
      }
    });
    this.subs.push(pidSub);
  }

  /**
   * Validate the PID input.
   * Accepts full id "prefix/suffix".
   */
  isPidInputValid(): boolean {
    const val = (this.pidQuery || '').trim();
    if (!val) {
      return false;
    }
    if (val.includes('/')) {
      const parts = val.split('/');
      return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
    }
    if (val === this.prefix) {
      return false;
    }
    return true;
  }

  /**
   * Get the current pagination options.
  */
  private getCurrentPagination() {
    return this.paginationService.getCurrentPagination(this.options.id, defaultPagination);
  }

  /**
   * Get the current sorting options.
  */
  private getCurrentSort() {
    return this.paginationService.getCurrentSort(this.options.id, defaultSortConfiguration);
  }

  ngOnDestroy(): void {
    this.handlesRD$.complete();
    this.subs.forEach(sub => {
      if (hasValue(sub)) {
        sub.unsubscribe();
      }
    });
  }
}
