import { AsyncPipe } from '@angular/common';
import {
  Component,
  Injector,
  Input,
  OnInit,
} from '@angular/core';
import {
  Router,
  RouterLink,
} from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import { RemoteData } from '../../../core/data/remote-data';
import { RequestService } from '../../../core/data/request.service';
import { WorkflowActionDataService } from '../../../core/data/workflow-action-data.service';
import { Item } from '../../../core/shared/item.model';
import { SearchService } from '../../../core/shared/search/search.service';
import { WorkflowItem } from '../../../core/submission/models/workflowitem.model';
import { ClaimedTaskDataService } from '../../../core/tasks/claimed-task-data.service';
import { ClaimedTask } from '../../../core/tasks/models/claimed-task-object.model';
import { WorkflowAction } from '../../../core/tasks/models/workflow-action-object.model';
import { getWorkflowItemViewRoute } from '../../../workflowitems-edit-page/workflowitems-edit-page-routing-paths';
import { NotificationsService } from '../../notifications/notifications.service';
import { VarDirective } from '../../utils/var.directive';
import { MyDSpaceActionsComponent } from '../mydspace-actions';
import { ClaimedTaskActionsLoaderComponent } from './switcher/claimed-task-actions-loader.component';

/**
 * This component represents actions related to ClaimedTask object.
 */
@Component({
  selector: 'ds-claimed-task-actions',
  styleUrls: ['./claimed-task-actions.component.scss'],
  templateUrl: './claimed-task-actions.component.html',
  imports: [
    AsyncPipe,
    ClaimedTaskActionsLoaderComponent,
    NgbTooltip,
    RouterLink,
    TranslateModule,
    VarDirective,
  ],
})
export class ClaimedTaskActionsComponent extends MyDSpaceActionsComponent<ClaimedTask, ClaimedTaskDataService> implements OnInit {

  /**
   * The ClaimedTask object
   */
  @Input() object: ClaimedTask;

  /**
   * The item object that belonging to the ClaimedTask object
   */
  @Input() item: Item;

  /**
   * The workflowitem object that belonging to the ClaimedTask object
   */
  @Input() workflowitem: WorkflowItem;

  /**
   * Whether to show the view button (default: true)
   * Set to false when already on the view page
   */
  @Input() showViewButton = true;

  /**
   * The workflow action available for this task
   */
  public actionRD$: Observable<RemoteData<WorkflowAction>>;

  /**
   * Whether the current user may open the curation page, which only site administrators can
   */
  public canCurate$: Observable<boolean>;

  /**
   * Initialize instance variables
   *
   * @param {Injector} injector
   * @param {Router} router
   * @param {NotificationsService} notificationsService
   * @param {TranslateService} translate
   * @param {SearchService} searchService
   * @param {RequestService} requestService
   * @param workflowActionService
   * @param authorizationService
   */
  constructor(protected injector: Injector,
    protected router: Router,
    protected notificationsService: NotificationsService,
    protected translate: TranslateService,
    protected searchService: SearchService,
    protected requestService: RequestService,
    protected workflowActionService: WorkflowActionDataService,
    protected authorizationService: AuthorizationDataService,
  ) {
    super(ClaimedTask.type, injector, router, notificationsService, translate, searchService, requestService);
  }

  /**
   * Initialize objects
   */
  ngOnInit() {
    this.initObjects(this.object);
    this.initAction(this.object);
    this.canCurate$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
  }

  /**
   * Init the ClaimedTask and WorkflowItem objects
   *
   * @param {PoolTask} object
   */
  initObjects(object: ClaimedTask) {
    this.object = object;
  }

  /**
   * Init the WorkflowAction
   *
   * @param object
   */
  initAction(object: ClaimedTask) {
    this.actionRD$ = object.action;
  }

  /**
   * Get the workflowitem view route.
   */
  getWorkflowItemViewRoute(workflowitem: WorkflowItem): string {
    return getWorkflowItemViewRoute(workflowitem?.id);
  }

  /**
   * Get the workflowitem curate route.
   */
  getWorkflowItemCurationRoute(): string {
    return '/admin/curation-tasks';
  }

}
