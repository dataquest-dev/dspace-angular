
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { BtnDisabledDirective } from '../btn-disabled.directive';

let nextDsSelectId = 0;

/**
 * Component which represent a DSpace dropdown selector.
 */
@Component({
  selector: 'ds-select',
  templateUrl: './ds-select.component.html',
  styleUrls: ['./ds-select.component.scss'],
  imports: [
    BtnDisabledDirective,
    NgbDropdownModule,
    TranslateModule,
  ],
})
export class DsSelectComponent {

  /**
   * Unique identifier for the component instance. Several ds-select instances are rendered on the
   * same page (browse toolbars, MyDSpace), so the dropdown's DOM ids have to be per-instance or the
   * document carries duplicate ids and every aria reference resolves to the first instance.
   */
  uniqueId = `ds-select-${nextDsSelectId++}`;

  /**
   * An optional label for the dropdown selector.
   */
  @Input()
  label: string;

  /**
   * Whether the dropdown selector is disabled.
   */
  @Input()
  disabled: boolean;

  /**
   * Emits an event when the dropdown selector is opened or closed.
   */
  @Output()
  toggled = new EventEmitter();

  /**
   * Emits an event when the dropdown selector or closed.
   */
  @Output()
  close = new EventEmitter();
}
