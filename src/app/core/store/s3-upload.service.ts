import { Injectable } from '@angular/core';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  Part
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

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
    console.log('Completing upload with parts:', parts);
    return this.http.post<CompleteResponse>('http://localhost:8080/server/api/upload/complete', { uploadId, key: 'eighty-eight/43/34/91/43349123994797340734389361345819157822', parts });
  }

  listUploadedParts(uploadId: string, key: string): Observable<Part[]> {
    return this.http.get<Part[]>(`http://localhost:8080/server/api/upload/list-parts`, {
      params: { uploadId, key: 'eighty-eight/43/34/91/43349123994797340734389361345819157822'}
    });
  }
}

export interface CompleteResponse {
  location: string;
  bucket: string;
  key: string;
  etag: string;
}
