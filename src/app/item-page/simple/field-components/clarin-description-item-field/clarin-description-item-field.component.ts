import { Component, Input, OnInit } from '@angular/core';
import { Item } from '../../../../core/shared/item.model';
import { makeLinks } from '../../../../shared/clarin-shared-util';
import { metadataLangToBcp47 } from '../../../../shared/utils/metadata-language.util';

@Component({
  selector: 'ds-clarin-description-item-field',
  templateUrl: './clarin-description-item-field.component.html',
  styleUrls: ['./clarin-description-item-field.component.scss']
})
export class ClarinDescriptionItemFieldComponent implements OnInit {

  /**
   * The item to display metadata for
   */
  @Input() item: Item;

  /**
   * Fields (schema.element.qualifier) used to render their values.
   */
  @Input() fields: string[];

  /**
   * Description entries with processed value and language, built from metadata.
   */
  descriptionEntries: {value: string, language: string | null}[] = [];

  ngOnInit(): void {
    this.descriptionEntries = this.item.allMetadata(this.fields).map(md => ({
      value: makeLinks(md.value),
      language: metadataLangToBcp47(md.language)
    }));
  }

}
