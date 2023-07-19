import { Component, Input, OnInit } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';

@Component({
  selector: 'ds-file-description',
  templateUrl: './file-description.component.html',
  styleUrls: ['./file-description.component.scss'],
})
export class FileDescriptionComponent implements OnInit {
  @Input()
  fileInput: MetadataBitstream;

  ngOnInit(): void {
    console.log('fileInput', this.fileInput);
  }

  public downloadFiles() {
    //window.location.href = `http://localhost:8080${this.fileInput}`
    window.location.href = 'http://localhost:8080/server/bitstream/handle/123456789/1128/Folder1.zip?sequence=1&isAllowed=y';
  }
}
