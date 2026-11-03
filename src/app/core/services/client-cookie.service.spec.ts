import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import Cookies from 'js-cookie';

import { ClientCookieService } from './client-cookie.service';

describe('ClientCookieService', () => {

  /**
   * Builds the service around a document that claims to be served over the given protocol.
   */
  function serviceOn(protocol: string): ClientCookieService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ClientCookieService,
        { provide: DOCUMENT, useValue: { location: { protocol } } },
      ],
    });
    return TestBed.inject(ClientCookieService);
  }

  beforeEach(() => {
    spyOn(Cookies, 'set');
  });

  describe('when the page is served over HTTPS', () => {
    it('should mark the cookie as Secure', () => {
      serviceOn('https:').set('XSRF-TOKEN', 'a-token');

      expect(Cookies.set).toHaveBeenCalledWith('XSRF-TOKEN', 'a-token', jasmine.objectContaining({ secure: true }));
    });

    it('should keep the caller\'s other attributes', () => {
      serviceOn('https:').set('some-cookie', 'value', { expires: 7 });

      expect(Cookies.set).toHaveBeenCalledWith('some-cookie', 'value', { expires: 7, secure: true });
    });
  });

  describe('when the page is served over plain HTTP', () => {
    it('should not mark the cookie as Secure, so local development keeps working', () => {
      serviceOn('http:').set('XSRF-TOKEN', 'a-token');

      expect(Cookies.set).toHaveBeenCalledWith('XSRF-TOKEN', 'a-token', jasmine.objectContaining({ secure: false }));
    });
  });

  it('should let an explicit secure attribute win', () => {
    serviceOn('https:').set('some-cookie', 'value', { secure: false });

    expect(Cookies.set).toHaveBeenCalledWith('some-cookie', 'value', { secure: false });
  });

  it('should still serialize non-string values as JSON', () => {
    serviceOn('https:').set('some-cookie', { a: 1 });

    expect(Cookies.set).toHaveBeenCalledWith('some-cookie', '{"a":1}', jasmine.objectContaining({ secure: true }));
  });
});
