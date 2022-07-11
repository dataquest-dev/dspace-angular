import { FieldParser } from './field-parser';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import {
  DynamicAutocompleteModel,
  DynamicAutocompleteModelConfig
} from '../ds-dynamic-form-ui/models/autocomplete/dynamic-autocomplete.model';

export class AutocompleteFieldParser extends FieldParser {

  public modelFactory(fieldValue?: FormFieldMetadataValueObject | any, label?: boolean): any {
    const autocompleteModelConfig: DynamicAutocompleteModelConfig = this.initModel(null, label);
    if (this.configData.selectableMetadata[0].controlledVocabulary
      && this.configData.selectableMetadata[0].controlledVocabulary.length > 0) {
      this.setVocabularyOptions(autocompleteModelConfig);
    }

    this.setValues(autocompleteModelConfig, fieldValue);

    const autocompleteModel = new DynamicAutocompleteModel(autocompleteModelConfig);
    return autocompleteModel;
  }

}
