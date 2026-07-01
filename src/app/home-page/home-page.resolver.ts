import { isPlatformServer } from '@angular/common';
import {
  inject,
  PLATFORM_ID,
} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import {
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  take,
} from 'rxjs/operators';

import { SiteDataService } from '../core/data/site-data.service';
import { Site } from '../core/shared/site.model';

export const homePageResolver: ResolveFn<Site> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  siteService: SiteDataService = inject(SiteDataService),
  platformId: object = inject(PLATFORM_ID),
): Observable<Site> => {
  // During the server-side render this resolver is the earliest consumer of the HAL root
  // endpoint - so early that on the request-heavy CLARIN home page the root request can be
  // issued before the SSR HTTP layer is ready. That first failure gets cached as an error and
  // poisons every later root-link lookup in the same render, turning the home page into a 500.
  // Skip the site lookup on the server (the browser resolves it on hydration); guard against
  // any transient failure so the resolver never crashes the render.
  if (isPlatformServer(platformId)) {
    return of(null);
  }
  return siteService.find().pipe(
    take(1),
    catchError(() => of(null)),
  );
};
