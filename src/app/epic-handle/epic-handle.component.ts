import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { EpicHandleTableComponent } from './epic-handle-table/epic-handle-table.component';

@Component({
  imports: [
    EpicHandleTableComponent,
    TranslateModule,
  ],
  selector: 'ds-epic-handle',
  templateUrl: './epic-handle.component.html',
  styleUrls: ['./epic-handle.component.scss'],
})
export class EpicHandleComponent {
}
