import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { Observable } from 'rxjs';

import { HALEndpointService } from '../shared/hal-endpoint.service';
import { LocaleService } from './locale.service';
import { mergeMap, scan, take } from 'rxjs/operators';

@Injectable()
export class LocaleInterceptor implements HttpInterceptor {

  constructor(
    protected halEndpointService: HALEndpointService,
    protected localeService: LocaleService,
  ) {
  }

  /**
   * Intercept method
   * @param req
   * @param next
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let newReq: HttpRequest<any>;
    return this.localeService.getLanguageCodeList(this.isNeededForEPersonLanguage(req.url))
      .pipe(
        take(1),
        scan((acc: any, value: any) => [...acc, value], []),
        mergeMap((languages) => {
          // Clone the request to add the new header.
          newReq = req.clone({
            headers: req.headers
              .set('Accept-Language', languages.toString())
          });
          // Pass on the new request instead of the original request.
          return next.handle(newReq);
        }));
  }

  /**
   * The EPerson's language is read through the root and the EPerson endpoints, so requests to them
   * can't wait for it: they would wait for themselves and block every other request.
   */
  private isNeededForEPersonLanguage(url: string): boolean {
    const root = this.halEndpointService.getRootHref();
    return url === root || url.startsWith(`${root}/eperson/epersons/`);
  }
}
