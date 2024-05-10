import {Component, OnInit} from '@angular/core';
import {map, switchMap, take} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';
import {Item} from '../../../core/shared/item.model';
import {ActivatedRoute} from '@angular/router';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {getFirstCompletedRemoteData, getFirstSucceededRemoteListPayload} from '../../../core/shared/operators';
import {PaginatedList} from '../../../core/data/paginated-list.model';
import {ClarinLicense} from '../../../core/shared/clarin/clarin-license.model';
import {FindListOptions} from '../../../core/data/find-list-options.model';

@Component({
  selector: 'ds-item-license-mapper',
  templateUrl: './item-license-mapper.component.html',
  styleUrls: ['./item-license-mapper.component.scss']
})
export class ItemLicenseMapperComponent implements OnInit {

  currentLicense: BehaviorSubject<ClarinLicense> = new BehaviorSubject(null);
  allLicenses: BehaviorSubject<ClarinLicense[]> = new BehaviorSubject<ClarinLicense[]>([]);
  selectedLicense: ClarinLicense;

  constructor(private route: ActivatedRoute,
              private clarinLicenseService: ClarinLicenseDataService) {
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

}
