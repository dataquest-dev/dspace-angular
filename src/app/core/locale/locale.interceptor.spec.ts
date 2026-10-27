import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { DspaceRestService } from '../dspace-rest/dspace-rest.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { RestRequestMethod } from '../data/rest-request-method';
import { LocaleService } from './locale.service';
import { LocaleInterceptor } from './locale.interceptor';
import { of } from 'rxjs';

describe(`LocaleInterceptor`, () => {
  let service: DspaceRestService;
  let httpMock: HttpTestingController;
  let localeService: any;

  const languageList = ['en;q=1', 'it;q=0.9', 'de;q=0.8', 'fr;q=0.7'];

  const mockLocaleService = jasmine.createSpyObj('LocaleService', {
    getCurrentLanguageCode: jasmine.createSpy('getCurrentLanguageCode'),
    getLanguageCodeList: of(languageList)
  });

  const mockHalEndpointService = {
    getRootHref: jasmine.createSpy('getRootHref'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DspaceRestService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LocaleInterceptor,
          multi: true,
        },
        { provide: HALEndpointService, useValue: mockHalEndpointService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    });

    service = TestBed.inject(DspaceRestService);
    httpMock = TestBed.inject(HttpTestingController);
    localeService = TestBed.inject(LocaleService);

    localeService.getCurrentLanguageCode.and.returnValue(of('en'));
    localeService.getLanguageCodeList.calls.reset();
    mockHalEndpointService.getRootHref.and.returnValue('server/api');
  });

  describe('', () => {

    it('should add an Accept-Language header when we’re sending an HTTP POST request', () => {
      service.request(RestRequestMethod.POST, 'server/api/submission/workspaceitems', 'test').subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpMock.expectOne(`server/api/submission/workspaceitems`);

      expect(httpRequest.request.headers.has('Accept-Language'));
      const lang = httpRequest.request.headers.get('Accept-Language');
      expect(lang).not.toBeNull();
      expect(lang).toBe(languageList.toString());
    });

    it('should add an Accept-Language header when we’re sending an HTTP GET request', () => {
      service.request(RestRequestMethod.GET, 'server/api/submission/workspaceitems/123').subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpMock.expectOne(`server/api/submission/workspaceitems/123`);

      expect(httpRequest.request.headers.has('Accept-Language'));
      const lang = httpRequest.request.headers.get('Accept-Language');
      expect(lang).toBeDefined();
      expect(lang).toBe(languageList.toString());
    });

    it('should use the EPerson language for other requests', () => {
      service.request(RestRequestMethod.GET, 'server/api/core/items/123').subscribe();
      httpMock.expectOne('server/api/core/items/123');

      expect(localeService.getLanguageCodeList).toHaveBeenCalledWith(false);
    });

    it('should not use the EPerson language for the root and EPerson requests, they load the EPerson', () => {
      service.request(RestRequestMethod.GET, 'server/api').subscribe();
      service.request(RestRequestMethod.GET, 'server/api/eperson/epersons/123').subscribe();
      httpMock.expectOne('server/api');
      httpMock.expectOne('server/api/eperson/epersons/123');

      expect(localeService.getLanguageCodeList.calls.allArgs()).toEqual([[true], [true]]);
    });

  });

});
