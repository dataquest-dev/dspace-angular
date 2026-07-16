import { isPlatformServer } from '@angular/common';
import {
  HttpClient,
  HttpResponse,
} from '@angular/common/http';
import {
  Inject,
  Injectable,
  Optional,
  PLATFORM_ID,
} from '@angular/core';
import {
  firstValueFrom,
  of,
} from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  APP_CONFIG,
  AppConfig,
} from '../../config/app-config.interface';
import { REQUEST } from '../../express.tokens';
import { LocaleService } from '../core/locale/locale.service';
import {
  HTML_SUFFIX,
  STATIC_FILES_PROJECT_PATH,
} from '../static-page/static-page-routing-paths';
import { isEmpty } from './empty.util';

/**
 * Service for loading static `.html` files stored in the `/static-files` folder.
 */
@Injectable({ providedIn: 'root' })
export class HtmlContentService {
  constructor(private http: HttpClient,
              private localeService: LocaleService,
              @Inject(APP_CONFIG) protected appConfig?: AppConfig,
              @Inject(PLATFORM_ID) private platformId?: object,
              @Optional() @Inject(REQUEST) private request?: any,
  ) {}

  private getNamespacePrefix(): string {
    const nameSpace = this.appConfig?.ui?.nameSpace ?? '/';
    if (nameSpace === '/') {
      return '';
    }
    return nameSpace.endsWith('/') ? nameSpace.slice(0, -1) : nameSpace;
  }

  private composeNamespacedUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    const namespacePrefix = this.getNamespacePrefix();

    if (namespacePrefix && normalizedPath.startsWith(`${namespacePrefix}/`)) {
      return normalizedPath;
    }

    return `${namespacePrefix}${normalizedPath}`;
  }

  private buildRuntimeUrl(path: string): string {
    if (!isPlatformServer(this.platformId) || !this.request) {
      return path;
    }

    const protocol = this.request.protocol;
    const host = this.request.get?.('host');
    if (!protocol || !host) {
      return path;
    }

    return `${protocol}://${host}${path}`;
  }

  getHtmlContent(url: string) {
    const namespacedUrl = this.composeNamespacedUrl(url);
    const runtimeUrl = this.buildRuntimeUrl(namespacedUrl);
    return this.http.get(runtimeUrl, { responseType: 'text' }).pipe(
      catchError(() => of('')));
  }

  /**
   * Load `.html` file content and return the full response.
   * @param url file location
   */
  fetchHtmlContent(url: string) {
    const namespacedUrl = this.composeNamespacedUrl(url);
    const runtimeUrl = this.buildRuntimeUrl(namespacedUrl);
    return this.http.get(runtimeUrl, { responseType: 'text', observe: 'response' }).pipe(
      catchError((error: unknown) => of(new HttpResponse({ status: (error as any).status || 0, body: '' }))));
  }

  /**
   * Load HTML content for a single URL attempt and handle cached 304 responses.
   * @param url file location
   */
  private async loadHtmlContent(url: string): Promise<string | undefined> {
    const response = await firstValueFrom(this.fetchHtmlContent(url));
    if (response.status === 200) {
      return response.body ?? '';
    }
    if (response.status === 304) {
      return response.body ?? '';
    }
    return undefined;
  }

  /**
   * Get the html file content as a string by the file name and the current locale.
   */
  async getHmtlContentByPathAndLocale(fileName: string) {
    let url = '';
    // Get current language
    let language = await firstValueFrom(this.localeService.getCurrentLanguageCode());
    // If language is default = `en` do not load static files from translated package e.g. `cs`.
    language = language === 'en' ? '' : language;

    // Try to find the html file in the translated package. `static-files/language_code/some_file.html`
    // Compose url
    url = STATIC_FILES_PROJECT_PATH;
    url += isEmpty(language) ? '/' + fileName : '/' + language + '/' + fileName;
    // Add `.html` suffix to get the current html file
    url = url.endsWith(HTML_SUFFIX) ? url : url + HTML_SUFFIX;
    let potentialContent = await this.loadHtmlContent(url);
    if (potentialContent !== undefined) {
      return potentialContent;
    }

    // If the file wasn't find, get the non-translated file from the default package.
    url = STATIC_FILES_PROJECT_PATH + '/' + fileName;
    // Add `.html` suffix to match localized request behavior
    url = url.endsWith(HTML_SUFFIX) ? url : url + HTML_SUFFIX;
    potentialContent = await this.loadHtmlContent(url);
    if (potentialContent !== undefined) {
      return potentialContent;
    }
  }
}
