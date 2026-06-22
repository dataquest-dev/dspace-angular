import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { dataService } from '../../cache/builders/build-decorators';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { ObjectCacheService } from '../../cache/object-cache.service';
import { CoreState } from '../../core-state.model';
import { ClruaModel } from '../../shared/clarin/clrua.model';
import { HALEndpointService } from '../../shared/hal-endpoint.service';
import { ResourceType } from '../../shared/resource-type';
import { BaseDataService } from '../base/base-data.service';
import { DefaultChangeAnalyzer } from '../default-change-analyzer.service';
import { RequestService } from '../request.service';

export const linkName = 'clarinlruallowances';
export const AUTOCOMPLETE = new ResourceType(linkName);

/**
 * A service responsible for fetching/sending CLRUA data from/to the Clarin License Resource User Allowance REST API
 */
@Injectable({ providedIn: 'root' })
@dataService(ClruaModel.type)
export class ClruaDataService extends BaseDataService<ClruaModel> {
  protected linkPath = linkName;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected halService: HALEndpointService,
    protected objectCache: ObjectCacheService,
    protected comparator: DefaultChangeAnalyzer<ClruaModel>,
    protected http: HttpClient,
    protected notificationsService: NotificationsService,
  ) {
    super(linkName, requestService, rdbService, objectCache, halService, undefined);
  }
}
