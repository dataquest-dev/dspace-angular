import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EpicHandleDataService } from 'src/app/core/data/epic-handle-data.service';
import { RemoteData } from 'src/app/core/data/remote-data';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { getEpicHandleTableModulePath } from '../epic-handle-routing-paths';
import { isNull } from 'src/app/shared/empty.util';
import { EpicHandle } from 'src/app/core/epicHandle/models/epic-handle.model';

@Component({
  selector: 'ds-epic-handle-new',
  templateUrl: './epic-handle-new.component.html',
  styleUrls: ['./epic-handle-new.component.scss']
})
export class EpicHandleNewComponent implements OnInit {
  url: string;
  suffix: string;
  subPrefix: string;
  subSuffix: string;
  prefix: string;
  isLoading = false;
  currentPage: number;

  constructor(private notificationService: NotificationsService,
    private route: ActivatedRoute,
    private router: Router,
    private translateService: TranslateService,
    private epicHandleService: EpicHandleDataService
  ) { }
  ngOnInit(): void {
    const params = this.route.snapshot.queryParams || {};
    this.currentPage = params.currentPage;
    this.prefix = params.prefix;
    if (!this.prefix) {
      this.router.navigate(['/epic-handle-table/prefix']);
      return;
    }
  }

  onClickSubmit(value: any) {
    if (!value.url || value.url.trim() === '') {
      this.notificationService.error(
        this.translateService.instant('epic-handle-table.new-handle.notify.error.url-required'),
        this.translateService.instant('epic-handle-table.new-handle.notify.error')
      );
      return;
    }

    this.isLoading = true;

    if (value.suffix) {
      this.epicHandleService.update(this.prefix, value.suffix, value.url.trim()).pipe(getFirstCompletedRemoteData())
      .subscribe((handleResponse) => {
        this.isLoading = false;
        if (isNull(handleResponse)) {
          this.notificationService.error('', this.translateService.instant('epic-handle-table.edit-handle.notify.error'));
          return;
        }

        if (handleResponse.hasSucceeded) {
          this.notificationService.success('', this.translateService.instant('epic-handle-table.edit-handle.notify.successful'));
          this.redirectBack();
        } else if (handleResponse.hasFailed) {
          const errorMsg = handleResponse.errorMessage ||
            this.translateService.instant('epic-handle-table.edit-handle.notify.error');
          this.notificationService.error('', errorMsg);
        }
      }, error => {
        this.isLoading = false;
        this.notificationService.error(
          '',
          this.translateService.instant('epic-handle-table.edit-handle.notify.error')
        );
      });
    } else {
      this.epicHandleService.create(
      this.prefix,
      value.url.trim(),
      value.subPrefix?.trim(),
      value.subSuffix?.trim()
    ).pipe(getFirstCompletedRemoteData())
      .subscribe((handleResponse: RemoteData<EpicHandle>) => {
        this.isLoading = false;
        if (isNull(handleResponse)) {
          this.notificationService.error(
            '', this.translateService.instant('epic-handle-table.new-handle.notify.error')
          );
          return;
        }

        if (handleResponse.hasSucceeded) {
          this.notificationService.success('', this.translateService.instant('epic-handle-table.new-handle.notify.successful'));
          this.redirectBack();
        } else if (handleResponse.hasFailed) {
          const errorMsg = handleResponse.errorMessage || this.translateService.instant('epic-handle-table.new-handle.notify.error');
          this.notificationService.error('', errorMsg);
        }
      }, error => {
        this.isLoading = false;
        this.notificationService.error('', this.translateService.instant('epic-handle-table.new-handle.notify.error'));
      });
    }
  }

  redirectBack() {
    const queryParams = this.prefix ? {prefix: this.prefix} : {};
    this.router.navigate([getEpicHandleTableModulePath()], { queryParams });
  }

  onCancel() {
    this.redirectBack();
  }

  get hasSuffix(): boolean {
    return !!this.suffix?.trim();
  }

  get hasSubPrefix(): boolean {
    return !!this.subPrefix?.trim();
  }

  get hasSubSuffix(): boolean {
    return !!this.subSuffix?.trim();
  }

  get isSuffixDisabled(): boolean {
    return this.isLoading || this.hasSubPrefix || this.hasSubSuffix;
  }

  get isSubValuesDisabled(): boolean {
    return this.isLoading || this.hasSuffix;
  }
}
