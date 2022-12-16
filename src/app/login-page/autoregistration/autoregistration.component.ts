import { Component, OnInit } from '@angular/core';
import {DeleteRequest, FindListOptions, GetRequest, PostRequest} from '../../core/data/request.models';
import {
  getAllCompletedRemoteData,
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteListPayload
} from '../../core/shared/operators';
import {hasSucceeded} from '../../core/data/request.reducer';
import {ActivatedRoute, Router} from '@angular/router';
import {RequestService} from '../../core/data/request.service';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {RemoteDataBuildService} from '../../core/cache/builders/remote-data-build.service';
import {TranslateService} from '@ngx-translate/core';
import {AuthenticateAction, AuthenticatedAction} from '../../core/auth/auth.actions';
import {Store} from '@ngrx/store';
import {CoreState} from '../../core/core.reducers';
import {BehaviorSubject} from 'rxjs';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {ClarinVerificationTokenDataService} from '../../core/data/clarin/clarin-verification-token-data.service';
import {ClarinVerificationToken} from '../../core/shared/clarin/clarin-verification-token.model';
import {RequestParam} from '../../core/cache/models/request-param.model';
import {HttpOptions} from '../../core/dspace-rest/dspace-rest.service';
import {HttpHeaders} from '@angular/common/http';
import {AuthTokenInfo} from '../../core/auth/models/auth-token-info.model';
import {isEmpty, isNotNull, isNotUndefined, isNull} from '../../shared/empty.util';
import {CLARIN_VERIFICATION_TOKEN} from '../../core/shared/clarin/clarin-verification-token.resource-type';

@Component({
  selector: 'ds-autoregistration',
  templateUrl: './autoregistration.component.html',
  styleUrls: ['./autoregistration.component.scss']
})
export class AutoregistrationComponent implements OnInit {

  verificationToken = '';
  // dspace.name in cfg
  dspaceName$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  verificationToken$: BehaviorSubject<ClarinVerificationToken> = new BehaviorSubject<ClarinVerificationToken>(null);
  shibHeaders$: BehaviorSubject<ShibHeader[]> = new BehaviorSubject<ShibHeader[]>(null);

  constructor(protected router: Router,
    public route: ActivatedRoute,
    private requestService: RequestService,
    protected halService: HALEndpointService,
    protected rdbService: RemoteDataBuildService,
    private notificationService: NotificationsService,
    private translateService: TranslateService,
    private configurationService: ConfigurationDataService,
    private verificationTokenService: ClarinVerificationTokenDataService,
    private store: Store<CoreState>
  ) { }

  private loadRepositoryName() {
    this.configurationService.findByPropertyName('dspace.name')
      .pipe(getFirstCompletedRemoteData())
      .subscribe(res => {
        this.dspaceName$.next(res?.payload?.values?.[0]);
      });
  }
  ngOnInit(): void {
    // Retrieve the token from the request param and send the autoregistration request
    this.verificationToken = this.route?.snapshot?.queryParams?.['verification-token'];
    this.loadRepositoryName();
    this.loadVerificationToken();
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
          // Call autologin
          this.sendAutoLoginRequest();
        } else {
          this.notificationService.error(this.translateService.instant('clarin.autoregistration.error.message'));
        }
      });
  }

  public autologin() {
    this.sendAutoregistrationRequest();
  }

  private sendAutoLoginRequest() {
    // Prepare request headers
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    headers = headers.append('verification-token', this.verificationToken);
    options.headers = headers;
    options.responseType = 'text';
    // Prepare request
    const requestId = this.requestService.generateRequestId();
    const url = this.halService.getRootHref() + '/authn/shibboleth';
    const postRequest = new PostRequest(requestId, url, {}, options);
    // Send POST request
    this.requestService.send(postRequest);
    // Get response
    const response = this.rdbService.buildFromRequestUUID(requestId);
    // Process response
    response
      .pipe(getFirstCompletedRemoteData())
      .subscribe(responseRD$ => {
        console.log('authResponse', responseRD$);
        if (hasSucceeded(responseRD$.state)) {
          const token = Object.values(responseRD$?.payload).join('');
          console.log('token', token);
          const authToken = new AuthTokenInfo(token);
          this.deleteVerificationToken();
          this.store.dispatch(new AuthenticatedAction(authToken));
          this.router.navigate(['home']);
        }
      });
  }

  private deleteVerificationToken() {
    this.verificationTokenService.delete(this.verificationToken$.value.id)
      .pipe(getFirstCompletedRemoteData());
  }

  loadVerificationToken() {
    this.verificationTokenService.searchBy('byToken', this.createSearchOptions(this.verificationToken))
      .pipe(getFirstSucceededRemoteListPayload())
      .subscribe(res => {
        if (isEmpty(res?.[0])) {
          return;
        }
        this.verificationToken$.next(res?.[0]);
        this.loadShibHeaders(this.verificationToken$?.value?.shibHeaders);
      });
  }

  private loadShibHeaders(shibHeadersStr: string) {
    const shibHeaders: ShibHeader[] = [];

    const splited = shibHeadersStr?.split('\n');
    splited.forEach(headerAndValue => {
      const endHeaderIndex = headerAndValue.indexOf('=');
      const startValueIndex = endHeaderIndex + 1;

      const header = headerAndValue.substr(0, endHeaderIndex);
      const value = headerAndValue.substr(startValueIndex);

      // Because cookie is big message
      if (header === 'cookie') {
        return;
      }
      const shibHeader: ShibHeader = Object.assign({}, {
        header: header,
        value: value
      });
      shibHeaders.push(shibHeader);
    });

    this.shibHeaders$.next(shibHeaders);
  }

  private createSearchOptions(token: string) {
    const params = [];
    params.push(new RequestParam('token', token));
    return Object.assign(new FindListOptions(), {
      searchParams: [...params]
    });
  }
}

export interface ShibHeader {
  header: string;
  value: string;
}
