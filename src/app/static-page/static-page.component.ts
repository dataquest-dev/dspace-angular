import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ServerResponseService } from '../core/services/server-response.service';
import { HtmlContentService } from '../shared/html-content.service';
import { ClarinSafeHtmlPipe } from '../shared/utils/clarin-safehtml.pipe';

/**
 * Component which load and show static files from the `static-files` folder.
 * E.g., `<UI_URL>/static/some_file` loads the content from `static-files/some_file.html`.
 */
@Component({
  selector: 'ds-static-page',
  templateUrl: './static-page.component.html',
  styleUrls: ['./static-page.component.scss'],
  imports: [
    ClarinSafeHtmlPipe,
    RouterLink,
    TranslateModule,
  ],
})
export class StaticPageComponent implements OnInit {
  htmlContent = '';
  contentState: 'loading' | 'found' | 'not-found' = 'loading';

  constructor(
    private htmlContentService: HtmlContentService,
    private route: ActivatedRoute,
    private responseService: ServerResponseService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    this.contentState = 'loading';
    this.htmlContent = '';

    const fileName = this.getHtmlFileName();
    if (!fileName) {
      this.markNotFound();
      return;
    }

    try {
      const content = await this.htmlContentService.getHtmlContentByPathAndLocale(fileName);
      if (content !== undefined) {
        this.htmlContent = content;
        this.contentState = 'found';
        this.changeDetector.detectChanges();
        return;
      }
    } catch {
      // fall through to not-found handling below
    }

    this.markNotFound();
  }

  private markNotFound(): void {
    this.responseService.setNotFound();
    this.contentState = 'not-found';
    this.changeDetector.detectChanges();
  }

  /**
   * Read the file name from the URL - `static/FILE_NAME`.
   */
  private getHtmlFileName(): string | null {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return null;
    }
    // Drop any trailing fragment, e.g. `VERSION_D#section`.
    return id.split('#')[0];
  }
}
