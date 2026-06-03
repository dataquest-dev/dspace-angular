import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationComponentOptions } from '../../shared/pagination/pagination-component-options.model';
import { BehaviorSubject, combineLatest as observableCombineLatest, Observable, of, Subject } from 'rxjs';
import { RemoteData } from '../../core/data/remote-data';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { ClarinLicense } from '../../core/shared/clarin/clarin-license.model';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData } from '../../core/shared/operators';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { PaginationService } from '../../core/pagination/pagination.service';
import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { defaultPagination, defaultSortConfiguration } from '../clarin-license-table-pagination';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DefineLicenseFormComponent } from './modal/define-license-form/define-license-form.component';
import { DefineLicenseLabelFormComponent } from './modal/define-license-label-form/define-license-label-form.component';
import { ClarinLicenseConfirmationSerializer } from '../../core/shared/clarin/clarin-license-confirmation-serializer';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { isNull } from '../../shared/empty.util';
import { ClarinLicenseLabel } from '../../core/shared/clarin/clarin-license-label.model';
import { ClarinLicenseLabelDataService } from '../../core/data/clarin/clarin-license-label-data.service';
import { ClarinLicenseLabelExtendedSerializer } from '../../core/shared/clarin/clarin-license-label-extended-serializer';
import { ClarinLicenseRequiredInfoSerializer } from '../../core/shared/clarin/clarin-license-required-info-serializer';
import cloneDeep from 'lodash/cloneDeep';
import { RequestParam } from '../../core/cache/models/request-param.model';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { DSpaceObject } from '../../core/shared/dspace-object.model';

/**
 * Component for managing clarin licenses and defining clarin license labels.
 */
@Component({
  selector: 'ds-clarin-license-table',
  templateUrl: './clarin-license-table.component.html',
  styleUrls: ['./clarin-license-table.component.scss']
})
export class ClarinLicenseTableComponent implements OnInit, OnDestroy {

  constructor(private paginationService: PaginationService,
              private clarinLicenseService: ClarinLicenseDataService,
              private clarinLicenseLabelService: ClarinLicenseLabelDataService,
              private modalService: NgbModal,
              public activeModal: NgbActiveModal,
              private notificationService: NotificationsService,
              private translateService: TranslateService,) { }

  /**
   * Full licenses dataset used by frontend-only label usage derivation.
   */
  allLicensesRD$: BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>> =
    new BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>>(null);

  /**
   * The list of ClarinLicense object as BehaviorSubject object
   */
  licensesRD$: BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>> = new BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>>(null);

  /**
   * The pagination options
   * Start at page 1 and always use the set page size
   */
  options: PaginationComponentOptions;

  /**
   * The license which is currently selected, only one license could be selected
   */
  selectedLicense: ClarinLicense;

  /**
   * If the request isn't processed show the loading bar.
   */
  isLoading = false;

  /**
   * License name typed into search input field, it is passed to the BE as searching value.
   */
  searchingLicenseName = '';

  /**
   * RemoteData stream for license labels table.
   */
  labelsRD$: BehaviorSubject<RemoteData<PaginatedList<ClarinLicenseLabel>>> =
    new BehaviorSubject<RemoteData<PaginatedList<ClarinLicenseLabel>>>(null);

  /**
   * Loading state for labels table.
   */
  loading$ = new BehaviorSubject<boolean>(false);

  /**
   * Single source of truth for whether the full license usage crawl has finished building the
   * in-use set. Emits true once the crawl completes successfully; until then the label Delete
   * buttons stay disabled so an in-use label is never deletable during the crawl window.
   * Read synchronously via `.value` as the re-crawl guard, and bound reactively in the template.
   */
  labelUsageReady$ = new BehaviorSubject<boolean>(false);

  /**
   * Pagination configuration for labels table.
   */
  labelPaginationOptions: PaginationComponentOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'cLicenseLabels',
    currentPage: 1,
    pageSize: 10
  });

  /**
   * Triggers a labels reload without changing pagination state.
   */
  private labelsRefresh$ = new BehaviorSubject<void>(undefined);

  /**
   * Label ids currently linked from at least one license.
   */
  private inUseLabelIds = new Set<string>();

  /**
   * Page size used to retrieve all licenses for usage analysis.
   */
  private readonly allLicensesPageSize = 100;

  /**
   * Indicates whether a full usage crawl is currently in flight.
   */
  private licenseUsageLoading = false;

  /**
   * Stores the previous search term to detect when a new search should reset pagination.
   */
  private previousSearchTerm = '';

  /**
   * Emits when component is destroyed to clean up subscriptions.
   */
  private ngUnsubscribe = new Subject<void>();

  ngOnInit(): void {
    this.initializePaginationOptions();
    this.loadAllLicenses();
    this.initializeLabelsPaginationStream();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // define license
  /**
   * Pop up the License modal where the user fill in the License data.
   */
  openDefineLicenseForm() {
    const defineLicenseModalRef = this.modalService.open(DefineLicenseFormComponent, { centered: true });

    defineLicenseModalRef.result.then((result: ClarinLicense) => {
      this.defineNewLicense(result);
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * Send create request to the API with the new License.
   * @param clarinLicense from the License modal.
   */
  defineNewLicense(clarinLicense: ClarinLicense) {
    const successfulMessageContentDef = 'clarin-license.define-license.notification.successful-content';
    const errorMessageContentDef = 'clarin-license.define-license.notification.error-content';
    if (isNull(clarinLicense)) {
      this.notifyOperationStatus(clarinLicense, successfulMessageContentDef, errorMessageContentDef);
      return;
    }

    // convert string value from the form to the number
    clarinLicense.confirmation = ClarinLicenseConfirmationSerializer.Serialize(clarinLicense.confirmation);
    // convert ClarinLicenseUserInfo.short the string value
    if (Array.isArray(clarinLicense.requiredInfo)) {
      clarinLicense.requiredInfo = ClarinLicenseRequiredInfoSerializer.Serialize(clarinLicense.requiredInfo);
    }

    this.clarinLicenseService.create(clarinLicense)
      .pipe(getFirstCompletedRemoteData())
      .subscribe((defineLicenseResponse: RemoteData<ClarinLicense>) => {
        // check payload and show error or successful
        this.notifyOperationStatus(defineLicenseResponse, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses({ forceUsageReload: true });
      });
  }

  // edit license
  /**
   * Pop up the License modal where the user fill in the License data. The modal is the same as the DefineLicenseForm.
   */
  openEditLicenseForm() {
    if (isNull(this.selectedLicense)) {
      return;
    }

    // pass the actual clarin license values to the define-clarin-license modal
    const editLicenseModalRef = this.modalService.open(DefineLicenseFormComponent, { centered: true });
    editLicenseModalRef.componentInstance.name = this.selectedLicense.name;
    editLicenseModalRef.componentInstance.definition = this.selectedLicense.definition;
    editLicenseModalRef.componentInstance.confirmation = this.selectedLicense.confirmation;
    editLicenseModalRef.componentInstance.requiredInfo = this.selectedLicense.requiredInfo;
    editLicenseModalRef.componentInstance.extendedClarinLicenseLabels =
      this.selectedLicense.extendedClarinLicenseLabels;
    editLicenseModalRef.componentInstance.clarinLicenseLabel =
      this.selectedLicense.clarinLicenseLabel;

    editLicenseModalRef.result.then((result: ClarinLicense) => {
      this.editLicense(result);
    });
  }

  /**
   * Send put request to the API with updated Clarin License.
   * @param clarinLicense from the License modal.
   */
  editLicense(clarinLicense: ClarinLicense) {
    const successfulMessageContentDef = 'clarin-license.edit-license.notification.successful-content';
    const errorMessageContentDef = 'clarin-license.edit-license.notification.error-content';
    if (isNull(clarinLicense)) {
      this.notifyOperationStatus(clarinLicense, successfulMessageContentDef, errorMessageContentDef);
      return;
    }

    const clarinLicenseObj = new ClarinLicense();
    clarinLicenseObj.name = clarinLicense.name;
    // @ts-ignore
    clarinLicenseObj.clarinLicenseLabel = this.ignoreIcon(clarinLicense.clarinLicenseLabel);
    // @ts-ignore
    clarinLicenseObj.extendedClarinLicenseLabels = this.ignoreIcon(clarinLicense.extendedClarinLicenseLabels);
    clarinLicenseObj._links = this.selectedLicense._links;
    clarinLicenseObj.id = clarinLicense.id;
    clarinLicenseObj.confirmation = clarinLicense.confirmation;
    // convert ClarinLicenseUserInfo.short the string value
    if (Array.isArray(clarinLicense.requiredInfo)) {
      clarinLicenseObj.requiredInfo = ClarinLicenseRequiredInfoSerializer.Serialize(clarinLicense.requiredInfo);
    }
    clarinLicenseObj.definition = clarinLicense.definition;
    clarinLicenseObj.bitstreams = clarinLicense.bitstreams;
    clarinLicenseObj.type = clarinLicense.type;

    this.clarinLicenseService.put(clarinLicenseObj)
      .pipe(getFirstCompletedRemoteData())
      .subscribe((editResponse: RemoteData<ClarinLicense>) => {
        // check payload and show error or successful
        this.notifyOperationStatus(editResponse, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses({ forceUsageReload: true });
      });
  }

  /**
   * When the Clarin License is editing ignore the Clarin License Label Icons - it throws error on BE, because the icon
   * is send as string not as byte array.
   * @param clarinLicenses
   */
  ignoreIcon(clarinLicenses: ClarinLicenseLabel | ClarinLicenseLabel[]) {
    const clarinLicenseUpdatable = cloneDeep(clarinLicenses);

    if (Array.isArray(clarinLicenseUpdatable)) {
      clarinLicenseUpdatable.forEach(clarinLicense => {
        clarinLicense.icon = [];
      });
    } else {
      clarinLicenseUpdatable.icon = [];
    }
    return clarinLicenseUpdatable;
  }

  // define license label
  /**
   * Pop up License Label modal where the user fill in the License Label data.
   */
  openDefineLicenseLabelForm() {
    const defineLicenseLabelModalRef = this.modalService.open(DefineLicenseLabelFormComponent, { centered: true });

    defineLicenseLabelModalRef.result.then((result: ClarinLicenseLabel) => {
      this.defineLicenseLabel(result);
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * Send create request to the API, the License Label icon is transformed to the byte array.
   * @param clarinLicenseLabel object from the License Label modal.
   */
  defineLicenseLabel(clarinLicenseLabel: ClarinLicenseLabel) {
    const successfulMessageContentDef = 'clarin.license.label.create.success';
    const errorMessageContentDef = 'clarin.license.label.create.error';
    if (isNull(clarinLicenseLabel)) {
      this.notifyOperationStatus(clarinLicenseLabel, successfulMessageContentDef, errorMessageContentDef);
      return;
    }

    // convert file to the byte array
    const reader = new FileReader();
    const fileByteArray = [];

    try {
      reader.readAsArrayBuffer(clarinLicenseLabel.icon?.[0]);
    } catch (error) {
      // Cannot read any icon that means there is no icon
      // Create license label without icon
      this.createClarinLicenseLabel(clarinLicenseLabel, [], successfulMessageContentDef, errorMessageContentDef);
      return;
    }

    // Create license label with icon
    reader.onerror = (evt) => {
      this.notifyOperationStatus(null, successfulMessageContentDef, errorMessageContentDef);
    };
    reader.onloadend = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        const arrayBuffer = evt.target.result;
        if (arrayBuffer instanceof ArrayBuffer) {
          const array = new Uint8Array(arrayBuffer);
          for (const item of array) {
            fileByteArray.push(item);
          }
        }
        this.createClarinLicenseLabel(clarinLicenseLabel, fileByteArray, successfulMessageContentDef, errorMessageContentDef);
      }
    };
  }

  /**
   * Call BE request to create a clarin license label with or without icon.
   * Show response in the notification popup.
   */
  createClarinLicenseLabel(clarinLicenseLabel: ClarinLicenseLabel, fileByteArray: any[] = [],
                           successfulMessageContentDef: any, errorMessageContentDef: any) {
    clarinLicenseLabel.icon = fileByteArray;
    // convert string value from the form to the boolean
    clarinLicenseLabel.extended = ClarinLicenseLabelExtendedSerializer.Serialize(clarinLicenseLabel.extended);

    // create
    this.clarinLicenseLabelService.create(clarinLicenseLabel)
      .pipe(getFirstCompletedRemoteData())
      .subscribe((defineLicenseLabelResponse: RemoteData<ClarinLicenseLabel>) => {
        // check payload and show error or successful
        this.notifyOperationStatus(defineLicenseLabelResponse, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses();
        if (defineLicenseLabelResponse?.hasSucceeded) {
          // The backend returns labels in ascending insertion order (it ignores the sort param),
          // so a new label lands on the last page. Jump there so the admin sees it without paging.
          this.goToLastLabelsPage();
        } else {
          this.refreshLabels();
        }
      });
  }

  // delete license
  /**
   * Delete selected license. If none license is selected do nothing.
   */
  deleteLicense() {
    if (isNull(this.selectedLicense?.id)) {
      return;
    }
    this.clarinLicenseService.delete(String(this.selectedLicense.id))
      .pipe(getFirstCompletedRemoteData())
      .subscribe(deleteLicenseResponse => {
        const successfulMessageContentDef = 'clarin-license.delete-license.notification.successful-content';
        const errorMessageContentDef = 'clarin-license.delete-license.notification.error-content';
        this.notifyOperationStatus(deleteLicenseResponse, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses({ forceUsageReload: true });
      });
  }

  /**
   * Open the edit modal for the selected license label, pre-filling its current values.
   * On confirm, calls the PUT service and refreshes the label list.
   */
  editLabel(label: ClarinLicenseLabel) {
    if (isNull(label)) {
      return;
    }

    const editLabelModalRef = this.modalService.open(DefineLicenseLabelFormComponent, { centered: true });
    editLabelModalRef.componentInstance.clarinLicenseLabel = label;

    editLabelModalRef.result.then((result) => {
      this.editLicenseLabel(result, label);
    }).catch(() => { /* dismissed */ });
  }

  /**
   * Send a PUT request to update the selected label with the new form values.
   * Handles success/error notifications and refreshes the label list.
   * @param formValues The updated form values returned from the edit modal.
   * @param selectedLabel The selected label row to update.
   */
  editLicenseLabel(formValues: any, selectedLabel: ClarinLicenseLabel) {
    const successMsg = 'clarin.license.label.edit.success';
    const errorMsg = 'clarin.license.label.edit.error';
    if (isNull(formValues) || isNull(selectedLabel)) {
      this.notifyOperationStatus(null, successMsg, errorMsg);
      return;
    }

    const updatedLabel = new ClarinLicenseLabel();
    updatedLabel.id = selectedLabel.id;
    updatedLabel._links = selectedLabel._links;
    updatedLabel.type = selectedLabel.type;
    updatedLabel.label = formValues.label;
    updatedLabel.title = formValues.title;
    updatedLabel.extended = !!formValues.extended;

    // file input: convert if a new file was selected, otherwise keep existing icon
    const reader = new FileReader();
    try {
      reader.readAsArrayBuffer(formValues.icon?.[0]);
      reader.onerror = () => {
        this.notifyOperationStatus(null, successMsg, errorMsg);
      };
      reader.onloadend = (evt) => {
        if (evt.target.readyState === FileReader.DONE) {
          const buf = evt.target.result;
          const bytes: number[] = [];
          if (buf instanceof ArrayBuffer) {
            const arr = new Uint8Array(buf);
            for (const b of arr) { bytes.push(b); }
          }
          updatedLabel.icon = bytes;
          this.doUpdateLabel(updatedLabel, successMsg, errorMsg);
        }
      };
    } catch {
      // no new file selected – clear the icon when requested, otherwise keep the existing one
      updatedLabel.icon = formValues.clearIcon ? [] : selectedLabel.icon;
      this.doUpdateLabel(updatedLabel, successMsg, errorMsg);
    }
  }

  /**
   * Execute the actual PUT request for a label and handle notifications + dependent list refreshes.
   */
  private doUpdateLabel(label: ClarinLicenseLabel, successMsg: string, errorMsg: string) {
    this.clarinLicenseLabelService.put(label)
      .pipe(getFirstCompletedRemoteData(), takeUntil(this.ngUnsubscribe))
      .subscribe((res: RemoteData<ClarinLicenseLabel>) => {
        this.notifyOperationStatus(res, successMsg, errorMsg);
        if (res?.hasSucceeded) {
          this.refreshLabels();
          this.loadAllLicenses();
        }
      });
  }

  /**
   * Ask for confirmation and delete the selected license label.
   */
  confirmDeleteLabel(labelToDelete: ClarinLicenseLabel) {
    if (isNull(labelToDelete?.id)) {
      return;
    }

    const labelDeleteDSO = new DSpaceObject();
    labelDeleteDSO.name = labelToDelete.label;

    const modalRef = this.modalService.open(ConfirmationModalComponent, { centered: true });
    modalRef.componentInstance.dso = labelDeleteDSO;
    modalRef.componentInstance.headerLabel = 'clarin.license.label.delete.confirm.title';
    modalRef.componentInstance.infoLabel = 'clarin.license.label.delete.confirm.message';
    modalRef.componentInstance.cancelLabel = 'clarin.license.label.delete.cancel.button';
    modalRef.componentInstance.confirmLabel = 'clarin.license.label.delete.confirm.button';
    modalRef.componentInstance.brandColor = 'danger';
    modalRef.componentInstance.confirmIcon = 'fas fa-trash';

    modalRef.componentInstance.response
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((confirm: boolean) => {
        if (!confirm) {
          return;
        }

        this.clarinLicenseLabelService.delete(String(labelToDelete.id))
          .pipe(getFirstCompletedRemoteData(), takeUntil(this.ngUnsubscribe))
          .subscribe((deleteLabelResponse) => {
            if (deleteLabelResponse?.hasSucceeded) {
              this.notificationService.success('', this.translateService.get('clarin.license.label.delete.success'));
              this.refreshLabels();
              this.loadAllLicenses();
            } else {
              this.notificationService.error('', this.translateService.get('clarin.license.label.delete.error'));
            }
          }, () => {
            this.notificationService.error('', this.translateService.get('clarin.license.label.delete.error'));
          });
      });
  }

  /**
   * Reload labels table using current pagination options.
   */
  refreshLabels() {
    this.labelsRefresh$.next(undefined);
  }

  /**
   * Navigate the labels table to the page that contains the most recently created label.
   * Exactly one label was just added, so the new total is the current total plus one; the new
   * label is on the last page because the backend lists labels in ascending insertion order.
   */
  private goToLastLabelsPage() {
    const pageSize = this.labelPaginationOptions.pageSize;
    const currentTotal = this.labelsRD$.value?.payload?.totalElements ?? 0;
    const lastPage = Math.max(1, Math.ceil((currentTotal + 1) / pageSize));
    this.paginationService.updateRoute(this.labelPaginationOptions.id, { page: lastPage });
    // Force a reload as well so the table refreshes even when already on the target page.
    this.refreshLabels();
  }

  /**
   * Pop up the notification about the request success. Messages are loaded from the `en.json5`.
   * @param operationResponse current response
   * @param sucContent successful message name
   * @param errContent error message name
   */
  notifyOperationStatus(operationResponse, sucContent, errContent) {
    if (isNull(operationResponse)) {
      this.notificationService.error('', this.translateService.get(errContent));
      return;
    }

    if (operationResponse.hasSucceeded) {
      this.notificationService.success('',
        this.translateService.get(sucContent));
    } else if (operationResponse.isError) {
      this.notificationService.error('',
        this.translateService.get(errContent));
    }
  }

  /**
   * Update the page
   */
  onPageChange() {
    this.loadAllLicenses();
  }

  /**
   * Run a search and reset the route-backed pagination when the search term changes.
   */
  searchLicenses() {
    const hasSearchTermChanged = this.searchingLicenseName !== this.previousSearchTerm;

    if (hasSearchTermChanged) {
      this.paginationService.resetPage(this.options.id);
    }

    this.loadAllLicenses({ pageOverride: hasSearchTermChanged ? 1 : undefined });
    this.previousSearchTerm = this.searchingLicenseName;
  }

  /**
   * Fetch all licenses from the API.
   */
  loadAllLicenses(options: { pageOverride?: number; forceUsageReload?: boolean } = {}) {
    const { pageOverride, forceUsageReload = false } = options;
    this.selectedLicense = null;
    this.licensesRD$ = new BehaviorSubject<RemoteData<PaginatedList<ClarinLicense>>>(null);
    this.isLoading = true;
    this.ensureLicenseUsageLoaded(forceUsageReload);

    // load the current pagination and sorting options
    const currentPagination$ = this.getCurrentPagination();
    const currentSort$ = this.getCurrentSort();

    observableCombineLatest([currentPagination$, currentSort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.clarinLicenseService.searchBy('byNameLike', {
            currentPage: pageOverride ?? currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize,
            sort: { field: currentSort.field, direction: currentSort.direction },
            searchParams: [new RequestParam('name', this.searchingLicenseName)]
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
   * Ensure the expensive full usage crawl runs only when needed.
   * @param forceReload When true, invalidate existing usage cache and reload.
   */
  private ensureLicenseUsageLoaded(forceReload = false) {
    if (forceReload) {
      this.labelUsageReady$.next(false);
    }

    if (this.labelUsageReady$.value || this.licenseUsageLoading) {
      return;
    }

    this.licenseUsageLoading = true;
    this.labelUsageReady$.next(false);
    this.loadAllLicensesForUsage();
  }

  /**
   * Returns whether a license label is used by at least one license (primary or extended labels).
   * @param label License label row object.
   */
  isLabelInUse(label: ClarinLicenseLabel): boolean {
    if (isNull(label?.id)) {
      return false;
    }
    return this.inUseLabelIds.has(String(label.id));
  }

  /**
   * Load all licenses page-by-page and rebuild label usage set.
   */
  private loadAllLicensesForUsage() {
    this.fetchAllLicensePages(0, [])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ response, licenses }) => {
        this.licenseUsageLoading = false;
        this.allLicensesRD$.next(response);
        if (response?.hasSucceeded) {
          this.rebuildLabelUsageSet(licenses);
          this.labelUsageReady$.next(true);
        } else {
          this.inUseLabelIds.clear();
          this.labelUsageReady$.next(false);
        }
      }, () => {
        this.licenseUsageLoading = false;
        this.inUseLabelIds.clear();
        this.labelUsageReady$.next(false);
      });
  }

  /**
   * Recursively fetch all pages from the license search endpoint.
   * @param currentPage Zero-based page index.
   * @param accumulatedLicenses Already collected licenses.
   */
  private fetchAllLicensePages(
    currentPage: number,
    accumulatedLicenses: ClarinLicense[]
  ): Observable<{ response: RemoteData<PaginatedList<ClarinLicense>>, licenses: ClarinLicense[] }> {
    return this.clarinLicenseService.searchBy('byNameLike', {
      currentPage,
      elementsPerPage: this.allLicensesPageSize,
      sort: { field: defaultSortConfiguration.field, direction: defaultSortConfiguration.direction },
      searchParams: [new RequestParam('name', '')]
    }, false).pipe(
      getFirstCompletedRemoteData(),
      switchMap((response: RemoteData<PaginatedList<ClarinLicense>>) => {
        const pageLicenses = response?.payload?.page ?? [];
        const nextAccumulated = [...accumulatedLicenses, ...pageLicenses];

        if (!response?.hasSucceeded) {
          return of({ response, licenses: nextAccumulated });
        }

        const totalPages = response?.payload?.totalPages ?? 1;
        const payloadCurrentPage = response?.payload?.currentPage;
        const resolvedCurrentPage = isNull(payloadCurrentPage) ? currentPage : payloadCurrentPage;
        const nextPage = resolvedCurrentPage + 1;
        const hasNextPage = nextPage < totalPages;

        if (!hasNextPage) {
          return of({ response, licenses: nextAccumulated });
        }

        return this.fetchAllLicensePages(nextPage, nextAccumulated);
      })
    );
  }

  /**
   * Build fast lookup of label ids referenced by any loaded license.
   * @param licenses Aggregated list of all licenses.
   */
  private rebuildLabelUsageSet(licenses: ClarinLicense[]) {
    const usageSet = new Set<string>();

    (licenses || []).forEach((license: ClarinLicense) => {
      const mainLabelId = license?.clarinLicenseLabel?.id;
      if (!isNull(mainLabelId)) {
        usageSet.add(String(mainLabelId));
      }

      (license?.extendedClarinLicenseLabels || []).forEach((extendedLabel: ClarinLicenseLabel) => {
        if (!isNull(extendedLabel?.id)) {
          usageSet.add(String(extendedLabel.id));
        }
      });
    });

    this.inUseLabelIds = usageSet;
  }

  /**
   * Mark the license as selected or unselect if it is already clicked.
   * @param clarinLicense
   */
  switchSelectedLicense(clarinLicense: ClarinLicense) {
    if (isNull(clarinLicense)) {
      return;
    }

    if (this.selectedLicense?.id === clarinLicense?.id) {
      this.selectedLicense = null;
    } else {
      this.selectedLicense = clarinLicense;
    }
  }

  /**
   * Initialize the pagination options. Set the default values.
   */
  private initializePaginationOptions() {
    this.options = defaultPagination;
  }

  /**
   * Get the current pagination options.
   */
  private getCurrentPagination() {
    return this.paginationService.getCurrentPagination(this.options.id, this.options);
  }

  /**
   * Get the current sorting options.
   */
  private getCurrentSort() {
    return this.paginationService.getCurrentSort(this.options.id, defaultSortConfiguration);
  }

  /**
   * Initialize labels data stream so pagination query-param changes trigger fetches reactively.
   */
  private initializeLabelsPaginationStream() {
    const labelsLoadErrorKey = 'clarin.license.label.load.error';
    const currentLabelPagination$ = this.paginationService
      .getCurrentPagination(this.labelPaginationOptions.id, this.labelPaginationOptions);

    observableCombineLatest([currentLabelPagination$, this.labelsRefresh$])
      .pipe(
        switchMap(([currentPagination]) => {
          this.labelsRD$.next(null);
          this.loading$.next(true);
          return this.clarinLicenseLabelService.findAll({
            currentPage: currentPagination.currentPage,
            elementsPerPage: currentPagination.pageSize
          }, false).pipe(
            getFirstCompletedRemoteData()
          );
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((labelsResponse: RemoteData<PaginatedList<ClarinLicenseLabel>>) => {
          this.labelsRD$.next(labelsResponse);
          if (!labelsResponse?.hasSucceeded) {
            this.notificationService.error('', this.translateService.get(labelsLoadErrorKey));
          }
          this.loading$.next(false);
        }, () => {
          this.labelsRD$.next(null);
          this.notificationService.error('', this.translateService.get(labelsLoadErrorKey));
          this.loading$.next(false);
        }
      );
  }
}
