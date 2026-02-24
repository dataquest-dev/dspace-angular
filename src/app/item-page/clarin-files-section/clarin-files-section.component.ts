import { Component, Input, OnInit } from '@angular/core';
import { encodeRFC3986URIComponent } from '../../shared/clarin-shared-util';
import { Item } from '../../core/shared/item.model';
import { getAllSucceededRemoteListPayload, getFirstSucceededRemoteDataPayload } from '../../core/shared/operators';
import { getItemPageRoute } from '../item-page-routing-paths';
import { MetadataBitstream } from '../../core/metadata/metadata-bitstream.model';
import { RegistryService } from '../../core/registry/registry.service';
import { Router } from '@angular/router';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { BehaviorSubject } from 'rxjs';
import { encodeRFC3986URIComponent } from '../../shared/clarin-shared-util';

@Component({
  selector: 'ds-clarin-files-section',
  templateUrl: './clarin-files-section.component.html',
  styleUrls: ['./clarin-files-section.component.scss']
})
export class ClarinFilesSectionComponent implements OnInit {

  /**
   * The item to display files for
   */
  @Input() item: Item;

  /**
   * handle of the current item
   */
  @Input() itemHandle: string;

  canShowCurlDownload = false;

  /**
   * If download by command button is click, the command line will be shown
   */
  isCommandLineVisible = false;

  /**
   * command for the download command feature
   */
  command: string;

  /**
   * determine to show download all zip button or not
   */
  canDownloadAllFiles = false;

  /**
   * total size of list of files uploaded by users to this item
   */
  totalFileSizes: BehaviorSubject<number> = new BehaviorSubject<number>(-1);

  /**
   * list of files uploaded by users to this item
   */
  listOfFiles: BehaviorSubject<MetadataBitstream[]> = new BehaviorSubject<MetadataBitstream[]>([]);

  /**
   * min file size to show `Download all ZIP` button, this value is loaded from the configuration property
   * `download.all.alert.min.file.size`
   */
  downloadZipMinFileSize: BehaviorSubject<number> = new BehaviorSubject<number>(-1);

  /**
   * max file size to show `Download all ZIP` button, this value is loaded from the configuration property
   * `download.all.limit.max.file.size`
   */
  downloadZipMaxFileSize: BehaviorSubject<number> = new BehaviorSubject<number>(-1);

  /**
   * min count of files to show `Download all ZIP` button, this value is loaded from the configuration property
   * `download.all.limit.min.file.count`
   */
  downloadZipMinFileCount: BehaviorSubject<number> = new BehaviorSubject<number>(-1);


  constructor(protected registryService: RegistryService,
              protected router: Router,
              protected halService: HALEndpointService,
              protected configurationService: ConfigurationDataService) {
  }

  ngOnInit(): void {
    this.registryService
      .getMetadataBitstream(this.itemHandle, 'ORIGINAL')
      .pipe(getAllSucceededRemoteListPayload())
      .subscribe((data: MetadataBitstream[]) => {
        this.listOfFiles.next(data);
        this.generateCurlCommand();
      });
    this.totalFileSizes.next(Number(this.item.firstMetadataValue('local.files.size')));
    this.loadDownloadZipConfigProperties();
  }

  setCommandline() {
    this.isCommandLineVisible = !this.isCommandLineVisible;
  }

  downloadFiles() {
    void this.router.navigate([getItemPageRoute(this.item), 'download', 'zip']);
  }

  generateCurlCommand() {
    const fileNames = this.listOfFiles.value.map((file: MetadataBitstream) => {
      if (file.canPreview) {
        this.canShowCurlDownload = true;
      }

      return file.name;
    });

    // Generate curl command using -o "filename" "url" pairs.
    // This avoids curl -J (Content-Disposition), which cannot create files
    // with non-ASCII characters on Windows due to code-page limitations.
    const baseUrl = `${this.halService.getRootHref()}/core/bitstreams/handle/${this.itemHandle}`;
    const parts = fileNames.map(name => {
      const url = `${baseUrl}/${encodeRFC3986URIComponent(name)}`;
      // Escape backslashes and double quotes for safe use inside double-quoted shell strings
      const safeName = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `-o "${safeName}" "${url}"`;
    });
    this.command = `curl ${parts.join(' ')}`;
  }

  loadDownloadZipConfigProperties() {
    this.configurationService.findByPropertyName('download.all.limit.min.file.count')
      .pipe(
        getFirstSucceededRemoteDataPayload()
      )
      .subscribe((config) => {
        this.downloadZipMinFileCount.next(Number(config.values[0]));
      });

    this.configurationService.findByPropertyName('download.all.limit.max.file.size')
      .pipe(
        getFirstSucceededRemoteDataPayload()
      )
      .subscribe((config) => {
        this.downloadZipMaxFileSize.next(Number(config.values[0]));
      });

    this.configurationService.findByPropertyName('download.all.alert.min.file.size')
      .pipe(
        getFirstSucceededRemoteDataPayload()
      )
      .subscribe((config) => {
        this.downloadZipMinFileSize.next(Number(config.values[0]));
      });
  }
}
