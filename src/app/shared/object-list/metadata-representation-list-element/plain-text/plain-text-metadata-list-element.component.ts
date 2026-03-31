
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VALUE_LIST_BROWSE_DEFINITION } from '../../../../core/shared/value-list-browse-definition.resource-type';
import { MetadataRepresentationListElementComponent } from '../metadata-representation-list-element.component';

/**
 * Regex pattern for ORCID identifiers: four groups of four digits separated by hyphens.
 * The last group may end with an X (checksum digit).
 */
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-(\d{3}X|\d{4})$/;

@Component({
  selector: 'ds-plain-text-metadata-list-element',
  templateUrl: './plain-text-metadata-list-element.component.html',
  styleUrls: ['./plain-text-metadata-list-element.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
  ],
})
/**
 * A component for displaying MetadataRepresentation objects in the form of plain text
 * It will simply use the value retrieved from MetadataRepresentation.getValue() to display as plain text
 */
export class PlainTextMetadataListElementComponent extends MetadataRepresentationListElementComponent {
  /**
   * Get the appropriate query parameters for this browse link, depending on whether the browse definition
   * expects 'startsWith' (eg browse by date) or 'value' (eg browse by title)
   */
  getQueryParams() {
    const queryParams = { startsWith: this.mdRepresentation.getValue() };
    // todo: should compare with type instead?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (this.mdRepresentation.browseDefinition.getRenderType() === VALUE_LIST_BROWSE_DEFINITION.value) {
      return { value: this.mdRepresentation.getValue() };
    }
    return queryParams;
  }

  /**
   * Check if the authority value of this metadata is an ORCID identifier.
   * The authority field is available on MetadatumRepresentation (extends MetadataValue).
   */
  isOrcidAuthority(): boolean {
    const authority = (this.mdRepresentation as any)?.authority;
    return !!authority && ORCID_PATTERN.test(authority);
  }

  /**
   * Build the full ORCID profile URL from the authority value.
   */
  getOrcidUrl(): string {
    return `https://orcid.org/${(this.mdRepresentation as any).authority}`;
  }
}
