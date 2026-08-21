import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Inject,
  Injectable,
  PLATFORM_ID,
} from '@angular/core';
import {
  firstValueFrom,
  of,
} from 'rxjs';
import {
  catchError,
  map,
} from 'rxjs/operators';

import { LocaleService } from '../core/locale/locale.service';
import {
  HTML_SUFFIX,
  STATIC_FILES_PROJECT_PATH,
} from '../static-page/static-page-routing-paths';

interface HtmlContentResult {
  found: boolean;
  body: string;
}

/**
 * Service for loading static `.html` files stored in the `src/static-files` folder
 * (registered as a build asset in `angular.json`). Used e.g. to render the
 * deployed-version info at `/static/VERSION_D` (issue #813).
 */
@Injectable({
  providedIn: 'root',
})
export class HtmlContentService {
  constructor(
    private http: HttpClient,
    private localeService: LocaleService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  private withSuffix(name: string): string {
    return name.endsWith(HTML_SUFFIX) ? name : name + HTML_SUFFIX;
  }

  private fetch(url: string) {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((body): HtmlContentResult => ({ found: true, body })),
      catchError(() => of<HtmlContentResult>({ found: false, body: '' })),
    );
  }

  /**
   * Load the html content for a file name, trying the current locale package first
   * (`static-files/<lang>/<file>.html`) and falling back to the default package
   * (`static-files/<file>.html`). Returns `undefined` when nothing was found.
   *
   * The files are fetched client-side only; during SSR this resolves to `undefined`
   * and the content is loaded after hydration.
   */
  async getHtmlContentByPathAndLocale(fileName: string): Promise<string | undefined> {
    if (!isPlatformBrowser(this.platformId)) {
      return undefined;
    }

    let language = await firstValueFrom(this.localeService.getCurrentLanguageCode());
    // Default language `en` lives in the non-translated (root) package.
    language = language === 'en' ? '' : language;

    if (language) {
      const localized = await firstValueFrom(
        this.fetch(this.withSuffix(`${STATIC_FILES_PROJECT_PATH}/${language}/${fileName}`)),
      );
      if (localized.found) {
        return localized.body;
      }
    }

    const fallback = await firstValueFrom(
      this.fetch(this.withSuffix(`${STATIC_FILES_PROJECT_PATH}/${fileName}`)),
    );
    return fallback.found ? fallback.body : undefined;
  }
}
