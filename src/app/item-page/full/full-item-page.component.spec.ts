import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
  PLATFORM_ID,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import {
  BehaviorSubject,
  of,
} from 'rxjs';

import { LinkService } from '../../core/cache/builders/link.service';
import { NotifyInfoService } from '../../core/coar-notify/notify-info/notify-info.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { ItemDataService } from '../../core/data/item-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { HeadTagService } from '../../core/metadata/head-tag.service';
import { LinkHeadService } from '../../core/services/link-head.service';
import { ServerResponseService } from '../../core/services/server-response.service';
import { Item } from '../../core/shared/item.model';
import { WorkflowItem } from '../../core/submission/models/workflowitem.model';
import { ClaimedTaskDataService } from '../../core/tasks/claimed-task-data.service';
import { ClaimedTask } from '../../core/tasks/models/claimed-task-object.model';
import { WorkflowAction } from '../../core/tasks/models/workflow-action-object.model';
import { DsoEditMenuComponent } from '../../shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { ThemedLoadingComponent } from '../../shared/loading/themed-loading.component';
import { HeadTagServiceMock } from '../../shared/mocks/head-tag-service.mock';
import { getMockLinkService } from '../../shared/mocks/link-service.mock';
import { getMockThemeService } from '../../shared/mocks/theme-service.mock';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { ClaimedTaskActionsComponent } from '../../shared/mydspace-actions/claimed-task/claimed-task-actions.component';
import {
  createFailedRemoteDataObject,
  createSuccessfulRemoteDataObject,
  createSuccessfulRemoteDataObject$,
} from '../../shared/remote-data.utils';
import { ActivatedRouteStub } from '../../shared/testing/active-router.stub';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { ThemeService } from '../../shared/theme-support/theme.service';
import { TruncatePipe } from '../../shared/utils/truncate.pipe';
import { VarDirective } from '../../shared/utils/var.directive';
import { ThemedItemAlertsComponent } from '../alerts/themed-item-alerts.component';
import { ClarinFilesSectionComponent } from '../clarin-files-section/clarin-files-section.component';
import { ClarinRefBoxComponent } from '../clarin-ref-box/clarin-ref-box.component';
import { CollectionsComponent } from '../field-components/collections/collections.component';
import { createRelationshipsObservable } from '../simple/item-types/shared/item.component.spec';
import { ItemVersionsComponent } from '../versions/item-versions.component';
import { ItemVersionsNoticeComponent } from '../versions/notice/item-versions-notice.component';
import { FullItemPageComponent } from './full-item-page.component';

const mockItem: Item = Object.assign(new Item(), {
  uuid: 'test-item-uuid',
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'test item',
      },
    ],
  },
});

const mockWithdrawnItem: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: [],
  relationships: createRelationshipsObservable(),
  isWithdrawn: true,
});

const mockWorkflowItem: WorkflowItem = Object.assign(new WorkflowItem(), {
  id: 'workflow-item-1',
  uuid: 'workflow-uuid-1',
  item: of(createSuccessfulRemoteDataObject(mockItem)),
});

const mockWorkflowAction: WorkflowAction = Object.assign(new WorkflowAction(), {
  id: 'action-1',
  options: ['submit_approve', 'submit_reject', 'submit_edit_metadata', 'return_to_pool'],
});

const mockClaimedTask: ClaimedTask = Object.assign(new ClaimedTask(), {
  id: 'claimed-task-1',
  workflowitem: of(createSuccessfulRemoteDataObject(mockWorkflowItem)),
  action: of(createSuccessfulRemoteDataObject(mockWorkflowAction)),
  _links: {
    workflowitem: { href: 'https://rest.api/workflowitems/workflow-item-1' },
  },
});

describe('FullItemPageComponent', () => {
  let comp: FullItemPageComponent;
  let fixture: ComponentFixture<FullItemPageComponent>;

  let routeStub: ActivatedRouteStub;
  let routeData;
  let authorizationDataService: AuthorizationDataService;
  let serverResponseService: jasmine.SpyObj<ServerResponseService>;
  let signpostingDataService: jasmine.SpyObj<SignpostingDataService>;
  let linkHeadService: jasmine.SpyObj<LinkHeadService>;
  let notifyInfoService: jasmine.SpyObj<NotifyInfoService>;
  let headTagService: HeadTagServiceMock;
  let claimedTaskService: ClaimedTaskDataService;
  let linkService: LinkService;

  const mocklink = {
    href: 'http://test.org',
    rel: 'test',
    type: 'test',
  };

  const mocklink2 = {
    href: 'http://test2.org',
    rel: 'test',
    type: 'test',
  };

  beforeEach(waitForAsync(() => {
    routeData = {
      dso: createSuccessfulRemoteDataObject(mockItem),
    };

    routeStub = Object.assign(new ActivatedRouteStub(), {
      data: of(routeData),
    });

    authorizationDataService = jasmine.createSpyObj('authorizationDataService', {
      isAuthorized: of(false),
    });

    serverResponseService = jasmine.createSpyObj('ServerResponseService', {
      setHeader: jasmine.createSpy('setHeader'),
    });

    signpostingDataService = jasmine.createSpyObj('SignpostingDataService', {
      getLinks: of([mocklink, mocklink2]),
    });

    linkHeadService = jasmine.createSpyObj('LinkHeadService', {
      addTag: jasmine.createSpy('setHeader'),
      removeTag: jasmine.createSpy('removeTag'),
    });

    notifyInfoService = jasmine.createSpyObj('NotifyInfoService', {
      isCoarConfigEnabled: of(true),
      getCoarLdnLocalInboxUrls: of(['http://test.org']),
      getInboxRelationLink: of('http://test.org'),
    });

    headTagService = new HeadTagServiceMock();

    claimedTaskService = jasmine.createSpyObj('claimedTaskService', {
      findByItem: of(createSuccessfulRemoteDataObject(mockClaimedTask)),
    });

    linkService = getMockLinkService();

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock,
        },
      }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule, FullItemPageComponent, TruncatePipe, VarDirective],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: ItemDataService, useValue: {} },
        { provide: HeadTagService, useValue: headTagService },
        { provide: AuthorizationDataService, useValue: authorizationDataService },
        { provide: ServerResponseService, useValue: serverResponseService },
        { provide: SignpostingDataService, useValue: signpostingDataService },
        { provide: LinkHeadService, useValue: linkHeadService },
        { provide: NotifyInfoService, useValue: notifyInfoService },
        { provide: ClaimedTaskDataService, useValue: claimedTaskService },
        { provide: LinkService, useValue: linkService },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ThemeService, useValue: getMockThemeService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FullItemPageComponent, {
        remove: {
          imports: [
            ClaimedTaskActionsComponent,
            ClarinFilesSectionComponent,
            ClarinRefBoxComponent,
            ItemVersionsComponent,
            ItemVersionsNoticeComponent,
            ThemedLoadingComponent,
            DsoEditMenuComponent,
            ThemedItemAlertsComponent,
            CollectionsComponent,
          ],
        },
        add: { changeDetection: ChangeDetectionStrategy.Default },
      }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
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
    expect(comp.fromSubmissionObject).toBe(false);
    const simpleViewBtn = fixture.debugElement.query(By.css('.simple-view-link'));
    expect(simpleViewBtn).toBeTruthy();
  });

  it('should not show simple view button when originated from workflow', fakeAsync(() => {
    routeData.wfi = createSuccessfulRemoteDataObject$({ id: 'wfiId' });
    comp.ngOnInit();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(comp.fromSubmissionObject).toBe(true);
      const simpleViewBtn = fixture.debugElement.query(By.css('.simple-view-link'));
      expect(simpleViewBtn).toBeFalsy();
    });
  }));

  describe('when the item is withdrawn and the user is an admin', () => {
    beforeEach(() => {
      comp.isAdmin$ = of(true);
      comp.itemRD$ = new BehaviorSubject<RemoteData<Item>>(createSuccessfulRemoteDataObject(mockWithdrawnItem));
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('.full-item-info'));
      expect(objectLoader.nativeElement).not.toBeNull();
    });

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(3);
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
      comp.isAdmin$ = of(true);
      comp.itemRD$ = new BehaviorSubject<RemoteData<Item>>(createSuccessfulRemoteDataObject(mockItem));
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('.full-item-info'));
      expect(objectLoader).not.toBeNull();
    });

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(3);
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
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(3);
    });
  });
  describe('Workflow Actions Integration', () => {
    describe('when route data contains workflow item', () => {
      beforeEach(() => {
        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = of(routeData);
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
        comp.claimedTask$.subscribe((claimedTaskRD) => {
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
          jasmine.any(Object),
        );
        done();
      });

      it('should display claimed task actions at the top', () => {
        comp.item$.next(mockItem);
        comp.workflowitem$.next(mockWorkflowItem);
        comp.claimedTask$ = of(createSuccessfulRemoteDataObject(mockClaimedTask));
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
        comp.claimedTask$ = of(createSuccessfulRemoteDataObject(mockClaimedTask));
        fixture.detectChanges();
        const claimedTaskActions = fixture.debugElement.queryAll(By.css('ds-claimed-task-actions'));
        const secondActions = claimedTaskActions[1];
        const itemInfo = fixture.debugElement.query(By.css('.full-item-info'));
        expect(secondActions.nativeElement.compareDocumentPosition(itemInfo.nativeElement)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
      });

      it('should render claimed-task-actions components', () => {
        comp.item$.next(mockItem);
        comp.workflowitem$.next(mockWorkflowItem);
        comp.claimedTask$ = of(createSuccessfulRemoteDataObject(mockClaimedTask));
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
        routeStub.data = of(routeData);
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
          of(createFailedRemoteDataObject('Not found', 404)),
        );

        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = of(routeData);
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
      let navigateSpy: jasmine.Spy;

      beforeEach(() => {
        navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = of(routeData);
        comp.ngOnInit();
      });

      it('should navigate to /mydspace when reloadedObject is provided', () => {
        comp.onWorkflowActionCompleted({ id: 'reloaded-1' });
        expect(navigateSpy).toHaveBeenCalledWith(['/mydspace']);
      });

      it('should not navigate when reloadedObject is null', () => {
        comp.onWorkflowActionCompleted(null);
        expect(navigateSpy).not.toHaveBeenCalled();
      });

      it('should not navigate when reloadedObject is undefined', () => {
        comp.onWorkflowActionCompleted(undefined);
        expect(navigateSpy).not.toHaveBeenCalled();
      });
    });

    describe('subscription cleanup', () => {
      it('should unsubscribe from all subscriptions on destroy', () => {
        routeData.wfi = createSuccessfulRemoteDataObject(mockWorkflowItem);
        routeStub.data = of(routeData);
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
        comp.subs.filter((sub) => sub).forEach((sub) => {
          expect(sub.unsubscribe).toHaveBeenCalled();
        });
      });
    });
  });
});
