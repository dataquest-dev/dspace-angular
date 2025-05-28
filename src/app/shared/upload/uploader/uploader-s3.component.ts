import { Component, Output, EventEmitter } from '@angular/core';
import {S3UploadService} from '../../../core/store/s3-upload.service';
import {HttpClient, HttpEventType, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, take} from 'rxjs/operators';

@Component({
  selector: 'ds-uploader-s3',
  templateUrl: './uploader-s3.component.html',
  styleUrls: ['./uploader-s3.component.scss']
})
export class UploaderS3Component {
  partSize = 5 * 1024 * 1024; // 5MB
  uploadedParts: { PartNumber: number, ETag: string }[] = [];
  uploadedCount = new BehaviorSubject<number>(0); // ✅ use BehaviorSubject for reactive updates
  selectedFile: File | null = null; // ✅ define the variable
  uploadedPartsMap = new Map<number, string>();

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
    let completed = false; // Prevent duplicate complete calls

    this.uploadSvc.initiate(file.name).subscribe(initRes => {
      const uploadId = initRes.uploadId;

      this.uploadedCount
        .pipe(
          filter(count => count === totalParts),
          take(1)
        )
        .subscribe(() => {
          if (completed) return;
          completed = true;

          // Fetch uploaded parts from the backend
          this.uploadSvc.listUploadedParts(uploadId, file.name).subscribe(serverParts => {
            // Compare with client-side parts
            const clientParts = Array.from(this.uploadedPartsMap.entries())
              .map(([PartNumber, ETag]) => ({
                PartNumber,
                ETag: ETag.replace(/"/g, '') // Normalize by removing quotes
              }))
              .sort((a, b) => a.PartNumber - b.PartNumber);

            const serverSorted = [...serverParts].sort((a, b) => a.PartNumber - b.PartNumber);

            console.log('Client parts:', clientParts);
            console.log('Server parts:', serverSorted);

            // if (JSON.stringify(serverSorted) !== JSON.stringify(clientParts)) {
            //   console.error('Mismatch between client and server parts.');
            //   return;
            // }
            console.log('here');
            // Proceed with completion
            this.uploadSvc.complete(uploadId, file.name, clientParts.map(p => ({
              partNumber: p.PartNumber,
              ETag: p.ETag
            }))) .subscribe({
              next: res => console.log('Upload complete!', res),
              error: err => console.error('Upload complete error', err)
            });
          });
        });

      for (let part = 1; part <= totalParts; part++) {
        const blob = file.slice((part - 1) * this.partSize, part * this.partSize);

        this.uploadSvc.getPresignedUrl(uploadId, part, file.name)
          .subscribe(url => {
            this.uploadPartWithXhr(url, blob, part)
              .subscribe({
                next: ({ loaded, total, etag }) => {
                  const pct = Math.round((loaded / total) * 100);
                  console.log(`Part ${part}: ${pct}%`);

                  if (etag) {
                    this.uploadedPartsMap.set(part, etag);
                    this.uploadedParts.push({ PartNumber: part, ETag: etag });
                    this.uploadedCount.next(this.uploadedCount.value + 1);
                  }
                },
                error: err => console.error(`Part ${part} error:`, err)
              });
          });
      }
    });
  }

  uploadPartWithXhr(url: string, blob: Blob, partNumber: number): Observable<{ loaded: number, total: number, etag?: string }> {
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);

      xhr.upload.onprogress = (event) => {
        observer.next({ loaded: event.loaded, total: event.total });
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, ''); // remove quotes
          observer.next({ loaded: blob.size, total: blob.size, etag });
          observer.complete();
        } else {
          observer.error(`Upload failed with status ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        observer.error('Network error during part upload');
      };

      xhr.send(blob);
    });
  }
}
