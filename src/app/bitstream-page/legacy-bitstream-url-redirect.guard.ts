import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { APP_CONFIG, AppConfig } from '../../config/app-config.interface';
import { PAGE_NOT_FOUND_PATH } from '../app-routing-paths';
import { BitstreamDataService } from '../core/data/bitstream-data.service';
import { RemoteData } from '../core/data/remote-data';
import { HardRedirectService } from '../core/services/hard-redirect.service';
import { Bitstream } from '../core/shared/bitstream.model';
import { getFirstCompletedRemoteData } from '../core/shared/operators';
import { hasNoValue } from '../shared/empty.util';

/**
 * Redirects to a bitstream based on the handle of the item, and the sequence id or the filename of the
 * bitstream. In production mode the status code will also be set the status code to 301 marking it as a permanent URL
 * redirect for bots.
 *
 * @returns Observable<UrlTree> Returns a URL to redirect the user to the new URL format
 */
export const legacyBitstreamURLRedirectGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  bitstreamDataService: BitstreamDataService = inject(BitstreamDataService),
  serverHardRedirectService: HardRedirectService = inject(HardRedirectService),
  router: Router = inject(Router),
  appConfig: AppConfig = inject(APP_CONFIG),
): Observable<UrlTree | boolean> => {
  const prefix = route.params.prefix;
  const suffix = route.params.suffix;
  const filename = route.params.filename;
  let sequenceId = route.params.sequence_id;
  if (hasNoValue(sequenceId)) {
    sequenceId = route.queryParams.sequenceId;
  }
  return bitstreamDataService.findByItemHandle(
    `${prefix}/${suffix}`,
    sequenceId,
    filename,
  ).pipe(
    getFirstCompletedRemoteData(),
    map((rd: RemoteData<Bitstream>) => {
      if (rd.hasSucceeded && !rd.hasNoContent) {
        let nameSpace = (appConfig.ui.nameSpace || '').replace(/^\/+|\/+$/g, '');
        // Neutralize any absolute-like values (http:, https:, //, protocol-relative URLs, or invalid characters)
        const allowedNamespaceRegex = /^[a-zA-Z0-9_-]+$/;
        // Check for absolute URLs, protocol-relative URLs, or invalid characters
        if (
          nameSpace.startsWith('http:') ||
          nameSpace.startsWith('https:') ||
          nameSpace.startsWith('//') ||
          nameSpace.match(/^\/[^\/]/) || // protocol-relative URL: single slash followed by non-slash
          !allowedNamespaceRegex.test(nameSpace)
        ) {
          nameSpace = '';
        }
        const redirectPath = nameSpace ? `/${nameSpace}/bitstreams/${rd.payload.uuid}/download` : `/bitstreams/${rd.payload.uuid}/download`;
        const redirectUrl = new URL(redirectPath, serverHardRedirectService.getCurrentOrigin()).href;
        serverHardRedirectService.redirect(redirectUrl, 301);
        return false;
      } else {
        return router.createUrlTree([PAGE_NOT_FOUND_PATH]);
      }
    })
  );
};
