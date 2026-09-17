import { CommonModule } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { cold } from 'jasmine-marbles';
import { of } from 'rxjs';

import { HandleDataService } from '../../core/data/handle-data.service';
import { RequestService } from '../../core/data/request.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { getMockTranslateService } from '../../shared/mocks/translate.service.mock';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { ChangeHandlePrefixPageComponent } from './change-handle-prefix-page.component';

/**
 * The test for the ChangeHandlePrefixPageComponent. Test changing of the handle prefix.
 */
describe('ChangeHandlePrefixPageComponent', () => {
  let comp: ChangeHandlePrefixPageComponent;
  let fixture: ComponentFixture<ChangeHandlePrefixPageComponent>;
  let formBuilder: FormBuilder;

  let handleDataService: HandleDataService;
  let halService: HALEndpointService;
  let notificationService: NotificationsServiceStub;
  let requestService = RequestService;

  const successfulResponse = {
    response: {
      statusCode: 200,
    },
  };
  let endpointURL: string;

  beforeEach(async () => {
    endpointURL = 'https://rest.api/auth';

    notificationService = new NotificationsServiceStub();
    handleDataService = jasmine.createSpyObj('handleDataService', {
      findAll: createSuccessfulRemoteDataObject$(createPaginatedList([])),
      getLinkPath: of(''),
    });
    requestService = jasmine.createSpyObj('requestService', {
      send: of('response'),
      getByUUID: of(successfulResponse),
      generateRequestId: of('123456'),
    });
    halService = jasmine.createSpyObj('halService', {
      getEndpoint: cold('a', { a: endpointURL }),
    });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        ChangeHandlePrefixPageComponent,
      ],
      providers: [
        provideRouter([]),
        { provide: RequestService, useValue: requestService },
        { provide: NotificationsService, useValue: notificationService },
        { provide: HandleDataService, useValue: handleDataService },
        { provide: HALEndpointService, useValue: halService },
        { provide: TranslateService, useValue: getMockTranslateService() },
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
    fixture = TestBed.createComponent(ChangeHandlePrefixPageComponent);
    comp = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
  });

  afterEach(() => {
    formBuilder = null;
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });
});
