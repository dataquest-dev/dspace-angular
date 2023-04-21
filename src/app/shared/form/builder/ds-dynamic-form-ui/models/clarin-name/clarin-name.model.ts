import { DsDynamicInputModel, DsDynamicInputModelConfig } from '../ds-dynamic-input.model';
import { AUTOCOMPLETE_OFF, DynamicFormControlLayout, serializable } from '@ng-dynamic-forms/core';
import { VocabularyOptions } from '../../../../../../core/submission/vocabularies/models/vocabulary-options.model';
import {hasNoValue, isEmpty, isNotEmpty} from '../../../../../empty.util';
import {DynamicConcatModel, DynamicConcatModelConfig} from '../ds-dynamic-concat.model';
import {DynamicComplexModelConfig} from '../ds-dynamic-complex.model';
import {FormFieldMetadataValueObject} from '../../../models/form-field-metadata-value.model';
import {RelationshipOptions} from '../../../models/relationship-options.model';
import {MetadataValue} from '../../../../../../core/shared/metadata.models';
import {Subject} from 'rxjs';

export const DYNAMIC_FORM_CONTROL_TYPE_CLARIN_NAME = 'CLARIN-NAME';

export const CLARIN_NAME_GROUP_SUFFIX = '_CLARIN_NAME_GROUP';
export const CLARIN_NAME_FIRST_INPUT_SUFFIX = '_CLARIN_NAME_FIRST_INPUT';
export const CLARIN_NAME_SECOND_INPUT_SUFFIX = '_CLARIN_NAME_SECOND_INPUT';

export const SEPARATOR = ';';

/**
 * Configuration for the DsDynamicSponsorAutocompleteModel.
 */
export interface DsDynamicClarinNameModelConfig extends DynamicConcatModelConfig {}

/**
 * The Model for the DsDynamicSponsorAutocompleteComponent.
 */
export class DynamicClarinNameModel extends DynamicConcatModel {

  @serializable() hasLanguages = false;
  @serializable() relationship?: RelationshipOptions;
  @serializable() repeatable?: boolean;
  @serializable() required?: boolean;
  @serializable() hint?: string;
  @serializable() metadataFields: string[];
  @serializable() submissionId: string;
  @serializable() hasSelectableMetadata: boolean;
  @serializable() metadataValue: MetadataValue;

  // @serializable() readonly type: string = DYNAMIC_FORM_CONTROL_TYPE_CLARIN_NAME;

  isCustomGroup = true;
  valueUpdates: Subject<string>;

  constructor(config: DynamicConcatModelConfig, layout?: DynamicFormControlLayout) {

    super(config, layout);
    this.separator = ',';
    this.relationship = config.relationship;
    this.repeatable = config.repeatable;
    this.required = config.required;
    this.hint = config.hint;
    this.metadataFields = config.metadataFields;
    this.submissionId = config.submissionId;
    this.hasSelectableMetadata = config.hasSelectableMetadata;
    this.metadataValue = config.metadataValue;
    this.valueUpdates = new Subject<string>();
    this.valueUpdates.subscribe((value: string) => this.value = value);
  }

  get value() {
    const [firstValue, secondValue] = this.group.map((inputModel: DsDynamicInputModel) =>
      (typeof inputModel.value === 'string') ?
        Object.assign(new FormFieldMetadataValueObject(), { value: inputModel.value, display: inputModel.value }) :
        (inputModel.value as any));
    if (isNotEmpty(firstValue) && isNotEmpty(firstValue.value) && isNotEmpty(secondValue) && isNotEmpty(secondValue.value)) {
      return Object.assign(new FormFieldMetadataValueObject(), firstValue, { value: firstValue.value + this.separator + secondValue.value });
    } else if (isNotEmpty(firstValue) && isNotEmpty(firstValue.value)) {
      return Object.assign(new FormFieldMetadataValueObject(), firstValue);
    } else if (isNotEmpty(secondValue) && isNotEmpty(secondValue.value)) {
      return Object.assign(new FormFieldMetadataValueObject(), secondValue);
    } else {
      return null;
    }
  }

  set value(value: string | FormFieldMetadataValueObject) {
    let values;
    let tempValue: string;

    if (typeof value === 'string') {
      tempValue = value.replace(/\s/g, '');
    } else {
      tempValue = value.value.replace(/\s/g, '');
    }
    if (hasNoValue(tempValue)) {
      tempValue = '';
    }
    values = [...tempValue.split(this.separator), null].map((v) =>
      Object.assign(new FormFieldMetadataValueObject(), value, { display: v, value: v }));

    if (values[0].value) {
      (this.get(0) as DsDynamicInputModel).value = values[0];
    } else {
      (this.get(0) as DsDynamicInputModel).value = undefined;
    }
    if (values[1].value) {
      (this.get(1) as DsDynamicInputModel).value = values[1];
    } else {
      (this.get(1) as DsDynamicInputModel).value = undefined;
    }
  }
}
