import {
  Component,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { GLOBAL_ACTIONS_PATH } from '../handle-page-routing-paths';

@Component({
  imports: [
    RouterModule,
    TranslateModule,
  ],
  selector: 'ds-handle-global-actions',
  templateUrl: './handle-global-actions.component.html',
  styleUrls: ['./handle-global-actions.component.scss'],
})
export class HandleGlobalActionsComponent implements OnInit {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() { }

  /**
   * The redirection path.
   */
  globalActionsPath: string;

  ngOnInit(): void {
    this.globalActionsPath = GLOBAL_ACTIONS_PATH;
  }

}
