import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../../core/shared/item.model';
import {isNotEmpty} from '../../../shared/empty.util';
import {TranslateService} from '@ngx-translate/core';

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

  constructor(private translateService: TranslateService) { }

  ngOnInit(): void {
    // // If the reason of withdrawal is empty load default value
    // if (!isNotEmpty(this.reasonOfWithdrawal)) {
    //   this.reasonOfWithdrawal = this.translateService.instant('item.tombstone.withdrawal.reason.default.value');
    // }
  }

}
