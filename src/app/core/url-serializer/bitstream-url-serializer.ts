import { Injectable } from '@angular/core';
import {
  DefaultUrlSerializer,
  UrlTree,
} from '@angular/router';

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
      // Separate the path from the query string
      const [path, query] = url.split('?');

      // Split the path to isolate the filename
      const parts = path.split('/');
      if (parts.length > this.FILENAME_INDEX) {
        const filename = parts.slice(this.FILENAME_INDEX).join('/');
        const encodedFilename = encodeRFC3986URIComponent(filename);

        // Reconstruct the path with the encoded filename
        const newPath = [...parts.slice(0, this.FILENAME_INDEX), encodedFilename].join('/');

        // Reattach query string if present
        url = query ? `${newPath}?${query}` : newPath;
      }
    }
    return super.parse(url);
  }
}
