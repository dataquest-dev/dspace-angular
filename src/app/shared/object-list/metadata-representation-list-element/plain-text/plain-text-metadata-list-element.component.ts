
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VALUE_LIST_BROWSE_DEFINITION } from '../../../../core/shared/value-list-browse-definition.resource-type';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { hasValue } from '../../../empty.util';
import { MetadataRepresentationListElementComponent } from '../metadata-representation-list-element.component';

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
   * Check if this metadata representation has an ORCID authority
   */
  isOrcidAuthority(): boolean {
    const metadatum = this.mdRepresentation as MetadatumRepresentation;
    if (!hasValue(metadatum.authority)) {
      return false;
    }
    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
    return orcidPattern.test(metadatum.authority);
  }

  /**
   * Get the ORCID profile URL
   */
  getOrcidUrl(): string {
    const metadatum = this.mdRepresentation as MetadatumRepresentation;
    return `https://orcid.org/${encodeURIComponent(metadatum.authority)}`;
  }
}
