import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Item } from '../../../../core/shared/item.model';
import { BundleDataService } from '../../../../core/data/bundle-data.service';
import { BitstreamDataService } from '../../../../core/data/bitstream-data.service';
import { getAllSucceededRemoteDataPayload, getFirstSucceededRemoteDataPayload } from '../../../../core/shared/operators';
import { RemoteData } from '../../../../core/data/remote-data';
import { Bundle } from '../../../../core/shared/bundle.model';
import { PaginatedList } from '../../../../core/data/paginated-list.model';
import { Bitstream } from '../../../../core/shared/bitstream.model';
import { isNotEmpty } from '../../../../shared/empty.util';

/**
 * Constants for Creative Commons license handling
 */
const CC_CONSTANTS = {
  BUNDLE_NAME: 'CC_LICENSE',
  DOMAIN: 'creativecommons.org',
  METADATA_FIELDS: [
    'dc.rights.uri',
    'dc.rights',
    'dc.identifier.uri'
  ],
  LICENSE_TYPES: {
    'by/': 'CC BY',
    'by-sa/': 'CC BY-SA',
    'by-nc/': 'CC BY-NC',
    'by-nc-sa/': 'CC BY-NC-SA',
    'by-nd/': 'CC BY-ND',
    'by-nc-nd/': 'CC BY-NC-ND',
    'publicdomain/zero/': 'CC0',
    'publicdomain/mark/': 'Public Domain'
  },
  LICENSE_TYPE_PATTERNS: {
    CC0: ['cc0', 'public domain'],
    BY_NC_ND: ['by-nc-nd'],
    BY_NC_SA: ['by-nc-sa'],
    BY_NC: ['by-nc'],
    BY_ND: ['by-nd'],
    BY_SA: ['by-sa'],
    BY: ['by']
  },
  ICON_CLASSES: {
    BASE: 'fab fa-creative-commons',
    BY: 'fab fa-creative-commons-by',
    SA: 'fab fa-creative-commons-sa',
    NC: 'fab fa-creative-commons-nc',
    ND: 'fab fa-creative-commons-nd',
    ZERO: 'fab fa-creative-commons-zero'
  },
  TEMPLATE_SWITCH_CASES: {
    CC0: 'cc0',
    BY_NC_ND: 'by-nc-nd',
    BY_NC_SA: 'by-nc-sa',
    BY_NC: 'by-nc',
    BY_ND: 'by-nd',
    BY_SA: 'by-sa',
    BY: 'by'
  },
  DEFAULT_MESSAGES: {
    NO_METADATA: 'No metadata available',
    NO_VALUES: 'No values found',
    DEFAULT_LICENSE: 'Creative Commons License'
  }
} as const;

/**
 * Component for displaying Creative Commons license information on item pages
 */
@Component({
  selector: 'ds-creative-commons-license-field',
  templateUrl: './creative-commons-license-field.component.html',
  styleUrls: ['./creative-commons-license-field.component.scss']
})
export class CreativeCommonsLicenseFieldComponent implements OnInit {

  /**
   * The item to display Creative Commons license for
   */
  @Input() item: Item;

  /**
   * Creative Commons license URL
   */
  ccLicenseUrl$: Observable<string>;

  /**
   * Creative Commons license name
   */
  ccLicenseName$: Observable<string>;

  /**
   * Whether the item has a Creative Commons license
   */
  hasCcLicense$: Observable<boolean>;

  constructor(
    private bundleService: BundleDataService,
    private bitstreamService: BitstreamDataService
  ) { }

  ngOnInit(): void {
    this.initializeCcLicense();
  }

  /**
   * Initialize Creative Commons license information
   */
  private initializeCcLicense(): void {
    // Check if item has CC_LICENSE bundle and extract license information
    const ccLicenseBundle$ = this.bundleService.findByItemAndName(this.item, CC_CONSTANTS.BUNDLE_NAME);
    
    this.hasCcLicense$ = ccLicenseBundle$.pipe(
      map((bundleRD: RemoteData<Bundle>) => {
        // Check if CC_LICENSE bundle exists OR if CC license metadata exists
        const hasBundleLicense = bundleRD.hasSucceeded && isNotEmpty(bundleRD.payload);
        const hasMetadataLicense = isNotEmpty(this.extractUrlFromMetadata());
        return hasBundleLicense || hasMetadataLicense;
      }),
      catchError(() => of(false))
    );

    // Get the license URL from bitstreams in CC_LICENSE bundle
    this.ccLicenseUrl$ = ccLicenseBundle$.pipe(
      switchMap((bundleRD: RemoteData<Bundle>) => {
        if (bundleRD.hasSucceeded && isNotEmpty(bundleRD.payload)) {
          return this.bitstreamService.findAllByItemAndBundleName(this.item, CC_CONSTANTS.BUNDLE_NAME);
        }
        return of(null);
      }),
      switchMap((bitstreamsRD) => {
        if (bitstreamsRD && bitstreamsRD.hasSucceeded && isNotEmpty(bitstreamsRD.payload)) {
          const bitstreams = bitstreamsRD.payload;
          if (bitstreams.page.length > 0) {
            // Look for license URL in bitstream metadata or name
            const licenseBitstream = bitstreams.page.find(bitstream => 
              bitstream.name.includes('license') || 
              bitstream.metadata[CC_CONSTANTS.METADATA_FIELDS[0]]?.[0]?.value
            );
            const url = licenseBitstream?.metadata[CC_CONSTANTS.METADATA_FIELDS[0]]?.[0]?.value || 
                       this.extractUrlFromMetadata() || 
                       '';
            return of(url);
          }
        }
        // Fallback to metadata-based detection
        return of(this.extractUrlFromMetadata());
      }),
      catchError(() => of(''))
    );

    // Extract license name from URL or metadata
    this.ccLicenseName$ = this.ccLicenseUrl$.pipe(
      map((url: string) => {
        if (isNotEmpty(url)) {
          return this.extractLicenseNameFromUrl(url);
        }
        return '';
      })
    );
  }

  /**
   * Extract Creative Commons license URL from item metadata
   */
  private extractUrlFromMetadata(): string {
    // Check for common CC license metadata fields
    for (const field of CC_CONSTANTS.METADATA_FIELDS) {
      const values = this.item.allMetadata(field);
      if (values) {
        for (const value of values) {
          if (value.value && value.value.includes(CC_CONSTANTS.DOMAIN)) {
            return value.value;
          }
        }
      }
    }
    return '';
  }

  /**
   * Extract license name from Creative Commons URL
   */
  private extractLicenseNameFromUrl(url: string): string {
    if (!url || !url.includes(CC_CONSTANTS.DOMAIN)) {
      return '';
    }

    // Parse common CC license types from URL
    for (const [pattern, name] of Object.entries(CC_CONSTANTS.LICENSE_TYPES)) {
      if (url.includes(pattern)) {
        // Extract version if present
        const versionMatch = url.match(/(\d+\.\d+)/);
        const version = versionMatch ? ` ${versionMatch[1]}` : '';
        return `${name}${version}`;
      }
    }

    return CC_CONSTANTS.DEFAULT_MESSAGES.DEFAULT_LICENSE;
  }

  /**
   * Get Creative Commons icon class based on license type
   */
  getCcIconClass(licenseName: string): string {
    const lowerName = licenseName.toLowerCase();
    
    if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.CC0.some(pattern => lowerName.includes(pattern))) {
      return CC_CONSTANTS.ICON_CLASSES.ZERO;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_NC_ND.some(pattern => lowerName.includes(pattern))) {
      return `${CC_CONSTANTS.ICON_CLASSES.BASE} ${CC_CONSTANTS.ICON_CLASSES.BY} ${CC_CONSTANTS.ICON_CLASSES.NC} ${CC_CONSTANTS.ICON_CLASSES.ND}`;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_NC_SA.some(pattern => lowerName.includes(pattern))) {
      return `${CC_CONSTANTS.ICON_CLASSES.BASE} ${CC_CONSTANTS.ICON_CLASSES.BY} ${CC_CONSTANTS.ICON_CLASSES.NC} ${CC_CONSTANTS.ICON_CLASSES.SA}`;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_NC.some(pattern => lowerName.includes(pattern))) {
      return `${CC_CONSTANTS.ICON_CLASSES.BASE} ${CC_CONSTANTS.ICON_CLASSES.BY} ${CC_CONSTANTS.ICON_CLASSES.NC}`;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_ND.some(pattern => lowerName.includes(pattern))) {
      return `${CC_CONSTANTS.ICON_CLASSES.BASE} ${CC_CONSTANTS.ICON_CLASSES.BY} ${CC_CONSTANTS.ICON_CLASSES.ND}`;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_SA.some(pattern => lowerName.includes(pattern))) {
      return `${CC_CONSTANTS.ICON_CLASSES.BASE} ${CC_CONSTANTS.ICON_CLASSES.BY} ${CC_CONSTANTS.ICON_CLASSES.SA}`;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY.some(pattern => lowerName.includes(pattern))) {
      return `${CC_CONSTANTS.ICON_CLASSES.BASE} ${CC_CONSTANTS.ICON_CLASSES.BY}`;
    }
    
    return CC_CONSTANTS.ICON_CLASSES.BASE;
  }

  /**
   * Get license type for switch case in template
   */
  getLicenseType(licenseName: string): string {
    if (!licenseName) return '';
    
    const name = licenseName.toLowerCase();
    
    if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.CC0.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.CC0;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_NC_ND.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.BY_NC_ND;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_NC_SA.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.BY_NC_SA;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_NC.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.BY_NC;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_ND.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.BY_ND;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY_SA.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.BY_SA;
    } else if (CC_CONSTANTS.LICENSE_TYPE_PATTERNS.BY.some(pattern => name.includes(pattern))) {
      return CC_CONSTANTS.TEMPLATE_SWITCH_CASES.BY;
    } else {
      return '';
    }
  }

  /**
   * Debug helper: Get metadata values for a given field
   */
  getMetadataValues(field: string): string {
    if (!this.item || !this.item.metadata) {
      return CC_CONSTANTS.DEFAULT_MESSAGES.NO_METADATA;
    }
    
    const values = this.item.allMetadata(field);
    if (values && values.length > 0) {
      return values.map(v => v.value).join('; ');
    }
    
    return CC_CONSTANTS.DEFAULT_MESSAGES.NO_VALUES;
  }
}
