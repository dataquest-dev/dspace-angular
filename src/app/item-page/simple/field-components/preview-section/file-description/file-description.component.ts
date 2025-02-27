import { Component, Input } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { HALEndpointService } from '../../../../../core/shared/hal-endpoint.service';
import { RequestService } from '../../../../../core/data/request.service';
import { RemoteDataBuildService } from '../../../../../core/cache/builders/remote-data-build.service';

const allowedPreviewFormats = ['text/plain', 'text/html', 'application/zip', 'application/x-tar'];
@Component({
  selector: 'ds-file-description',
  templateUrl: './file-description.component.html',
  styleUrls: ['./file-description.component.scss'],
})
export class FileDescriptionComponent {
  MIME_TYPE_IMAGES_PATH = './assets/images/mime/';
  MIME_TYPE_DEFAULT_IMAGE_NAME = 'application-octet-stream.png';

  @Input()
  fileInput: MetadataBitstream;

  // Define the S3 URL and desired file name as class properties - this is temporary
  private readonly fileUrl: string = '';
  private readonly fileName: string = 'dtq-logo.png';

  constructor(protected halService: HALEndpointService,
              protected requestService: RequestService,
              protected rdbService: RemoteDataBuildService) { }

  public async downloadFile() {
    // Wait for the BE API to be ready
    // TODO
    // const requestId = this.requestService.generateRequestId();
    //
    // const url = this.halService.getRootHref() + '/api/s3/direct/download';
    // const getRequest = new GetRequest(requestId, url);
    // // Send GET request
    // this.requestService.send(getRequest);
    // Get response
    // const response = this.rdbService.buildFromRequestUUID(requestId);

    try {
      // Fetch the file
      const response = await fetch(this.fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // Set up the anchor element for download
      const a = document.createElement('a');
      a.href = blobUrl;

      // Set the file name because the file name from the S3 would not have human-readable format
      a.download = this.fileName;

      // Trigger download and clean up
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  public isTxt() {
    return this.fileInput?.format === 'text/plain';
  }

  public isHtml() {
    return this.fileInput?.format === 'text/html';
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

  handleImageError(event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.MIME_TYPE_IMAGES_PATH + this.MIME_TYPE_DEFAULT_IMAGE_NAME;
  }
}
