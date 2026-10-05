import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { BundleDataService } from '../../core/data/bundle-data.service';
import { ClarinLicenseResourceMappingService } from '../../core/data/clarin/clarin-license-resource-mapping-data.service';
import { ClarinUserMetadataDataService } from '../../core/data/clarin/clarin-user-metadata.service';
import { ClarinUserRegistrationDataService } from '../../core/data/clarin/clarin-user-registration.service';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { ItemDataService } from '../../core/data/item-data.service';
import { buildPaginatedList } from '../../core/data/paginated-list.model';
import { RequestService } from '../../core/data/request.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { Bitstream } from '../../core/shared/bitstream.model';
import { ClarinUserMetadata } from '../../core/shared/clarin/clarin-user-metadata.model';
import { FileService } from '../../core/shared/file.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { HtmlContentService } from '../../shared/html-content.service';
import { getMockRemoteDataBuildService } from '../../shared/mocks/remote-data-build.service.mock';
import { getMockRequestService } from '../../shared/mocks/request.service.mock';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import {
  createSuccessfulRemoteDataObject,
  createSuccessfulRemoteDataObject$,
} from '../../shared/remote-data.utils';
import { HALEndpointServiceStub } from '../../shared/testing/hal-endpoint-service.stub';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { ClarinLicenseAgreementPageComponent } from './clarin-license-agreement-page.component';

describe('ClarinLicenseAgreementPageComponent', () => {
  let component: ClarinLicenseAgreementPageComponent;
  let fixture: ComponentFixture<ClarinLicenseAgreementPageComponent>;

  function userMetadata(entries: { metadataKey: string, metadataValue: string }[]) {
    return buildPaginatedList(null, entries.map(entry => Object.assign(new ClarinUserMetadata(), {
      type: ClarinUserMetadata.type,
      ...entry,
    })));
  }

  const emptyList$ = () => createSuccessfulRemoteDataObject$(buildPaginatedList(null, []));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClarinLicenseAgreementPageComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ClarinLicenseResourceMappingService, useValue: jasmine.createSpyObj('clarinLicenseResourceMappingService', { searchBy: emptyList$() }) },
        { provide: ConfigurationDataService, useValue: jasmine.createSpyObj('configurationDataService', { findByPropertyName: createSuccessfulRemoteDataObject$({ values: ['help@example.org'] }) }) },
        { provide: BundleDataService, useValue: jasmine.createSpyObj('bundleDataService', ['findById']) },
        { provide: ClarinUserRegistrationDataService, useValue: jasmine.createSpyObj('clarinUserRegistrationDataService', { searchBy: emptyList$() }) },
        { provide: ClarinUserMetadataDataService, useValue: jasmine.createSpyObj('clarinUserMetadataDataService', { searchBy: emptyList$() }) },
        { provide: ItemDataService, useValue: jasmine.createSpyObj('itemDataService', { searchBy: emptyList$() }) },
        { provide: AuthService, useValue: jasmine.createSpyObj('authService', { isAuthenticated: of(false), getAuthenticatedUserFromStore: of(undefined) }) },
        { provide: HardRedirectService, useValue: jasmine.createSpyObj('hardRedirectService', ['redirect']) },
        { provide: HtmlContentService, useValue: jasmine.createSpyObj('htmlContentService', { getHmtlContentByPathAndLocale: Promise.resolve('') }) },
        { provide: FileService, useValue: jasmine.createSpyObj('fileService', { retrieveFileDownloadLink: of('file-link') }) },
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: RequestService, useValue: getMockRequestService() },
        { provide: RemoteDataBuildService, useValue: getMockRemoteDataBuildService() },
        { provide: HALEndpointService, useValue: new HALEndpointServiceStub('root-url') },
        { provide: Router, useValue: jasmine.createSpyObj('router', ['navigate', 'navigateByUrl']) },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinLicenseAgreementPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getMetadataValueByKey', () => {
    it('should return the value stored under that key', () => {
      component.userMetadata$.next(userMetadata([
        { metadataKey: 'NAME', metadataValue: 'Jan Novak' },
        { metadataKey: 'COUNTRY', metadataValue: 'CZ' },
      ]));

      expect(component.getMetadataValueByKey('COUNTRY')).toEqual('CZ');
    });

    it('should return an empty string for an unknown key', () => {
      component.userMetadata$.next(userMetadata([{ metadataKey: 'NAME', metadataValue: 'Jan Novak' }]));

      expect(component.getMetadataValueByKey('ADDRESS')).toEqual('');
    });
  });

  describe('setMetadataValue', () => {
    it('should overwrite the value of an existing key without adding an entry', () => {
      component.userMetadata$.next(userMetadata([{ metadataKey: 'NAME', metadataValue: 'old' }]));

      component.setMetadataValue('NAME', 'new');

      expect(component.userMetadata$.value.page.length).toEqual(1);
      expect(component.getMetadataValueByKey('NAME')).toEqual('new');
    });

    it('should append an entry for a key that is not there yet', () => {
      component.userMetadata$.next(userMetadata([{ metadataKey: 'NAME', metadataValue: 'Jan Novak' }]));

      component.setMetadataValue('COUNTRY', 'CZ');

      expect(component.userMetadata$.value.page.length).toEqual(2);
      expect(component.getMetadataValueByKey('COUNTRY')).toEqual('CZ');
      expect(component.getMetadataValueByKey('NAME')).toEqual('Jan Novak');
    });
  });

  describe('accept', () => {
    let requestService;
    let hardRedirectService;

    beforeEach(() => {
      requestService = TestBed.inject(RequestService);
      hardRedirectService = TestBed.inject(HardRedirectService);
      (TestBed.inject(HALEndpointService) as any).getRootHref = () => 'root-url';
      (TestBed.inject(Router) as any).routerState = { snapshot: { url: '/bitstreams/bitstream-uuid/download' } };
      spyOn(TestBed.inject(RemoteDataBuildService), 'buildFromRequestUUID')
        .and.returnValue(of(createSuccessfulRemoteDataObject('download-token')));
      component.bitstream$ = of(Object.assign(new Bitstream(), {
        uuid: 'bitstream-uuid',
        _links: { content: { href: 'content-link' } },
      }));
      component.ipAddress$.next('127.0.0.1');
    });

    /**
     * The url of the request that stored the user metadata.
     */
    function manageUrl(): string {
      return requestService.send.calls.mostRecent().args[0].href;
    }

    it('should send the access token to the server and download with both tokens', fakeAsync(() => {
      component.accessToken = 'a+b';

      component.accept();
      flushMicrotasks();

      expect(manageUrl()).toEqual('root-url/core/clarinusermetadata/manage?bitstreamUUID=bitstream-uuid&accessToken=a%2Bb');
      expect(hardRedirectService.redirect).toHaveBeenCalledWith('file-link?dtoken=download-token&accessToken=a%2Bb');
    }));

    it('should download with only the dtoken without an access token', fakeAsync(() => {
      component.accept();
      flushMicrotasks();

      expect(manageUrl()).toEqual('root-url/core/clarinusermetadata/manage?bitstreamUUID=bitstream-uuid');
      expect(hardRedirectService.redirect).toHaveBeenCalledWith('file-link?dtoken=download-token');
    }));
  });

  describe('shouldSeeSendTokenInfo', () => {
    it('should report SEND_TOKEN and drop it from the rendered required info', () => {
      component.requiredInfo$.next([{ name: 'SEND_TOKEN' }, { name: 'NAME' }] as any);

      expect(component.shouldSeeSendTokenInfo()).toBeTrue();
      expect(component.requiredInfo$.value.map(info => info.name)).toEqual(['NAME']);
    });

    it('should report false when SEND_TOKEN is not required', () => {
      component.requiredInfo$.next([{ name: 'NAME' }] as any);

      expect(component.shouldSeeSendTokenInfo()).toBeFalse();
      expect(component.requiredInfo$.value.map(info => info.name)).toEqual(['NAME']);
    });
  });
});
