import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getBaseUrl, loadItemAuthors } from '../clarin-shared-util';
import { Item } from '../../core/shared/item.model';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { AuthorNameLink } from '../clarin-item-box-view/clarin-author-name-link.model';
import { AuthorOrcidLinkTarget, loadAuthorOrcidLinkTarget, loadOrcidDomainUrl } from '../utils/orcid-author.util';

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
   * Whether the name of an author with an ORCID iD links to the ORCID profile instead of the search
   * (backend property `orcid.author.link-target`).
   */
  linkNameToOrcid = false;

  constructor(protected configurationService: ConfigurationDataService) { }

  async ngOnInit(): Promise<void> {
    const [, orcidDomainUrl, orcidLinkTarget] = await Promise.all([
      this.assignBaseUrl(),
      loadOrcidDomainUrl(this.configurationService),
      loadAuthorOrcidLinkTarget(this.configurationService),
    ]);
    this.linkNameToOrcid = orcidLinkTarget === AuthorOrcidLinkTarget.Orcid;
    loadItemAuthors(this.item, this.itemAuthors, this.baseUrl, this.fields, orcidDomainUrl);
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
}
