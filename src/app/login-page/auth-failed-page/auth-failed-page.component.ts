import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {ConfigurationProperty} from '../../core/shared/configuration-property.model';
import {HELP_DESK_PROPERTY} from '../../item-page/tombstone/tombstone.component';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {FindListOptions, PostRequest} from '../../core/data/request.models';
import {
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload,
  getFirstSucceededRemoteListPayload
} from '../../core/shared/operators';
import {isNotEmpty} from '../../shared/empty.util';
import {RequestService} from '../../core/data/request.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {RemoteDataBuildService} from '../../core/cache/builders/remote-data-build.service';
import {map} from 'rxjs/operators';
import {hasSucceeded} from '../../core/data/request.reducer';
import {ClarinVerificationTokenDataService} from '../../core/data/clarin/clarin-verification-token-data.service';
import {ClarinVerificationToken} from '../../core/shared/clarin/clarin-verification-token.model';
import {RequestParam} from '../../core/cache/models/request-param.model';
import {EPersonDataService} from '../../core/eperson/eperson-data.service';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'ds-auth-failed-page',
  templateUrl: './auth-failed-page.component.html',
  styleUrls: ['./auth-failed-page.component.scss']
})
export class AuthFailedPageComponent implements OnInit {

  verificationToken$: BehaviorSubject<ClarinVerificationToken> =
    new BehaviorSubject<ClarinVerificationToken>(null);

  netid = '';
  email = '';

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  constructor(
    protected configurationDataService: ConfigurationDataService,
    protected router: Router,
    public route: ActivatedRoute,
    private requestService: RequestService,
    protected halService: HALEndpointService,
    protected rdbService: RemoteDataBuildService,
    protected configurationService: ConfigurationDataService,
    protected clarinVerificationTokenService: ClarinVerificationTokenDataService,
    protected epersonService: EPersonDataService,
    private notificationService: NotificationsService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadHelpDeskEmail();
    this.loadUserByNetId();

    // Load the netid, email, fname, lname from the token table, the token table is associated with the eperson.
    this.netid = this.route.snapshot.queryParams.netid;
  }

  public hasEmail() {
    return isNotEmpty(this.verificationToken$?.value?.email);
  }
  public sendEmail() {
    const requestId = this.requestService.generateRequestId();

    const url = this.halService.getRootHref() + '/autoregistration?netid=' + this.netid + '&email=' + this.email;
    const postRequest = new PostRequest(requestId, url);
    // Send POST request
    this.requestService.send(postRequest);
    // Get response
    const response = this.rdbService.buildFromRequestUUID(requestId);
    // Process response
    response
      .pipe(getFirstCompletedRemoteData())
      .subscribe(responseRD$ => {
        if (hasSucceeded(responseRD$.state)) {
          this.notificationService.success(
            this.translateService.instant('clarin.auth-failed.send-email.successful.message'));
        } else {
          this.notificationService.error(
            this.translateService.instant('clarin.auth-failed.send-email.error.message'));
        }
      });
  }


  public redirectToLogin() {
    this.router.navigate(['login']);
  }

  private loadHelpDeskEmail() {
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
  }

  private loadUserByNetId() {
    this.clarinVerificationTokenService.searchBy('byNetId', this.createSearchOptions('123456'), false)
      .pipe(getFirstSucceededRemoteListPayload())
      .subscribe(res => {
        this.verificationToken$.next(res?.[0]);
        if (this.hasEmail()) {
          this.email = this.verificationToken$.value.email;
        }
      });
  }

  private createSearchOptions(netid: string) {
    const params = [];
    params.push(new RequestParam('netid', netid));
    return Object.assign(new FindListOptions(), {
      searchParams: [...params]
    });
  }

}
