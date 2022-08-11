import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../../core/shared/item.model';
import {isNotEmpty} from '../../../shared/empty.util';
import {TranslateService} from '@ngx-translate/core';
import {HelpDeskService} from '../../../core/shared/help-desk.service';
import {getAllSucceededRemoteDataPayload} from '../../../core/shared/operators';
import {HelpDesk} from '../../../core/shared/help-desk';
import {Observable} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';

@Component({
  selector: 'ds-withdrawn-tombstone',
  templateUrl: './withdrawn-tombstone.component.html',
  styleUrls: ['./withdrawn-tombstone.component.scss']
})
export class WithdrawnTombstoneComponent implements OnInit {

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() reasonOfWithdrawal: string;

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() itemName: string;

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<HelpDesk>>;

  constructor(private helpDeskService: HelpDeskService) { }

  ngOnInit(): void {
    this.helpDesk$ = this.helpDeskService.getHelpDeskMail();
  }

}
