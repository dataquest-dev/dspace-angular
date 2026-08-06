import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  Observable,
  of,
} from 'rxjs';
import {
  switchMap,
  take,
} from 'rxjs/operators';

import { AuthService } from '../core/auth/auth.service';
import { DsoRedirectService } from '../core/data/dso-redirect.service';
import { RemoteData } from '../core/data/remote-data';
import { IdentifierType } from '../core/data/request.models';
import { ServerResponseService } from '../core/services/server-response.service';
import { returnForbiddenUrlTreeOrLoginOnFalse } from '../core/shared/authorized.operators';
import { DSpaceObject } from '../core/shared/dspace-object.model';

interface LookupParams {
  type: IdentifierType;
  id: string;
}

export const lookupGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  dsoService: DsoRedirectService = inject(DsoRedirectService),
  authService: AuthService = inject(AuthService),
  router: Router = inject(Router),
  serverResponseService: ServerResponseService = inject(ServerResponseService),
): Observable<boolean | UrlTree> => {
  const params = getLookupParams(route);
  return dsoService.findByIdAndIDType(params.id, params.type).pipe(
    switchMap((response: RemoteData<DSpaceObject>) => {
      // A restricted object, which REST reports as 401/403 rather than 404
      if (response.hasFailed && (response.statusCode === 401 || response.statusCode === 403)) {
        // or SSR would cache the login page as HTTP 200 under the identifier's URL. No-op in the browser.
        serverResponseService.setStatus(response.statusCode);
        // `false` = not authorized: login page for anonymous users, /403 for authenticated ones, the
        // same split /items/:id makes. take(1) because isAuthenticated() never completes.
        return of(false).pipe(
          returnForbiddenUrlTreeOrLoginOnFalse(router, authService, state.url),
          take(1),
        );
      }
      // Any other failure (404, 501, 5xx) activates the route so ObjectNotFoundComponent renders
      return of(response.hasFailed);
    }),
  );
};

function getLookupParams(route: ActivatedRouteSnapshot): LookupParams {
  let type;
  let id;
  const idType = route.params.idType;

  // If the idType is not recognized, assume a legacy handle request (handle/prefix/id)
  if (idType !== IdentifierType.HANDLE && idType !== IdentifierType.UUID) {
    type = IdentifierType.HANDLE;
    const prefix = route.params.idType;
    const handleId = route.params.id;
    id = `hdl:${prefix}/${handleId}`;

  } else if (route.params.idType === IdentifierType.HANDLE) {
    type = IdentifierType.HANDLE;
    id = 'hdl:' + route.params.id;

  } else {
    type = IdentifierType.UUID;
    id = route.params.id;
  }
  return {
    type: type,
    id: id,
  };
}
