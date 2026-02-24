import { Component, EventEmitter, Input, Output } from '@angular/core';

let nextDsSelectId = 0;

/**
 * Component which represent a DSpace dropdown selector.
 */
@Component({
  selector: 'ds-select',
  templateUrl: './ds-select.component.html',
  styleUrls: ['./ds-select.component.scss']
})
export class DsSelectComponent {

  /**
   * Unique identifier for the component instance.
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
