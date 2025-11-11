import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { ResourceType } from 'src/app/core/shared/resource-type';
import { FileDescriptionComponent } from './file-description.component';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/remote-data.utils';
import { ConfigurationProperty } from '../../../../../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateLoaderMock } from '../../../../../shared/mocks/translate-loader.mock';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HALEndpointService } from '../../../../../core/shared/hal-endpoint.service';
import { FileSizePipe } from '../../../../../shared/utils/file-size-pipe';
import { BitstreamDataService } from '../../../../../core/data/bitstream-data.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { AuthorizationDataService } from '../../../../../core/data/feature-authorization/authorization-data.service';
import { FileService } from '../../../../../core/shared/file.service';
import { AuthServiceStub } from '../../../../../shared/testing/auth-service.stub';
import { FileServiceStub } from '../../../../../shared/testing/file-service.stub';
import { AuthorizationDataServiceStub } from '../../../../../shared/testing/authorization-service.stub';
import { Bitstream } from '../../../../../core/shared/bitstream.model';


describe('FileDescriptionComponent', () => {
  let component: FileDescriptionComponent;
  let fixture: ComponentFixture<FileDescriptionComponent>;
  let halService: HALEndpointService;
  let bitstreamDataService: BitstreamDataService;

  beforeEach(async () => {
    const configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'test',
        values: [
          'org.dspace.ctask.general.ProfileFormats = test'
        ]
      }))
    });

    halService = jasmine.createSpyObj('authService', {
      getRootHref: 'root url',
    });

    bitstreamDataService = jasmine.createSpyObj('bitstreamDataService', {
      findById: createSuccessfulRemoteDataObject$(new Bitstream()),
    });

    await TestBed.configureTestingModule({
        imports: [TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock
          }
        }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule],
      declarations: [FileDescriptionComponent, FileSizePipe],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationDataService },
        { provide: HALEndpointService, useValue: halService },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: FileService, useClass: FileServiceStub },
        { provide: AuthorizationDataService, useClass: AuthorizationDataServiceStub },
        { provide: BitstreamDataService, useValue: bitstreamDataService },
      ]
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
      By.css('.file-content dd')
    ).nativeElement;
    expect(fileNameElement.textContent).toContain('testFile');
  });
});
