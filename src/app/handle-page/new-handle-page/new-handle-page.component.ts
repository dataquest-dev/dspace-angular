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

@Component({
  selector: 'ds-new-handle-page',
  templateUrl: './new-handle-page.component.html',
  styleUrls: ['./new-handle-page.component.scss']
})
export class NewHandlePageComponent {

  handle: string;

  url: string;

  constructor(
    private notificationsService: NotificationsService,
    private requestService: RequestService,
    private translateService: TranslateService
  ) { }

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
        if (!isNotEmpty(info) || !isNotEmpty(info.response) || !isNotEmpty(info.response.statusCode) ||
            !isNotEmpty(info.response.errorMessage)) {
          // do nothing - in another subscription should be data
          return;
        }

        if (info.response.statusCode.toString().startsWith('2')) {
          this.notificationsService.success(null, this.translateService.get('handle-table.new-handle.notify.successful'));
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
