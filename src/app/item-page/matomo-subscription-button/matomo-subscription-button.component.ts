import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { MatomoReportSubscriptionDataService } from '../../core/data/clarin/matomo-report-subscription-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { MatomoReportSubscription } from '../../core/shared/clarin/matomo-report-subscription.model';
import { Item } from '../../core/shared/item.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { BtnDisabledDirective } from '../../shared/btn-disabled.directive';
import { NotificationsService } from '../../shared/notifications/notifications.service';


@Component({
  imports: [
    BtnDisabledDirective,
    TranslateModule,
  ],
  selector: 'ds-matomo-subscription-button',
  templateUrl: './matomo-subscription-button.component.html',
  styleUrls: ['./matomo-subscription-button.component.scss'],
})
export class MatomoSubscriptionButtonComponent implements OnInit, OnDestroy {

  @Input() item: Item;

  isLoading = true;
  isSubscribed = false;

  subscriptions: Subscription[] = [];

  constructor(
    private matomoSubscriptionService: MatomoReportSubscriptionDataService,
    private cdr: ChangeDetectorRef,
    private notificationsService: NotificationsService,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadSubscriptionStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load subscription status
   */
  loadSubscriptionStatus(): void {
    if (!this.item?.id) {
      this.isLoading = false;
      this.isSubscribed = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const subscription = this.matomoSubscriptionService
      .getSubscriptionStatus(this.item.id)
      .pipe(
        getFirstCompletedRemoteData(),
      )
      .subscribe({
        next: (rd: RemoteData<MatomoReportSubscription>) => {
          if (rd.hasSucceeded && rd.payload) {
            this.isSubscribed = true;
          } else if (rd.hasFailed && rd.statusCode === 404) {
            this.isSubscribed = false;
          } else {
            this.isSubscribed = false;
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSubscribed = false;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });

    this.subscriptions.push(subscription);
  }

  onSubscribe(): void {
    if (this.isLoading || !this.item?.id) {
      return;
    }
    this.isLoading = true;
    this.cdr.detectChanges();

    const subscription = this.matomoSubscriptionService
      .subscribe(this.item.id)
      .pipe(
        getFirstCompletedRemoteData(),
      )
      .subscribe({
        next: (rd) => {
          if (rd.hasSucceeded) {
            this.isSubscribed = true;
            this.notificationsService.success(
              this.translateService.instant('matomo.subscription.subscribe.success.title'),
              this.translateService.instant('matomo.subscription.subscribe.success.message'),
            );
          } else {
            this.notificationsService.error(
              this.translateService.instant('matomo.subscription.subscribe.error.title'),
              this.translateService.instant('matomo.subscription.subscribe.error.message'),
            );
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notificationsService.error(
            this.translateService.instant('matomo.subscription.subscribe.error.title'),
            this.translateService.instant('matomo.subscription.subscribe.error.message'),
          );

          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });

    this.subscriptions.push(subscription);
  }

  onUnsubscribe(): void {
    if (this.isLoading || !this.item?.id) {
      return;
    }
    this.isLoading = true;
    this.cdr.detectChanges();

    const subscription = this.matomoSubscriptionService
      .unsubscribe(this.item.id)
      .pipe(
        getFirstCompletedRemoteData(),
      )
      .subscribe({
        next: (rd) => {
          if (rd.hasSucceeded) {
            this.isSubscribed = false;
            this.notificationsService.success(
              this.translateService.instant('matomo.subscription.unsubscribe.success.title'),
              this.translateService.instant('matomo.subscription.unsubscribe.success.message'),
            );
          } else {
            this.notificationsService.error(
              this.translateService.instant('matomo.subscription.unsubscribe.error.title'),
              this.translateService.instant('matomo.subscription.unsubscribe.error.message'),
            );
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.notificationsService.error(
            this.translateService.instant('matomo.subscription.unsubscribe.error.title'),
            this.translateService.instant('matomo.subscription.unsubscribe.error.message'),
          );

          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });

    this.subscriptions.push(subscription);
  }
}
