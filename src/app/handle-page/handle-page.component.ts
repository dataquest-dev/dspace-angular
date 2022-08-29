import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EndUserAgreementService } from '../core/end-user-agreement/end-user-agreement.service';

/**
 * The component which contains the handle-table and the change-global-prefix section.
 */
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
  // tslint:disable-next-line:no-empty
  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
