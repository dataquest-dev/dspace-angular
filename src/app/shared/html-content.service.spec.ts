import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LocaleService } from '../core/locale/locale.service';
import { HtmlContentService } from './html-content.service';

describe('HtmlContentService', () => {
  let service: HtmlContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LocaleService, useValue: { getCurrentLanguageCode: () => of('en') } },
      ],
    });

    service = TestBed.inject(HtmlContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not request a file name that leaves static-files once decoded', async () => {
    const promise = service.getHtmlContentByPathAndLocale('..%2Findex');

    httpMock.expectNone(() => true);
    expect(await promise).toBeUndefined();
  });
});
