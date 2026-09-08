import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  firstValueFrom,
} from 'rxjs';
import { map } from 'rxjs/operators';

import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../../../core/shared/configuration-property.model';
import { Item } from '../../../../core/shared/item.model';
import { getFirstSucceededRemoteDataPayload } from '../../../../core/shared/operators';
import { ClarinItemAuthorPreviewComponent } from '../../../../shared/clarin-item-author-preview/clarin-item-author-preview.component';
import {
  buildAuthoritySearchFilter,
  convertMetadataFieldIntoSearchType,
  getBaseUrl,
} from '../../../../shared/clarin-shared-util';
import {
  isEmpty,
  isNotUndefined,
} from '../../../../shared/empty.util';
import { ReplacePipe } from '../../../../shared/utils/replace.pipe';
import { ClarinDateItemFieldComponent } from '../clarin-date-item-field/clarin-date-item-field.component';
import { ClarinDescriptionItemFieldComponent } from '../clarin-description-item-field/clarin-description-item-field.component';
import { ClarinIdentifierItemFieldComponent } from '../clarin-identifier-item-field/clarin-identifier-item-field.component';
import { ClarinSponsorItemFieldComponent } from '../clarin-sponsor-item-field/clarin-sponsor-item-field.component';
import {
  DOI_METADATA_FIELD,
  HANDLE_METADATA_FIELD,
} from './clarin-generic-item-field.constants';

const SHOW_HANDLE_AND_DOI_PROPERTY_NAME = 'item-page.show-handle-and-doi';

@Component({
  imports: [
    AsyncPipe,
    ClarinDateItemFieldComponent,
    ClarinDescriptionItemFieldComponent,
    ClarinIdentifierItemFieldComponent,
    ClarinItemAuthorPreviewComponent,
    ClarinSponsorItemFieldComponent,
    ReplacePipe,
    TranslateModule,
  ],
  selector: 'ds-clarin-generic-item-field',
  templateUrl: './clarin-generic-item-field.component.html',
  styleUrls: ['./clarin-generic-item-field.component.scss'],
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
   * Replace character in the metadata value.
   * This input value is array of two elements.
   * The first element is the character to replace and the second element is the character to replace with.
   */
  @Input() replaceCharacter: string[];

  /**
   * UI URL loaded from the server.
   */
  baseUrl = '';

  /**
   * Show or hide the metadata value. The default value is `true`.
   */
  showMetadataValue: BehaviorSubject<boolean> = new BehaviorSubject(true);

  /**
   * Enable or disable showing both the handle and DOI identifiers in the item page. The default value is `false` to
   * show only the DOI identifier if it exists in the Item. If there is no DOI identifier,
   * the handle identifier is shown.
   */
  showHandleAndDOI = 'false';

  constructor(protected dsoNameService: DSONameService,
              protected configurationService: ConfigurationDataService) { }

  async ngOnInit(): Promise<void> {
    await this.assignBaseUrl();
    if (isEmpty(this.separator)) {
      this.separator = ',';
    }

    // Set default replace character
    if (isEmpty(this.replaceCharacter)) {
      this.replaceCharacter = [';', ' '];
    }

    // Do not show metadata value if some conditions are met
    await this.shouldShowMetadataValue();
  }

  /**
   * If the metadata fields has some metadata value - show nothing if the field do not have any value.
   */
  public hasMetadataValue() {
    return isNotUndefined(this.item.firstMetadataValue(this.fields));
  }

  /**
   * The method disable showing the metadata value if one of the following conditions is met:
   * - The metadata value is empty
   * - The metadata field is not allowed to be shown by the configuration
   */
  public async shouldShowMetadataValue() {
    // Do not show metadata value if it is empty
    if (!this.hasMetadataValue()) {
      this.showMetadataValue.next(false);
      return;
    }

    // Do not show DOI and Item Identifier (handle) if it is not allowed by the configuration
    await this.shouldShowBothIdentifiers();
  }

  /**
   * Do not show DOI and Item Identifier (handle) if it is not allowed by the configuration property
   * `item-page.show-handle-and-doi`.
   * @private
   */
  private async shouldShowBothIdentifiers() {
    // If the metadata field is Handle and the Item contains DOI identifier, do not show the handle identifier if the
    // configuration is set to show only the DOI identifier.
    if (this.fields.includes(HANDLE_METADATA_FIELD) && this.item.allMetadata(DOI_METADATA_FIELD)?.length > 0){
      await this.loadShowHandleAndDoiConfiguration();
      if (this.showHandleAndDOI === 'false') {
        this.showMetadataValue.next(false);
      }
    }
  }

  /**
   * Return current metadata value. The metadata field could have more metadata values, often the metadata
   * field has only one metadata value - index is 0, but sometimes it has more values e.g. `Author`.
   * @param index
   */
  public getLinkToSearch(index, value = '') {
    const searchType = convertMetadataFieldIntoSearchType(this.fields);

    // If a value is explicitly provided (e.g. a single subject from a split list), search by that plain value.
    // Otherwise resolve the full MetadataValue for this index so an authority (e.g. ROR) can be used.
    const mdValue = !isEmpty(value) ? { value } : this.item.allMetadata(this.fields)?.[index];
    if (!mdValue) {
      // ultimate fallback (should not happen)
      return this.baseUrl + '/search';
    }

    return this.baseUrl + '/search?' + buildAuthoritySearchFilter(searchType, mdValue);
  }

  /**
   * Load base url from the configuration from the BE.
   */
  async assignBaseUrl() {
    this.baseUrl = await getBaseUrl(this.configurationService)
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }

  /**
   * Load the configuration value for showing both the handle and DOI identifiers
   * @private
   */
  private async loadShowHandleAndDoiConfiguration() {
    // Get the configuration value for showing both the handle and DOI identifiers
    this.showHandleAndDOI = await firstValueFrom(this.configurationService.findByPropertyName(SHOW_HANDLE_AND_DOI_PROPERTY_NAME)
      .pipe(
        getFirstSucceededRemoteDataPayload(),
        map((cfgValues) => cfgValues?.values?.[0])));
  }
}
