import { Component, Input, OnInit } from '@angular/core';
import { Item } from '../../../../core/shared/item.model';

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
   * The valid text metadata to display - updated with links
   */
  validTextMetadata: string;

  ngOnInit(): void {
    // Store all description metadata values
    let updatedMVs = [];
    this.item.allMetadataValues(this.fields).forEach((value) => {
      updatedMVs.push(this.makeLinks(value));
    });

    // Join the metadata values with a line break
    this.validTextMetadata = updatedMVs.join('<br>');
  }

  makeLinks(text: string): string {
    // Use a regular expression to find URLs and convert them into clickable links
    const regex = /(?:https?|ftp):\/\/[^\s)]+|www\.[^\s)]+/g;
    return text.replace(regex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
  }
}
