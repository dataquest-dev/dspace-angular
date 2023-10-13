import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {of as observableOf} from 'rxjs';

@Injectable()
export class HtmlContentService {
  constructor(private http: HttpClient) {}

  fetchHtmlContent(url: string) {
    // catchError -> return empty value.
    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(() => observableOf('')));
  }
}
