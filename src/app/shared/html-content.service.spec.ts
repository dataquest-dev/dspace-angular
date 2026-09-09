import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  firstValueFrom,
  of,
} from 'rxjs';

import { APP_CONFIG } from '../../config/app-config.interface';
import { REQUEST } from '../../express.tokens';
import { LocaleService } from '../core/locale/locale.service';
import { HtmlContentService } from './html-content.service';

class LocaleServiceStub {
  languageCode = 'en';

  /**
   * On v9 LocaleService returns an Observable, not a bare string.
   */
  getCurrentLanguageCode() {
    return of(this.languageCode);
  }
}

describe('HtmlContentService', () => {
  let service: HtmlContentService;
  let httpMock: HttpTestingController;
  let localeService: LocaleServiceStub;

  /**
   * @param nameSpace  value of appConfig.ui.nameSpace
   * @param platformId 'server' exercises the SSR branch of buildRuntimeUrl
   * @param request    the express request injected through the REQUEST token
   */
  function setup(nameSpace: string, platformId: string = 'browser', request?: any): void {
    TestBed.configureTestingModule({
      providers: [
        HtmlContentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocaleService, useClass: LocaleServiceStub },
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: REQUEST, useValue: request ?? null },
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

  /**
   * An express request stub - only protocol and get('host') are read.
   */
  function expressRequest(protocol: string, host: string): any {
    return {
      protocol,
      get: (header: string) => (header === 'host' ? host : undefined),
    };
  }

  /**
   * getHmtlContentByPathAndLocale first awaits the LocaleService observable, which on v9 puts a
   * microtask between the call and the HTTP request. Let the queue drain before expectOne.
   */
  function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
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
    await settle();

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
    await settle();

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
    tick();

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
    tick();

    httpMock.expectOne('/static-files/cs/license.html')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    tick();

    httpMock.expectOne('/static-files/license.html').flush('<div>English Content</div>');
    tick();

    expect(content).toBe('<div>English Content</div>');
  }));

  it('should return empty string from getHtmlContent when request fails', async () => {
    setup('/repository');

    const contentPromise = firstValueFrom(service.getHtmlContent('static-files/missing-page.html'));

    const request = httpMock.expectOne('/repository/static-files/missing-page.html');
    request.flush('Not Found', { status: 404, statusText: 'Not Found' });

    const content = await contentPromise;
    expect(content).toBe('');
  });

  it('should build an absolute URL from the injected express REQUEST when rendering on the server', async () => {
    setup('/repository', 'server', expressRequest('https', 'dev-6.pc:8603'));

    const contentPromise = firstValueFrom(service.getHtmlContent('static-files/about.html'));

    const request = httpMock.expectOne('https://dev-6.pc:8603/repository/static-files/about.html');
    expect(request.request.method).toBe('GET');
    request.flush('<div>About</div>');

    expect(await contentPromise).toBe('<div>About</div>');
  });

  it('should keep the relative URL on the server when no REQUEST is available', async () => {
    setup('/repository', 'server');

    const contentPromise = firstValueFrom(service.getHtmlContent('static-files/about.html'));

    httpMock.expectOne('/repository/static-files/about.html').flush('<div>About</div>');

    expect(await contentPromise).toBe('<div>About</div>');
  });

  it('should ignore the REQUEST and keep the relative URL in the browser', async () => {
    setup('/repository', 'browser', expressRequest('https', 'dev-6.pc:8603'));

    const contentPromise = firstValueFrom(service.getHtmlContent('static-files/about.html'));

    httpMock.expectOne('/repository/static-files/about.html').flush('<div>About</div>');

    expect(await contentPromise).toBe('<div>About</div>');
  });

  it('should not prefix a URL that already starts with the namespace twice', async () => {
    setup('/repository');

    const contentPromise = firstValueFrom(service.getHtmlContent('/repository/static-files/about.html'));

    httpMock.expectOne('/repository/static-files/about.html').flush('<div>About</div>');

    expect(await contentPromise).toBe('<div>About</div>');
  });

  it('should leave an already absolute URL untouched', async () => {
    setup('/repository');

    const contentPromise = firstValueFrom(service.getHtmlContent('https://elsewhere.example.org/about.html'));

    httpMock.expectOne('https://elsewhere.example.org/about.html').flush('<div>About</div>');

    expect(await contentPromise).toBe('<div>About</div>');
  });
});
