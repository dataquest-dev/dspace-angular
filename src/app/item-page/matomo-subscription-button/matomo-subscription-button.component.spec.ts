import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatomoSubscriptionButtonComponent } from './matomo-subscription-button.component';
import { MatomoReportSubscriptionDataService } from 'src/app/core/data/clarin/matomo-report-subscription-data.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { TranslateService, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';
import { Item } from 'src/app/core/shared/item.model';
import { MatomoReportSubscription } from 'src/app/core/shared/clarin/matomo-report-subscription.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TranslateLoaderMock } from 'src/app/shared/mocks/translate-loader.mock';
import { NoContent } from '../../core/shared/NoContent.model';

describe('MatomoSubscriptionButtonComponent', () => {
  let component: MatomoSubscriptionButtonComponent;
  let fixture: ComponentFixture<MatomoSubscriptionButtonComponent>;
  let mockMatomoService: jasmine.SpyObj<MatomoReportSubscriptionDataService>;
  let mockNotificationsService: jasmine.SpyObj<NotificationsService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let cdr: ChangeDetectorRef;

  const mockItem: Item = {
    id: 'test-item-id-12345',
    handle: '123456789/1234',
    uuid: 'test-uuid',
    name: 'Test Item'
  } as Item;

  const mockSubscription: MatomoReportSubscription = {
    id: 1,
    epersonId: 'test-person-id',
    itemId: 'test-item-id-12345',
    type: undefined,
    _links: {
      self: { href: 'http://localhost/api/matomoreportsubscriptions/1'}
    }
  };

  const createSuccessRemoteData = (payload: any): RemoteData<any> => ({
    hasSucceeded: true,
    hasFailed: false,
    isLoading: false,
    hasCompleted: true,
    payload,
    statusCode: 200,
    error: null,
    errorMessage: null
  } as unknown as RemoteData<any>);

  const create404RemoteData = (): RemoteData<any> => ({
    hasSucceeded: false,
    hasFailed: true,
    isLoading: false,
    hasCompleted: true,
    payload: null,
    statusCode: 404,
    error: null,
    errorMessage: 'Not Found'
  } as unknown as RemoteData<any>);

  const createErrorRemoteData = (): RemoteData<any> => ({
    hasSucceeded: false,
    hasFailed: true,
    isLoading: false,
    hasCompleted: true,
    payload: null,
    statusCode: 500,
    error: new Error('Server error'),
    errorMessage: 'Internal Server Error'
  } as unknown as RemoteData<any>);

  beforeEach(async () => {
    mockMatomoService = jasmine.createSpyObj('MatomoReportSubscriptionDataService', [
      'getSubscriptionStatus',
      'subscribe',
      'unsubscribe'
    ]);
    mockNotificationsService = jasmine.createSpyObj('NotificationsService', ['success', 'error']);
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant']);

    mockTranslateService.instant.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock
          }
        })
      ],
      declarations: [MatomoSubscriptionButtonComponent],
      providers: [
        { provide: MatomoReportSubscriptionDataService, useValue: mockMatomoService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MatomoSubscriptionButtonComponent);
    component = fixture.componentInstance;
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);

    mockMatomoService.getSubscriptionStatus.and.returnValue(of(create404RemoteData()));
    mockMatomoService.subscribe.and.returnValue(of(createSuccessRemoteData({} as NoContent)));
    mockMatomoService.unsubscribe.and.returnValue(of(createSuccessRemoteData({} as NoContent)));
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.isSubscribed).toBe(false);
      expect(component.subscriptions).toBeDefined();
      expect(component.subscriptions.length).toBe(0);
    });

    it('should call loadSubscriptionStatus on init', fakeAsync(() => {
      spyOn(component, 'loadSubscriptionStatus');
      component.ngOnInit();
      tick();

      expect(component.loadSubscriptionStatus).toHaveBeenCalled();
    }));

    it('should load subscription status when component initializes', fakeAsync(() => {
      mockMatomoService.getSubscriptionStatus.calls.reset();

      const successRD = createSuccessRemoteData(mockSubscription);
      mockMatomoService.getSubscriptionStatus.and.returnValue(of(successRD));
      component.item = mockItem;
      component.ngOnInit();
      tick();

      expect(mockMatomoService.getSubscriptionStatus).toHaveBeenCalledWith(mockItem.id);
      expect(component.isSubscribed).toBe(true);
      expect(component.isLoading).toBe(false);
    }));
  });

  describe('Load Subscription Status', () => {
    beforeEach(() => {
      mockMatomoService.getSubscriptionStatus.calls.reset();
      component.isLoading = false;
      component.isSubscribed = false;
      component.item = undefined as any;
      component.subscriptions.forEach(sub => sub.unsubscribe());
      component.subscriptions = [];
    });

    it('should load subscription status when user is subscribed', fakeAsync(() => {
      component.item = mockItem;
      const successRD = createSuccessRemoteData(mockSubscription);
      mockMatomoService.getSubscriptionStatus.and.returnValue(of(successRD));

      component.loadSubscriptionStatus();
      tick();

      expect(mockMatomoService.getSubscriptionStatus).toHaveBeenCalledWith(mockItem.id);
      expect(component.isSubscribed).toBe(true);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle 404 response indicating no subscription', fakeAsync(() => {
      component.item = mockItem;
      const notFoundRD = create404RemoteData();
      mockMatomoService.getSubscriptionStatus.and.returnValue(of(notFoundRD));

      component.loadSubscriptionStatus();
      tick();

      expect(component.isSubscribed).toBe(false);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle failed RemoteData with non-404 error', fakeAsync(() => {
      component.item = mockItem;
      const errorRD = createErrorRemoteData();
      mockMatomoService.getSubscriptionStatus.and.returnValue(of(errorRD));

      component.loadSubscriptionStatus();
      tick();

      expect(component.isSubscribed).toBe(false);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error thrown during subscription status load', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.getSubscriptionStatus.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loadSubscriptionStatus();
      tick();

      expect(component.isSubscribed).toBe(false);
      expect(component.isLoading).toBe(false);
    }));

    it('should not fetch data when item ID is missing', () => {
      component.item = null as any;
      component.loadSubscriptionStatus();
      expect(mockMatomoService.getSubscriptionStatus).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
      expect(component.isSubscribed).toBe(false);
    });

    it('should set loading to true at start of load operation', () => {
      component.item = mockItem;
      component.isLoading = false;
      mockMatomoService.getSubscriptionStatus.and.returnValue(
        of(createSuccessRemoteData(mockSubscription)).pipe(delay(100))
      );
      component.loadSubscriptionStatus();
      expect(component.isLoading).toBe(true);
    });

    it('should handle successful RemoteData without payload', fakeAsync(() => {
      component.item = mockItem;
      const rdWithoutPayload: RemoteData<MatomoReportSubscription> = {
        hasSucceeded: true,
        hasFailed: false,
        hasCompleted: true,
        payload: null,
        statusCode: 200
      } as RemoteData<MatomoReportSubscription>;
      mockMatomoService.getSubscriptionStatus.and.returnValue(of(rdWithoutPayload));
      component.loadSubscriptionStatus();
      tick();
      expect(component.isSubscribed).toBe(false);
    }));
  });

  describe('Subscribe Operation', () => {
    beforeEach(() => {
      mockMatomoService.subscribe.calls.reset();
      mockNotificationsService.success.calls.reset();
      mockNotificationsService.error.calls.reset();
      component.isLoading = false;
      component.isSubscribed = false;
      component.item = undefined as any;
      component.subscriptions = [];
    });

    it('should successfully subscribe to Matomo reports', fakeAsync(() => {
      component.item = mockItem;
      const successRD = createSuccessRemoteData({} as NoContent);
      mockMatomoService.subscribe.and.returnValue(of(successRD));

      component.onSubscribe();
      tick();

      expect(mockMatomoService.subscribe).toHaveBeenCalledWith(mockItem.id);
      expect(component.isSubscribed).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(mockNotificationsService.success).toHaveBeenCalled();
    }));

    it('should handle failed subscribe operation', fakeAsync(() => {
      component.item = mockItem;
      const errorRD = createErrorRemoteData();
      mockMatomoService.subscribe.and.returnValue(of(errorRD));

      component.onSubscribe();
      tick();

      expect(mockNotificationsService.error).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error thrown during subscribe', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.subscribe.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.onSubscribe();
      tick();

      expect(mockNotificationsService.error).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    }));

    it('should not proceed with subscribe if item ID is missing', () => {
      component.item = null as any;

      component.onSubscribe();

      expect(mockMatomoService.subscribe).not.toHaveBeenCalled();
    });

    it('should not proceed with subscribe if already loading', () => {
      component.item = mockItem;
      component.isLoading = true;

      component.onSubscribe();

      expect(mockMatomoService.subscribe).not.toHaveBeenCalled();
    });

    it('should set loading to true during subscribe', () => {
      component.item = mockItem;
      component.isLoading = false;
      mockMatomoService.subscribe.and.returnValue(
        of(createSuccessRemoteData({} as NoContent)).pipe(delay(100))
      );

      component.onSubscribe();
      expect(component.isLoading).toBe(true);
    });

    it('should display correct success notification', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.subscribe.and.returnValue(of(createSuccessRemoteData({} as NoContent)));

      component.onSubscribe();
      tick();

      expect(mockNotificationsService.success).toHaveBeenCalledWith(
        'matomo.subscription.subscribe.success.title',
        'matomo.subscription.subscribe.success.message'
      );
    }));

    it('should display correct error notification on failure', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.subscribe.and.returnValue(of(createErrorRemoteData()));

      component.onSubscribe();
      tick();

      expect(mockNotificationsService.error).toHaveBeenCalledWith(
        'matomo.subscription.subscribe.error.title',
        'matomo.subscription.subscribe.error.message'
      );
    }));

    it('should add subscribe subscription to subscriptions array', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.subscribe.and.returnValue(of(createSuccessRemoteData({} as NoContent)));

      component.onSubscribe();
      tick();

      expect(component.subscriptions.length).toBeGreaterThan(0);
    }));
  });

  describe('Unsubscribe Operation', () => {
    beforeEach(() => {
      mockMatomoService.unsubscribe.calls.reset();
      mockNotificationsService.success.calls.reset();
      mockNotificationsService.error.calls.reset();
      component.isLoading = false;
      component.isSubscribed = false;
      component.item = undefined as any;
      component.subscriptions = [];
    });

    it('should successfully unsubscribe from Matomo reports', fakeAsync(() => {
      component.item = mockItem;
      const successRD = createSuccessRemoteData({} as NoContent);
      mockMatomoService.unsubscribe.and.returnValue(of(successRD));

      component.onUnsubscribe();
      tick();

      expect(mockMatomoService.unsubscribe).toHaveBeenCalledWith(mockItem.id);
      expect(component.isSubscribed).toBe(false);
      expect(component.isLoading).toBe(false);
      expect(mockNotificationsService.success).toHaveBeenCalled();
    }));

    it('should handle failed unsubscribe operation', fakeAsync(() => {
      component.item = mockItem;
      const errorRD = createErrorRemoteData();
      mockMatomoService.unsubscribe.and.returnValue(of(errorRD));

      component.onUnsubscribe();
      tick();

      expect(mockNotificationsService.error).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error thrown during unsubscribe', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.unsubscribe.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.onUnsubscribe();
      tick();

      expect(mockNotificationsService.error).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    }));

    it('should not proceed with unsubscribe if item ID is missing', () => {
      component.item = null as any;

      component.onUnsubscribe();

      expect(mockMatomoService.unsubscribe).not.toHaveBeenCalled();
    });

    it('should not proceed with unsubscribe if already loading', () => {
      component.item = mockItem;
      component.isLoading = true;

      component.onUnsubscribe();

      expect(mockMatomoService.unsubscribe).not.toHaveBeenCalled();
    });

    it('should set loading to true during unsubscribe', () => {
      component.item = mockItem;
      component.isLoading = false;
      mockMatomoService.unsubscribe.and.returnValue(
        of(createSuccessRemoteData({} as NoContent)).pipe(delay(100))
      );

      component.onUnsubscribe();
      expect(component.isLoading).toBe(true);
    });

    it('should display correct success notification', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.unsubscribe.and.returnValue(of(createSuccessRemoteData({} as NoContent)));

      component.onUnsubscribe();
      tick();

      expect(mockNotificationsService.success).toHaveBeenCalledWith(
        'matomo.subscription.unsubscribe.success.title',
        'matomo.subscription.unsubscribe.success.message'
      );
    }));

    it('should display correct error notification on failure', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.unsubscribe.and.returnValue(of(createErrorRemoteData()));

      component.onUnsubscribe();
      tick();

      expect(mockNotificationsService.error).toHaveBeenCalledWith(
        'matomo.subscription.unsubscribe.error.title',
        'matomo.subscription.unsubscribe.error.message'
      );
    }));

    it('should add unsubscribe subscription to subscriptions array', fakeAsync(() => {
      component.item = mockItem;
      mockMatomoService.unsubscribe.and.returnValue(of(createSuccessRemoteData({} as NoContent)));

      component.onUnsubscribe();
      tick();

      expect(component.subscriptions.length).toBeGreaterThan(0);
    }));
  });
});



