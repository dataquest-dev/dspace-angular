import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { firstValueFrom, of as observableOf } from 'rxjs';
import { HTML_SUFFIX, STATIC_FILES_PROJECT_PATH } from '../static-page/static-page-routing-paths';
import { isEmpty, isNotEmpty } from './empty.util';
import { LocaleService } from '../core/locale/locale.service';
import { APP_CONFIG, AppConfig } from '../../config/app-config.interface';
import { REQUEST } from '@nguniversal/express-engine/tokens';

/**
 * Service for loading static `.html` files stored in the `/static-files` folder.
 */
@Injectable()
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
      catchError(() => observableOf('')));
  }

  /**
   * Load `.html` file content or return empty string if an error.
   * @param url file location
   */
  fetchHtmlContent(url: string) {
    return this.getHtmlContent(url);
  }

  /**
   * Get the html file content as a string by the file name and the current locale.
   */
  async getHmtlContentByPathAndLocale(fileName: string) {
    let url = '';
    // Get current language
    let language = this.localeService.getCurrentLanguageCode();
    // If language is default = `en` do not load static files from translated package e.g. `cs`.
    language = language === 'en' ? '' : language;

    // Try to find the html file in the translated package. `static-files/language_code/some_file.html`
    // Compose url
    url = STATIC_FILES_PROJECT_PATH;
    url += isEmpty(language) ? '/' + fileName : '/' + language + '/' + fileName;
    // Add `.html` suffix to get the current html file
    url = url.endsWith(HTML_SUFFIX) ? url : url + HTML_SUFFIX;
    let potentialContent = await firstValueFrom(this.fetchHtmlContent(url));
    if (isNotEmpty(potentialContent)) {
      return potentialContent;
    }

    // If the file wasn't find, get the non-translated file from the default package.
    url = STATIC_FILES_PROJECT_PATH + '/' + fileName;
    potentialContent = await firstValueFrom(this.fetchHtmlContent(url));
    if (isNotEmpty(potentialContent)) {
      return potentialContent;
    }
  }
}
