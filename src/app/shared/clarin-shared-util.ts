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
