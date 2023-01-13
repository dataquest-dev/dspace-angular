import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Item} from '../../core/shared/item.model';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {take} from 'rxjs/operators';
import {isNull, isUndefined} from '../../shared/empty.util';
import {getFirstSucceededRemoteData} from '../../core/shared/operators';
import {Clipboard} from '@angular/cdk/clipboard';
import {BehaviorSubject} from 'rxjs';
import {ModalDismissReasons, NgbModal, NgbTooltip, NgbTooltipConfig} from '@ng-bootstrap/ng-bootstrap';
import {ClarinRefCitationModalComponent} from '../clarin-ref-citation-modal/clarin-ref-citation-modal.component';
import {GetRequest} from '../../core/data/request.models';
import {RequestService} from '../../core/data/request.service';
import {RemoteDataBuildService} from '../../core/cache/builders/remote-data-build.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {HttpOptions} from '../../core/dspace-rest/dspace-rest.service';

export const ET_AL_TEXT = 'et al.';

@Component({
  selector: 'ds-clarin-ref-citation',
  templateUrl: './clarin-ref-citation.component.html',
  styleUrls: ['./clarin-ref-citation.component.scss']
})
export class ClarinRefCitationComponent implements OnInit {

  @Input() item: Item;

  @ViewChild('tooltip', {static: false}) tooltipRef: NgbTooltip;
  @ViewChild('citationContentRef', { static: true }) citationContentRef: ElementRef;

  citationText: string;
  identifierURI: string;
  itemNameText: string;
  repositoryNameText: string;
  closeResult = '';

  constructor(private configurationService: ConfigurationDataService,
              private clipboard: Clipboard,
              public config: NgbTooltipConfig,
              private modalService: NgbModal,
              private requestService: RequestService,
              protected rdbService: RemoteDataBuildService,
              protected halService: HALEndpointService,) {
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
    this.identifierURI = this.getIdentifierUri();
    this.getRepositoryName().then(res => {
      this.repositoryNameText = res?.payload?.values?.[0];
    });
  }

  copyText() {
    const tabChar = '  ';
    this.clipboard.copy(this.citationText + ',\n' + tabChar + this.itemNameText + ', ' +
      this.repositoryNameText + ', \n' + tabChar + this.identifierURI);
    setTimeout(() => {
      this.tooltipRef.close();
    }, 700);
  }

  getRepositoryName(): Promise<any> {
    return this.configurationService.findByPropertyName('dspace.name')
      .pipe(getFirstSucceededRemoteData()).toPromise();
  }

  getIdentifierUri() {
    const handleMetadata = this.item.metadata['dc.identifier.uri'];
    if (isUndefined(handleMetadata) || isNull(handleMetadata)) {
      return null;
    }

    return handleMetadata?.[0]?.value;
  }

  getHandle() {
    // Separate the handle from the full URI
    const fullUri = this.getIdentifierUri();
    const handleWord = 'handle/';
    const startHandleIndex = fullUri.indexOf('handle/') + handleWord.length;
    return fullUri.substr(startHandleIndex);
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

  async openModal(citationType) {
    const modal = this.modalService.open(ClarinRefCitationModalComponent, {
      size: 'xl',
      ariaLabelledBy: 'modal-basic-title'
    });
    modal.componentInstance.itemName = this.itemNameText;
    // Fetch the citation text from the API
    let citationText = '';
    await this.getCitationText(citationType)
      .then(res => {
        citationText = res.payload?.metadata;
      });
    modal.componentInstance.citationText = citationText;
  }

  getCitationText(citationType): Promise<any> {
    const requestId = this.requestService.generateRequestId();
    // Create the request
    const getRequest = new GetRequest(requestId, this.halService.getRootHref() + '/core/refbox/citations?type=' +
      // citationType + '&handle=' + this.getHandle(), requestOptions);
    citationType + '&handle=' + this.getHandle());

    // Call get request
    this.requestService.send(getRequest);

    // Process and return the response
    return this.rdbService.buildFromRequestUUID(requestId)
      .pipe(getFirstSucceededRemoteData()).toPromise();
  }
}
