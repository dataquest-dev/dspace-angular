import {
  ChangeDetectionStrategy,
  Injector,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  Router,
  RouterLink,
} from '@angular/router';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { ItemDataService } from '../../../core/data/item-data.service';
import { RequestService } from '../../../core/data/request.service';
import { Item } from '../../../core/shared/item.model';
import { SearchService } from '../../../core/shared/search/search.service';
import { DsoVersioningModalService } from '../../dso-page/dso-versioning-modal-service/dso-versioning-modal.service';
import { getMockRequestService } from '../../mocks/request.service.mock';
import { getMockSearchService } from '../../mocks/search-service.mock';
import { TranslateLoaderMock } from '../../mocks/translate-loader.mock';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsServiceStub } from '../../testing/notifications-service.stub';
import { RouterStub } from '../../testing/router.stub';
import { ItemActionsComponent } from './item-actions.component';

let component: ItemActionsComponent;
let fixture: ComponentFixture<ItemActionsComponent>;

let mockObject: Item;

const mockDataService = {};

const authorizationService = jasmine.createSpyObj('authorizationService', {
  isAuthorized: of(true),
});

const dsoVersioningModalService = jasmine.createSpyObj('dsoVersioningModalService', {
  isNewVersionButtonDisabled: of(false),
  getVersioningTooltipMessage: of('item.page.version.create'),
  openCreateVersionModal: undefined,
});

mockObject = Object.assign(new Item(), {
  _links: {
    self: {
      href: 'https://rest.test/server/api/core/items/item-id',
    },
    version: {
      href: 'https://rest.test/server/api/core/versions/1',
    },
  },
  bundles: of({}),
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'This is just another title',
      },
    ],
    'dc.type': [
      {
        language: null,
        value: 'Article',
      },
    ],
    'dc.contributor.author': [
      {
        language: 'en_US',
        value: 'Smith, Donald',
      },
    ],
    'dc.date.issued': [
      {
        language: null,
        value: '2015-06-26',
      },
    ],
  },
});

const searchService = getMockSearchService();

const requestServce = getMockRequestService();

describe('ItemActionsComponent', () => {
  beforeEach(waitForAsync(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
        ItemActionsComponent,
      ],
      providers: [
        { provide: Injector, useValue: {} },
        { provide: Router, useValue: new RouterStub() },
        { provide: ItemDataService, useValue: mockDataService },
        { provide: NotificationsService, useValue: new NotificationsServiceStub() },
        { provide: SearchService, useValue: searchService },
        { provide: RequestService, useValue: requestServce },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: DsoVersioningModalService, useValue: dsoVersioningModalService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(ItemActionsComponent, {
      remove: { imports: [RouterLink] },
      add: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
  }));

  beforeEach(() => {
    authorizationService.isAuthorized.calls.reset();
    authorizationService.isAuthorized.and.returnValue(of(true));
    dsoVersioningModalService.isNewVersionButtonDisabled.calls.reset();
    dsoVersioningModalService.isNewVersionButtonDisabled.and.returnValue(of(false));
    dsoVersioningModalService.getVersioningTooltipMessage.calls.reset();
    dsoVersioningModalService.getVersioningTooltipMessage.and.returnValue(of('item.page.version.create'));
    dsoVersioningModalService.openCreateVersionModal.calls.reset();

    fixture = TestBed.createComponent(ItemActionsComponent);
    component = fixture.componentInstance;
    component.object = mockObject;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
  });

  it('should init object properly', () => {
    component.object = null;
    component.initObjects(mockObject);

    expect(component.object).toEqual(mockObject);
  });

  it('should show the New version button when version creation is authorized', () => {
    fixture.detectChanges();

    const newVersionButton = fixture.debugElement.query(By.css('button.btn-outline-primary'));

    expect(newVersionButton).toBeTruthy();
  });

  it('should hide the New version button when version creation is not authorized', () => {
    authorizationService.isAuthorized.and.returnValue(of(false));

    fixture = TestBed.createComponent(ItemActionsComponent);
    component = fixture.componentInstance;
    component.object = mockObject;
    fixture.detectChanges();

    const newVersionButton = fixture.debugElement.query(By.css('button.btn-outline-primary'));

    expect(newVersionButton).toBeNull();
  });

  it('should mark the New version button as disabled when version creation is disabled', () => {
    dsoVersioningModalService.isNewVersionButtonDisabled.and.returnValue(of(true));

    fixture = TestBed.createComponent(ItemActionsComponent);
    component = fixture.componentInstance;
    component.object = mockObject;
    fixture.detectChanges();

    let isDisabled: boolean;
    component.disableNewVersion$.subscribe((value) => {
      isDisabled = value;
    });

    expect(isDisabled).toBeTrue();
  });

  it('should use getVersioningTooltipMessage to derive tooltip key', () => {
    dsoVersioningModalService.isNewVersionButtonDisabled.and.returnValue(of(true));
    dsoVersioningModalService.getVersioningTooltipMessage.and.returnValue(of('item.page.version.hasDraft'));

    fixture = TestBed.createComponent(ItemActionsComponent);
    component = fixture.componentInstance;
    component.object = mockObject;
    fixture.detectChanges();

    let tooltipKey: string;
    component.newVersionTooltip$.subscribe((value) => {
      tooltipKey = value;
    });

    expect(tooltipKey).toBe('item.page.version.hasDraft');
    expect(dsoVersioningModalService.getVersioningTooltipMessage)
      .toHaveBeenCalledWith(mockObject, 'item.page.version.hasDraft', 'item.page.version.create');
  });

  it('should open the create version modal when the New version button is clicked', () => {
    fixture.detectChanges();

    const newVersionButton = fixture.debugElement.query(By.css('button.btn-outline-primary'));

    newVersionButton.triggerEventHandler('click');

    expect(dsoVersioningModalService.openCreateVersionModal).toHaveBeenCalledWith(mockObject);
  });

});
