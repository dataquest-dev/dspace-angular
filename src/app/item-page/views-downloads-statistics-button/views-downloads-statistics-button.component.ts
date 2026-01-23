import { Component, Input } from '@angular/core';
import { Item } from '../../core/shared/item.model';

@Component({
  selector: 'ds-views-downloads-statistics-button',
  templateUrl: './views-downloads-statistics-button.component.html',
})
export class ViewsDownloadsStatisticsButtonComponent {
  @Input() object: Item;
}
