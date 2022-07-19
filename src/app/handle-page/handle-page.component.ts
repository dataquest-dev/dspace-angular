import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EndUserAgreementService} from '../core/end-user-agreement/end-user-agreement.service';

@Component({
  selector: 'ds-handle-page',
  templateUrl: './handle-page.component.html',
  styleUrls: ['./handle-page.component.scss']
})
export class HandlePageComponent implements OnInit {

  constructor(protected endUserAgreementService: EndUserAgreementService,
              private cdr: ChangeDetectorRef) {

  }

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    console.log('init');
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
