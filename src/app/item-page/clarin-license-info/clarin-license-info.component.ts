import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { RequestParam } from '../../core/cache/models/request-param.model';
import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { LocaleService } from '../../core/locale/locale.service';
import { ClarinLicense } from '../../core/shared/clarin/clarin-license.model';
import { Item } from '../../core/shared/item.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { secureImageData } from '../../shared/clarin-shared-util';

/**
 * This component show clarin license info in the item page and item full page.
 */
@Component({
  imports: [
    AsyncPipe,
    NgbTooltipModule,
    NgClass,
    TranslateModule,
  ],
  selector: 'ds-clarin-license-info',
  templateUrl: './clarin-license-info.component.html',
  styleUrls: ['./clarin-license-info.component.scss'],
})
export class ClarinLicenseInfoComponent implements OnInit {

  currentLangCode: string;

  constructor(private sanitizer: DomSanitizer,
              private clarinLicenseService: ClarinLicenseDataService,
              private localeService: LocaleService) { }

  /**
   * The item to display a version history for
   */
  @Input() item: Item;

  /**
   * Current License Label e.g. `PUB`
   */
  licenseLabel: string;

  /**
   * Current License name e.g. `Awesome License`
   */
  license: string;

  /**
   * Current License type e.g. `Publicly Available`
   */
  licenseType: string;

  /**
   * Current License URI e.g. `http://www.awesomelicense.edu`
   */
  licenseURI: string;

  /**
   * Current License Label icon as byte array.
   */
  licenseLabelIcons: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  ngOnInit(): void {
    this.localeService.getCurrentLanguageCode().subscribe((code) => {
      this.currentLangCode = code;
    });
    // load license info from item attributes
    this.licenseLabel = this.item.metadata?.['dc.rights.label']?.[0]?.value;
    this.license = this.item.metadata?.['dc.rights']?.[0]?.value;
    this.licenseURI = this.item.metadata?.['dc.rights.uri']?.[0]?.value;
    switch (this.licenseLabel as LicenseType) {
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
        new RequestParam('name', this.license),
      ],
    };
    this.clarinLicenseService.searchBy('byName', options, false)
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((clList: RemoteData<PaginatedList<ClarinLicense>>) => clList?.payload?.page))
      .subscribe(clarinLicense => {
        const iconsList = [];
        clarinLicense.extendedClarinLicenseLabels.forEach(extendedCll => {
          iconsList.push(extendedCll);
        });
        this.licenseLabelIcons.next(iconsList);
      });
  }

  secureImageData(imageByteArray) {
    return secureImageData(this.sanitizer, imageByteArray);
  }

  /**
   * Check if current language is Czech
   */
  isCsLocale() {
    return this.currentLangCode === 'cs';
  }
}

export enum LicenseType {
  public = 'PUB',
  restricted = 'RES',
  academic = 'ACA'
}
