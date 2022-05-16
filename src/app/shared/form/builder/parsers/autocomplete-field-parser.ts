import { FieldParser } from './field-parser';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import { DynamicTagModel, DynamicTagModelConfig } from '../ds-dynamic-form-ui/models/tag/dynamic-tag.model';

export class AutocompleteFieldParser extends FieldParser {

  public modelFactory(fieldValue?: FormFieldMetadataValueObject | any, label?: boolean): any {
    // return new Dynamic
    const tagModelConfig: DynamicTagModelConfig = this.initModel(null, label);
    if (this.configData.selectableMetadata[0].controlledVocabulary
      && this.configData.selectableMetadata[0].controlledVocabulary.length > 0) {
      this.setVocabularyOptions(tagModelConfig);
    }

    // get options from the server v componente, ked zacnem nieco pisat

    this.setValues(tagModelConfig, fieldValue, null, true);

    const tagModel = new DynamicTagModel(tagModelConfig);

    return tagModel;
  }

}
