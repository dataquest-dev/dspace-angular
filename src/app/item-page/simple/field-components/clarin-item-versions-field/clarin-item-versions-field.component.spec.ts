import {
  Component,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  EMPTY,
  of,
} from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { AuthorizationDataService } from '../../../../core/data/feature-authorization/authorization-data.service';
import { ItemDataService } from '../../../../core/data/item-data.service';
import { buildPaginatedList } from '../../../../core/data/paginated-list.model';
import { VersionDataService } from '../../../../core/data/version-data.service';
import { VersionHistoryDataService } from '../../../../core/data/version-history-data.service';
import { PaginationService } from '../../../../core/pagination/pagination.service';
import { Item } from '../../../../core/shared/item.model';
import { PageInfo } from '../../../../core/shared/page-info.model';
import { Version } from '../../../../core/shared/version.model';
import { VersionHistory } from '../../../../core/shared/version-history.model';
import { WorkflowItemDataService } from '../../../../core/submission/workflowitem-data.service';
import { WorkspaceitemDataService } from '../../../../core/submission/workspaceitem-data.service';
import { AlertComponent } from '../../../../shared/alert/alert.component';
import { NotificationsService } from '../../../../shared/notifications/notifications.service';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { ActivatedRouteStub } from '../../../../shared/testing/active-router.stub';
import { NotificationsServiceStub } from '../../../../shared/testing/notifications-service.stub';
import { PaginationServiceStub } from '../../../../shared/testing/pagination-service.stub';
import { ItemVersionsComponent } from '../../../versions/item-versions.component';
import { ClarinItemVersionsFieldComponent } from './clarin-item-versions-field.component';

describe('ClarinItemVersionsFieldComponent', () => {
  let component: ClarinItemVersionsFieldComponent;
  let fixture: ComponentFixture<ClarinItemVersionsFieldComponent>;

  const versionHistory = Object.assign(new VersionHistory(), {
    id: '1',
    draftVersion: false,
  });

  const version1 = Object.assign(new Version(), {
    id: '1',
    version: 1,
    versionhistory: createSuccessfulRemoteDataObject$(versionHistory),
    _links: { self: { href: 'version1-url' } },
  });
  const version2 = Object.assign(new Version(), {
    id: '2',
    version: 2,
    versionhistory: createSuccessfulRemoteDataObject$(versionHistory),
    _links: { self: { href: 'version2-url' } },
  });
  const versions = [version1, version2];

  const item1 = Object.assign(new Item(), {
    id: 'item-identifier-1',
    uuid: 'item-identifier-1',
    metadata: { 'dc.title': [{ value: 'First version' }] },
    version: createSuccessfulRemoteDataObject$(version1),
    _links: { self: { href: '/items/item-identifier-1' } },
  });
  const item2 = Object.assign(new Item(), {
    id: 'item-identifier-2',
    uuid: 'item-identifier-2',
    metadata: { 'dc.title': [{ value: 'Second version' }] },
    version: createSuccessfulRemoteDataObject$(version2),
    _links: { self: { href: '/items/item-identifier-2' } },
  });
  version1.item = createSuccessfulRemoteDataObject$(item1);
  version2.item = createSuccessfulRemoteDataObject$(item2);

  function paginatedVersions(page: Version[]) {
    return buildPaginatedList(new PageInfo({
      elementsPerPage: 10,
      totalElements: page.length,
      totalPages: 1,
      currentPage: 1,
    }), page);
  }

  const versionHistoryServiceSpy = jasmine.createSpyObj('versionHistoryService', ['getVersions']);
  const authorizationServiceSpy = jasmine.createSpyObj('authorizationService', {
    isAuthorized: of(false),
  });
  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: createSuccessfulRemoteDataObject$({ values: ['false'] }),
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        ClarinItemVersionsFieldComponent,
      ],
      providers: [
        { provide: PaginationService, useValue: new PaginationServiceStub() },
        { provide: NotificationsService, useValue: new NotificationsServiceStub() },
        { provide: AuthorizationDataService, useValue: authorizationServiceSpy },
        { provide: VersionHistoryDataService, useValue: versionHistoryServiceSpy },
        { provide: VersionDataService, useValue: jasmine.createSpyObj('versionService', { findById: EMPTY }) },
        { provide: WorkspaceitemDataService, useValue: jasmine.createSpyObj('workspaceItemDataService', { findByItem: EMPTY }) },
        { provide: WorkflowItemDataService, useValue: jasmine.createSpyObj('workflowItemDataService', { findByItem: EMPTY }) },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
        { provide: AuthService, useValue: jasmine.createSpyObj('authService', { isAuthenticated: of(true) }) },
        { provide: ItemDataService, useValue: jasmine.createSpyObj('itemDataService', ['delete']) },
        { provide: UntypedFormBuilder, useValue: new UntypedFormBuilder() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ItemVersionsComponent, {
        remove: { imports: [AlertComponent, PaginationComponent] },
      })
      .compileComponents();
  }));

  describe('when the item has more than one version', () => {
    beforeEach(() => {
      versionHistoryServiceSpy.getVersions.and.returnValue(
        createSuccessfulRemoteDataObject$(paginatedVersions(versions)),
      );
      fixture = TestBed.createComponent(ClarinItemVersionsFieldComponent);
      component = fixture.componentInstance;
      component.item = item1;
      component.iconName = 'fa-history';
      fixture.detectChanges();
    });

    it('should show the version history header', () => {
      const header = fixture.debugElement.query(By.css('.clarin-item-page-field'));
      expect(header).not.toBeNull();
    });

    it('should render the icon passed through iconName', () => {
      const icon = fixture.debugElement.query(By.css('i.fa-history'));
      expect(icon).not.toBeNull();
    });

    it('should list every version once expanded', () => {
      component.toggleVersionHistory();
      fixture.detectChanges();
      const rows = fixture.debugElement.queryAll(By.css('.dropdown-versions li'));
      expect(rows.length).toBe(versions.length);
    });

    it('should link a version to its item version route', () => {
      expect(component.getVersionRoute(version2.id)).toContain(version2.id);
    });
  });

  describe('next to the version table administrators see', () => {
    @Component({
      template: `
        <ds-item-versions [item]="item" [displayActions]="false"></ds-item-versions>
        <ds-clarin-item-versions-field [item]="item"></ds-clarin-item-versions-field>`,
      imports: [
        ClarinItemVersionsFieldComponent,
        ItemVersionsComponent,
      ],
    })
    class ItemPageVersionsHostComponent {
      item = item1;
    }

    let host: HTMLElement;

    beforeEach(() => {
      authorizationServiceSpy.isAuthorized.and.returnValue(of(true));
      versionHistoryServiceSpy.getVersions.and.returnValue(
        createSuccessfulRemoteDataObject$(paginatedVersions(versions)),
      );
      const hostFixture = TestBed.createComponent(ItemPageVersionsHostComponent);
      hostFixture.detectChanges();
      host = hostFixture.nativeElement;
    });

    afterEach(() => {
      authorizationServiceSpy.isAuthorized.and.returnValue(of(false));
    });

    it('should not emit an element id that the version table also emits', () => {
      expect(host.querySelectorAll('ds-item-versions tbody tr[id]').length)
        .withContext('the administrator version table did not render its rows')
        .toBe(versions.length);
      expect(host.querySelectorAll('ds-clarin-item-versions-field li[id]').length)
        .withContext('the version list did not render its rows')
        .toBe(versions.length);

      const ids = Array.from(host.querySelectorAll('[id]')).map((element: Element) => element.id);
      expect(ids.filter((id: string, index: number) => ids.indexOf(id) !== index))
        .withContext('duplicate element ids on the item page')
        .toEqual([]);
    });
  });

  describe('when the item has a single version', () => {
    beforeEach(() => {
      versionHistoryServiceSpy.getVersions.and.returnValue(
        createSuccessfulRemoteDataObject$(paginatedVersions([version1])),
      );
      fixture = TestBed.createComponent(ClarinItemVersionsFieldComponent);
      component = fixture.componentInstance;
      component.item = item1;
      fixture.detectChanges();
    });

    it('should not show the version history', () => {
      const header = fixture.debugElement.query(By.css('.clarin-item-page-field'));
      expect(header).toBeNull();
    });
  });

  describe('when the item has no version', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ClarinItemVersionsFieldComponent);
      component = fixture.componentInstance;
      component.item = Object.assign(new Item(), { id: 'no-version', uuid: 'no-version' });
      fixture.detectChanges();
    });

    it('should not show the version history', () => {
      const header = fixture.debugElement.query(By.css('.clarin-item-page-field'));
      expect(header).toBeNull();
    });
  });
});
