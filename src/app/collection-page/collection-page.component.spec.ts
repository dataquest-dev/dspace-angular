import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of as observableOf } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CollectionPageComponent } from './collection-page.component';
import { CollectionDataService } from '../core/data/collection-data.service';
import { SearchService } from '../core/shared/search/search.service';
import { AuthService } from '../core/auth/auth.service';
import { PaginationService } from '../core/pagination/pagination.service';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { DSONameService } from '../core/breadcrumbs/dso-name.service';
import { APP_CONFIG } from '../../config/app-config.interface';
import { VarDirective } from '../shared/utils/var.directive';

describe('CollectionPageComponent', () => {
  let component: CollectionPageComponent;
  let fixture: ComponentFixture<CollectionPageComponent>;

  const collectionUUID = '22222222-2222-2222-2222-222222222222';
  const collection = {
    id: collectionUUID,
    uuid: collectionUUID,
    type: 'collection',
    handle: '123456789/2',
    introductoryText: null,
    sidebarText: null,
    copyrightText: null,
    logo: observableOf({ hasSucceeded: true, payload: undefined })
  };

  const collectionRD = {
    hasSucceeded: true,
    hasFailed: false,
    statusCode: 200,
    payload: collection
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      declarations: [CollectionPageComponent, VarDirective],
      providers: [
        { provide: ActivatedRoute, useValue: { data: observableOf({ dso: collectionRD }) } },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl'), url: '/' } },
        { provide: CollectionDataService, useValue: {} },
        {
          provide: SearchService,
          useValue: {
            search: () => observableOf({ hasSucceeded: true, payload: { page: [] } })
          }
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => observableOf(false),
            setRedirectUrl: jasmine.createSpy('setRedirectUrl')
          }
        },
        {
          provide: PaginationService,
          useValue: {
            getCurrentPagination: () => observableOf({ currentPage: 1, pageSize: 10 }),
            getCurrentSort: () => observableOf({ field: 'dc.date.accessioned', direction: 'DESC' }),
            clearPagination: jasmine.createSpy('clearPagination')
          }
        },
        { provide: AuthorizationDataService, useValue: { isAuthorized: () => observableOf(false) } },
        { provide: DSONameService, useValue: { getName: () => 'Test Collection' } },
        { provide: APP_CONFIG, useValue: { browseBy: { pageSize: 10 } } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionPageComponent);
    component = fixture.componentInstance;

    spyOn(component, 'ngOnInit').and.callFake(() => {
      component.collectionRD$ = observableOf(collectionRD as any);
      component.logoRD$ = observableOf({ hasSucceeded: true, payload: undefined } as any);
      component.itemRD$ = observableOf({ hasSucceeded: true, payload: { page: [] } } as any);
    });

    fixture.detectChanges();
  });

  it('should render the dso edit menu in the header action area', () => {
    expect(component).toBeTruthy();

    const editMenu = fixture.debugElement.query(By.css('ds-dso-edit-menu'));

    expect(editMenu).toBeTruthy();
  });
});
