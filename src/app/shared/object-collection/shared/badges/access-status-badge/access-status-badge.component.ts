import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { AccessStatusObject } from './access-status.model';
import { hasValue } from '../../../../empty.util';
import { environment } from 'src/environments/environment';
import { LinkService } from 'src/app/core/cache/builders/link.service';
import { getFirstSucceededRemoteDataPayload } from 'src/app/core/shared/operators';
import { followLink } from 'src/app/shared/utils/follow-link-config.model';
import { DSpaceObject } from '../../../../../core/shared/dspace-object.model';
import { Item } from '../../../../../core/shared/item.model';
import { Bitstream } from '../../../../../core/shared/bitstream.model';

@Component({
  selector: 'ds-access-status-badge',
  templateUrl: './access-status-badge.component.html',
  styleUrls: ['./access-status-badge.component.scss']
})
/**
 * Component rendering the access status of an item or bitstream as a badge
 */
export class AccessStatusBadgeComponent implements OnInit, OnDestroy {

  @Input() object: DSpaceObject;
  accessStatus$: Observable<string>;
  embargoDate$: Observable<string>;

  /**
   * Whether to show the access status badge or not
   */
  showAccessStatus: boolean;

  /**
   * Value based stylesheet class for access status badge
   */
  accessStatusClass: string;

  /**
   * List of subscriptions
   */
  subs: Subscription[] = [];

  /**
   * Initialize instance variables
   *
   * @param {LinkService} linkService
   */
  constructor(private linkService: LinkService) { }

  ngOnInit(): void {
    if (!hasValue(this.object)) {
      return;
    }
    if (!hasValue((this.object as any).accessStatus)) {
      // In case the access status link has not been resolved yet, resolve it lazily.
      // isOptional: true is required here (unlike upstream) because the bitstream-level
      // accessStatus link doesn't exist on this backend yet (DSpace#1377) - without it,
      // resolveLink() throws for any bitstream instead of failing closed.
      this.linkService.resolveLink(this.object, followLink('accessStatus', { isOptional: true }));
    }
    switch (this.object.type.toString()) {
      case Item.type.value:
        this.handleItem();
        break;
      case Bitstream.type.value:
        this.handleBitstream();
        break;
    }
  }

  ngOnDestroy(): void {
    this.subs.filter((sub) => hasValue(sub)).forEach((sub) => sub.unsubscribe());
  }

  /**
   * Method to handle the object type Item
   */
  private handleItem(): void {
    this.showAccessStatus = environment.item.showAccessStatuses;
    if (!this.showAccessStatus) {
      // Do not show the badge if the feature is inactive.
      return;
    }
    this.accessStatus$ = (this.object as Item).accessStatus.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((accessStatus: AccessStatusObject) => hasValue(accessStatus.status) ? accessStatus.status : 'unknown'),
      map((status: string) => `access-status.${status.toLowerCase()}.listelement.badge`),
      catchError(() => observableOf('access-status.unknown.listelement.badge')),
    );

    // stylesheet based on the access status value
    this.subs.push(
      this.accessStatus$.pipe(
        map((accessStatusClass: string) => accessStatusClass.replace(/\./g, '-')),
      ).subscribe((accessStatusClass: string) => {
        this.accessStatusClass = accessStatusClass;
      }),
    );
  }

  /**
   * Method to handle the object type Bitstream
   */
  private handleBitstream(): void {
    this.showAccessStatus = environment.item.bitstream.showAccessStatuses;
    if (!this.showAccessStatus) {
      // Do not show the badge if the feature is inactive.
      return;
    }
    this.embargoDate$ = (this.object as Bitstream).accessStatus.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((accessStatus: AccessStatusObject) => hasValue(accessStatus.embargoDate) ? accessStatus.embargoDate : null),
      catchError(() => observableOf(null)),
    );
    this.subs.push(
      this.embargoDate$.subscribe((embargoDate: string) => {
        if (hasValue(embargoDate)) {
          this.accessStatus$ = observableOf('embargo.listelement.badge');
        }
      }),
    );
  }
}
