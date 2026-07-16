import {
  Component,
  Input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Item } from '../../core/shared/item.model';

@Component({
  selector: 'ds-views-downloads-statistics-button',
  templateUrl: './views-downloads-statistics-button.component.html',
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
export class ViewsDownloadsStatisticsButtonComponent {
  @Input() object: Item;
}
