import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { ResourceType } from 'src/app/core/shared/resource-type';
import { FileDescriptionComponent } from './file-description.component';

describe('FileDescriptionComponent', () => {
  let component: FileDescriptionComponent;
  let fixture: ComponentFixture<FileDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileDescriptionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileDescriptionComponent);
    component = fixture.componentInstance;

    // Mock the input value
    const fileInput = new MetadataBitstream();
    fileInput.id = 123;
    fileInput.name = 'testFile';
    fileInput.description = 'test description';
    fileInput.fileSize = '5MB';
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
