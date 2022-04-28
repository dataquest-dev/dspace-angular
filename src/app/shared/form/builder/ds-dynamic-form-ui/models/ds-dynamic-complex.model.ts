import { DynamicFormControlLayout } from '@ng-dynamic-forms/core';

import { hasNoValue, isNotEmpty } from '../../../../empty.util';
import { DsDynamicInputModel } from './ds-dynamic-input.model';
import { FormFieldMetadataValueObject } from '../../models/form-field-metadata-value.model';
import {DynamicConcatModel, DynamicConcatModelConfig} from './ds-dynamic-concat.model';

export const COMPLEX_GROUP_SUFFIX = '_COMPLEX_GROUP';
export const COMPLEX_INPUT_SUFFIX = '_COMPLEX_INPUT_';

export interface DynamicComplexModelConfig extends DynamicConcatModelConfig {}

export class DynamicComplexModel extends DynamicConcatModel {

  constructor(config: DynamicComplexModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.separator = ';';
  }

  get value() {
    const formValues = this.group.map((inputModel: DsDynamicInputModel) =>
      (typeof inputModel.value === 'string') ?
        Object.assign(new FormFieldMetadataValueObject(), { value: inputModel.value, display: inputModel.value }) :
        (inputModel.value as any));

    let indexOfEmptyValues: number[];
    indexOfEmptyValues = [];
    let value = '';
    formValues.forEach((formValue, index) => {
      if (isNotEmpty(formValue) && isNotEmpty(formValue.value)) {
        value += formValue.value + this.separator;
      } else {
        indexOfEmptyValues.push(index);
      }
    });

    value = value.slice(0, -1);

    if (isNotEmpty(formValues)) {
      const dumpArrayOfIndex = Array.from(Array(formValues.length).keys());
      const indexesOfNonEmptyFormValues = dumpArrayOfIndex.filter(x => !indexOfEmptyValues.includes(x));
      return Object.assign(new FormFieldMetadataValueObject(),
        formValues[Object.keys(formValues)[indexesOfNonEmptyFormValues[0]]],{ value: value });
    }
    return null;

  }

  set value(value: string | FormFieldMetadataValueObject) {
    let values;
    let tempValue: string;

    if (typeof value === 'string') {
      tempValue = value;
    } else {
      tempValue = value.value;
    }
    if (hasNoValue(tempValue)) {
      tempValue = '';
    }
    values = [...tempValue.split(this.separator), null].map((v) =>
      Object.assign(new FormFieldMetadataValueObject(), value, { display: v, value: v }));

    values.forEach((val, index) =>  {
      if (val.value) {
        (this.get(index) as DsDynamicInputModel).value = val;
      } else {
        (this.get(index) as DsDynamicInputModel).value = undefined;
      }
    });
  }
}
