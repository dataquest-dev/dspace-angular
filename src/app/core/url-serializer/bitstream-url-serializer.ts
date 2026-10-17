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
      // Separate the path from the query string and fragment (everything from the first raw '?' or '#')
      const queryIndex = url.search(/[?#]/);
      const path = queryIndex === -1 ? url : url.substring(0, queryIndex);
      const queryAndFragment = queryIndex === -1 ? '' : url.substring(queryIndex);

      // Split the path to isolate the filename
      const parts = path.split('/');
      if (parts.length > this.FILENAME_INDEX) {
        const filename = parts.slice(this.FILENAME_INDEX).join('/');
        const encodedFilename = encodeRFC3986URIComponent(filename);

        // Reconstruct the path with the encoded filename
        const newPath = [...parts.slice(0, this.FILENAME_INDEX), encodedFilename].join('/');

        // Reattach the query string and fragment unchanged
        url = newPath + queryAndFragment;
      }
    }
    return super.parse(url);
  }
}
