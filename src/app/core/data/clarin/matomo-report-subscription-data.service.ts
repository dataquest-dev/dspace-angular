import { Injectable } from '@angular/core';
import { RequestService } from '../request.service';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { HALEndpointService } from '../../shared/hal-endpoint.service';
import { ObjectCacheService } from '../../cache/object-cache.service';
import { dataService } from '../base/data-service.decorator';
import { IdentifiableDataService } from '../base/identifiable-data.service';
import { MatomoReportSubscription } from '../../shared/clarin/matomo-report-subscription.model';
import { Observable } from 'rxjs';
import { RemoteData } from '../remote-data';
import { PostRequest } from '../request.models';
import { map, switchMap, take } from 'rxjs/operators';
import { NoContent } from '../../shared/NoContent.model';

export const MATOMO_SUBSCRIPTION_ENDPOINT = 'matomoreportsubscriptions';

@Injectable()
@dataService(MatomoReportSubscription.type)
export class MatomoReportSubscriptionDataService extends IdentifiableDataService<MatomoReportSubscription> {

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService
  ) {
    super(MATOMO_SUBSCRIPTION_ENDPOINT, requestService, rdbService, objectCache, halService);
  }

  /**
   * Get subscription status for an item
   */
  getSubscriptionStatus(itemId: string): Observable<RemoteData<MatomoReportSubscription>> {
    const endpoint$ = this.halService.getEndpoint(this.linkPath).pipe(
      map(endpoint => `${endpoint}/item/${itemId}`)
    );

    return this.findByHref(endpoint$);
  }

  /**
   * Subscribe to Matomo reports for an item
   */
  subscribe(itemId: string): Observable<RemoteData<NoContent>> {
    return this.halService.getEndpoint(this.linkPath).pipe(
      take(1),
      map(endpoint => `${endpoint}/item/${itemId}/subscribe`),
      switchMap(endpoint => {
        const request = new PostRequest(this.requestService.generateRequestId(), endpoint, null);
        this.requestService.send(request, true);
        return this.rdbService.buildFromRequestUUID(request.uuid);
      })
    );
  }

  /**
   * Unsubscribe from Matomo reports for an item
   */
  unsubscribe(itemId: string): Observable<RemoteData<NoContent>> {
    return this.halService.getEndpoint(this.linkPath).pipe(
      take(1),
      map(endpoint => `${endpoint}/item/${itemId}/unsubscribe`),
      switchMap(endpoint => {
        const request = new PostRequest(this.requestService.generateRequestId(), endpoint, null);
        this.requestService.send(request, true);
        return this.rdbService.buildFromRequestUUID(request.uuid);
      })
    );
  }
}
