import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import {RemoteData} from '../../../core/data/remote-data';
import {Item} from '../../../core/shared/item.model';
import {first, map} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'ds-item-manage-clarin-license',
  templateUrl: './item-manage-clarin-license.component.html',
  styleUrls: ['./item-manage-clarin-license.component.scss']
})
export class ItemManageClarinLicenseComponent implements OnInit {

  /**
   * The item to display the status for
   */
  itemRD$: Observable<RemoteData<Item>>;

  licenseName: string;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.itemRD$ = this.route.parent.data.pipe(map((data) => data.dso));
    this.itemRD$.pipe(
      first(),
      map((data: RemoteData<Item>) => data.payload)
    ).subscribe((item: Item) => {
      console.log('item', item);
      this.licenseName = item?.metadata?.['dc.rights']?.[0]?.value;
    });
  }

}
