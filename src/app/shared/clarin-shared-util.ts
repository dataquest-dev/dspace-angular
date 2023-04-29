import { DomSanitizer } from '@angular/platform-browser';
import {getFirstSucceededRemoteDataPayload} from '../core/shared/operators';
import {ConfigurationDataService} from '../core/data/configuration-data.service';

/**
 * Convert raw byte array to the image is not secure - this function make it secure
 * @param imageByteArray as secure byte array
 */
export function secureImageData(sanitizer: DomSanitizer,imageByteArray) {
  const objectURL = 'data:image/png;base64,' + imageByteArray;
  return sanitizer.bypassSecurityTrustUrl(objectURL);
}

export function getBaseUrl(configurationService: ConfigurationDataService): Promise<any> {
  return configurationService.findByPropertyName('dspace.ui.url')
    .pipe(getFirstSucceededRemoteDataPayload())
    .toPromise();
}

export function convertMetadataFieldIntoSearchType(field: string[]) {
  switch (true) {
    case field.includes('dc.contributor.author') || field.includes('dc.creator'):
      return 'author';
    case field.includes('dc.type'):
      return 'itemtype';
    case field.includes('dc.publisher') || field.includes('creativework.publisher'):
      return 'publisher';
    default:
      return '';
  }
}
