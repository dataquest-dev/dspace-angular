import { Component, OnInit } from '@angular/core';
import {Operation} from 'fast-json-patch';
import {PatchRequest} from '../../core/data/request.models';
import {RequestService} from '../../core/data/request.service';
import {map, take} from 'rxjs/operators';
import {HandleDataService} from '../../core/data/handle-data.service';
import {HALEndpointService} from '../../core/shared/hal-endpoint.service';
import {connectableObservableDescriptor} from 'rxjs/internal/observable/ConnectableObservable';
import {DEFAULT_HANDLE_ID} from '../handle-table/handle-table.component';
import {isNotEmpty} from '../../shared/empty.util';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';



@Component({
  selector: 'ds-change-handle-prefix-page',
  templateUrl: './change-handle-prefix-page.component.html',
  styleUrls: ['./change-handle-prefix-page.component.scss']
})
export class ChangeHandlePrefixPageComponent implements OnInit {

  constructor(
    private notificationsService: NotificationsService,
    private requestService: RequestService,
    private translateService: TranslateService,
    private handleDataService: HandleDataService,
    private halService: HALEndpointService,
    private fb: FormBuilder
  ) { }


  changePrefix: FormGroup;

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.changePrefix = this.fb.group({
      oldPrefix: ['', Validators.required ],
      newPrefix: ['', Validators.required ],
      archive: new FormControl(false)
    });
  }

  onClickSubmit(handlePrefixConfig) {
    // Show validation errors after submit
    this.changePrefix.markAllAsTouched();

    if (!this.changePrefix.valid) {
      return;
    }

    const patchOperation = {
      op: 'replace', path: '/setPrefix', value: handlePrefixConfig
    } as Operation;

    let handleHref = '';
    // load handles endpoint
    this.halService.getEndpoint(this.handleDataService.getLinkPath()).pipe(
      take(1)
    ).subscribe( endpoint => {
      handleHref = endpoint;
    });

    const requestId = this.requestService.generateRequestId();
    const patchRequest = new PatchRequest(requestId, handleHref + '/' + DEFAULT_HANDLE_ID, [patchOperation]);
    // call patch request
    this.requestService.send(patchRequest);

    // check response
    this.requestService.getByUUID(requestId)
      .subscribe(info => {
        // if is empty
        if (!isNotEmpty(info) || !isNotEmpty(info.response) || !isNotEmpty(info.response.statusCode)) {
          // do nothing - in another subscription should be data
          return;
        }

        // if the status code starts with 2 - the request was successful
        if (info.response.statusCode.toString().startsWith('2')) {
          this.notificationsService.success(null, this.translateService.get('handle-table.change-handle-prefix.notify.successful'));
        } else {
          // write error in the notification
          // compose error message with message definition and server error
          let errorMessage = '';
          this.translateService.get('handle-table.change-handle-prefix.notify.error').pipe(
            take(1)
          ).subscribe( message => {
            errorMessage = message + ': ' + info.response.errorMessage;
          });

          this.notificationsService.error(null, errorMessage);
        }
      });
  }
}
