import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { of as observableOf } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { SubmissionServiceStub } from '../../../shared/testing/submission-service.stub';
import {
  mockSectionsData,
  mockSubmissionCollectionId,
  mockSubmissionId,
  mockSubmissionObject,
  mockUploadResponse1ParsedErrors,
  mockUploadResponse2Errors,
  mockUploadResponse2ParsedErrors
} from '../../../shared/mocks/submission.mock';
import { SubmissionService } from '../../submission.service';

import { SectionsServiceStub } from '../../../shared/testing/sections-service.stub';
import { SectionsService } from '../../sections/sections.service';
import { SubmissionUploadFilesComponent } from './submission-upload-files.component';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { NotificationsServiceStub } from '../../../shared/testing/notifications-service.stub';
import { getMockTranslateService } from '../../../shared/mocks/translate.service.mock';
import { cold, hot } from 'jasmine-marbles';
import { SubmissionJsonPatchOperationsServiceStub } from '../../../shared/testing/submission-json-patch-operations-service.stub';
import { SubmissionJsonPatchOperationsService } from '../../../core/submission/submission-json-patch-operations.service';
import { SharedModule } from '../../../shared/shared.module';
import { createTestComponent } from '../../../shared/testing/utils.test';
import { UploaderOptions } from '../../../shared/upload/uploader/uploader-options.model';

describe('SubmissionUploadFilesComponent Component', () => {

  let comp: SubmissionUploadFilesComponent;
  let compAsAny: any;
  let fixture: ComponentFixture<SubmissionUploadFilesComponent>;
  let submissionServiceStub: SubmissionServiceStub;
  let sectionsServiceStub: SectionsServiceStub;
  let notificationsServiceStub: NotificationsServiceStub;
  let translateService: any;

  const submissionJsonPatchOperationsServiceStub = new SubmissionJsonPatchOperationsServiceStub();
  const submissionId = mockSubmissionId;
  const collectionId = mockSubmissionCollectionId;
  const uploadRestResponse: any = mockSubmissionObject;

  const store: any = jasmine.createSpyObj('store', {
    dispatch: jasmine.createSpy('dispatch'),
    select: jasmine.createSpy('select')
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        SubmissionUploadFilesComponent,
        TestComponent
      ],
      providers: [
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: SubmissionService, useClass: SubmissionServiceStub },
        { provide: SectionsService, useClass: SectionsServiceStub },
        { provide: TranslateService, useValue: getMockTranslateService() },
        { provide: SubmissionJsonPatchOperationsService, useValue: submissionJsonPatchOperationsServiceStub },
        { provide: Store, useValue: store },
        ChangeDetectorRef,
        SubmissionUploadFilesComponent
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  describe('', () => {
    let testComp: TestComponent;
    let testFixture: ComponentFixture<TestComponent>;

    // synchronous beforeEach
    beforeEach(() => {
      const html = `
        <ds-submission-upload-files [submissionId]="submissionId"
                                    [collectionId]="collectionId"
                                    [uploadFilesOptions]="uploadFilesOptions"></ds-submission-upload-files>`;

      testFixture = createTestComponent(html, TestComponent) as ComponentFixture<TestComponent>;
      testComp = testFixture.componentInstance;
    });

    afterEach(() => {
      testFixture.destroy();
    });

    it('should create SubmissionUploadFilesComponent', inject([SubmissionUploadFilesComponent], (app: SubmissionUploadFilesComponent) => {

      expect(app).toBeDefined();

    }));
  });

  describe('', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(SubmissionUploadFilesComponent);
      comp = fixture.componentInstance;
      compAsAny = comp;
      submissionServiceStub = TestBed.inject(SubmissionService as any);
      sectionsServiceStub = TestBed.inject(SectionsService as any);
      sectionsServiceStub.isSectionTypeAvailable.and.returnValue(observableOf(true));
      notificationsServiceStub = TestBed.inject(NotificationsService as any);
      translateService = TestBed.inject(TranslateService);
      comp.submissionId = submissionId;
      comp.collectionId = collectionId;
      comp.uploadFilesOptions = Object.assign(new UploaderOptions(),{
        url: '',
        authToken: null,
        disableMultipart: false,
        itemAlias: null
      });

    });

    afterEach(() => {
      comp = null;
      compAsAny = null;
      fixture = null;
      submissionServiceStub = null;
      sectionsServiceStub = null;
      notificationsServiceStub = null;
      translateService = null;
    });

    it('should init uploadEnabled properly', () => {
      sectionsServiceStub.isSectionTypeAvailable.and.returnValue(hot('-a-b', {
        a: false,
        b: true
      }));

      const expected = cold('-c-d', {
        c: false,
        d: true
      });

      comp.ngOnChanges();
      fixture.detectChanges();

      expect(compAsAny.uploadEnabled).toBeObservable(expected);
    });

    describe('on upload complete', () => {
      beforeEach(() => {
        sectionsServiceStub.isSectionType.and.callFake((_, sectionId, __) => observableOf(sectionId === 'upload'));
        compAsAny.uploadEnabled = observableOf(true);
      });

      it('should show a success notification and call updateSectionData if successful', () => {
        const expectedErrors: any = mockUploadResponse1ParsedErrors;
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, { sections: mockSectionsData }),
          fileName: 'test.pdf',
        });

        Object.keys(mockSectionsData).forEach((sectionId) => {
          expect(sectionsServiceStub.updateSectionData).toHaveBeenCalledWith(
            submissionId,
            sectionId,
            mockSectionsData[sectionId],
          expectedErrors[sectionId],
            expectedErrors[sectionId]
          );
        });

        expect(notificationsServiceStub.success).toHaveBeenCalled();

      });

      it('should show an error notification and call updateSectionData if unsuccessful', () => {
        const responseErrors = mockUploadResponse2Errors;
        const expectedErrors: any = mockUploadResponse2ParsedErrors;
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, {
            sections: mockSectionsData,
            errors: responseErrors.errors
          }),
          fileName: 'test.pdf',
        });

        Object.keys(mockSectionsData).forEach((sectionId) => {
          expect(sectionsServiceStub.updateSectionData).toHaveBeenCalledWith(
            submissionId,
            sectionId,
            mockSectionsData[sectionId],
          expectedErrors[sectionId],
            expectedErrors[sectionId]
          );
        });

        expect(notificationsServiceStub.success).not.toHaveBeenCalled();

      });

      it('should include the file name in the success notification content', () => {
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, { sections: mockSectionsData }),
          fileName: 'test.pdf',
        });

        expect(translateService.get).toHaveBeenCalledWith(
          'submission.sections.upload.upload-successful-file',
          { fileName: 'test.pdf', default: 'T:submission.sections.upload.upload-successful' },
        );
        expect(translateService.get).not.toHaveBeenCalledWith('submission.sections.upload.upload-successful');
        expect(notificationsServiceStub.success).toHaveBeenCalledTimes(1);
      });

      it('should fall back to the generic success key when no file name is available', () => {
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, { sections: mockSectionsData }),
        });

        expect(translateService.get).toHaveBeenCalledWith('submission.sections.upload.upload-successful');
        expect(translateService.get).not.toHaveBeenCalledWith(
          'submission.sections.upload.upload-successful-file', jasmine.anything());
        expect(notificationsServiceStub.success).toHaveBeenCalledTimes(1);
      });

      it('should fall back to the generic success key when the file name is an empty string', () => {
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, { sections: mockSectionsData }),
          fileName: '',
        });

        expect(translateService.get).toHaveBeenCalledWith('submission.sections.upload.upload-successful');
        expect(translateService.get).not.toHaveBeenCalledWith(
          'submission.sections.upload.upload-successful-file', jasmine.anything());
      });

      it('should include the file name in the error notification content when the upload section has errors', () => {
        const responseErrors = mockUploadResponse2Errors;
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, {
            sections: mockSectionsData,
            errors: responseErrors.errors
          }),
          fileName: 'test.pdf',
        });

        expect(translateService.get).toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file',
          { fileName: 'test.pdf', default: 'T:submission.sections.upload.upload-failed' },
        );
        expect(translateService.get).not.toHaveBeenCalledWith('submission.sections.upload.upload-failed');
        expect(notificationsServiceStub.error).toHaveBeenCalledTimes(1);
        expect(notificationsServiceStub.success).not.toHaveBeenCalled();
      });

      it('should fall back to the generic error key when the upload section has errors and no file name is available', () => {
        const responseErrors = mockUploadResponse2Errors;
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, {
            sections: mockSectionsData,
            errors: responseErrors.errors
          }),
        });

        expect(translateService.get).toHaveBeenCalledWith('submission.sections.upload.upload-failed');
        expect(translateService.get).not.toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file', jasmine.anything());
        expect(notificationsServiceStub.error).toHaveBeenCalledTimes(1);
      });

      it('should not notify when the completion response carries no sections', () => {
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({ response: { message: 'forced' }, fileName: 'x.pdf' });

        expect(notificationsServiceStub.success).not.toHaveBeenCalled();
        expect(notificationsServiceStub.error).not.toHaveBeenCalled();
      });

      it('should not throw when the completion event is malformed', () => {
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        expect(() => comp.onCompleteItem(undefined as any)).not.toThrow();
        expect(() => comp.onCompleteItem({ response: undefined })).not.toThrow();

        expect(notificationsServiceStub.success).not.toHaveBeenCalled();
        expect(notificationsServiceStub.error).not.toHaveBeenCalled();
      });

      it('should raise file-name notifications on the escaped rendering path', () => {
        const hostileName = '<img src=x onerror=alert(1)>.pdf';
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        fixture.detectChanges();

        comp.onCompleteItem({
          response: Object.assign({}, uploadRestResponse, { sections: mockSectionsData }),
          fileName: hostileName,
        });
        comp.onUploadError({ item: { file: { name: hostileName } }, response: 'boom', status: 500, headers: {} });

        // Two arguments only: NotificationsService.success/error(title, content, options?, html = false).
        // A 4th positional `true` would move the content to the [innerHTML] branch of
        // notification.component.html, where an attacker-controlled file name would be parsed as markup.
        expect(notificationsServiceStub.success.calls.mostRecent().args.length).toBe(2);
        expect(notificationsServiceStub.error.calls.mostRecent().args.length).toBe(2);
        expect(translateService.get).toHaveBeenCalledWith(
          'submission.sections.upload.upload-successful-file',
          jasmine.objectContaining({ fileName: hostileName }));
        expect(translateService.get).toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file',
          jasmine.objectContaining({ fileName: hostileName }));
      });
    });

    describe('on upload error', () => {
      beforeEach(() => {
        // The bare getMockTranslateService() spy returns undefined for every key, which would make the
        // size-limit discriminator compare undefined === undefined and take the wrong branch. A real
        // TranslateService never returns undefined from instant() - it returns the key when a
        // translation is missing - so the callFake below is what makes this spec faithful.
        translateService.instant.and.callFake((key: string) => 'T:' + key);
        translateService.get.and.callFake((key: string, params?: any) =>
          observableOf(params ? key + ':' + params.fileName : key));
      });

      it('should show an error notification including the file name when available', () => {
        comp.onUploadError({ item: { file: { name: 'broken.zip' } }, response: 'boom', status: 500, headers: {} });

        expect(translateService.get).toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file',
          { fileName: 'broken.zip', default: 'T:submission.sections.upload.upload-failed' },
        );
        expect(translateService.get).not.toHaveBeenCalledWith('submission.sections.upload.upload-failed');
        expect(notificationsServiceStub.error).toHaveBeenCalledTimes(1);
      });

      it('should read the file name from item.name when the failed item has no file wrapper', () => {
        comp.onUploadError({ item: { name: 'big.zip', size: 9e9 }, response: 'boom', status: 400, headers: {} });

        expect(translateService.get).toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file',
          { fileName: 'big.zip', default: 'T:submission.sections.upload.upload-failed' },
        );
        expect(notificationsServiceStub.error).toHaveBeenCalledTimes(1);
      });

      it('should fall back to the generic error key when no file name is available', () => {
        comp.onUploadError();
        comp.onUploadError({});

        expect(translateService.get).toHaveBeenCalledWith('submission.sections.upload.upload-failed');
        expect(translateService.get).not.toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file', jasmine.anything());
        expect(notificationsServiceStub.error).toHaveBeenCalledTimes(2);
      });

      it('should show the un-interpolated size-limit message when the upload failed because the file is too large', () => {
        comp.onUploadError({
          item: { name: 'big.zip', size: 9e9 },
          response: 'T:submission.sections.upload.upload-failed.size-limit-exceeded',
          status: 400,
          headers: {},
        });

        expect(notificationsServiceStub.error).toHaveBeenCalledTimes(1);
        expect(translateService.get).not.toHaveBeenCalled();
        expect(translateService.instant.calls.mostRecent().args.length).toBe(1);
        expect(translateService.instant.calls.mostRecent().args[0])
          .toBe('submission.sections.upload.upload-failed.size-limit-exceeded');
      });

      it('should not add the file name to the size-limit message', () => {
        comp.onUploadError({
          item: { name: 'big.zip', size: 9e9 },
          response: 'T:submission.sections.upload.upload-failed.size-limit-exceeded',
          status: 400,
          headers: {},
        });

        expect(translateService.get).not.toHaveBeenCalledWith(
          'submission.sections.upload.upload-failed-file', jasmine.anything());
        // getNotificationContent is the only other producer of notification content and it ALWAYS
        // calls translate.get. `get` never being called therefore proves the ternary took the
        // size-limit branch and that the raw, un-interpolated size-limit string is what reached
        // NotificationsService - without asserting message identity through the notifications stub,
        // which AC-T-05 forbids because the shared-spy mock makes such assertions unfalsifiable.
        expect(translateService.get).not.toHaveBeenCalled();
        expect(notificationsServiceStub.error.calls.mostRecent().args.length).toBe(2);
      });
    });
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``
})
class TestComponent {

  submissionId = mockSubmissionId;
  collectionId = mockSubmissionCollectionId;
  uploadFilesOptions = Object.assign(new UploaderOptions(), {
    url: '',
    authToken: null,
    disableMultipart: false,
    itemAlias: null
  });

}
