import { Injectable } from '@angular/core';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class S3UploadService {
  constructor(private http: HttpClient) {}
  initiate(fileName: string) {
    return this.http.post<{uploadId: string, key: string}>('http://localhost:8080/server/api/upload/initiate', null, { params: { fileName } });
  }
  getPresignedUrl(uploadId: string, partNumber: number, key: string) {
    return this.http.get<string>(`http://localhost:8080/server/api/upload/${uploadId}/presign`, {
      params: { partNumber: partNumber.toString(), key }
    });
  }
  complete(uploadId: string, key: string, parts: any[]) {
    return this.http.post<CompleteResponse>('http://localhost:8080/server/api/upload/complete', { uploadId, key, parts });
  }
}

export interface CompleteResponse {
  location: string;
  bucket: string;
  key: string;
  etag: string;
}
