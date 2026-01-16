import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EpicHandleDataService } from '../../core/data/epic-handle-data.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';
import { TranslateLoaderMock } from 'src/app/shared/testing/translate-loader.mock';
import { EpicHandleEditComponent } from './epic-handle-edit.component';

describe('EpicEditHandlePageComponent', () => {
  let component: EpicHandleEditComponent;
  let fixture: ComponentFixture<EpicHandleEditComponent>;
  let epicHandleService: jasmine.SpyObj<EpicHandleDataService>;
  let router: jasmine.SpyObj<Router>;
  let notificationsService: jasmine.SpyObj<NotificationsService>;
  let translateService: TranslateService;

  const mockHandle = {
    id: '11148/TEST-001',
    url: 'http://example.com',
    hasSucceeded: true,
    hasFailed: false
  };

  beforeEach(async () => {
    const epicHandleServiceSpy = jasmine.createSpyObj('EpicHandleDataService', ['update']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notificationsSpy = jasmine.createSpyObj('NotificationsService', ['success', 'error']);
    const activatedRoute = {
      snapshot: {
        queryParams: {
          id: '11148/TEST-001',
          url: 'http://example.com'
        }
      }
    };
    translateService = getMockTranslateService();

    await TestBed.configureTestingModule({
      declarations: [EpicHandleEditComponent],
      imports: [FormsModule, TranslateModule.forRoot({
                      loader: {
                        provide: TranslateLoader,
                        useClass: TranslateLoaderMock
                      }
                    }),],
      providers: [
        { provide: EpicHandleDataService, useValue: epicHandleServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NotificationsService, useValue: notificationsSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    epicHandleService = TestBed.inject(EpicHandleDataService) as jasmine.SpyObj<EpicHandleDataService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationsService = TestBed.inject(NotificationsService) as jasmine.SpyObj<NotificationsService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicHandleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load handle data from route params', () => {
      expect(component.handleId).toBe('11148/TEST-001');
      expect(component.url).toBe('http://example.com');
    });

    it('should split handle ID into prefix and suffix', () => {
      expect(component.prefix).toBe('11148');
      expect(component.suffix).toBe('TEST-001');
    });

    it('should initialize newUrl with current URL', () => {
      expect(component.newUrl).toBe('http://example.com');
    });

    it('should redirect when no handle ID provided', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute);
      activatedRoute.snapshot.queryParams.id = null;

      component.ngOnInit();

      expect(notificationsService.error).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should redirect when handle ID has invalid format', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute);
      activatedRoute.snapshot.queryParams.id = 'invalid-format';

      component.ngOnInit();

      expect(notificationsService.error).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Return RemoteData-like object expected by getFirstCompletedRemoteData
      epicHandleService.update.and.returnValue(of({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any));
    });

    it('should update handle with new URL', (done) => {
      const formValue = {
        url: 'http://new-example.com'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.update).toHaveBeenCalledWith(
          '11148',
          'TEST-001',
          'http://new-example.com'
        );
        expect(notificationsService.success).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should trim whitespace from URL', (done) => {
      const formValue = {
        url: '  http://new-example.com  '
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.update).toHaveBeenCalledWith(
          '11148',
          'TEST-001',
          'http://new-example.com'
        );
        done();
      }, 100);
    });

    it('should show error when URL is empty', () => {
      const formValue = { url: '' };

      component.onClickSubmit(formValue);

      expect(notificationsService.error).toHaveBeenCalled();
      expect(epicHandleService.update).not.toHaveBeenCalled();
    });

    it('should show error when URL is whitespace only', () => {
      const formValue = { url: '   ' };

      component.onClickSubmit(formValue);

      expect(notificationsService.error).toHaveBeenCalled();
      expect(epicHandleService.update).not.toHaveBeenCalled();
    });

    it('should handle API error', (done) => {
      epicHandleService.update.and.returnValue(throwError({ error: 'Error' }));
      const formValue = { url: 'http://new-example.com' };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationsService.error).toHaveBeenCalled();
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

    it('should handle failed response', (done) => {
      const failedResponse = {
        ...mockHandle,
        hasSucceeded: false,
        hasFailed: true,
        errorMessage: 'Failed'
      };
      epicHandleService.update.and.returnValue(of({ ...failedResponse, hasCompleted: true } as any));
      const formValue = { url: 'http://new-example.com' };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationsService.error).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set loading state during submission', () => {
      // simulate async in-flight request so isLoading remains true immediately after call
      epicHandleService.update.and.returnValue(new Observable(observer => {
        setTimeout(() => {
          observer.next({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any);
          observer.complete();
        }, 50);
      }));
      const formValue = { url: 'http://new-example.com' };

      component.onClickSubmit(formValue);

      expect(component.isLoading).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should redirect back after successful update', (done) => {
      epicHandleService.update.and.returnValue(of({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any));
      const formValue = { url: 'http://new-example.com' };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(
          ['/epic-handle-table'],
          { queryParams: { prefix: '11148' } }
        );
        done();
      }, 100);
    });

    it('should redirect back on cancel', () => {
      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/epic-handle-table'],
        { queryParams: { prefix: '11148'} }
      );
    });

    it('should redirect without currentPage when not provided', () => {
      component.redirectBack();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/epic-handle-table'],
        { queryParams: { prefix: '11148' } }
      );
    });
  });
});
