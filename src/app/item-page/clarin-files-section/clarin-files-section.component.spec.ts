import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  of,
} from 'rxjs';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { MetadataBitstream } from '../../core/metadata/metadata-bitstream.model';
import { RegistryService } from '../../core/registry/registry.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { HALLink } from '../../core/shared/hal-link.model';
import { Item } from '../../core/shared/item.model';
import { ItemRequest } from '../../core/shared/item-request.model';
import { ResourceType } from '../../core/shared/resource-type';
import { RouterMock } from '../../shared/mocks/router.mock';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { HALEndpointServiceStub } from '../../shared/testing/hal-endpoint-service.stub';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { ClarinLicenseInfoComponent } from '../clarin-license-info/clarin-license-info.component';
import { getItemPageRoute } from '../item-page-routing-paths';
import { PreviewSectionComponent } from '../simple/field-components/preview-section/preview-section.component';
import { ClarinFilesSectionComponent } from './clarin-files-section.component';

describe('ClarinFilesSectionComponent', () => {
  let component: ClarinFilesSectionComponent;
  let fixture: ComponentFixture<ClarinFilesSectionComponent>;

  let mockRegistryService: any;
  let halService: any;
  let router: RouterMock;
  let route: { snapshot: { data: { itemRequest?: ItemRequest } } };

  const ROOT_HREF = 'http://localhost:8080/server/api';

  function createMetadataBitstream(name: string, canPreview: boolean = true): MetadataBitstream {
    const bs = new MetadataBitstream();
    bs.id = '70ccc608-f6a5-4c96-ab2d-53bc56ae8ebe';
    bs.name = name;
    bs.description = 'test';
    bs.fileSize = 1024;
    bs.checksum = 'abc';
    bs.type = new ResourceType('item');
    bs.fileInfo = [];
    bs.format = 'text';
    bs.canPreview = canPreview;
    bs._links = {
      self: new HALLink(),
      schema: new HALLink(),
    };
    bs._links.self.href = '';
    bs._links.schema.href = '';
    return bs;
  }

  // Set up the mock service's getMetadataBitstream method to return a simple stream
  const metadatabitstream = createMetadataBitstream('test', false);
  const metadataBitstreams: MetadataBitstream[] = [metadatabitstream];
  const bitstreamStream = new BehaviorSubject(metadataBitstreams);

  const mockItem: Item = Object.assign(new Item(), {
    uuid: 'item-with-files',
    bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
    metadata: {
      'local.files.size': [
        {
          language: 'en_US',
          value: '123',
        },
      ],
    },
  });

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: createSuccessfulRemoteDataObject$({ values: ['123456'] }),
  });

  beforeEach(async () => {
    mockRegistryService = jasmine.createSpyObj('RegistryService', {
      getMetadataBitstream: of(bitstreamStream),
    });
    halService = Object.assign(new HALEndpointServiceStub('some url'), {
      getRootHref: () => ROOT_HREF,
    });
    router = new RouterMock();
    route = { snapshot: { data: {} } };

    await TestBed.configureTestingModule({
      imports: [
        ClarinFilesSectionComponent,
        NgbModalModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: RegistryService, useValue: mockRegistryService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: HALEndpointService, useValue: halService },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],
    })
      .overrideComponent(ClarinFilesSectionComponent, {
        remove: { imports: [ClarinLicenseInfoComponent, PreviewSectionComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClarinFilesSectionComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('generateCurlCommand', () => {
    const BASE = `${ROOT_HREF}/core/bitstreams/handle`;

    it('should generate a curl command for a single file', () => {
      component.itemHandle = '123456789/1';
      component.listOfFiles.next([createMetadataBitstream('simple.txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "simple.txt" "${BASE}/123456789/1?filename=simple.txt"`,
      );
    });

    it('should generate a curl command for multiple files', () => {
      component.itemHandle = '123456789/2';
      component.listOfFiles.next([
        createMetadataBitstream('file1.txt'),
        createMetadataBitstream('file2.txt'),
      ]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "file1.txt" "${BASE}/123456789/2?filename=file1.txt" ` +
        `-o "file2.txt" "${BASE}/123456789/2?filename=file2.txt"`,
      );
    });

    it('should percent-encode spaces in URL but keep real name in -o', () => {
      component.itemHandle = '123456789/3';
      component.listOfFiles.next([createMetadataBitstream('my file.txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "my file.txt" "${BASE}/123456789/3?filename=my%20file.txt"`,
      );
    });

    it('should percent-encode parentheses in URL but keep real name in -o', () => {
      component.itemHandle = '123456789/4';
      component.listOfFiles.next([createMetadataBitstream('logo (2).png')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "logo (2).png" "${BASE}/123456789/4?filename=logo%20%282%29.png"`,
      );
    });

    it('should percent-encode plus signs in URL', () => {
      component.itemHandle = '123456789/5';
      component.listOfFiles.next([createMetadataBitstream('dtq+logo.png')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "dtq+logo.png" "${BASE}/123456789/5?filename=dtq%2Blogo.png"`,
      );
    });

    it('should handle mixed special characters in multiple files', () => {
      component.itemHandle = '123456789/6';
      component.listOfFiles.next([
        createMetadataBitstream('dtq+logo (2).png'),
        createMetadataBitstream('Screenshot 1.png'),
      ]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "dtq+logo (2).png" "${BASE}/123456789/6?filename=dtq%2Blogo%20%282%29.png" ` +
        `-o "Screenshot 1.png" "${BASE}/123456789/6?filename=Screenshot%201.png"`,
      );
    });

    it('should preserve UTF-8 characters in -o filename and encode in URL', () => {
      component.itemHandle = '123456789/9';
      component.listOfFiles.next([createMetadataBitstream('M\u00e9di\u00e1 (3).jfif')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "M\u00e9di\u00e1 (3).jfif" "${BASE}/123456789/9?filename=M%C3%A9di%C3%A1%20%283%29.jfif"`,
      );
    });

    it('should escape double quotes in filenames', () => {
      component.itemHandle = '123456789/10';
      component.listOfFiles.next([createMetadataBitstream('file "quoted".txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "file \\"quoted\\".txt" "${BASE}/123456789/10?filename=file%20%22quoted%22.txt"`,
      );
    });

    it('should set canShowCurlDownload to true when any file canPreview', () => {
      component.canShowCurlDownload = false;
      component.itemHandle = '123456789/7';
      component.listOfFiles.next([createMetadataBitstream('file.txt', true)]);
      component.generateCurlCommand();
      expect(component.canShowCurlDownload).toBeTrue();
    });

    it('should not set canShowCurlDownload for non-previewable files', () => {
      component.canShowCurlDownload = false;
      component.itemHandle = '123456789/8';
      component.listOfFiles.next([createMetadataBitstream('file.txt', false)]);
      component.generateCurlCommand();
      expect(component.canShowCurlDownload).toBeFalse();
    });

    it('should handle filenames containing a literal percent sign', () => {
      component.itemHandle = '123456789/11';
      component.listOfFiles.next([createMetadataBitstream('100% done.txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "100% done.txt" "${BASE}/123456789/11?filename=100%25%20done.txt"`,
      );
    });

    it('should handle complex filename with diacritics, plus, hash, and unmatched paren', () => {
      component.itemHandle = '123456789/12';
      component.listOfFiles.next([createMetadataBitstream('M\u00e9di\u00e1 (+)\u00239) ano')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "M\u00e9di\u00e1 (+)\u00239) ano" "${BASE}/123456789/12?filename=M%C3%A9di%C3%A1%20%28%2B%29%239%29%20ano"`,
      );
    });

    it('should reset canShowCurlDownload when called again with non-previewable files', () => {
      component.itemHandle = '123456789/13';
      component.listOfFiles.next([createMetadataBitstream('file.txt', true)]);
      component.generateCurlCommand();
      expect(component.canShowCurlDownload).toBeTrue();
      // Now call again with non-previewable files
      component.listOfFiles.next([createMetadataBitstream('file.txt', false)]);
      component.generateCurlCommand();
      expect(component.canShowCurlDownload).toBeFalse();
    });

    it('should escape dollar signs and backticks in filenames for shell safety', () => {
      component.itemHandle = '123456789/14';
      component.listOfFiles.next([createMetadataBitstream('price$100.txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "price\\$100.txt" "${BASE}/123456789/14?filename=price%24100.txt"`,
      );
    });

    it('should send the file name as the filename query parameter, not as a path segment', () => {
      const name = 'a "b" & c=d?e/f+g.txt';
      component.itemHandle = '123456789/15';
      component.listOfFiles.next([createMetadataBitstream(name)]);
      component.generateCurlCommand();

      const url = new URL(component.command.match(/"(http[^"]+)"$/)[1]);
      expect(url.pathname).toBe(`${new URL(BASE).pathname}/123456789/15`);
      expect(Array.from(url.searchParams.keys())).toEqual(['filename']);
      expect(url.searchParams.get('filename')).toBe(name);
    });
  });

  describe('downloadFiles', () => {
    const zipRoute = (): string[] => [getItemPageRoute(mockItem), 'download', 'zip'];
    const approvedRequest = (allfiles: boolean) => Object.assign(new ItemRequest(), {
      acceptRequest: true,
      accessExpired: false,
      allfiles,
      accessToken: 'approved-token',
    });

    it('should open the ZIP download without a token when the route has none', () => {
      component.downloadFiles();
      expect(router.navigate).toHaveBeenCalledWith(zipRoute(), { queryParams: {} });
    });

    it('should carry a token that was granted for all files to the ZIP download', () => {
      route.snapshot.data.itemRequest = approvedRequest(true);
      component.downloadFiles();
      expect(router.navigate).toHaveBeenCalledWith(zipRoute(), { queryParams: { accessToken: 'approved-token' } });
    });

    it('should not carry a token that was granted for one file only to the ZIP download', () => {
      route.snapshot.data.itemRequest = approvedRequest(false);
      component.downloadFiles();
      expect(router.navigate).toHaveBeenCalledWith(zipRoute(), { queryParams: {} });
    });
  });
});
