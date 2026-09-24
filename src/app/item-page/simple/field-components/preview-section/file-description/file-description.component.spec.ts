import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbCollapseConfig } from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import axe from 'axe-core';
import JSON5 from 'json5';
import { of } from 'rxjs';
import { FileInfo } from 'src/app/core/metadata/file-info.model';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { ResourceType } from 'src/app/core/shared/resource-type';

import { AuthService } from '../../../../../core/auth/auth.service';
import { BitstreamDataService } from '../../../../../core/data/bitstream-data.service';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { AuthorizationDataService } from '../../../../../core/data/feature-authorization/authorization-data.service';
import { LocaleService } from '../../../../../core/locale/locale.service';
import { Bitstream } from '../../../../../core/shared/bitstream.model';
import { ConfigurationProperty } from '../../../../../core/shared/configuration-property.model';
import { FileService } from '../../../../../core/shared/file.service';
import { HALEndpointService } from '../../../../../core/shared/hal-endpoint.service';
import { ItemRequest } from '../../../../../core/shared/item-request.model';
import { TranslateLoaderMock } from '../../../../../shared/mocks/translate-loader.mock';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/remote-data.utils';
import { AuthServiceStub } from '../../../../../shared/testing/auth-service.stub';
import { AuthorizationDataServiceStub } from '../../../../../shared/testing/authorization-service.stub';
import { FileServiceStub } from '../../../../../shared/testing/file-service.stub';
import { dispatchSpaceKey } from '../../../../../shared/testing/utils.test';
import { FileDescriptionComponent } from './file-description.component';

const CLOSE_KEY = 'item.file.description.preview.close';

const ARCHIVE_TREE = [
  Object.assign(new FileInfo(), {
    name: 'ud-treebanks-v2.15',
    isDirectory: true,
    size: '',
    sub: {
      'README.txt': Object.assign(new FileInfo(), { name: 'README.txt', isDirectory: false, size: '1.2 kB' }),
    },
  }),
];

// Verbatim from node_modules/bootstrap/dist/css/bootstrap.css. The karma target lists the theme with
// `inject: false` (angular.json), so without this rule every element measures as visible and an
// assertion on visibility would pass whatever the template does.
const BOOTSTRAP_COLLAPSE_RULE = '.collapse:not(.show) { display: none; }';

const AXE_OPTIONS: axe.RunOptions = {
  resultTypes: ['violations'],
};

const APPROVED_REQUEST = Object.assign(new ItemRequest(), {
  acceptRequest: true,
  accessExpired: false,
  allfiles: true,
  accessToken: 'approved-token',
});

describe('FileDescriptionComponent', () => {
  let component: FileDescriptionComponent;
  let fixture: ComponentFixture<FileDescriptionComponent>;
  let halService: HALEndpointService;
  let bitstreamDataService: BitstreamDataService;
  let localeService: LocaleService;
  let route: { snapshot: { data: { itemRequest?: ItemRequest } } };

  beforeEach(async () => {
    route = { snapshot: { data: {} } };

    const configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'test',
        values: [
          'org.dspace.ctask.general.ProfileFormats = test',
        ],
      })),
    });

    halService = jasmine.createSpyObj('authService', {
      getRootHref: 'root url',
    });

    bitstreamDataService = jasmine.createSpyObj('bitstreamDataService', {
      findById: createSuccessfulRemoteDataObject$(Object.assign(new Bitstream(), {
        // without _links.content the component's ngOnInit throws asynchronously and the failure
        // lands on whichever async spec happens to be running
        _links: { self: { href: 'self' }, content: { href: 'content' } },
      })),
    });

    localeService = jasmine.createSpyObj('localeService', {
      getCurrentLanguageCode: of('en'),
    });

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock,
        },
      }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule, FileDescriptionComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationDataService },
        { provide: HALEndpointService, useValue: halService },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: FileService, useClass: FileServiceStub },
        { provide: AuthorizationDataService, useClass: AuthorizationDataServiceStub },
        { provide: BitstreamDataService, useValue: bitstreamDataService },
        { provide: LocaleService, useValue: localeService },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    // NgbCollapse copies config.animation in its constructor, so this has to happen before the
    // component is created or the directive runs animated and the assertions read a transient state.
    TestBed.inject(NgbCollapseConfig).animation = false;

    fixture = TestBed.createComponent(FileDescriptionComponent);
    component = fixture.componentInstance;

    // Mock the input value
    const fileInput = new MetadataBitstream();
    fileInput.id = '66efe81e-2950-483d-a065-bbdacd689f95';
    fileInput.name = 'testFile';
    fileInput.description = 'test description';
    fileInput.fileSize = 2048;
    fileInput.checksum = 'abc';
    fileInput.type = new ResourceType('item');
    fileInput.fileInfo = [];
    fileInput.format = 'application/pdf';
    fileInput.canPreview = false;
    fileInput._links = {
      self: { href: '' },
      schema: { href: '' },
    };

    component.fileInput = fileInput;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the file name', () => {
    const fileNameElement = fixture.debugElement.query(
      By.css('.file-content dd'),
    ).nativeElement;
    expect(fileNameElement.textContent).toContain('testFile');
  });

  describe('the download control', () => {
    const downloadButton = (): HTMLElement => fixture.nativeElement.querySelector('a.download-btn');
    const downloadRoute = (): string[] => ['bitstreams', component.fileInput.id, 'download'];
    let navigate: jasmine.Spy;

    beforeEach(() => {
      navigate = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    });

    it('is in the tab order', () => {
      const control = downloadButton();
      expect(control).withContext('the Download control did not render').not.toBeNull();

      // Chrome reports tabIndex 0 even for an anchor that has no href, so read the attributes.
      expect(control.matches('[href], [tabindex]:not([tabindex^="-"])'))
        .withContext(`the Download control has neither href nor tabindex: ${control.outerHTML.slice(0, 120)}`)
        .toBeTrue();

      expect(control.getAttribute('role'))
        .withContext('a screen reader announces the Download control as a link that leads nowhere')
        .toEqual('button');

      control.focus();
      expect(document.activeElement)
        .withContext('Tab cannot land on the Download control - focus() left it unfocused')
        .toBe(control);
    });

    it('starts the download from Enter and from Space', () => {
      const noToken = { queryParams: {} };
      // bubbles stays false on purpose: a handler moved to an ancestor must not satisfy this.
      const press = (key: string) =>
        downloadButton().dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: false }));

      press('Enter');
      expect(navigate)
        .withContext('Enter on the Download control did not start the download')
        .toHaveBeenCalledWith(downloadRoute(), noToken);

      navigate.calls.reset();

      press(' ');
      expect(navigate)
        .withContext('Space on the Download control did not start the download')
        .toHaveBeenCalledWith(downloadRoute(), noToken);

      navigate.calls.reset();

      press('a');
      expect(navigate)
        .withContext('a key that is neither Enter nor Space started the download')
        .not.toHaveBeenCalled();

      downloadButton().click();
      expect(navigate)
        .withContext('clicking the Download control did not start the download')
        .toHaveBeenCalledWith(downloadRoute(), noToken);
    });

    it('does not scroll the page when Space is pressed', () => {
      expect(dispatchSpaceKey(downloadButton(), 'keydown').defaultPrevented).toBeTrue();
    });

    it('carries an approved request-a-copy token to the download', () => {
      route.snapshot.data.itemRequest = APPROVED_REQUEST;

      downloadButton().click();

      expect(navigate).toHaveBeenCalledWith(downloadRoute(), { queryParams: { accessToken: 'approved-token' } });
    });

    it('carries a token that was granted for this file only', () => {
      route.snapshot.data.itemRequest = Object.assign(new ItemRequest(), APPROVED_REQUEST, {
        allfiles: false,
        bitstreamId: component.fileInput.id,
      });

      downloadButton().click();

      expect(navigate).toHaveBeenCalledWith(downloadRoute(), { queryParams: { accessToken: 'approved-token' } });
    });

    it('does not carry a token that was granted for another file', () => {
      route.snapshot.data.itemRequest = Object.assign(new ItemRequest(), APPROVED_REQUEST, {
        allfiles: false,
        bitstreamId: 'another-file',
      });

      downloadButton().click();

      expect(navigate).toHaveBeenCalledWith(downloadRoute(), { queryParams: {} });
    });
  });

  describe('the video preview', () => {
    const videoSource = (): string => fixture.nativeElement.querySelector('video').getAttribute('src');

    beforeEach(() => {
      component.fileInput.format = 'video/mp4';
    });

    it('carries an approved request-a-copy token to the video source', () => {
      route.snapshot.data.itemRequest = APPROVED_REQUEST;
      component.ngOnInit();
      fixture.detectChanges();

      expect(videoSource()).toEqual('content?accessToken=approved-token');
    });

    it('streams the video without a token when the route has none', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(videoSource()).toEqual('content');
    });
  });

  describe('file preview panel', () => {
    let style: HTMLStyleElement;

    const panel = (): HTMLElement => fixture.nativeElement.querySelector('[id^="file_file_"]');
    const previewButton = (): HTMLElement => fixture.nativeElement.querySelector('a.preview-btn');
    const closeButton = (): HTMLElement => fixture.nativeElement.querySelector('[id^="file_file_"] a.pull-right');
    const isVisible = (el: HTMLElement): boolean =>
      getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;

    beforeEach(() => {
      style = document.createElement('style');
      style.textContent = BOOTSTRAP_COLLAPSE_RULE;
      document.head.appendChild(style);

      component.fileInput.canPreview = true;
      component.fileInput.format = 'text/plain';
      fixture.detectChanges();
    });

    afterEach(() => {
      style.remove();
    });

    it('renders the preview control and the panel it owns', () => {
      expect(previewButton()).withContext('Preview control did not render').not.toBeNull();
      expect(panel()).withContext('preview panel did not render').not.toBeNull();
      expect(previewButton().getAttribute('aria-controls')).toEqual(panel().id);
    });

    it('keeps the preview panel hidden until Preview is clicked', () => {
      expect(isVisible(panel()))
        .withContext(`panel is visible before any click: ${panel().outerHTML.slice(0, 120)}`)
        .toBeFalse();
      expect(previewButton().getAttribute('aria-expanded')).toEqual('false');
    });

    it('opens the preview panel when Preview is clicked', () => {
      previewButton().click();
      fixture.detectChanges();

      expect(isVisible(panel()))
        .withContext(`panel stayed hidden after clicking Preview: display=${getComputedStyle(panel()).display} height=${panel().getBoundingClientRect().height}`)
        .toBeTrue();
      expect(previewButton().getAttribute('aria-expanded')).toEqual('true');
      // the settled state Bootstrap renders, not a half-finished transition
      expect(panel().classList.contains('collapsing'))
        .withContext(`panel is still transitioning: ${panel().className}`)
        .toBeFalse();
      expect(panel().classList.contains('show')).toBeTrue();
    });

    it('opens the preview panel from the keyboard', () => {
      expect(previewButton().getAttribute('tabindex'))
        .withContext('the Preview control is not reachable with Tab')
        .toEqual('0');

      previewButton().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(isVisible(panel()))
        .withContext('Enter on the Preview control did not open the panel')
        .toBeTrue();

      expect(closeButton().getAttribute('tabindex'))
        .withContext('the close control is not reachable with Tab')
        .toEqual('0');

      closeButton().dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
      fixture.detectChanges();

      expect(isVisible(panel()))
        .withContext('Space on the close control did not collapse the panel')
        .toBeFalse();
    });

    it('closes the preview panel again from the close control', () => {
      previewButton().click();
      fixture.detectChanges();
      expect(isVisible(panel())).toBeTrue();

      closeButton().click();
      fixture.detectChanges();

      expect(isVisible(panel()))
        .withContext('panel stayed visible after clicking the close control')
        .toBeFalse();
      expect(previewButton().getAttribute('aria-expanded')).toEqual('false');
    });

    it('does not scroll the page when Space is pressed on Preview', () => {
      expect(dispatchSpaceKey(previewButton(), 'keydown').defaultPrevented).toBeTrue();
    });

    it('does not scroll the page when Space is pressed on the close control', () => {
      expect(dispatchSpaceKey(closeButton(), 'keydown').defaultPrevented).toBeTrue();
    });
  });

  describe('the controls the open panel exposes', () => {
    let en: Record<string, any>;
    let cs: Record<string, any>;
    let style: HTMLStyleElement;

    beforeEach(() => {
      style = document.createElement('style');
      style.textContent = BOOTSTRAP_COLLAPSE_RULE;
      document.head.appendChild(style);
    });

    afterEach(() => {
      style.remove();
    });

    // The real catalogues, not a stub: a stub stays green after someone drops the key, while
    // production then renders the bare key - a non-empty accessible name that axe cannot flag.
    beforeAll(async () => {
      const read = async (path: string) => {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`cannot read ${path} from the karma server: ${response.status}`);
        }
        return JSON5.parse(await response.text());
      };
      en = await read('assets/i18n/en.json5');
      cs = await read('assets/i18n/cs.json5');
    });

    const openPanel = () => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en', en);
      translate.use('en');
      component.fileInput.canPreview = true;
      component.fileInput.format = 'application/zip';
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('a.preview-btn') as HTMLElement).click();
      fixture.detectChanges();
      // axe skips hidden nodes, so a check over a collapsed panel passes whatever its colours are
      expect(getComputedStyle(fixture.nativeElement.querySelector('[id^="file_file_"]')).display)
        .withContext('the preview panel did not open')
        .not.toEqual('none');
    };

    it('keeps the close label in en.json5 and in cs.json5', () => {
      [['en', en], ['cs', cs]].forEach(([lang, catalogue]: [string, Record<string, any>]) => {
        expect(typeof catalogue[CLOSE_KEY])
          .withContext(`${CLOSE_KEY} is missing from src/assets/i18n/${lang}.json5`)
          .toEqual('string');
        expect((catalogue[CLOSE_KEY] || '').trim())
          .withContext(`${CLOSE_KEY} is empty in src/assets/i18n/${lang}.json5`)
          .not.toEqual('');
      });
    });

    it('names the close control and leaves the labelled controls alone', () => {
      openPanel();

      const close: HTMLElement = fixture.nativeElement.querySelector('[id^="file_file_"] a.pull-right');
      const name = (close.getAttribute('aria-label') || '').trim();
      expect(name)
        .withContext(`the close control has no accessible name: ${close.outerHTML.slice(0, 120)}`)
        .not.toEqual('');
      expect(name)
        .withContext(`the close control exposes an untranslated key: ${name}`)
        .not.toMatch(/^item\./);

      // WCAG 2.5.3 Label in Name: an aria-label on a control that already shows text overrides it.
      ['a.download-btn', 'a.preview-btn'].forEach((selector: string) => {
        const control: HTMLElement = fixture.nativeElement.querySelector(selector);
        expect(control.textContent.trim()).not.toEqual('');
        expect(control.getAttribute('aria-label'))
          .withContext(`${selector} shows text, so it must not carry an aria-label`)
          .toBeNull();
      });
    });

    it('reports no axe violations inside the opened panel', async () => {
      component.fileInput.fileInfo = ARCHIVE_TREE;
      openPanel();

      const results = await axe.run(fixture.nativeElement.querySelector('[id^="file_file_"]'), AXE_OPTIONS);
      const offenders = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.html).join(' | ')}`);
      expect(offenders).toEqual([]);
    });

    it('reports no axe violations inside the opened panel when the file has no preview', async () => {
      component.fileInput.fileInfo = [];
      openPanel();

      const results = await axe.run(fixture.nativeElement.querySelector('[id^="file_file_"]'), AXE_OPTIONS);
      const offenders = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.html).join(' | ')}`);
      expect(offenders).toEqual([]);
    });
  });
});
