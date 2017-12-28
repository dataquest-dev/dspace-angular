import {
  AUTOCOMPLETE_OFF, ClsConfig, DynamicInputModel, DynamicInputModelConfig,
  serializable
} from '@ng-dynamic-forms/core';
import { Observable } from 'rxjs/Observable';
import { PageInfo } from '../../../../../../core/shared/page-info.model';
import { Chips } from '../../../../../chips/chips.model';

export const DYNAMIC_FORM_CONTROL_TYPE_TAG = 'TYPETAG';

export interface DynamicTagModelConfig extends DynamicInputModelConfig {
  authorityMetadata: string;
  authorityName: string;
  authorityScope: string;
  minChars: number;
  value: any;
  chips: Chips;
}

export class DynamicTagModel extends DynamicInputModel {

  @serializable() authorityMetadata: string;
  @serializable() authorityName: string;
  @serializable() authorityScope: string;
  @serializable() minChars: number;
  @serializable() readonly type: string = DYNAMIC_FORM_CONTROL_TYPE_TAG;
  @serializable() chips: Chips;

  constructor(config: DynamicTagModelConfig, cls?: ClsConfig) {

    super(config, cls);

    this.autoComplete = AUTOCOMPLETE_OFF;
    this.authorityMetadata = config.authorityMetadata;
    this.authorityName = config.authorityName;
    this.authorityScope = config.authorityScope;
    this.minChars = config.minChars;
    this.chips = config.chips || new Chips();
  }

  get value() {
    const out = [];
    this.chips.chipsItems.forEach((item) => {
      out.push(item.item);
    });

    return out;
  }

  set value(value: any[]) {
    // this.chips.chipsItems = value;
  }

}
