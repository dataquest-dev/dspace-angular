import { Component, OnInit } from '@angular/core';
import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';
import { BehaviorSubject, combineLatest as observableCombineLatest, fromEvent } from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {getFirstCompletedRemoteData, getFirstSucceededRemoteData} from '../../core/shared/operators';
import {switchMap} from 'rxjs/operators';
import {PaginationService} from '../../core/pagination/pagination.service';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {SortDirection, SortOptions} from '../../core/cache/models/sort-options.model';
import {defaultPagination, defaultSortConfiguration} from '../clarin-license-table-pagination';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormModalComponent} from './form-modal.component';
import {DefineLicenseFormComponent} from './modal/define-license-form/define-license-form.component';
import {DefineLicenseLabelFormComponent} from './modal/define-license-label-form/define-license-label-form.component';
import {EditLicenseFormComponent} from './modal/edit-license-form/edit-license-form.component';
import {EditLicenseLabelFormComponent} from './modal/edit-license-label-form/edit-license-label-form.component';
import {ClarinLicenseConfirmationSerializer} from '../../core/shared/clarin/clarin-license-confirmation-serializer';
import {getBitstreamFormatsModuleRoute} from '../../admin/admin-registries/admin-registries-routing-paths';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {TranslateService} from '@ngx-translate/core';
import {BitstreamFormat} from '../../core/shared/bitstream-format.model';

@Component({
  selector: 'ds-clarin-license-table',
  templateUrl: './clarin-license-table.component.html',
  styleUrls: ['./clarin-license-table.component.scss']
})
export class ClarinLicenseTableComponent implements OnInit {

  // tslint:disable-next-line:no-empty
  constructor(private paginationService: PaginationService,
              private clarinLicenseService: ClarinLicenseDataService,
              private modalService: NgbModal,
              public activeModal: NgbActiveModal,
              private notificationService: NotificationsService,
              private translateService: TranslateService,) { }

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
    this.loadAllLicenses();
  }

  private initializePaginationOptions() {
    this.options = defaultPagination;
  }

  private initializeSortingOptions() {
    this.sortConfiguration = defaultSortConfiguration;
  }

  openDefineLicenseForm() {
    const defineLicenseModalRef = this.modalService.open(DefineLicenseFormComponent);

    defineLicenseModalRef.result.then((result: ClarinLicense) => {
      this.defineNewLicense(result);
      // console.log('result',result);
    }).catch((error) => {
      console.log(error);
    });
  }

  openDefineLicenseLabelForm() {
    const defineLicenseLabelModalRef = this.modalService.open(DefineLicenseLabelFormComponent);

    defineLicenseLabelModalRef.result.then((result) => {
      console.log('result',result);
    }).catch((error) => {
      console.log(error);
    });
  }

  openEditLicenseForm() {
    const editLicenseModalRef = this.modalService.open(EditLicenseFormComponent);

    editLicenseModalRef.result.then((result) => {
      console.log('result',result);
    }).catch((error) => {
      console.log(error);
    });
  }

  openEditLicenseLabelForm() {
    const editLicenseModalRef = this.modalService.open(EditLicenseLabelFormComponent);

    editLicenseModalRef.result.then((result: ClarinLicense) => {
      console.log('result',result);
    }).catch((error) => {
      console.log(error);
    });
  }

  defineNewLicense(clarinLicense: ClarinLicense) {
    clarinLicense.confirmation = ClarinLicenseConfirmationSerializer.Serialize(clarinLicense.confirmation);
    this.clarinLicenseService.create(clarinLicense)
      .pipe(getFirstCompletedRemoteData())
      .subscribe((response: RemoteData<ClarinLicense>) => {
        // check payload and show error or successful
        const successfulMessageContentDef = 'clarin-license.define-license.notification.successful-content';
        const errorMessageContentDef = 'clarin-license.define-license.notification.error-content';
        this.notifyOperationStatus(response, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses();
      });
  }

  deleteLicense() {
    console.log('delete license');
  }

  notifyOperationStatus(response, sucContent, errContent) {
    if (response.hasSucceeded) {
      this.notificationService.success('',
        this.translateService.get(sucContent));
    } else if (response.isError) {
      this.notificationService.error('',
        this.translateService.get(errContent));
    }
  }

  // openFormModal() {
  //   const modalRef = this.modalService.open(FormModalComponent);
  //
  //   modalRef.result.then((result) => {
  //     console.log('result',result);
  //   }).catch((error) => {
  //     console.log(error);
  //   });
  // }

  /**
   * Updates the page
   */
  onPageChange() {
    this.loadAllLicenses();
  }

  closeModal() {
    this.activeModal.close('Modal Closed');
  }

  loadAllLicenses() {
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
