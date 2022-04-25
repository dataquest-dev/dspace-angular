import { DynamicFormControlLayout, DynamicFormGroupModel, DynamicFormGroupModelConfig, serializable } from '@ng-dynamic-forms/core';

import { Subject } from 'rxjs';

import { hasNoValue, isNotEmpty } from '../../../../empty.util';
import { DsDynamicInputModel } from './ds-dynamic-input.model';
import { FormFieldMetadataValueObject } from '../../models/form-field-metadata-value.model';
import { RelationshipOptions } from '../../models/relationship-options.model';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
import {forEach} from 'lodash';
import {DynamicConcatModel, DynamicConcatModelConfig} from './ds-dynamic-concat.model';

export const COMPLEX_GROUP_SUFFIX = '_COMPLEX_GROUP';
export const COMPLEX_INPUT_SUFFIX = '_COMPLEX_INPUT';

export interface DynamicComplexModelConfig extends DynamicConcatModelConfig {}

export class DynamicComplexModel extends DynamicConcatModel {

  constructor(config: DynamicComplexModelConfig, layout?: DynamicFormControlLayout) {
    super(config, layout);
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
    // if (values[0].value) {
    //   (this.get(0) as DsDynamicInputModel).value = values[0];
    // } else {
    //   (this.get(0) as DsDynamicInputModel).value = undefined;
    // }
    // if (values[1].value) {
    //   (this.get(1) as DsDynamicInputModel).value = values[1];
    // } else {
    //   (this.get(1) as DsDynamicInputModel).value = undefined;
    // }
  }

}
