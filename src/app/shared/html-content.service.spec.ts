import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HtmlContentService } from './html-content.service';
import { LocaleService } from '../core/locale/locale.service';

class LocaleServiceStub {
  languageCode = 'en';

  getCurrentLanguageCode(): string {
    return this.languageCode;
  }
}

describe('HtmlContentService', () => {
  let service: HtmlContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HtmlContentService,
        { provide: LocaleService, useClass: LocaleServiceStub },
      ],
    });

    service = TestBed.inject(HtmlContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not request a file name that leaves static-files once decoded', async () => {
    const promise = service.getHmtlContentByPathAndLocale('..%2Findex');

    httpMock.expectNone(() => true);
    expect(await promise).toBeUndefined();
  });
});
