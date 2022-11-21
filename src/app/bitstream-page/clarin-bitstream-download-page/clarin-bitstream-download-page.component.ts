import { Component, OnInit } from '@angular/core';
import {BehaviorSubject, combineLatest as observableCombineLatest, Observable, of as observableOf} from 'rxjs';
import {Bitstream} from '../../core/shared/bitstream.model';
import {RemoteData} from '../../core/data/remote-data';
import {AuthService} from '../../core/auth/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {getFirstCompletedRemoteData, getRemoteDataPayload, redirectOn4xx} from '../../core/shared/operators';
import {BitstreamAuthorizationService} from '../../core/auth/bitstream-authorization.service';
import {HardRedirectService} from '../../core/services/hard-redirect.service';
import {BitstreamDataService} from '../../core/data/bitstream-data.service';
import {DeleteRequest, GetRequest, HeadRequest} from '../../core/data/request.models';
import {RequestService} from '../../core/data/request.service';
import {hasCompleted, hasFailed, hasSucceeded, RequestEntry, RequestEntryState} from '../../core/data/request.reducer';
import {
  DOWNLOAD_TOKEN_EXPIRED_EXCEPTION,
  HTTP_STATUS_UNAUTHORIZED,
  MISSING_LICENSE_AGREEMENT_EXCEPTION
} from '../../core/shared/clarin/constants';
import {RemoteDataBuildService} from '../../core/cache/builders/remote-data-build.service';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {Group} from '../../core/eperson/models/group.model';
import {hasValue, isNotEmpty, isNotNull, isNull, isUndefined} from '../../shared/empty.util';
import {isEqual} from 'lodash';
import {HttpOptions} from '../../core/dspace-rest/dspace-rest.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {AuthrnBitstream} from '../../core/shared/clarin/bitstream-authorization.model';
import {FeatureID} from '../../core/data/feature-authorization/feature-id';
import {AuthorizationDataService} from '../../core/data/feature-authorization/authorization-data.service';
import {FileService} from '../../core/shared/file.service';
import {getForbiddenRoute} from '../../app-routing-paths';

@Component({
  selector: 'ds-clarin-bitstream-download-page',
  templateUrl: './clarin-bitstream-download-page.component.html',
  styleUrls: ['./clarin-bitstream-download-page.component.scss']
})
export class ClarinBitstreamDownloadPageComponent implements OnInit {

  bitstream$: Observable<Bitstream>;
  bitstreamRD$: Observable<RemoteData<Bitstream>>;
  downloadStatus: BehaviorSubject<string> = new BehaviorSubject('');
  dtoken: string;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private auth: AuthService,
    protected authorizationService: AuthorizationDataService,
    private bitstreamAuthService: BitstreamAuthorizationService,
    private hardRedirectService: HardRedirectService,
    private bitstreamService: BitstreamDataService,
    private requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected halService: HALEndpointService,
    private fileService: FileService,
  ) { }

  ngOnInit(): void {
    // Get dtoken
    this.dtoken = isUndefined(this.route.snapshot.queryParams.dtoken) ? null : this.route.snapshot.queryParams.dtoken;

    this.bitstreamRD$ = this.route.data.pipe(
      map((data) => data.bitstream));

    this.route.data.subscribe(data => {
      console.log('routeData', data);
    });

    this.bitstream$ = this.bitstreamRD$.pipe(
      redirectOn4xx(this.router, this.auth),
      getRemoteDataPayload()
    );

    this.bitstream$.pipe(
      switchMap((bitstream: Bitstream) => {
        let authorizationUrl = '';
        // Get Authorization Bitstream endpoint url
        authorizationUrl = this.halService.getRootHref() + '/' + AuthrnBitstream.type.value + '/' + bitstream.uuid;

        // Add token to the url or not
        authorizationUrl = isNotNull(this.dtoken) ? authorizationUrl + '?dtoken=' + this.dtoken : authorizationUrl;

        const requestId = this.requestService.generateRequestId();
        const headRequest = new GetRequest(requestId, authorizationUrl);
        this.requestService.send(headRequest);

        const clarinIsAuthorized$ = this.rdbService.buildFromRequestUUID(requestId);
        const isAuthorized$ = this.authorizationService.isAuthorized(FeatureID.CanDownload, isNotEmpty(bitstream) ? bitstream.self : undefined);
        const isLoggedIn$ = this.auth.isAuthenticated();
        return observableCombineLatest([clarinIsAuthorized$, isAuthorized$, isLoggedIn$, observableOf(bitstream)]);
      }),
      filter(([clarinIsAuthorized, isAuthorized, isLoggedIn, bitstream]: [RemoteData<any>, boolean, boolean, Bitstream]) => hasValue(isAuthorized) && hasValue(isLoggedIn) && hasValue(clarinIsAuthorized)),
      take(1),
      switchMap(([clarinIsAuthorized, isAuthorized, isLoggedIn, bitstream]: [RemoteData<any>, boolean, boolean, Bitstream]) => {
        const isAuthorizedByClarin = this.processClarinAuthorization(clarinIsAuthorized);
        if (isAuthorizedByClarin && isAuthorized && isLoggedIn) {
          return this.fileService.retrieveFileDownloadLink(bitstream._links.content.href).pipe(
            filter((fileLink) => hasValue(fileLink)),
            take(1),
            map((fileLink) => {
              return [isAuthorizedByClarin, isAuthorized, isLoggedIn, bitstream, fileLink];
            }));
        } else {
          return [[isAuthorizedByClarin, isAuthorized, isLoggedIn, bitstream, '']];
        }
      })
    ).subscribe(([isAuthorizedByClarin, isAuthorized, isLoggedIn, bitstream, fileLink]: [boolean, boolean, boolean, Bitstream, string]) => {
      let bitstreamURL = bitstream._links.content.href;
      // Clarin Authorization is approving the user by token
      if (isAuthorizedByClarin) {
        fileLink = isNotNull(this.dtoken) ? fileLink + '?dtoken=' + this.dtoken : fileLink;
        bitstreamURL = isNotNull(this.dtoken) ? bitstreamURL + '?dtoken=' + this.dtoken : bitstreamURL ;
      }
      if ((isAuthorized || isAuthorizedByClarin) && isLoggedIn && isNotEmpty(fileLink)) {
        this.downloadStatus.next(RequestEntryState.Success);
        this.hardRedirectService.redirect(fileLink);
      } else if ((isAuthorized || isAuthorizedByClarin) && !isLoggedIn) {
        this.downloadStatus.next(RequestEntryState.Success);
        this.hardRedirectService.redirect(bitstreamURL);
      } else if (!(isAuthorized || isAuthorizedByClarin) && isLoggedIn) {
        this.downloadStatus.next(HTTP_STATUS_UNAUTHORIZED.toString());
        this.router.navigateByUrl(getForbiddenRoute(), {skipLocationChange: true});
      } else if (!(isAuthorized || isAuthorizedByClarin) && !isLoggedIn) {
        this.auth.setRedirectUrl(this.router.url);
        this.router.navigateByUrl('login');
      }
    });
  }

  processClarinAuthorization(requestEntry: RemoteData<any>) {
    if (isEqual(requestEntry?.statusCode, 200)) {
      // User is authorized -> start downloading
      this.downloadStatus.next(RequestEntryState.Success);
      return true;
    } else if (hasFailed(requestEntry.state)) {
      // User is not authorized
      if (requestEntry?.statusCode === HTTP_STATUS_UNAUTHORIZED) {
        switch (requestEntry?.errorMessage) {
          case MISSING_LICENSE_AGREEMENT_EXCEPTION:
            // Show License Agreement page with required user data for the current license
            this.downloadStatus.next(MISSING_LICENSE_AGREEMENT_EXCEPTION);
            return false;
          case DOWNLOAD_TOKEN_EXPIRED_EXCEPTION:
            // Token is expired or wrong -> try to download without token
            this.downloadStatus.next(DOWNLOAD_TOKEN_EXPIRED_EXCEPTION);
            return false;
          default:
            return false;
        }
      }
      // Another failure reason show error page
      this.downloadStatus.next(RequestEntryState.Error);
      return false;
    }
  }
}