import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ServerResponseService } from '../core/services/server-response.service';

/**
 * This component representing the `PageInternalServer` DSpace page.
 */
@Component({
  selector: 'ds-base-page-internal-server-error',
  styleUrls: ['./page-internal-server-error.component.scss'],
  templateUrl: './page-internal-server-error.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class PageInternalServerErrorComponent {

  /**
   * Initialize instance variables
   *
   * @param {ServerResponseService} responseService
   */
  constructor(private responseService: ServerResponseService) {
    this.responseService.setInternalServerError();
  }
}
