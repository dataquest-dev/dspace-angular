/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared.module';
import { FileUploadModule } from 'ng2-file-upload';
import { UploaderComponent } from './uploader/uploader.component';
import { FileDropzoneNoUploaderComponent } from './file-dropzone-no-uploader/file-dropzone-no-uploader.component';
import {S3UploadService} from '../../core/store/s3-upload.service';
import {UploaderS3Component} from './uploader/uploader-s3.component';

const COMPONENTS = [
  UploaderComponent,
  FileDropzoneNoUploaderComponent,
  UploaderS3Component
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FileUploadModule,
  ],
  declarations: [
    ...COMPONENTS,
  ],
  providers: [
    ...COMPONENTS,
    S3UploadService
  ],
  exports: [
    ...COMPONENTS,
    FileUploadModule,
  ]
})
export class UploadModule {
}
