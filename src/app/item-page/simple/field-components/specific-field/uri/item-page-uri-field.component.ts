import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { take } from 'rxjs/operators';

import { Item } from '../../../../../core/shared/item.model';
import { ItemPageFieldComponent } from '../item-page-field.component';
import { MetadataUriValuesComponent } from '../../../../field-components/metadata-uri-values/metadata-uri-values.component';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
// eslint-disable-next-line lodash/import-scope
import cloneDeep from 'lodash/cloneDeep';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { BrowseDefinitionDataService } from '../../../../../core/browse/browse-definition-data.service';
import { BrowseService } from '../../../../../core/browse/browse.service';

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
export class ItemPageUriFieldComponent extends ItemPageFieldComponent implements OnInit {

  doiResolver: string;

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

  loadDoiResolver() {
    this.configService.findByPropertyName('identifier.doi.resolver')
      .pipe(take(1))
      .subscribe(remoteData => {
        this.doiResolver = remoteData?.payload?.values?.[0];
      });
  }
  getUriMetadataValues() {
    const mvalues: MetadataValue[] = this.item?.allMetadata(this.fields);
    if (!mvalues) {
      return [];
    }

    // Clone the metadata values because it is readonly however I used `let` instead of `const`.
    const clonedMValues = _.cloneDeep(mvalues);
    // Compose DOI URI
    clonedMValues.forEach(mv => {
      // Filter Metadata values which doesn't have full link. DOI doesn't have full links.
      if (mv.value.includes('http')) {
        return;
      }
      // Compose `doiResolver` + `doi identifier` value, only if doiResolver is available
      if (this.doiResolver) {
        mv.value = this.doiResolver + '/' + mv.value;
      }
    });
    return clonedMValues;
  }

}
