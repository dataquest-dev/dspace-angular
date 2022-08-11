import {GetRequest} from '../data/request.models';
import {GenericConstructor} from './generic-constructor';
import {ResponseParsingService} from '../data/parsing.service';
import {RegistrationResponseParsingService} from '../data/registration-response-parsing.service';
import {Injectable, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {RouteService} from '../services/route.service';
import {RequestService} from '../data/request.service';
import {RemoteDataBuildService} from '../cache/builders/remote-data-build.service';
import {LinkService} from '../cache/builders/link.service';
import {HALEndpointService} from './hal-endpoint.service';
import {CommunityDataService} from '../data/community-data.service';
import {DSpaceObjectDataService} from '../data/dspace-object-data.service';
import {PaginationService} from '../pagination/pagination.service';
import {SearchConfigurationService} from './search/search-configuration.service';
import {take, takeWhile} from 'rxjs/operators';
import {RemoteData} from '../data/remote-data';
import {NotificationOptions} from '../../shared/notifications/models/notification-options.model';
import {getAllSucceededRemoteDataPayload} from './operators';
import {Simulate} from 'react-dom/test-utils';
import waiting = Simulate.waiting;
import {HelpDesk} from './help-desk';
import {Observable} from 'rxjs';

/**
 * Service that performs all general actions that have to do with the search page
 */
@Injectable()
export class HelpDeskService {

  constructor(private router: Router,
              protected rdbService: RemoteDataBuildService,
              protected requestService: RequestService,
  ) { }

  getHelpDeskMail(): Observable<RemoteData<HelpDesk>> {
    const requestId = this.requestService.generateRequestId();
    const request = new GetRequest(requestId, 'http://localhost:8080/server/api/help-desk');

    // send GET request
    this.requestService.send(request, true);

    // load and return the response from the request based on the requestId
    return this.rdbService.buildFromRequestUUID<HelpDesk>(requestId);
  }

}
