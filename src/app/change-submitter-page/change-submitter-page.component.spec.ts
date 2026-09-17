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

import { DSONameService } from '../core/breadcrumbs/dso-name.service';
import { RemoteDataBuildService } from '../core/cache/builders/remote-data-build.service';
import { RequestService } from '../core/data/request.service';
import { HALEndpointService } from '../core/shared/hal-endpoint.service';
import { WorkspaceitemDataService } from '../core/submission/workspaceitem-data.service';
import { DSONameServiceMock } from '../shared/mocks/dso-name.service.mock';
import { getMockRemoteDataBuildService } from '../shared/mocks/remote-data-build.service.mock';
import { getMockRequestService } from '../shared/mocks/request.service.mock';
import { NotificationsService } from '../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';
import { HALEndpointServiceStub } from '../shared/testing/hal-endpoint-service.stub';
import { NotificationsServiceStub } from '../shared/testing/notifications-service.stub';
import { RouterStub } from '../shared/testing/router.stub';
import { createPaginatedList } from '../shared/testing/utils.test';
import { ChangeSubmitterPageComponent } from './change-submitter-page.component';

describe('ChangeSubmitterPageComponent', () => {
  let component: ChangeSubmitterPageComponent;
  let fixture: ComponentFixture<ChangeSubmitterPageComponent>;

  let activatedRoute;
  let requestService: RequestService;
  let mockDataService: WorkspaceitemDataService;
  let halService: HALEndpointService;
  let rdbService: RemoteDataBuildService;

  beforeEach(async () => {
    activatedRoute = {
      snapshot: {
        queryParams: new Map([
          ['shareToken', 'fake-share-token'],
        ]),
      },
    };
    requestService = getMockRequestService();
    mockDataService = jasmine.createSpyObj('WorkspaceitemDataService', {
      searchBy: of(createSuccessfulRemoteDataObject$(createPaginatedList([]))),
    });
    halService = Object.assign(new HALEndpointServiceStub('some-url'));
    rdbService = getMockRemoteDataBuildService();

    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        ChangeSubmitterPageComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NotificationsService, useValue: new NotificationsServiceStub() },
        { provide: Router, useValue: new RouterStub() },
        { provide: RequestService, useValue: requestService },
        { provide: WorkspaceitemDataService, useValue: mockDataService },
        { provide: HALEndpointService, useValue: halService },
        { provide: RemoteDataBuildService, useValue: rdbService },
        { provide: DSONameService, useValue: DSONameServiceMock },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChangeSubmitterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
