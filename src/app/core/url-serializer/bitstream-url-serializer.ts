import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';
import { encodeRFC3986URIComponent } from '../../shared/clarin-shared-util';

/**
 * This class intercepts the parsing of URLs to ensure that the filename in the URL is properly encoded.
 * But it only does this for URLs that start with '/bitstream/'.
 */
@Injectable({ providedIn: 'root' })
export class BitstreamUrlSerializer extends DefaultUrlSerializer {
  FILENAME_INDEX = 5;
  // Intercept parsing of every URL
  parse(url: string): UrlTree {
    if (url.startsWith('/bitstream/')) {
      // Split the URL to isolate the filename
      const parts = url.split('/');
      if (parts.length > this.FILENAME_INDEX) {
        // Fetch the filename from the URL
        const filename = parts.slice(this.FILENAME_INDEX).join();
        const encodedFilename = encodeRFC3986URIComponent(filename);
        // Reconstruct the URL with the encoded filename
        url = [...parts.slice(0, this.FILENAME_INDEX), encodedFilename].join('/');
      }
    }
    return super.parse(url);
  }
}
