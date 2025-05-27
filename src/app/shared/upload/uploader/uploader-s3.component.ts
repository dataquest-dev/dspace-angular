import { Component, Output, EventEmitter } from '@angular/core';
import {S3UploadService} from '../../../core/store/s3-upload.service';
import {HttpClient, HttpEventType} from '@angular/common/http';

@Component({
  selector: 'ds-uploader-s3',
  templateUrl: './uploader-s3.component.html',
  styleUrls: ['./uploader-s3.component.scss']
})
export class UploaderS3Component {
  partSize = 5 * 1024 * 1024; // 5MB
  uploadedParts: { PartNumber: number, ETag: string }[] = [];
  uploadedCount = 0;
  selectedFile: File | null = null; // ✅ define the variable

  constructor(private uploadSvc: S3UploadService,
              private http: HttpClient) {}

  // ✅ define the method
  fileChanged(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // You can now start upload or validate the file
      console.log('File selected:', file.name);
    }
  }

  uploadFile(file: File) {
    const totalParts = Math.ceil(file.size / this.partSize);
    // 1) Initiate multipart
    this.uploadSvc.initiate(file.name).subscribe(initRes => {
      const uploadId = initRes.uploadId;
      // 2) For each part, get presigned URL and upload
      for (let part = 1; part <= totalParts; part++) {
        const start = (part - 1) * this.partSize;
        const end = Math.min(part * this.partSize, file.size);
        const blob = file.slice(start, end);

        // Get presigned URL for this part
        this.uploadSvc.getPresignedUrl(uploadId, part, file.name).subscribe(url => {
          // Upload part with progress reporting
          this.http.request('PUT', url, {
            body: blob,
            reportProgress: true,
            observe: 'events'
          }).subscribe(event => {
            if (event.type === HttpEventType.UploadProgress) {
              const pct = Math.round((event.loaded / (event.total || 1)) * 100);
              console.log(`Part ${part}: ${pct}%`);
            } else if (event.type === HttpEventType.Response) {
              // Part upload complete, record the ETag
              const eTag = event.headers.get('ETag') || '';
              console.log(`Part ${part} done, ETag ${eTag}`);
              this.uploadedParts.push({ PartNumber: part, ETag: eTag });
              this.uploadedCount++;
              // If all parts done, complete the upload
              if (this.uploadedCount === totalParts) {
                this.uploadSvc.complete(uploadId, file.name, this.uploadedParts)
                  .subscribe(res => {
                    console.log(`Upload complete, object ETag: ${res.etag}`);
                  });
              }
            }
          });
        });
      }
    });
  }
}
