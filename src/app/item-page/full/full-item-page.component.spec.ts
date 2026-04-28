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
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import {
  BehaviorSubject,
  of,
} from 'rxjs';

import { NotifyInfoService } from '../../core/coar-notify/notify-info/notify-info.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { ItemDataService } from '../../core/data/item-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { HeadTagService } from '../../core/metadata/head-tag.service';
import { LinkHeadService } from '../../core/services/link-head.service';
import { ServerResponseService } from '../../core/services/server-response.service';
import { Item } from '../../core/shared/item.model';
import { DsoEditMenuComponent } from '../../shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { ThemedLoadingComponent } from '../../shared/loading/themed-loading.component';
import { HeadTagServiceMock } from '../../shared/mocks/head-tag-service.mock';
import { getMockThemeService } from '../../shared/mocks/theme-service.mock';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import {
  createSuccessfulRemoteDataObject,
  createSuccessfulRemoteDataObject$,
} from '../../shared/remote-data.utils';
import { ActivatedRouteStub } from '../../shared/testing/active-router.stub';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { ThemeService } from '../../shared/theme-support/theme.service';
import { MetadataLinkService } from '../../shared/utils/metadata-link.service';
import { TruncatePipe } from '../../shared/utils/truncate.pipe';
import { VarDirective } from '../../shared/utils/var.directive';
import { CollectionsComponent } from '../field-components/collections/collections.component';
import { ThemedItemPageTitleFieldComponent } from '../simple/field-components/specific-field/title/themed-item-page-field.component';
import { createRelationshipsObservable } from '../simple/item-types/shared/item.component.spec';
import { ItemVersionsComponent } from '../versions/item-versions.component';
import { ItemVersionsNoticeComponent } from '../versions/notice/item-versions-notice.component';
import { ThemedFullFileSectionComponent } from './field-components/file-section/themed-full-file-section.component';
import { FullItemPageComponent } from './full-item-page.component';

const mockItem: Item = Object.assign(new Item(), {
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

const mockItemWithUrl: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'test item',
      },
    ],
    'dc.identifier.uri': [
      {
        language: null,
        value: 'https://hdl.handle.net/123456789/1',
      },
    ],
    'dc.description': [
      {
        language: 'en_US',
        value: 'plain text value',
      },
    ],
  },
});

const mockItemWithSpecialFields: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'test item',
      },
    ],
    'local.identifier.doi': [
      {
        language: null,
        value: '10.1234/test',
      },
    ],
    'local.identifier.scopus': [
      {
        language: null,
        value: '2-s2.0-85012345678',
      },
    ],
    'local.identifier.wos': [
      {
        language: null,
        value: 'WOS:000123456789',
      },
    ],
    'dc.rights.uri': [
      {
        language: null,
        value: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ],
    'dc.identifier.issn': [
      {
        language: null,
        value: '1234-5678',
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
  let metadataLinkService: jasmine.SpyObj<MetadataLinkService>;

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

    metadataLinkService = jasmine.createSpyObj('MetadataLinkService', ['getMetadataLink', 'getExtraLinks']);
    metadataLinkService.getMetadataLink.and.returnValue(of(null));
    metadataLinkService.getExtraLinks.and.returnValue(of([]));

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
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ThemeService, useValue: getMockThemeService() },
        { provide: MetadataLinkService, useValue: metadataLinkService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FullItemPageComponent, {
        remove: {
          imports: [
            ItemVersionsComponent,
            ItemVersionsNoticeComponent,
            ThemedLoadingComponent,
            ThemedItemPageTitleFieldComponent,
            DsoEditMenuComponent,
            CollectionsComponent,
            ThemedFullFileSectionComponent,
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

  describe('metadata URL rendering', () => {
    beforeEach(() => {
      routeData.dso = createSuccessfulRemoteDataObject(mockItemWithUrl);
      comp.ngOnInit();
      fixture.detectChanges();
    });

    it('should render URL metadata values as clickable links', () => {
      const links = fixture.debugElement.queryAll(By.css('table a'));
      const urlLink = links.find(l => l.nativeElement.textContent.includes('https://hdl.handle.net/123456789/1'));
      expect(urlLink).toBeTruthy();
      expect(urlLink.nativeElement.getAttribute('href')).toBe('https://hdl.handle.net/123456789/1');
      expect(urlLink.nativeElement.getAttribute('target')).toBe('_blank');
      expect(urlLink.nativeElement.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should render non-URL metadata values as plain text without links', () => {
      const table = fixture.debugElement.query(By.css('table'));
      expect(table.nativeElement.innerHTML).toContain('plain text value');
      const links = fixture.debugElement.queryAll(By.css('table a'));
      const plainTextLink = links.find(l => l.nativeElement.textContent.includes('plain text value'));
      expect(plainTextLink).toBeFalsy();
    });
  });

  describe('field-specific metadata link rendering', () => {
    beforeEach(() => {
      metadataLinkService.getMetadataLink.and.callFake((key: string, value: string) => {
        switch (key) {
          case 'local.identifier.doi':
            return of({ external: true, href: `https://doi.org/${encodeURIComponent(value)}` });
          case 'local.identifier.scopus':
            return of({ external: true, href: `https://www.scopus.com/record/display.uri?eid=${encodeURIComponent(value)}` });
          case 'local.identifier.wos':
            return of({ external: true, href: `https://www.webofscience.com/wos/woscc/full-record/${encodeURIComponent(value)}` });
          case 'dc.rights.uri':
            return of({ external: true, href: value });
          default:
            return of(null);
        }
      });
      metadataLinkService.getExtraLinks.and.callFake((key: string, value: string) => {
        if (key === 'dc.identifier.issn') {
          return of([
            { label: 'Open policy finder', href: `https://openpolicyfinder.jisc.ac.uk/search?search=${encodeURIComponent(value)}` },
            { label: 'JCR', href: `https://jcr.clarivate.com/jcr/browse-journals?search=${encodeURIComponent(value)}` },
          ]);
        }
        return of([]);
      });

      routeData.dso = createSuccessfulRemoteDataObject(mockItemWithSpecialFields);
      comp.ngOnInit();
      fixture.detectChanges();
    });

    it('should render bare DOI as external link to doi.org', () => {
      const links = fixture.debugElement.queryAll(By.css('table a'));
      const doiLink = links.find(l => l.nativeElement.textContent.includes('10.1234/test'));
      expect(doiLink).toBeTruthy();
      expect(doiLink.nativeElement.getAttribute('href')).toContain('https://doi.org/');
      expect(doiLink.nativeElement.getAttribute('target')).toBe('_blank');
      expect(doiLink.nativeElement.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should render Scopus ID as external link', () => {
      const links = fixture.debugElement.queryAll(By.css('table a'));
      const scopusLink = links.find(l => l.nativeElement.textContent.includes('2-s2.0-85012345678'));
      expect(scopusLink).toBeTruthy();
      expect(scopusLink.nativeElement.getAttribute('href')).toContain('scopus.com');
      expect(scopusLink.nativeElement.getAttribute('target')).toBe('_blank');
    });

    it('should render WOS ID as external link', () => {
      const links = fixture.debugElement.queryAll(By.css('table a'));
      const wosLink = links.find(l => l.nativeElement.textContent.includes('WOS:000123456789'));
      expect(wosLink).toBeTruthy();
      expect(wosLink.nativeElement.getAttribute('href')).toContain('webofscience.com');
      expect(wosLink.nativeElement.getAttribute('target')).toBe('_blank');
    });

    it('should render dc.rights.uri as external link', () => {
      const links = fixture.debugElement.queryAll(By.css('table a'));
      const rightsLink = links.find(l => l.nativeElement.textContent.includes('creativecommons.org'));
      expect(rightsLink).toBeTruthy();
      expect(rightsLink.nativeElement.getAttribute('href')).toContain('https://creativecommons.org/licenses/by/4.0/');
      expect(rightsLink.nativeElement.getAttribute('target')).toBe('_blank');
    });

    it('should render Open policy finder and JCR badges for ISSN', () => {
      const badges = fixture.debugElement.queryAll(By.css('table .badge'));
      const sherpaLink = badges.find(l => l.nativeElement.textContent.includes('Open policy finder'));
      const jcrLink = badges.find(l => l.nativeElement.textContent.includes('JCR'));
      expect(sherpaLink).toBeTruthy();
      expect(sherpaLink.nativeElement.getAttribute('href')).toContain('openpolicyfinder.jisc.ac.uk');
      expect(jcrLink).toBeTruthy();
      expect(jcrLink.nativeElement.getAttribute('href')).toContain('jcr.clarivate.com');
    });

    it('should not render internal search links for dc.subject or dc.contributor.author', () => {
      expect(metadataLinkService.getMetadataLink).not.toHaveBeenCalledWith('dc.subject', jasmine.anything());
      expect(metadataLinkService.getMetadataLink).not.toHaveBeenCalledWith('dc.contributor.author', jasmine.anything());
    });
  });
});
