import { Component, Input } from '@angular/core';
import { Item } from '../../core/shared/item.model';
<<<<<<< HEAD:src/app/item-page/alerts/item-alerts.component.ts
import { AlertType } from '../../shared/alert/aletr-type';
=======
import { AlertType } from '../../shared/alert/alert-type';
>>>>>>> dspace-7.6.1:src/app/shared/item/item-alerts/item-alerts.component.ts

@Component({
  selector: 'ds-item-alerts',
  templateUrl: './item-alerts.component.html',
  styleUrls: ['./item-alerts.component.scss']
})
/**
 * Component displaying alerts for an item
 */
export class ItemAlertsComponent {
  /**
   * The Item to display alerts for
   */
  @Input() item: Item;

  /**
   * The AlertType enumeration
   * @type {AlertType}
   */
  public AlertTypeEnum = AlertType;
}
