import { Component, Input } from '@angular/core';

import { Item } from '../../../../core/shared/item.model';

/**
 * This component can be used to represent metadata on a simple item page.
 * It expects one input parameter of type Item to which the metadata belongs.
 * This class can be extended to print certain metadata.
 */

@Component({
  templateUrl: './item-page-field.component.html'
})
export class ItemPageFieldComponent {

  private _item;

  // use getter setter to define the property
  get item(): Item {
    if (this.fields[0] === 'dc.date.issued') {
      console.log(' returning');
      console.log(this._item?.allMetadata(this.fields));
      console.log(this.fields);
      console.log(this.label);
    }
    return this._item;
  }

  /**
   * The item to display metadata for
   */
  @Input()
  set item(val: Item) {
    this._item = val;
  }

  /**
   * Fields (schema.element.qualifier) used to render their values.
   */
  fields: string[];

  /**
   * Label i18n key for the rendered metadata
   */
  label: string;

  /**
   * Separator string between multiple values of the metadata fields defined
   * @type {string}
   */
  separator = '<br/>';

}
