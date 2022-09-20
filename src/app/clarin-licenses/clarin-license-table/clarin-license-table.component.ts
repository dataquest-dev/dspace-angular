import {Component, OnInit} from '@angular/core';
import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';
import {BehaviorSubject, combineLatest as observableCombineLatest} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {getFirstCompletedRemoteData, getFirstSucceededRemoteData} from '../../core/shared/operators';
import {switchMap} from 'rxjs/operators';
import {PaginationService} from '../../core/pagination/pagination.service';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {SortOptions} from '../../core/cache/models/sort-options.model';
import {defaultPagination, defaultSortConfiguration} from '../clarin-license-table-pagination';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DefineLicenseFormComponent} from './modal/define-license-form/define-license-form.component';
import {DefineLicenseLabelFormComponent} from './modal/define-license-label-form/define-license-label-form.component';
import {EditLicenseLabelFormComponent} from './modal/edit-license-label-form/edit-license-label-form.component';
import {ClarinLicenseConfirmationSerializer} from '../../core/shared/clarin/clarin-license-confirmation-serializer';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {TranslateService} from '@ngx-translate/core';
import {isNull} from '../../shared/empty.util';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';
import {ClarinLicenseLabelDataService} from '../../core/data/clarin/clarin-license-label-data.service';
import {ClarinLicenseLabelExtendedSerializer} from '../../core/shared/clarin/clarin-license-label-extended-serializer';

@Component({
  selector: 'ds-clarin-license-table',
  templateUrl: './clarin-license-table.component.html',
  styleUrls: ['./clarin-license-table.component.scss']
})
export class ClarinLicenseTableComponent implements OnInit {

  // tslint:disable-next-line:no-empty
  constructor(private paginationService: PaginationService,
              private clarinLicenseService: ClarinLicenseDataService,
              private clarinLicenseLabelService: ClarinLicenseLabelDataService,
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

  selectedLicense: ClarinLicense;

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
    }).catch((error) => {
      console.log(error);
    });
  }

  openDefineLicenseLabelForm() {
    const defineLicenseLabelModalRef = this.modalService.open(DefineLicenseLabelFormComponent);

    defineLicenseLabelModalRef.result.then((result: ClarinLicenseLabel) => {
      this.defineLicenseLabel(result);
    }).catch((error) => {
      console.log(error);
    });
  }

  defineLicenseLabel(clarinLicenseLabel: ClarinLicenseLabel) {
    const successfulMessageContentDef = 'clarin-license-label.define-license-label.notification.successful-content';
    const errorMessageContentDef = 'clarin-license-label.define-license-label.notification.error-content';
    if (isNull(clarinLicenseLabel)) {
      this.notifyOperationStatus(clarinLicenseLabel, successfulMessageContentDef, errorMessageContentDef);
    }

    // convert file to the byte array
    const reader = new FileReader();
    const fileByteArray = [];

    reader.readAsArrayBuffer(clarinLicenseLabel.icon[0]);
    reader.onloadend = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        const arrayBuffer = evt.target.result;
        if (arrayBuffer instanceof ArrayBuffer) {
          const array = new Uint8Array(arrayBuffer);
          for (const item of array) {
            fileByteArray.push(item);
          }
        }
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
          });
      }
    };
  }

  openEditLicenseForm() {
    if (isNull(this.selectedLicense)) {
      return;
    }

    // pass the actual clarin license values to the define-clarin-license modal
    const editLicenseModalRef = this.modalService.open(DefineLicenseFormComponent);
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

  openEditLicenseLabelForm() {
    const editLicenseModalRef = this.modalService.open(EditLicenseLabelFormComponent);

    editLicenseModalRef.result.then((result: ClarinLicense) => {
      console.log('result',result);
    }).catch((error) => {
      console.log(error);
    });
  }

  editLicense(clarinLicense: ClarinLicense) {
    const successfulMessageContentDef = 'clarin-license.edit-license.notification.successful-content';
    const errorMessageContentDef = 'clarin-license.edit-license.notification.error-content';
    if (isNull(clarinLicense)) {
      this.notifyOperationStatus(clarinLicense, successfulMessageContentDef, errorMessageContentDef);
    }

    const clarinLicenseObj = new ClarinLicense();
    clarinLicenseObj.name = clarinLicense.name;
    clarinLicenseObj.clarinLicenseLabel = clarinLicense.clarinLicenseLabel;
    clarinLicenseObj.extendedClarinLicenseLabels = clarinLicense.extendedClarinLicenseLabels;
    clarinLicenseObj._links = this.selectedLicense._links;
    clarinLicenseObj.id = clarinLicense.id;
    clarinLicenseObj.confirmation = ClarinLicenseConfirmationSerializer.Serialize(clarinLicense.confirmation);
    clarinLicenseObj.definition = clarinLicense.definition;
    clarinLicenseObj.bitstreams = clarinLicense.bitstreams;
    clarinLicenseObj.type = clarinLicense.type;
    clarinLicenseObj.requiredInfo = clarinLicense.requiredInfo;

    this.clarinLicenseService.put(clarinLicenseObj)
      .pipe(getFirstCompletedRemoteData())
      .subscribe((editResponse: RemoteData<ClarinLicense>) => {
        // check payload and show error or successful
        this.notifyOperationStatus(editResponse, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses();
    });
  }

  defineNewLicense(clarinLicense: ClarinLicense) {
    const successfulMessageContentDef = 'clarin-license.define-license.notification.successful-content';
    const errorMessageContentDef = 'clarin-license.define-license.notification.error-content';
    if (isNull(clarinLicense)) {
      this.notifyOperationStatus(clarinLicense, successfulMessageContentDef, errorMessageContentDef);
    }

    // convert string value from the form to the number
    clarinLicense.confirmation = ClarinLicenseConfirmationSerializer.Serialize(clarinLicense.confirmation);
    this.clarinLicenseService.create(clarinLicense)
      .pipe(getFirstCompletedRemoteData())
      .subscribe((defineLicenseResponse: RemoteData<ClarinLicense>) => {
        // check payload and show error or successful
        this.notifyOperationStatus(defineLicenseResponse, successfulMessageContentDef, errorMessageContentDef);
        this.loadAllLicenses();
      });
  }

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
        this.loadAllLicenses();
      });
  }

  notifyOperationStatus(operationResponse, sucContent, errContent) {
    if (isNull(operationResponse)) {
      this.notificationService.error('',
        this.translateService.get(errContent));
    }

    if (operationResponse.hasSucceeded) {
      this.notificationService.success('',
        this.translateService.get(sucContent));
    } else if (operationResponse.isError) {
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
    this.selectedLicense = null;

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
   * @param clarinLicense
   */
  switchSelectedHandle(clarinLicense: ClarinLicense) {
    if (isNull(clarinLicense)) {
      return;
    }

    if (this.selectedLicense?.id === clarinLicense?.id) {
      this.selectedLicense = null;
    } else {
      this.selectedLicense = clarinLicense;
    }
  }

}
