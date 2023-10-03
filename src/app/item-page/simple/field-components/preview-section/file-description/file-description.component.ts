import { Component, Input, OnInit } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { getBaseUrl } from '../../../../../shared/clarin-shared-util';
import { ConfigurationProperty } from '../../../../../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';

const allowedPreviewFormats = ['text/plain', 'text/html', 'application/zip'];
@Component({
  selector: 'ds-file-description',
  templateUrl: './file-description.component.html',
  styleUrls: ['./file-description.component.scss'],
})
export class FileDescriptionComponent implements OnInit {
  @Input()
  fileInput: MetadataBitstream;

  /**
   * UI URL loaded from the server.
   */
  baseUrl = '';

  constructor(protected configurationService: ConfigurationDataService) { }

  async ngOnInit(): Promise<void> {
    await this.assignBaseUrl();
  }

  public downloadFiles() {
    window.location.href = this.baseUrl.replace('/server','') + `${this.fileInput.href}`;
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

  /**
   * Supported Preview formats are: `text/plain`, `text/html`, `application/zip`
   */
  public couldPreview() {
    if (this.fileInput.canPreview === false) {
      return false;
    }

    return allowedPreviewFormats.includes(this.fileInput.format);
  }

  /**
   * Load base url from the configuration from the BE.
   */
  async assignBaseUrl() {
    this.baseUrl = await getBaseUrl(this.configurationService)
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }
}
