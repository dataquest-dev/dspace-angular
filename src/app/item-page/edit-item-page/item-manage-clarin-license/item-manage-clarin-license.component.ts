import { Component, OnInit } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';
import {Item} from '../../../core/shared/item.model';
import {filter, first, map, switchMap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {ItemDataService} from '../../../core/data/item-data.service';
import {Operation} from 'fast-json-patch';
import {FindListOptions, PatchRequest} from '../../../core/data/request.models';
import {RequestService} from '../../../core/data/request.service';
import {ClarinLicense} from '../../../core/shared/clarin/clarin-license.model';
import {PaginatedList} from '../../../core/data/paginated-list.model';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {getFirstCompletedRemoteData} from '../../../core/shared/operators';
import {NotificationsService} from '../../../shared/notifications/notifications.service';
import {hasCompleted, hasSucceeded, isError, isSuccess, RequestEntry} from '../../../core/data/request.reducer';
import {TranslateService} from '@ngx-translate/core';
import {isNull, isUndefined} from '../../../shared/empty.util';
import {DefineLicenseFormComponent} from '../../../clarin-licenses/clarin-license-table/modal/define-license-form/define-license-form.component';
import {ClarinLicenseConfirmationSerializer} from '../../../core/shared/clarin/clarin-license-confirmation-serializer';
import {ClarinLicenseRequiredInfoSerializer} from '../../../core/shared/clarin/clarin-license-required-info-serializer';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ds-item-manage-clarin-license',
  templateUrl: './item-manage-clarin-license.component.html',
  styleUrls: ['./item-manage-clarin-license.component.scss']
})
export class ItemManageClarinLicenseComponent implements OnInit {

  itemSelfLink: string;

  selectedLicense: BehaviorSubject<ClarinLicense> = new BehaviorSubject<ClarinLicense>(null);

  licenseOptions: BehaviorSubject<ClarinLicense[]> = new BehaviorSubject<ClarinLicense[]>([]);

  selectedLicenseName: string;

  constructor(private route: ActivatedRoute,
              private itemService: ItemDataService,
              private requestService: RequestService,
              private clarinLicenseService: ClarinLicenseDataService,
              private notificationsService: NotificationsService,
              private translateService: TranslateService,
              private modalService: NgbModal) { }

  ngOnInit(): void {
    this.loadItemHref()
      .then(href => {
        this.itemSelfLink = href;
        this.initSelectedLicense();
      });
    this.loadLicenseOptions();
  }

  /**
   * Pop up the License modal where the user fill in the License data.
   */
  openDefineLicenseForm() {
    const defineLicenseModalRef = this.modalService.open(DefineLicenseFormComponent);

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
      // this.notifyOperationStatus(clarinLicense, successfulMessageContentDef, errorMessageContentDef);
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
        this.loadLicenseOptions();
        console.log('response', defineLicenseResponse);
        // check payload and show error or successful
        // this.notifyOperationStatus(defineLicenseResponse, successfulMessageContentDef, errorMessageContentDef);
        // this.loadAllLicenses();
      });
  }

  loadItemHref(): Promise<string> {
    const itemRD$ = this.route.parent.data.pipe(map((data) => data.dso));
    return itemRD$.pipe(
      first(),
      switchMap((data: RemoteData<Item>) => [data?.payload?._links?.self?.href])).toPromise();
  }

  initSelectedLicense() {
    const itemRD$ = this.itemService.findByHref(this.itemSelfLink);
    itemRD$.pipe(
      first(),
      map((data: RemoteData<Item>) => data.payload)
    ).subscribe((item: Item) => {
      const licenseName = item?.metadata?.['dc.rights']?.[0]?.value;
      const licenseURI = item?.metadata?.['dc.rights.uri']?.[0]?.value;
      this.selectedLicense.next(
        Object.assign(new ClarinLicense(), {
          name: licenseName,
          definition: licenseURI
        })
      );

      if (isUndefined(licenseName) || isUndefined(licenseURI)) {
        this.selectedLicenseName = '';
      } else {
        this.selectedLicenseName = licenseName;
      }
    });
  }

  loadLicenseOptions() {
    const options = new FindListOptions();
    options.elementsPerPage = 999;
    // Call clarinLicense API - GET
    this.clarinLicenseService.findAll(options, false)
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((clList: RemoteData<PaginatedList<ClarinLicense>>) => [clList?.payload?.page]))
      .subscribe((clarinLicenses: ClarinLicense[]) => {
        this.licenseOptions.next(clarinLicenses);
      });
  }

  updateLicense() {
    this.sendReplaceRequest('attach', this.selectedLicenseName);
  }

  removeChanges() {
    this.selectedLicenseName = this.selectedLicense?.value?.name;
  }

  removeLicense() {
    this.sendReplaceRequest('detach', this.selectedLicense.value.name);
  }

  sendReplaceRequest(operation, licenseName) {
    // create request with the updated Handle
    const patchOperation = {
      op: 'replace', path: '/license/' + operation, value: licenseName
    } as Operation;

    const requestId = this.requestService.generateRequestId();
    const patchRequest = new PatchRequest(requestId, this.itemSelfLink, [patchOperation]);

    // call patch request
    this.requestService.send(patchRequest);

    // check the response
    this.requestService.getByUUID(requestId)
      .pipe(
        filter((res: RequestEntry) => hasCompleted(res.state))
      )
      .subscribe(requestEntry => {
        if (hasSucceeded(requestEntry.state)) {
          this.notificationsService.success(null, this.translateService.get('handle-table.change-handle-prefix.notify.successful'));
          this.initSelectedLicense();
        } else {
          this.notificationsService.error(null, this.translateService.get('handle-table.change-handle-prefix.notify.successful'));
        }
      });
  }
}
