import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';
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
      findById: createSuccessfulRemoteDataObject$(new Bitstream()),
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
});
