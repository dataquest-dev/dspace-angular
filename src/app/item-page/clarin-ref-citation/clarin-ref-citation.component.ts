import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Item } from '../../core/shared/item.model';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { getFirstSucceededRemoteData } from '../../core/shared/operators';
import { Clipboard } from '@angular/cdk/clipboard';
import { NgbModal, NgbTooltip, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ClarinRefCitationModalComponent } from '../clarin-ref-citation-modal/clarin-ref-citation-modal.component';
import { GetRequest } from '../../core/data/request.models';
import { RequestService } from '../../core/data/request.service';
import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';


/**
 * The citation part in the ref-box component.
 * The components shows formatted text, the copy button and the modal buttons for the copying citation
 * in the `bibtex` and `cmdi` format.
 */
@Component({
  selector: 'ds-clarin-ref-citation',
  templateUrl: './clarin-ref-citation.component.html',
  styleUrls: ['./clarin-ref-citation.component.scss']
})
export class ClarinRefCitationComponent implements OnInit {

  /**
   * The current item.
   */
  @Input() item: Item;

  /**
   * After clicking on the `Copy` icon the message `Copied` is popped up.
   */
  @ViewChild('tooltip', {static: false}) tooltipRef: NgbTooltip;

  /**
   * Name of the Item
   */
  itemNameText: string;

  /**
   * The content of the reference box, which will be displayed in the tooltip.
   * This content is fetched from the RefBox Controller.
   */
  refboxContent: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  /**
   * The text to be displayed when the ref box content is empty or cannot be fetched.
   */
  EMPTY_CONTENT = 'Cannot fetch the ref box content';

  constructor(private configurationService: ConfigurationDataService,
              private clipboard: Clipboard,
              public config: NgbTooltipConfig,
              private modalService: NgbModal,
              private requestService: RequestService,
              protected rdbService: RemoteDataBuildService,
              protected halService: HALEndpointService,
              private sanitizer: DomSanitizer) {
    // Configure the tooltip to show on click - `Copied` message
    config.triggers = 'click';
  }

  ngOnInit(): void {
    void this.fetchRefBoxContent()
      .then((content) => {
        // Sanitize the content to prevent XSS attacks
        this.refboxContent.next(this.sanitizer.bypassSecurityTrustHtml(content));
      }).catch((error) => {
          console.error('Failed to fetch refbox content:', error);
          this.refboxContent.next(this.EMPTY_CONTENT);
      });
    this.itemNameText = this.item?.firstMetadataValue('dc.title');
  }

  /**
   * Copy the text from the reference box to the clipboard.
   * Remove the html tags from the text and copy only the plain text.
   */
  copyText() {
    const displayText = this.refboxContent.value;
    let plainText = this.EMPTY_CONTENT;
    if (displayText) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = displayText;
      plainText = tempDiv.textContent || '';
    }
    this.clipboard.copy(plainText);
    setTimeout(() => {
      this.tooltipRef.close();
    }, 700);
  }

  /**
   * Fetch the content of the reference box from the RefBox Controller.
   */
  async fetchRefBoxContent(): Promise<string> {
    const requestId = this.requestService.generateRequestId();
    const getRequest = new GetRequest(
      requestId,
      this.halService.getRootHref() + '/core/refbox?handle=' + this.item?.handle
    );
    this.requestService.send(getRequest);

    try {
      const res: any = await this.rdbService.buildFromRequestUUID(requestId)
        .pipe(getFirstSucceededRemoteData()).toPromise();
      return res?.payload?.displayText || this.EMPTY_CONTENT;
    } catch (error) {
      return this.EMPTY_CONTENT;
    }
  }

  /**
   * Open the citation modal with the data retrieved from the OAI-PMH.
   * @param citationType
   */
  async openModal(citationType: string) {
    const modal = this.modalService.open(ClarinRefCitationModalComponent, {
      size: 'xl',
      ariaLabelledBy: 'modal-basic-title'
    });

    // Set initial properties
    modal.componentInstance.itemName = this.itemNameText;
    modal.componentInstance.citationType = citationType;

    // Fetch the citation text from the API
    let citationText = '';
    await this.getCitationText(citationType)
      .then(res => {
        citationText = res.payload?.metadata || ''; // Fallback to empty string if metadata is undefined
        modal.componentInstance.citationText = citationText; // Set citationText after fetching
      });

    // Ensure the modal content is selected after rendering
    modal.componentInstance.selectContentOnLoad();
  }

  /**
   * Get the OAI-PMH data through the RefBox Controller
   */
  getCitationText(citationType): Promise<any> {
    const requestId = this.requestService.generateRequestId();
    // Create the request
    const getRequest = new GetRequest(requestId, this.halService.getRootHref() + '/core/refbox/citations?type=' +
    citationType + '&handle=' + this.item?.handle);

    // Call get request
    this.requestService.send(getRequest);

    // Process and return the response
    return this.rdbService.buildFromRequestUUID(requestId)
      .pipe(getFirstSucceededRemoteData()).toPromise();
  }
}
