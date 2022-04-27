import { Inject } from '@angular/core';
import { FormFieldModel } from '../models/form-field.model';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import {
  DynamicFormControlLayout,
  DynamicInputModel,
  DynamicInputModelConfig
} from '@ng-dynamic-forms/core';
import {
  COMPLEX_GROUP_SUFFIX,
  COMPLEX_INPUT_SUFFIX,
  DynamicComplexModel,
  DynamicComplexModelConfig,

} from '../ds-dynamic-form-ui/models/ds-dynamic-complex.model';
import { hasValue, isNotEmpty } from '../../../empty.util';
import { ParserOptions } from './parser-options';
import {
  CONFIG_DATA,
  FieldParser,
  INIT_FORM_VALUES,
  PARSER_OPTIONS,
  SUBMISSION_ID
} from './field-parser';

export class ComplexFieldParser extends FieldParser {

  constructor(
    @Inject(SUBMISSION_ID) submissionId: string,
    @Inject(CONFIG_DATA) configData: FormFieldModel,
    @Inject(INIT_FORM_VALUES) initFormValues,
    @Inject(PARSER_OPTIONS) parserOptions: ParserOptions,
    protected separator: string,
    protected placeholders: string[]) {
    super(submissionId, configData, initFormValues, parserOptions);
    this.separator = separator;
  }

  public modelFactory(fieldValue?: FormFieldMetadataValueObject | any, label?: boolean): any {

    let clsGroup: DynamicFormControlLayout;
    let clsInput: DynamicFormControlLayout;
    const id: string = this.configData.selectableMetadata[0].metadata;

    clsGroup = {
      element: {
        control: 'form-row',
      }
    };

    clsInput = {
      grid: {
        host: 'col-sm-12'
      }
    };

    const groupId = id.replace(/\./g, '_') + COMPLEX_GROUP_SUFFIX;
    const concatGroup: DynamicComplexModelConfig = this.initModel(groupId, label, false, true);

    concatGroup.group = [];
    concatGroup.separator = this.separator;

    let inputConfigs: DynamicInputModelConfig[];
    inputConfigs = [];

    const complexDefinitionJSON = JSON.parse(this.configData.complexDefinition);

    Object.keys(complexDefinitionJSON).forEach((input, index) => {
      inputConfigs.push(this.initModel(
        id + COMPLEX_INPUT_SUFFIX + index,
        false,
        true,
        true,
        false
      ));
    });

    if (this.configData.mandatory) {
      concatGroup.required = true;
    }

    inputConfigs.forEach((inputConfig, index) => {
      const complexDefinitionInput = complexDefinitionJSON[Object.keys(complexDefinitionJSON)[index]];

      if (hasValue(complexDefinitionInput.label)) {
        inputConfig.label = complexDefinitionInput.label;
        inputConfig.placeholder = complexDefinitionInput.label;
      }

      if (hasValue(complexDefinitionInput.placeholder)) {
        inputConfig.placeholder = complexDefinitionInput.placeholder;
      }

      if (hasValue(complexDefinitionInput.hint)) {
        inputConfig.hint = complexDefinitionInput.hint;
      }

      if (hasValue(complexDefinitionInput.style)) {
        clsInput = {
          grid: {
            host: complexDefinitionInput.style
          }
        };
      }

      if (this.configData.mandatory) {
        if (hasValue(complexDefinitionInput.required)) {
          inputConfig.required = complexDefinitionInput.required;
        }
      }

      concatGroup.group.push(new DynamicInputModel(inputConfig, clsInput));
    });

    const complexModel = new DynamicComplexModel(concatGroup, clsGroup);
    complexModel.name = this.getFieldId();

    // Init values
    if (isNotEmpty(fieldValue)) {
      complexModel.value = fieldValue;
    }

    return complexModel;
  }

}
