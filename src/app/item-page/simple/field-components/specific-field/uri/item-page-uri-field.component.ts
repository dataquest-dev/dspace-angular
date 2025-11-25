import {
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { BrowseDefinitionDataService } from "src/app/core/browse/browse-definition-data.service";
import { BrowseService } from "src/app/core/browse/browse.service";
import { ConfigurationDataService } from "src/app/core/data/configuration-data.service";
import { Item } from "src/app/core/shared/item.model";
import { MetadataValue } from "src/app/core/shared/metadata.models";
import { getFirstCompletedRemoteData } from "src/app/core/shared/operators";
import { MetadataUriValuesComponent } from "src/app/item-page/field-components/metadata-uri-values/metadata-uri-values.component";
import { ItemPageFieldComponent } from "../item-page-field.component";

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
      .pipe(getFirstCompletedRemoteData())
      .subscribe(remoteData => {
        this.doiResolver = remoteData?.payload?.values?.[0];
      });
  }
  getUriMetadataValues(): MetadataValue[] {
    const mvalues: MetadataValue[] = this.item?.allMetadata(this.fields);
    if (!mvalues) {
      return [];
    }

    // Transform metadata values to include DOI resolver URL for non-http values
    return mvalues.map(mv => {
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

}
