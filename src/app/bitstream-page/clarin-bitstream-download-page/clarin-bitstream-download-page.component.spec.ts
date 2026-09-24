import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Route,
  Router,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { accessTokenResolver } from '../../core/auth/access-token.resolver';
import { AuthService } from '../../core/auth/auth.service';
import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { RequestService } from '../../core/data/request.service';
import { RequestEntryState } from '../../core/data/request-entry-state.model';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { Bitstream } from '../../core/shared/bitstream.model';
import {
  AUTHORIZATION_DENIED_EXCEPTION,
  DOWNLOAD_TOKEN_EXPIRED_EXCEPTION,
  HTTP_STATUS_UNAUTHORIZED,
  MISSING_LICENSE_AGREEMENT_EXCEPTION,
} from '../../core/shared/clarin/constants';
import { FileService } from '../../core/shared/file.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { getMockRequestService } from '../../shared/mocks/request.service.mock';
import {
  createFailedRemoteDataObject,
  createSuccessfulRemoteDataObject,
} from '../../shared/remote-data.utils';
import { ROUTES } from '../bitstream-page-routes';
import { ClarinBitstreamDownloadPageComponent } from './clarin-bitstream-download-page.component';

describe('bitstream-page :id/download route', () => {
  it('should resolve the request-a-copy access token', () => {
    const downloadRoute: Route = ROUTES.find((route: Route) => route.path === ':id/download');

    expect(downloadRoute).toBeTruthy();
    expect(downloadRoute.resolve.itemRequest).toBe(accessTokenResolver);
  });
});

describe('ClarinBitstreamDownloadPageComponent', () => {
  let component: ClarinBitstreamDownloadPageComponent;
  let fixture: ComponentFixture<ClarinBitstreamDownloadPageComponent>;

  let authService;
  let authorizationService;
  let fileService;
  let hardRedirectService;
  let halService;
  let rdbService;
  let requestService;
  let router;
  let activatedRoute;
  let bitstream: Bitstream;

  const accessToken = '0a64b3f2-1f18-4d1a-9b6f-4f0a2d3e77c1';
  const contentHref = 'bitstream-content-link';

  beforeEach(async () => {
    bitstream = Object.assign(new Bitstream(), {
      uuid: 'bitstreamUuid',
      _links: {
        content: { href: contentHref },
        self: { href: 'bitstream-self-link' },
      },
    });

    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: of(false),
      setRedirectUrl: {},
    });
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: of(false),
    });
    fileService = jasmine.createSpyObj('fileService', {
      retrieveFileDownloadLink: of('content-url-with-headers'),
    });
    hardRedirectService = jasmine.createSpyObj('hardRedirectService', {
      redirect: {},
    });
    halService = jasmine.createSpyObj('halService', {
      getRootHref: 'rest-api',
    });
    // A request-a-copy grantee has no READ policy, so the CLARIN gate refuses before any license check
    rdbService = jasmine.createSpyObj('rdbService', {
      buildFromRequestUUID: of(createFailedRemoteDataObject(
        AUTHORIZATION_DENIED_EXCEPTION + ' for action READ on BITSTREAM', HTTP_STATUS_UNAUTHORIZED)),
    });
    requestService = getMockRequestService();
    router = jasmine.createSpyObj('router', ['navigateByUrl']);
    activatedRoute = {
      data: of({ bitstream: createSuccessfulRemoteDataObject(bitstream) }),
      snapshot: { queryParams: {} },
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ClarinBitstreamDownloadPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: FileService, useValue: fileService },
        { provide: HardRedirectService, useValue: hardRedirectService },
        { provide: HALEndpointService, useValue: halService },
        { provide: RemoteDataBuildService, useValue: rdbService },
        { provide: RequestService, useValue: requestService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinBitstreamDownloadPageComponent);
    component = fixture.componentInstance;
  });

  it('should send the access token with the content request when the CLARIN gate refuses', () => {
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };

    component.ngOnInit();

    expect(hardRedirectService.redirect).toHaveBeenCalledWith(contentHref + '?accessToken=' + accessToken);
    expect(component.downloadStatus.value).toEqual('Success');
  });

  it('should still show the licence agreement when the licence is what is missing', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createFailedRemoteDataObject(
      MISSING_LICENSE_AGREEMENT_EXCEPTION, HTTP_STATUS_UNAUTHORIZED)));
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };

    component.ngOnInit();

    expect(hardRedirectService.redirect).not.toHaveBeenCalled();
    expect(component.downloadStatus.value).toEqual(MISSING_LICENSE_AGREEMENT_EXCEPTION);
  });

  it('should keep refusing the download when no access token is in the URL', () => {
    activatedRoute.snapshot.queryParams = {};

    component.ngOnInit();

    expect(hardRedirectService.redirect).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.downloadStatus.value).toEqual(AUTHORIZATION_DENIED_EXCEPTION);
  });

  describe('processClarinAuthorization', () => {
    /**
     * A CLARIN authorization response that failed with 401 and the given exception message.
     */
    function clarinFailure(errorMessage: string) {
      return createFailedRemoteDataObject(errorMessage, HTTP_STATUS_UNAUTHORIZED);
    }

    it('should authorize and flag success on 200', () => {
      expect(component.processClarinAuthorization(createSuccessfulRemoteDataObject({}))).toBeTrue();
      expect(component.downloadStatus.value).toEqual(RequestEntryState.Success);
    });

    it('should ask for the licence agreement on MissingLicenseAgreementException', () => {
      expect(component.processClarinAuthorization(clarinFailure(MISSING_LICENSE_AGREEMENT_EXCEPTION))).toBeFalse();
      expect(component.downloadStatus.value).toEqual(MISSING_LICENSE_AGREEMENT_EXCEPTION);
    });

    it('should show the expired token page on DownloadTokenExpiredException', () => {
      expect(component.processClarinAuthorization(clarinFailure(DOWNLOAD_TOKEN_EXPIRED_EXCEPTION))).toBeFalse();
      expect(component.downloadStatus.value).toEqual(DOWNLOAD_TOKEN_EXPIRED_EXCEPTION);
    });

    it('should show the denial page when the message starts with the denial prefix', () => {
      expect(component.processClarinAuthorization(clarinFailure(AUTHORIZATION_DENIED_EXCEPTION + ': READ'))).toBeFalse();
      expect(component.downloadStatus.value).toEqual(AUTHORIZATION_DENIED_EXCEPTION);
    });

    it('should fall back to the error state for a failure that is not a 401', () => {
      expect(component.processClarinAuthorization(createFailedRemoteDataObject('Server error', 500))).toBeFalse();
      expect(component.downloadStatus.value).toEqual(RequestEntryState.Error);
    });
  });
});
