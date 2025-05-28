// no-s3-headers.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class NoS3CredsInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.includes('s3.cl4.du.cesnet.cz')) {
      // remove every header except the minimal
      let headers = req.headers
        .delete('Authorization')
        .delete('X-Correlation-Id')
        .delete('X-Referrer')
        .delete('Accept-Language')
        .delete('Referer');  // safe to remove, not needed by S3

      // if you signed for a specific content-type, keep just that:
      const contentType = req.headers.get('Content-Type');
      headers = headers.delete('Content-Type');
      if (contentType) {
        headers = headers.set('Content-Type', contentType);
      }

      const cleanReq = req.clone({
        headers,
        withCredentials: false    // explicitly zero out credentials
      });

      return next.handle(cleanReq);
    }

    return next.handle(req);
  }
}
