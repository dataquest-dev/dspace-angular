import {Injectable} from '@angular/core';
import {dataService, getClassForType} from '../../../../../../core/cache/builders/build-decorators';
import {ResourceType} from '../../../../../../core/shared/resource-type';
import {RequestService} from '../../../../../../core/data/request.service';
import {RemoteDataBuildService} from '../../../../../../core/cache/builders/remote-data-build.service';
import {Store} from '@ngrx/store';
import {CoreState} from '../../../../../../core/core.reducers';
import {ObjectCacheService} from '../../../../../../core/cache/object-cache.service';
import {HALEndpointService} from '../../../../../../core/shared/hal-endpoint.service';
import {NotificationsService} from '../../../../../notifications/notifications.service';
import {HttpClient} from '@angular/common/http';
import {DSOChangeAnalyzer} from '../../../../../../core/data/dso-change-analyzer.service';
import {Site} from '../../../../../../core/shared/site.model';
import {Observable, of as observableOf} from 'rxjs';
import {getFirstSucceededRemoteData} from '../../../../../../core/shared/operators';
import {distinctUntilChanged, map, skipWhile, take, takeWhile} from 'rxjs/operators';
import {RemoteData} from '../../../../../../core/data/remote-data';
import {PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {DataService} from '../../../../../../core/data/data.service';
import {FollowLinkConfig} from '../../../../../utils/follow-link-config.model';
import {hasValue, isNotEmptyOperator} from '../../../../../empty.util';
import {DSpaceSerializer} from '../../../../../../core/dspace-rest/dspace.serializer';
import {CreateRequest} from '../../../../../../core/data/request.models';
import {NotificationOptions} from '../../../../../notifications/models/notification-options.model';
import {RequestParam} from '../../../../../../core/cache/models/request-param.model';
import {any} from 'codelyzer/util/function';

export const linkName = 'suggestions';
export const AUTOCOMPLETE = new ResourceType(linkName);

/**
 * A service responsible for fetching/sending data from/to the REST API on the vocabularies endpoint
 */
@Injectable()
@dataService(AUTOCOMPLETE)
export class SiteDataService2 extends DataService<Site> {
  protected linkPath = linkName;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
    protected notificationsService: NotificationsService,
    protected http: HttpClient,
    protected comparator: DSOChangeAnalyzer<Site>,
  ) {
    super();
  }
  //
  // getIDHref(endpoint, resourceID, ...linksToFollow: FollowLinkConfig<any>[]): string {
  //   // Supporting both identifier (pid) and uuid (dso) endpoints
  //   return this.buildHrefFromFindOptions( endpoint.replace(/\{\?metadataField\}/, `?metadataField=${resourceID}`)
  //       .replace(/\{\?searchValue\}/, `?searchValue=${resourceID}`),
  //     {}, [], ...linksToFollow);
  // }
  /**
   * Retrieve the Site Object
   */
  find(): Observable<any> {
    // const requestId = this.requestService.generateRequestId();
    //
    // const useCachedVersionIfAvailable = true;
    // const reRequestOnStale = true;
    // // let linksToFollow: FollowLinkConfig<Site>[];
    //
    // const params: RequestParam[] = [];
    //
    // // let linksToFollow = FollowLinkConfig<any> = [];
    // const endpoint$ = this.getEndpoint().pipe(
    //   isNotEmptyOperator(),
    //   distinctUntilChanged(),
    //   map((endpoint: string) => this.buildHrefFromFindOptions(endpoint.replace(/\{\?metadataField\}/, `?metadataField=dc.contributor.author`)
    //     .replace(/\{\?searchValue\}/, `?searchValue=M`), {}, [], ...linksToFollow))
    // );
    //
    // const serializedObject = new DSpaceSerializer(getClassForType(Site.type)).serialize(Site);
    //
    // endpoint$.pipe(
    //   take(1)
    // ).subscribe((endpoint: string) => {
    //   const request = new CreateRequest(requestId, endpoint, JSON.stringify(serializedObject));
    //   if (hasValue(this.responseMsToLive)) {
    //     request.responseMsToLive = this.responseMsToLive;
    //   }
    //   this.requestService.send(request);
    // });
    //
    // const result$ = this.rdbService.buildFromRequestUUID<Site>(requestId);
    // return result$;
    // TODO a dataservice is not the best place to show a notification,
    // this should move up to the components that use this method
    // result$.pipe(
    //   takeWhile((rd: RemoteData<Site>) => rd.isLoading, true)
    // ).subscribe((rd: RemoteData<Site>) => {
    //   if (rd.hasFailed) {
    //     this.notificationsService.error('Server Error:', rd.errorMessage, new NotificationOptions(-1));
    //   }
    // });

    // return result$;

    //
    return this.myFindAll().pipe(
      getFirstSucceededRemoteData(),
      map((remoteData: RemoteData<PaginatedList<any>>) => remoteData.payload),
      map((list: PaginatedList<any>) => list.page[0])
    );
  }
}
