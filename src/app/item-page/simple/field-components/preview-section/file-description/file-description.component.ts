import { Component, Input, OnInit } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { BASE_LOCAL_URL } from 'src/app/core/shared/clarin/constants';

@Component({
  selector: 'ds-file-description',
  templateUrl: './file-description.component.html',
  styleUrls: ['./file-description.component.scss'],
})
export class FileDescriptionComponent implements OnInit {
  @Input()
  fileInput: MetadataBitstream;

  ngOnInit(): void {
    console.log(this.fileInput);
  }
  public downloadFiles() {
    window.location.href = `${BASE_LOCAL_URL}${this.fileInput.href}`;
  }

  public isTxt() {
    return this.fileInput?.format === 'text/plain';
  }

  /**
   * Show scrollbar in the `.txt` preview, but it should be hidden in the other formats.
   */
  public dynamicOverflow() {
    return this.isTxt() ? 'overflow: scroll' : 'overflow: hidden';
  }
}
