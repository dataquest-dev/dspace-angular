import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { BrowseDefinitionDataService } from '../../../../../core/browse/browse-definition-data.service';
import { BrowseService } from '../../../../../core/browse/browse.service';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { Item } from '../../../../../core/shared/item.model';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
import { getFirstCompletedRemoteData } from '../../../../../core/shared/operators';
import { MetadataUriValuesComponent } from '../../../../field-components/metadata-uri-values/metadata-uri-values.component';
import { ItemPageFieldComponent } from '../item-page-field.component';

@Component({
  selector: 'ds-item-page-uri-field',
  templateUrl: './item-page-uri-field.component.html',
  imports: [
    MetadataUriValuesComponent,
  ],
  standalone: true,
})
/**
 * This component can be used to represent any uri on a simple item page.
 * It expects 4 parameters: The item, a separator, the metadata keys and an i18n key
 */
export class ItemPageUriFieldComponent extends ItemPageFieldComponent implements OnInit, OnChanges {

  doiResolver: string;
  uriMetadataValues: MetadataValue[] = [];

  /**
   * Note: BrowseDefinitionDataService and BrowseService are required by the parent
   * ItemPageFieldComponent, but not directly used in this component. They enable
   * browse link functionality in the parent's browseDefinition getter.
   */
  constructor(protected browseDefinitionDataService: BrowseDefinitionDataService,
    protected browseService: BrowseService,
    private configService: ConfigurationDataService) {
    super(browseDefinitionDataService, browseService);
  }

  /**
   * The item to display metadata for
   */
  @Input() item: Item;

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

  ngOnInit(): void {
    this.loadDoiResolver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recompute values when item or fields change
    if (changes['item'] || changes['fields']) {
      this.computeUriMetadataValues();
    }
  }

  loadDoiResolver() {
    this.configService.findByPropertyName('identifier.doi.resolver')
      .pipe(getFirstCompletedRemoteData())
      .subscribe(remoteData => {
        this.doiResolver = remoteData?.payload?.values?.[0];
        // Compute values after resolver is loaded
        this.computeUriMetadataValues();
      });
  }

  private computeUriMetadataValues(): void {
    const mvalues: MetadataValue[] = this.item?.allMetadata(this.fields);
    if (!mvalues) {
      this.uriMetadataValues = [];
      return;
    }

    // Transform metadata values to include DOI resolver URL for non-http values
    this.uriMetadataValues = mvalues.map(mv => {
      // Skip metadata values that already have full links (URLs starting with http/https)
      if (mv.value.includes('http') || !this.doiResolver) {
        return mv;
      }
      // Return new object with DOI resolver prepended to the value
      return {
        ...mv,
        value: `${this.doiResolver}/${mv.value}`
      };
    });
  }

  getUriMetadataValues(): MetadataValue[] {
    return this.uriMetadataValues;
  }

}
