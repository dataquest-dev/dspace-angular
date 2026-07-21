import { CommonModule } from '@angular/common';
import {
  DebugElement,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  BrowserModule,
  By,
} from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  defer,
  Observable,
  of,
  throwError as observableThrowError,
} from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { FindListOptions } from '../../core/data/find-list-options.model';
import {
  buildPaginatedList,
  PaginatedList,
} from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { RequestService } from '../../core/data/request.service';
import { EPersonDataService } from '../../core/eperson/eperson-data.service';
import { EPerson } from '../../core/eperson/models/eperson.model';
import { PaginationService } from '../../core/pagination/pagination.service';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { PageInfo } from '../../core/shared/page-info.model';
import { SearchService } from '../../core/shared/search/search.service';
import { WorkflowItemDataService } from '../../core/submission/workflowitem-data.service';
import { WorkspaceitemDataService } from '../../core/submission/workspaceitem-data.service';
import { BtnDisabledDirective } from '../../shared/btn-disabled.directive';
import { FormBuilderService } from '../../shared/form/builder/form-builder.service';
import { ThemedLoadingComponent } from '../../shared/loading/themed-loading.component';
import { getMockFormBuilderService } from '../../shared/mocks/form-builder-service.mock';
import { RouterMock } from '../../shared/mocks/router.mock';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../../shared/remote-data.utils';
import { SearchObjects } from '../../shared/search/models/search-objects.model';
import {
  EPersonMock,
  EPersonMock2,
} from '../../shared/testing/eperson.mock';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { PaginationServiceStub } from '../../shared/testing/pagination-service.stub';
import { EPeopleRegistryComponent } from './epeople-registry.component';
import { EPersonFormComponent } from './eperson-form/eperson-form.component';

describe('EPeopleRegistryComponent', () => {
  let component: EPeopleRegistryComponent;
  let fixture: ComponentFixture<EPeopleRegistryComponent>;
  let builderService: FormBuilderService;

  let mockEPeople: EPerson[];
  let ePersonDataServiceStub: any;
  let authorizationService: AuthorizationDataService;
  let authService: jasmine.SpyObj<AuthService>;
  let workspaceItemDataService: jasmine.SpyObj<WorkspaceitemDataService>;
  let workflowItemDataService: jasmine.SpyObj<WorkflowItemDataService>;
  let searchService: jasmine.SpyObj<SearchService>;
  let notificationsService: NotificationsServiceStub;
  let modalService: NgbModal;
  let modalRef: any;
  let paginationService: PaginationServiceStub;

  const buildRemoteList = <T>(items: T[], totalElements = items.length) => createSuccessfulRemoteDataObject$(
    buildPaginatedList(new PageInfo({
      elementsPerPage: items.length || 1,
      totalElements,
      totalPages: 1,
      currentPage: 1,
    }), items),
  );

  const buildSearchObjects = (totalElements: number) => Object.assign(
    new SearchObjects<DSpaceObject>(),
    buildPaginatedList(new PageInfo({
      elementsPerPage: 1,
      totalElements,
      totalPages: 1,
      currentPage: 1,
    }), []),
  );

  beforeEach(waitForAsync(async () => {
    jasmine.getEnv().allowRespy(true);
    mockEPeople = [EPersonMock, EPersonMock2];
    ePersonDataServiceStub = {
      activeEPerson: null,
      allEpeople: mockEPeople,
      getEPeople(): Observable<RemoteData<PaginatedList<EPerson>>> {
        return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
          elementsPerPage: this.allEpeople.length,
          totalElements: this.allEpeople.length,
          totalPages: 1,
          currentPage: 1,
        }), this.allEpeople));
      },
      getActiveEPerson(): Observable<EPerson> {
        return of(this.activeEPerson);
      },
      searchByScope(scope: string, query: string, options: FindListOptions = {}): Observable<RemoteData<PaginatedList<EPerson>>> {
        if (scope === 'email') {
          const result = this.allEpeople.find((ePerson: EPerson) => {
            return ePerson.email === query;
          });
          return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
            elementsPerPage: [result].length,
            totalElements: [result].length,
            totalPages: 1,
            currentPage: 1,
          }), [result]));
        }
        if (scope === 'metadata') {
          if (query === '') {
            return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
              elementsPerPage: this.allEpeople.length,
              totalElements: this.allEpeople.length,
              totalPages: 1,
              currentPage: 1,
            }), this.allEpeople));
          }
          const result = this.allEpeople.find((ePerson: EPerson) => {
            return (ePerson.name.includes(query) || ePerson.email.includes(query));
          });
          return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
            elementsPerPage: [result].length,
            totalElements: [result].length,
            totalPages: 1,
            currentPage: 1,
          }), [result]));
        }
        return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
          elementsPerPage: this.allEpeople.length,
          totalElements: this.allEpeople.length,
          totalPages: 1,
          currentPage: 1,
        }), this.allEpeople));
      },
      deleteEPerson(ePerson: EPerson): Observable<boolean> {
        this.allEpeople = this.allEpeople.filter((ePerson2: EPerson) => {
          return (ePerson2.uuid !== ePerson.uuid);
        });
        return of(true);
      },
      editEPerson(ePerson: EPerson) {
        this.activeEPerson = ePerson;
      },
      cancelEditEPerson() {
        this.activeEPerson = null;
      },
      clearEPersonRequests(): void {
        // empty
      },
      getEPeoplePageRouterLink(): string {
        return '/access-control/epeople';
      },
    };
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: of(true),
    });
    authService = jasmine.createSpyObj('authService', ['getAuthenticatedUserFromStore']);
    authService.getAuthenticatedUserFromStore.and.returnValue(of(EPersonMock2));
    workspaceItemDataService = jasmine.createSpyObj('workspaceItemDataService', ['searchBy']);
    workspaceItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
    workflowItemDataService = jasmine.createSpyObj('workflowItemDataService', ['searchBy']);
    workflowItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
    searchService = jasmine.createSpyObj('searchService', ['search']);
    searchService.search.and.returnValue(createSuccessfulRemoteDataObject$(buildSearchObjects(0)));
    notificationsService = new NotificationsServiceStub();
    builderService = getMockFormBuilderService();

    paginationService = new PaginationServiceStub();
    TestBed.configureTestingModule({
      imports: [CommonModule, NgbModule, FormsModule, ReactiveFormsModule, BrowserModule, RouterTestingModule.withRoutes([]),
        TranslateModule.forRoot(), EPeopleRegistryComponent, BtnDisabledDirective],
      providers: [
        { provide: EPersonDataService, useValue: ePersonDataServiceStub },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: AuthService, useValue: authService },
        { provide: WorkspaceitemDataService, useValue: workspaceItemDataService },
        { provide: WorkflowItemDataService, useValue: workflowItemDataService },
        { provide: SearchService, useValue: searchService },
        { provide: FormBuilderService, useValue: builderService },
        { provide: Router, useValue: new RouterMock() },
        { provide: RequestService, useValue: jasmine.createSpyObj('requestService', ['setStaleByHrefSubstring']) },
        { provide: PaginationService, useValue: paginationService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(EPeopleRegistryComponent, {
        remove: {
          imports: [
            EPersonFormComponent,
            ThemedLoadingComponent,
            PaginationComponent,
          ],
        },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EPeopleRegistryComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgbModal);
    modalRef = Object.assign({ componentInstance: Object.assign({ response: of(true) }) });
    spyOn(modalService, 'open').and.returnValue(modalRef);
    fixture.detectChanges();
  });

  it('should create EPeopleRegistryComponent', () => {
    expect(component).toBeDefined();
  });

  it('should display list of ePeople', () => {
    const ePeopleIdsFound: DebugElement[] = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
    expect(ePeopleIdsFound.length).toEqual(2);
    mockEPeople.map((ePerson: EPerson) => {
      expect(ePeopleIdsFound.find((foundEl: DebugElement) => {
        return (foundEl.nativeElement.textContent.trim() === ePerson.uuid);
      })).toBeTruthy();
    });
  });

  describe('search', () => {
    describe('when searching with scope/query (scope metadata)', () => {
      let ePeopleIdsFound: DebugElement[];
      beforeEach(fakeAsync(() => {
        component.search({ scope: 'metadata', query: EPersonMock2.name });
        tick();
        fixture.detectChanges();
        ePeopleIdsFound = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
      }));

      it('should display search result', () => {
        expect(ePeopleIdsFound.length).toEqual(1);
        expect(ePeopleIdsFound.find((foundEl: DebugElement) => {
          return (foundEl.nativeElement.textContent.trim() === EPersonMock2.uuid);
        })).toBeTruthy();
      });
    });

    describe('when searching with scope/query (scope email)', () => {
      let ePeopleIdsFound: DebugElement[];
      beforeEach(fakeAsync(() => {
        component.search({ scope: 'email', query: EPersonMock.email });
        tick();
        fixture.detectChanges();
        ePeopleIdsFound = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
      }));

      it('should display search result', () => {
        expect(ePeopleIdsFound.length).toEqual(1);
        expect(ePeopleIdsFound.find((foundEl: DebugElement) => {
          return (foundEl.nativeElement.textContent.trim() === EPersonMock.uuid);
        })).toBeTruthy();
      });
    });
  });

  describe('deleteEPerson', () => {
    describe('when you click on first delete eperson button', () => {
      let ePeopleIdsFoundBeforeDelete;
      let ePeopleIdsFoundAfterDelete;
      beforeEach(fakeAsync(() => {
        ePeopleIdsFoundBeforeDelete = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
        const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
        deleteButtons[0].triggerEventHandler('click', {
          preventDefault: () => {/**/
          },
        });
        tick();
        fixture.detectChanges();
        ePeopleIdsFoundAfterDelete = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
      }));

      it('first ePerson is deleted', () => {
        expect(ePeopleIdsFoundBeforeDelete.length === ePeopleIdsFoundAfterDelete + 1);
        ePeopleIdsFoundAfterDelete.forEach((epersonElement) => {
          expect(epersonElement !== ePeopleIdsFoundBeforeDelete[0].nativeElement.textContent).toBeTrue();
        });
      });
    });

    it('should render the self delete button as disabled', () => {
      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));

      expect(deleteButtons.length).toBe(2);
      expect(deleteButtons[0].nativeElement.getAttribute('aria-disabled')).toBeNull();
      expect(deleteButtons[1].nativeElement.getAttribute('aria-disabled')).toBe('true');
      expect(deleteButtons[1].nativeElement.classList.contains('disabled')).toBeTrue();
    });

    it('should call submitter checks and compose the combined warning label', fakeAsync(() => {
      workspaceItemDataService.searchBy.and.returnValue(buildRemoteList([{} as any], 1));
      workflowItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
      searchService.search.and.returnValue(createSuccessfulRemoteDataObject$(buildSearchObjects(0)));
      // isAuthorized returns true by default -> the target is treated as an administrator
      modalRef.componentInstance.response = of(false);

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(workspaceItemDataService.searchBy).toHaveBeenCalledWith('findBySubmitter', jasmine.any(FindListOptions));
      expect(workflowItemDataService.searchBy).toHaveBeenCalledWith('findBySubmitter', jasmine.any(FindListOptions));
      expect(searchService.search).toHaveBeenCalled();
      expect(authorizationService.isAuthorized).toHaveBeenCalledWith(FeatureID.AdministratorOf, undefined, EPersonMock.id);
      expect(modalRef.componentInstance.warningLabel).toBe('admin.access-control.epeople.delete.warning.submitterAndAdmin');
    }));

    it('should detect administrator via the authorization feature', fakeAsync(() => {
      workspaceItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
      workflowItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
      searchService.search.and.returnValue(createSuccessfulRemoteDataObject$(buildSearchObjects(0)));
      // admin -> true, all submitter probes empty -> admin-only warning
      (authorizationService.isAuthorized as jasmine.Spy).and.callFake((featureId: FeatureID) => of(featureId === FeatureID.AdministratorOf));
      modalRef.componentInstance.response = of(false);

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(authorizationService.isAuthorized).toHaveBeenCalledWith(FeatureID.AdministratorOf, undefined, EPersonMock.id);
      expect(modalRef.componentInstance.warningLabel).toBe('admin.access-control.epeople.delete.warning.admin');
    }));

    it('should still open the delete modal when a submitter probe errors (centralised catchError)', fakeAsync(() => {
      workspaceItemDataService.searchBy.and.returnValue(observableThrowError(() => new Error('boom')));
      workflowItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
      searchService.search.and.returnValue(createSuccessfulRemoteDataObject$(buildSearchObjects(0)));
      // CanDelete stays true so the button renders; AdministratorOf false so the only warning could come from submitter probes
      (authorizationService.isAuthorized as jasmine.Spy).and.callFake((featureId: FeatureID) => of(featureId !== FeatureID.AdministratorOf));
      modalRef.componentInstance.response = of(false);

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(modalService.open).toHaveBeenCalled();
      expect(modalRef.componentInstance.warningLabel).toBeUndefined();
    }));

    it('should show a friendly self-delete notification on backend 400 self-delete errors', fakeAsync(() => {
      modalRef.componentInstance.response = of(true);
      ePersonDataServiceStub.deleteEPerson = jasmine.createSpy('deleteEPerson').and.returnValue(
        createFailedRemoteDataObject$('You, as admin user, cannot delete yourself', 400),
      );

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(notificationsService.error).toHaveBeenCalled();
      let translatedKey: string;
      notificationsService.error.calls.mostRecent().args[0].subscribe((value) => translatedKey = value);
      expect(translatedKey).toBe('admin.access-control.epeople.notification.deleted.forbidden.self');
    }));

    it('should use the deleted.failure key for generic delete failures', fakeAsync(() => {
      modalRef.componentInstance.response = of(true);
      ePersonDataServiceStub.deleteEPerson = jasmine.createSpy('deleteEPerson').and.returnValue(
        createFailedRemoteDataObject$('server error', 500),
      );

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(notificationsService.error).toHaveBeenCalled();
      let translatedKey: string;
      notificationsService.error.calls.mostRecent().args[0].subscribe((value) => translatedKey = value);
      expect(translatedKey).toBe('admin.access-control.epeople.notification.deleted.failure');
    }));

    it('should not open delete modal before authenticated user id is resolved', fakeAsync(() => {
      component.currentAuthenticatedUserId = undefined;
      const deleteSpy = spyOn(ePersonDataServiceStub, 'deleteEPerson').and.callThrough();

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(modalService.open).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    }));

    it('should still show the friendly self-delete notification if the authenticated user id resolves late and the backend rejection carries no usable message', fakeAsync(() => {
      modalRef.componentInstance.response = of(true);
      component.currentAuthenticatedUserId = EPersonMock.id;
      ePersonDataServiceStub.deleteEPerson = jasmine.createSpy('deleteEPerson').and.returnValue(defer(() => {
        component.currentAuthenticatedUserId = EPersonMock2.id;
        return createFailedRemoteDataObject$(undefined, 400);
      }));

      component.deleteEPerson(EPersonMock2);
      tick();

      expect(notificationsService.error).toHaveBeenCalled();
      let translatedKey: string;
      notificationsService.error.calls.mostRecent().args[0].subscribe((value) => translatedKey = value);
      expect(translatedKey).toBe('admin.access-control.epeople.notification.deleted.forbidden.self');
    }));
  });


  it('should hide delete EPerson button when the isAuthorized returns false', () => {
    spyOn(authorizationService, 'isAuthorized').and.returnValue(of(false));
    component.initialisePage();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#epeople tr td div button.delete-button'))).toBeNull();
  });
});
