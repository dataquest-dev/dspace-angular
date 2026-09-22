import { CommonModule } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import { HandleDataService } from '../../core/data/handle-data.service';
import { Handle } from '../../core/handle/handle.model';
import { PaginationService } from '../../core/pagination/pagination.service';
import { getMockTranslateService } from '../../shared/mocks/translate.service.mock';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { PaginationServiceStub } from '../../shared/testing/pagination-service.stub';
import { NewHandlePageComponent } from './new-handle-page.component';

const mockCreatedHandleRD$ = createSuccessfulRemoteDataObject$(Object.assign(new Handle(), {
  id: 1,
  handle: '123456',
  resourceTypeID: 0,
  url: 'handle.url',
  resourceId: 'a43666e5-d477-4957-8e63-74baf6955d97',
  _links: {
    self: {
      href: 'url.123456',
    },
  },
}));

/**
 * The test class for the NewHandlePageComponent.
 */
describe('NewHandlePageComponent', () => {
  let component: NewHandlePageComponent;
  let fixture: ComponentFixture<NewHandlePageComponent>;

  let notificationService: NotificationsServiceStub;
  let handleDataService: HandleDataService;
  let paginationService: PaginationServiceStub;

  beforeEach(async () => {
    notificationService = new NotificationsServiceStub();
    paginationService = new PaginationServiceStub();

    handleDataService = jasmine.createSpyObj('handleDataService', {
      create: mockCreatedHandleRD$,
      getLinkPath: of(''),
    });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        NewHandlePageComponent,
      ],
      providers: [
        provideRouter([]),
        { provide: NotificationsService, useValue: notificationService },
        { provide: HandleDataService, useValue: handleDataService },
        { provide: PaginationService, useValue: paginationService },
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
    fixture = TestBed.createComponent(NewHandlePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send request after click on Submit', () => {
    component.onClickSubmit('new handle');

    expect((component as any).handleService.create).toHaveBeenCalled();
  });
});
