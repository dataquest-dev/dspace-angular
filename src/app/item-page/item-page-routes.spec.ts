import { Route } from '@angular/router';

import { ClarinZipDownloadPageComponent } from '../bitstream-page/clarin-zip-download-page/clarin-zip-download-page.component';
import { authenticatedGuard } from '../core/auth/authenticated.guard';
import { itemPageResolver } from './item-page.resolver';
import { ROUTES } from './item-page-routes';
import {
  TOMBSTONE_ITEM_PATH,
  VIEWS_DOWNLOADS_STATISTICS_PATH,
} from './item-page-routing-paths';
import { TombstoneComponent } from './tombstone/tombstone.component';

/**
 * The CLARIN routes below were dropped once by the v9 upgrade while the components they mount kept
 * shipping, so a click on "download all files as ZIP" ended on page-not-found. Pin them here.
 */
describe('item page ROUTES', () => {
  const itemRoute: Route = ROUTES.find((route: Route) => route.path === ':id');
  const childOf = (path: string): Route => {
    expect(itemRoute).withContext('the item :id route').toBeTruthy();
    return itemRoute.children.find((route: Route) => route.path === path);
  };

  it('should mount the ZIP download page on both download and download/zip', () => {
    const download: Route = childOf('download');
    expect(download).toBeTruthy();
    expect(download.children.map((route: Route) => route.path)).toEqual(['', 'zip']);

    download.children.forEach((route: Route) => {
      expect(route.component).toBe(ClarinZipDownloadPageComponent);
      expect(route.resolve.dso).toBe(itemPageResolver);
      expect(route.data.zipDownloadLink).toBeTruthy();
    });
  });

  it('should mount the tombstone page', () => {
    expect(childOf(TOMBSTONE_ITEM_PATH).component).toBe(TombstoneComponent);
  });

  it('should keep the per-item statistics page behind a login', () => {
    const statistics: Route = childOf(VIEWS_DOWNLOADS_STATISTICS_PATH);
    expect(statistics.canActivate).toContain(authenticatedGuard);
    expect(statistics.resolve.dso).toBe(itemPageResolver);
  });
});
