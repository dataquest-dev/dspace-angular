import { ChangeDetectorRef, Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { of as observableOf } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { createTestComponent } from '../../../shared/testing/utils.test';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { NotificationsServiceStub } from '../../../shared/testing/notifications-service.stub';
import { SubmissionService } from '../../submission.service';
import { SubmissionServiceStub } from '../../../shared/testing/submission-service.stub';
import { getMockTranslateService } from '../../../shared/mocks/translate.service.mock';
import { SectionsService } from '../sections.service';
import { SectionsServiceStub } from '../../../shared/testing/sections-service.stub';
import { SubmissionSectionFormComponent } from './section-form.component';
import { FormBuilderService } from '../../../shared/form/builder/form-builder.service';
import { getMockFormBuilderService } from '../../../shared/mocks/form-builder-service.mock';
import { getMockFormOperationsService } from '../../../shared/mocks/form-operations-service.mock';
import { SectionFormOperationsService } from './section-form-operations.service';
import { getMockFormService } from '../../../shared/mocks/form-service.mock';
import { FormService } from '../../../shared/form/form.service';
import { SubmissionFormsConfigService } from '../../../core/config/submission-forms-config.service';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsType } from '../sections-type';
import {
  mockSubmissionCollectionId,
  mockSubmissionId,
  mockUploadResponse1ParsedErrors
} from '../../../shared/mocks/submission.mock';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormComponent } from '../../../shared/form/form.component';
import { FormFieldModel } from '../../../shared/form/builder/models/form-field.model';
import { FormFieldMetadataValueObject } from '../../../shared/form/builder/models/form-field-metadata-value.model';
import { DynamicRowGroupModel } from '../../../shared/form/builder/ds-dynamic-form-ui/models/ds-dynamic-row-group-model';
import { DsDynamicInputModel } from '../../../shared/form/builder/ds-dynamic-form-ui/models/ds-dynamic-input.model';
import { SubmissionSectionError } from '../../objects/submission-objects.reducer';
import {DynamicFormControlEvent, DynamicFormControlEventType, parseReviver} from '@ng-dynamic-forms/core';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { FormRowModel } from '../../../core/config/models/config-submission-form.model';
import { WorkspaceItem } from '../../../core/submission/models/workspaceitem.model';
import { SubmissionObjectDataService } from '../../../core/submission/submission-object-data.service';
import { ObjectCacheService } from '../../../core/cache/object-cache.service';
import { RequestService } from '../../../core/data/request.service';
import { createSuccessfulRemoteDataObject$ } from '../../../shared/remote-data.utils';
import { cold } from 'jasmine-marbles';
import * as _ from 'lodash';
import value from '*.json';

function getMockSubmissionFormsConfigService(): SubmissionFormsConfigService {
  return jasmine.createSpyObj('FormOperationsService', {
    getConfigAll: jasmine.createSpy('getConfigAll'),
    getConfigByHref: jasmine.createSpy('getConfigByHref'),
    getConfigByName: jasmine.createSpy('getConfigByName'),
    getConfigBySearch: jasmine.createSpy('getConfigBySearch'),
    findByHref: jasmine.createSpy('findByHref'),
  });
}

const sectionObject: SectionDataObject = {
  config: 'https://dspace7.4science.it/or2018/api/config/submissionforms/traditionalpageone',
  mandatory: true,
  data: {},
  errorsToShow: [],
  serverValidationErrors: [],
  header: 'submit.progressbar.describe.stepone',
  id: 'traditionalpageone',
  sectionType: SectionsType.SubmissionForm
};

const testFormConfiguration = {
  name: 'testFormConfiguration',
  rows: [
    {
      fields: [
        {
          input: {
            type: 'onebox'
          },
          label: 'Title',
          mandatory: 'true',
          repeatable: false,
          hints: ' Enter Title.',
          typeBind: ['Article'],
          selectableMetadata: [
            {
              metadata: 'dc.title'
            }
          ],
          languageCodes: []
        } as FormFieldModel
      ]
    } as FormRowModel,
    {
      fields: [
        {
          input: {
            type: 'onebox'
          },
          label: 'Author',
          mandatory: 'false',
          repeatable: false,
          hints: ' Enter Author.',
          selectableMetadata: [
            {
              metadata: 'dc.contributor'
            }
          ],
          languageCodes: []
        } as FormFieldModel
      ]
    } as FormRowModel,
  ],
  type: 'submissionform',
  _links: {
    self: {
      href: 'testFormConfiguration.url'
    }
  }
} as any;

const testFormModel = [
  new DynamicRowGroupModel({
    id: 'df-row-group-config-1',
    group: [new DsDynamicInputModel({ id: 'dc.title', metadataFields: [], repeatable: false, submissionId: '1234', hasSelectableMetadata: false })],
  }),
  new DynamicRowGroupModel({
    id: 'df-row-group-config-2',
    group: [new DsDynamicInputModel({ id: 'dc.contributor', metadataFields: [], repeatable: false, submissionId: '1234', hasSelectableMetadata: false })],
  }),
];

const testOnChangeFormModel = [
  new DynamicRowGroupModel({
    id: 'df-row-group-config-3',
    group: [new DsDynamicInputModel({ id: 'dc.type', value: 'Article', metadataFields: [], repeatable: false, submissionId: '1234', hasSelectableMetadata: false })],
  }),
];

const dynamicFormControlEvent: DynamicFormControlEvent = {
  $event: new Event('change'),
  context: null,
  control: null,
  group: testFormModel[0] as any,
  model: testFormModel[0].group[0],
  type: DynamicFormControlEventType.Change
};

const onChangeFormControlEvent: DynamicFormControlEvent = {
  $event: new Event('change'),
  context: null,
  control: null,
  group: testOnChangeFormModel[0] as any,
  model: testOnChangeFormModel[0].group[0],
  type: DynamicFormControlEventType.Change
};

describe('SubmissionSectionFormComponent test suite', () => {

  let comp: SubmissionSectionFormComponent;
  let compAsAny: any;
  let fixture: ComponentFixture<SubmissionSectionFormComponent>;
  let submissionServiceStub: SubmissionServiceStub;
  let notificationsServiceStub: NotificationsServiceStub;
  let formService: any = getMockFormService();

  let formOperationsService: any;
  let formBuilderService: any;
  let translateService: any;

  const sectionsServiceStub: any = new SectionsServiceStub();
  const formConfigService: any = getMockSubmissionFormsConfigService();
  const submissionId = mockSubmissionId;
  const collectionId = mockSubmissionCollectionId;
  const parsedSectionErrors: any = mockUploadResponse1ParsedErrors.traditionalpageone;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        FormComponent,
        SubmissionSectionFormComponent,
        TestComponent
      ],
      providers: [
        { provide: FormBuilderService, useValue: getMockFormBuilderService() },
        { provide: SectionFormOperationsService, useValue: getMockFormOperationsService() },
        { provide: FormService, useValue: formService },
        { provide: SubmissionFormsConfigService, useValue: formConfigService },
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: SectionsService, useValue: sectionsServiceStub },
        { provide: SubmissionService, useClass: SubmissionServiceStub },
        { provide: TranslateService, useValue: getMockTranslateService() },
        { provide: ObjectCacheService, useValue: { remove: () => {/*do nothing*/}, hasBySelfLinkObservable: () => observableOf(false), hasByHref$: () => observableOf(false) } },
        { provide: RequestService, useValue: { removeByHrefSubstring: () => {/*do nothing*/}, hasByHref$: () => observableOf(false) } },
        { provide: 'collectionIdProvider', useValue: collectionId },
        { provide: 'sectionDataProvider', useValue: Object.assign({}, sectionObject) },
        { provide: 'submissionIdProvider', useValue: submissionId },
        { provide: SubmissionObjectDataService, useValue: { getHrefByID: () => observableOf('testUrl'), findById: () => createSuccessfulRemoteDataObject$(new WorkspaceItem()) } },
        ChangeDetectorRef,
        SubmissionSectionFormComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents().then();
  }));

  describe('', () => {
    let testComp: TestComponent;
    let testFixture: ComponentFixture<TestComponent>;

    // synchronous beforeEach
    beforeEach(() => {
      const sectionData = {};
      formService.isValid.and.returnValue(observableOf(true));
      formConfigService.findByHref.and.returnValue(observableOf(testFormConfiguration));
      sectionsServiceStub.getSectionData.and.returnValue(observableOf(sectionData));
      sectionsServiceStub.getSectionServerErrors.and.returnValue(observableOf([]));

      const html = `
        <ds-submission-section-form></ds-submission-section-form>`;

      testFixture = createTestComponent(html, TestComponent) as ComponentFixture<TestComponent>;
      testComp = testFixture.componentInstance;
    });

    afterEach(() => {
      testFixture.destroy();
    });

    it('should create SubmissionSectionFormComponent', inject([SubmissionSectionFormComponent], (app: SubmissionSectionFormComponent) => {

      expect(app).toBeDefined();

    }));
  });

  describe('', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(SubmissionSectionFormComponent);
      comp = fixture.componentInstance;
      compAsAny = comp;
      submissionServiceStub = TestBed.inject(SubmissionService as any);
      formService = TestBed.inject(FormService);
      formBuilderService = TestBed.inject(FormBuilderService);
      formOperationsService = TestBed.inject(SectionFormOperationsService);
      translateService = TestBed.inject(TranslateService);
      notificationsServiceStub = TestBed.inject(NotificationsService as any);

      translateService.get.and.returnValue(observableOf('test'));
      compAsAny.pathCombiner = new JsonPatchOperationPathCombiner('sections', sectionObject.id);
    });

    afterEach(() => {
      fixture.destroy();
      comp = null;
      compAsAny = null;
    });

    it('should init section properly', () => {
      const sectionData = {};
      formService.isValid.and.returnValue(observableOf(true));
      formConfigService.findByHref.and.returnValue(createSuccessfulRemoteDataObject$(testFormConfiguration));
      sectionsServiceStub.getSectionData.and.returnValue(observableOf(sectionData));
      sectionsServiceStub.getSectionServerErrors.and.returnValue(observableOf([]));
      spyOn(comp, 'initForm');
      spyOn(comp, 'subscriptions');

      comp.onSectionInit();
      fixture.detectChanges();

      expect(compAsAny.formConfig).toEqual(testFormConfiguration);
      expect(comp.sectionData.errorsToShow).toEqual([]);
      expect(comp.sectionData.data).toEqual(sectionData);
      expect(comp.isLoading).toBeFalsy();
      expect(comp.initForm).toHaveBeenCalledWith(sectionData);
      expect(comp.subscriptions).toHaveBeenCalled();
    });

    it('should init form model properly', () => {
      formBuilderService.modelFromConfiguration.and.returnValue(testFormModel);
      const sectionData = {};

      comp.initForm(sectionData);

      expect(comp.formModel).toEqual(testFormModel);

    });

    it('should set a section Error when init form model fails', () => {
      formBuilderService.modelFromConfiguration.and.throwError('test');
      translateService.instant.and.returnValue('test');
      const sectionData = {};
      const sectionError: SubmissionSectionError = {
        message: 'test' + 'Error: test',
        path: '/sections/' + sectionObject.id
      };

      comp.initForm(sectionData);

      expect(comp.formModel).toBeUndefined();
      expect(sectionsServiceStub.setSectionError).toHaveBeenCalledWith(submissionId, sectionObject.id, sectionError);

    });

    it('should return true when has Metadata Enrichment', () => {
      const newSectionData = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      compAsAny.formData = {};
      compAsAny.sectionMetadata = ['dc.title'];

      expect(comp.hasMetadataEnrichment(newSectionData)).toBeTruthy();
    });

    it('should return false when has not Metadata Enrichment', () => {
      const newSectionData = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      compAsAny.formData = newSectionData;
      compAsAny.sectionMetadata = ['dc.title'];
      expect(comp.hasMetadataEnrichment(newSectionData)).toBeFalsy();
    });

    it('should return false when metadata has Metadata Enrichment but not belonging to sectionMetadata', () => {
      const newSectionData = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      compAsAny.formData = newSectionData;
      compAsAny.sectionMetadata = [];
      expect(comp.hasMetadataEnrichment(newSectionData)).toBeFalsy();
    });

    it('should update form properly', () => {
      spyOn(comp, 'initForm');
      spyOn(comp, 'checksForErrors');
      const sectionData: any = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      const sectionError = [];
      comp.sectionData.data = {};
      comp.sectionData.errorsToShow = [];
      compAsAny.formData = {};
      compAsAny.sectionMetadata = ['dc.title'];

      comp.updateForm(sectionData, sectionError);

      expect(comp.isUpdating).toBeFalsy();
      expect(comp.initForm).toHaveBeenCalled();
      expect(comp.checksForErrors).toHaveBeenCalled();
      expect(comp.sectionData.data).toEqual(sectionData);

    });

    it('should update form error properly', () => {
      spyOn(comp, 'initForm');
      spyOn(comp, 'checksForErrors');
      const sectionData: any = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      comp.sectionData.data = {};
      comp.sectionData.errorsToShow = [];
      compAsAny.formData = sectionData;
      compAsAny.sectionMetadata = ['dc.title'];

      comp.updateForm(sectionData, parsedSectionErrors);

      expect(comp.initForm).not.toHaveBeenCalled();
      expect(comp.checksForErrors).toHaveBeenCalled();
      expect(comp.sectionData.data).toEqual(sectionData);
    });

    it('should update form error properly', () => {
      spyOn(comp, 'initForm');
      spyOn(comp, 'checksForErrors');
      const sectionData: any = {};

      comp.updateForm(sectionData, parsedSectionErrors);

      expect(comp.initForm).not.toHaveBeenCalled();
      expect(comp.checksForErrors).toHaveBeenCalled();

    });

    it('should check for error', () => {
      comp.isUpdating = false;
      comp.formId = 'test';
      comp.sectionData.errorsToShow = [];
      comp.sectionData.serverValidationErrors = [];

      comp.checksForErrors(parsedSectionErrors);

      expect(sectionsServiceStub.checkSectionErrors).toHaveBeenCalledWith(
        submissionId,
        sectionObject.id,
        'test',
        parsedSectionErrors,
        []
      );
      expect(comp.sectionData.errorsToShow).toEqual(parsedSectionErrors);
    });

    it('should return a valid status when form is valid and there are no server validation errors', () => {
      formService.isValid.and.returnValue(observableOf(true));
      sectionsServiceStub.getSectionServerErrors.and.returnValue(observableOf([]));
      const expected = cold('(b|)', {
        b: true
      });

      expect(compAsAny.getSectionStatus()).toBeObservable(expected);
    });

    it('should return an invalid status when form is valid and there are server validation errors', () => {
      formService.isValid.and.returnValue(observableOf(true));
      sectionsServiceStub.getSectionServerErrors.and.returnValue(observableOf(parsedSectionErrors));
      const expected = cold('(b|)', {
        b: false
      });

      expect(compAsAny.getSectionStatus()).toBeObservable(expected);
    });

    it('should return an invalid status when form is not valid and there are no server validation errors', () => {
      formService.isValid.and.returnValue(observableOf(false));
      sectionsServiceStub.getSectionServerErrors.and.returnValue(observableOf([]));
      const expected = cold('(b|)', {
        b: false
      });

      expect(compAsAny.getSectionStatus()).toBeObservable(expected);
    });

    it('should subscribe to state properly', () => {
      spyOn(comp, 'updateForm');
      const formData = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      const sectionData: any = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      };
      const sectionState = {
        data: sectionData,
        errorsToShow: parsedSectionErrors
      };

      formService.getFormData.and.returnValue(observableOf(formData));
      sectionsServiceStub.getSectionState.and.returnValue(observableOf(sectionState));

      comp.subscriptions();

      expect(compAsAny.subs.length).toBe(2);
      expect(compAsAny.formData).toEqual(formData);
      expect(comp.updateForm).toHaveBeenCalledWith(sectionState.data, sectionState.errorsToShow);

    });

    it('should call dispatchOperationsFromEvent on form change', () => {
      spyOn(comp, 'hasStoredValue').and.returnValue(false);
      formOperationsService.getFieldPathSegmentedFromChangeEvent.and.returnValue('path');
      formOperationsService.getFieldValueFromChangeEvent.and.returnValue('test');

      comp.onChange(dynamicFormControlEvent);

      expect(formOperationsService.dispatchOperationsFromEvent).toHaveBeenCalled();
      expect(formOperationsService.getFieldPathSegmentedFromChangeEvent).toHaveBeenCalledWith(dynamicFormControlEvent);
      expect(formOperationsService.getFieldValueFromChangeEvent).toHaveBeenCalledWith(dynamicFormControlEvent);
      expect(submissionServiceStub.dispatchSave).not.toHaveBeenCalledWith(submissionId);

    });

    it('should call dispatchSave on form change when metadata is in submission autosave configuration', () => {
      spyOn(comp, 'hasStoredValue').and.returnValue(false);
      formOperationsService.getFieldPathSegmentedFromChangeEvent.and.returnValue('dc.title');
      formOperationsService.getFieldValueFromChangeEvent.and.returnValue('test');

      comp.onChange(dynamicFormControlEvent);

      expect(formOperationsService.dispatchOperationsFromEvent).toHaveBeenCalled();
      expect(formOperationsService.getFieldPathSegmentedFromChangeEvent).toHaveBeenCalledWith(dynamicFormControlEvent);
      expect(formOperationsService.getFieldValueFromChangeEvent).toHaveBeenCalledWith(dynamicFormControlEvent);
      expect(submissionServiceStub.dispatchSave).toHaveBeenCalledWith(submissionId);

    });

    describe('test type-bind', () => {
      beforeEach(() => {
        formBuilderService.modelFromConfiguration.and.returnValue(testFormModel);
        const sectionData = {};

        comp.initForm(sectionData);
      });

      it('should not init all fields to the comp.formModel because one has type-bind.', () => {

        // formBuilderService.modelFromConfiguration.and.returnValue(testFormModel);
        // const sectionData = {};
        //
        // comp.initForm(sectionData);
        expect(comp.formModel.length).toEqual(1);
        expect(comp.formModel[0].id).toEqual('df-row-group-config-2');
      });

      it('should call methods initFormWithValues and updateFormBaseOnTypeBind onChange event', () => {
        spyOn(comp,'initFormWithValues');
        spyOn(comp,'updateFormBaseOnTypeBind');

        comp.onChange(onChangeFormControlEvent);

        expect(comp.initFormWithValues).toHaveBeenCalledWith(undefined);
        expect(comp.updateFormBaseOnTypeBind).toHaveBeenCalledWith(onChangeFormControlEvent, undefined);
      });

      it('should remove fields with type-bind from the form model by initFormWithValues method', () => {
        const testFormConfWithoutTypeBind = _.cloneDeep(testFormConfiguration);
        testFormConfWithoutTypeBind.rows[0].fields.splice(0,1);
        formBuilderService.removeFieldFromRow.and.returnValue(testFormConfWithoutTypeBind.rows[0]);
        formBuilderService.parseFormRow.and.returnValue(comp.formModel[0]);
        comp.initFormWithValues(testFormConfiguration);

        expect(comp.formModel).not.toEqual(testFormModel);
        expect(comp.formModel.length).toEqual(1);
        expect(comp.formModel[0].id).toEqual('df-row-group-config-2');
      });

      it('should add fields with type-bind to the form model by updateFormBaseOnTypeBind method', () => {
        // formBuilderService.modelFromConfiguration.and.returnValue(testFormModel);
        // const sectionData = {};
        //
        // comp.initForm(sectionData);
        /**
         * Remove type-bind fields from the formModel
         */
        const testFormConfWithoutTypeBind = _.cloneDeep(testFormConfiguration);
        testFormConfWithoutTypeBind.rows[0].fields.splice(0,1);
        formBuilderService.removeFieldFromRow.and.returnValue(testFormConfWithoutTypeBind.rows[0]);
        formBuilderService.parseFormRow.and.returnValue(comp.formModel[0]);
        comp.initFormWithValues(testFormConfiguration);

        /**
         * Add fields with type-bind to the formModel
         */
        formBuilderService.removeFieldFromRow.and.returnValue(testFormConfiguration.rows[0]);
        onChangeFormControlEvent.$event.value = 'Article';
        comp.updateFormBaseOnTypeBind(onChangeFormControlEvent, testFormConfiguration);

        expect(comp.formModel).toEqual(testFormModel);
        expect(comp.formModel.length).toEqual(2);
        expect(comp.formModel[0].id).toEqual('df-row-group-config-1');
      });


    }),


    it('should set previousValue on form focus event', () => {
      formBuilderService.hasMappedGroupValue.and.returnValue(false);
      formOperationsService.getFieldValueFromChangeEvent.and.returnValue('test');

      comp.onFocus(dynamicFormControlEvent);

      expect(compAsAny.previousValue.path).toEqual(['test', 'path']);
      expect(compAsAny.previousValue.value).toBe('test');

      formBuilderService.hasMappedGroupValue.and.returnValue(true);
      formOperationsService.getQualdropValueMap.and.returnValue('qualdrop');

      comp.onFocus(dynamicFormControlEvent);
      expect(compAsAny.previousValue.path).toEqual(['test', 'path']);
      expect(compAsAny.previousValue.value).toBe('qualdrop');

      formBuilderService.hasMappedGroupValue.and.returnValue(false);
      formOperationsService.getFieldValueFromChangeEvent.and.returnValue(new FormFieldMetadataValueObject('form value test'));

      comp.onFocus(dynamicFormControlEvent);
      expect(compAsAny.previousValue.path).toEqual(['test', 'path']);
      expect(compAsAny.previousValue.value).toEqual(new FormFieldMetadataValueObject('form value test'));
    });

    it('should call dispatchOperationsFromEvent on form remove event', () => {
      spyOn(comp, 'hasStoredValue').and.returnValue(false);

      comp.onRemove(dynamicFormControlEvent);

      expect(formOperationsService.dispatchOperationsFromEvent).toHaveBeenCalled();

    });

    it('should check if has stored value in the section state', () => {
      comp.sectionData.data = {
        'dc.title': [new FormFieldMetadataValueObject('test')]
      } as any;

      expect(comp.hasStoredValue('dc.title', 0)).toBeTruthy();
      expect(comp.hasStoredValue('dc.title', 1)).toBeFalsy();
      expect(comp.hasStoredValue('title', 0)).toBeFalsy();

    });
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``
})
class TestComponent {

}
