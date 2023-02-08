import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';
import {MetadataMap, MetadataValue} from '../../core/shared/metadata.models';
import {ItemDataService} from '../../core/data/item-data.service';
import {CommunityDataService} from '../../core/data/community-data.service';
import {CollectionDataService} from '../../core/data/collection-data.service';
import {
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteData,
  getFirstSucceededRemoteDataPayload, getFirstSucceededRemoteListPayload, getPaginatedListPayload
} from '../../core/shared/operators';
import {Collection} from '../../core/shared/collection.model';
import {isNull, isUndefined} from '../../shared/empty.util';
import {followLink} from '../../shared/utils/follow-link-config.model';
import {Community} from '../../core/shared/community.model';
import {BehaviorSubject} from 'rxjs';
import {DSONameService} from '../../core/breadcrumbs/dso-name.service';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {ConfigurationProperty} from '../../core/shared/configuration-property.model';
import {switchMap} from 'rxjs/operators';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {LicenseType} from '../clarin-license-info/clarin-license-info.component';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import { secureImageData } from '../../shared/clarin-shared-util';
import {DomSanitizer} from '@angular/platform-browser';
import {BundleDataService} from '../../core/data/bundle-data.service';
import {Bundle} from '../../core/shared/bundle.model';
import {Bitstream} from '../../core/shared/bitstream.model';

@Component({
  selector: 'ds-clarin-item-box-view',
  templateUrl: './clarin-item-box-view.component.html',
  styleUrls: ['./clarin-item-box-view.component.scss']
})
export class ClarinItemBoxViewComponent implements OnInit {

  @Input() item$: Item = null;

  baseUrl = '';

  itemDescription = '';
  itemUri = '';
  itemType ='';
  itemName = '';
  itemCommunity: BehaviorSubject<Community> = new BehaviorSubject<Community>(null);
  communitySearchRedirect: BehaviorSubject<string> = new BehaviorSubject<string>('');
  itemFilesSizeBytes: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  itemCountOfFiles: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  itemAuthors: BehaviorSubject<AuthorNameLink[]> = new BehaviorSubject<AuthorNameLink[]>([]);

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
   * Current License Label icon as byte array.
   */
  licenseLabelIcons: any[] = [];

  constructor(protected collectionService: CollectionDataService,
              protected bundleService: BundleDataService,
              protected dsoNameService: DSONameService,
              protected configurationService: ConfigurationDataService,
              private clarinLicenseService: ClarinLicenseDataService,
              private sanitizer: DomSanitizer) { }

  async ngOnInit(): Promise<void> {
    console.log('initializing item', this.item$);
    this.itemType = this.item$?.metadata?.['dc.type']?.[0]?.value;
    this.itemName = this.item$?.metadata?.['dc.title']?.[0]?.value;
    this.itemUri = this.item$?.metadata?.['dc.identifier.uri']?.[0]?.value;
    this.itemDescription = this.item$?.metadata?.['dc.description']?.[0]?.value;

    await this.assignBaseUrl();
    this.getItemCommunity();
    this.loadItemLicense();
    this.getItemFilesSize();
    this.loadItemAuthors();
  }

  private loadItemAuthors() {
    if (isNull(this.item$)) {
      return;
    }

    const authorsMV: MetadataValue[] = this.item$?.metadata?.['dc.contributor.author'];
    if (isUndefined(authorsMV)) {
      return null;
    }
    const itemAuthorsLocal = [];
    authorsMV.forEach((authorMV: MetadataValue) => {
      const authorSearchLink = this.baseUrl + '/search/objects?f.author=' + authorMV.value + ',equals';
      const authorNameLink = Object.assign(new AuthorNameLink(), {
        name: authorMV.value,
        url: authorSearchLink
      });
      itemAuthorsLocal.push(authorNameLink);
    });
    this.itemAuthors.next(itemAuthorsLocal);
    console.log('itemAuthorsLocal', itemAuthorsLocal);
  }

  private getItemFilesSize() {
    if (isNull(this.item$)) {
      return;
    }
    this.bundleService.findByItemAndName(this.item$, 'ORIGINAL', true, true, followLink('bitstreams'))
      .pipe(getFirstSucceededRemoteDataPayload())
      .subscribe((bundle: Bundle) => {
        bundle.bitstreams
          .pipe(getFirstSucceededRemoteListPayload())
          .subscribe((bitstreams: Bitstream[]) => {
            let sizeOfAllBitstreams = -1;
            bitstreams.forEach(bitstream => {
              sizeOfAllBitstreams += bitstream.sizeBytes;
            });
            this.itemFilesSizeBytes.next(sizeOfAllBitstreams);
            this.itemCountOfFiles.next(bitstreams.length);
          });
      });
  }

  private getItemCommunity() {
    if (isNull(this.item$)) {
      return;
    }
    this.collectionService.findByHref(this.item$?._links?.owningCollection?.href, true, true, followLink('parentCommunity'))
      .pipe(getFirstSucceededRemoteDataPayload())
      .subscribe((collection: Collection) => {
        collection.parentCommunity
          .pipe(getFirstSucceededRemoteDataPayload())
          .subscribe((community: Community) => {
            this.itemCommunity.next(community);
            this.communitySearchRedirect.next(this.baseUrl + '/search/objects?f.community=' +
              this.dsoNameService.getName(community) + ',equals');
          });
      });
  }

  async getBaseUrl(): Promise<any> {
    return this.configurationService.findByPropertyName('dspace.ui.url')
      .pipe(getFirstSucceededRemoteDataPayload())
      .toPromise();
  }

  async assignBaseUrl() {
    this.baseUrl = await this.getBaseUrl()
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }

  private loadItemLicense() {
    // load license info from item attributes
    this.licenseLabel = this.item$?.metadata?.['dc.rights.label']?.[0]?.value;
    this.license = this.item$?.metadata?.['dc.rights']?.[0]?.value;
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

// tslint:disable-next-line:max-classes-per-file
class AuthorNameLink {
  name: string;
  url: string;
}
