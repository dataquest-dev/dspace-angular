import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { FollowLinkConfig } from '../../../shared/utils/follow-link-config.model';
import { dataService } from '../../cache/builders/build-decorators';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { ObjectCacheService } from '../../cache/object-cache.service';
import { CoreState } from '../../core-state.model';
import { ClarinLicenseResourceMapping } from '../../shared/clarin/clarin-license-resource-mapping.model';
import { HALEndpointService } from '../../shared/hal-endpoint.service';
import { ResourceType } from '../../shared/resource-type';
import { BaseDataService } from '../base/base-data.service';
import {
  SearchData,
  SearchDataImpl,
} from '../base/search-data';
import { DefaultChangeAnalyzer } from '../default-change-analyzer.service';
import { FindListOptions } from '../find-list-options.model';
import { PaginatedList } from '../paginated-list.model';
import { RemoteData } from '../remote-data';
import { RequestService } from '../request.service';

export const linkName = 'clarinlicenseresourcemappings';
export const AUTOCOMPLETE = new ResourceType(linkName);

/**
 * A service responsible for fetching/sending clarin license resource mapping from/to the Clarin License
 * Resource Mapping REST API
 */
@Injectable({ providedIn: 'root' })
@dataService(ClarinLicenseResourceMapping.type)
export class ClarinLicenseResourceMappingService extends BaseDataService<ClarinLicenseResourceMapping> implements SearchData<ClarinLicenseResourceMapping> {
  protected linkPath = linkName;
  private searchData: SearchData<ClarinLicenseResourceMapping>;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected halService: HALEndpointService,
    protected objectCache: ObjectCacheService,
    protected comparator: DefaultChangeAnalyzer<ClarinLicenseResourceMapping>,
    protected http: HttpClient,
    protected notificationsService: NotificationsService,
  ) {
    super(linkName, requestService, rdbService, objectCache, halService, undefined);
    this.searchData = new SearchDataImpl(this.linkPath, requestService, rdbService, objectCache, halService, this.responseMsToLive);
  }

  searchBy(searchMethod: string, options?: FindListOptions, useCachedVersionIfAvailable?: boolean, reRequestOnStale?: boolean, ...linksToFollow: FollowLinkConfig<ClarinLicenseResourceMapping>[]): Observable<RemoteData<PaginatedList<ClarinLicenseResourceMapping>>> {
    return this.searchData.searchBy(searchMethod, options, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
  }

}
