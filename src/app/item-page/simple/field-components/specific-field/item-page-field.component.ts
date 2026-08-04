import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
} from '@angular/core';
import intersectionWith from 'lodash/intersectionWith';
import { Observable } from 'rxjs';
import {
  filter,
  mergeAll,
  take,
} from 'rxjs/operators';

import { BrowseByDataType } from '../../../../browse-by/browse-by-switcher/browse-by-data-type';
import { BrowseService } from '../../../../core/browse/browse.service';
import { BrowseDefinitionDataService } from '../../../../core/browse/browse-definition-data.service';
import { BrowseDefinition } from '../../../../core/shared/browse-definition.model';
import { Item } from '../../../../core/shared/item.model';
import {
  getFirstCompletedRemoteData,
  getPaginatedListPayload,
  getRemoteDataPayload,
} from '../../../../core/shared/operators';
import { MetadataValuesComponent } from '../../../field-components/metadata-values/metadata-values.component';
import { ImageField } from './image-field';

/**
 * This component can be used to represent metadata on a simple item page.
 * It expects one input parameter of type Item to which the metadata belongs.
 * This class can be extended to print certain metadata.
 */

@Component({
  templateUrl: './item-page-field.component.html',
  imports: [
    AsyncPipe,
    MetadataValuesComponent,
  ],
})
export class ItemPageFieldComponent {

  constructor(protected browseDefinitionDataService: BrowseDefinitionDataService,
              protected browseService: BrowseService) {
  }

    /**
     * The item to display metadata for
     */
    @Input() item: Item;

    /**
     * Whether the {@link MarkdownDirective} should be used to render this metadata.
     */
    enableMarkdown = false;

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

    /**
     * Whether any valid HTTP(S) URL should be rendered as a link
     */
    urlRegex?: string;

    /**
     * Image Configuration
     */
    img: ImageField;

    /**
     * Return browse definition that matches any field used in this component if it is configured as a browse
     * link in dspace.cfg (webui.browse.link.<n>)
     */
    get browseDefinition(): Observable<BrowseDefinition> {
      return this.browseService.getBrowseDefinitions().pipe(
        getFirstCompletedRemoteData(),
        getRemoteDataPayload(),
        getPaginatedListPayload(),
        mergeAll(),
        // A hierarchical browse renders a controlled-vocabulary tree and ignores startsWith, so it
        // can never answer "show me the other items with this value" - which is the only thing this
        // link is for. DSpace auto-creates one per vocabulary used in submission-forms.xml, and its
        // metadata is whatever field the vocabulary is bound to (srsc -> dc.subject), so without
        // this it can shadow the real metadata browse for that field.
        filter((def: BrowseDefinition) => def.getRenderType() !== BrowseByDataType.Hierarchy),
        filter((def: BrowseDefinition) =>
          intersectionWith(def.metadataKeys, this.fields, ItemPageFieldComponent.fieldMatch).length > 0,
        ),
        take(1),
      );
    }

    /**
     * Returns true iff the spec and field match.
     *
     * A ".*" spec covers the unqualified field as well as any qualified form, i.e. "dc.subject.*"
     * matches both "dc.subject" and "dc.subject.lcsh". That is how the backend expands the same
     * wildcard when it builds the browse index: with `subject:metadata:dc.subject.*:text`
     * configured and items carrying only unqualified `dc.subject`, the subject index is fully
     * populated. Requiring a qualifier here made this method disagree with the index it is meant
     * to describe.
     *
     * @param spec  Specification of a metadata field name: either a metadata field, or a prefix ending in ".*".
     * @param field A metadata field name.
     * @private
     */
    private static fieldMatch(spec: string, field: string): boolean {
      if (field === spec) {
        return true;
      }
      if (!spec.endsWith('.*')) {
        return false;
      }
      const prefix = spec.slice(0, -2);
      return field === prefix || field.startsWith(prefix + '.');
    }
}
