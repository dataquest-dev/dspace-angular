import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EndUserAgreementService} from '../../core/end-user-agreement/end-user-agreement.service';

@Component({
  selector: 'ds-handle-table',
  templateUrl: './handle-table-page.component.html',
  styleUrls: ['./handle-table-page.component.scss']
})
export class HandleTablePageComponent implements OnInit {

  constructor(protected endUserAgreementService: EndUserAgreementService,
              private cdr: ChangeDetectorRef) {

  }

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    this.initAccepted();
  }

  /**
   * Initialize the "accepted" property of this component by checking if the current user has accepted it before
   */
  initAccepted() {
    this.endUserAgreementService.hasCurrentUserOrCookieAcceptedAgreement(false).subscribe((accepted) => {
      console.log('');
    });
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
