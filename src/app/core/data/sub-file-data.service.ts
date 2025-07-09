import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { FileInfo } from '../metadata/file-info.model';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { SubFileResponse } from '../metadata/subfile-data.model';

@Injectable({ providedIn: 'root' })
export class SubFileDataService {
  constructor(
    protected http: HttpClient,
    protected halService: HALEndpointService
  ) {}

  /**
   * Fetch sub-files for a specific bitstream (zip/directory)
   * @param bitstreamId The ID of the bitstream containing sub-files
   * @returns Observable of FileInfo[] representing the sub-files
   */
  fetchSubFiles(bitstreamId: string): Observable<FileInfo[]> {
    return this.getSubFileEndpoint().pipe(
      map((endpoint) => this.getSubFilesRequestURL(endpoint, bitstreamId)),
      mergeMap((requestUrl) => this.http.get<SubFileResponse>(requestUrl)),
      map((data: SubFileResponse) => this.convertToFileInfo(data))
    );
  }

  /**
   * Get the base endpoint for sub-file requests
   */
  private getSubFileEndpoint(): Observable<string> {
    // This should match the endpoint defined in the backend
    return this.halService.getEndpoint('subfiles');
  }

  /**
   * Construct the complete URL for fetching sub-files
   */
  private getSubFilesRequestURL(endpoint: string, bitstreamId: string): string {
    return `${endpoint}/${bitstreamId}`;
  }

  /**
   * Convert the raw hashtable data from the API to FileInfo objects
   */
  private convertToFileInfo(data: SubFileResponse): FileInfo[] {
    const result: FileInfo[] = [];

    Object.keys(data).forEach(key => {
      const subFileData = data[key];
      const fileInfo = new FileInfo();

      // Map properties from the API response to FileInfo
      fileInfo.name = subFileData.name || key;
      fileInfo.content = subFileData.content;
      fileInfo.size = subFileData.size;
      fileInfo.isDirectory = !!subFileData.isDirectory;

      result.push(fileInfo);
    });

    return result;
  }
}
