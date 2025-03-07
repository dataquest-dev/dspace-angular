import { Component, Inject, Input, OnInit } from '@angular/core';
import { Item } from '../../../core/shared/item.model';
import { Observable, of } from 'rxjs';
import { RemoteData } from '../../../core/data/remote-data';
import { VersionHistory } from '../../../core/shared/version-history.model';
import { Version } from '../../../core/shared/version.model';
import { hasValue, hasValueOperator } from '../../../shared/empty.util';
import {
  getAllSucceededRemoteData,
  getFirstSucceededRemoteDataPayload,
  getRemoteDataPayload
} from '../../../core/shared/operators';
import { map, startWith, switchMap } from 'rxjs/operators';
import { VersionHistoryDataService } from '../../../core/data/version-history-data.service';
import { AlertType } from '../../../shared/alert/alert-type';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'ds-item-versions-notice',
  templateUrl: './item-versions-notice.component.html'
})
/**
 * Component for displaying a warning notice when the item is not the latest version within its version history
 * The notice contains a link to the latest version's item page
 */
export class ItemVersionsNoticeComponent implements OnInit {
  /**
   * The item to display a version notice for
   */
  @Input() item: Item;

  /**
   * The item's version
   */
  versionRD$: Observable<RemoteData<Version>>;

  /**
   * The item's full version history
   */
  versionHistoryRD$: Observable<RemoteData<VersionHistory>>;

  /**
   * The latest version of the item's version history
   */
  latestVersion$: Observable<Version>;

  /**
   * Is the item's version equal to the latest version from the version history?
   * This will determine whether or not to display a notice linking to the latest version
   */
  showLatestVersionNotice$: Observable<boolean>;

  /**
   * The AlertType enumeration
   * @type {AlertType}
   */
  public AlertTypeEnum = AlertType;

  /**
   * New observable for the full redirect URL (with namespace)
   */
  destinationUrl$: Observable<string>;

  constructor(private versionHistoryService: VersionHistoryDataService,
              @Inject(DOCUMENT) private document: Document ) {
  }

  /**
   * Initialize the component's observables
   */
  ngOnInit(): void {
    if (hasValue(this.item.version)) {
      this.versionRD$ = this.item.version;
      this.versionHistoryRD$ = this.versionRD$.pipe(
        getAllSucceededRemoteData(),
        getRemoteDataPayload(),
        hasValueOperator(),
        switchMap((version: Version) => version.versionhistory)
      );

      this.latestVersion$ = this.versionHistoryRD$.pipe(
        getFirstSucceededRemoteDataPayload(),
        switchMap((vh) => this.versionHistoryService.getLatestVersionFromHistory$(vh))
      );

      this.showLatestVersionNotice$ = this.versionRD$.pipe(
        getFirstSucceededRemoteDataPayload(),
        switchMap((version) => this.versionHistoryService.isLatest$(version)),
        map((isLatest) => isLatest != null && !isLatest),
        startWith(false),
      );
    }

    // Compute the destination URL from latestVersion$ with the namespace
    this.destinationUrl$ = this.latestVersion$.pipe(
      switchMap(latestVersion => latestVersion?.item || of(null)),
      map(item => {
        const itemId = item?.payload?.uuid;

        if (!itemId) {
          console.error('No valid UUID found in payload');
          return this.document.location.pathname; // Fallback to the current path if extraction fails
        }

        // Get the base URL dynamically - with the namespace. Remove the last part of the path (the item UUID).
        const baseUrl = this.document.location.pathname.split('/').slice(0, -1).join('/');

        // Construct the final URL dynamically
        const finalUrl = `${baseUrl}/${itemId}`;

        return finalUrl;
      })
    );
  }

}
