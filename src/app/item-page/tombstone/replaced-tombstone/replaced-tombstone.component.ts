import {Component, Input, OnInit} from '@angular/core';
import {HelpDeskService} from '../../../core/shared/help-desk.service';
import {Observable} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';
import {HelpDesk} from '../../../core/shared/help-desk';

@Component({
  selector: 'ds-replaced-tombstone',
  templateUrl: './replaced-tombstone.component.html',
  styleUrls: ['./replaced-tombstone.component.scss']
})
export class ReplacedTombstoneComponent implements OnInit {

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() isReplaced: string;

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() itemName: string;

  /**
   * The Item to get reason or destination for Tombstone
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
