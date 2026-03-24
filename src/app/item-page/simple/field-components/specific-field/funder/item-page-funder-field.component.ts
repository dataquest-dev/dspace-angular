import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { Item } from '../../../../../core/shared/item.model';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
import { MetadataFieldWrapperComponent } from '../../../../../shared/metadata-field-wrapper/metadata-field-wrapper.component';

/**
 * Mapping of codes to full funder names.
 */
const FUNDER_NAME_MAP: Record<string, string> = {
  'EC': 'European Commission',
  'EU': 'European Union / European Commission',
  'Franklinia': 'Franklinia',
  'GA0': 'Grantová agentura ČR',
  'MK0': 'Ministerstvo kultury ČR',
  'MSM': 'Ministerstvo školství, mládeže a tělovýchovy ČR',
  'MZ0': 'Ministerstvo zdravotnictví ČR',
  'MZE': 'Ministerstvo zemědělství ČR',
  'TA0': 'Technologická agentura ČR',
};

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
 */
export class ItemPageFunderFieldComponent implements OnInit {

  @Input() item: Item;

  @Input() label = 'item.page.funder';

  @Input() separator = ', ';

  funderNames: string[] = [];

  ngOnInit(): void {
    const mdValues: MetadataValue[] = this.item?.allMetadata(['dc.relation.funder']) ?? [];
    const resolved = mdValues.map(md => FUNDER_NAME_MAP[md.value] ?? md.value);

    // Removed duplicates
    this.funderNames = [...new Set(resolved)];
  }
}
