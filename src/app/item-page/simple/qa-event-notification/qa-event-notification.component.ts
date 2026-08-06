import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
  switchMap,
} from 'rxjs/operators';

import { getNotificatioQualityAssuranceRoute } from '../../../admin/admin-routing-paths';
import { RequestParam } from '../../../core/cache/models/request-param.model';
import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import { FindListOptions } from '../../../core/data/find-list-options.model';
import { PaginatedList } from '../../../core/data/paginated-list.model';
import { RemoteData } from '../../../core/data/remote-data';
import { QualityAssuranceSourceObject } from '../../../core/notifications/qa/models/quality-assurance-source.model';
import { QualityAssuranceSourceDataService } from '../../../core/notifications/qa/source/quality-assurance-source-data.service';
import { Item } from '../../../core/shared/item.model';
import { getFirstCompletedRemoteData } from '../../../core/shared/operators';
import { SplitPipe } from '../../../shared/utils/split.pipe';

@Component({
  selector: 'ds-qa-event-notification',
  templateUrl: './qa-event-notification.component.html',
  styleUrls: ['./qa-event-notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [QualityAssuranceSourceDataService],
  imports: [
    AsyncPipe,
    RouterLink,
    SplitPipe,
    TranslateModule,
  ],
})
/**
 * Component for displaying quality assurance event notifications for an item.
 */
export class QaEventNotificationComponent implements OnChanges {
  /**
   * The item to display quality assurance event notifications for.
   */
  @Input() item: Item;

  /**
   * An observable that emits an array of QualityAssuranceSourceObject.
   */
  sources$: Observable<QualityAssuranceSourceObject[]>;

  constructor(
    private qualityAssuranceSourceDataService: QualityAssuranceSourceDataService,
    private authorizationService: AuthorizationDataService,
  ) {}

  /**
    * Detect changes to the item input and update the sources$ observable.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.item && changes.item.currentValue.uuid !== changes.item.previousValue?.uuid) {
      this.sources$ = this.getQualityAssuranceSources$();
    }
  }
  /**
   * Returns an Observable of QualityAssuranceSourceObject[] for the current item.
   * @returns An Observable of QualityAssuranceSourceObject[] for the current item.
   * Note: sourceId is composed as: id: "sourceName:<target>"
   */
  getQualityAssuranceSources$(): Observable<QualityAssuranceSourceObject[]> {
    const findListTopicOptions: FindListOptions = {
      searchParams: [new RequestParam('target', this.item.uuid)],
    };
    // /api/integration/qualityassurancesources/search/byTarget answers 401 to anyone who is not
    // allowed to see quality assurance events, so asking for it without checking the feature first
    // produced a guaranteed error on every item page for every anonymous visitor. The notification
    // this component renders is only actionable by a user who has that permission anyway.
    return this.authorizationService.isAuthorized(FeatureID.CanSeeQA).pipe(
      switchMap((canSeeQA: boolean) => canSeeQA
        ? this.qualityAssuranceSourceDataService.getSourcesByTarget(findListTopicOptions, false).pipe(
          getFirstCompletedRemoteData(),
          map((data: RemoteData<PaginatedList<QualityAssuranceSourceObject>>) => {
            if (data.hasSucceeded) {
              return data.payload.page;
            }
            return [];
          }),
          catchError(() => of([])),
        )
        : of([])),
    );
  }

  /**
   * Returns the quality assurance route.
   * @returns The quality assurance route.
   */
  getQualityAssuranceRoute(): string {
    return getNotificatioQualityAssuranceRoute();
  }
}
