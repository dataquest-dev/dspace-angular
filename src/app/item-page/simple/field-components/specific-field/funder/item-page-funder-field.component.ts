import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { getFirstCompletedRemoteData } from '../../../../../core/shared/operators';
import { Item } from '../../../../../core/shared/item.model';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
import { MetadataFieldWrapperComponent } from '../../../../../shared/metadata-field-wrapper/metadata-field-wrapper.component';

@Component({
  selector: 'ds-item-page-funder-field',
  templateUrl: './item-page-funder-field.component.html',
  standalone: true,
  imports: [
    MetadataFieldWrapperComponent,
    TranslateModule,
  ],
})
/**
 * Component for displaying dc.relation.funder metadata on the simple item page.
 * Funder code-to-name mapping is fetched from the backend configuration property "funder.name.map".
 */
export class ItemPageFunderFieldComponent implements OnInit {

  @Input() item: Item;

  @Input() label = 'item.page.funder';

  @Input() separator = ', ';

  funderNames: string[] = [];

  constructor(
    private configurationService: ConfigurationDataService,
  ) {}

  ngOnInit(): void {
    const mdValues: MetadataValue[] = this.item?.allMetadata(['dc.relation.funder']) ?? [];
    if (mdValues.length === 0) {
      return;
    }

    this.configurationService.findByPropertyName('funder.name.map').pipe(
      getFirstCompletedRemoteData(),
    ).subscribe(rd => {
      const nameMap: Record<string, string> = {};
      if (rd.hasSucceeded && rd.payload?.values) {
        for (const entry of rd.payload.values) {
          const eqIndex = entry.indexOf('=');
          if (eqIndex > 0) {
            nameMap[entry.substring(0, eqIndex).trim()] = entry.substring(eqIndex + 1).trim();
          }
        }
      }
      const resolved = mdValues.map(md => nameMap[md.value] ?? md.value);
      this.funderNames = [...new Set(resolved)];
    });
  }
}
