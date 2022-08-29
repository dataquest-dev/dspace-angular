import { Component, OnInit } from '@angular/core';
import {CreateRequest, PatchRequest} from '../../core/data/request.models';
import {RequestService} from '../../core/data/request.service';
import {GenericConstructor} from '../../core/shared/generic-constructor';
import {ResponseParsingService} from '../../core/data/parsing.service';
import {StatusCodeOnlyResponseParsingService} from '../../core/data/status-code-only-response-parsing.service';
import {isNotEmpty} from '../../shared/empty.util';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {TranslateService} from '@ngx-translate/core';
import {take} from 'rxjs/operators';
import {paginationID, redirectBackWithPaginationOption} from '../handle-table/handle-table-pagination';
import {getHandleTableModulePath} from '../../app-routing-paths';
import {PaginationService} from '../../core/pagination/pagination.service';
import {ActivatedRoute} from '@angular/router';
import {SUCCESSFUL_RESPONSE_START_CHAR} from '../../core/handle/handle.resource-type';

@Component({
  selector: 'ds-new-handle-page',
  templateUrl: './new-handle-page.component.html',
  styleUrls: ['./new-handle-page.component.scss']
})
export class NewHandlePageComponent implements OnInit {

  handle: string;

  url: string;

  currentPage: number;

  constructor(
    private notificationsService: NotificationsService,
    private route: ActivatedRoute,
    private requestService: RequestService,
    private paginationService: PaginationService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.currentPage = this.route.snapshot.queryParams.currentPage;
  }

  onClickSubmit(value) {
    // prepare request
    const requestId = this.requestService.generateRequestId();
    const createRequest = new CreateRequest(requestId,'http://localhost:8080/server/api/core/handles', value);

    // call createRequest request
    this.requestService.send(createRequest);

    // check response
    this.requestService.getByUUID(requestId)
      .subscribe(info => {
        // if is empty
        if (!isNotEmpty(info) || !isNotEmpty(info.response) || !isNotEmpty(info.response.statusCode)) {
          // do nothing - in another subscription should be data
          return;
        }

        if (info.response.statusCode.toString().startsWith(SUCCESSFUL_RESPONSE_START_CHAR)) {
          this.notificationsService.success(null, this.translateService.get('handle-table.new-handle.notify.successful'));
          redirectBackWithPaginationOption(this.paginationService, this.currentPage);
        } else {
          // write error in the notification
          // compose error message with message definition and server error
          let errorMessage = '';
          this.translateService.get('handle-table.new-handle.notify.error').pipe(
            take(1)
          ).subscribe( message => {
            errorMessage = message + ': ' + info.response.errorMessage;
          });

          this.notificationsService.error(null, errorMessage);
        }
    });
  }

}
