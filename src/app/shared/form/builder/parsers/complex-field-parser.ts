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
import { hasNoValue, hasValue, isNotEmpty } from '../../../empty.util';
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

    clsInput = {
      grid: {
        host: 'col-sm-6'
      }
    };

    const groupId = id.replace(/\./g, '_') + COMPLEX_GROUP_SUFFIX;
    const concatGroup: DynamicComplexModelConfig = this.initModel(groupId, label, false, true);

    concatGroup.group = [];
    concatGroup.separator = this.separator;

    let inputConfigs: DynamicInputModelConfig[] = [];

    const configDataComplex = ['one', 'two', 'three'];
    configDataComplex.forEach(() => {
      inputConfigs.push(this.initModel(
        id + COMPLEX_INPUT_SUFFIX,
        false,
        true,
        true,
        false
      ));
    });


    // const input1ModelConfig: DynamicInputModelConfig = this.initModel(
    //   id + COMPLEX_INPUT_SUFFIX,
    //   false,
    //   true,
    //   true,
    //   false
    // );
    // const input2ModelConfig: DynamicInputModelConfig = thvbg is.initModel(
    //   id + COMPLEX_INPUT_SUFFIX,
    //   false,
    //   true,
    //   true,
    //   false
    // );

    // if (hasNoValue(concatGroup.hint) && hasValue(input1ModelConfig.hint) && hasNoValue(input2ModelConfig.hint)) {
    //   concatGroup.hint = input1ModelConfig.hint;
    //   input1ModelConfig.hint = undefined;
    // }

    if (this.configData.mandatory) {
      concatGroup.required = true;
      // input1ModelConfig.required = true;
    }

    // @TODO set placeholders
    // if (isNotEmpty(this.firstPlaceholder)) {
    //   input1ModelConfig.placeholder = this.firstPlaceholder;
    // }
    //
    // if (isNotEmpty(this.secondPlaceholder)) {
    //   input2ModelConfig.placeholder = this.secondPlaceholder;
    // }

    // Split placeholder if is like 'placeholder1/placeholder2'
    const placeholder = this.configData.label.split('/');
    // if (placeholder.length === 2) {
    //   input1ModelConfig.placeholder = placeholder[0];
    //   input2ModelConfig.placeholder = placeholder[1];
    // }

    inputConfigs.forEach((input) => {
      concatGroup.group.push(new DynamicInputModel(input, clsInput));
    });

    // const model1 = new DynamicInputModel(input1ModelConfig, clsInput);
    // const model2 = new DynamicInputModel(input2ModelConfig, clsInput);
    // concatGroup.group.push(model1);
    // concatGroup.group.push(model2);
    //
    clsGroup = {
      element: {
        control: 'form-row',
      }
    };
    const complexModel = new DynamicComplexModel(concatGroup, clsGroup);
    complexModel.name = this.getFieldId();

    // Init values
    if (isNotEmpty(fieldValue)) {
      complexModel.value = fieldValue;
    }

    return complexModel;
  }

}
