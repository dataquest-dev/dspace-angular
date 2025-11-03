import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EpicHandleDataService } from '../../core/data/epic-handle-data.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateLoaderMock } from 'src/app/shared/testing/translate-loader.mock';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';
import { NotificationsServiceStub } from 'src/app/shared/testing/notifications-service.stub';
import { EpicHandleNewComponent } from './epic-handle-new.component';

describe('EpicNewHandlePageComponent', () => {
  let component: EpicHandleNewComponent;
  let fixture: ComponentFixture<EpicHandleNewComponent>;
  let epicHandleService: jasmine.SpyObj<EpicHandleDataService>;
  let router: jasmine.SpyObj<Router>;
  let translateService: TranslateService;
  let notificationService: NotificationsServiceStub;
  const mockHandle = {
    id: '11148/TEST-001',
    url: 'http://example.com',
    hasSucceeded: true,
    hasFailed: false
  };

  beforeEach(async () => {
    const epicHandleServiceSpy = jasmine.createSpyObj('EpicHandleDataService', ['create', 'update']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRoute = {
      snapshot: {
        queryParams: { prefix: '11148' }
      }
    };
    translateService = getMockTranslateService();
    notificationService = new NotificationsServiceStub();
    await TestBed.configureTestingModule({
      declarations: [EpicHandleNewComponent],
      imports: [FormsModule,  TranslateModule.forRoot({
                loader: {
                  provide: TranslateLoader,
                  useClass: TranslateLoaderMock
                }
              }),],
      providers: [
        { provide: EpicHandleDataService, useValue: epicHandleServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NotificationsService, useValue: notificationService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    epicHandleService = TestBed.inject(EpicHandleDataService) as jasmine.SpyObj<EpicHandleDataService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicHandleNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should redirect to prefix page if no prefix', () => {
      // simulate missing prefix in route snapshot
      (component as any).route = { snapshot: { queryParams: {} } } as any;
      component.ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/epic-handle-table/prefix']);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Wrap the mockHandle in a RemoteData-like object expected by getFirstCompletedRemoteData
      const remoteMock = { hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any;
      epicHandleService.create.and.returnValue(of(remoteMock));
    });

    it('should create handle with URL', (done) => {
      const formValue = {
        url: 'http://example.com'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.create).toHaveBeenCalledWith(
          '11148',
          'http://example.com',
          undefined,
          undefined
        );
        expect(notificationService.success).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should include sub-prefix and sub-suffix when provided', (done) => {
      const formValue = {
        url: 'http://example.com',
        subPrefix: 'TEST',
        subSuffix: 'UFAL'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.create).toHaveBeenCalledWith(
          '11148',
          'http://example.com',
          'TEST',
          'UFAL'
        );
        done();
      }, 100);
    });

    it('should trim whitespace from inputs', (done) => {
      const formValue = {
        url: '  http://example.com  ',
        subPrefix: '  TEST  ',
        subSuffix: '  UFAL  '
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.create).toHaveBeenCalledWith(
          '11148',
          'http://example.com',
          'TEST',
          'UFAL'
        );
        done();
      }, 100);
    });

    it('should show error when URL is empty', () => {
      const formValue = { url: '' };

      component.onClickSubmit(formValue);

      expect(notificationService.error).toHaveBeenCalled();
      expect(epicHandleService.create).not.toHaveBeenCalled();
    });

    it('should show error when URL is whitespace only', () => {
      const formValue = { url: '   ' };

      component.onClickSubmit(formValue);

      expect(notificationService.error).toHaveBeenCalled();
      expect(epicHandleService.create).not.toHaveBeenCalled();
    });

    it('should handle API error', (done) => {
      epicHandleService.create.and.returnValue(throwError({ error: 'Error' }));
      const formValue = { url: 'http://example.com' };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationService.error).toHaveBeenCalled();
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
      epicHandleService.create.and.returnValue(of({ ...failedResponse, hasCompleted: true } as any));
      const formValue = { url: 'http://example.com' };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationService.error).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set loading state during submission', () => {
      epicHandleService.create.and.returnValue(new Observable(observer => {
        // emit asynchronously to simulate in-flight request
        setTimeout(() => {
          observer.next({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any);
          observer.complete();
        }, 50);
      }));
      const formValue = { url: 'http://example.com' };

      component.onClickSubmit(formValue);

      expect(component.isLoading).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should redirect back after successful creation', (done) => {
      epicHandleService.create.and.returnValue(of({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any));
      const formValue = { url: 'http://example.com' };

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
        { queryParams: { prefix: '11148' } }
      );
    });

    it('should redirect without currentPage when not provided', () => {
      component.currentPage = undefined;
      component.redirectBack();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/epic-handle-table'],
        { queryParams: { prefix: '11148' } }
      );
    });
  });

  describe('Update vs Create Path Routing', () => {
    describe('Update Path (PUT) - When Suffix is Provided', () => {
      it('should call UPDATE when suffix is provided', (done) => {
        epicHandleService.update.and.returnValue(
          of({ hasCompleted: true, hasSucceeded: true } as any)
        );

        const formValue = {
          url: 'http://example.com',
          suffix: 'MY-SUFFIX'
        };

        component.onClickSubmit(formValue);

        setTimeout(() => {
          expect(epicHandleService.update).toHaveBeenCalledWith('11148', 'MY-SUFFIX', 'http://example.com');
          expect(epicHandleService.create).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      it('should show success notification and redirect after successful update', (done) => {
        epicHandleService.update.and.returnValue(
          of({ hasCompleted: true, hasSucceeded: true } as any)
        );

        const formValue = {
          url: 'http://example.com',
          suffix: 'MY-SUFFIX'
        };

        component.onClickSubmit(formValue);

        setTimeout(() => {
          expect(notificationService.success).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(
            ['/epic-handle-table'],
            { queryParams: { prefix: '11148' } }
          );
          expect(component.isLoading).toBe(false);
          done();
        }, 100);
      });
    });

    describe('Create Path (POST) - When No Suffix', () => {
      beforeEach(() => {
        epicHandleService.create.and.returnValue(
          of({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any)
        );
      });

      it('should call CREATE when suffix is not provided', (done) => {
        const formValue = {
          url: 'http://example.com',
          subPrefix: 'TEST',
          subSuffix: 'UFAL'
        };

        component.onClickSubmit(formValue);

        setTimeout(() => {
          expect(epicHandleService.create).toHaveBeenCalledWith(
            '11148',
            'http://example.com',
            'TEST',
            'UFAL'
          );
          expect(epicHandleService.update).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      it('should call CREATE with undefined sub values when not provided', (done) => {
        const formValue = {
          url: 'http://example.com'
        };

        component.onClickSubmit(formValue);

        setTimeout(() => {
          expect(epicHandleService.create).toHaveBeenCalledWith(
            '11148',
            'http://example.com',
            undefined,
            undefined
          );
          done();
        }, 100);
      });
    });

    describe('Edge Cases - Suffix Priority', () => {
      it('should use UPDATE path even when sub values are provided if suffix exists', (done) => {
        epicHandleService.update.and.returnValue(
          of({ hasCompleted: true, hasSucceeded: true } as any)
        );

        // User provided all fields - suffix should take precedence
        const formValue = {
          url: 'http://example.com',
          suffix: 'MY-SUFFIX',
          subPrefix: 'TEST',
          subSuffix: 'UFAL'
        };

        component.onClickSubmit(formValue);

        setTimeout(() => {
          expect(epicHandleService.update).toHaveBeenCalled();
          expect(epicHandleService.create).not.toHaveBeenCalled();
          done();
        }, 100);
      });
    });
  });

  describe('Field Disabling Logic', () => {
    describe('Suffix disables sub values', () => {
      it('should disable subPrefix and subSuffix when suffix has value', () => {
        component.suffix = 'MY-SUFFIX';
        fixture.detectChanges();

        expect(component.isSuffixDisabled).toBe(false);
        expect(component.isSubValuesDisabled).toBe(true);
      });

      it('should keep sub values enabled when suffix is empty', () => {
        component.suffix = '';
        fixture.detectChanges();

        expect(component.isSubValuesDisabled).toBe(false);
      });

      it('should keep sub values enabled when suffix is whitespace only', () => {
        component.suffix = '   ';
        fixture.detectChanges();

        expect(component.isSubValuesDisabled).toBe(false);
      });
    });

    describe('Sub values disable suffix', () => {
      it('should disable suffix when subPrefix has value', () => {
        component.subPrefix = 'TEST';
        fixture.detectChanges();

        expect(component.isSuffixDisabled).toBe(true);
        expect(component.isSubValuesDisabled).toBe(false);
      });

      it('should disable suffix when subSuffix has value', () => {
        component.subSuffix = 'UFAL';
        fixture.detectChanges();

        expect(component.isSuffixDisabled).toBe(true);
        expect(component.isSubValuesDisabled).toBe(false);
      });

      it('should disable suffix when both sub values are provided', () => {
        component.subPrefix = 'TEST';
        component.subSuffix = 'UFAL';
        fixture.detectChanges();

        expect(component.isSuffixDisabled).toBe(true);
      });

      it('should keep suffix enabled when both sub values are empty', () => {
        component.subPrefix = '';
        component.subSuffix = '';
        fixture.detectChanges();

        expect(component.isSuffixDisabled).toBe(false);
      });
    });

    describe('Loading state disables fields', () => {
      it('should disable suffix and sub values when loading', () => {
        component.isLoading = true;
        fixture.detectChanges();

        expect(component.isSuffixDisabled).toBe(true);
        expect(component.isSubValuesDisabled).toBe(true);
      });
    });
  });

  describe('Update Path Error Handling', () => {
    it('should handle update API error', (done) => {
      epicHandleService.update.and.returnValue(
        throwError({ error: 'Update failed' })
      );

      const formValue = {
        url: 'http://example.com',
        suffix: 'MY-SUFFIX'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationService.error).toHaveBeenCalled();
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

    it('should handle update failed response', (done) => {
      epicHandleService.update.and.returnValue(
        of({
          hasCompleted: true,
          hasSucceeded: false,
          hasFailed: true,
          errorMessage: 'Handle already exists'
        } as any)
      );

      const formValue = {
        url: 'http://example.com',
        suffix: 'MY-SUFFIX'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationService.error).toHaveBeenCalledWith(
          '',
          'Handle already exists'
        );
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Create Path Error Handling', () => {
    it('should handle create failed response with custom error message', (done) => {
      epicHandleService.create.and.returnValue(
        of({
          hasCompleted: true,
          hasSucceeded: false,
          hasFailed: true,
          errorMessage: 'Prefix quota exceeded'
        } as any)
      );

      const formValue = { url: 'http://example.com' };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(notificationService.error).toHaveBeenCalledWith(
          '',
          'Prefix quota exceeded'
        );
        done();
      }, 100);
    });
  });

  describe('Getter Methods', () => {
    describe('hasSuffix getter', () => {
      it('should return true when suffix has non-whitespace value', () => {
        component.suffix = 'MY-SUFFIX';
        expect(component.hasSuffix).toBe(true);
      });

      it('should return false when suffix is empty', () => {
        component.suffix = '';
        expect(component.hasSuffix).toBe(false);
      });

      it('should return false when suffix is whitespace only', () => {
        component.suffix = '   ';
        expect(component.hasSuffix).toBe(false);
      });

      it('should return false when suffix is undefined', () => {
        component.suffix = undefined;
        expect(component.hasSuffix).toBe(false);
      });
    });

    describe('hasSubPrefix getter', () => {
      it('should return true when subPrefix has non-whitespace value', () => {
        component.subPrefix = 'TEST';
        expect(component.hasSubPrefix).toBe(true);
      });

      it('should return false when subPrefix is whitespace only', () => {
        component.subPrefix = '   ';
        expect(component.hasSubPrefix).toBe(false);
      });

      it('should return false when subPrefix is undefined', () => {
        component.subPrefix = undefined;
        expect(component.hasSubPrefix).toBe(false);
      });
    });

    describe('hasSubSuffix getter', () => {
      it('should return true when subSuffix has non-whitespace value', () => {
        component.subSuffix = 'UFAL';
        expect(component.hasSubSuffix).toBe(true);
      });

      it('should return false when subSuffix is whitespace only', () => {
        component.subSuffix = '   ';
        expect(component.hasSubSuffix).toBe(false);
      });

      it('should return false when subSuffix is undefined', () => {
        component.subSuffix = undefined;
        expect(component.hasSubSuffix).toBe(false);
      });
    });

    describe('isSuffixDisabled getter', () => {
      it('should return true when loading', () => {
        component.isLoading = true;
        expect(component.isSuffixDisabled).toBe(true);
      });

      it('should return true when hasSubPrefix is true', () => {
        component.subPrefix = 'TEST';
        expect(component.isSuffixDisabled).toBe(true);
      });

      it('should return true when hasSubSuffix is true', () => {
        component.subSuffix = 'UFAL';
        expect(component.isSuffixDisabled).toBe(true);
      });

      it('should return false when no disabling conditions are met', () => {
        component.isLoading = false;
        component.subPrefix = '';
        component.subSuffix = '';
        expect(component.isSuffixDisabled).toBe(false);
      });
    });

    describe('isSubValuesDisabled getter', () => {
      it('should return true when loading', () => {
        component.isLoading = true;
        expect(component.isSubValuesDisabled).toBe(true);
      });

      it('should return true when hasSuffix is true', () => {
        component.suffix = 'MY-SUFFIX';
        expect(component.isSubValuesDisabled).toBe(true);
      });

      it('should return false when no disabling conditions are met', () => {
        component.isLoading = false;
        component.suffix = '';
        expect(component.isSubValuesDisabled).toBe(false);
      });
    });
  });

  describe('Edge Cases - Partial Sub Values', () => {
    beforeEach(() => {
      epicHandleService.create.and.returnValue(
        of({ hasCompleted: true, hasSucceeded: true, payload: mockHandle } as any)
      );
    });

    it('should call create with only subPrefix when subSuffix is missing', (done) => {
      const formValue = {
        url: 'http://example.com',
        subPrefix: 'TEST'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.create).toHaveBeenCalledWith(
          '11148',
          'http://example.com',
          'TEST',
          undefined
        );
        done();
      }, 100);
    });

    it('should call create with only subSuffix when subPrefix is missing', (done) => {
      const formValue = {
        url: 'http://example.com',
        subSuffix: 'UFAL'
      };

      component.onClickSubmit(formValue);

      setTimeout(() => {
        expect(epicHandleService.create).toHaveBeenCalledWith(
          '11148',
          'http://example.com',
          undefined,
          'UFAL'
        );
        done();
      }, 100);
    });
  });

  describe('Button State Logic', () => {
    describe('hasSuffix affects button label', () => {
      it('should return true when suffix has value for button label change', () => {
        component.suffix = 'MY-SUFFIX';
        expect(component.hasSuffix).toBe(true);
      });

      it('should return false when suffix is empty for button label change', () => {
        component.suffix = '';
        expect(component.hasSuffix).toBe(false);
      });
    });
  });
});
