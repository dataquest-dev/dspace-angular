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
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../core/auth/auth.service';
import { DsoRedirectService } from '../core/data/dso-redirect.service';
import { RemoteData } from '../core/data/remote-data';
import { IdentifierType } from '../core/data/request.models';
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
): Observable<boolean | UrlTree> => {
  const params = getLookupParams(route);
  return dsoService.findByIdAndIDType(params.id, params.type).pipe(
    switchMap((response: RemoteData<DSpaceObject>) => {
      if (response.hasFailed && (response.statusCode === 401 || response.statusCode === 403)) {
        // The identifier resolves to an object the current user isn't allowed to see, which the
        // REST API reports as 401/403 rather than 404. Emitting `false` means "not authorized":
        // the shared operator turns that into a UrlTree to the login page for an anonymous user
        // (remembering state.url so they come back to this identifier afterwards), or to the
        // forbidden page for an authenticated one. This mirrors what /items/:id already does via
        // itemPageResolver -> redirectOn4xx, so both routes behave identically.
        return of(false).pipe(
          returnForbiddenUrlTreeOrLoginOnFalse(router, authService, state.url),
        );
      }
      // Activate the route - and therefore render ObjectNotFoundComponent - only when the lookup
      // genuinely failed to find anything (404). On success DsoRedirectService has already
      // triggered a hard redirect to the object's own page, so the route must not be activated.
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
