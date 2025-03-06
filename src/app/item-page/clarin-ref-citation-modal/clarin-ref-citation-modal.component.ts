import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * The modal component for copying the citation data retrieved from OAI-PMH.
 */
@Component({
  selector: 'ds-clarin-ref-citation-modal',
  templateUrl: './clarin-ref-citation-modal.component.html',
  styleUrls: ['./clarin-ref-citation-modal.component.scss']
})
export class ClarinRefCitationModalComponent implements AfterViewInit {

  /**
   * The citation text that will be displayed in the modal.
   */
  @Input() citationText = '';

  /**
   * The name of the item (title/header of the modal).
   */
  @Input() itemName = '';

  /**
   * The citation type (e.g., CMDI,..) displayed in the footer.
   */
  @Input() citationType = '';

  /**
   * Reference to the textarea for selecting text.
   */
  @ViewChild('copyCitationModal', { static: false }) citationContentRef!: ElementRef<HTMLTextAreaElement>;

  private isViewInitialized = false;

  constructor(public activeModal: NgbActiveModal) {} // Inject modal service

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.citationText) {
      this.selectContent();
    }
  }

  /**
   * Selects the content of the citation text area.
   */
  selectContent(): void {
    setTimeout(() => {
      this.citationContentRef?.nativeElement.select();
    }, 0); // Ensure DOM is updated before selection
  }

  /**
   * Allows external triggers for content selection.
   */
  selectContentOnLoad(): void {
    this.selectContent();
  }
}
