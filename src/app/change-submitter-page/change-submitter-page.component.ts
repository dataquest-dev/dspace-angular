import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {WorkspaceItem} from '../core/submission/models/workspaceitem.model';
import {RequestParam} from '../core/cache/models/request-param.model';
import {getFirstSucceededRemoteListPayload} from '../core/shared/operators';
import {map} from 'rxjs/operators';
import {WorkspaceitemDataService} from '../core/submission/workspaceitem-data.service';
import {ActivatedRoute, Router} from '@angular/router';
import {followLink} from '../shared/utils/follow-link-config.model';

@Component({
  selector: 'ds-change-submitter-page',
  templateUrl: './change-submitter-page.component.html',
  styleUrls: ['./change-submitter-page.component.scss']
})
export class ChangeSubmitterPageComponent implements OnInit {

  constructor(private workspaceItemService: WorkspaceitemDataService,
              private route: ActivatedRoute,
              private router: Router) {}

  ngOnInit(): void {
    // Load `share_token` param value from the url
    let shareToken = this.route.snapshot.queryParams.share_token;
    this.findWorkspaceItemByShareToken(shareToken).subscribe((workspaceItem: WorkspaceItem) => {
      console.log('workspaceItem', workspaceItem);
    });
  }

  findWorkspaceItemByShareToken(shareToken: string): Observable<WorkspaceItem> {
    return this.workspaceItemService.searchBy('shareToken', {
      searchParams: [Object.assign(new RequestParam('shareToken', shareToken))]
    }, false, false, followLink('submitter'))
      .pipe(getFirstSucceededRemoteListPayload(),
        map((workspaceItems: WorkspaceItem[]) => workspaceItems?.[0]));
  }
}
