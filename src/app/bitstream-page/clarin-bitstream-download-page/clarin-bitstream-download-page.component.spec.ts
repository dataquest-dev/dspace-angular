import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

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
import { getMockRemoteDataBuildService } from '../../shared/mocks/remote-data-build.service.mock';
import { getMockRequestService } from '../../shared/mocks/request.service.mock';
import {
  createFailedRemoteDataObject,
  createSuccessfulRemoteDataObject,
} from '../../shared/remote-data.utils';
import { HALEndpointServiceStub } from '../../shared/testing/hal-endpoint-service.stub';
import { ClarinBitstreamDownloadPageComponent } from './clarin-bitstream-download-page.component';

describe('ClarinBitstreamDownloadPageComponent', () => {
  let component: ClarinBitstreamDownloadPageComponent;
  let fixture: ComponentFixture<ClarinBitstreamDownloadPageComponent>;

  let authService: AuthService;
  let fileService: FileService;
  let authorizationService: AuthorizationDataService;
  let hardRedirectService: HardRedirectService;
  let activatedRoute;
  let router;
  let requestService: RequestService;
  let halService: HALEndpointService;
  let rdbService: RemoteDataBuildService;

  let bitstream: Bitstream;

  const url = 'fake-bitstream-url';

  /**
   * A CLARIN authorization response that failed with 401 and the given exception message.
   */
  function clarinFailure(errorMessage: string) {
    return createFailedRemoteDataObject(errorMessage, HTTP_STATUS_UNAUTHORIZED);
  }

  beforeEach(async () => {
    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: of(true),
      setRedirectUrl: {},
    });
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: of(true),
    });
    fileService = jasmine.createSpyObj('fileService', {
      retrieveFileDownloadLink: of('content-url-with-headers'),
    });
    hardRedirectService = jasmine.createSpyObj('hardRedirectService', {
      redirect: {},
    });
    bitstream = Object.assign(new Bitstream(), {
      uuid: 'bitstreamUuid',
      _links: {
        content: { href: 'bitstream-content-link' },
        self: { href: 'bitstream-self-link' },
      },
    });
    activatedRoute = {
      data: of({
        bitstream: createSuccessfulRemoteDataObject(bitstream),
      }),
      snapshot: {
        queryParams: new Map([
          ['redirectUrl', url],
        ]),
      },
    };
    router = jasmine.createSpyObj('router', ['navigateByUrl']);
    requestService = getMockRequestService();
    halService = Object.assign(new HALEndpointServiceStub(url));
    rdbService = getMockRemoteDataBuildService();

    await TestBed.configureTestingModule({
      imports: [
        ClarinBitstreamDownloadPageComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: AuthService, useValue: authService },
        { provide: HardRedirectService, useValue: hardRedirectService },
        { provide: RequestService, useValue: requestService },
        { provide: HALEndpointService, useValue: halService },
        { provide: RemoteDataBuildService, useValue: rdbService },
        { provide: FileService, useValue: fileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinBitstreamDownloadPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('processClarinAuthorization', () => {
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
