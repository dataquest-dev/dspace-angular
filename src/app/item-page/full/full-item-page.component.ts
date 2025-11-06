import { filter, map, switchMap, shareReplay, tap, mergeMap } from 'rxjs/operators';
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';

import { ItemPageComponent } from '../simple/item-page.component';
import { MetadataMap } from '../../core/shared/metadata.models';
import { ItemDataService } from '../../core/data/item-data.service';

import { RemoteData } from '../../core/data/remote-data';
import { Item } from '../../core/shared/item.model';

import { fadeInOut } from '../../shared/animations/fade';
import { hasValue } from '../../shared/empty.util';
import { Location } from '@angular/common';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { ServerResponseService } from '../../core/services/server-response.service';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { LinkHeadService } from '../../core/services/link-head.service';
import { RegistryService } from 'src/app/core/registry/registry.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { makeLinks } from '../../shared/clarin-shared-util';
import { SEPARATOR } from 'src/app/shared/form/builder/ds-dynamic-form-ui/models/ds-dynamic-complex.model';
import { WorkflowItem } from 'src/app/core/submission/models/workflowitem.model';
import { ClaimedTask } from 'src/app/core/tasks/models/claimed-task-object.model';
import { ClaimedTaskDataService } from 'src/app/core/tasks/claimed-task-data.service';
import { LinkService } from '../../core/cache/builders/link.service';
import { followLink } from '../../shared/utils/follow-link-config.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { EMPTY } from 'rxjs';
import { WorkflowAction } from 'src/app/core/tasks/models/workflow-action-object.model';

/**
 * This component renders a full item page.
 * The route parameter 'id' is used to request the item it represents.
 */

@Component({
  selector: 'ds-full-item-page',
  styleUrls: ['./full-item-page.component.scss'],
  templateUrl: './full-item-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut]
})
export class FullItemPageComponent extends ItemPageComponent implements OnInit, OnDestroy {
  protected readonly makeLinks = makeLinks;
  protected readonly SEPARATOR = SEPARATOR;

  itemRD$: BehaviorSubject<RemoteData<Item>>;
  workflowItem: WorkflowItem;
  claimedTask$: Observable<RemoteData<ClaimedTask>>;
  public item$: BehaviorSubject<Item> = new BehaviorSubject<Item>(null);
  public workflowitem$: BehaviorSubject<WorkflowItem> = new BehaviorSubject<WorkflowItem>(null);

  metadata$: Observable<MetadataMap>;

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
    @Inject(PLATFORM_ID) protected platformId: string,
    protected halService: HALEndpointService,
    protected registryService: RegistryService,
    protected claimedTaskService: ClaimedTaskDataService,
    protected linkService: LinkService
  ) {
    super(route, router, items, authorizationService, responseService, signpostingDataService, linkHeadService, platformId, registryService, halService);
  }

  /*** AoT inheritance fix, will hopefully be resolved in the near future **/
  ngOnInit(): void {
    super.ngOnInit();
    this.metadata$ = this.itemRD$.pipe(
      map((rd: RemoteData<Item>) => rd.payload),
      filter((item: Item) => hasValue(item)),
      map((item: Item) => item.metadata),);

    this.subs.push(this.route.data.subscribe((data: Data) => {
        this.fromSubmissionObject = hasValue(data.wfi) || hasValue(data.wsi);

        if (hasValue(data.wfi)) {
          this.workflowItem = data.wfi.payload;
          this.claimedTask$ = this.itemRD$.pipe(
            filter((itemRD: RemoteData<Item>) => itemRD?.hasSucceeded && hasValue(itemRD.payload)),
            map((itemRD: RemoteData<Item>) => itemRD.payload.uuid),
            switchMap((itemUuid: string) => {
              return this.claimedTaskService.findByItem(itemUuid);
            }),
            filter((claimedTaskRD: RemoteData<ClaimedTask>) => {
              return claimedTaskRD?.hasSucceeded && hasValue(claimedTaskRD?.payload);
            }),
            shareReplay(1)
          );
          this.subs.push(this.claimedTask$.subscribe((claimedTaskRD: RemoteData<ClaimedTask>) => {
            if (claimedTaskRD?.hasSucceeded && claimedTaskRD.payload) {
              const claimedTask = claimedTaskRD.payload;
              this.linkService.resolveLinks(claimedTask,
                followLink('workflowitem', {},
                  followLink('item', {}, followLink('bundles')),
                  followLink('submitter')
                ),
                followLink('action')
              );

              if (claimedTask.action) {
                const sharedAction$ = (claimedTask.action as Observable<RemoteData<WorkflowAction>>).pipe(
                  shareReplay(1)
                );
                claimedTask.action = sharedAction$;
                this.subs.push(sharedAction$.subscribe());
              }

              if (claimedTask.workflowitem) {
                const sharedWorkflowitem$ = (claimedTask.workflowitem as Observable<RemoteData<WorkflowItem>>).pipe(
                  shareReplay(1)
                );

                claimedTask.workflowitem = sharedWorkflowitem$;

                this.subs.push(
                  sharedWorkflowitem$.pipe(
                    getFirstCompletedRemoteData(),
                    tap((wfiRD: RemoteData<WorkflowItem>) => {
                      if (wfiRD.hasSucceeded) {
                        this.workflowitem$.next(wfiRD.payload);
                      }
                    }),
                    mergeMap((wfiRD: RemoteData<WorkflowItem>) => {
                      if (wfiRD.hasSucceeded && wfiRD.payload.item) {
                        const sharedItem$ = (wfiRD.payload.item as Observable<RemoteData<Item>>).pipe(
                          shareReplay(1)
                        );
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
                    })
                  ).subscribe()
                );
              }
            }
          }));
        }
      })
    );
  }

  /**
   * Handle workflow action completion
   * @param reloadedObject The reloaded object after action completion
   */
  onWorkflowActionCompleted(reloadedObject: any) {
    if (reloadedObject) {
      this.router.navigate(['/mydspace']);
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
