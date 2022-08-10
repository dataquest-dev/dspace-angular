import {Component, Input, OnInit} from '@angular/core';
import {map, take} from 'rxjs/operators';
import {RemoteData} from '../../core/data/remote-data';
import {Item} from '../../core/shared/item.model';
import {getAllSucceededRemoteDataPayload, redirectOn4xx} from '../../core/shared/operators';
import {getItemPageRoute} from '../item-page-routing-paths';
import {ActivatedRoute, Router} from '@angular/router';
import {ItemDataService} from '../../core/data/item-data.service';
import {AuthService} from '../../core/auth/auth.service';
import {Observable} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {isNotEmpty} from '../../shared/empty.util';
import {HelpDeskService} from '../../core/shared/help-desk.service';

@Component({
  selector: 'ds-tombstone',
  templateUrl: './tombstone.component.html',
  styleUrls: ['./tombstone.component.scss']
})
export class TombstoneComponent implements OnInit {

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() item: Item;

  /**
   * The reason of withdrawal of the item.
   * Default value is loaded from the `item.tombstone.withdrawal.reason.default.value`
   */
  reasonOfWithdrawal: string;

  /**
   * The reason of withdrawal of the item.
   * Default value is loaded from the `item.tombstone.withdrawal.reason.default.value`
   */
  isReplaced: string;


  authors: string[];

  constructor(protected route: ActivatedRoute,
                private helpDeskService: HelpDeskService,
                private router: Router,
                private items: ItemDataService,
                private translateService: TranslateService,
                private authService: AuthService) { }

  ngOnInit(): void {

    // Load the new destination from metadata
    this.isReplaced = this.item.metadata['dc.relation.isreplacedby']?.[0]?.value;

    // Load the reason of withdrawal from metadata
    this.reasonOfWithdrawal = this.item.metadata['local.withdrawn.reason']?.[0]?.value;

    // Load authors
    this.item.metadata['dc.contributor.author']?.forEach(value => {
      this.authors.push(value.value);
    });

    this.helpDeskService.getHelpDeskMail();
  }

}
