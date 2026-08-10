import {
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import {
  of,
  throwError as observableThrowError,
} from 'rxjs';

import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { buildPaginatedList } from '../../core/data/paginated-list.model';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { PageInfo } from '../../core/shared/page-info.model';
import { SearchService } from '../../core/shared/search/search.service';
import { WorkflowItemDataService } from '../../core/submission/workflowitem-data.service';
import { WorkspaceitemDataService } from '../../core/submission/workspaceitem-data.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../../shared/remote-data.utils';
import { SearchObjects } from '../../shared/search/models/search-objects.model';
import { EPersonMock } from '../../shared/testing/eperson.mock';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { EPersonDeleteGuardService } from './eperson-delete-guard.service';

describe('EPersonDeleteGuardService', () => {
  let service: EPersonDeleteGuardService;
  let authorizationService: jasmine.SpyObj<AuthorizationDataService>;
  let workspaceItemDataService: jasmine.SpyObj<WorkspaceitemDataService>;
  let workflowItemDataService: jasmine.SpyObj<WorkflowItemDataService>;
  let searchService: jasmine.SpyObj<SearchService>;
  let notificationsService: NotificationsServiceStub;
  let translateService: jasmine.SpyObj<TranslateService>;

  const remoteList = (totalElements: number) => createSuccessfulRemoteDataObject$(
    buildPaginatedList(new PageInfo({ elementsPerPage: 1, totalElements, totalPages: 1, currentPage: 1 }), []),
  );
  const searchObjects = (totalElements: number) => createSuccessfulRemoteDataObject$(Object.assign(
    new SearchObjects<DSpaceObject>(),
    buildPaginatedList(new PageInfo({ elementsPerPage: 1, totalElements, totalPages: 1, currentPage: 1 }), []),
  ));

  beforeEach(() => {
    authorizationService = jasmine.createSpyObj('authorizationService', ['isAuthorized']);
    authorizationService.isAuthorized.and.returnValue(of(false));
    workspaceItemDataService = jasmine.createSpyObj('workspaceItemDataService', ['searchBy']);
    workspaceItemDataService.searchBy.and.returnValue(remoteList(0));
    workflowItemDataService = jasmine.createSpyObj('workflowItemDataService', ['searchBy']);
    workflowItemDataService.searchBy.and.returnValue(remoteList(0));
    searchService = jasmine.createSpyObj('searchService', ['search']);
    searchService.search.and.returnValue(searchObjects(0));
    notificationsService = new NotificationsServiceStub();
    translateService = jasmine.createSpyObj('translateService', ['get']);
    translateService.get.and.callFake((key: string) => of(key));

    TestBed.configureTestingModule({
      providers: [
        EPersonDeleteGuardService,
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: WorkspaceitemDataService, useValue: workspaceItemDataService },
        { provide: WorkflowItemDataService, useValue: workflowItemDataService },
        { provide: SearchService, useValue: searchService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: TranslateService, useValue: translateService },
      ],
    });
    service = TestBed.inject(EPersonDeleteGuardService);
  });

  describe('isCurrentUser', () => {
    it('is true only when the ids match', () => {
      expect(service.isCurrentUser(EPersonMock, EPersonMock.id)).toBeTrue();
      expect(service.isCurrentUser(EPersonMock, 'someone-else')).toBeFalse();
      expect(service.isCurrentUser(undefined, EPersonMock.id)).toBeFalsy();
    });
  });

  describe('getDeleteWarningLabel', () => {
    it('returns undefined when the user is neither a submitter nor an admin', fakeAsync(() => {
      let label: string | undefined = 'unset';
      service.getDeleteWarningLabel(EPersonMock).subscribe((value) => label = value);
      tick();
      expect(label).toBeUndefined();
    }));

    it('returns the submitter warning when the user has submitted items', fakeAsync(() => {
      workspaceItemDataService.searchBy.and.returnValue(remoteList(1));
      let label: string;
      service.getDeleteWarningLabel(EPersonMock).subscribe((value) => label = value);
      tick();
      expect(label).toBe('admin.access-control.epeople.delete.warning.submitter');
    }));

    it('returns the admin warning, querying the AdministratorOf feature for the target user', fakeAsync(() => {
      authorizationService.isAuthorized.and.returnValue(of(true));
      let label: string;
      service.getDeleteWarningLabel(EPersonMock).subscribe((value) => label = value);
      tick();
      expect(authorizationService.isAuthorized).toHaveBeenCalledWith(FeatureID.AdministratorOf, undefined, EPersonMock.id);
      expect(label).toBe('admin.access-control.epeople.delete.warning.admin');
    }));

    it('returns the combined warning when both apply', fakeAsync(() => {
      workspaceItemDataService.searchBy.and.returnValue(remoteList(1));
      authorizationService.isAuthorized.and.returnValue(of(true));
      let label: string;
      service.getDeleteWarningLabel(EPersonMock).subscribe((value) => label = value);
      tick();
      expect(label).toBe('admin.access-control.epeople.delete.warning.submitterAndAdmin');
    }));

    it('degrades each probe to false on error so a failed lookup never blocks the delete', fakeAsync(() => {
      workspaceItemDataService.searchBy.and.returnValue(observableThrowError(() => new Error('boom')));
      searchService.search.and.returnValue(observableThrowError(() => new Error('boom')));
      authorizationService.isAuthorized.and.returnValue(observableThrowError(() => new Error('boom')));
      let emitted = false;
      let label: string | undefined = 'unset';
      service.getDeleteWarningLabel(EPersonMock).subscribe((value) => {
        emitted = true;
        label = value;
      });
      tick();
      expect(emitted).toBeTrue();
      expect(label).toBeUndefined();
    }));
  });

  describe('isSelfDeletionError', () => {
    it('recognises the backend self-delete rejection', fakeAsync(() => {
      let rd;
      createFailedRemoteDataObject$('You, as admin user, cannot delete yourself', 400).subscribe((value) => rd = value);
      tick();
      expect(service.isSelfDeletionError(rd)).toBeTrue();
    }));

    it('ignores other failures', fakeAsync(() => {
      let rd;
      createFailedRemoteDataObject$('server error', 500).subscribe((value) => rd = value);
      tick();
      expect(service.isSelfDeletionError(rd)).toBeFalsy();
      expect(service.isSelfDeletionError(null)).toBeFalsy();
    }));
  });

  describe('showSelfDeleteNotification', () => {
    it('emits the self-delete error notification', () => {
      service.showSelfDeleteNotification();
      expect(notificationsService.error).toHaveBeenCalled();
      let translatedKey: string;
      notificationsService.error.calls.mostRecent().args[0].subscribe((value) => translatedKey = value);
      expect(translatedKey).toBe('admin.access-control.epeople.notification.deleted.forbidden.self');
    });
  });
});
