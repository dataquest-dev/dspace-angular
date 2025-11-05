import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RESTURLCombiner } from '../../core/url-combiner/rest-url-combiner';

export interface ConfigFile {
  fileName: string;
  size: number;
  lastModified: string;
  type: string;
  _links: {
    self: { href: string };
    content: { href: string };
  };
}

export interface SaveResponse {
  success?: boolean;
  message: string;
  file?: string;
  timestamp?: string;
  backup?: string;
}

@Injectable()
export class AdminUpdateConfigService {
  private readonly apiBaseUrl: string;

  constructor(private http: HttpClient) {
    // Use DSpace's REST URL combiner to build proper backend URL
    this.apiBaseUrl = new RESTURLCombiner('admin', 'configfiles').toString();
  }

  /**
   * Get list of available configuration files from backend API
   */
  getConfigFiles(): Observable<ConfigFile[]> {
    return this.http.get<any[]>(this.apiBaseUrl).pipe(
      map(files => {
        // Transform API response to match our ConfigFile interface
        return files.map(file => ({
          fileName: file.fileName || file.name || file.id || file.identifier,
          size: file.size || 0,
          lastModified: file.lastModified || file.modified || new Date().toISOString(),
          type: file.type || 'application/xml',
          _links: file._links || {
            self: { href: `${this.apiBaseUrl}/${file.fileName || file.name || file.id || file.identifier}` },
            content: { href: `${this.apiBaseUrl}/${file.fileName || file.name || file.id || file.identifier}/content` }
          }
        }));
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  /**
   * Get content of a specific config file from backend API
   */
  getConfigFileContent(filename: string): Observable<string> {
    return this.http.get(`${this.apiBaseUrl}/${filename}/content`, {
      responseType: 'text',
      headers: new HttpHeaders({
        'Accept': 'text/plain'
      })
    });
  }

  /**
   * Save config file content to backend API
   */
  saveConfigFile(filename: string, content: string): Observable<SaveResponse> {
    return this.http.put<SaveResponse>(`${this.apiBaseUrl}/${filename}/content`, content, {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
        // Note: CSRF token should be handled automatically by Angular interceptors
      })
    });
  }



  /**
   * Reload original file content from backend API
   */
  reloadOriginalContent(filename: string): Observable<string> {
    return this.getConfigFileContent(filename);
  }

  /**
   * Get metadata for a specific config file
   */
  getConfigFile(filename: string): Observable<ConfigFile> {
    return this.http.get<ConfigFile>(`${this.apiBaseUrl}/${filename}`);
  }


}
