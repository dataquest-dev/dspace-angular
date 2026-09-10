import { DOCUMENT } from '@angular/common';
import {
  Inject,
  Injectable,
} from '@angular/core';
import Cookies from 'js-cookie';

import {
  CookieService,
  ICookieService,
} from './cookie.service';

@Injectable()
export class ClientCookieService extends CookieService implements ICookieService {

  constructor(@Inject(DOCUMENT) protected document: Document) {
    super();
  }

  public set(name: string, value: any, options?: Cookies.CookieAttributes): void {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    Cookies.set(name, toStore, this.withSecureFlag(options));
    this.updateSource();
  }

  public remove(name: string, options?: Cookies.CookieAttributes): void {
    Cookies.remove(name, options);
    this.updateSource();
  }

  /**
   * Marks every cookie we write as `Secure` whenever the page itself was loaded over HTTPS, so the
   * browser never sends it back over a plaintext connection. Without this, cookies such as
   * `XSRF-TOKEN` are written without the attribute and travel in the clear if the user is ever
   * downgraded to HTTP.
   *
   * The decision is taken from the protocol of the current page rather than from `ui.ssl`, because
   * in a typical deployment TLS is terminated by a reverse proxy and the UI server itself is
   * configured as plain HTTP — `ui.ssl` would be `false` on a site that is HTTPS-only. Reading the
   * page protocol also keeps local development over `http://localhost` working, where a `Secure`
   * cookie is not guaranteed to be accepted.
   *
   * An explicit `secure` in {@link Cookies.CookieAttributes} always wins.
   */
  private withSecureFlag(options?: Cookies.CookieAttributes): Cookies.CookieAttributes {
    if (options?.secure !== undefined) {
      return options;
    }
    return {
      ...options,
      secure: this.document?.location?.protocol === 'https:',
    };
  }

  public get(name: string): any {
    const raw = Cookies.get(name);
    if (raw === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  public getAll(): any {
    const all = Cookies.get();
    const parsed: Record<string, any> = {};

    Object.entries(all).forEach(([key, value]) => {
      try {
        parsed[key] = JSON.parse(value);
      } catch {
        parsed[key] = value;
      }
    });

    return parsed;
  }
}
