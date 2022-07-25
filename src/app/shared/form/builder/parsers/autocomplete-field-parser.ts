import { FieldParser } from './field-parser';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import {
  DsDynamicAutocompleteModel,
  DsDynamicAutocompleteModelConfig
} from '../ds-dynamic-form-ui/models/autocomplete/ds-dynamic-autocomplete.model';
import {isNotEmpty} from '../../../empty.util';

export class AutocompleteFieldParser extends FieldParser {

  public modelFactory(fieldValue?: FormFieldMetadataValueObject | any, label?: boolean): any {
    const autocompleteModelConfig: DsDynamicAutocompleteModelConfig = this.initModel(null, label);
    if (isNotEmpty(this.configData) && isNotEmpty(this.configData.selectableMetadata[0]) &&
      isNotEmpty(this.configData.selectableMetadata[0].controlledVocabulary)) {
      this.setVocabularyOptions(autocompleteModelConfig);
    }

    if (isNotEmpty(fieldValue)) {
      this.setValues(autocompleteModelConfig, fieldValue);
    }

    return new DsDynamicAutocompleteModel(autocompleteModelConfig);
  }

}
