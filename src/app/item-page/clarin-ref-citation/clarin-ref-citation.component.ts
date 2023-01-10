import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {take} from 'rxjs/operators';
import {isNull, isUndefined} from '../../shared/empty.util';
import {getFirstSucceededRemoteData} from '../../core/shared/operators';
import {Clipboard} from '@angular/cdk/clipboard';
import {BehaviorSubject} from 'rxjs';
import {NgbTooltipConfig} from '@ng-bootstrap/ng-bootstrap';

export const ET_AL_TEXT = 'et al.';

@Component({
  selector: 'ds-clarin-ref-citation',
  templateUrl: './clarin-ref-citation.component.html',
  styleUrls: ['./clarin-ref-citation.component.scss']
})
export class ClarinRefCitationComponent implements OnInit {

  @Input() item: Item;

  citationText: string;
  handleText: string;
  itemNameText: string;
  repositoryNameText: string;

  constructor(private configurationService: ConfigurationDataService,
              private clipboard: Clipboard,
              config: NgbTooltipConfig) {
    // Configure the tooltip to show on click
    config.triggers = 'click';
  }

  ngOnInit(): void {
    console.log('item', this.item);
    const author = this.getAuthors();
    const year = this.getYear();

    let citationArray = [author, year];
    // Filter null values
    citationArray = citationArray.filter(textValue => {
      return textValue !== null;
    });

    this.citationText = citationArray.join(', ');
    this.itemNameText = this.getTitle();
    this.handleText = this.getHandle();
    this.getRepositoryName().then(res => {
      this.repositoryNameText = res?.payload?.values?.[0];
    });
  }

  copyText() {
    const tabChar = '  ';
    this.clipboard.copy(this.citationText + ',\n' + tabChar + this.itemNameText + ', ' +
      this.repositoryNameText + ', \n' + tabChar + this.handleText);
  }

  getRepositoryName(): Promise<any> {
    return this.configurationService.findByPropertyName('dspace.name')
      .pipe(getFirstSucceededRemoteData()).toPromise();
  }

  getHandle() {
    const handleMetadata = this.item.metadata['dc.identifier.uri'];
    if (isUndefined(handleMetadata) || isNull(handleMetadata)) {
      return null;
    }

    return handleMetadata?.[0]?.value;
  }

  getAuthors() {
    let authorText = '';
    const authorMetadata = this.item.metadata['dc.contributor.author'];
    if (isUndefined(authorMetadata) || isNull(authorMetadata)) {
      return null;
    }

    authorText = authorMetadata[0]?.value;
    // There are more authors for the item
    if (authorMetadata.length > 1) {
      authorText = '; ' + ET_AL_TEXT;
    }

    return authorText;
  }

  getYear() {
    const yearMetadata = this.item.metadata['dc.date.issued'];
    if (isUndefined(yearMetadata) || isNull(yearMetadata)) {
      return null;
    }

    // The issued date is in the format '2000-01-01'
    const issuedDateValues = yearMetadata[0]?.value?.split('-');
    // Extract the year and return
    return issuedDateValues[0];
  }

  getTitle() {
    const titleMetadata = this.item.metadata['dc.title'];
    if (isUndefined(titleMetadata) || isNull(titleMetadata)) {
      return null;
    }

    return titleMetadata[0]?.value;
  }

}
