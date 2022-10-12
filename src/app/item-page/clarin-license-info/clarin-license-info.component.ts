import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';
import {ClarinLicenseLabelDataService} from '../../core/data/clarin/clarin-license-label-data.service';
import {getFirstCompletedRemoteData} from '../../core/shared/operators';
import {switchMap} from 'rxjs/operators';
import {RemoteData} from '../../core/data/remote-data';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {ItemDataService} from '../../core/data/item-data.service';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {DomSanitizer} from '@angular/platform-browser';
import {secureImageData} from '../../shared/clarin-shared-util';

@Component({
  selector: 'ds-clarin-license-info',
  templateUrl: './clarin-license-info.component.html',
  styleUrls: ['./clarin-license-info.component.scss']
})
export class ClarinLicenseInfoComponent implements OnInit {

  constructor(private clarinLicenseLabelService: ClarinLicenseLabelDataService,
              private itemService: ItemDataService,
              private sanitizer: DomSanitizer,
              private clarinLicenseService: ClarinLicenseDataService) { }

  /**
   * The item to display a version history for
   */
  @Input() item: Item;

  licenseLabel: string;

  license: string;

  licenseType: string;

  licenseURI: string;

  licenseLabelIcons: any[] = [];

  ngOnInit(): void {
    // load license info from item attributes
    this.licenseLabel = this.item.metadata?.['dc.rights.label']?.[0]?.value;
    this.license = this.item.metadata?.['dc.rights']?.[0]?.value;
    this.licenseURI = this.item.metadata?.['dc.rights.uri']?.[0]?.value;
    switch (this.licenseLabel) {
      case LicenseType.public:
        this.licenseType = 'Publicly Available';
        break;
      case LicenseType.restricted:
        this.licenseType = 'Restricted Use';
        break;
      case LicenseType.academic:
        this.licenseType = 'Academic Use';
        break;
    }

    // load license label icons
    const options = {
      searchParams: [
        {
          fieldName: 'name',
          fieldValue: this.license
        }
      ]
    };
    this.clarinLicenseService.searchBy('byName', options, false)
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((clList: RemoteData<PaginatedList<ClarinLicense>>) => clList?.payload?.page))
      .subscribe(clarinLicense => {
          clarinLicense.extendedClarinLicenseLabels.forEach(extendedCll => {
            this.licenseLabelIcons.push(extendedCll?.icon);
          });
          this.licenseLabelIcons.push(clarinLicense?.clarinLicenseLabel?.icon);
        });
  }

  secureImageData(imageByteArray) {
    return secureImageData(this.sanitizer, imageByteArray);
  }
}

export enum LicenseType {
  public = 'PUB',
  restricted = 'RES',
  academic = 'ACA'
}
