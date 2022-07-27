import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ChangeHandlePrefixPageComponent} from './change-handle-prefix-page.component';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {RequestService} from '../../core/data/request.service';
import {of as observableOf} from 'rxjs';
import {SharedModule} from '../../shared/shared.module';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {CommonModule} from '@angular/common';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {NotificationsServiceStub} from '../../shared/testing/notifications-service.stub';
import {HandleDataService} from '../../core/data/handle-data.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import {createPaginatedList} from '../../shared/testing/utils.test';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {cold} from 'jasmine-marbles';
import {getMockTranslateService} from '../../shared/mocks/translate.service.mock';

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

  const oldPrefix = 'oldPrefix';
  const newPrefix = 'newPrefix';
  const successfulResponse = {
    response: {
      statusCode: 200
    }};
  let endpointURL: string;

  beforeEach(async () => {
    endpointURL = 'https://rest.api/auth';

    notificationService = new NotificationsServiceStub();
    handleDataService = jasmine.createSpyObj('handleDataService', {
      findAll: createSuccessfulRemoteDataObject$(createPaginatedList([])),
      getLinkPath: observableOf('')
    });
    requestService = jasmine.createSpyObj('requestService', {
      send: observableOf('response'),
      getByUUID: observableOf(successfulResponse),
      generateRequestId: observableOf('123456'),
    });
    halService = jasmine.createSpyObj('halService', {
      getEndpoint: cold('a', { a: endpointURL })
    });

    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ ChangeHandlePrefixPageComponent ],
      providers: [
      { provide: RequestService, useValue: requestService },
      { provide: NotificationsService, useValue: notificationService },
      { provide: HandleDataService, useValue: handleDataService },
      { provide: HALEndpointService, useValue: halService },
      { provide: TranslateService, useValue: getMockTranslateService() },
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

  it('should send request after click on Submit', () => {
    // create form with value
    comp.changePrefix = formBuilder.group(({
      oldPrefix: [oldPrefix, Validators.required ],
      newPrefix: [newPrefix, Validators.required ],
      archive: new FormControl(false)
    }));

    // click
    comp.onClickSubmit(newPrefix);

    expect((comp as any).requestService.send).toHaveBeenCalled();
  });

  it('should not send request after click on Submit if are form inputs empty', () => {
    // create form with value
    comp.changePrefix = formBuilder.group(({
      oldPrefix: ['', Validators.required ],
      newPrefix: ['', Validators.required ],
      archive: new FormControl(false)
    }));

    // click
    comp.onClickSubmit(newPrefix);

    expect((comp as any).requestService.send).not.toHaveBeenCalled();
  });

  it('should notify successful request', () => {
    // create form with value
    comp.changePrefix = formBuilder.group(({
      oldPrefix: [oldPrefix, Validators.required ],
      newPrefix: [newPrefix, Validators.required ],
      archive: new FormControl(false)
    }));

    // click
    comp.onClickSubmit(newPrefix);

    expect((comp as any).notificationsService.success).toHaveBeenCalled();
    expect((comp as any).notificationsService.error).not.toHaveBeenCalled();
  });
});
