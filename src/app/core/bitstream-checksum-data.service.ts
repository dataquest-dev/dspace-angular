import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { NotificationsService } from '../shared/notifications/notifications.service';
import { dataService } from './cache/builders/build-decorators';
import { RemoteDataBuildService } from './cache/builders/remote-data-build.service';
import { ObjectCacheService } from './cache/object-cache.service';
import { CoreState } from './core-state.model';
import { BaseDataService } from './data/base/base-data.service';
import { linkName } from './data/clarin/clrua-data.service';
import { DefaultChangeAnalyzer } from './data/default-change-analyzer.service';
import { RequestService } from './data/request.service';
import { BitstreamChecksum } from './shared/bitstream-checksum.model';
import { HALEndpointService } from './shared/hal-endpoint.service';

/**
 * A service responsible for fetching BitstreamChecksum objects from the REST API
 */
@Injectable()
@dataService(BitstreamChecksum.type)
export class BitstreamChecksumDataService extends BaseDataService<BitstreamChecksum> {
  protected linkPath = 'checksum';

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected halService: HALEndpointService,
    protected objectCache: ObjectCacheService,
    protected comparator: DefaultChangeAnalyzer<BitstreamChecksum>,
    protected http: HttpClient,
    protected notificationsService: NotificationsService,
  ) {
    super(linkName, requestService, rdbService, objectCache, halService, undefined);
  }
}
