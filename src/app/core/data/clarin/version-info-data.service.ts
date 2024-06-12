import { Injectable } from '@angular/core';
import { dataService } from '../base/data-service.decorator';
import { VersionInfo } from '../../shared/clarin/version-info.model';
import { BaseDataService } from '../base/base-data.service';
import { RequestService } from '../request.service';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { ObjectCacheService } from '../../cache/object-cache.service';
import { HALEndpointService } from '../../shared/hal-endpoint.service';
import { GetRequest } from '../request.models';
import { hasValue } from '../../../shared/empty.util';
import { RemoteData } from '../remote-data';
import { Observable } from 'rxjs';

export const linkName = 'versioninfo';

@Injectable()
@dataService(VersionInfo.type)
export class VersionInfoDataService extends BaseDataService<VersionInfo>{

  protected linkPath = linkName;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected objectCache: ObjectCacheService,
    protected halService: HALEndpointService,
  ) {
    super(linkName, requestService, rdbService, objectCache, halService);
  }

  getVersions(): Observable<RemoteData<VersionInfo>> {
    const requestId = this.requestService.generateRequestId();
    const request = new GetRequest(requestId, this.halService.getRootHref() + '/versioninfo');

    if (hasValue(this.responseMsToLive)) {
      request.responseMsToLive = this.responseMsToLive;
    }

    // Use cache if available - second parameter
    this.requestService.send(request);

    return this.rdbService.buildFromRequestUUID(requestId);
  }
}
