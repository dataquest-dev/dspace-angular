import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { getBaseUrl, loadItemAuthors } from '../clarin-shared-util';
import { Item } from '../../core/shared/item.model';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { AuthorNameLink } from '../clarin-item-box-view/clarin-author-name-link.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';

@Component({
  selector: 'ds-clarin-item-author-preview',
  templateUrl: './clarin-item-author-preview.component.html',
  styleUrls: ['./clarin-item-author-preview.component.scss']
})
export class ClarinItemAuthorPreviewComponent implements OnInit {

  /**
   * The item to display authors for.
   */
  @Input() item: Item;

  /**
   * Metadata fields where are stored authors.
   */
  @Input() fields = [];

  /**
   * Authors of the Item.
   */
  itemAuthors: BehaviorSubject<AuthorNameLink[]> = new BehaviorSubject<AuthorNameLink[]>([]);

  /**
   * If the Item have a lot of authors do not show them all.
   */
  showEveryAuthor: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /**
   * UI URL loaded from the server.
   */
  baseUrl = '';

  /**
   * ORCID domain URL loaded from the backend property `orcid.domain-url`.
   * When unset (backend does not expose the property) bare ORCID iDs are kept as plain text.
   */
  orcidDomainUrl: string | null = null;

  constructor(protected configurationService: ConfigurationDataService) { }

  async ngOnInit(): Promise<void> {
    await this.assignBaseUrl();
    await this.assignOrcidDomainUrl();
    loadItemAuthors(this.item, this.itemAuthors, this.baseUrl, this.fields, this.orcidDomainUrl);
  }
  toggleShowEveryAuthor() {
    this.showEveryAuthor.next(!this.showEveryAuthor.value);
  }

  /**
   * Load base url from the configuration from the BE.
   */
  async assignBaseUrl() {
    this.baseUrl = await getBaseUrl(this.configurationService)
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }

  /**
   * Load `orcid.domain-url` from the backend configuration so that bare ORCID iDs
   * can be expanded into a hyperlink to the configured ORCID host.
   */
  async assignOrcidDomainUrl(): Promise<void> {
    this.orcidDomainUrl = await this.configurationService.findByPropertyName('orcid.domain-url').pipe(
      getFirstCompletedRemoteData(),
      take(1),
    ).toPromise().then((rd) => {
      if (rd?.hasSucceeded && rd.payload?.values?.length > 0) {
        return rd.payload.values[0];
      }
      return null;
    });
  }
}
