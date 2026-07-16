import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ClarinLicenseTableComponent } from '../clarin-license-table/clarin-license-table.component';

/**
 * Component which wraps clarin license table into the container
 */
@Component({
  imports: [
    ClarinLicenseTableComponent,
    TranslateModule,
  ],
  selector: 'ds-clarin-license-page',
  templateUrl: './clarin-license-page.component.html',
  styleUrls: ['./clarin-license-page.component.scss'],
})
export class ClarinLicensePageComponent {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() { }
}
