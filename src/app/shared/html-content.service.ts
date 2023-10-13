import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class HtmlContentService {
  constructor(private http: HttpClient) {}

  fetchHtmlContent(url: string) {
    return this.http.get(url, { responseType: 'text' });
  }
}
