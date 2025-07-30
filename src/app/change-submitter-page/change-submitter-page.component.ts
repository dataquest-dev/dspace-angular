import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkspaceItem } from '../core/submission/models/workspaceitem.model';
import { RequestParam } from '../core/cache/models/request-param.model';
import {
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload,
  getFirstSucceededRemoteListPayload
} from '../core/shared/operators';
import { map } from 'rxjs/operators';
import { WorkspaceitemDataService } from '../core/submission/workspaceitem-data.service';
import { ActivatedRoute } from '@angular/router';
import { followLink } from '../shared/utils/follow-link-config.model';
import { EPerson } from '../core/eperson/models/eperson.model';
import { DSONameService } from '../core/breadcrumbs/dso-name.service';
import { isNullOrUndef } from 'chart.js/helpers';
import { HALEndpointService } from '../core/shared/hal-endpoint.service';
import { RemoteDataBuildService } from '../core/cache/builders/remote-data-build.service';
import { RequestService } from '../core/data/request.service';
import { GetRequest } from '../core/data/request.models';
import { RemoteData } from '../core/data/remote-data';
import { NotificationsService } from '../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpHeaders } from '@angular/common/http';
import { HttpOptions } from '../core/dspace-rest/dspace-rest.service';
import { Item } from '../core/shared/item.model';

@Component({
  selector: 'ds-change-submitter-page',
  templateUrl: './change-submitter-page.component.html',
  styleUrls: ['./change-submitter-page.component.scss']
})
export class ChangeSubmitterPageComponent implements OnInit {

  /**
   * Share token from the url. This token is used to retrieve the WorkspaceItem.
   */
  private shareToken = '';

  /**
   * WorkspaceItem id from the url.
   * This id is used to get authorization rights to call REST API to change the submitter.
   */
  private workspaceitemid = '';

  /**
   * BehaviorSubject that contains the submitter of the WorkspaceItem.
   */
  submitter: BehaviorSubject<EPerson> = new BehaviorSubject(null);

  /**
   * BehaviorSubject that contains the Item.
   */
  item: BehaviorSubject<Item> = new BehaviorSubject(null);

  /**
   * BehaviorSubject that contains the WorkspaceItem.
   */
  workspaceItem: BehaviorSubject<WorkspaceItem> = new BehaviorSubject(null);

  /**
   * Boolean that indicates if the spinner should be shown when the submitter is being changed.
   */
  changeSubmitterSpinner = false;

  constructor(private workspaceItemService: WorkspaceitemDataService,
              private route: ActivatedRoute,
              public dsoNameService: DSONameService,
              protected halService: HALEndpointService,
              protected rdbService: RemoteDataBuildService,
              protected requestService: RequestService,
              protected notificationsService: NotificationsService,
              protected translate: TranslateService) {}

  ngOnInit(): void {
    // Load `share_token` param value from the url
    this.shareToken = this.route.snapshot.queryParams.share_token;
    // Load `workspaceitem_id` param value from the url
    this.workspaceitemid = this.route.snapshot.queryParams.workspaceitemid;
    this.loadWorkspaceItemAndAssignSubmitter(this.shareToken);
  }

  /**
   * Load the WorkspaceItem using the shareToken and assign the submitter from the retrieved WorkspaceItem.
   */
  loadWorkspaceItemAndAssignSubmitter(shareToken: string) {
    this.findWorkspaceItemByShareToken(shareToken)?.subscribe((workspaceItem: WorkspaceItem) => {
      this.workspaceItem.next(workspaceItem);
      this.loadItemFromWorkspaceItem(workspaceItem);
      this.loadAndAssignSubmitter(workspaceItem);
    });
  }

  /**
   * Load the Item from the WorkspaceItem and assign it to the item BehaviorSubject.
   */
  loadItemFromWorkspaceItem(workspaceItem: WorkspaceItem) {
    if (workspaceItem.item instanceof Observable<Item>) {
      workspaceItem.item
        .pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((item: Item) => {
          this.item.next(item);
        });
    }
  }

  /**
   * Find a WorkspaceItem by its shareToken.
   */
  findWorkspaceItemByShareToken(shareToken: string): Observable<WorkspaceItem> {
    let requestHeaders = new HttpHeaders();
    const requestOptions: HttpOptions = Object.create({});
    requestHeaders = requestHeaders.append('shareToken', shareToken);
    requestOptions.headers = requestHeaders;

    return this.workspaceItemService.searchBy('shareToken', {
      searchParams: [Object.assign(new RequestParam('shareToken', shareToken))]
    }, false, false, followLink('item'), followLink('submitter')).pipe(getFirstSucceededRemoteListPayload(),
        map((workspaceItems: WorkspaceItem[]) => workspaceItems?.[0]));
  }

  /**
   * Load the submitter from the WorkspaceItem and assign it to the submitter BehaviorSubject.
   */
  loadAndAssignSubmitter(workspaceItem: WorkspaceItem) {
    if (isNullOrUndef(workspaceItem)) {
      console.error('Cannot load submitter because WorkspaceItem is null or undefined');
      return;
    }

    if (workspaceItem.submitter instanceof Observable<EPerson>) {
      workspaceItem.submitter
        .pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((submitter: any) => {
          this.assignSubmitter(submitter);
        });
    } else {
      this.assignSubmitter(workspaceItem.submitter);
    }
  }

  /**
   * Assign a new submitter to the submitter BehaviorSubject.
   */
  assignSubmitter(eperson: EPerson) {
    this.submitter.next(eperson);
  }

  /**
   * Get the name of the submitter or item using the DSONameService.
   */
  getName(object: EPerson | Item) {
    if (isNullOrUndef(object)) {
      return '';
    }
    return this.dsoNameService.getName(object);
  }

  /**
   * Change the submitter of the WorkspaceItem using the shareToken. This will send a GET request to the backend when
   * the submitter of the Item is changed.
   */
  changeSubmitter() {
    const requestId = this.requestService.generateRequestId();

    const url = this.halService.getRootHref() + '/submission/setOwner?shareToken=' + this.shareToken +
      '&workspaceitemid=' + this.workspaceitemid;

    const getRequest = new GetRequest(requestId, url);
    // Send GET request
    this.requestService.send(getRequest);
    this.changeSubmitterSpinner = true;
    // Get response
    const response = this.rdbService.buildFromRequestUUID(requestId);
    response.pipe(getFirstCompletedRemoteData()).subscribe((rd: RemoteData<WorkspaceItem>) => {
      if (rd.hasSucceeded) {
        this.notificationsService.success(
          this.translate.instant('change.submitter.page.changed-successfully'));
        // Update the submitter
        this.loadWorkspaceItemAndAssignSubmitter(this.shareToken);
      } else {
        this.notificationsService.error(
          this.translate.instant('change.submitter.page.changed-error'));
      }
      this.changeSubmitterSpinner = false;
    });
  }
}
