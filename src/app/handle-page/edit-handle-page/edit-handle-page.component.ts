import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Operation} from 'fast-json-patch';
import {RequestService} from '../../core/data/request.service';
import {Handle} from '../../core/handle/handle.model';
import {PatchRequest} from '../../core/data/request.models';

@Component({
  selector: 'ds-edit-handle-page',
  templateUrl: './edit-handle-page.component.html',
  styleUrls: ['./edit-handle-page.component.scss']
})
export class EditHandlePageComponent implements OnInit {

  id: number;

  handle: string;

  url: string;

  _selflink: string;

  archive = false;

  constructor(private route: ActivatedRoute,
              private requestService: RequestService) {
  }

  ngOnInit(): void {
    // load handle attributes from the url params
    this.handle = this.route.snapshot.queryParams.handle;
    this.url = this.route.snapshot.queryParams.url;
    this.id = this.route.snapshot.queryParams.id;
    this._selflink = this.route.snapshot.queryParams._selflink;
  }

  onClickSubmit(value) {
    // edit handle

    // create a Handle object with updated body
    // @TODO add URL to the Handle object
    // url:
    const handleObj = Object.assign(new Handle(), {
      handle: this.handle,
      _links: {
        self: { href: this._selflink }
      }
    });

    const patchOperation = {
      op: 'replace', path: '/replaceHandle', value: handleObj
    } as Operation;

    const requestId = this.requestService.generateRequestId();
    const patchRequest = new PatchRequest(requestId, this._selflink, [patchOperation]);
    // call patch request
    return this.requestService.send(patchRequest);

  }

}
