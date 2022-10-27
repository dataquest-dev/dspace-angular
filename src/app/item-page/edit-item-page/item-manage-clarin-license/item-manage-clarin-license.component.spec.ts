import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemManageClarinLicenseComponent } from './item-manage-clarin-license.component';
import {SharedModule} from '../../../shared/shared.module';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {ClarinLicenseTableComponent} from '../../../clarin-licenses/clarin-license-table/clarin-license-table.component';
import {RequestService} from '../../../core/data/request.service';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {ClarinLicenseLabelDataService} from '../../../core/data/clarin/clarin-license-label-data.service';
import {PaginationService} from '../../../core/pagination/pagination.service';
import {PaginationServiceStub} from '../../../shared/testing/pagination-service.stub';
import {NotificationsService} from '../../../shared/notifications/notifications.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HostWindowService} from '../../../shared/host-window.service';
import {HostWindowServiceStub} from '../../../shared/testing/host-window-service.stub';
import {ActivatedRoute, convertToParamMap, Params} from '@angular/router';
import {ItemDataService} from '../../../core/data/item-data.service';
import {of as observableOf} from 'rxjs';
import {createSuccessfulRemoteDataObject, createSuccessfulRemoteDataObject$} from '../../../shared/remote-data.utils';
import {Item} from '../../../core/shared/item.model';
import {mockLicense, mockLicenseList} from '../../../shared/testing/clarin-license-mock';
import {RequestEntry} from '../../../core/data/request.reducer';
import {RestResponse} from '../../../core/cache/response.models';
import {cold, getTestScheduler} from 'jasmine-marbles';
import {buildPaginatedList} from '../../../core/data/paginated-list.model';
import {PageInfo} from '../../../core/shared/page-info.model';
import {NotificationsServiceStub} from '../../../shared/testing/notifications-service.stub';
import {getMockTranslateService} from '../../../shared/mocks/translate.service.mock';
import {TestScheduler} from 'rxjs/testing';

describe('ItemManageClarinLicenseComponent', () => {
  let component: ItemManageClarinLicenseComponent;
  let fixture: ComponentFixture<ItemManageClarinLicenseComponent>;

  let itemService: ItemDataService;
  let requestService: RequestService;
  let clarinLicenseService: ClarinLicenseDataService;
  let translateService: TranslateService;
  let modalStub: NgbActiveModal;
  let notificationService: NotificationsServiceStub;
  let scheduler: TestScheduler;

  const responseCacheEntry = new RequestEntry();
  responseCacheEntry.response = new RestResponse(true, 200, 'Success');

  const clarinLicense = mockLicense;
  const mockItem = Object.assign(new Item(), {
    metadata: { 'dc.rights': [{ value: clarinLicense.name }], 'dc.rights.uri': [{ value: clarinLicense.definition }] },
    _links: {
      self: {
        href: 'test href'
      }
    }
  });

  itemService = jasmine.createSpyObj('itemService', {
    findByHref: createSuccessfulRemoteDataObject(mockItem)
  });

  clarinLicenseService = jasmine.createSpyObj('clarinLicenseService', {
    create: createSuccessfulRemoteDataObject$(mockLicense),
    findAll: createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), mockLicenseList))
  });
  translateService = getMockTranslateService();
  modalStub = jasmine.createSpyObj('modalService', ['close', 'open']);
  notificationService = new NotificationsServiceStub();

  beforeEach(async () => {
    scheduler = getTestScheduler();

    requestService = jasmine.createSpyObj('requestService', {
      generateRequestId: '123456',
      send: {},
      getByUUID: cold('a', { a: responseCacheEntry }),
    });

    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ ItemManageClarinLicenseComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: { parent: { data: observableOf({ dso: createSuccessfulRemoteDataObject(mockItem) }) } }  },
        { provide: ItemDataService, useValue: itemService },
        { provide: RequestService, useValue: requestService },
        { provide: ClarinLicenseDataService, useValue: clarinLicenseService },
        { provide: NotificationsService, useValue: notificationService },
        { provide: TranslateService, useValue: translateService },
        { provide: NgbActiveModal, useValue: modalStub }
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemManageClarinLicenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
