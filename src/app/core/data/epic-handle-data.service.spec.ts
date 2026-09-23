import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { NotificationsService } from '../../shared/notifications/notifications.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { ObjectCacheService } from '../cache/object-cache.service';
import { EpicHandle } from '../epicHandle/models/epic-handle.model';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { DefaultChangeAnalyzer } from './default-change-analyzer.service';
import { EpicHandleDataService } from './epic-handle-data.service';
import { RequestService } from './request.service';

describe('EpicHandleDataService', () => {
  let service: EpicHandleDataService;
  let httpMock: HttpTestingController;
  let halService: jasmine.SpyObj<HALEndpointService>;

  const mockBaseUrl = 'http://localhost:8080/server/api/core/epichandles';
  const mockPrefix = '11148';
  const mockSuffix = 'TEST-001';
  const mockHandleId = `${mockPrefix}/${mockSuffix}`;
  const mockHandle = new EpicHandle();
  mockHandle.id = mockHandleId;
  mockHandle.url = 'http://example.com';
  mockHandle._links = { self: { href: `/server/api/core/epichandles/${mockHandleId}` } };

  beforeEach(() => {
    const halServiceSpy = jasmine.createSpyObj('HALEndpointService', ['getEndpoint']);
    const requestServiceSpy = jasmine.createSpyObj('RequestService', ['generateRequestId', 'send']);
    const rdbServiceSpy = jasmine.createSpyObj('RemoteDataBuildService', ['buildFromRequestUUID']);
    const storeSpy = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    const objectCacheSpy = jasmine.createSpyObj('ObjectCacheService', ['getObjectBySelfLink']);
    const comparatorSpy = jasmine.createSpyObj('DefaultChangeAnalyzer', ['diff']);
    const notificationsSpy = jasmine.createSpyObj('NotificationsService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        EpicHandleDataService,
        { provide: HALEndpointService, useValue: halServiceSpy },
        { provide: RequestService, useValue: requestServiceSpy },
        { provide: RemoteDataBuildService, useValue: rdbServiceSpy },
        { provide: Store, useValue: storeSpy },
        { provide: ObjectCacheService, useValue: objectCacheSpy },
        { provide: DefaultChangeAnalyzer, useValue: comparatorSpy },
        { provide: NotificationsService, useValue: notificationsSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EpicHandleDataService);
    httpMock = TestBed.inject(HttpTestingController);
    halService = TestBed.inject(HALEndpointService) as jasmine.SpyObj<HALEndpointService>;

    halService.getEndpoint.and.returnValue(of(mockBaseUrl));
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('findAll', () => {
    const mockPaginationResponse = {
      content: [mockHandle],
      pageable: {
        pageSize: 10,
        pageNumber: 0,
      },
      totalElements: 1,
      totalPages: 1,
      numberOfElements: 1,
    };

    it('should fetch all handles with pagination', (done) => {
      service.findAll({ currentPage: 1, elementsPerPage: 10 }, mockPrefix).subscribe(response => {
        expect(response.payload.page).toEqual([mockHandle]);
        expect(response.payload.pageInfo.totalElements).toBe(1);
        done();
      });

      const findAllReq = httpMock.expectOne(req =>
        req.method === 'GET' &&
        req.url === `${mockBaseUrl}/${mockPrefix}` &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '10',
      );
      findAllReq.flush(mockPaginationResponse);
    });

    it('should include URL pattern in search', (done) => {
      const urlPattern = 'example.com';

      service.findAll({ currentPage: 1, elementsPerPage: 10 }, mockPrefix, urlPattern).subscribe(() => {
        done();
      });

      const searchReq = httpMock.expectOne(req =>
        req.method === 'GET' &&
        req.url === `${mockBaseUrl}/${mockPrefix}` &&
        req.params.get('url') === urlPattern &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '10',
      );
      expect(searchReq.request.params.get('url')).toBe(urlPattern);
      searchReq.flush(mockPaginationResponse);
    });
  });

  describe('findByPrefixAndSuffix', () => {
    it('builds a namespace-aware fallback self link when _links is missing', (done) => {
      service.findByPrefixAndSuffix(mockPrefix, mockSuffix).subscribe(handle => {
        expect(handle.id).toBe(mockHandleId);
        expect(handle.url).toBe('http://example.com');
        // fallback is derived from the resolved endpoint, not a hardcoded /server/api path
        expect(handle._links.self.href).toBe(`${mockBaseUrl}/${mockHandleId}`);
        done();
      });

      const req = httpMock.expectOne(`${mockBaseUrl}/${mockPrefix}/${mockSuffix}`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: mockHandleId, url: 'http://example.com' });
    });

    it('keeps the _links returned by the backend when present', (done) => {
      const links = { self: { href: `${mockBaseUrl}/${mockHandleId}` } };

      service.findByPrefixAndSuffix(mockPrefix, mockSuffix).subscribe(handle => {
        expect(handle._links).toEqual(links);
        done();
      });

      httpMock.expectOne(`${mockBaseUrl}/${mockPrefix}/${mockSuffix}`)
        .flush({ id: mockHandleId, url: 'http://example.com', _links: links });
    });
  });
});
