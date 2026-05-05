import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { Item } from '../../../../../core/shared/item.model';
import { MetadataValue } from '../../../../../core/shared/metadata.models';
import { getFirstCompletedRemoteData } from '../../../../../core/shared/operators';
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

  @Input() introLabel = 'item.page.funder.message';

  @Input() separator = ', ';

  funderNames: string[] = [];

  constructor(
    private configurationService: ConfigurationDataService,
  ) {}

  private isEuropeanUnionValue(value: string): boolean {
    const normalized = value?.trim().toLowerCase();
    return normalized === 'eu' || normalized === 'european union';
  }

  private uniqueCaseInsensitive(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
      const key = value.trim().toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  ngOnInit(): void {
    const mdValues: MetadataValue[] = this.item?.allMetadata(['dc.relation.funder']) ?? [];
    const rawFunders = mdValues
      .map((md) => md.value?.trim())
      .filter((value): value is string => Boolean(value));
    const hasLocalHorizon = (this.item?.allMetadata(['local.horizon']) ?? [])
      .some((md) => Boolean(md.value?.trim()));

    if (rawFunders.length === 0 && !hasLocalHorizon) {
      return;
    }

    if (rawFunders.length === 0 && hasLocalHorizon) {
      this.funderNames = ['European Union'];
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
      const resolved = rawFunders.map((value) => nameMap[value] ?? value);
      if (hasLocalHorizon && !resolved.some((value) => this.isEuropeanUnionValue(value))) {
        resolved.push('European Union');
      }
      this.funderNames = this.uniqueCaseInsensitive(resolved);
    });
  }
}
