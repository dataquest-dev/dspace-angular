import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequestParam } from '../../core/cache/models/request-param.model';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { FindListOptions } from '../../core/data/find-list-options.model';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { EPerson } from '../../core/eperson/models/eperson.model';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { NoContent } from '../../core/shared/NoContent.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { SearchService } from '../../core/shared/search/search.service';
import { WorkflowItemDataService } from '../../core/submission/workflowitem-data.service';
import { WorkspaceitemDataService } from '../../core/submission/workspaceitem-data.service';
import { hasValue } from '../../shared/empty.util';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { PaginationComponentOptions } from '../../shared/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../shared/search/models/paginated-search-options.model';
import { SearchObjects } from '../../shared/search/models/search-objects.model';

/**
 * Translation key for the notification shown when an admin tries to delete their own account.
 * Exported so the templates can bind it as the disabled-delete-button tooltip.
 */
export const SELF_DELETE_WARNING_LABEL = 'admin.access-control.epeople.notification.deleted.forbidden.self';

const WARNING_LABEL_PREFIX = 'admin.access-control.epeople.delete.warning.';

/**
 * Shared logic for the EPerson delete flow used by both the EPeople registry and the EPerson form.
 * Determines a contextual warning for high-impact deletes, recognises the backend self-delete error
 * and surfaces the self-delete notification. Centralised here so both call sites stay in sync
 * (the previous per-component copies had already diverged in their error handling).
 */
@Injectable()
export class EPersonDeleteGuardService {

  constructor(
    private authorizationService: AuthorizationDataService,
    private workspaceItemDataService: WorkspaceitemDataService,
    private workflowItemDataService: WorkflowItemDataService,
    private searchService: SearchService,
    private notificationsService: NotificationsService,
    private translateService: TranslateService,
  ) {
  }

  /**
   * Whether the given EPerson is the currently authenticated user.
   */
  isCurrentUser(ePerson: EPerson, currentAuthenticatedUserId: string): boolean {
    return hasValue(ePerson?.id) && ePerson.id === currentAuthenticatedUserId;
  }

  /**
   * Resolve the contextual warning translation key for deleting the given EPerson,
   * or undefined when there is nothing noteworthy to warn about.
   * Warns when the user has submitted items, is an administrator, or both.
   */
  getDeleteWarningLabel(ePerson: EPerson): Observable<string | undefined> {
    return combineLatest([
      this.hasSubmittedItems(ePerson.id),
      this.isAdministrator(ePerson),
    ]).pipe(
      map(([hasSubmittedItems, isAdmin]: [boolean, boolean]) => {
        if (hasSubmittedItems && isAdmin) {
          return WARNING_LABEL_PREFIX + 'submitterAndAdmin';
        }
        if (hasSubmittedItems) {
          return WARNING_LABEL_PREFIX + 'submitter';
        }
        if (isAdmin) {
          return WARNING_LABEL_PREFIX + 'admin';
        }
        return undefined;
      })
    );
  }

  /**
   * Whether the backend rejected the delete because an admin tried to delete themselves.
   * Best-effort only: Spring Boot omits the exception message from the response body by
   * default, so callers should treat this as a fallback alongside a client-side identity
   * check rather than the sole signal.
   */
  isSelfDeletionError(restResponse: RemoteData<NoContent> | null): boolean {
    return restResponse?.statusCode === 400 && restResponse?.errorMessage?.toLowerCase().includes('cannot delete yourself');
  }

  /**
   * Show the "you cannot delete your own account" error notification.
   */
  showSelfDeleteNotification(): void {
    this.notificationsService.error(this.translateService.get(SELF_DELETE_WARNING_LABEL));
  }

  /**
   * Whether the EPerson is the submitter of any workspace, workflow or archived item.
   * Each lookup degrades to `false` on error so a failed probe never blocks the delete.
   */
  private hasSubmittedItems(epersonId: string): Observable<boolean> {
    const submitterSearchOptions = Object.assign(new FindListOptions(), {
      currentPage: 1,
      elementsPerPage: 1,
      searchParams: [new RequestParam('uuid', epersonId)],
    });
    const archivedSearchOptions = new PaginatedSearchOptions({
      query: `submitter_authority:"${epersonId}"`,
      pagination: Object.assign(new PaginationComponentOptions(), {
        currentPage: 1,
        pageSize: 1,
      }),
    });

    return combineLatest([
      this.workspaceItemDataService.searchBy('findBySubmitter', submitterSearchOptions).pipe(
        getFirstCompletedRemoteData(),
        map((rd: RemoteData<PaginatedList<any>>) => rd.hasSucceeded && rd.payload.totalElements > 0),
        catchError(() => observableOf(false)),
      ),
      this.workflowItemDataService.searchBy('findBySubmitter', submitterSearchOptions).pipe(
        getFirstCompletedRemoteData(),
        map((rd: RemoteData<PaginatedList<any>>) => rd.hasSucceeded && rd.payload.totalElements > 0),
        catchError(() => observableOf(false)),
      ),
      this.searchService.search<DSpaceObject>(archivedSearchOptions).pipe(
        getFirstCompletedRemoteData(),
        map((rd: RemoteData<SearchObjects<DSpaceObject>>) => rd.hasSucceeded && rd.payload.totalElements > 0),
        catchError(() => observableOf(false)),
      ),
    ]).pipe(
      map((results: boolean[]) => results.some(Boolean)),
    );
  }

  /**
   * Whether the EPerson is a site administrator, via the authorization feature
   * (catches indirect admin rights and avoids matching on a hard-coded group name).
   */
  private isAdministrator(ePerson: EPerson): Observable<boolean> {
    return this.authorizationService.isAuthorized(FeatureID.AdministratorOf, undefined, ePerson?.id).pipe(
      catchError(() => observableOf(false)),
    );
  }
}
