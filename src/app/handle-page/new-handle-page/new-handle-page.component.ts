import {
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';

import { HandleDataService } from '../../core/data/handle-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { Handle } from '../../core/handle/handle.model';
import { PaginationService } from '../../core/pagination/pagination.service';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { isNull } from '../../shared/empty.util';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { redirectBackWithPaginationOption } from '../handle-table/handle-table-pagination';

/**
 * The component where is creating the new external handle.
 */
@Component({
  imports: [
    FormsModule,
    TranslateModule,
  ],
  selector: 'ds-new-handle-page',
  templateUrl: './new-handle-page.component.html',
  styleUrls: ['./new-handle-page.component.scss'],
})
export class NewHandlePageComponent implements OnInit {

  /**
   * The handle input value from the form.
   */
  handle: string;

  /**
   * The url input value from the form.
   */
  url: string;

  /**
   * The current page pagination option to redirect back with the same pagination.
   */
  currentPage: number;

  constructor(
    private notificationService: NotificationsService,
    private route: ActivatedRoute,
    private translateService: TranslateService,
    private handleService: HandleDataService,
    private paginationService: PaginationService,
  ) { }

  ngOnInit(): void {
    this.currentPage = this.route.snapshot.queryParams.currentPage;
  }

  /**
   * Send the request with the new external handle object.
   * @param value from the inputs form
   */
  onClickSubmit(value) {
    this.handleService.create(value)
      .pipe(getFirstCompletedRemoteData())
      .subscribe( (handleResponse: RemoteData<Handle>) => {
        const errContent = 'handle-table.new-handle.notify.error';
        const sucContent = 'handle-table.new-handle.notify.successful';
        if (isNull(handleResponse)) {
          this.notificationService.error('', this.translateService.get(errContent));
          return;
        }

        if (handleResponse.hasSucceeded) {
          this.notificationService.success('',
            this.translateService.get(sucContent));
        } else if (handleResponse.isError) {
          this.notificationService.error('',
            this.translateService.get(errContent));
        }
      });
    redirectBackWithPaginationOption(this.paginationService, this.currentPage);
  }
}
