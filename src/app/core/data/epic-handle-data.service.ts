import { Injectable } from '@angular/core';
import { RequestService } from './request.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { Store } from '@ngrx/store';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { ObjectCacheService } from '../cache/object-cache.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { catchError, map, mergeMap, Observable, throwError } from 'rxjs';
import { RemoteData } from './remote-data';
import { CoreState } from '../core-state.model';
import { FindListOptions } from './find-list-options.model';
import { isNotEmpty } from 'src/app/shared/empty.util';
import { DeleteRequest, PostRequest, PutRequest } from './request.models';
import { PageInfo } from '../shared/page-info.model';
import { EpicHandle } from '../epicHandle/models/epic-handle.model';
export interface EpicHandleResponse {
    payload: {
      page: EpicHandle[];
      pageInfo: PageInfo;
    }
}

export interface SpringBootPageable {
  offset: number;
  pageSize: number;
  pageNumber: number;
}

export interface EpicHandleSearchResponse {
  content: Array<EpicHandle>;
  pageable: SpringBootPageable
  last: boolean;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
}

/**
 * A service responsible for fetching/sending data from/to the REST API on the metadatafields endpoint
 */
@Injectable({
  providedIn: 'root',
})
export class EpicHandleDataService {
  private linkPath = 'epichandles';

  constructor(
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected store: Store<CoreState>,
    protected halService: HALEndpointService,
    protected objectCache: ObjectCacheService,
    protected http: HttpClient,
    protected notificationsService: NotificationsService) {
  }

  findAll(options: FindListOptions, prefix: string, urlPattern?: string, totalElements?: number,): Observable<EpicHandleResponse> {
    return this.halService.getEndpoint(this.linkPath).pipe(
      map(baseUrl => {
        const url = `${baseUrl}/${prefix}`;
        let params = new HttpParams();
        if (isNotEmpty(urlPattern)) {
          params = params.set('url', urlPattern);
        }

        if (options.currentPage !== undefined) {
          params = params.set('page', String(options.currentPage - 1));
        }

        if (options.elementsPerPage !== undefined) {
          params = params.set('size', String(options.elementsPerPage));
        }

        if (totalElements) {
          params = params.set('totalElements', String(totalElements));
        }

        return { url, params };
      }),
      mergeMap(({ url, params }) => {
        return this.http.get<EpicHandleSearchResponse>(url, { params });
      }),
      map(response => {
        const handles: EpicHandle[] = response.content || [];
        const pageInfo = new PageInfo({
          elementsPerPage: response.pageable?.pageSize || options.elementsPerPage || 10,
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          currentPage: (response.pageable?.pageNumber || 0) + 1
        });


        return {
          payload: {
            page: handles,
            pageInfo: pageInfo,
          }
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  create(
    prefix: string,
    url: string,
    subPrefix?: string,
    subSuffix?: string,
  ): Observable<RemoteData<EpicHandle>> {
    return this.halService.getEndpoint('epichandles').pipe(
      map(baseUrl => {
        const endpoint = `${baseUrl}/${prefix}`;
        let params = new HttpParams().set('url', url);

        if (isNotEmpty(subPrefix)) {
          params = params.set('prefix', subPrefix);
        }
        if (isNotEmpty(subSuffix)) {
          params = params.set('suffix', subSuffix);
        }

        return { endpoint, params };
      }), mergeMap(({ endpoint, params }) => {
        const requestId = this.requestService.generateRequestId();
        const fullUrl = `${endpoint}?${params.toString()}`;
        const request = new PostRequest(requestId, fullUrl, null);
        this.requestService.send(request);

        return this.rdbService.buildFromRequestUUID<EpicHandle>(requestId);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  update(
    prefix: string,
    suffix: string,
    url: string
  ): Observable<RemoteData<EpicHandle>> {
    return this.halService.getEndpoint('epichandles').pipe(
      map(baseUrl => {
        const endpoint = `${baseUrl}/${prefix}/${suffix}`;
        const params = new HttpParams().set('url', url);
        return { endpoint, params };
      }),
      mergeMap(({ endpoint, params }) => {
        const requestId = this.requestService.generateRequestId();
        const fullUrl = `${endpoint}?${params.toString()}`;
        const request = new PutRequest(requestId, fullUrl, null);
        this.requestService.send(request);
        return this.rdbService.buildFromRequestUUID<EpicHandle>(requestId);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
  delete(prefix: string, suffix: string): Observable<RemoteData<any>> {
    return this.halService.getEndpoint('epichandles').pipe(
      map(baseUrl => `${baseUrl}/${prefix}/${suffix}`),
      mergeMap(url => {
        const requestId = this.requestService.generateRequestId();
        const request = new DeleteRequest(requestId, url);
        this.requestService.send(request);
        return this.rdbService.buildFromRequestUUID(requestId);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  deleteByHandleId(handleId: string): Observable<RemoteData<any>> {
    const parts = handleId.split('/');
    if (parts.length !== 2) {
      throw new Error('Invalid handle ID format. Expected: prefix/suffix');
    }
    return this.delete(parts[0], parts[1]);
  }


  findByPrefixAndSuffix(prefix: string, suffix: string): Observable<EpicHandle> {
    // we search for the handle using the prefix and suffix
    return this.halService.getEndpoint('epichandles').pipe(
      mergeMap(baseUrl => this.http.get<{id: string; url: string; _links?: any}>(`${baseUrl}/${prefix}/${suffix}`).pipe(
        map(response => {
          const handle = new EpicHandle();
          handle.id = response.id;
          handle.url = response.url;
          // Fall back to the resolved REST endpoint (namespace-aware) rather than a hardcoded /server path
          handle._links = response._links || {
            self: { href: `${baseUrl}/${response.id}` },
          };
          return handle;
        }),
      )),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

}
