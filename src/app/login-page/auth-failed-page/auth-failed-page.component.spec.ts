import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { RequestService } from '../../core/data/request.service';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { HELP_DESK_PROPERTY } from '../../item-page/tombstone/tombstone.constants';
import { getMockRemoteDataBuildService } from '../../shared/mocks/remote-data-build.service.mock';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { AuthFailedPageComponent } from './auth-failed-page.component';

describe('AuthFailedPageComponent', () => {
  let component: AuthFailedPageComponent;
  let fixture: ComponentFixture<AuthFailedPageComponent>;
  let mockConfigurationDataService: ConfigurationDataService;
  let requestService: RequestService;
  let activatedRoute: any;
  let halService: HALEndpointService;
  let rdbService: RemoteDataBuildService;
  let notificationService: NotificationsServiceStub;

  const rootUrl = 'root url';
  const queryParams = 'netid[idp]';
  const encodedQueryParams = 'netid%5Bidp%5D&email=';

  activatedRoute = {
    params: of({}),
    snapshot: {
      queryParams: {
        netid: queryParams,
      },
    },
  };

  mockConfigurationDataService = jasmine.createSpyObj('configurationDataService', {
    findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
      name: HELP_DESK_PROPERTY,
      values: [
        'email',
      ],
    })),
  });

  requestService = jasmine.createSpyObj('requestService', {
    send: of('response'),
    generateRequestId: of('123456'),
  });

  halService = jasmine.createSpyObj('halService', {
    getRootHref: rootUrl,
  });

  rdbService = getMockRemoteDataBuildService();
  notificationService = new NotificationsServiceStub();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        AuthFailedPageComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ConfigurationDataService, useValue: mockConfigurationDataService },
        { provide: RequestService, useValue: requestService },
        { provide: HALEndpointService, useValue: halService },
        { provide: RemoteDataBuildService, useValue: rdbService },
        { provide: NotificationsService, useValue: notificationService },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthFailedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send request with encoded netId and email param', () => {
    component.ngOnInit();
    component.sendEmail();
    expect(requestService.send).toHaveBeenCalledWith(jasmine.objectContaining({
      href: rootUrl + '/autoregistration?netid=' + encodedQueryParams,
    }));
  });

  it('should encode an email that carries URL metacharacters', () => {
    component.ngOnInit();
    component.email = 'a b&c=d@example.com';
    component.sendEmail();
    expect(requestService.send).toHaveBeenCalledWith(jasmine.objectContaining({
      href: rootUrl + '/autoregistration?netid=netid%5Bidp%5D&email=a%20b%26c%3Dd%40example.com',
    }));
  });
});
