import { MetadataRepresentationType } from '../../../../core/shared/metadata-representation/metadata-representation.model';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MetadataRepresentationListElementComponent } from '../metadata-representation-list-element.component';
import { metadataRepresentationComponent } from '../../../metadata-representation/metadata-representation.decorator';
import { VALUE_LIST_BROWSE_DEFINITION } from '../../../../core/shared/value-list-browse-definition.resource-type';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { getFirstCompletedRemoteData } from '../../../../core/shared/operators';

/**
 * Pattern that matches a bare ORCID iD (16 digits in groups of 4, last char may be X).
 * Example: 0000-0001-2345-6789 or 0000-0001-2345-678X
 */
const ORCID_ID_PATTERN = /^(\d{4}-){3}\d{3}[\dX]$/i;

/**
 * Pattern that matches a full ORCID URL authority value.
 * Example: https://orcid.org/0000-0001-2345-6789 or https://sandbox.orcid.org/0000-0001-2345-678X
 */
const ORCID_URL_PATTERN = /^https?:\/\/[^/]+\/((\d{4}-){3}\d{3}[\dX])$/i;

@metadataRepresentationComponent('Publication', MetadataRepresentationType.PlainText)
// For now, authority controlled fields are rendered the same way as plain text fields
@metadataRepresentationComponent('Publication', MetadataRepresentationType.AuthorityControlled)
@Component({
  selector: 'ds-plain-text-metadata-list-element',
  templateUrl: './plain-text-metadata-list-element.component.html',
  styleUrls: ['./plain-text-metadata-list-element.component.scss']
})
/**
 * A component for displaying MetadataRepresentation objects in the form of plain text
 * It will simply use the value retrieved from MetadataRepresentation.getValue() to display as plain text
 */
export class PlainTextMetadataListElementComponent extends MetadataRepresentationListElementComponent implements OnInit {

  /**
   * The ORCID domain URL fetched from the backend (`orcid.domain-url`),
   * e.g. `https://orcid.org` or `https://sandbox.orcid.org`.
   */
  orcidDomainUrl$ = new BehaviorSubject<string | null>(null);

  constructor(protected configurationService: ConfigurationDataService) {
    super();
  }

  ngOnInit(): void {
    this.configurationService.findByPropertyName('orcid.domain-url').pipe(
      getFirstCompletedRemoteData(),
      take(1),
    ).subscribe((rd) => {
      if (rd?.hasSucceeded && rd.payload?.values?.length > 0) {
        this.orcidDomainUrl$.next(rd.payload.values[0]);
      }
    });
  }

  /**
   * Get the appropriate query parameters for this browse link, depending on whether the browse definition
   * expects 'startsWith' (eg browse by date) or 'value' (eg browse by title)
   */
  getQueryParams() {
    let queryParams = {startsWith: this.mdRepresentation.getValue()};
    if (this.mdRepresentation.browseDefinition.getRenderType() === VALUE_LIST_BROWSE_DEFINITION.value) {
      return {value: this.mdRepresentation.getValue()};
    }
    return queryParams;
  }

  /**
   * Check whether the authority value of this metadata is an ORCID identifier.
   * Accepts either a bare ORCID iD or a full ORCID URL.
   * Requires the backend to expose `orcid.domain-url`; otherwise returns false.
   */
  isOrcidAuthority(orcidDomainUrl: string | null = this.orcidDomainUrl$.value): boolean {
    if (!orcidDomainUrl) {
      return false;
    }
    if (this.mdRepresentation instanceof MetadatumRepresentation) {
      const authority = this.mdRepresentation.authority?.trim();
      if (!authority) {
        return false;
      }
      return ORCID_ID_PATTERN.test(authority) || ORCID_URL_PATTERN.test(authority);
    }
    return false;
  }

  /**
   * Build the full ORCID profile URL for the current author.
   * Returns an empty string when the authority is not an ORCID value
   * or when the ORCID domain URL is not configured on the backend.
   */
  getOrcidUrl(orcidDomainUrl: string | null = this.orcidDomainUrl$.value): string {
    if (!orcidDomainUrl) {
      return '';
    }
    if (!(this.mdRepresentation instanceof MetadatumRepresentation)) {
      return '';
    }
    const authority = this.mdRepresentation.authority?.trim();
    if (!authority) {
      return '';
    }
    if (ORCID_URL_PATTERN.test(authority)) {
      return authority;
    }
    if (ORCID_ID_PATTERN.test(authority)) {
      const domain = orcidDomainUrl.endsWith('/') ? orcidDomainUrl.slice(0, -1) : orcidDomainUrl;
      return `${domain}/${authority}`;
    }
    return '';
  }
}
