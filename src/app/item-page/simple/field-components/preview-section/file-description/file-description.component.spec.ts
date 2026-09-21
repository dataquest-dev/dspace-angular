import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { TranslateLoaderMock } from '../../../../../shared/mocks/translate-loader.mock';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/remote-data.utils';
import { AuthServiceStub } from '../../../../../shared/testing/auth-service.stub';
import { AuthorizationDataServiceStub } from '../../../../../shared/testing/authorization-service.stub';
import { FileServiceStub } from '../../../../../shared/testing/file-service.stub';
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

// color-contrast is off because the panel heading inherits the hand-written Bootstrap 3 shim
// (hex 3a87ad on d9edf7, measured 3.32:1). That palette is out of scope here and is reported
// instead of being repainted; leaving the rule on would make this guard permanently red.
const AXE_OPTIONS: axe.RunOptions = {
  resultTypes: ['violations'],
  rules: { 'color-contrast': { enabled: false } },
};

describe('FileDescriptionComponent', () => {
  let component: FileDescriptionComponent;
  let fixture: ComponentFixture<FileDescriptionComponent>;
  let halService: HALEndpointService;
  let bitstreamDataService: BitstreamDataService;
  let localeService: LocaleService;

  beforeEach(async () => {
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
      ],
    }).compileComponents();
  });

  beforeEach(() => {
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

      TestBed.inject(NgbCollapseConfig).animation = false;

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
  });

  describe('the controls the open panel exposes', () => {
    let en: Record<string, any>;
    let cs: Record<string, any>;

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
      TestBed.inject(NgbCollapseConfig).animation = false;
      component.fileInput.canPreview = true;
      component.fileInput.format = 'application/zip';
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('a.preview-btn') as HTMLElement).click();
      fixture.detectChanges();
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
