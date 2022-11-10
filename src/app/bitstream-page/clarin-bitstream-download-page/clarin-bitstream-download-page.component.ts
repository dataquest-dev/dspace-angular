import { Component, OnInit } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Bitstream} from '../../core/shared/bitstream.model';
import {RemoteData} from '../../core/data/remote-data';
import {AuthService} from '../../core/auth/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filter, map, take} from 'rxjs/operators';
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
import {isNotNull, isNull, isUndefined} from '../../shared/empty.util';
import {isEqual} from 'lodash';
import {HttpOptions} from '../../core/dspace-rest/dspace-rest.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {AuthrnBitstream} from '../../core/shared/clarin/bitstream-authorization.model';

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
    private bitstreamAuthService: BitstreamAuthorizationService,
    private hardRedirectService: HardRedirectService,
    private bitstreamService: BitstreamDataService,
    private requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected halService: HALEndpointService
  ) { }

  ngOnInit(): void {
    // Get dtoken
    this.dtoken = isUndefined(this.route.snapshot.queryParams.dtoken) ? null : this.route.snapshot.queryParams.dtoken;
    // authorize
    // get response
    // action based on the response
    // this.bitstreamAuthService.findById()
    this.bitstreamRD$ = this.route.data.pipe(
      map((data) => data.bitstream));

    this.bitstream$ = this.bitstreamRD$.pipe(
      redirectOn4xx(this.router, this.auth),
      getRemoteDataPayload()
    );

    let bitstream: Bitstream;
    const requestId = this.requestService.generateRequestId();
    this.bitstream$.subscribe(bitstreamSubscribed => {
      bitstream = bitstreamSubscribed;
      let authorizationUrl = '';
      // Get Authorization Bitstream endpoint url
      authorizationUrl = this.halService.getRootHref() + '/' + AuthrnBitstream.type.value + '/' + bitstream.uuid;

      // Add token to the url or not
      authorizationUrl = isNotNull(this.dtoken) ? authorizationUrl + '?dtoken=' + this.dtoken : authorizationUrl;

      const headRequest = new GetRequest(requestId, authorizationUrl);
      this.requestService.send(headRequest);
    });

    // Process the response - download the bitstream or make some authorization steps
    this.requestService.getByUUID(requestId)
      .pipe(
        filter((res: RequestEntry) => hasCompleted(res.state))
      ).subscribe(requestEntry => {
        console.log('requestEntry', requestEntry);
        if (isEqual(requestEntry.response?.statusCode, 200)) {
          // User is authorized -> start downloading
          this.hardRedirectService.redirect(bitstream?._links?.content?.href);
          this.downloadStatus.next(RequestEntryState.Success);
          return;
        } else if (hasFailed(requestEntry.state)) {
          // User is not authorized
          if (requestEntry.response?.statusCode === HTTP_STATUS_UNAUTHORIZED) {
            switch (requestEntry.response?.errorMessage) {
              case MISSING_LICENSE_AGREEMENT_EXCEPTION:
                this.downloadStatus.next(MISSING_LICENSE_AGREEMENT_EXCEPTION);
                console.log('MissingLicenseAgreementException');
                return;
              case DOWNLOAD_TOKEN_EXPIRED_EXCEPTION:
                this.downloadStatus.next(DOWNLOAD_TOKEN_EXPIRED_EXCEPTION);
                console.log('DownloadTokenExpiredException');
                return;
              default:
                this.downloadStatus.next(HTTP_STATUS_UNAUTHORIZED.toString());
                console.log(requestEntry);
                this.auth.setRedirectUrl(this.router.url);
                this.router.navigateByUrl('login');
                return;
            }
          }
          // Another failure reason show error page
          this.downloadStatus.next(RequestEntryState.Error);
          console.log(requestEntry);
          return;
        }
      });
  }
}
