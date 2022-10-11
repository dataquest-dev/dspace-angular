import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {RemoteData} from '../core/data/remote-data';
import {Collection} from '../core/shared/collection.model';
import {CollectionDataService} from '../core/data/collection-data.service';
import {getFirstCompletedRemoteData} from '../core/shared/operators';
import {License} from '../core/shared/license.model';
import {followLink} from '../shared/utils/follow-link-config.model';
import {filter} from 'rxjs/operators';
import {isNotUndefined} from '../shared/empty.util';

@Component({
  selector: 'ds-license-contract-page',
  templateUrl: './license-contract-page.component.html',
  styleUrls: ['./license-contract-page.component.scss']
})
export class LicenseContractPageComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              protected collectionDataService: CollectionDataService,) {
  }

  collectionId: string;

  collectionRD$: BehaviorSubject<RemoteData<Collection>> = new BehaviorSubject<RemoteData<Collection>>(null);

  licenseRD$: BehaviorSubject<RemoteData<License>> = new BehaviorSubject<RemoteData<License>>(null);

  ngOnInit(): void {
    this.collectionId = this.route.snapshot.queryParams.collectionId;
    this.collectionDataService.findById(this.collectionId, false, true, followLink('license'))
      .pipe(
        filter((collectionData: RemoteData<Collection>) => isNotUndefined((collectionData.payload))))
      .subscribe(res => {
        // load collection
        this.collectionRD$.next(res);
        res.payload.license.subscribe(licenseRD$ => {
          // load license of the collection
          this.licenseRD$.next(licenseRD$);
        });
      });
  }

}
