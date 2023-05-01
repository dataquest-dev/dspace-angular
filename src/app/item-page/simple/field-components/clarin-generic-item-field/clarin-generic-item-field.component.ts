import { Component, Input, OnInit } from '@angular/core';
import { Item } from '../../../../core/shared/item.model';
import {isEmpty, isNotUndefined} from '../../../../shared/empty.util';
import {ConfigurationProperty} from '../../../../core/shared/configuration-property.model';
import {DSONameService} from '../../../../core/breadcrumbs/dso-name.service';
import {convertMetadataFieldIntoSearchType, getBaseUrl} from '../../../../shared/clarin-shared-util';
import {ConfigurationDataService} from '../../../../core/data/configuration-data.service';

@Component({
  selector: 'ds-clarin-generic-item-field',
  templateUrl: './clarin-generic-item-field.component.html',
  styleUrls: ['./clarin-generic-item-field.component.scss']
})
export class ClarinGenericItemFieldComponent implements OnInit {

  /**
   * The item to display metadata for
   */
  @Input() item: Item;

  /**
   * Fontawesome v5. icon name with default settings.
   */
  @Input() iconName: string;

  /**
   * For now the specific type could be only 'hyperlink' which redirects to the page from the metadata value.
   */
  @Input() type: string;

  /**
   * Separator string between multiple values of the metadata fields defined
   * @type {string}
   */
  @Input() separator: string;

  /**
   * Fields (schema.element.qualifier) used to render their values.
   */
  @Input() fields: string[];

  /**
   * Label i18n key for the rendered metadata
   */
  @Input() label: string;

  /**
   * UI URL loaded from the server.
   */
  baseUrl = '';

  // tslint:disable-next-line:no-empty
  constructor(protected dsoNameService: DSONameService,
              protected configurationService: ConfigurationDataService) { }

  // tslint:disable-next-line:no-empty
  async ngOnInit(): Promise<void> {
    await this.assignBaseUrl();
  }

  public hasMetadataValue() {
    return isNotUndefined(this.item.firstMetadataValue(this.fields));
  }

  /**
   * Return current metadata value. The metadata field could have more metadata values, the more often the metadata
   * field has only one metadata value - index is 0, but sometimes it has more values e.g. `Author`.
   * @param index
   */
  public getLinkToSearch(index, value = '') {
    let metadataValue = 'Error: value is empty';
    if (isEmpty(value)) {
      // Get metadata value from the Item's metadata field
      metadataValue = this.getMetadataValue(index);
    } else {
      // The metadata value is passed from the parameter.
      metadataValue = value;
    }

    const searchType = convertMetadataFieldIntoSearchType(this.fields);
    return this.baseUrl + '/search/objects?f.' + searchType + '=' + metadataValue + ',equals';
  }

  public getMetadataValue(index) {
    let metadataValue = '';
    if (index === 0) {
      // Return first metadata value.
      metadataValue = this.item.firstMetadataValue(this.fields);
    } else {
      // The metadata field has more metadata values - get the actual one
      this.item.allMetadataValues(this.fields)?.forEach((metadataValueArray, arrayIndex) => {
        if (index !== arrayIndex) {
          return;
        }
        metadataValue = metadataValueArray;
      });
    }
    return metadataValue;
  }

  async assignBaseUrl() {
    this.baseUrl = await getBaseUrl(this.configurationService)
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }



}
