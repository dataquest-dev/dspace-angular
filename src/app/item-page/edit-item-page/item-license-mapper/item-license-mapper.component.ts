import {Component, OnInit} from '@angular/core';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';
import {Item} from '../../../core/shared/item.model';
import {ActivatedRoute, Router} from '@angular/router';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {getFirstCompletedRemoteData, getFirstSucceededRemoteListPayload} from '../../../core/shared/operators';
import {PaginatedList} from '../../../core/data/paginated-list.model';
import {ClarinLicense} from '../../../core/shared/clarin/clarin-license.model';
import {FindListOptions} from '../../../core/data/find-list-options.model';
import {followLink} from '../../../shared/utils/follow-link-config.model';
import {ItemDataService} from '../../../core/data/item-data.service';
import {MetadataValue} from '../../../core/shared/metadata.models';
import {PatchRequest, PutRequest} from '../../../core/data/request.models';
import {HALEndpointService} from '../../../core/shared/hal-endpoint.service';
import {RequestService} from '../../../core/data/request.service';
import {hasFailed} from '../../../core/data/request-entry-state.model';
import {isEmpty} from '../../../shared/empty.util';
import {RemoteDataBuildService} from '../../../core/cache/builders/remote-data-build.service';
import {RouteService} from '../../../core/services/route.service';
import {getItemPageRoute} from '../../item-page-routing-paths';

@Component({
  selector: 'ds-item-license-mapper',
  templateUrl: './item-license-mapper.component.html',
  styleUrls: ['./item-license-mapper.component.scss']
})
export class ItemLicenseMapperComponent implements OnInit {

  currentLicense: BehaviorSubject<ClarinLicense> = new BehaviorSubject(null);
  allLicenses: BehaviorSubject<ClarinLicense[]> = new BehaviorSubject<ClarinLicense[]>([]);
  selectedLicenseId: number = null;

  constructor(private route: ActivatedRoute,
              private routeService: RouteService,
              private router: Router,
              private clarinLicenseService: ClarinLicenseDataService,
              private itemService: ItemDataService,
              private halService: HALEndpointService,
              private requestService: RequestService,
              private rdbService: RemoteDataBuildService) {
  }

  /**
   * The item to attach/detach a license to
   */
  itemRD$: Observable<RemoteData<Item>>;
    ngOnInit(): void {
      this.itemRD$ = this.route.parent.data.pipe(
        take(1),
        map((data) => data.dso),
      );

      this.loadCurrentLicense();
      this.loadAllLicenses();
    }

  /**
   * Load all licenses from the server and set them to allLicenses.
   * @private
   */
  private loadAllLicenses() {
      const options = new FindListOptions();
      options.currentPage = 0;
      // Load all licenses
      options.elementsPerPage = 1000;

      this.clarinLicenseService.findAll(options, false)
        .pipe(
          getFirstSucceededRemoteListPayload(),
        ).subscribe((licenses) => {
        this.allLicenses.next(licenses);
      });
    }

    /**
     * Load current license from item metadata and set it to currentLicense.
     */
    private loadCurrentLicense() {
      let licenseName: string;

      // Fetch Item's license
      this.itemRD$.subscribe((itemRD) => {
        console.log('itemRD', itemRD);
        licenseName = itemRD.payload.firstMetadataValue('dc.rights');
      });

      // Create request options - add license name to search params
      const options = {
        searchParams: [
          {
            fieldName: 'name',
            fieldValue: licenseName
          }
        ]
      };

      // Fetch license by name and set it to currentLicense
      this.clarinLicenseService.searchBy('byName', options, false)
        .pipe(
          getFirstCompletedRemoteData(),
          switchMap((clList: RemoteData<PaginatedList<ClarinLicense>>) => clList?.payload?.page),
        ).subscribe((license) => {
        this.currentLicense.next(license);
      });
    }

  removeLicense() {
    this.currentLicense.next(null);
  }

  updateLicense() {
    // Update item metadata with new license
    this.itemRD$.pipe(
      take(1),
    ).subscribe((itemRD) => {
      let url = this.halService.getRootHref() + '/core/items/' + itemRD.payload.uuid + '/bundles?licenseID=' + this.selectedLicenseId;
      const requestId = this.requestService.generateRequestId();
      const putRequest = new PutRequest(requestId, url);
      // call patch request
      this.requestService.send(putRequest);

      const response = this.rdbService.buildFromRequestUUID(requestId);
      response
        .pipe(getFirstCompletedRemoteData())
        .subscribe((responseRD$: RemoteData<Item>) => {
          if (hasFailed(responseRD$.state)) {
            // this.error$.value.push('Cannot load the IP Address');
            return;
          }
          if (isEmpty(responseRD$?.payload)) {
            return;
          }
        });
    });
  }

  return() {
    // Redirect to previous page - Item Page
    this.routeService.getPreviousUrl().pipe(
      take(1))
      .subscribe((previousUrl: string) => {
        this.itemRD$.subscribe((itemRD) => {
          const itemUrl = getItemPageRoute(itemRD.payload);
          void this.router.navigateByUrl(itemUrl);
        });
      });
  }

}
