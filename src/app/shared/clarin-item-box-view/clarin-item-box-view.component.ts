// eslint-disable-next-line max-classes-per-file
import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { RequestParam } from '../../core/cache/models/request-param.model';
import { BundleDataService } from '../../core/data/bundle-data.service';
import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { CollectionDataService } from '../../core/data/collection-data.service';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { FindListOptions } from '../../core/data/find-list-options.model';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { Bitstream } from '../../core/shared/bitstream.model';
import { Bundle } from '../../core/shared/bundle.model';
import { ClarinLicense } from '../../core/shared/clarin/clarin-license.model';
import { AUTHOR_METADATA_FIELDS } from '../../core/shared/clarin/constants';
import { Collection } from '../../core/shared/collection.model';
import { Community } from '../../core/shared/community.model';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { Item } from '../../core/shared/item.model';
import {
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload,
  getFirstSucceededRemoteListPayload,
} from '../../core/shared/operators';
import { LicenseType } from '../../item-page/clarin-license-info/clarin-license-info.component';
import { getItemPageRoute } from '../../item-page/item-page-routing-paths';
import { ClarinDateService } from '../clarin-date.service';
import { ClarinItemAuthorPreviewComponent } from '../clarin-item-author-preview/clarin-item-author-preview.component';
import {
  getBaseUrl,
  secureImageData,
} from '../clarin-shared-util';
import {
  isEmpty,
  isNull,
} from '../empty.util';
import { ItemSearchResult } from '../object-collection/shared/item-search-result.model';
import { ListableObject } from '../object-collection/shared/listable-object.model';
import { FileSizePipe } from '../utils/file-size-pipe';
import { followLink } from '../utils/follow-link-config.model';
import { VarDirective } from '../utils/var.directive';

/**
 * Show item on the Home/Search page in the customized box with Item's information.
 */
@Component({
  imports: [
    AsyncPipe,
    ClarinItemAuthorPreviewComponent,
    FileSizePipe,
    RouterLink,
    TranslateModule,
    VarDirective,
  ],
  selector: 'ds-clarin-item-box-view',
  templateUrl: './clarin-item-box-view.component.html',
  styleUrls: ['./clarin-item-box-view.component.scss'],
})
export class ClarinItemBoxViewComponent implements OnInit {
  protected readonly AUTHOR_METADATA_FIELDS = AUTHOR_METADATA_FIELDS;

  ITEM_TYPE_IMAGES_PATH = './assets/images/item-types/';
  ITEM_TYPE_DEFAULT_IMAGE_NAME = 'application-x-zerosize.png';

  /**
   * Show information of this item.
   */
  @Input() object: Item|ListableObject = null;

  /**
   * This component is composed differently if it is used in the search result.
   */
  @Input() isSearchResult = false;

  item: Item = null;

  /**
   * UI URL loaded from the server.
   */
  baseUrl = '';
  /**
   * Item's description text.
   */
  itemDescription = '';
  /**
   * Items's handle redirection URI.
   */
  itemUri = '';
  /**
   * The subject of the Item e.g., `Article,..`
   */
  itemType = '';
  /**
   * The name of the Item.
   */
  itemName = '';
  /**
   * The Item's owning community.
   */
  itemCommunity: BehaviorSubject<Community> = new BehaviorSubject<Community>(null);
  /**
   * URL for the searching Item's owning community.
   */
  communitySearchRedirect: BehaviorSubject<string> = new BehaviorSubject<string>('');
  /**
   * How kb/mb/gb has Item's files.
   */
  itemFilesSizeBytes: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  /**
   * How many files the Item has.
   */
  itemCountOfFiles: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  /**
   * The publisher of current Item
   */
  itemPublisher: string;
  /**
   * Redirect the user after clicking on the Publisher link.
   */
  publisherRedirectLink: string;
  /**
   * Composed date of the Item.
   */
  itemDate: string;
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
  licenseLabelIcons: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  constructor(protected collectionService: CollectionDataService,
              protected bundleService: BundleDataService,
              protected dsoNameService: DSONameService,
              protected configurationService: ConfigurationDataService,
              private clarinLicenseService: ClarinLicenseDataService,
              private sanitizer: DomSanitizer,
              private clarinDateService: ClarinDateService) { }

  async ngOnInit(): Promise<void> {
    if (this.object instanceof Item) {
      this.item = this.object;
    } else if (this.object instanceof ItemSearchResult) {
      this.item = this.object.indexableObject;
    } else {
      return;
    }

    // Load Items metadata
    this.itemType = this.item?.firstMetadataValue('dc.type');
    this.itemName = this.item?.firstMetadataValue('dc.title');
    this.itemUri = getItemPageRoute(this.item);
    this.itemDescription = this.item?.firstMetadataValue('dc.description');
    this.itemPublisher = this.item?.firstMetadataValue('dc.publisher');
    this.itemDate = this.clarinDateService.composeItemDate(this.item);

    await this.assignBaseUrl();
    this.publisherRedirectLink = this.getSearchEndpoint() + '?f.publisher=' + encodeURIComponent(this.itemPublisher)
      + ',equals';
    this.getItemCommunity();
    this.loadItemLicense();
    this.getItemFilesSize();
  }

  private getSearchEndpoint(): string {
    // Return the search endpoint URL for with the base URL. Remove trailing slashes to ensure a clean URL.
    return this.baseUrl.replace(/\/+$/, '') +  '/search';
  }

  private getItemFilesSize() {
    if (isNull(this.item)) {
      return;
    }
    const configAllElements: FindListOptions = Object.assign(new FindListOptions(), {
      elementsPerPage: 9999,
    });

    this.bundleService.findByItemAndName(this.item, 'ORIGINAL', true, true,
      configAllElements, followLink('bitstreams', { findListOptions: configAllElements }))
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
    if (isNull(this.item)) {
      return;
    }
    this.collectionService.findByHref(this.item?._links?.owningCollection?.href, true, true, followLink('parentCommunity'))
      .pipe(getFirstSucceededRemoteDataPayload())
      .subscribe((collection: Collection) => {
        collection?.parentCommunity
          .pipe(getFirstSucceededRemoteDataPayload())
          .subscribe((community: Community) => {
            this.itemCommunity.next(community);
            const encodedRedirectLink = this.getSearchEndpoint() + '?f.items_owning_community=' + encodeURIComponent(this.dsoNameService.getName(community)) + ',equals';
            this.communitySearchRedirect.next(encodedRedirectLink);
          });
      });
  }
  async assignBaseUrl() {
    this.baseUrl = await getBaseUrl(this.configurationService)
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }

  private loadItemLicense() {
    // load license info from item attributes
    this.licenseLabel = this.item?.metadata?.['dc.rights.label']?.[0]?.value;
    this.license = this.item?.metadata?.['dc.rights']?.[0]?.value;
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
      default:
        this.licenseType = this.licenseLabel;
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

  hasItemType() {
    return !isEmpty(this.itemType);
  }

  hasMoreFiles() {
    return this.itemCountOfFiles.value > 1;
  }

  handleImageError(event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src =
      this.ITEM_TYPE_IMAGES_PATH + this.ITEM_TYPE_DEFAULT_IMAGE_NAME;
  }

  // formating the alt text according to itemType
  formateIconsAltText(itemType: string) {
    if (!itemType) {
      return 'icon';
    }
    return (
      itemType
        .replace(/([A-Z])/g, ' $1')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase()) + ' icon'
    );
  }
}

/**
 * Redirect the user after clicking on the `Author`.
 */
// tslint:disable-next-line:max-classes-per-file
export class AuthorNameLink {
  name: string;
  url: string;
}
