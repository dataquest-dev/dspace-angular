import { Component, OnInit } from '@angular/core';
import {GetRequest} from '../../core/data/request.models';
import {getFirstCompletedRemoteData} from '../../core/shared/operators';
import {hasSucceeded} from '../../core/data/request.reducer';
import {ActivatedRoute, Router} from '@angular/router';
import {RequestService} from '../../core/data/request.service';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {RemoteDataBuildService} from '../../core/cache/builders/remote-data-build.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'ds-autoregistration',
  templateUrl: './autoregistration.component.html',
  styleUrls: ['./autoregistration.component.scss']
})
export class AutoregistrationComponent implements OnInit {

  verificationToken = '';

  constructor(protected router: Router,
    public route: ActivatedRoute,
    private requestService: RequestService,
    protected halService: HALEndpointService,
    protected rdbService: RemoteDataBuildService,
    private notificationService: NotificationsService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    // Retrieve the token from the request param and send the autoregistration request
    this.verificationToken = this.route?.snapshot?.queryParams?.['verification-token'];
    this.sendAutoregistrationRequest();
  }

  public sendAutoregistrationRequest() {
    const requestId = this.requestService.generateRequestId();

    const url = this.halService.getRootHref() + '/autoregistration?verification-token=' + this.verificationToken;
    const getRequest = new GetRequest(requestId, url);
    // Send POST request
    this.requestService.send(getRequest);
    // Get response
    const response = this.rdbService.buildFromRequestUUID(requestId);
    // Process response
    response
      .pipe(getFirstCompletedRemoteData())
      .subscribe(responseRD$ => {
        if (hasSucceeded(responseRD$.state)) {
          this.notificationService.success(this.translateService.instant('clarin.autoregistration.successful.message'));
        } else {
          this.notificationService.error(this.translateService.instant('clarin.autoregistration.error.message'));
        }
        // Redirect to login.
        this.router.navigate(['login']);
      });
  }
}
