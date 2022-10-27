import { Component, OnInit } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';
import {Item} from '../../../core/shared/item.model';
import {filter, first, map, switchMap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {ItemDataService} from '../../../core/data/item-data.service';
import {Operation} from 'fast-json-patch';
import {PatchRequest} from '../../../core/data/request.models';
import {RequestService} from '../../../core/data/request.service';
import {ClarinLicense} from '../../../core/shared/clarin/clarin-license.model';
import {PaginatedList} from '../../../core/data/paginated-list.model';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {getFirstCompletedRemoteData} from '../../../core/shared/operators';
import {NotificationsService} from '../../../shared/notifications/notifications.service';
import {hasCompleted, hasSucceeded, isError, isSuccess, RequestEntry} from '../../../core/data/request.reducer';
import {TranslateService} from '@ngx-translate/core';
import {isUndefined} from '../../../shared/empty.util';

@Component({
  selector: 'ds-item-manage-clarin-license',
  templateUrl: './item-manage-clarin-license.component.html',
  styleUrls: ['./item-manage-clarin-license.component.scss']
})
export class ItemManageClarinLicenseComponent implements OnInit {

  itemSelfLink: string;

  selectedLicense: BehaviorSubject<ClarinLicense> = new BehaviorSubject<ClarinLicense>(null);

  licenseOptions: ClarinLicense[] = [];

  selectedLicenseName: string;

  constructor(private route: ActivatedRoute,
              private itemService: ItemDataService,
              private requestService: RequestService,
              private clarinLicenseService: ClarinLicenseDataService,
              private notificationsService: NotificationsService,
              private translateService: TranslateService) { }

  ngOnInit(): void {
    this.loadItemHref()
      .then(href => {
        this.itemSelfLink = href;
        this.initSelectedLicense();
      });
    this.loadLicenseOptions();
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
      }
    });
  }

  onChangeLicense() {
    this.updateLicense(this.selectedLicenseName);
  }

  loadLicenseOptions() {
    // Call clarinLicense API - GET
    this.clarinLicenseService.findAll()
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((clList: RemoteData<PaginatedList<ClarinLicense>>) => clList?.payload?.page))
      .subscribe((clarinLicense: ClarinLicense) => {
        this.licenseOptions.push(clarinLicense);
      });
  }

  updateLicense(updatedLicenseName) {
    this.sendReplaceRequest('attach', updatedLicenseName);
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
