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
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {DSOChangeAnalyzer} from '../../../../../../core/data/dso-change-analyzer.service';
import {Site} from '../../../../../../core/shared/site.model';
import {Observable, of as observableOf} from 'rxjs';
import {
  getAllCompletedRemoteData,
  getFirstSucceededRemoteData,
  takeUntilCompletedRemoteData
} from '../../../../../../core/shared/operators';
import {distinctUntilChanged, find, map, skipWhile, take, takeWhile, tap} from 'rxjs/operators';
import {RemoteData} from '../../../../../../core/data/remote-data';
import {PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {DataService} from '../../../../../../core/data/data.service';
import {FollowLinkConfig} from '../../../../../utils/follow-link-config.model';
import {hasValue, isNotEmptyOperator} from '../../../../../empty.util';
import {DSpaceSerializer} from '../../../../../../core/dspace-rest/dspace.serializer';
import {CreateRequest, GetRequest, PostRequest} from '../../../../../../core/data/request.models';
import {NotificationOptions} from '../../../../../notifications/models/notification-options.model';
import {RequestParam} from '../../../../../../core/cache/models/request-param.model';
import {MetadataValueSuggestion} from '../../../../../../core/shared/metadata-value-suggestion';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {DefaultChangeAnalyzer} from '../../../../../../core/data/default-change-analyzer.service';
import {HttpOptions} from '../../../../../../core/dspace-rest/dspace-rest.service';

export const linkName = 'metadatavaluewithfield';
export const AUTOCOMPLETE = new ResourceType(linkName);

/**
 * A service responsible for fetching/sending data from/to the REST API on the vocabularies endpoint
 */
@Injectable()
@dataService(MetadataValue.type)
export class SiteDataService2 extends DataService<MetadataValue> {
  protected linkPath = linkName;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
    protected notificationsService: NotificationsService,
    protected http: HttpClient,
    protected comparator: DefaultChangeAnalyzer<MetadataValue>,
  ) {
    super();
  }
  //
  // getIDHref(endpoint, resourceID, ...linksToFollow: FollowLinkConfig<Site>[]): string {
  //   // Supporting both identifier (pid) and uuid (dso) endpoints
  //   return this.buildHrefFromFindOptions( endpoint.replace(/\{\?metadataField\}/, `?metadataField=${resourceID}`)
  //       .replace(/\{\?searchValue\}/, `?searchValue=${resourceID}`),
  //     {}, [], ...linksToFollow);
  // }
  /**
   * Retrieve the Site Object
   */
  find(): Observable<MetadataValue> {
    // const requestId = this.requestService.generateRequestId();
    //
    // const useCachedVersionIfAvailable = true;
    // const reRequestOnStale = true;
    // // let linksToFollow: FollowLinkConfig<Site>[];
    //
    const params: RequestParam[] = [];

    // const options: HttpOptions = Object.create({});
    // let headers = new HttpHeaders();
    // headers = headers.append('Content-Type', 'text/uri-list');
    // options.headers = headers;

    const requestId = this.requestService.generateRequestId();
    let extraArgs: string[] = [];
    extraArgs.push('metadataField=dc.contributor.author');
    extraArgs.push('searchValue=M');

    let href$ = this.myGetFindAllHref({}, undefined, extraArgs);
    // const href$ = this.halService.getEndpoint(this.linkPath).pipe(map((href) => {
    //   let hh = `${href}?metadataField=dc.contributor.author&searchValue=M`;
    //   return hh;
    // }));

    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new GetRequest(requestId, href);
        this.requestService.send(request);
      })
    ).subscribe();

    let remoteData$ = this.rdbService.buildList<MetadataValue>(href$);
    return remoteData$.pipe(
      getAllCompletedRemoteData(),
      map((remoteData: RemoteData<PaginatedList<MetadataValue>>) => {
            console.log('remoteData');
            console.log(remoteData);
            return remoteData.payload;
          }),
      map((list: PaginatedList<MetadataValue>) => {
        return list.page[0];
      })
    );
    // return null;

    // return this.findAll().pipe(
    //   takeUntilCompletedRemoteData(),
    //   map((remoteData: RemoteData<PaginatedList<MetadataValue>>) => {
    //     return remoteData.payload;
    //   }),
    //   map((list: PaginatedList<MetadataValue>) => list.page[0])
    // );
    //
    // // let linksToFollow = FollowLinkConfig<Site> = [];
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
    // 2.
    // let extraArgs: string[] = [];
    // extraArgs.push('metadataField=dc.contributor.author');
    // extraArgs.push('searchValue=M');
    //
    // let href = this.myGetFindAllHref({}, null, extraArgs);
    // href.subscribe( hrf => {
    //     console.log('hrf', hrf);
    //   }
    // );
    // let response = this.findAllByHref(href);
    // response.subscribe( hrf => {
    //     console.log('Response', hrf);
    //   }
    // );
    //
    // response.pipe(
    //   tap( res => console.log('HTTP response:', res)),
    //   getFirstSucceededRemoteData(),
    //   tap( res => console.log('HTTP response:', res)),
    //   map((remoteData: RemoteData<PaginatedList<MetadataValue>>) => {
    //     console.log('remoteData');
    //     console.log(remoteData);
    //     return remoteData.payload;
    //   }),
    //   map((list: PaginatedList<MetadataValue>) => list.page[0])
    // );
    //
    // return null;

    // 3.
    // const requestId = this.requestService.generateRequestId();
    // const endpoint$ = this.getEndpoint().pipe(
    //   isNotEmptyOperator(),
    //   distinctUntilChanged(),
    //   map((endpoint: string) => this.buildHrefWithParams(endpoint, params))
    // );
    //
    // const serializedObject = new DSpaceSerializer(getClassForType(object.type)).serialize(object);
    //
    // endpoint$.pipe(
    //   take(1)
    // ).subscribe((endpoint: string) => {
    //   const request = new GetRequest(requestId, endpoint, JSON.stringify(serializedObject));
    //   if (hasValue(this.responseMsToLive)) {
    //     request.responseMsToLive = this.responseMsToLive;
    //   }
    //   this.requestService.send(request);
    // });
    //
    // const result$ = this.rdbService.buildFromRequestUUID(requestId);
    //
    // // TODO a dataservice is not the best place to show a notification,
    // // this should move up to the components that use this method
    // result$.pipe(
    //   takeWhile((rd: RemoteData<T>) => rd.isLoading, true)
    // ).subscribe((rd: RemoteData<T>) => {
    //   if (rd.hasFailed) {
    //     this.notificationsService.error('Server Error:', rd.errorMessage, new NotificationOptions(-1));
    //   }
    // });
    //
    // return result$;
  }
}
