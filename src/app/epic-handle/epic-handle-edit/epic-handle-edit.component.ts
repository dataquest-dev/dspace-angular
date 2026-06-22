import {
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { EpicHandleDataService } from 'src/app/core/data/epic-handle-data.service';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { isNull } from 'src/app/shared/empty.util';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';

import { BtnDisabledDirective } from '../../shared/btn-disabled.directive';
import { getEpicHandleTableModulePath } from '../epic-handle-routing-paths';

@Component({
  imports: [
    BtnDisabledDirective,
    FormsModule,
    TranslateModule,
  ],
  selector: 'ds-epic-handle-edit',
  templateUrl: './epic-handle-edit.component.html',
  styleUrls: ['./epic-handle-edit.component.scss'],
})
export class EpicHandleEditComponent implements OnInit {
  handleId: string;
  prefix: string;
  suffix: string;
  url: string;
  newUrl: string;
  isLoading = false;
  currentPage: number;
  constructor(private notificationService: NotificationsService,
    private route: ActivatedRoute, private router: Router,
    private translateService: TranslateService,
    private epicHandleService: EpicHandleDataService,
  ) { }
  ngOnInit(): void {
    this.handleId = this.route.snapshot.queryParams.id;
    this.url = this.route.snapshot.queryParams.url;

    this.currentPage = this.route.snapshot.queryParams.currentPage;
    if (!this.handleId) {
      this.notificationService.error('', this.translateService.instant('epic-handle-table.edit-handle.notify.error.no-handle'));
      this.redirectBack();
      return;
    }

    const parts = this.handleId.split('/');
    if (parts.length !== 2) {
      this.notificationService.error('', this.translateService.instant('epic-handle-table.edit-handle.notify.error.invalid-handle'));
      this.redirectBack();
      return;
    }

    this.prefix = parts[0];
    this.suffix = parts[1];
    this.newUrl = this.url;
  }

  onClickSubmit(value: { url: string }) {
    if (!value.url || value.url.trim() === '') {
      this.notificationService.error(
        this.translateService.instant('epic-handle-table.edit-handle.notify.error.url-required'),
        this.translateService.instant('epic-handle-table.edit-handle.notify.error'),
      );
      return;
    }

    this.isLoading = true;

    this.epicHandleService.update(this.prefix, this.suffix, value.url.trim()).pipe(getFirstCompletedRemoteData())
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
      }, (error: unknown) => {
        this.isLoading = false;
        this.notificationService.error(
          '',
          this.translateService.instant('epic-handle-table.edit-handle.notify.error'),
        );
      });
  }

  redirectBack() {
    const queryParams = this.prefix ? {  prefix: this.prefix } : {};
    this.router.navigate([getEpicHandleTableModulePath()], { queryParams });
  }

  onCancel() {
    this.redirectBack();
  }
}
