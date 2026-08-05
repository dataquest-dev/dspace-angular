import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';

import { VersionHistoryDataService } from '../../../core/data/version-history-data.service';
import { Item } from '../../../core/shared/item.model';
import { Version } from '../../../core/shared/version.model';
import { VersionHistory } from '../../../core/shared/version-history.model';
import { createSuccessfulRemoteDataObject$ } from '../../../shared/remote-data.utils';
import { createPaginatedList } from '../../../shared/testing/utils.test';
import { ItemVersionsNoticeComponent } from './item-versions-notice.component';

describe('ItemVersionsNoticeComponent', () => {
  let component: ItemVersionsNoticeComponent;
  let fixture: ComponentFixture<ItemVersionsNoticeComponent>;
  let versionHistoryService: VersionHistoryDataService;

  const versionHistory = Object.assign(new VersionHistory(), {
    id: '1',
  });
  const firstVersion = Object.assign(new Version(), {
    id: '1',
    version: 1,
    created: new Date(2020, 1, 1),
    summary: 'first version',
    versionhistory: createSuccessfulRemoteDataObject$(versionHistory),
  });
  const latestVersion = Object.assign(new Version(), {
    id: '2',
    version: 2,
    summary: 'latest version',
    created: new Date(2020, 1, 2),
    versionhistory: createSuccessfulRemoteDataObject$(versionHistory),
  });
  const versions = [latestVersion, firstVersion];
  versionHistory.versions = createSuccessfulRemoteDataObject$(createPaginatedList(versions));
  const firstItem = Object.assign(new Item(), {
    id: 'first_item_id',
    uuid: 'first_item_id',
    handle: '123456789/1',
    version: createSuccessfulRemoteDataObject$(firstVersion),
  });
  const latestItem = Object.assign(new Item(), {
    id: 'latest_item_id',
    uuid: 'latest_item_id',
    handle: '123456789/2',
    version: createSuccessfulRemoteDataObject$(latestVersion),
  });
  firstVersion.item = createSuccessfulRemoteDataObject$(firstItem);
  latestVersion.item = createSuccessfulRemoteDataObject$(latestItem);

  const versionHistoryServiceSpy = jasmine.createSpyObj('versionHistoryService',
    ['getVersions', 'getLatestVersionFromHistory$', 'isLatest$' ],
  );
  const locationStub = jasmine.createSpyObj('location', ['prepareExternalUrl']);

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
        ItemVersionsNoticeComponent,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: VersionHistoryDataService, useValue: versionHistoryServiceSpy },
        { provide: Location, useValue: locationStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    versionHistoryService = TestBed.inject(VersionHistoryDataService);

    const isLatestFcn = (version: Version) => of((version.version === latestVersion.version));

    versionHistoryServiceSpy.getVersions.and.returnValue(createSuccessfulRemoteDataObject$(createPaginatedList(versions)));
    versionHistoryServiceSpy.getLatestVersionFromHistory$.and.returnValue(of(latestVersion));
    versionHistoryServiceSpy.isLatest$.and.callFake(isLatestFcn);
    // Simulate a UI deployed under a sub-path namespace, i.e. <base href="/repository/">
    locationStub.prepareExternalUrl.and.callFake((url: string) => `/repository${url}`);
  }));

  describe('when the item is the latest version', () => {
    beforeEach(() => {
      initComponentWithItem(latestItem);
    });

    it('should not display a notice', () => {
      const alert = fixture.debugElement.query(By.css('ds-alert'));
      expect(alert).toBeNull();
    });
  });

  describe('when the item is not the latest version', () => {
    beforeEach(() => {
      initComponentWithItem(firstItem);
    });

    it('should display a notice', () => {
      const alert = fixture.debugElement.query(By.css('ds-alert'));
      expect(alert).not.toBeNull();
    });
  });

  describe('isLatest', () => {
    it('firstVersion should not be the latest', () => {
      versionHistoryService.isLatest$(firstVersion).pipe(take(1)).subscribe((res) => {
        expect(res).toBeFalse();
      });
    });
    it('latestVersion should be the latest', () => {
      versionHistoryService.isLatest$(latestVersion).pipe(take(1)).subscribe((res) => {
        expect(res).toBeTrue();
      });
    });
  });

  describe('getItemPage', () => {
    beforeEach(() => {
      initComponentWithItem(firstItem);
    });

    it('should resolve the latest version item page url against the base href', () => {
      expect(component.getItemPage(latestItem)).toEqual('/repository/items/latest_item_id');
      // The plain router path must be what is handed to Location, otherwise the prefix would be applied twice
      expect(locationStub.prepareExternalUrl).toHaveBeenCalledWith('/items/latest_item_id');
    });

    it('should not resolve a url when no item is provided', () => {
      expect(component.getItemPage(undefined)).toBeUndefined();
    });

    it('should render the notice anchor with the base href applied', () => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en', {
        'item.version.notice': 'The latest version can be found <a href=\'{{destination}}\'>here</a>.',
      }, true);
      translate.use('en');
      fixture.detectChanges();

      const anchor = fixture.debugElement.query(By.css('ds-alert a'));
      expect(anchor).not.toBeNull();
      expect(anchor.nativeElement.getAttribute('href')).toEqual('/repository/items/latest_item_id');
    });
  });

  function initComponentWithItem(item: Item) {
    fixture = TestBed.createComponent(ItemVersionsNoticeComponent);
    component = fixture.componentInstance;
    component.item = item;
    fixture.detectChanges();
  }
});
