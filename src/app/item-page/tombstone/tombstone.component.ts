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

  // /**
  //  * The item wrapped in a remote-data object
  //  */
  // itemRD$: Observable<RemoteData<Item>>;

  /**
   * The reason of withdrawal of the item.
   * Default value is loaded from the `item.tombstone.withdrawal.reason.default.value`
   */
  reasonOfWithdrawal: string;

  /**
   * The reason of withdrawal of the item.
   * Default value is loaded from the `item.tombstone.withdrawal.reason.default.value`
   */
  newDestination: string;


  authors: string[];

  constructor(protected route: ActivatedRoute,
                private router: Router,
                private items: ItemDataService,
                private translateService: TranslateService,
                private authService: AuthService) { }

  ngOnInit(): void {
    // this.itemRD$ = this.route.data.pipe(
    //   map((data) => data.dso as RemoteData<Item>),
    //   redirectOn4xx(this.router, this.authService)
    // );
    //
    // this.itemRD$.pipe(
    //   take(1),
    //   getAllSucceededRemoteDataPayload())
    //   .subscribe(item => {
    //     const lastIndexOfProvenance = item.metadata['dc.description.provenance'].length - 1;
    //     this.reasonOfWithdrawal = item.metadata['dc.description.provenance']?.[lastIndexOfProvenance]?.value;
    //   });

    // Load the reason of withdrawal from metadata
    const lastIndexOfProvenance = this.item.metadata['dc.description.provenance'].length - 1;
    this.reasonOfWithdrawal = this.item.metadata['dc.description.provenance']?.[lastIndexOfProvenance]?.value;

    // Load the new destination from metadata
    this.newDestination = this.item.metadata['dc.relation.isreplacedby']?.[0].value;

    // Load authors
    this.item.metadata['dc.contributor.author']?.forEach(value => {
      this.authors.push(value.value);
    });
  }

}
