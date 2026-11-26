import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

import { RemoteData } from '../core/data/remote-data';
import { getFirstCompletedRemoteData } from '../core/shared/operators';
import { WorkflowItem } from '../core/submission/models/workflowitem.model';
import { SUBMISSION_LINKS_TO_FOLLOW } from '../core/submission/resolver/submission-links-to-follow';
import { WorkflowItemDataService } from '../core/submission/workflowitem-data.service';

export const workflowItemPageResolver: ResolveFn<RemoteData<WorkflowItem>> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  workflowItemService: WorkflowItemDataService = inject(WorkflowItemDataService),
): Observable<RemoteData<WorkflowItem>> => {
  // No cached copy: the edit form must not start while a GET for this item is still running,
  // or the form takes that response, which has no embedded collection, and stays on "Loading".
  return workflowItemService.findById(
    route.params.id,
    false,
    false,
    ...SUBMISSION_LINKS_TO_FOLLOW,
  ).pipe(
    getFirstCompletedRemoteData(),
  );
};
