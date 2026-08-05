import { Injector } from '@angular/core';
import {
  inject,
  TestBed,
} from '@angular/core/testing';
import {
  ReactiveFormsModule,
  UntypedFormControl,
} from '@angular/forms';
import {
  DISABLED_MATCHER_PROVIDER,
  DynamicFormRelationService,
  HIDDEN_MATCHER,
  HIDDEN_MATCHER_PROVIDER,
  REQUIRED_MATCHER_PROVIDER,
} from '@ng-dynamic-forms/core';
import { Subject } from 'rxjs';

import { getMockFormBuilderService } from '../../../mocks/form-builder-service.mock';
import {
  dcTypeInputConfig,
  mockInputWithTypeBindModel,
  MockRelationModel,
} from '../../../mocks/form-models.mock';
import { FormBuilderService } from '../form-builder.service';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import { DsDynamicTypeBindRelationService } from './ds-dynamic-type-bind-relation.service';
import { DsDynamicInputModel } from './models/ds-dynamic-input.model';
import { getTypeBindRelations } from './type-bind.utils';

describe('DSDynamicTypeBindRelationService test suite', () => {
  let service: DsDynamicTypeBindRelationService;
  let dynamicFormRelationService: DynamicFormRelationService;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: FormBuilderService, useValue: getMockFormBuilderService() },
        { provide: DsDynamicTypeBindRelationService, useClass: DsDynamicTypeBindRelationService },
        { provide: DynamicFormRelationService },
        DISABLED_MATCHER_PROVIDER, HIDDEN_MATCHER_PROVIDER, REQUIRED_MATCHER_PROVIDER,
      ],
    }).compileComponents().then();
  });

  beforeEach(inject([DsDynamicTypeBindRelationService, DynamicFormRelationService],
    (relationService: DsDynamicTypeBindRelationService,
      formRelationService: DynamicFormRelationService,
    ) => {
      service = relationService;
      dynamicFormRelationService = formRelationService;
    }));

  describe('Test getTypeBindValue method', () => {
    it('Should get type bind "boundType" from the given metadata object value', () => {
      const mockMetadataValueObject: FormFieldMetadataValueObject = new FormFieldMetadataValueObject(
        'boundType', null, null, 'Bound Type',
      );
      const bindType = service.getTypeBindValue(mockMetadataValueObject);
      expect(bindType).toBe('boundType');
    });
    it('Should get type authority key "bound-auth-key" from the given metadata object value', () => {
      const mockMetadataValueObject: FormFieldMetadataValueObject = new FormFieldMetadataValueObject(
        'boundType', null, 'bound-auth-key', 'Bound Type',
      );
      const bindType = service.getTypeBindValue(mockMetadataValueObject);
      expect(bindType).toBe('bound-auth-key');
    });
    it('Should get passed string returned directly as string passed instead of metadata', () => {
      const bindType = service.getTypeBindValue('rawString');
      expect(bindType).toBe('rawString');
    });
    it('Should get "undefined" returned directly as no object given', () => {
      const bindType = service.getTypeBindValue(undefined);
      expect(bindType).toBeUndefined();
    });
  });

  describe('Test getRelatedFormModel method', () => {
    it('Should get 0 related form models for simple type bind mock data', () => {
      const testModel = MockRelationModel;
      const relatedModels = service.getRelatedFormModel(testModel);
      expect(relatedModels).toHaveSize(0);
    });
    it('Should get 1 related form models for mock relation model data', () => {
      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'dc.type');
      const relatedModels = service.getRelatedFormModel(testModel);
      expect(relatedModels).toHaveSize(1);
    });
    it('Should ask the form builder for the model that controls this field', () => {
      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'edm_type');
      service.getRelatedFormModel(testModel);
      expect((service as any).formBuilderService.getTypeBindModel).toHaveBeenCalledWith('edm_type');
    });
  });

  describe('Test matchesCondition method', () => {
    it('Should receive one subscription to dc.type type binding"', () => {
      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'dc.type');
      const dcTypeControl = new UntypedFormControl();
      dcTypeControl.setValue('boundType');
      let subscriptions = service.subscribeRelations(testModel, dcTypeControl);
      expect(subscriptions).toHaveSize(1);
    });

    it('Expect hasMatch to be true (ie. this should be hidden)', () => {
      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'dc.type');
      const dcTypeControl = new UntypedFormControl();
      dcTypeControl.setValue('boundType');
      testModel.typeBindRelations[0].when[0].value = 'anotherType';
      const relation = dynamicFormRelationService.findRelationByMatcher((testModel as any).typeBindRelations, HIDDEN_MATCHER);
      const matcher = HIDDEN_MATCHER;
      if (relation !== undefined) {
        const hasMatch = service.matchesCondition(relation, matcher);
        matcher.onChange(hasMatch, testModel, dcTypeControl, injector);
        expect(hasMatch).toBeTruthy();
      }
    });

    it('Expect hasMatch to be false (ie. this should NOT be hidden)', () => {
      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'dc.type');
      const dcTypeControl = new UntypedFormControl();
      dcTypeControl.setValue('boundType');
      testModel.typeBindRelations[0].when[0].value = 'boundType';
      const relation = dynamicFormRelationService.findRelationByMatcher((testModel as any).typeBindRelations, HIDDEN_MATCHER);
      const matcher = HIDDEN_MATCHER;
      if (relation !== undefined) {
        const hasMatch = service.matchesCondition(relation, matcher);
        matcher.onChange(hasMatch, testModel, dcTypeControl, injector);
        expect(hasMatch).toBeFalsy();
      }
    });

    it('Expect hasMatch to be true when the controlling model is not registered (field stays hidden)', () => {
      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'edm_type');
      ((service as any).formBuilderService.getTypeBindModel as jasmine.Spy).and.returnValue(undefined);
      const relation = dynamicFormRelationService.findRelationByMatcher((testModel as any).typeBindRelations, HIDDEN_MATCHER);
      expect(service.matchesCondition(relation, HIDDEN_MATCHER)).toBeTruthy();
    });

    it('Should attach to the controlling model as soon as it is registered, and stop when the caller unsubscribes', () => {
      const bindModelUpdates = new Subject<string>();
      const formBuilderServiceSpy: any = (service as any).formBuilderService;
      formBuilderServiceSpy.getTypeBindModelUpdates.and.returnValue(bindModelUpdates.asObservable());
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(undefined);

      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'edm_type');
      const dcTypeControl = new UntypedFormControl();
      // the caller (ds-dynamic-form-control-container) spreads the result into its own array, so a
      // subscription created later has to hang off something handed over now to ever be torn down
      const [subscription] = service.subscribeRelations(testModel, dcTypeControl);

      const controllingModel = new DsDynamicInputModel(dcTypeInputConfig);
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(controllingModel);
      bindModelUpdates.next('edm_type');

      controllingModel.value = 'anotherType';
      expect(testModel.hidden).toBeTrue();
      controllingModel.value = 'boundType';
      expect(testModel.hidden).toBeFalse();

      subscription.unsubscribe();

      controllingModel.value = 'anotherType';
      expect(testModel.hidden).toBeFalse();
    });

    it('Should leave a self-bound field untouched instead of hiding it forever', () => {
      const formBuilderServiceSpy: any = (service as any).formBuilderService;
      const testModel = mockInputWithTypeBindModel;
      // the field's own <type-bind field="..."> resolves back to the field itself
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], testModel.id);
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(testModel);
      testModel.hidden = false;

      const subscriptions = service.subscribeRelations(testModel, new UntypedFormControl());

      expect(service.getRelatedFormModel(testModel)).toHaveSize(0);
      // nothing is evaluated, so the misconfigured field stays usable instead of being hidden forever
      expect(testModel.hidden).toBeFalse();
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    });

    it('Should attach the real controlling model even when it was first bound to the default one', () => {
      // until edm_type is registered, getTypeBindModel falls back to the default dc_type model, so
      // a related model IS attached - the late registration must still be picked up
      const bindModelUpdates = new Subject<string>();
      const formBuilderServiceSpy: any = (service as any).formBuilderService;
      formBuilderServiceSpy.getTypeBindModelUpdates.and.returnValue(bindModelUpdates.asObservable());
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(new DsDynamicInputModel(dcTypeInputConfig));

      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'edm_type');
      const [subscription] = service.subscribeRelations(testModel, new UntypedFormControl());

      const controllingModel = new DsDynamicInputModel({
        ...dcTypeInputConfig,
        id: 'edm_type',
        name: 'edm.type',
      });
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(controllingModel);
      bindModelUpdates.next('edm_type');

      controllingModel.value = 'anotherType';
      expect(testModel.hidden).toBeTrue();
      controllingModel.value = 'boundType';
      expect(testModel.hidden).toBeFalse();

      subscription.unsubscribe();
    });

    it('Should follow a re-registered controlling model and drop the stale one', () => {
      // re-parsing the section that holds the controlling field yields a new instance under the same id
      const bindModelUpdates = new Subject<string>();
      const formBuilderServiceSpy: any = (service as any).formBuilderService;
      formBuilderServiceSpy.getTypeBindModelUpdates.and.returnValue(bindModelUpdates.asObservable());

      const firstInstance = new DsDynamicInputModel({ ...dcTypeInputConfig, id: 'edm_type', name: 'edm.type' });
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(firstInstance);

      const testModel = mockInputWithTypeBindModel;
      testModel.typeBindRelations = getTypeBindRelations(['boundType'], 'edm_type');
      const [subscription] = service.subscribeRelations(testModel, new UntypedFormControl());

      const secondInstance = new DsDynamicInputModel({ ...dcTypeInputConfig, id: 'edm_type', name: 'edm.type' });
      formBuilderServiceSpy.getTypeBindModel.and.returnValue(secondInstance);
      bindModelUpdates.next('edm_type');

      secondInstance.value = 'boundType';
      expect(testModel.hidden).toBeFalse();

      // the replaced instance must no longer drive the field
      firstInstance.value = 'anotherType';
      expect(testModel.hidden).toBeFalse();

      secondInstance.value = 'anotherType';
      expect(testModel.hidden).toBeTrue();

      subscription.unsubscribe();
    });

  });

});
