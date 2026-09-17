import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  FileInfo,
  MetadataBitstream,
} from 'src/app/core/metadata/metadata-bitstream.model';

import { FileTreeViewComponent } from './file-tree-view.component';

describe('FileTreeViewComponent', () => {
  let component: FileTreeViewComponent;
  let fixture: ComponentFixture<FileTreeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreeViewComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileTreeViewComponent);
    component = fixture.componentInstance;

    // Mock the node input value
    const fileInfo = new FileInfo();
    fileInfo.name = 'TestFolder';
    fileInfo.isDirectory = true;
    fileInfo.size = null;
    fileInfo.content = null; // add content property
    fileInfo.sub = {
      'TestSubFolder': {
        name: 'TestSubFolder',
        isDirectory: true,
        size: null,
        content: null, // add content property
        sub: null,
      },
    };

    const metadataBitstream = new MetadataBitstream();
    metadataBitstream.fileInfo = [fileInfo];
    component.node = fileInfo;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The v7 original wrapped these expectations in waitForAsync() and never invoked the callback,
  // so nothing ran; 9-base karma uses failSpecWithNoExpectations, which turns that into a failure.
  it('should display the node name', () => {
    const nodeNameElement = fixture.debugElement.query(By.css('span')).nativeElement;
    expect(nodeNameElement.textContent).toContain('TestFolder');
  });

  it('should correctly get the keys of the sub object', () => {
    expect(component.getKeys(component.node.sub)).toEqual(['TestSubFolder']);
  });
});
