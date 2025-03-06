import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

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
   * The reference to make possible automatically select whole content.
   */
  @ViewChild('copyCitationModal', { static: true }) citationContentRef: ElementRef;

  private _citationText = '';
  @Input()
  get citationText(): string {
    return this._citationText;
  }
  set citationText(value: string) {
    this._citationText = value;
    // Select content when citationText is updated, but only after view is initialized
    if (this.isViewInitialized) {
      setTimeout(() => this.selectContent(), 0); // Push to next tick to ensure DOM update
    }
  }

  private isViewInitialized = false;

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    // Select content if citationText is already set by this point
    if (this.citationText) {
      setTimeout(() => this.selectContent(), 0); // Ensure DOM is ready
    }
  }

  selectContent() {
    const element = this.citationContentRef?.nativeElement;
    if (element) {
      element.select();
    }
  }

  // Public method for parent to trigger selection explicitly
  selectContentOnLoad() {
    setTimeout(() => this.selectContent(), 0); // Ensure DOM is updated
  }
}
