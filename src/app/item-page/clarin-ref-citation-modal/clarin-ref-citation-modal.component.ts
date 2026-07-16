import { UpperCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

/**
 * The modal component for copying the citation data retrieved from OAI-PMH.
 */
@Component({
  imports: [
    TranslateModule,
    UpperCasePipe,
  ],
  selector: 'ds-clarin-ref-citation-modal',
  templateUrl: './clarin-ref-citation-modal.component.html',
  styleUrls: ['./clarin-ref-citation-modal.component.scss'],
})
export class ClarinRefCitationModalComponent implements AfterViewInit {

  /**
   * Reference to the textarea for selecting text.
   */
  @ViewChild('copyCitationModal', { static: false }) citationContentRef!: ElementRef<HTMLTextAreaElement>;

  /**
   * The citation context - data retrieved from OAI-PMH
   */
  @Input()
  citationText = '';

  /**
   * The name of the showed Item
   */
  @Input()
  itemName = '';

  /**
   * The type of the citation - e.g. `bibtex` or `cmdi`
   */
  @Input()
  citationType = '';


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
