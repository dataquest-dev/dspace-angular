import {
  Component,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { Operation } from 'fast-json-patch';
import { take } from 'rxjs/operators';

import { HandleDataService } from '../../core/data/handle-data.service';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { PatchRequest } from '../../core/data/request.models';
import { RequestService } from '../../core/data/request.service';
import { Handle } from '../../core/handle/handle.model';
import { SUCCESSFUL_RESPONSE_START_CHAR } from '../../core/handle/handle.resource-type';
import { PaginationService } from '../../core/pagination/pagination.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { getFirstSucceededRemoteDataPayload } from '../../core/shared/operators';
import {
  isEmpty,
  isNotEmpty,
} from '../../shared/empty.util';
import { ErrorComponent } from '../../shared/error/error.component';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { redirectBackWithPaginationOption } from '../handle-table/handle-table-pagination';

/**
 * The component where is changing the global handle prefix.
 */
@Component({
  imports: [
    ErrorComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  selector: 'ds-change-handle-prefix-page',
  templateUrl: './change-handle-prefix-page.component.html',
  styleUrls: ['./change-handle-prefix-page.component.scss'],
})
export class ChangeHandlePrefixPageComponent implements OnInit {

  constructor(
    private notificationsService: NotificationsService,
    private paginationService: PaginationService,
    private requestService: RequestService,
    private translateService: TranslateService,
    private handleDataService: HandleDataService,
    private halService: HALEndpointService,
    private fb: FormBuilder,
  ) { }

  /**
   * The form inputs
   */
  changePrefix: FormGroup;

  ngOnInit(): void {
    this.createForm();
  }

  /**
   * Set up the form input with default values and validators.
   */
  createForm() {
    this.changePrefix = this.fb.group({
      oldPrefix: ['', Validators.required ],
      newPrefix: ['', Validators.required ],
      archive: new FormControl(false),
    });
  }

  /**
   * Return all handles
   */
  async getExistingHandles(): Promise<PaginatedList<Handle>> {
    return this.handleDataService.findAll()
      .pipe(
        getFirstSucceededRemoteDataPayload<PaginatedList<Handle>>(),
      ).toPromise();
  }

  /**
   * Send the request with updated prefix to the server.
   * @param handlePrefixConfig the form inputs values
   */
  async onClickSubmit(handlePrefixConfig) {
    // Show validation errors after submit
    this.changePrefix.markAllAsTouched();

    if (!this.changePrefix.valid) {
      return;
    }

    // create patch request operation
    const patchOperation = {
      op: 'replace', path: '/setPrefix', value: handlePrefixConfig,
    } as Operation;

    let handleHref = '';
    // load handles endpoint
    this.halService.getEndpoint(this.handleDataService.getLinkPath()).pipe(
      take(1),
    ).subscribe(endpoint => {
      handleHref = endpoint;
    });

    // Patch request must contain some existing Handle ID because the server throws the error
    // If the Handle table is empty - there is no Handle - do not send Patch request but throw error
    let existingHandleId = null;
    await this.getExistingHandles().then(paginatedList => {
      existingHandleId = paginatedList.page.pop().id;
    });

    // There is no handle in the DSpace
    if (isEmpty(existingHandleId)) {
      this.showErrorNotification('handle-table.change-handle-prefix.notify.error.empty-table');
      return;
    }

    // Generate the request ID and send the request
    const requestId = this.requestService.generateRequestId();
    const patchRequest = new PatchRequest(requestId, handleHref + '/' + existingHandleId, [patchOperation]);
    // call patch request
    this.requestService.send(patchRequest);

    // notification the prefix changing has started
    this.notificationsService.warning(null, this.translateService.get('handle-table.change-handle-prefix.notify.started'));

    // check response
    this.requestService.getByUUID(requestId)
      .subscribe(info => {
        // if is empty
        if (!isNotEmpty(info) || !isNotEmpty(info.response) || !isNotEmpty(info.response.statusCode)) {
          // do nothing - in another subscription should be data
          return;
        }

        // if the status code starts with 2 - the request was successful
        if (info.response.statusCode.toString().startsWith(SUCCESSFUL_RESPONSE_START_CHAR)) {
          this.notificationsService.success(null, this.translateService.get('handle-table.change-handle-prefix.notify.successful'));
          redirectBackWithPaginationOption(this.paginationService);
        } else {
          // write error in the notification
          // compose error message with message definition and server error
          this.showErrorNotification('handle-table.change-handle-prefix.notify.error',
            info?.response?.errorMessage);
        }
      });
  }

  /**
   * Show error notification with spexific message definition
   * @param messageKey from `en.json5`
   * @param reasonMessage reason
   */
  showErrorNotification(messageKey, reasonMessage = null) {
    let errorMessage;
    this.translateService.get(messageKey).pipe(
      take(1),
    ).subscribe(message => {
      errorMessage = message + (isNotEmpty(reasonMessage) ? ': ' + reasonMessage : '');
    });

    this.notificationsService.error(null, errorMessage);
  }
}
