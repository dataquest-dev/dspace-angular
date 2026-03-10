import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { HtmlContentService } from './html-content.service';
import { LocaleService } from '../core/locale/locale.service';
import { APP_CONFIG } from '../../config/app-config.interface';

class LocaleServiceStub {
  languageCode = 'en';

  getCurrentLanguageCode(): string {
    return this.languageCode;
  }
}

describe('HtmlContentService', () => {
  let service: HtmlContentService;
  let httpMock: HttpTestingController;
  let localeService: LocaleServiceStub;

  function setup(nameSpace: string): void {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HtmlContentService,
        { provide: LocaleService, useClass: LocaleServiceStub },
        {
          provide: APP_CONFIG,
          useValue: {
            ui: { nameSpace },
          },
        },
      ],
    });

    service = TestBed.inject(HtmlContentService);
    httpMock = TestBed.inject(HttpTestingController);
    localeService = TestBed.inject(LocaleService) as any;
  }

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should request root namespaced URL for default locale', async () => {
    setup('/');
    localeService.languageCode = 'en';

    const promise = service.getHmtlContentByPathAndLocale('license-ud-1.0');

    const request = httpMock.expectOne('/static-files/license-ud-1.0.html');
    expect(request.request.method).toBe('GET');
    request.flush('Universal Dependencies 1.0 License Set');

    const content = await promise;
    expect(content).toBe('Universal Dependencies 1.0 License Set');
  });

  it('should request locale-specific namespaced URL for non-default locale', async () => {
    setup('/repository');
    localeService.languageCode = 'cs';

    const promise = service.getHmtlContentByPathAndLocale('license-ud-1.0');

    const request = httpMock.expectOne('/repository/static-files/cs/license-ud-1.0.html');
    expect(request.request.method).toBe('GET');
    request.flush('Localized content');

    const content = await promise;
    expect(content).toBe('Localized content');
  });

  it('should fallback from locale-specific to default namespaced URL when localized content is empty', fakeAsync(() => {
    setup('/repository/');
    localeService.languageCode = 'cs';

    let content: string | undefined;
    service.getHmtlContentByPathAndLocale('license-ud-1.0').then((result) => {
      content = result;
    });

    const localizedRequest = httpMock.expectOne('/repository/static-files/cs/license-ud-1.0.html');
    localizedRequest.flush('');
    tick();

    const fallbackRequest = httpMock.expectOne('/repository/static-files/license-ud-1.0');
    fallbackRequest.flush('Fallback content');
    tick();

    expect(content).toBe('Fallback content');
  }));

  it('should return empty string from getHtmlContent when request fails', async () => {
    setup('/repository');

    const contentPromise = firstValueFrom(service.getHtmlContent('static-files/missing-page.html'));

    const request = httpMock.expectOne('/repository/static-files/missing-page.html');
    request.flush('Not Found', { status: 404, statusText: 'Not Found' });

    const content = await contentPromise;
    expect(content).toBe('');
  });
});
