import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'ds-edit-handle-page',
  templateUrl: './edit-handle-page.component.html',
  styleUrls: ['./edit-handle-page.component.scss']
})
export class EditHandlePageComponent implements OnInit {

  handle: string;

  url: string;

  archive = false;

  constructor(private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    this.handle = this.route.snapshot.queryParams.handle;
    this.url = this.route.snapshot.queryParams.url;
  }

  onClickSubmit(value) {
    // edit handlegn
    console.log('submit', value);
  }

}
