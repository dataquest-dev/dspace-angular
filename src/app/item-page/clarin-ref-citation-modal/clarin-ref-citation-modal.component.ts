import {AfterContentInit, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {connectableObservableDescriptor} from 'rxjs/internal/observable/ConnectableObservable';

@Component({
  selector: 'ds-clarin-ref-citation-modal',
  templateUrl: './clarin-ref-citation-modal.component.html',
  styleUrls: ['./clarin-ref-citation-modal.component.scss']
})
export class ClarinRefCitationModalComponent implements OnInit{

  constructor(public activeModal: NgbActiveModal) {
  }

  @ViewChild('copyCitationModal', { static: true }) citationContentRef: ElementRef;

  /**
   * The `name` of the Clarin License
   */
  @Input()
  itemName = '';

  /**
   * The `definition` of the Clarin License
   */
  @Input()
  citationText = '';

  ngOnInit(): void {
  }

  selectContent() {
    this.citationContentRef?.nativeElement?.select();
  }
}
