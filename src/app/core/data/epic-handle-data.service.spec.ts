import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EpicHandleDataService } from './epic-handle-data.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { RequestService } from './request.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { ObjectCacheService } from '../cache/object-cache.service';
import { DefaultChangeAnalyzer } from './default-change-analyzer.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { of } from 'rxjs';
import { EpicHandle } from '../epicHandle/models/epic-handle.model';

describe('EpicHandleDataService',()=>{
    let service: EpicHandleDataService;
    let httpMock: HttpTestingController;
    let halService: jasmine.SpyObj<HALEndpointService>;
    let requestService: jasmine.SpyObj<RequestService>;
    let rdbService: jasmine.SpyObj<RemoteDataBuildService>;

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
          imports: [HttpClientTestingModule],
          providers: [
            EpicHandleDataService,
            { provide: HALEndpointService, useValue: halServiceSpy },
            { provide: RequestService, useValue: requestServiceSpy },
            { provide: RemoteDataBuildService, useValue: rdbServiceSpy },
            { provide: Store, useValue: storeSpy },
            { provide: ObjectCacheService, useValue: objectCacheSpy },
            { provide: DefaultChangeAnalyzer, useValue: comparatorSpy },
            { provide: NotificationsService, useValue: notificationsSpy}
          ],
        });

        service = TestBed.inject(EpicHandleDataService);
        httpMock = TestBed.inject(HttpTestingController);
        halService = TestBed.inject(HALEndpointService) as jasmine.SpyObj<HALEndpointService>;
        requestService = TestBed.inject(RequestService) as jasmine.SpyObj<RequestService>;
        rdbService = TestBed.inject(RemoteDataBuildService) as jasmine.SpyObj<RemoteDataBuildService>;

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
          pageNumber: 0
        },
        totalElements: 1,
        totalPages: 1,
        numberOfElements: 1
      };

      it('should fetch all handles with pagination', (done) => {
        service.findAll({ currentPage: 1, elementsPerPage: 10}, mockPrefix).subscribe(response => {
          expect(response.payload.page).toEqual([mockHandle]);
          expect(response.payload.pageInfo.totalElements).toBe(1);
          done();
        });

        const findAllReq = httpMock.expectOne(req =>
          req.method === 'GET' &&
          req.url === `${mockBaseUrl}/${mockPrefix}` &&
          req.params.get('page') === '0' &&
          req.params.get('size') === '10'
        );
        findAllReq.flush(mockPaginationResponse);
      });

      it('should include URL pattern in search', (done) => {
        const urlPattern = 'example.com';

        service.findAll({ currentPage: 1, elementsPerPage: 10}, mockPrefix, urlPattern).subscribe(response => {
          done();
        });

        const searchReq = httpMock.expectOne(req =>
          req.method === 'GET' &&
          req.url === `${mockBaseUrl}/${mockPrefix}` &&
          req.params.get('url') === urlPattern &&
          req.params.get('page') === '0' &&
          req.params.get('size') === '10'
        );
        searchReq.flush(mockPaginationResponse);
      });
    });
});
