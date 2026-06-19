import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FollowLinkConfig } from 'src/app/shared/utils/follow-link-config.model';

import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { dataService } from '../../cache/builders/build-decorators';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { RequestParam } from '../../cache/models/request-param.model';
import { ObjectCacheService } from '../../cache/object-cache.service';
import { CoreState } from '../../core-state.model';
import { ClarinLicenseLabel } from '../../shared/clarin/clarin-license-label.model';
import { HALEndpointService } from '../../shared/hal-endpoint.service';
import { ResourceType } from '../../shared/resource-type';
import { BaseDataService } from '../base/base-data.service';
import {
  CreateData,
  CreateDataImpl,
} from '../base/create-data';
import {
  FindAllData,
  FindAllDataImpl,
} from '../base/find-all-data';
import { DefaultChangeAnalyzer } from '../default-change-analyzer.service';
import { FindListOptions } from '../find-list-options.model';
import { PaginatedList } from '../paginated-list.model';
import { RemoteData } from '../remote-data';
import { RequestService } from '../request.service';

export const linkName = 'clarinlicenselabels';
export const AUTOCOMPLETE = new ResourceType(linkName);

/**
 * A service responsible for fetching/sending data from/to the REST API - vocabularies endpoint
 */
@Injectable()
@dataService(ClarinLicenseLabel.type)
export class ClarinLicenseLabelDataService extends BaseDataService<ClarinLicenseLabel> implements CreateData<ClarinLicenseLabel>, FindAllData<ClarinLicenseLabel> {
  protected linkPath = linkName;
  private createData: CreateData<ClarinLicenseLabel>;
  private findAllData: FindAllData<ClarinLicenseLabel>;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected halService: HALEndpointService,
    protected objectCache: ObjectCacheService,
    protected comparator: DefaultChangeAnalyzer<ClarinLicenseLabel>,
    protected http: HttpClient,
    protected notificationsService: NotificationsService,
  ) {
    super(linkName, requestService, rdbService, objectCache, halService, undefined);

    this.findAllData = new FindAllDataImpl(this.linkPath, requestService, rdbService, objectCache, halService, this.responseMsToLive);
    this.createData = new CreateDataImpl(this.linkPath, requestService, rdbService, objectCache, halService, notificationsService, this.responseMsToLive);
  }

  findAll(options?: FindListOptions, useCachedVersionIfAvailable?: boolean, reRequestOnStale?: boolean, ...linksToFollow: FollowLinkConfig<ClarinLicenseLabel>[]): Observable<RemoteData<PaginatedList<ClarinLicenseLabel>>> {
    return this.findAllData.findAll(options, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
  }

  create(object: ClarinLicenseLabel, ...params: RequestParam[]): Observable<RemoteData<ClarinLicenseLabel>> {
    return this.createData.create(object, ...params);
  }
}
