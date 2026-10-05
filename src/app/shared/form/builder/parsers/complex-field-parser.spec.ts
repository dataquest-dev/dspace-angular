import { TestBed } from '@angular/core/testing';
import {
  DynamicFormService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';

import { getMockTranslateService } from '../../../mocks/translate.service.mock';
import { DynamicComplexModel } from '../ds-dynamic-form-ui/models/ds-dynamic-complex.model';
import { DsDynamicInputModel } from '../ds-dynamic-form-ui/models/ds-dynamic-input.model';
import { DynamicRowArrayModel } from '../ds-dynamic-form-ui/models/ds-dynamic-row-array-model';
import { FormFieldModel } from '../models/form-field.model';
import { ComplexFieldParser } from './complex-field-parser';
import { ParserOptions } from './parser-options';

/**
 * The test class for the parser `complex-field-parser.ts`.
 * Test if that Parser correctly parse DynamicComplexModelConfig to the DynamicComplexModel.
 */
describe('ComplexFieldParser test suite', () => {
  let field: FormFieldModel;
  const initFormValues: any = {};
  const translateService = getMockTranslateService();

  const submissionId = '1234';
  const parserOptions: ParserOptions = {
    readOnly: false,
    submissionScope: null,
    collectionUUID: null,
    typeField: 'dc_type',
  };
  const separator = ';';

  const requiredInputs = (complexModel: DynamicComplexModel) =>
    (complexModel.group as DsDynamicInputModel[]).filter((input) => input.required);

  beforeEach(() => {
    field = {
      input: {
        type: 'complex',
      },
      mandatory: 'false',
      label: 'Contact person',
      repeatable: true,
      hints: 'This is contact person',
      selectableMetadata: [
        {
          metadata: 'local.contact.person',
        },
      ],
      languageCodes: [],
      complexDefinition: '[{"givenname":{"name":"givenname","input-type":"text","label":"Given name",' +
        '"required":"true"}},{"surname":{"name":"surname","input-type":"text","label":"Surname",' +
        '"required":"true"}},{"email":{"name":"email","regex":"[^@]+@[^\\\\.@]+\\\\.[^@]+","input-type":' +
        '"text","label":"Email","required":"true"}},{"affiliation":{"name":"affiliation","input-type":' +
        '"text","label":"Affiliation"}}]',
    } as FormFieldModel;

  });

  it('should init parser properly', () => {
    const parser = new ComplexFieldParser(submissionId, field, initFormValues, parserOptions, separator, [],
      translateService);

    expect(parser instanceof ComplexFieldParser).toBe(true);
  });

  it('should return a DynamicRowArrayModel object with expected label', () => {
    const parser = new ComplexFieldParser(submissionId, field, initFormValues, parserOptions, separator, [],
      translateService);

    const expectedValue = 'Contact person';
    const fieldModel = parser.parse();

    expect(fieldModel instanceof DynamicRowArrayModel).toBe(true);
    expect(fieldModel.label).toBe(expectedValue);
  });

  it('should keep the mandatory message of a mandatory field on its required inputs', () => {
    field.mandatory = 'true';
    field.mandatoryMessage = 'Please fill all the fields for the contact person.';
    const parser = new ComplexFieldParser(submissionId, field, initFormValues, parserOptions, separator, [],
      translateService);

    const inputs = requiredInputs(parser.modelFactory());

    expect(inputs.length).toBe(3);
    inputs.forEach((input) =>
      expect(input.errorMessages.required).toBe('Please fill all the fields for the contact person.'));
  });

  describe('an optional field with required inputs', () => {
    let complexModel: DynamicComplexModel;

    beforeEach(() => {
      const fundingField = {
        input: {
          type: 'complex',
        },
        mandatory: false,
        label: 'Funding',
        repeatable: true,
        selectableMetadata: [
          {
            metadata: 'local.sponsor',
          },
        ],
        languageCodes: [],
        complexDefinition: '[{"type":{"name":"type","value-pairs-name":"metashare_funding","input-type":"dropdown",' +
          '"label":"Funding type","required":"true"}},{"code":{"name":"code","input-type":"autocomplete",' +
          '"label":"Grant no. or funding project code","required":"true"}},{"orgname":{"name":"orgname",' +
          '"input-type":"text","label":"Funding organization","required":"true"}},{"projname":{"name":"projname",' +
          '"input-type":"autocomplete","label":"Funding project name","required":"true"}},{"openaire_id":' +
          '{"name":"openaire_id","input-type":"text","label":"EU Project Identifier (OpenAIRE)","readonly":"true"}}]',
      } as unknown as FormFieldModel;
      const parser = new ComplexFieldParser(submissionId, fundingField, initFormValues, parserOptions, separator, [],
        translateService);
      complexModel = parser.modelFactory();
    });

    it('should give the required inputs the default required message', () => {
      const inputs = requiredInputs(complexModel);

      expect(inputs.length).toBe(4);
      inputs.forEach((input) => expect(input.errorMessages.required).toBe('error.validation.required'));
    });

    it('should build the error messages of the empty required inputs', () => {
      const formGroup = TestBed.inject(DynamicFormService).createFormGroup([complexModel]);
      const validationService = TestBed.inject(DynamicFormValidationService);

      requiredInputs(complexModel).forEach((input) => {
        const control = formGroup.get([complexModel.id, input.id]);

        expect(control.hasError('required')).toBe(true);
        expect(validationService.createErrorMessages(control, input)).toEqual(['error.validation.required']);
      });
    });
  });
});
