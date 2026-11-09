import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PLATFORM_ID, Provider } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { REQUEST } from '@nguniversal/express-engine/tokens';
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

  function setup(nameSpace: string, serverProviders: Provider[] = []): void {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HtmlContentService,
        { provide: LocaleService, useClass: LocaleServiceStub },
        {
          provide: APP_CONFIG,
          useValue: {
            ui: { nameSpace, baseUrl: `http://localhost:4000${nameSpace}` },
          },
        },
        ...serverProviders,
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

  it('should fallback from locale-specific to default namespaced URL when localized content is missing', fakeAsync(() => {
    setup('/repository/');
    localeService.languageCode = 'cs';

    let content: string | undefined;
    service.getHmtlContentByPathAndLocale('license-ud-1.0').then((result) => {
      content = result;
    });

    const localizedRequest = httpMock.expectOne('/repository/static-files/cs/license-ud-1.0.html');
    localizedRequest.flush('Not Found', { status: 404, statusText: 'Not Found' });
    tick();

    const fallbackRequest = httpMock.expectOne('/repository/static-files/license-ud-1.0.html');
    fallbackRequest.flush('Fallback content');
    tick();

    expect(content).toBe('Fallback content');
  }));

  it('should fallback from locale-specific to default URL when locale returns 404', fakeAsync(() => {
    setup('/');
    localeService.languageCode = 'cs';

    let content: string | undefined;
    service.getHmtlContentByPathAndLocale('license').then((result) => {
      content = result;
    });

    httpMock.expectOne('/static-files/cs/license.html')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    tick();

    httpMock.expectOne('/static-files/license.html').flush('<div>English Content</div>');
    tick();

    expect(content).toBe('<div>English Content</div>');
  }));

  it('should fetch static content from the configured UI origin, not the request Host, during SSR', async () => {
    setup('/repository', [
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: REQUEST, useValue: { protocol: 'https', get: () => 'attacker.example' } },
    ]);

    const promise = service.getHmtlContentByPathAndLocale('about');

    httpMock.expectOne('http://localhost:4000/repository/static-files/about.html').flush('Trusted content');
    expect(await promise).toBe('Trusted content');
  });

  it('should not request a file name that leaves static-files once decoded', async () => {
    setup('/repository');

    const promise = service.getHmtlContentByPathAndLocale('..%2Findex');

    httpMock.expectNone(() => true);
    expect(await promise).toBeUndefined();
  });

  it('should return empty string from getHtmlContent when request fails', async () => {
    setup('/repository');

    const contentPromise = firstValueFrom(service.getHtmlContent('static-files/missing-page.html'));

    const request = httpMock.expectOne('/repository/static-files/missing-page.html');
    request.flush('Not Found', { status: 404, statusText: 'Not Found' });

    const content = await contentPromise;
    expect(content).toBe('');
  });
});
