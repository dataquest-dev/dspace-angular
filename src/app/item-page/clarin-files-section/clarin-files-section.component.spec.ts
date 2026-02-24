import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClarinFilesSectionComponent } from './clarin-files-section.component';
import { RegistryService } from '../../core/registry/registry.service';
import { Router } from '@angular/router';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { RouterMock } from '../../shared/mocks/router.mock';
import { HALEndpointServiceStub } from '../../shared/testing/hal-endpoint-service.stub';
import { TranslateModule } from '@ngx-translate/core';
import { MetadataBitstream } from '../../core/metadata/metadata-bitstream.model';
import { ResourceType } from '../../core/shared/resource-type';
import { HALLink } from '../../core/shared/hal-link.model';
import { BehaviorSubject , of } from 'rxjs';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { Item } from '../../core/shared/item.model';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { createPaginatedList } from '../../shared/testing/utils.test';

describe('ClarinFilesSectionComponent', () => {
  let component: ClarinFilesSectionComponent;
  let fixture: ComponentFixture<ClarinFilesSectionComponent>;

  let mockRegistryService: any;
  let halService: any;

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
    bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
    metadata: {
      'local.files.size': [
        {
          language: 'en_US',
          value: '123'
        }
      ]
    }
  });

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of('123456'),
  });

  beforeEach(async () => {
    mockRegistryService = jasmine.createSpyObj('RegistryService', {
      'getMetadataBitstream': of(bitstreamStream)
    }
    );
    halService = Object.assign(new HALEndpointServiceStub('some url'), {
      getRootHref: () => ROOT_HREF
    });

    await TestBed.configureTestingModule({
      declarations: [ ClarinFilesSectionComponent ],
      imports: [
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: RegistryService, useValue: mockRegistryService },
        { provide: Router, useValue: new RouterMock() },
        { provide: HALEndpointService, useValue: halService },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],
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

    it('should generate a curl command for a single file with brace expansion', () => {
      component.itemHandle = '123456789/1';
      component.listOfFiles.next([createMetadataBitstream('simple.txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "simple.txt" "${BASE}/123456789/1{/simple.txt}"`
      );
    });

    it('should generate a curl command for multiple files with brace expansion', () => {
      component.itemHandle = '123456789/2';
      component.listOfFiles.next([
        createMetadataBitstream('file1.txt'),
        createMetadataBitstream('file2.txt'),
      ]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "file1.txt" -o "file2.txt" "${BASE}/123456789/2{/file1.txt,/file2.txt}"`
      );
    });

    it('should percent-encode spaces in URL but keep real name in -o', () => {
      component.itemHandle = '123456789/3';
      component.listOfFiles.next([createMetadataBitstream('my file.txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "my file.txt" "${BASE}/123456789/3{/my%20file.txt}"`
      );
    });

    it('should percent-encode parentheses in URL but keep real name in -o', () => {
      component.itemHandle = '123456789/4';
      component.listOfFiles.next([createMetadataBitstream('logo (2).png')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "logo (2).png" "${BASE}/123456789/4{/logo%20%282%29.png}"`
      );
    });

    it('should percent-encode plus signs in URL', () => {
      component.itemHandle = '123456789/5';
      component.listOfFiles.next([createMetadataBitstream('dtq+logo.png')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "dtq+logo.png" "${BASE}/123456789/5{/dtq%2Blogo.png}"`
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
        `curl -o "dtq+logo (2).png" -o "Screenshot 1.png" ` +
        `"${BASE}/123456789/6{/dtq%2Blogo%20%282%29.png,/Screenshot%201.png}"`
      );
    });

    it('should preserve UTF-8 characters in -o filename and encode in URL', () => {
      component.itemHandle = '123456789/9';
      component.listOfFiles.next([createMetadataBitstream('M\u00e9di\u00e1 (3).jfif')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "M\u00e9di\u00e1 (3).jfif" "${BASE}/123456789/9{/M%C3%A9di%C3%A1%20%283%29.jfif}"`
      );
    });

    it('should escape double quotes in filenames', () => {
      component.itemHandle = '123456789/10';
      component.listOfFiles.next([createMetadataBitstream('file "quoted".txt')]);
      component.generateCurlCommand();
      expect(component.command).toBe(
        `curl -o "file \\"quoted\\".txt" "${BASE}/123456789/10{/file%20%22quoted%22.txt}"`
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
        `curl -o "100% done.txt" "${BASE}/123456789/11{/100%25%20done.txt}"`
      );
    });
  });
});
