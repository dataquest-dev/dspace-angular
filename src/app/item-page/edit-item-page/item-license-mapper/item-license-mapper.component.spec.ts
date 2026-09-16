import { CommonModule } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RemoteDataBuildService } from '../../../core/cache/builders/remote-data-build.service';
import { ClarinLicenseDataService } from '../../../core/data/clarin/clarin-license-data.service';
import { RequestService } from '../../../core/data/request.service';
import { HALEndpointService } from '../../../core/shared/hal-endpoint.service';
import { Item } from '../../../core/shared/item.model';
import { getMockRemoteDataBuildService } from '../../../shared/mocks/remote-data-build.service.mock';
import { getMockRequestService } from '../../../shared/mocks/request.service.mock';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject } from '../../../shared/remote-data.utils';
import { HALEndpointServiceStub } from '../../../shared/testing/hal-endpoint-service.stub';
import { NotificationsServiceStub } from '../../../shared/testing/notifications-service.stub';
import { createPaginatedList } from '../../../shared/testing/utils.test';
import { ItemLicenseMapperComponent } from './item-license-mapper.component';

describe('ItemLicenseMapperComponent', () => {
  let component: ItemLicenseMapperComponent;
  let fixture: ComponentFixture<ItemLicenseMapperComponent>;

  const mockItem = Object.assign(new Item(), {
    id: 'fake-id',
    uuid: 'fake-uuid',
    handle: 'fake/handle',
    lastModified: '2018',
    isWithdrawn: true,
    metadata: {
      'dspace.entity.type': [
        { value: 'Person' },
      ],
    },
  });

  let routeStub: any;
  let clarinLicenseService: ClarinLicenseDataService;
  let halService: HALEndpointService;
  let requestService: RequestService;
  let rdbService: RemoteDataBuildService;
  let notificationsService: NotificationsServiceStub;

  routeStub = {
    parent: {
      data: of({
        dso: createSuccessfulRemoteDataObject(mockItem),
      }),
    },
  };
  clarinLicenseService = jasmine.createSpyObj('clarinLicenseService', {
    findAll: of(createSuccessfulRemoteDataObject(createPaginatedList([]))),
    searchBy: of(createSuccessfulRemoteDataObject(createPaginatedList([]))),
  });
  halService = Object.assign(new HALEndpointServiceStub('fake-url'));
  requestService = getMockRequestService();
  rdbService = getMockRemoteDataBuildService();
  notificationsService = new NotificationsServiceStub();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, RouterTestingModule.withRoutes([]), TranslateModule.forRoot(), NgbModule, ItemLicenseMapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: ClarinLicenseDataService, useValue: clarinLicenseService },
        { provide: HALEndpointService, useValue: halService },
        { provide: RequestService, useValue: requestService },
        { provide: RemoteDataBuildService, useValue: rdbService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ItemLicenseMapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
