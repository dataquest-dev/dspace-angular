import { Router } from '@angular/router';
import { defer, Observable, of as observableOf, throwError as observableThrowError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, By } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { buildPaginatedList, PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { AuthService } from '../../core/auth/auth.service';
import { EPersonDataService } from '../../core/eperson/eperson-data.service';
import { EPerson } from '../../core/eperson/models/eperson.model';
import { PageInfo } from '../../core/shared/page-info.model';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { FormBuilderService } from '../../shared/form/builder/form-builder.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { EPeopleRegistryComponent } from './epeople-registry.component';
import { EPersonMock, EPersonMock2 } from '../../shared/testing/eperson.mock';
import { createFailedRemoteDataObject$, createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { getMockFormBuilderService } from '../../shared/mocks/form-builder-service.mock';
import { getMockTranslateService } from '../../shared/mocks/translate.service.mock';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { RouterStub } from '../../shared/testing/router.stub';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { EPersonDeleteGuardService } from './eperson-delete-guard.service';
import { RequestService } from '../../core/data/request.service';
import { PaginationService } from '../../core/pagination/pagination.service';
import { PaginationServiceStub } from '../../shared/testing/pagination-service.stub';
import { WorkspaceitemDataService } from '../../core/submission/workspaceitem-data.service';
import { WorkflowItemDataService } from '../../core/submission/workflowitem-data.service';
import { FindListOptions } from '../../core/data/find-list-options.model';
import { SearchService } from '../../core/shared/search/search.service';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { SearchObjects } from '../../shared/search/models/search-objects.model';
import { BtnDisabledDirective } from '../../shared/btn-disabled.directive';

describe('EPeopleRegistryComponent', () => {
  let component: EPeopleRegistryComponent;
  let fixture: ComponentFixture<EPeopleRegistryComponent>;
  let translateService: TranslateService;
  let builderService: FormBuilderService;

  let mockEPeople;
  let ePersonDataServiceStub: any;
  let authorizationService: AuthorizationDataService;
  let authService: jasmine.SpyObj<AuthService>;
  let workspaceItemDataService: jasmine.SpyObj<WorkspaceitemDataService>;
  let workflowItemDataService: jasmine.SpyObj<WorkflowItemDataService>;
  let searchService: jasmine.SpyObj<SearchService>;
  let notificationsService: NotificationsServiceStub;
  let modalService;
  let modalRef;

  let paginationService;

  const buildRemoteList = <T>(items: T[], totalElements = items.length) => createSuccessfulRemoteDataObject$(
    buildPaginatedList(new PageInfo({
      elementsPerPage: items.length || 1,
      totalElements,
      totalPages: 1,
      currentPage: 1
    }), items)
  );

  const buildSearchObjects = (totalElements: number) => Object.assign(
    new SearchObjects<DSpaceObject>(),
    buildPaginatedList(new PageInfo({
      elementsPerPage: 1,
      totalElements,
      totalPages: 1,
      currentPage: 1
    }), [])
  );

  beforeEach(waitForAsync(() => {
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
          currentPage: 1
        }), this.allEpeople));
      },
      getActiveEPerson(): Observable<EPerson> {
        return observableOf(this.activeEPerson);
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
            currentPage: 1
          }), [result]));
        }
        if (scope === 'metadata') {
          if (query === '') {
            return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
              elementsPerPage: this.allEpeople.length,
              totalElements: this.allEpeople.length,
              totalPages: 1,
              currentPage: 1
            }), this.allEpeople));
          }
          const result = this.allEpeople.find((ePerson: EPerson) => {
            return (ePerson.name.includes(query) || ePerson.email.includes(query));
          });
          return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
            elementsPerPage: [result].length,
            totalElements: [result].length,
            totalPages: 1,
            currentPage: 1
          }), [result]));
        }
        return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo({
          elementsPerPage: this.allEpeople.length,
          totalElements: this.allEpeople.length,
          totalPages: 1,
          currentPage: 1
        }), this.allEpeople));
      },
      deleteEPerson(ePerson: EPerson): Observable<boolean> {
        this.allEpeople = this.allEpeople.filter((ePerson2: EPerson) => {
          return (ePerson2.uuid !== ePerson.uuid);
            });
        return observableOf(true);
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
      }
    };
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: observableOf(true)
    });
    authService = jasmine.createSpyObj('authService', ['getAuthenticatedUserFromStore']);
    authService.getAuthenticatedUserFromStore.and.returnValue(observableOf(EPersonMock2));
    workspaceItemDataService = jasmine.createSpyObj('workspaceItemDataService', ['searchBy']);
    workspaceItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
    workflowItemDataService = jasmine.createSpyObj('workflowItemDataService', ['searchBy']);
    workflowItemDataService.searchBy.and.returnValue(buildRemoteList([], 0));
    searchService = jasmine.createSpyObj('searchService', ['search']);
    searchService.search.and.returnValue(createSuccessfulRemoteDataObject$(buildSearchObjects(0)));
    builderService = getMockFormBuilderService();
    translateService = getMockTranslateService();
    notificationsService = new NotificationsServiceStub();

    paginationService = new PaginationServiceStub();
    TestBed.configureTestingModule({
      imports: [CommonModule, NgbModule, FormsModule, ReactiveFormsModule, BrowserModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock
          }
        }),
      ],
      declarations: [EPeopleRegistryComponent, BtnDisabledDirective],
      providers: [
        { provide: EPersonDataService, useValue: ePersonDataServiceStub },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: AuthService, useValue: authService },
        { provide: FormBuilderService, useValue: builderService },
        { provide: WorkspaceitemDataService, useValue: workspaceItemDataService },
        { provide: WorkflowItemDataService, useValue: workflowItemDataService },
        { provide: SearchService, useValue: searchService },
        EPersonDeleteGuardService,
        { provide: Router, useValue: new RouterStub() },
        { provide: RequestService, useValue: jasmine.createSpyObj('requestService', ['removeByHrefSubstring']) },
        { provide: PaginationService, useValue: paginationService },
        { provide: DSONameService, useValue: jasmine.createSpyObj('dsoNameService', {
          getName: (dso: any) => dso?.name ?? dso?.email ?? dso?.id,
        }) },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EPeopleRegistryComponent);
    component = fixture.componentInstance;
    modalService = (component as any).modalService;
    modalRef = Object.assign({ componentInstance: Object.assign({ response: observableOf(true) }) });
    spyOn(modalService, 'open').and.returnValue(modalRef);
    fixture.detectChanges();
  });

  it('should create EPeopleRegistryComponent', () => {
    expect(component).toBeDefined();
  });

  it('should display list of ePeople', () => {
    const ePeopleIdsFound = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
    expect(ePeopleIdsFound.length).toEqual(2);
    mockEPeople.map((ePerson: EPerson) => {
      expect(ePeopleIdsFound.find((foundEl) => {
        return (foundEl.nativeElement.textContent.trim() === ePerson.uuid);
      })).toBeTruthy();
    });
  });

  describe('search', () => {
    describe('when searching with scope/query (scope metadata)', () => {
      let ePeopleIdsFound;
      beforeEach(fakeAsync(() => {
        component.search({ scope: 'metadata', query: EPersonMock2.name });
        tick();
        fixture.detectChanges();
        ePeopleIdsFound = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
      }));

      it('should display search result', () => {
        expect(ePeopleIdsFound.length).toEqual(1);
        expect(ePeopleIdsFound.find((foundEl) => {
          return (foundEl.nativeElement.textContent.trim() === EPersonMock2.uuid);
        })).toBeTruthy();
      });
    });

    describe('when searching with scope/query (scope email)', () => {
      let ePeopleIdsFound;
      beforeEach(fakeAsync(() => {
        component.search({ scope: 'email', query: EPersonMock.email });
        tick();
        fixture.detectChanges();
        ePeopleIdsFound = fixture.debugElement.queryAll(By.css('#epeople tr td:first-child'));
      }));

      it('should display search result', () => {
        expect(ePeopleIdsFound.length).toEqual(1);
        expect(ePeopleIdsFound.find((foundEl) => {
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
          }
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
      modalRef.componentInstance.response = observableOf(false);

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
      (authorizationService.isAuthorized as jasmine.Spy).and.callFake((featureId: FeatureID) => observableOf(featureId === FeatureID.AdministratorOf));
      modalRef.componentInstance.response = observableOf(false);

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
      (authorizationService.isAuthorized as jasmine.Spy).and.callFake((featureId: FeatureID) => observableOf(featureId !== FeatureID.AdministratorOf));
      modalRef.componentInstance.response = observableOf(false);

      const deleteButtons = fixture.debugElement.queryAll(By.css('.access-control-deleteEPersonButton'));
      deleteButtons[0].triggerEventHandler('click', null);
      tick();

      expect(modalService.open).toHaveBeenCalled();
      expect(modalRef.componentInstance.warningLabel).toBeUndefined();
    }));

    it('should show a friendly self-delete notification on backend 400 self-delete errors', fakeAsync(() => {
      modalRef.componentInstance.response = observableOf(true);
      ePersonDataServiceStub.deleteEPerson = jasmine.createSpy('deleteEPerson').and.returnValue(
        createFailedRemoteDataObject$('You, as admin user, cannot delete yourself', 400)
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
      modalRef.componentInstance.response = observableOf(true);
      ePersonDataServiceStub.deleteEPerson = jasmine.createSpy('deleteEPerson').and.returnValue(
        createFailedRemoteDataObject$('server error', 500)
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
      // Simulates the authenticated-user subscription resolving after the click (so the
      // pre-flight self-delete check is bypassed) combined with a backend response whose error
      // message can't be pattern-matched (e.g. Spring Boot's default message suppression).
      // The self-delete notification must still win over the generic failure one.
      modalRef.componentInstance.response = observableOf(true);
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

  describe('delete EPerson button when the isAuthorized returns false', () => {
    let ePeopleDeleteButton;
    beforeEach(() => {
      spyOn(authorizationService, 'isAuthorized').and.returnValue(observableOf(false));
      component.initialisePage();
      fixture.detectChanges();
    });

    it('should be hidden', () => {
      ePeopleDeleteButton = fixture.debugElement.queryAll(By.css('#epeople tr td div button.delete-button'));
      expect(ePeopleDeleteButton.length).toBe(0);
    });
  });
});
