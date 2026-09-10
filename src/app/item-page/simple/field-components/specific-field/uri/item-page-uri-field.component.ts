import {
  Component,
  Input,
  OnInit,
} from '@angular/core';

import { BrowseService } from '../../../../../core/browse/browse.service';
import { BrowseDefinitionDataService } from '../../../../../core/browse/browse-definition-data.service';
import { Item } from '../../../../../core/shared/item.model';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
import { isEmpty } from '../../../../../shared/empty.util';
import {
  DEFAULT_DOI_RESOLVER,
  ItemIdentifierService,
} from '../../../../../shared/item-identifier.service';
import { MetadataUriValuesComponent } from '../../../../field-components/metadata-uri-values/metadata-uri-values.component';
import { DOI_METADATA_FIELD } from '../../clarin-generic-item-field/clarin-generic-item-field.constants';
import { ItemPageFieldComponent } from '../item-page-field.component';

@Component({
  selector: 'ds-item-page-uri-field',
  templateUrl: './item-page-uri-field.component.html',
  imports: [
    MetadataUriValuesComponent,
  ],
})
/**
 * This component can be used to represent any uri on a simple item page.
 * It expects 4 parameters: The item, a separator, the metadata keys and an i18n key
 */
export class ItemPageUriFieldComponent extends ItemPageFieldComponent implements OnInit {

  /**
   * The configured DOI resolver, used to turn a bare DOI into a resolvable link.
   */
  doiResolver: string;

  constructor(protected browseDefinitionDataService: BrowseDefinitionDataService,
              protected browseService: BrowseService,
              protected itemIdentifierService: ItemIdentifierService) {
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
    this.itemIdentifierService.loadDoiResolverConfiguration().subscribe((resolver: string) => {
      this.doiResolver = isEmpty(resolver) ? DEFAULT_DOI_RESOLVER : resolver;
    });
  }

  /**
   * The metadata values to render.
   *
   * A bare DOI (no scheme) is not resolvable on its own, so it is prefixed with the configured
   * `identifier.doi.resolver`. Only `dc.identifier.doi` is treated that way: this component also
   * renders `dc.identifier.uri`, `coar.notify.endorsedBy` and three `datacite.relation.*` fields,
   * and prefixing a bare value of any of those with a DOI resolver would corrupt the link.
   */
  getUriMetadataValues(): MetadataValue[] {
    const mdValues: MetadataValue[] = this.item?.allMetadata(this.fields);

    if (isEmpty(mdValues) || !this.fields?.includes(DOI_METADATA_FIELD)) {
      return mdValues;
    }

    // allMetadata() returns readonly values, so build new ones rather than mutating them.
    return mdValues.map((mdValue: MetadataValue) =>
      Object.assign(new MetadataValue(), mdValue, { value: this.resolveDoi(mdValue.value) }));
  }

  /**
   * Prefix a bare DOI with the resolver. A value that already carries a scheme is left alone.
   */
  private resolveDoi(value: string): string {
    if (isEmpty(value) || /^https?:\/\//.test(value) || isEmpty(this.doiResolver)) {
      return value;
    }
    return `${this.doiResolver.replace(/\/+$/, '')}/${value}`;
  }

}
