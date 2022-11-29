import {Injectable} from '@angular/core';
import {dataService} from '../cache/builders/build-decorators';
import {DataService} from '../data/data.service';
import {RequestService} from '../data/request.service';
import {RemoteDataBuildService} from '../cache/builders/remote-data-build.service';
import {Store} from '@ngrx/store';
import {CoreState} from '../core.reducers';
import {HALEndpointService} from '../shared/hal-endpoint.service';
import {ObjectCacheService} from '../cache/object-cache.service';
import {DefaultChangeAnalyzer} from '../data/default-change-analyzer.service';
import {HttpClient} from '@angular/common/http';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {AuthrnBitstream} from '../shared/clarin/bitstream-authorization.model';

export const linkName = 'authrn';

/**
 */
@Injectable()
@dataService(AuthrnBitstream.type)
export class BitstreamAuthorizationService extends DataService<AuthrnBitstream> {
  protected linkPath = linkName;

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected halService: HALEndpointService,
    protected objectCache: ObjectCacheService,
    protected comparator: DefaultChangeAnalyzer<AuthrnBitstream>,
    protected http: HttpClient,
    protected notificationsService: NotificationsService,
  ) {
    super();
  }
}
