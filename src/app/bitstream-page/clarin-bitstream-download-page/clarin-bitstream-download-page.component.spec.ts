/* eslint-disable max-classes-per-file */
import {
  Component,
  Input,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
import { ClarinBitstreamTokenExpiredComponent } from '../clarin-bitstream-token-expired/clarin-bitstream-token-expired.component';
import { ClarinLicenseAgreementPageComponent } from '../clarin-license-agreement-page/clarin-license-agreement-page.component';
import { ClarinBitstreamDownloadPageComponent } from './clarin-bitstream-download-page.component';

@Component({
  selector: 'ds-clarin-license-agreement-page',
  template: '',
})
class LicenceAgreementStubComponent {
  @Input() bitstream$;
  @Input() accessToken: string;
}

@Component({
  selector: 'ds-clarin-bitstream-token-expired',
  template: '',
})
class TokenExpiredStubComponent {
  @Input() bitstream$;
  @Input() accessToken: string;
}

describe('bitstream-page :id/download route', () => {
  it('should not resolve the request-a-copy access token, the page reads it from the URL', () => {
    const downloadRoute: Route = ROUTES.find((route: Route) => route.path === ':id/download');

    expect(downloadRoute).toBeTruthy();
    expect(Object.values(downloadRoute.resolve)).not.toContain(accessTokenResolver);
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
  const dtoken = 'download-token';
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
    // The CLARIN check refuses unless a test says otherwise
    rdbService = jasmine.createSpyObj('rdbService', {
      buildFromRequestUUID: of(createFailedRemoteDataObject(
        AUTHORIZATION_DENIED_EXCEPTION + ' for action READ on BITSTREAM', HTTP_STATUS_UNAUTHORIZED)),
    });
    requestService = getMockRequestService();
    router = jasmine.createSpyObj('router', ['navigateByUrl']);
    router.url = '/bitstreams/bitstreamUuid/download';
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
    }).overrideComponent(ClarinBitstreamDownloadPageComponent, {
      remove: { imports: [ClarinLicenseAgreementPageComponent, ClarinBitstreamTokenExpiredComponent] },
      add: { imports: [LicenceAgreementStubComponent, TokenExpiredStubComponent] },
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinBitstreamDownloadPageComponent);
    component = fixture.componentInstance;
    // The real method leaves the test page, so the tests only record the url
    spyOn(component, 'redirectToContent');
  });

  /**
   * The url of the CLARIN authorization request the page sent.
   */
  function clarinCheckUrl(): string {
    return requestService.send.calls.mostRecent().args[0].href;
  }

  it('should ask the CLARIN check with the access token', () => {
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };

    component.ngOnInit();

    expect(clarinCheckUrl()).toEqual('rest-api/authrn/bitstreamUuid?accessToken=' + accessToken);
  });

  it('should ask the CLARIN check with the dtoken and the access token', () => {
    activatedRoute.snapshot.queryParams = { dtoken: dtoken, accessToken: accessToken };

    component.ngOnInit();

    expect(clarinCheckUrl()).toEqual('rest-api/authrn/bitstreamUuid?dtoken=' + dtoken + '&accessToken=' + accessToken);
  });

  it('should show the licence agreement and hand it the access token', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createFailedRemoteDataObject(
      MISSING_LICENSE_AGREEMENT_EXCEPTION, HTTP_STATUS_UNAUTHORIZED)));
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };

    fixture.detectChanges();

    expect(component.downloadStatus.value).toEqual(MISSING_LICENSE_AGREEMENT_EXCEPTION);
    expect(component.redirectToContent).not.toHaveBeenCalled();
    expect(hardRedirectService.redirect).not.toHaveBeenCalled();
    const licencePage = fixture.debugElement.query(By.directive(LicenceAgreementStubComponent));
    expect(licencePage.componentInstance.accessToken).toEqual(accessToken);
  });

  it('should hand the access token to the expired download token page', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createFailedRemoteDataObject(
      DOWNLOAD_TOKEN_EXPIRED_EXCEPTION, HTTP_STATUS_UNAUTHORIZED)));
    activatedRoute.snapshot.queryParams = { dtoken: dtoken, accessToken: accessToken };

    fixture.detectChanges();

    const expiredPage = fixture.debugElement.query(By.directive(TokenExpiredStubComponent));
    expect(expiredPage.componentInstance.accessToken).toEqual(accessToken);
  });

  it('should come back with the access token after the login', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createFailedRemoteDataObject(
      'Anonymous user cannot download this bitstream', HTTP_STATUS_UNAUTHORIZED)));
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };
    router.url = '/bitstreams/bitstreamUuid/download?accessToken=' + accessToken;

    component.ngOnInit();

    expect(authService.setRedirectUrl).toHaveBeenCalledWith('/bitstreams/bitstreamUuid/download?accessToken=' + accessToken);
    expect(router.navigateByUrl).toHaveBeenCalledWith('login');
    expect(component.redirectToContent).not.toHaveBeenCalled();
  });

  it('should download with the dtoken and the access token once the CLARIN check passes', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createSuccessfulRemoteDataObject({})));
    activatedRoute.snapshot.queryParams = { dtoken: dtoken, accessToken: accessToken };

    component.ngOnInit();

    expect(component.redirectToContent).toHaveBeenCalledWith(
      contentHref + '?dtoken=' + dtoken + '&accessToken=' + accessToken);
  });

  it('should download through the file link with the access token for a logged-in user', () => {
    authService.isAuthenticated.and.returnValue(of(true));
    fileService.retrieveFileDownloadLink.and.returnValue(of(contentHref + '?authentication-token=short-lived'));
    rdbService.buildFromRequestUUID.and.returnValue(of(createSuccessfulRemoteDataObject({})));
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };

    component.ngOnInit();

    expect(component.redirectToContent).toHaveBeenCalledWith(
      contentHref + '?authentication-token=short-lived&accessToken=' + accessToken);
  });

  it('should show the denial page and not download when the CLARIN check refuses the access token', () => {
    activatedRoute.snapshot.queryParams = { accessToken: accessToken };

    component.ngOnInit();

    expect(component.downloadStatus.value).toEqual(AUTHORIZATION_DENIED_EXCEPTION);
    expect(component.redirectToContent).not.toHaveBeenCalled();
    expect(hardRedirectService.redirect).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should still show the licence agreement when no access token is in the URL', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createFailedRemoteDataObject(
      MISSING_LICENSE_AGREEMENT_EXCEPTION, HTTP_STATUS_UNAUTHORIZED)));
    activatedRoute.snapshot.queryParams = {};

    fixture.detectChanges();

    expect(clarinCheckUrl()).toEqual('rest-api/authrn/bitstreamUuid');
    expect(component.redirectToContent).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.downloadStatus.value).toEqual(MISSING_LICENSE_AGREEMENT_EXCEPTION);
    const licencePage = fixture.debugElement.query(By.directive(LicenceAgreementStubComponent));
    expect(licencePage.componentInstance.accessToken).toBeNull();
  });

  it('should download with only the dtoken when no access token is in the URL', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createSuccessfulRemoteDataObject({})));
    activatedRoute.snapshot.queryParams = { dtoken: dtoken };

    component.ngOnInit();

    expect(clarinCheckUrl()).toEqual('rest-api/authrn/bitstreamUuid?dtoken=' + dtoken);
    expect(component.redirectToContent).toHaveBeenCalledWith(contentHref + '?dtoken=' + dtoken);
  });

  it('should send an anonymous user without an access token to the login page', () => {
    rdbService.buildFromRequestUUID.and.returnValue(of(createFailedRemoteDataObject(
      'Unauthorized', HTTP_STATUS_UNAUTHORIZED)));
    activatedRoute.snapshot.queryParams = {};

    component.ngOnInit();

    expect(component.redirectToContent).not.toHaveBeenCalled();
    expect(authService.setRedirectUrl).toHaveBeenCalledWith('/bitstreams/bitstreamUuid/download');
    expect(router.navigateByUrl).toHaveBeenCalledWith('login');
  });

  it('should keep refusing the download when no access token is in the URL', () => {
    activatedRoute.snapshot.queryParams = {};

    component.ngOnInit();

    expect(component.redirectToContent).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.downloadStatus.value).toEqual(AUTHORIZATION_DENIED_EXCEPTION);
  });

  describe('addDownloadParams', () => {
    it('should add the dtoken and the access token with the right separator', () => {
      component.dtoken = dtoken;
      component.accessToken = 'a+b';

      expect(component.addDownloadParams('content')).toEqual('content?dtoken=' + dtoken + '&accessToken=a%2Bb');
      expect(component.addDownloadParams('content?authentication-token=t'))
        .toEqual('content?authentication-token=t&dtoken=' + dtoken + '&accessToken=a%2Bb');
    });

    it('should leave the url alone without tokens', () => {
      component.dtoken = null;
      component.accessToken = null;

      expect(component.addDownloadParams('content')).toEqual('content');
    });
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
