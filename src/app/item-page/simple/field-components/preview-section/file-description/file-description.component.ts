import { Component, Input, OnInit } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { HALEndpointService } from '../../../../../core/shared/hal-endpoint.service';
import { Router } from '@angular/router';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import {getFirstCompletedRemoteData, getFirstSucceededRemoteData} from '../../../../../core/shared/operators';
import {BitstreamDataService} from "../../../../../core/data/bitstream-data.service";
import {Bitstream} from "../../../../../core/shared/bitstream.model";
import {RemoteData} from "../../../../../core/data/remote-data";
import {followLink} from "../../../../../shared/utils/follow-link-config.model";

const allowedPreviewFormats = ['text/plain', 'text/html', 'application/zip', 'application/x-tar'];
@Component({
  selector: 'ds-file-description',
  templateUrl: './file-description.component.html',
  styleUrls: ['./file-description.component.scss'],
})
export class FileDescriptionComponent implements OnInit {
  MIME_TYPE_IMAGES_PATH = './assets/images/mime/';
  MIME_TYPE_DEFAULT_IMAGE_NAME = 'application-octet-stream.png';

  @Input()
  fileInput: MetadataBitstream;

  emailToContact: string;
  content_url: string;
  thumbnail_url: string;

  constructor(protected halService: HALEndpointService,
              private router: Router,
              private bitstreamService: BitstreamDataService,
              private configService: ConfigurationDataService) { }

  ngOnInit(): void {
    this.configService.findByPropertyName('lr.help.mail')
      .pipe(getFirstSucceededRemoteData())
      .subscribe(remoteData => {
      this.emailToContact = remoteData?.payload?.values?.[0];
    });
    this.bitstreamService.findById(this.fileInput.id, true, false, followLink('thumbnail'))
      .pipe(getFirstCompletedRemoteData())
      .subscribe((remoteData : RemoteData<Bitstream>) => {
        if (remoteData.hasSucceeded) {
          this.content_url = remoteData.payload?._links.content.href;
          remoteData.payload?.thumbnail.subscribe((thumbnailRD : RemoteData<Bitstream>) => {
            if (thumbnailRD.hasSucceeded) {
              this.thumbnail_url = thumbnailRD.payload?._links.content.href;
            }
          });
        }
      });
  }

  public downloadFile() {
    void this.router.navigateByUrl('bitstreams/' + this.fileInput.id + '/download');
  }

  public hasThumbnail() {
    return this.thumbnail_url !== undefined && this.thumbnail_url !== null;
  }

  public thubmnailLink() {
    return this.thumbnail_url;
  }

  public contentLink() {
    return this.content_url;
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

  isArchive(format: string): boolean {
    return format === 'application/zip' || format === 'application/x-tar';
  }

  hasNoPreview() {
    // this.fileInput.fileInfo.length === 0 means that the file has no preview
    return this.fileInput?.fileInfo?.length === 0;
  }
}
