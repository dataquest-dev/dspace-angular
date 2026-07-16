import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HandleGlobalActionsComponent } from './handle-global-actions/handle-global-actions.component';
import { HandleTableComponent } from './handle-table/handle-table.component';

/**
 * The component which contains the handle-table and the change-global-prefix section.
 */
@Component({
  imports: [
    HandleGlobalActionsComponent,
    HandleTableComponent,
    TranslateModule,
  ],
  selector: 'ds-handle-page',
  templateUrl: './handle-page.component.html',
  styleUrls: ['./handle-page.component.scss'],
})
export class HandlePageComponent implements AfterViewInit {

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
