import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { RemoteData } from '../core/data/remote-data';
import { Observable } from 'rxjs';
import { Bitstream } from '../core/shared/bitstream.model';
import { BitstreamDataService } from '../core/data/bitstream-data.service';
import { followLink, FollowLinkConfig } from '../shared/utils/follow-link-config.model';
import { getFirstCompletedRemoteData } from '../core/shared/operators';
import {BundleDataService} from '../core/data/bundle-data.service';
import {PaginatedList} from '../core/data/paginated-list.model';
import {switchMap} from 'rxjs/operators';
import {Item} from '../core/shared/item.model';
import {isNotUndefined} from '../shared/empty.util';

/**
 * This class represents a resolver that requests a specific bitstream before the route is activated
 */
@Injectable()
export class ItemPageByBitstreamResolver implements Resolve<RemoteData<Item>> {
  constructor(private bitstreamService: BitstreamDataService,
              protected bundleService: BundleDataService) {
  }

  /**
   * Method for resolving a bitstream based on the parameters in the current route
   * @param {ActivatedRouteSnapshot} route The current ActivatedRouteSnapshot
   * @param {RouterStateSnapshot} state The current RouterStateSnapshot
   * @returns Observable<<RemoteData<Item>> Emits the found bitstream based on the parameters in the current route,
   * or an error if something went wrong
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<RemoteData<Item>> {
    return this.bitstreamService.findById(route.params.id, true, false, followLink('bundle', {}, followLink('item')),
      followLink('format'))
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((bitstreamRD$) => {
          return bitstreamRD$?.payload?.bundle;
        })
      )
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((bundleRD$) => {
          return this.bundleService.findById(bundleRD$?.payload?.id, false, true,
            followLink('item'));
        })
      )
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((itemRD$) => {
          console.log('itemRD$', itemRD$);
          console.log('itemRD$.payload?.item', itemRD$.payload?.item);
          if (isNotUndefined(itemRD$.payload?.item)) {
            return itemRD$.payload?.item;
          } else {
            return null;
          }
        })
      );
  }
  /**
   * Method that returns the follow links to already resolve
   * The self links defined in this list are expected to be requested somewhere in the near future
   * Requesting them as embeds will limit the number of requests
   */
  get followLinks(): FollowLinkConfig<Bitstream>[] {
    return [
      followLink('bundle', {}, followLink('item')),
      followLink('format')
    ];
  }
}
