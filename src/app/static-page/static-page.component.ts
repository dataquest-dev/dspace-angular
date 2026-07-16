import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import {
  Router,
  RouterModule,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import {
  APP_CONFIG,
  AppConfig,
} from '../../config/app-config.interface';
import { ServerResponseService } from '../core/services/server-response.service';
import { isEmpty } from '../shared/empty.util';
import { HtmlContentService } from '../shared/html-content.service';
import { ThemedLoadingComponent } from '../shared/loading/themed-loading.component';
import { ClarinSafeHtmlPipe } from '../shared/utils/clarin-safehtml.pipe';
import { STATIC_PAGE_PATH } from './static-page-routing-paths';

/**
 * Component which load and show static files from the `static-files` folder.
 * E.g., `<UI_URL>/static/test_file.html will load the file content from the `static-files/test_file.html`/
 */
@Component({
  imports: [
    ClarinSafeHtmlPipe,
    CommonModule,
    RouterModule,
    ThemedLoadingComponent,
    TranslateModule,
  ],
  selector: 'ds-static-page',
  templateUrl: './static-page.component.html',
  styleUrls: ['./static-page.component.scss'],
})
export class StaticPageComponent implements OnInit {
  htmlContent: BehaviorSubject<string> = new BehaviorSubject<string>('');
  htmlFileName: string;
  contentState: 'loading' | 'found' | 'not-found' = 'loading';

  constructor(private htmlContentService: HtmlContentService,
              private router: Router,
              private responseService: ServerResponseService,
              private changeDetector: ChangeDetectorRef,
              @Inject(APP_CONFIG) protected appConfig?: AppConfig) { }

  async ngOnInit(): Promise<void> {
    try {
      this.contentState = 'loading';
      this.htmlContent.next('');

      // Fetch html file name from the url path. `static/some_file.html`
      this.htmlFileName = this.getHtmlFileName();

      let htmlContent = await this.htmlContentService.getHmtlContentByPathAndLocale(this.htmlFileName);
      if (htmlContent !== undefined) {
        const restBase = this.appConfig?.rest?.baseUrl;
        const oaiUrl = restBase ? restBase.replace(/\/+$/, '') + '/oai' : '/server/oai';
        htmlContent = htmlContent.replace(/href="\/server\/oai/gi, 'href="' + oaiUrl);

        this.htmlContent.next(htmlContent);
        this.contentState = 'found';
        this.changeDetector.detectChanges();
        return;
      }

      // Content not found - set 404 status for SSR and show inline error
      this.responseService.setNotFound();
      this.contentState = 'not-found';
      this.changeDetector.detectChanges();
    } catch (error) {
      console.error('Static page load error:', {
        fileName: this.htmlFileName,
        url: this.router.url,
        error: error,
      });
      this.responseService.setNotFound();
      this.contentState = 'not-found';
      this.changeDetector.detectChanges();
    }
  }

  /**
   * Handle click on links in the static page.
   * @param event
   */
  processLinks(event: Event): void {
    const targetElement = event.target as HTMLElement | null;
    const anchorElement = targetElement?.closest?.('a');
    if (!anchorElement) {
      return;
    }

    const href = anchorElement.getAttribute('href');
    if (!href || !this.isRelativeLink(href)) {
      return;
    }

    event.preventDefault();
    const namespacePrefix = this.getNamespacePrefix();
    const staticPageBaseUrl = this.composeStaticPageBaseUrl(namespacePrefix);
    this.redirectToRelativeLink(staticPageBaseUrl, href);
  }

  private getNamespacePrefix(): string {
    const nameSpace = this.appConfig?.ui?.nameSpace ?? '/';
    return nameSpace === '/' ? '' : nameSpace.replace(/\/$/, '');
  }

  private composeUrl(pathname: string): string {
    const baseUrl = new URL(window.location.origin);
    baseUrl.pathname = pathname;
    return baseUrl.href;
  }

  private composeStaticPageBaseUrl(namespacePrefix: string): string {
    return this.composeUrl(`${namespacePrefix}/${STATIC_PAGE_PATH}/`);
  }

  private isRelativeLink(href: string | null): boolean {
    return href?.startsWith('.') ?? false;
  }

  private redirectToRelativeLink(redirectUrl: string, href: string | null): void {
    this.navigateTo(new URL(href, redirectUrl).href);
  }

  private navigateTo(url: string): void {
    window.location.href = url;
  }

  /**
   * Load file name from the URL - `static/FILE_NAME.html`
   * @private
   */
  private getHtmlFileName() {
    let urlInList = this.router.url?.split('/');
    // Filter empty elements
    urlInList = urlInList.filter(n => n);
    // if length is 1 - html file name wasn't defined.
    if (isEmpty(urlInList) || urlInList.length === 1) {
      return null;
    }

    // If the url is too long take just the first string after `/static` prefix.
    return urlInList[1]?.split('#')?.[0];
  }
}
