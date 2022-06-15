import { DynamicFormControlLayout } from '@ng-dynamic-forms/core';

import { hasNoValue, hasValue, isNotEmpty } from '../../../../empty.util';
import { DsDynamicInputModel } from './ds-dynamic-input.model';
import { FormFieldMetadataValueObject } from '../../models/form-field-metadata-value.model';
import {DynamicConcatModel, DynamicConcatModelConfig} from './ds-dynamic-concat.model';
import {AUTOCOMPLETE_COMPLEX_PREFIX} from './autocomplete/dynamic-autocomplete.model';

export const COMPLEX_GROUP_SUFFIX = '_COMPLEX_GROUP';
export const COMPLEX_INPUT_SUFFIX = '_COMPLEX_INPUT_';
export const SEPARATOR = ';';

export interface DynamicComplexModelConfig extends DynamicConcatModelConfig {}

export class DynamicComplexModel extends DynamicConcatModel {

  constructor(config: DynamicComplexModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
    this.separator = SEPARATOR;

  }

  get value() {
    const formValues = this.group.map((inputModel: DsDynamicInputModel) =>
      (typeof inputModel.value === 'string') ?
        Object.assign(new FormFieldMetadataValueObject(), { value: inputModel.value, display: inputModel.value }) :
        (inputModel.value as any));

    let indexOfEmptyValues: number[];
    indexOfEmptyValues = [];

    let value = '';
    let allFormValuesEmpty = true;
    formValues.forEach((formValue, index) => {
      if (isNotEmpty(formValue) && isNotEmpty(formValue.value)) {
        value += formValue.value + this.separator;
        allFormValuesEmpty = false;
      } else {
        value += this.separator;
        indexOfEmptyValues.push(index);
      }
    });
    value = value.slice(0, -1);
    if (this.name === 'local.sponsor') {
      formValues.forEach((formValue) => {
        if (isNotEmpty(formValue) && isNotEmpty(formValue.value) &&
          formValue.value.startsWith(AUTOCOMPLETE_COMPLEX_PREFIX)) {
          value = formValue.value;
        }
      });
    }
    if (allFormValuesEmpty) {
      value = '';
    }
     if (isNotEmpty(formValues)) {
      return Object.assign(new FormFieldMetadataValueObject(),{ value: value });
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
    values = [...tempValue.split(this.separator), null].map((v) => {
        if (v === AUTOCOMPLETE_COMPLEX_PREFIX) { return; }
        return Object.assign(new FormFieldMetadataValueObject(), value, { display: v, value: v });
    });

    // remove undefined values
    values = values.filter(v => v);

    values.forEach((val, index) =>  {
      if (val.value) {
        (this.get(index) as DsDynamicInputModel).value = val;
      } else if (hasValue((this.get(index) as DsDynamicInputModel))) {
        (this.get(index) as DsDynamicInputModel).value = undefined;
      }
    });
  }
}
