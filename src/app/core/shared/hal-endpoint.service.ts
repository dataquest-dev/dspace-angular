import { Injectable } from '@angular/core';
import {
  Observable,
  of,
  timer,
} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import {
  hasValue,
  isEmpty,
  isNotEmpty,
} from '../../shared/empty.util';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { CacheableObject } from '../cache/cacheable-object.model';
import { EndpointMap } from '../cache/response.models';
import { RemoteData } from '../data/remote-data';
import { EndpointMapRequest } from '../data/request.models';
import { RequestService } from '../data/request.service';
import { RESTURLCombiner } from '../url-combiner/rest-url-combiner';
import { getFirstCompletedRemoteData } from './operators';

@Injectable({ providedIn: 'root' })
export class HALEndpointService {

  /**
   * How many times to retry resolving a HAL endpoint map that transiently completed without a
   * payload (e.g. a root-endpoint request issued before the SSR HTTP layer was ready).
   */
  private static readonly MAX_ENDPOINT_MAP_RETRIES = 3;

  /**
   * Delay (ms) between endpoint-map resolution retries.
   */
  private static readonly ENDPOINT_MAP_RETRY_DELAY_MS = 200;

  constructor(
    private requestService: RequestService,
    private rdbService: RemoteDataBuildService,
  ) {
  }

  public getRootHref(): string {
    return new RESTURLCombiner().toString();
  }

  protected getRootEndpointMap(): Observable<EndpointMap> {
    return this.getEndpointMapAt(this.getRootHref());
  }

  private getEndpointMapAt(href, attempt = 0): Observable<EndpointMap> {
    const request = new EndpointMapRequest(this.requestService.generateRequestId(), href);

    // On the first attempt reuse a cached response if present; on a retry force a fresh, uncached
    // request so we bypass a previously cached transient error (see the retry branch below).
    this.requestService.send(request, attempt === 0);

    return this.rdbService.buildFromHref<CacheableObject>(href).pipe(
      // Re-request stale responses
      tap((rd: RemoteData<CacheableObject>) => {
        if (hasValue(rd) && rd.isStale) {
          this.getEndpointMapAt(href);
        }
      }),
      // Filter out all stale responses. We're only interested in a single, non-stale,
      // completed RemoteData
      filter((rd: RemoteData<CacheableObject>) => !rd.isStale),
      getFirstCompletedRemoteData(),
      switchMap((response: RemoteData<CacheableObject>) => {
        if (hasValue(response.payload)) {
          return of(response.payload._links);
        } else if (attempt < HALEndpointService.MAX_ENDPOINT_MAP_RETRIES) {
          // The HAL root endpoint request can transiently fail when it is issued before the
          // (server-side render) HTTP layer is fully initialised - e.g. an early site/authorization
          // lookup on the home or login page. Left unhandled, that first failure is cached and
          // poisons every later root-link lookup in the same render, turning the page into a 500.
          // Retry with a fresh, uncached request after a short delay so the render recovers.
          return timer(HALEndpointService.ENDPOINT_MAP_RETRY_DELAY_MS).pipe(
            switchMap(() => this.getEndpointMapAt(href, attempt + 1)),
          );
        } else {
          console.warn(`No _links section found at ${href} (status: ${response.statusCode}, error: ${response.errorMessage})`);
          return of(undefined);
        }
      }),
    );
  }

  public getEndpoint(linkPath: string, startHref?: string): Observable<string> {
    const halNames = linkPath.split('/').filter((name: string) => isNotEmpty(name));
    return this.getEndpointAt(startHref || this.getRootHref(), ...halNames).pipe(take(1));
  }

  /**
   * Resolve the actual hal url based on a list of hal names
   * @param {string} href The root url to start from
   * @param {string} halNames List of hal names for which a url should be resolved
   * @returns {Observable<string>} Observable that emits the found hal url
   */
  private getEndpointAt(href: string, ...halNames: string[]): Observable<string> {
    if (isEmpty(halNames)) {
      throw new Error('cant\'t fetch the URL without the HAL link names');
    }

    const nextHref$ = this.getEndpointMapAt(href).pipe(
      map((endpointMap: EndpointMap): string => {
        const nextName = halNames[0];
        if (hasValue(endpointMap) && hasValue(endpointMap[nextName])) {
          return endpointMap[nextName].href;
        } else {
          throw new Error(`${JSON.stringify(endpointMap)} doesn't contain the link ${nextName}`);
        }
      }),
    ) as Observable<string>;

    if (halNames.length === 1) {
      return nextHref$.pipe(take(1));
    } else {
      return nextHref$.pipe(
        switchMap((nextHref) => this.getEndpointAt(nextHref, ...halNames.slice(1))),
        take(1),
      );
    }
  }

  public isEnabledOnRestApi(linkPath: string): Observable<boolean> {
    return this.getRootEndpointMap().pipe(
      // TODO this only works when there's no / in linkPath
      map((endpointMap: EndpointMap) => isNotEmpty(endpointMap[linkPath])),
      startWith(undefined),
      distinctUntilChanged(),
    );
  }

}
