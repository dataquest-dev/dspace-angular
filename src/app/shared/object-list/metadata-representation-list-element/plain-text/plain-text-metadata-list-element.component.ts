import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { MetadataRepresentationType } from '../../../../core/shared/metadata-representation/metadata-representation.model';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { VALUE_LIST_BROWSE_DEFINITION } from '../../../../core/shared/value-list-browse-definition.resource-type';
import { metadataRepresentationComponent } from '../../../metadata-representation/metadata-representation.decorator';
import {
  AuthorOrcidLinkTarget,
  buildOrcidProfileUrl,
  DEFAULT_AUTHOR_ORCID_LINK_TARGET,
  isOrcidAuthorityValue,
  loadAuthorOrcidLinkTarget,
  loadOrcidDomainUrl,
} from '../../../utils/orcid-author.util';
import { MetadataRepresentationListElementComponent } from '../metadata-representation-list-element.component';

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
   * ORCID domain URL loaded from the backend.
   */
  orcidDomainUrl$ = new BehaviorSubject<string | null>(null);

  /**
   * Target of the link rendered on the author name for an ORCID author. Loaded from the
    * backend property `orcid.author.link-target`.
   */
  authorOrcidLinkTarget$ = new BehaviorSubject<AuthorOrcidLinkTarget>(DEFAULT_AUTHOR_ORCID_LINK_TARGET);

  constructor(private configurationService: ConfigurationDataService) {
    super();
  }

  ngOnInit(): void {
    loadOrcidDomainUrl(this.configurationService).then((url) => this.orcidDomainUrl$.next(url));
    loadAuthorOrcidLinkTarget(this.configurationService).then((t) => this.authorOrcidLinkTarget$.next(t));
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
   * Query parameters for the browse link of an authority-controlled value (e.g. ORCID author).
   * Passes both `value` and `authority` so the browse page can call the REST endpoint with
   * `filterValue` + `filterAuthority` and resolve items whose metadata is indexed by authority key.
   */
  getAuthorityBrowseQueryParams() {
    return {
      value: this.mdRepresentation.getValue(),
      authority: this.getAuthority(),
    };
  }

  /**
   * True when the current metadatum carries a browse definition (e.g. `dc.contributor.author`),
   * which means the value can be rendered as a clickable browse link.
   */
  hasBrowseDefinition(): boolean {
    return !!this.mdRepresentation?.browseDefinition;
  }

  /**
   * Check whether the authority value of this metadata is an ORCID identifier.
   * Accepts either a bare ORCID iD or a full ORCID URL.
   */
  isOrcidAuthority(): boolean {
    return isOrcidAuthorityValue(this.getAuthority(), this.orcidDomainUrl$.value);
  }

  /**
   * Build the full ORCID profile URL for the current author. Returns an empty string when
   * the authority is not an ORCID value or when the ORCID domain URL is required but missing.
   */
  getOrcidUrl(): string {
    return buildOrcidProfileUrl(this.getAuthority(), this.orcidDomainUrl$.value);
  }

  private getAuthority(): string | undefined {
    if (this.mdRepresentation instanceof MetadatumRepresentation) {
      return this.mdRepresentation.authority?.trim();
    }
    return undefined;
  }
}
