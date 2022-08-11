import { Component, Input, OnInit } from '@angular/core';
import { HelpDeskService } from '../../../core/shared/help-desk.service';
import { HelpDesk } from '../../../core/shared/help-desk';
import { Observable } from 'rxjs';
import { RemoteData } from '../../../core/data/remote-data';

@Component({
  selector: 'ds-withdrawn-tombstone',
  templateUrl: './withdrawn-tombstone.component.html',
  styleUrls: ['./withdrawn-tombstone.component.scss']
})
export class WithdrawnTombstoneComponent implements OnInit {

  /**
   * The reason why the item was withdrawn
   */
  @Input() reasonOfWithdrawal: string;

  /**
   * The Item name of the Item
   */
  @Input() itemName: string;

  /**
   * The authors of the item is loaded from the metadata: `dc.contributor.author` and `dc.dontributor.others`
   */
  @Input() authors: string[];

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<HelpDesk>>;

  constructor(private helpDeskService: HelpDeskService) { }

  ngOnInit(): void {
    this.helpDesk$ = this.helpDeskService.getHelpDeskMail();
  }

}
