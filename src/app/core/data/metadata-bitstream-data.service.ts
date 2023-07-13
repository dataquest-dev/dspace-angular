import { Injectable } from '@angular/core';
import { hasValue } from '../../shared/empty.util';
import { PaginatedList } from './paginated-list.model';
import { RemoteData } from './remote-data';
import { RequestService } from './request.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { FollowLinkConfig } from '../../shared/utils/follow-link-config.model';
import { Observable } from 'rxjs';
import { RequestParam } from '../cache/models/request-param.model';
import { NoContent } from '../shared/NoContent.model';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { ObjectCacheService } from '../cache/object-cache.service';
import { METADATA_BITSTREAM } from '../metadata/metadata-bitstream.resource-type';
import { FindListOptions } from './request.models';
import { dataService } from '../cache/builders/build-decorators';
import { MetadataBitstream } from '../metadata/metadata-bitstream.model';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { CoreState } from '../core.reducers';
import { ChangeAnalyzer } from './change-analyzer';

/**
 * A service responsible for fetching/sending data from/to the REST API on the metadatafields endpoint
 */
@Injectable()
@dataService(METADATA_BITSTREAM)
export class MetadataBitstreamDataService extends DataService<MetadataBitstream> {
  protected store: Store<CoreState>;
  protected http: HttpClient;
  protected comparator: ChangeAnalyzer<MetadataBitstream>;
  protected linkPath = 'metadatabitstreams';
  protected searchByHandleLinkPath = 'byHandle';

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
    protected notificationsService: NotificationsService,
  ) {
    super();
  }


  /**
   * Find metadata fields with either the partial metadata field name (e.g. "dc.ti") as query or an exact match to
   * at least the schema, element or qualifier
   * @param schema    optional; an exact match of the prefix of the metadata schema (e.g. "dc", "dcterms", "eperson")
   * @param element   optional; an exact match of the field's element (e.g. "contributor", "title")
   * @param qualifier optional; an exact match of the field's qualifier (e.g. "author", "alternative")
   * @param query     optional (if any of schema, element or qualifier used) - part of the fully qualified field,
   * should start with the start of the schema, element or qualifier (e.g. “dc.ti”, “contributor”, “auth”, “contributor.ot”)
   * @param exactName optional; the exact fully qualified field, should use the syntax schema.element.qualifier or
   * schema.element if no qualifier exists (e.g. "dc.title", "dc.contributor.author"). It will only return one value
   * if there's an exact match
   * @param options   The options info used to retrieve the fields
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's no valid cached version. Defaults to true
   * @param reRequestOnStale  Whether or not the request should automatically be re-requested after the response becomes stale
   * @param linksToFollow List of {@link FollowLinkConfig} that indicate which {@link HALLink}s should be automatically resolved
   */
  searchByHandleParams(handle: string, fileGrpType: string, options: FindListOptions = {}, useCachedVersionIfAvailable = true, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<any>[]): Observable<RemoteData<any>> {
    const optionParams = Object.assign(new FindListOptions(), options, {
      searchParams: [
        new RequestParam('handle', hasValue(handle) ? handle : ''),
        new RequestParam('fileGrpType', hasValue(fileGrpType) ? fileGrpType : ''),
      ],
    });
    return this.searchBy(this.searchByHandleLinkPath, optionParams, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow)
  }

  // /**
  //  * Make a new FindListRequest with given search method
  //  *
  //  * @param searchMethod                The search method for the object
  //  * @param options                     The [[FindListOptions]] object
  //  * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
  //  *                                    no valid cached version. Defaults to true
  //  * @param reRequestOnStale            Whether or not the request should automatically be re-
  //  *                                    requested after the response becomes stale
  //  * @param linksToFollow               List of {@link FollowLinkConfig} that indicate which
  //  *                                    {@link HALLink}s should be automatically resolved
  //  * @return {Observable<RemoteData<PaginatedList<T>>}
  //  *    Return an observable that emits response from the server
  //  */
  // public searchBy(searchMethod: string, options?: FindListOptions, useCachedVersionIfAvailable?: boolean, reRequestOnStale?: boolean, ...linksToFollow: FollowLinkConfig<any>[]): Observable<RemoteData<PaginatedList<any>>> {
  //   return this.searchData.searchBy(searchMethod, options, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
  // }

}