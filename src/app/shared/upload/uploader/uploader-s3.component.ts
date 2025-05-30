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
    let completed = false;

    this.uploadSvc.initiate(file.name).subscribe(initRes => {
      const uploadId = initRes.uploadId;

      // Complete when we've seen all parts succeed
      this.uploadedCount
        .pipe(filter(c => c === totalParts), take(1))
        .subscribe(() => {
          if (completed) return;
          completed = true;

          const parts = Array.from(this.uploadedPartsMap.entries())
            .map(([PartNumber, ETag]) => ({
              partNumber: PartNumber,
              ETag: ETag.replace(/"/g, '')
            }))
            .sort((a, b) => a.partNumber - b.partNumber);

          this.uploadSvc.complete(uploadId, file.name, parts).subscribe(
            res => console.log('Upload complete!', res),
            err => console.error('Complete error', err)
          );
        });

      // 1) Get all presigned URLs up front
      this.uploadSvc.getAllPresignedUrls(uploadId, file.name, totalParts)
        .subscribe(presignedParts => {
          const presignedMap = new Map<number, string>();
          for (const p of presignedParts) {
            presignedMap.set(p.partNumber, p.url);
          }

          // 2) Kick off each part upload with retry logic
          for (let part = 1; part <= totalParts; part++) {
            const start = (part - 1) * this.partSize;
            const blob = file.slice(start, start + this.partSize);
            const initialUrl = presignedMap.get(part)!;

            this.retryUploadPart(
              uploadId,
              file.name,
              blob,
              part,
              initialUrl,
              30
            ).subscribe({
              next: ({ etag, loaded, total }) => {
                const pct = Math.round((loaded / total) * 100);
                console.log(`Part ${part}: ${pct}%`);
                if (etag) {
                  this.uploadedPartsMap.set(part, etag);
                  this.uploadedCount.next(this.uploadedCount.value + 1);
                }
              },
              error: err => console.error(`Part ${part} failed:`, err)
            });
          }
        });
    });
  }

  /**
   * Attempts to PUT `blob` to S3. On failure, retries up to `retries` times,
   * fetching a fresh presigned URL only when retrying (not on the first try).
   */
  retryUploadPart(
    uploadId: string,
    key: string,
    blob: Blob,
    partNumber: number,
    initialUrl: string,
    retries: number
  ): Observable<{ loaded: number; total: number; etag?: string }> {
    return new Observable(observer => {
      let attemptCount = 0;
      let currentUrl = initialUrl;

      const tryOnce = () => {
        attemptCount++;
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', currentUrl, true);

        xhr.upload.onprogress = (e) =>
          observer.next({ loaded: e.loaded, total: e.total });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '');
            observer.next({ loaded: blob.size, total: blob.size, etag });
            observer.complete();
          } else {
            handleFailure(`status ${xhr.status}`);
          }
        };

        xhr.onerror = () => handleFailure('network error');

        xhr.send(blob);
      };

      const handleFailure = (reason: string) => {
        if (attemptCount <= retries) {
          const delayMs = Math.pow(2, attemptCount) * 1000;
          console.warn(`Part ${partNumber} fail (${reason}), retry ${attemptCount}/${retries} in ${delayMs}ms`);

          // Fetch the new PresignedPart object, then retry
          this.uploadSvc
            .getPresignedUrl(uploadId, partNumber, key)   // now returns PresignedPart
            .pipe(take(1))
            .subscribe({
              next: (part: { partNumber: number; url: string; expiresAt: string }) => {
                currentUrl = part.url;
                setTimeout(tryOnce, delayMs);
              },
              error: (err) => {
                observer.error(`Could not refresh presigned URL: ${err}`);
              }
            });
        } else {
          observer.error(`Part ${partNumber} failed after ${retries} retries (${reason})`);
        }
      };

      // start the very first attempt immediately
      tryOnce();
    });
  }
}
