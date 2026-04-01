import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { VALUE_LIST_BROWSE_DEFINITION } from '../../../../core/shared/value-list-browse-definition.resource-type';
import { MetadataRepresentationListElementComponent } from '../metadata-representation-list-element.component';

/**
 * Regex pattern for full ORCID URL authority values stored by the backend
 * (e.g. https://orcid.org/0000-0001-2345-6789 or https://sandbox.orcid.org/0000-0001-2345-678X).
 */
const ORCID_URL_PATTERN = /^https?:\/\/[^/]+\/((\d{4}-){3}(\d{3}X|\d{4}))$/i;

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
   * Check if the authority value of this metadata is a full ORCID URL.
   * The backend OrcidAuthorityAssign script stores authority as full URLs
   * (e.g. https://orcid.org/0000-0001-2345-6789).
   */
  isOrcidAuthority(): boolean {
    if (this.mdRepresentation instanceof MetadatumRepresentation) {
      const authority = this.mdRepresentation.authority?.trim();
      return !!authority && ORCID_URL_PATTERN.test(authority);
    }
    return false;
  }

  /**
   * Return the full ORCID profile URL from the authority value.
   * Since the backend stores authority as a full URL, this simply returns it.
   * Returns an empty string if the authority is not a valid ORCID URL.
   */
  getOrcidUrl(): string {
    if (this.mdRepresentation instanceof MetadatumRepresentation) {
      const authority = this.mdRepresentation.authority?.trim();
      if (authority && ORCID_URL_PATTERN.test(authority)) {
        return authority;
      }
    }
    return '';
  }
}
