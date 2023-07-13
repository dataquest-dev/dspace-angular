import { Component, OnInit } from '@angular/core';
import { RegistryService } from 'src/app/core/registry/registry.service';

@Component({
  selector: 'ds-preview-section',
  templateUrl: './preview-section.component.html',
  styleUrls: ['./preview-section.component.scss']
})
export class PreviewSectionComponent implements OnInit {

  file = {
    previewImageUrl:
      'https://lindat.mff.cuni.cz/repository/xmlui/themes/UFAL/images/mime/application-x-gzip.png', // replace with your image URL
    name: 'ud-treebanks-v2.12.tgz',
    size: '497.82 MB',
    format: 'application/x-gzip',
    description: 'Treebank data',
    md5: 'afb7546d9591a82f372686bcc100db52',
  };

  fileList: any[] = []; // Modified

  isPreviewVisible = false;

  constructor(protected registryService: RegistryService) {} // Modified

  ngOnInit(): void {
    this.registryService
      .getMetadataBitstream('123456789/36', 'ORIGINAL,TEXT,THUMBNAIL')
      .subscribe(
        (remoteData: any) => {
          console.log('Received data:', remoteData);
          // if (
          //   remoteData &&
          //   remoteData._embedded &&
          //   remoteData._embedded.metadatabitstreams
          // ) {
          //   this.fileList = this.parseFiles(
          //     remoteData._embedded.metadatabitstreams[0].fileInfo
          //   );
          // }
        },
        (error: any) => {
          console.log('Received error:', error);
        }
      );
  }

  // togglePreview() {
  //   this.isPreviewVisible = !this.isPreviewVisible;
  // }

  // parseFiles(files: any[]): any[] {
  //   let parsedFiles: any[] = [];
  //   for (let file of files) {
  //     let parsedFile: any = {};
  //     parsedFile.name = file.name;
  //     parsedFile.size = file.size;
  //     parsedFile.isDirectory = file.isDirectory;
  //     if (file.isDirectory && file.sub) {
  //       parsedFile.sub = this.parseFiles(Object.values(file.sub));
  //     }
  //     parsedFiles.push(parsedFile);
  //   }
  //   return parsedFiles;
  // }
}
