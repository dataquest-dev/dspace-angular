import {
  AsyncPipe,
  KeyValuePipe,
  Location,
  NgTemplateOutlet,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  ActivatedRoute,
  Data,
  Router,
  RouterLink,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
} from 'rxjs';
import {
  filter,
  map,
  mergeMap,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';

import { LinkService } from '../../core/cache/builders/link.service';
import { NotifyInfoService } from '../../core/coar-notify/notify-info/notify-info.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { ItemDataService } from '../../core/data/item-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { LinkHeadService } from '../../core/services/link-head.service';
import { ServerResponseService } from '../../core/services/server-response.service';
import { Item } from '../../core/shared/item.model';
import { MetadataMap } from '../../core/shared/metadata.models';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { WorkflowItem } from '../../core/submission/models/workflowitem.model';
import { ClaimedTaskDataService } from '../../core/tasks/claimed-task-data.service';
import { ClaimedTask } from '../../core/tasks/models/claimed-task-object.model';
import { WorkflowAction } from '../../core/tasks/models/workflow-action-object.model';
import { fadeInOut } from '../../shared/animations/fade';
import { makeLinks } from '../../shared/clarin-shared-util';
import { DsoEditMenuComponent } from '../../shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { hasValue } from '../../shared/empty.util';
import { ErrorComponent } from '../../shared/error/error.component';
import { SEPARATOR } from '../../shared/form/builder/ds-dynamic-form-ui/models/ds-dynamic-complex.model';
import { ThemedLoadingComponent } from '../../shared/loading/themed-loading.component';
import { ClaimedTaskActionsComponent } from '../../shared/mydspace-actions/claimed-task/claimed-task-actions.component';
import { followLink } from '../../shared/utils/follow-link-config.model';
import { ReplacePipe } from '../../shared/utils/replace.pipe';
import { VarDirective } from '../../shared/utils/var.directive';
import { ThemedItemAlertsComponent } from '../alerts/themed-item-alerts.component';
import { ClarinFilesSectionComponent } from '../clarin-files-section/clarin-files-section.component';
import { ClarinRefBoxComponent } from '../clarin-ref-box/clarin-ref-box.component';
import { CollectionsComponent } from '../field-components/collections/collections.component';
import { ItemPageComponent } from '../simple/item-page.component';
import { ItemVersionsComponent } from '../versions/item-versions.component';
import { ItemVersionsNoticeComponent } from '../versions/notice/item-versions-notice.component';
import { ViewsDownloadsStatisticsButtonComponent } from '../views-downloads-statistics-button/views-downloads-statistics-button.component';

/**
 * This component renders a full item page.
 * The route parameter 'id' is used to request the item it represents.
 */

@Component({
  selector: 'ds-base-full-item-page',
  styleUrls: ['./full-item-page.component.scss'],
  templateUrl: './full-item-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut],
  imports: [
    AsyncPipe,
    ClaimedTaskActionsComponent,
    ClarinFilesSectionComponent,
    ClarinRefBoxComponent,
    CollectionsComponent,
    DsoEditMenuComponent,
    ErrorComponent,
    ItemVersionsComponent,
    ItemVersionsNoticeComponent,
    KeyValuePipe,
    NgTemplateOutlet,
    ReplacePipe,
    RouterLink,
    ThemedItemAlertsComponent,
    ThemedLoadingComponent,
    TranslateModule,
    VarDirective,
    ViewsDownloadsStatisticsButtonComponent,
  ],
})
export class FullItemPageComponent extends ItemPageComponent implements OnInit, OnDestroy {
  protected readonly makeLinks = makeLinks;
  protected readonly SEPARATOR = SEPARATOR;


  itemRD$: BehaviorSubject<RemoteData<Item>>;

  metadata$: Observable<MetadataMap>;

  /**
   * The workflow item this page was opened from, empty when it was not opened from a workflow task.
   */
  workflowItem: WorkflowItem;

  /**
   * The claimed task the workflow action bar acts on.
   */
  claimedTask$: Observable<RemoteData<ClaimedTask>>;

  public item$: BehaviorSubject<Item> = new BehaviorSubject<Item>(null);

  public workflowitem$: BehaviorSubject<WorkflowItem> = new BehaviorSubject<WorkflowItem>(null);

  /**
   * True when the itemRD has been originated from its workspaceite/workflowitem, false otherwise.
   */
  fromSubmissionObject = false;

  subs = [];

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected items: ItemDataService,
    protected authorizationService: AuthorizationDataService,
    protected _location: Location,
    protected responseService: ServerResponseService,
    protected signpostingDataService: SignpostingDataService,
    protected linkHeadService: LinkHeadService,
    protected notifyInfoService: NotifyInfoService,
    @Inject(PLATFORM_ID) protected platformId: string,
    protected claimedTaskService: ClaimedTaskDataService,
    protected linkService: LinkService,
  ) {
    super(route, router, items, authorizationService, responseService, signpostingDataService, linkHeadService, notifyInfoService, platformId);
  }

  /*** AoT inheritance fix, will hopefully be resolved in the near future **/
  ngOnInit(): void {
    super.ngOnInit();
    this.metadata$ = this.itemRD$.pipe(
      map((rd: RemoteData<Item>) => rd.payload),
      filter((item: Item) => hasValue(item)),
      map((item: Item) => item.metadata));

    this.subs.push(this.route.data.subscribe((data: Data) => {
      this.fromSubmissionObject = hasValue(data.wfi) || hasValue(data.wsi);

      if (hasValue(data.wfi)) {
        this.workflowItem = data.wfi.payload;
        this.claimedTask$ = this.itemRD$.pipe(
          filter((itemRD: RemoteData<Item>) => itemRD?.hasSucceeded && hasValue(itemRD.payload)),
          map((itemRD: RemoteData<Item>) => itemRD.payload.uuid),
          switchMap((itemUuid: string) => this.claimedTaskService.findByItem(itemUuid)),
          filter((claimedTaskRD: RemoteData<ClaimedTask>) => claimedTaskRD?.hasSucceeded && hasValue(claimedTaskRD?.payload)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
        this.subs.push(this.claimedTask$.subscribe((claimedTaskRD: RemoteData<ClaimedTask>) => {
          this.resolveClaimedTaskLinks(claimedTaskRD.payload);
        }));
      }
    }),
    );
  }

  /**
   * Resolve the links the workflow action bar needs, then publish the resolved workflowitem and
   * its item so the template can bind them.
   */
  protected resolveClaimedTaskLinks(claimedTask: ClaimedTask): void {
    this.linkService.resolveLinks(claimedTask,
      followLink('workflowitem', {},
        followLink('item', {}, followLink('bundles')),
        followLink('submitter'),
      ),
      followLink('action'),
    );

    if (claimedTask.action) {
      const sharedAction$ = (claimedTask.action as Observable<RemoteData<WorkflowAction>>).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      claimedTask.action = sharedAction$;
      this.subs.push(sharedAction$.subscribe());
    }

    if (claimedTask.workflowitem) {
      const sharedWorkflowitem$ = (claimedTask.workflowitem as Observable<RemoteData<WorkflowItem>>).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      claimedTask.workflowitem = sharedWorkflowitem$;

      this.subs.push(sharedWorkflowitem$.pipe(
        getFirstCompletedRemoteData(),
        tap((wfiRD: RemoteData<WorkflowItem>) => {
          if (wfiRD.hasSucceeded) {
            this.workflowitem$.next(wfiRD.payload);
          }
        }),
        mergeMap((wfiRD: RemoteData<WorkflowItem>) => {
          if (wfiRD.hasSucceeded && wfiRD.payload.item) {
            const sharedItem$ = (wfiRD.payload.item as Observable<RemoteData<Item>>).pipe(shareReplay({ bufferSize: 1, refCount: false }));
            wfiRD.payload.item = sharedItem$;
            return sharedItem$.pipe(getFirstCompletedRemoteData());
          } else {
            return EMPTY;
          }
        }),
        tap((itemRD: RemoteData<Item>) => {
          if (hasValue(itemRD) && itemRD.hasSucceeded) {
            this.item$.next(itemRD.payload);
          }
        }),
      ).subscribe());
    }
  }

  /**
   * Handle workflow action completion
   * @param reloadedObject The reloaded object after action completion
   */
  onWorkflowActionCompleted(reloadedObject: any) {
    if (reloadedObject) {
      void this.router.navigate(['/mydspace']);
    }
  }

  /**
   * Navigate back in browser history.
   */
  back() {
    this._location.back();
  }

  ngOnDestroy() {
    this.subs.filter((sub) => hasValue(sub)).forEach((sub) => sub.unsubscribe());
  }
}
