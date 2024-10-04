import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceItem } from '../../core/submission/models/workspaceitem.model';
import { WorkspaceitemDataService } from '../../core/submission/workspaceitem-data.service';
import { RequestParam } from '../../core/cache/models/request-param.model';
import { map } from 'rxjs/operators';
import { getFirstSucceededRemoteListPayload } from '../../core/shared/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ds-share-submission-page',
  templateUrl: './share-submission-page.component.html',
  styleUrls: ['./share-submission-page.component.scss']
})
export class ShareSubmissionPageComponent {

  changeSubmitterLink: string;

  constructor(private workspaceItemService: WorkspaceitemDataService,
              private route: ActivatedRoute,
              private router: Router) {}

  ngOnInit(): void {
    // Load `share-token` param value from the url
    this.changeSubmitterLink = this.route.snapshot.queryParams.changeSubmitterLink;
  }
  //
  // findWorkspaceItemById(id: number) {
  //
  // }
}
