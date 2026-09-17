import { CommonModule } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  convertToParamMap,
  Params,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { Operation } from 'fast-json-patch';
import {
  cold,
  getTestScheduler,
} from 'jasmine-marbles';
import { of } from 'rxjs';

import { RestResponse } from '../../core/cache/response.models';
import { PatchRequest } from '../../core/data/request.models';
import { RequestService } from '../../core/data/request.service';
import { RequestEntry } from '../../core/data/request-entry.model';
import { Handle } from '../../core/handle/handle.model';
import { PaginationService } from '../../core/pagination/pagination.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { PaginationServiceStub } from '../../shared/testing/pagination-service.stub';
import { RouterStub } from '../../shared/testing/router.stub';
import { EditHandlePageComponent } from './edit-handle-page.component';

/**
 * The test class for the EditHandlePageComponent which edit the Handle.
 */
describe('EditHandlePageComponent', () => {
  let component: EditHandlePageComponent;
  let fixture: ComponentFixture<EditHandlePageComponent>;

  let routeStub: any;
  let routerStub: RouterStub;
  let paginationServiceStub: PaginationServiceStub;
  let requestService: RequestService;
  let notificationServiceStub: NotificationsServiceStub;

  const paramHandle = 'handle';
  const paramHandleValue = '123456';

  const paramURL = 'url';
  const paramURLValue = 'some url';

  const paramID = 'id';
  const paramIDValue = '123';

  const paramSelflink = '_selflink';
  const paramSelflinkValue = 'http url link';

  const paramCurrentPage = 'currentPage';
  const paramCurrentPageValue = '1';

  const requestId = '123456';
  const newURL = 'new url';

  const handleObj = Object.assign(new Handle(), {
    handle: paramHandleValue,
    url: newURL,
    _links: {
      self: { href: paramSelflinkValue },
    },
  });
  const formValue = {
    handle: paramHandleValue,
    url: newURL,
    archive: false,
  };

  const responseCacheEntry = new RequestEntry();
  responseCacheEntry.response = new RestResponse(true, 200, 'Success');

  beforeEach(async () => {
    const paramObject: Params = {};
    paramObject[paramHandle] = paramHandleValue;
    paramObject[paramURL] = paramURLValue;
    paramObject[paramID] = paramIDValue;
    paramObject[paramSelflink] = paramSelflinkValue;
    paramObject[paramCurrentPage] = paramCurrentPageValue;

    routeStub = {
      snapshot: {
        queryParams: paramObject,
        params: paramObject,
        queryParamMap: convertToParamMap(paramObject),
      },
    };
    routerStub = new RouterStub();
    paginationServiceStub = new PaginationServiceStub();
    notificationServiceStub = new NotificationsServiceStub();

    requestService = jasmine.createSpyObj('requestService', {
      send: of('response'),
      getByHref: of(responseCacheEntry),
      getByUUID: cold('a', { a: responseCacheEntry }),
      generateRequestId: requestId,
      removeByHrefSubstring: {},
    });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        EditHandlePageComponent,
      ],
      providers: [
        { provide: RequestService, useValue: requestService },
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: routerStub },
        { provide: PaginationService, useValue: paginationServiceStub },
        { provide: NotificationsService, useValue: notificationServiceStub },
        {
          provide: Store, useValue: {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            dispatch: () => {
            },
          },
        },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditHandlePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send request after click on Submit', () => {
    // request body should have the `archive` attribute which the Handle object doesn't have
    const handleRequestObj = {
      handle: handleObj.handle,
      url: handleObj.url,
      archive: formValue.archive,
      _links: handleObj._links,
    };

    const patchOperation = {
      op: 'replace', path: '/updateHandle', value: handleRequestObj,
    } as Operation;
    const patchRequest = new PatchRequest(requestId, paramSelflinkValue, [patchOperation]);

    // load values from url in the ngOnInit function
    (component as EditHandlePageComponent).ngOnInit();
    (component as EditHandlePageComponent).onClickSubmit(formValue);
    expect((component as any).requestService.send).toHaveBeenCalledWith(patchRequest);
  });

  it('should redirect to the handle table page', () => {
    // load values from url in the ngOnInit function
    (component as EditHandlePageComponent).ngOnInit();
    (component as EditHandlePageComponent).onClickSubmit(formValue);

    // getByUUID is a cold marble, so the response subscription only runs once the scheduler flushes
    getTestScheduler().flush();

    expect((component as any).paginationService.updateRouteWithUrl).toHaveBeenCalled();
  });
});
