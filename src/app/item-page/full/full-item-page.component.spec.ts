import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { ItemDataService } from '../../core/data/item-data.service';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { TruncatePipe } from '../../shared/utils/truncate.pipe';
import { FullItemPageComponent } from './full-item-page.component';
import { MetadataService } from '../../core/metadata/metadata.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivatedRouteStub } from '../../shared/testing/active-router.stub';
import { VarDirective } from '../../shared/utils/var.directive';
import { RouterTestingModule } from '@angular/router/testing';
import { Item } from '../../core/shared/item.model';
import { BehaviorSubject, of, of as observableOf } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { createFailedRemoteDataObject, createSuccessfulRemoteDataObject, createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { createRelationshipsObservable } from '../simple/item-types/shared/item.component.spec';
import { RemoteData } from '../../core/data/remote-data';
import { ServerResponseService } from '../../core/services/server-response.service';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { LinkHeadService } from '../../core/services/link-head.service';
import { RegistryService } from 'src/app/core/registry/registry.service';
import { provideMockStore } from '@ngrx/store/testing';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { MetadataFieldDataService } from 'src/app/core/data/metadata-field-data.service';
import { MetadataSchemaDataService } from 'src/app/core/data/metadata-schema-data.service';
import { MetadataBitstreamDataService } from 'src/app/core/data/metadata-bitstream-data.service';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { cold } from 'jasmine-marbles';
import { ReplacePipe } from '../../shared/utils/replace.pipe';
import { WorkflowItem } from 'src/app/core/submission/models/workflowitem.model';
import { WorkflowAction } from 'src/app/core/tasks/models/workflow-action-object.model';
import { ClaimedTask } from 'src/app/core/tasks/models/claimed-task-object.model';
import { ClaimedTaskDataService } from 'src/app/core/tasks/claimed-task-data.service';
import { LinkService } from 'src/app/core/cache/builders/link.service';
import { getMockLinkService } from 'src/app/shared/mocks/link-service.mock';

const mockItem: Item = Object.assign(new Item(), {
  uuid: 'test-item-uuid',
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'test item'
      }
    ]
  }
});

const mockWithdrawnItem: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: [],
  relationships: createRelationshipsObservable(),
  isWithdrawn: true
});

const mockWorkflowItem: WorkflowItem = Object.assign(new WorkflowItem(), {
  id: 'workflow-item-1',
  uuid: 'workflow-uuid-1',
  item: observableOf(createSuccessfulRemoteDataObject(mockItem))
});

const mockWorkflowAction: WorkflowAction = Object.assign(new WorkflowAction(), {
  id: 'action-1',
  options: ['submit_approve', 'submit_reject', 'submit_edit_metadata', 'return_to_pool']
});

const mockClaimedTask: ClaimedTask = Object.assign(new ClaimedTask(), {
  id: 'claimed-task-1',
  workflowitem: observableOf(createSuccessfulRemoteDataObject(mockWorkflowItem)),
  action: observableOf(createSuccessfulRemoteDataObject(mockWorkflowAction)),
  _links: {
    workflowitem: { href: 'https://rest.api/workflowitems/workflow-item-1' }
  }
});

const metadataServiceStub = {
  /* eslint-disable no-empty,@typescript-eslint/no-empty-function */
  processRemoteData: () => {
  }
  /* eslint-enable no-empty, @typescript-eslint/no-empty-function */
};

describe('FullItemPageComponent', () => {
  let comp: FullItemPageComponent;
  let fixture: ComponentFixture<FullItemPageComponent>;
  let registryService: RegistryService;
  let translateService: TranslateService;
  let routeStub: ActivatedRouteStub;
  let routeData;
  let authorizationDataService: AuthorizationDataService;
  let serverResponseService: jasmine.SpyObj<ServerResponseService>;
  let signpostingDataService: jasmine.SpyObj<SignpostingDataService>;
  let linkHeadService: jasmine.SpyObj<LinkHeadService>;
  let claimedTaskService: ClaimedTaskDataService;
  let linkService: LinkService;
  let router: Router;

  const mocklink = {
    href: 'http://test.org',
    rel: 'test',
    type: 'test'
  };

  const mocklink2 = {
    href: 'http://test2.org',
    rel: 'test',
    type: 'test'
  };

  beforeEach(waitForAsync(() => {
    routeData = {
      dso: createSuccessfulRemoteDataObject(mockItem),
    };

    routeStub = Object.assign(new ActivatedRouteStub(), {
      data: observableOf(routeData)
    });

    authorizationDataService = jasmine.createSpyObj('authorizationDataService', {
      isAuthorized: observableOf(false),
    });

    serverResponseService = jasmine.createSpyObj('ServerResponseService', {
      setHeader: jasmine.createSpy('setHeader'),
    });

    signpostingDataService = jasmine.createSpyObj('SignpostingDataService', {
      getLinks: observableOf([mocklink, mocklink2]),
    });

    linkHeadService = jasmine.createSpyObj('LinkHeadService', {
      addTag: jasmine.createSpy('setHeader'),
      removeTag: jasmine.createSpy('removeTag'),
    });

    claimedTaskService = jasmine.createSpyObj('claimedTaskService', {
      findByItem: observableOf(createSuccessfulRemoteDataObject(mockClaimedTask))
    });

    linkService = getMockLinkService();

    router = jasmine.createSpyObj('router', {
      navigate: null,
      createUrlTree: {},
      serializeUrl: '/testing-url'
    }, {
      events: observableOf({}),
      url: ''
    });
    const mockMetadataBitstreamDataService = {
      searchByHandleParams: () => of({}) // Returns a mock Observable
    };

    const configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'test',
        values: [
          'org.dspace.ctask.general.ProfileFormats = test'
        ]
      }))
    });

    let halService: HALEndpointService;
    halService = jasmine.createSpyObj('halService', {
      'getEndpoint': cold('a', { a: 'endpointURL' })
    });


    translateService = getMockTranslateService();

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock
        }
      }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule],
      declarations: [FullItemPageComponent, TruncatePipe, VarDirective, ReplacePipe],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: ItemDataService, useValue: {} },
        { provide: MetadataService, useValue: metadataServiceStub },
        { provide: AuthorizationDataService, useValue: authorizationDataService },
        { provide: ServerResponseService, useValue: serverResponseService },
        { provide: SignpostingDataService, useValue: signpostingDataService },
        { provide: LinkHeadService, useValue: linkHeadService },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: MetadataBitstreamDataService, useValue: mockMetadataBitstreamDataService },
        provideMockStore({ initialState: { core: { auth: { loading: false } } } }),
        { provide: NotificationsService, useValue: {} },
        { provide: MetadataSchemaDataService, useValue: {} },
        { provide: MetadataFieldDataService, useValue: {} },
        { provide: HALEndpointService, useValue: halService },
        { provide: ClaimedTaskDataService, useValue: claimedTaskService },
        { provide: LinkService, useValue: linkService },
        { provide: Router, useValue: router },
        RegistryService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(FullItemPageComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    registryService = TestBed.inject(RegistryService);
    fixture = TestBed.createComponent(FullItemPageComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.debugElement.nativeElement.remove();
  });

  it('should display the item\'s metadata', () => {
    const table = fixture.debugElement.query(By.css('table'));
    for (const metadatum of mockItem.allMetadata(Object.keys(mockItem.metadata))) {
      expect(table.nativeElement.innerHTML).toContain(metadatum.value);
    }
  });

  it('should show simple view button when not originated from workflow item', () => {
    waitForAsync(() => {
      expect(comp.fromSubmissionObject).toBe(false);
      const simpleViewBtn = fixture.debugElement.query(By.css('.simple-view-link'));
      expect(simpleViewBtn).toBeTruthy();
    });
  });

  it('should not show simple view button when originated from workflow', fakeAsync(() => {
    routeData.wfi = createSuccessfulRemoteDataObject$({ id: 'wfiId'});
    comp.ngOnInit();
    waitForAsync(() => {
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(comp.fromSubmissionObject).toBe(true);
        const simpleViewBtn = fixture.debugElement.query(By.css('.simple-view-link'));
        expect(simpleViewBtn).toBeFalsy();
      });
    });
  }));

  describe('when the item is withdrawn and the user is an admin', () => {
    beforeEach(() => {
      comp.isAdmin$ = observableOf(true);
      comp.itemRD$ = new BehaviorSubject<RemoteData<Item>>(createSuccessfulRemoteDataObject(mockWithdrawnItem));
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('.full-item-info'));
      expect(objectLoader.nativeElement).not.toBeNull();
    });

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(2);
    });
  });
  describe('when the item is withdrawn and the user is not an admin', () => {
    beforeEach(() => {
      comp.itemRD$ = new BehaviorSubject<RemoteData<Item>>(createSuccessfulRemoteDataObject(mockWithdrawnItem));
      fixture.detectChanges();
    });

    it('should not display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('.full-item-info'));
      expect(objectLoader).toBeNull();
    });
  });

  describe('when the item is not withdrawn and the user is an admin', () => {
    beforeEach(() => {
      comp.isAdmin$ = observableOf(true);
      comp.itemRD$ = new BehaviorSubject<RemoteData<Item>>(createSuccessfulRemoteDataObject(mockItem));
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('.full-item-info'));
      expect(objectLoader).not.toBeNull();
    });

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(2);
    });
  });

  describe('when the item is not withdrawn and the user is not an admin', () => {
    beforeEach(() => {
      comp.itemRD$ = new BehaviorSubject<RemoteData<Item>>(createSuccessfulRemoteDataObject(mockItem));
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('.full-item-info'));
      expect(objectLoader).not.toBeNull();
    });

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(2);
    });
  });
  describe('Workflow Actions Integration', () => {
    describe('when route data contains workflow item', () => {
      beforeEach(() => {
        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = observableOf(routeData);
        comp.ngOnInit();
        fixture.detectChanges();
      });

      it('should set fromSubmissionObject to true', () => {
        expect(comp.fromSubmissionObject).toBe(true);
      });

      it('should initialize workflowItem', () => {
        expect(comp.workflowItem).toEqual(mockWorkflowItem);
      });

      it('should create claimedTask$ observable', (done) => {
        comp.claimedTask$.subscribe(claimedTaskRD => {
          expect(claimedTaskRD.hasSucceeded).toBe(true);
          expect(claimedTaskRD.payload).toEqual(mockClaimedTask);
          done();
        });
      });

      it('should have claimedTask$ observable that depends on itemRD$', () => {
        expect(comp.claimedTask$).toBeDefined();
        expect(claimedTaskService.findByItem).toHaveBeenCalledWith(mockItem.uuid);
      });

      it('should populate item$ BehaviorSubject', (done) => {
        comp.item$.subscribe((item) => {
          if (item) {
            expect(item).toEqual(mockItem);
            done();
          }
        });
      });

      it('should populate workflowitem$ BehaviorSubject', (done) => {
        comp.workflowitem$.subscribe((wfi) => {
          expect(wfi).toEqual(mockWorkflowItem);
          done();
        });
      });

      it('should call linkService.resolveLinks with correct parameters', (done) => {
        expect(linkService.resolveLinks).toHaveBeenCalledWith(
          mockClaimedTask,
          jasmine.any(Object),
          jasmine.any(Object)
        );
        done();
      });

      it('should display claimed task actions at the top', () => {
        comp.item$.next(mockItem);
        comp.workflowitem$.next(mockWorkflowItem);
        comp.claimedTask$ = observableOf(createSuccessfulRemoteDataObject(mockClaimedTask));
        fixture.detectChanges();
        const claimedTaskActions = fixture.debugElement.queryAll(By.css('ds-claimed-task-actions'));
        expect(claimedTaskActions.length).toBeGreaterThanOrEqual(1);
        const firstActions = claimedTaskActions[0];
        const itemInfo = fixture.debugElement.query(By.css('.full-item-info'));
        expect(firstActions.nativeElement.compareDocumentPosition(itemInfo.nativeElement)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      });

      it('should display claimed task actions at the bottom', () => {
        comp.item$.next(mockItem);
        comp.workflowitem$.next(mockWorkflowItem);
        comp.claimedTask$ = observableOf(createSuccessfulRemoteDataObject(mockClaimedTask));
        fixture.detectChanges();
        const claimedTaskActions = fixture.debugElement.queryAll(By.css('ds-claimed-task-actions'));
        const secondActions = claimedTaskActions[1];
        const itemInfo = fixture.debugElement.query(By.css('.full-item-info'));
        expect(secondActions.nativeElement.compareDocumentPosition(itemInfo.nativeElement)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
      });

      it('should render claimed-task-actions components', () => {
        comp.item$.next(mockItem);
        comp.workflowitem$.next(mockWorkflowItem);
        comp.claimedTask$ = observableOf(createSuccessfulRemoteDataObject(mockClaimedTask));
        fixture.detectChanges();
        const claimedTaskActions = fixture.debugElement.queryAll(By.css('ds-claimed-task-actions'));
        expect(claimedTaskActions.length).toBe(2);
        claimedTaskActions.forEach((actionElement) => {
          expect(actionElement).toBeTruthy();
        });
      });
    });

    describe('when route data does not contain workflow item', () => {
      beforeEach(() => {
        routeData.wfi = undefined;
        routeStub.data = observableOf(routeData);
        comp.ngOnInit();
        fixture.detectChanges();
      });

      it('should not initialize workflow-related observables', () => {
        expect(comp.workflowItem).toBeUndefined();
        expect(comp.claimedTask$).toBeUndefined();
      });

      it('should not display claimed task actions', () => {
        const claimedTaskActions = fixture.debugElement.queryAll(By.css('ds-claimed-task-actions'));
        expect(claimedTaskActions.length).toBe(0);
      });
    });

    describe('when claimedTask$ does not have a successful response', () => {
      beforeEach(() => {
        (claimedTaskService.findByItem as jasmine.Spy).and.returnValue(
          observableOf(createFailedRemoteDataObject('Not found', 404))
        );

        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = observableOf(routeData);
        comp.ngOnInit();
        fixture.detectChanges();
      });

      it('should not display claimed task actions', () => {
        comp.item$.next(mockItem);
        comp.workflowitem$.next(mockWorkflowItem);
        fixture.detectChanges();
        const claimedTaskActions = fixture.debugElement.queryAll(By.css('ds-claimed-task-actions'));
        expect(claimedTaskActions.length).toBe(0);
      });
    });

    describe('onWorkflowActionCompleted', () => {
      beforeEach(() => {
        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = observableOf(routeData);
        comp.ngOnInit();
      });

      it('should navigate to /mydspace when reloadedObject is provided', () => {
        const reloadedObject = { id: 'reloaded-1' };
        comp.onWorkflowActionCompleted(reloadedObject);
        expect(router.navigate).toHaveBeenCalledWith(['/mydspace']);
      });

      it('should not navigate when reloadedObject is null', () => {
        comp.onWorkflowActionCompleted(null);
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should not navigate when reloadedObject is undefined', () => {
        comp.onWorkflowActionCompleted(undefined);
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('subscription cleanup', () => {
      it('should unsubscribe from all subscriptions on destroy', () => {
        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = observableOf(routeData);
        comp.ngOnInit();
        fixture.detectChanges();

        const subsLength = comp.subs.length;
        expect(subsLength).toBeGreaterThan(0);

        comp.subs.forEach((sub) => {
          if (sub) {
            spyOn(sub, 'unsubscribe');
          }
        });
        comp.ngOnDestroy();
        comp.subs.filter(sub => sub).forEach((sub) => {
          expect(sub.unsubscribe).toHaveBeenCalled();
        });
      });
    });
  });
});
