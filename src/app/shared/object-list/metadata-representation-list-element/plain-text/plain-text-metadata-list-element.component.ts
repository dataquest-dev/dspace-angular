import { BehaviorSubject } from 'rxjs';

import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { getFirstCompletedRemoteData } from '../../../../core/shared/operators';
import { MetadataRepresentationType } from '../../../../core/shared/metadata-representation/metadata-representation.model';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { Component, OnInit } from '@angular/core';
import { MetadataRepresentationListElementComponent } from '../metadata-representation-list-element.component';
import { metadataRepresentationComponent } from '../../../metadata-representation/metadata-representation.decorator';
import { VALUE_LIST_BROWSE_DEFINITION } from '../../../../core/shared/value-list-browse-definition.resource-type';

@metadataRepresentationComponent('Publication', MetadataRepresentationType.PlainText)
// For now, authority controlled fields are rendered the same way as plain text fields
@metadataRepresentationComponent('Publication', MetadataRepresentationType.AuthorityControlled)
@Component({
  selector: 'ds-plain-text-metadata-list-element',
  templateUrl: './plain-text-metadata-list-element.component.html',
  styleUrls: ['./plain-text-metadata-list-element.component.scss'],
})
/**
 * A component for displaying MetadataRepresentation objects in the form of plain text
 * It will simply use the value retrieved from MetadataRepresentation.getValue() to display as plain text
 */
export class PlainTextMetadataListElementComponent extends MetadataRepresentationListElementComponent implements OnInit {

  /**
   * Regex pattern for ORCID identifiers: four groups of four digits separated by hyphens.
   * The last group may end with an X (checksum digit).
   */
  private static readonly ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-(\d{3}X|\d{4})$/;

  orcidDomainUrl$ = new BehaviorSubject<string | null>(null);

  constructor(private configurationService: ConfigurationDataService) {
    super();
  }

  ngOnInit(): void {
    this.configurationService.findByPropertyName('orcid.domain-url').pipe(
      getFirstCompletedRemoteData(),
    ).subscribe((rd) => {
      if (rd.hasFailed || !rd.hasSucceeded || !rd.payload?.values?.length) {
        return;
      }

      const url = rd.payload.values[0]?.trim();
      if (url && /^https?:\/\//i.test(url)) {
        this.orcidDomainUrl$.next(url);
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

  isOrcidAuthority(orcidDomainUrl: string | null): boolean {
    if (orcidDomainUrl === null) {
      return false;
    }
    if (this.mdRepresentation instanceof MetadatumRepresentation) {
      const authority = this.mdRepresentation.authority?.trim();
      return !!authority && PlainTextMetadataListElementComponent.ORCID_PATTERN.test(authority);
    }
    return false;
  }

  getOrcidUrl(orcidDomainUrl: string | null): string {
    if (orcidDomainUrl === null) {
      return '';
    }
    const authority = this.mdRepresentation instanceof MetadatumRepresentation
      ? this.mdRepresentation.authority?.trim()
      : undefined;

    if (!authority || !PlainTextMetadataListElementComponent.ORCID_PATTERN.test(authority)) {
      return '';
    }

    const base = orcidDomainUrl.endsWith('/') ? orcidDomainUrl : orcidDomainUrl + '/';
    return `${base}${authority}`;
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
