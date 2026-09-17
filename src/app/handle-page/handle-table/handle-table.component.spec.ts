import { CommonModule } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { HandleDataService } from '../../core/data/handle-data.service';
import { buildPaginatedList } from '../../core/data/paginated-list.model';
import { RequestService } from '../../core/data/request.service';
import { Handle } from '../../core/handle/handle.model';
import { PaginationService } from '../../core/pagination/pagination.service';
import { PageInfo } from '../../core/shared/page-info.model';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { PaginationServiceStub } from '../../shared/testing/pagination-service.stub';
import { RouterStub } from '../../shared/testing/router.stub';
import {
  getHandleTableModulePath,
  HANDLE_TABLE_EDIT_HANDLE_PATH,
} from '../handle-page-routing-paths';
import { HandleTableComponent } from './handle-table.component';
import { defaultPagination } from './handle-table-pagination';

const selectedHandleId = 1;

const successfulResponse = {
  response: {
    statusCode: 200,
  },
};

const mockHandle = Object.assign(new Handle(), {
  id: selectedHandleId,
  handle: '123456',
  resourceTypeID: 0,
  url: 'handle.url',
  resourceId: 'a43666e5-d477-4957-8e63-74baf6955d97',
  _links: {
    self: {
      href: 'url.123456',
    },
  },
});

const mockHandleRD$ = createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), [mockHandle]));

/**
 * The test for testing HandleTableComponent.
 */
describe('HandleTableComponent', () => {
  let component: HandleTableComponent;
  let fixture: ComponentFixture<HandleTableComponent>;

  let handleDataService: HandleDataService;
  let requestService: RequestService;
  let notificationService: NotificationsServiceStub;

  beforeEach(async () => {
    notificationService = new NotificationsServiceStub();
    handleDataService = jasmine.createSpyObj('handleDataService', {
      findAll: mockHandleRD$,
      getLinkPath: of(''),
    });
    requestService = jasmine.createSpyObj('requestService', {
      send: of('response'),
      getByUUID: of(successfulResponse),
      generateRequestId: of('123456'),
    });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        HandleTableComponent,
      ],
      providers: [
        { provide: RequestService, useValue: requestService },
        { provide: HandleDataService, useValue: handleDataService },
        { provide: Router, useValue: new RouterStub() },
        { provide: PaginationService, useValue: new PaginationServiceStub() },
        { provide: NotificationsService, useValue: notificationService },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleTableComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize handleRoute', () => {
    (component as HandleTableComponent).ngOnInit();
    expect((component as HandleTableComponent).handleRoute).toEqual(getHandleTableModulePath());
  });

  it('should initialize paginationOptions', () => {
    (component as HandleTableComponent).ngOnInit();
    expect((component as HandleTableComponent).options).toEqual(defaultPagination);
  });

  it('should onInit should initialize handle table data', () => {
    (component as HandleTableComponent).ngOnInit();
    expect((component as any).handleDataService.findAll).toHaveBeenCalled();
    expect((component as HandleTableComponent).handlesRD$).not.toBeNull();
  });

  it('should update handles in pageChange', () => {
    (component as HandleTableComponent).ngOnInit();
    (component as HandleTableComponent).onPageChange();
    expect((component as any).handleDataService.findAll).toHaveBeenCalled();
    expect((component as HandleTableComponent).handlesRD$).not.toBeNull();
  });

  it('should not allow to have two or more selected handles', () => {
    const firstId = 1;
    const secondId = 2;

    expect((component as HandleTableComponent).selectedHandle).toBeNull();

    (component as HandleTableComponent).switchSelectedHandle(firstId);
    expect((component as HandleTableComponent).selectedHandle).toBe(firstId);

    (component as HandleTableComponent).switchSelectedHandle(secondId);
    expect((component as HandleTableComponent).selectedHandle).toBe(secondId);
    expect((component as HandleTableComponent).selectedHandle).not.toBe(firstId);
  });

  it('should redirect with selected handle', () => {
    // load handles to the table
    (component as HandleTableComponent).ngOnInit();
    // select handle
    (component as HandleTableComponent).switchSelectedHandle(selectedHandleId);
    // redirect
    (component as HandleTableComponent).redirectWithHandleParams();

    const handleRoute = (component as HandleTableComponent).handleRoute;
    const routingParamObject = {
      queryParams: {
        id: selectedHandleId,
        _selflink: mockHandle._links.self.href,
        handle: mockHandle.handle,
        url: mockHandle.url,
        currentPage: (component as any).options.currentPage,
        resourceType: mockHandle.resourceTypeID,
        resourceId: mockHandle.resourceId,
      },
    };
    // should unselect
    expect((component as any).router.navigate).toHaveBeenCalledWith([handleRoute, HANDLE_TABLE_EDIT_HANDLE_PATH],
      routingParamObject);
    expect((component as HandleTableComponent).selectedHandle).toBeNull();
  });

  it('should not delete handle when is no handle selected', () => {
    (component as HandleTableComponent).deleteHandles();
    expect((component as any).requestService.send).not.toHaveBeenCalled();
  });

  it('should delete selected handle', () => {
    spyOn((component as HandleTableComponent), 'refreshTableAfterDelete');

    (component as HandleTableComponent).ngOnInit();
    (component as HandleTableComponent).switchSelectedHandle(selectedHandleId);
    (component as HandleTableComponent).deleteHandles();

    expect((component as any).requestService.send).toHaveBeenCalled();
    expect((component as HandleTableComponent).refreshTableAfterDelete).toHaveBeenCalled();
  });
});
