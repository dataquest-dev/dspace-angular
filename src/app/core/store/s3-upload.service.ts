import { Injectable } from '@angular/core';
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
  getPresignedUrl(
    uploadId: string,
    partNumber: number,
    key: string
  ): Observable<PresignedPart> {
    return this.http.get<PresignedPart>(
      `http://localhost:8080/server/api/upload/${uploadId}/presign`,
      { params: { partNumber: partNumber.toString(), key } }
    );
  }

  getAllPresignedUrls(uploadId: string, key: string, totalParts: number): Observable<{ partNumber: number, url: string }[]> {
    return this.http.get<{ partNumber: number, url: string }[]>(
      `http://localhost:8080/server/api/upload/${uploadId}/presign-all`,
      { params: { key, totalParts: totalParts.toString() } }
    );
  }

  getPresignedUrl2(uploadId: string, key: string) {
    return this.http.get<string>(`http://localhost:8080/server/api/upload/${uploadId}/presign`, {
      params: { key }
    });
  }

  complete(uploadId: string, key: string, parts: any[]) {
    console.log('Completing upload with parts:', parts);
    return this.http.post<CompleteResponse>('http://localhost:8080/server/api/upload/complete', { uploadId, key: 'eighty-eight/43/34/91/43349123994797340734389361345819157822', parts });
  }

  // listUploadedParts(uploadId: string, key: string): Observable<Part[]> {
  //   return this.http.get<Part[]>(`http://localhost:8080/server/api/upload/list-parts`, {
  //     params: { uploadId, key: 'eighty-eight/43/34/91/43349123994797340734389361345819157822'}
  //   });
  // }
}

export interface PresignedPart {
  partNumber: number;
  url: string;
  expiresAt: string;  // or Date if you parse it
}

export interface CompleteResponse {
  location: string;
  bucket: string;
  key: string;
  etag: string;
}
