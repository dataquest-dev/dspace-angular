import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of as observableOf } from 'rxjs';
import { ClarinLicenseAgreementPageComponent } from './clarin-license-agreement-page.component';
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
import { Item } from '../../core/shared/item.model';
import { FileService } from '../../core/shared/file.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { getMockRemoteDataBuildService } from '../../shared/mocks/remote-data-build.service.mock';
import { getMockRequestService } from '../../shared/mocks/request.service.mock';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { HtmlContentService } from '../../shared/html-content.service';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { VarDirective } from '../../shared/utils/var.directive';

@Pipe({ name: 'dsSafeHtml' })
class MockDsSafeHtmlPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

describe('ClarinLicenseAgreementPageComponent', () => {
  let component: ClarinLicenseAgreementPageComponent;
  let fixture: ComponentFixture<ClarinLicenseAgreementPageComponent>;
  let requestService: jasmine.SpyObj<RequestService>;
  let router: { routerState: { snapshot: { url: string } }; navigate: jasmine.Spy };

  const restUrl = 'https://rest.api';

  beforeEach(async () => {
    requestService = getMockRequestService();
    router = {
      routerState: { snapshot: { url: '/bitstreams/download' } },
      navigate: jasmine.createSpy('navigate'),
    };

    await TestBed.configureTestingModule({
      declarations: [ ClarinLicenseAgreementPageComponent, VarDirective, MockDsSafeHtmlPipe ],
      imports: [ CommonModule, TranslateModule.forRoot() ],
      providers: [
        { provide: ClarinLicenseResourceMappingService, useValue: jasmine.createSpyObj('clarinLicenseResourceMappingService', ['searchBy']) },
        { provide: ConfigurationDataService, useValue: jasmine.createSpyObj('configurationDataService', ['findByPropertyName']) },
        { provide: BundleDataService, useValue: jasmine.createSpyObj('bundleService', ['findByItem']) },
        { provide: ClarinUserRegistrationDataService, useValue: jasmine.createSpyObj('userRegistrationService', ['searchBy']) },
        { provide: NotificationsService, useValue: new NotificationsServiceStub() },
        { provide: ItemDataService, useValue: jasmine.createSpyObj('itemService', ['searchBy']) },
        { provide: AuthService, useValue: jasmine.createSpyObj('authService', {
          isAuthenticated: observableOf(false),
          getAuthenticatedUserFromStore: observableOf(undefined),
        }) },
        { provide: HttpClient, useValue: jasmine.createSpyObj('http', ['get']) },
        { provide: Router, useValue: router },
        { provide: HALEndpointService, useValue: jasmine.createSpyObj('halService', { getRootHref: restUrl }) },
        { provide: RemoteDataBuildService, useValue: getMockRemoteDataBuildService() },
        { provide: HardRedirectService, useValue: jasmine.createSpyObj('hardRedirectService', ['redirect']) },
        { provide: RequestService, useValue: requestService },
        { provide: ClarinUserMetadataDataService, useValue: jasmine.createSpyObj('clarinUserMetadataDataService', ['searchBy']) },
        { provide: HtmlContentService, useValue: jasmine.createSpyObj('htmlContentService', {
          getHmtlContentByPathAndLocale: Promise.resolve(''),
        }) },
        { provide: FileService, useValue: jasmine.createSpyObj('fileService', {
          retrieveFileDownloadLink: observableOf('content-url'),
        }) },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseAgreementPageComponent);
    component = fixture.componentInstance;
    component.bitstream$ = observableOf(Object.assign(new Bitstream(), { uuid: 'bitstream-uuid' }));
  });

  describe('accept', () => {

    // Anonymous user with no required extra fields: null userMetadata$ must still produce an IP entry in the POST body.
    it('should send IP metadata in the request payload when userMetadata$ is null for an anonymous user', () => {
      const testIpAddress = '203.0.113.42';
      const bitstream = Object.assign(new Bitstream(), { uuid: 'bitstream-uuid' });

      component.currentUser$.next(null);
      component.userMetadata$.next(null);
      component.requiredInfo$.next([]);
      component.ipAddress$.next(testIpAddress);
      component.item$.next(Object.assign(new Item(), { uuid: 'item-uuid' }));
      component.bitstream$ = observableOf(bitstream);
      requestService.send.calls.reset();

      component.accept();

      expect(requestService.send).toHaveBeenCalled();
      const postRequest = requestService.send.calls.mostRecent().args[0];
      expect(postRequest.body).toEqual(jasmine.arrayContaining([
        jasmine.objectContaining({
          metadataKey: 'IP',
          metadataValue: testIpAddress,
        }),
      ]));
      const ipEntry = postRequest.body.find((entry) => entry.metadataKey === 'IP');
      expect(ipEntry.metadataValue).toBeTruthy();
      expect(component.userMetadata$.value).not.toBeNull();
      expect(component.userMetadata$.value.page).toEqual(jasmine.arrayContaining([
        jasmine.objectContaining({
          metadataKey: 'IP',
          metadataValue: testIpAddress,
        }),
      ]));
    });

    // Same fix path when userMetadata$ exists but its page array is empty.
    it('should send IP metadata in the request payload when userMetadata$.page is empty', () => {
      const testIpAddress = '203.0.113.42';
      const bitstream = Object.assign(new Bitstream(), { uuid: 'bitstream-uuid' });

      component.currentUser$.next(null);
      component.userMetadata$.next(buildPaginatedList(undefined, [], false, undefined));
      component.requiredInfo$.next([]);
      component.ipAddress$.next(testIpAddress);
      component.item$.next(Object.assign(new Item(), { uuid: 'item-uuid' }));
      component.bitstream$ = observableOf(bitstream);
      requestService.send.calls.reset();

      component.accept();

      expect(requestService.send).toHaveBeenCalledWith(jasmine.objectContaining({
        body: jasmine.arrayContaining([
          jasmine.objectContaining({
            metadataKey: 'IP',
            metadataValue: testIpAddress,
          }),
        ]),
      }));
      expect(component.userMetadata$.value).not.toBeNull();
      expect(component.userMetadata$.value.page.some((entry) => entry.metadataKey === 'IP')).toBeTrue();
    });

  });
});
