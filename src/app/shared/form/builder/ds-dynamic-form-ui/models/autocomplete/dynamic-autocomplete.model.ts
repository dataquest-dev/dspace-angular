import {DsDynamicInputModel, DsDynamicInputModelConfig} from '../ds-dynamic-input.model';
import {AUTOCOMPLETE_OFF, DynamicFormControlLayout, serializable} from '@ng-dynamic-forms/core';
import {VocabularyOptions} from '../../../../../../core/submission/vocabularies/models/vocabulary-options.model';
import {isEmpty} from '../../../../../empty.util';

export const DYNAMIC_FORM_CONTROL_TYPE_AUTOCOMPLETE = 'AUTOCOMPLETE';

export interface DynamicAutocompleteModelConfig extends DsDynamicInputModelConfig {
  minChars?: number;
  value?: any;
}

export class DynamicAutocompleteModel extends DsDynamicInputModel {

  @serializable() minChars: number;
  @serializable() readonly type: string = DYNAMIC_FORM_CONTROL_TYPE_AUTOCOMPLETE;

  constructor(config: DynamicAutocompleteModelConfig, layout?: DynamicFormControlLayout) {

    super(config, layout);

    if (isEmpty(this.vocabularyOptions)) {
      this.vocabularyOptions = new VocabularyOptions('none');
    }
    this.autoComplete = AUTOCOMPLETE_OFF;
    this.minChars = config.minChars || 3;
    const value = config.value || [];
    this.value = value;
  }

}
