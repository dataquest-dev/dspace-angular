
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { getFirstSucceededRemoteDataPayload } from '../../../../core/shared/operators';
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
export class PlainTextMetadataListElementComponent extends MetadataRepresentationListElementComponent implements OnInit {

  /**
   * The base ORCID domain URL fetched from backend configuration.
   * Remains null until successfully loaded — ORCID linking is disabled when null.
   */
  orcidDomainUrl: string | null = null;

  constructor(private configurationService: ConfigurationDataService) {
    super();
  }

  ngOnInit(): void {
    this.configurationService.findByPropertyName('orcid.domain-url').pipe(
      getFirstSucceededRemoteDataPayload(),
    ).subscribe({
      next: property => {
        if (property?.values?.length) {
          this.orcidDomainUrl = property.values[0].trim();
        } else {
          console.error('PlainTextMetadataListElementComponent: backend config property "orcid.domain-url" returned no values. ORCID author linking will be disabled.');
        }
      },
      error: err => {
        console.error('PlainTextMetadataListElementComponent: failed to fetch backend config property "orcid.domain-url". ORCID author linking will be disabled.', err);
      },
    });
  }

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
   */
  isOrcidAuthority(): boolean {
    if (this.orcidDomainUrl === null) {
      return false;
    }
    if (this.mdRepresentation instanceof MetadatumRepresentation) {
      const authority = this.mdRepresentation.authority?.trim();
      return !!authority && ORCID_PATTERN.test(authority);
    }
    return false;
  }

  /**
   * Build the full ORCID profile URL from the authority value.
   */
  getOrcidUrl(): string {
    const base = this.orcidDomainUrl.endsWith('/') ? this.orcidDomainUrl : this.orcidDomainUrl + '/';
    return `${base}${(this.mdRepresentation as MetadatumRepresentation).authority.trim()}`;
  }
}
