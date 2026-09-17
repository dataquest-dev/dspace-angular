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
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { Bitstream } from '../../core/shared/bitstream.model';
import {
  AUTHORIZATION_DENIED_EXCEPTION,
  HTTP_STATUS_UNAUTHORIZED,
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

  it('should keep refusing the download when no access token is in the URL', () => {
    activatedRoute.snapshot.queryParams = {};

    component.ngOnInit();

    expect(hardRedirectService.redirect).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.downloadStatus.value).toEqual(AUTHORIZATION_DENIED_EXCEPTION);
  });
});
