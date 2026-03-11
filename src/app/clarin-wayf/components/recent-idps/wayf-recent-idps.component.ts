import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { IdpEntry } from '../../models/idp-entry.model';
import { WayfI18nService } from '../../services/i18n.service';
import { WayfSearchService } from '../../services/search.service';

/**
 * Shows a shortcut card for the last-used IdP and a list of recent selections.
 */
@Component({
  selector: 'ds-wayf-recent-idps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lastEntry()) {
      <div class="wayf-recent mb-3">
        <div
          class="wayf-recent__shortcut d-flex align-items-center p-3 rounded border"
          role="button"
          tabindex="0"
          (click)="idpSelected.emit(lastEntry()!)"
          (keydown.enter)="idpSelected.emit(lastEntry()!)"
          (keydown.space)="$event.preventDefault(); idpSelected.emit(lastEntry()!)">
          <div class="me-3">
            <i class="fas fa-arrow-right text-primary" aria-hidden="true"></i>
          </div>
          <div>
            <div class="small text-muted">{{ i18n.t('wayf.recent.continue') }}</div>
            <div class="fw-semibold">{{ lastDisplayName() }}</div>
          </div>
        </div>
      </div>
    }

    @if (recentEntries().length > 1) {
      <div class="wayf-recent-list mb-3">
        <div class="small text-muted mb-1">{{ i18n.t('wayf.recent.title') }}</div>
        @for (entry of recentEntries(); track entry.entityID; let i = $index) {
          @if (i > 0) {
            <div
              class="wayf-recent-list__item d-flex align-items-center py-1 px-2 rounded"
              role="button"
              tabindex="0"
              (click)="idpSelected.emit(entry)"
              (keydown.enter)="idpSelected.emit(entry)"
              (keydown.space)="$event.preventDefault(); idpSelected.emit(entry)">
              <span class="small">{{ resolveName(entry) }}</span>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    .wayf-recent__shortcut {
      cursor: pointer;
      background-color: var(--bs-primary-bg-subtle, #e7f1ff);
      border-color: var(--bs-primary, #0d6efd) !important;
      transition: background-color 0.15s ease;
    }
    .wayf-recent__shortcut:hover {
      background-color: var(--bs-primary-bg-subtle, #cfe2ff);
    }
    .wayf-recent-list__item {
      cursor: pointer;
    }
    .wayf-recent-list__item:hover {
      background-color: var(--bs-tertiary-bg, #f8f9fa);
    }
  `],
})
export class WayfRecentIdpsComponent {
  protected readonly i18n = inject(WayfI18nService);
  private readonly searchService = inject(WayfSearchService);

  /** All entries from the feed (needed to resolve names). */
  readonly allEntries = input.required<IdpEntry[]>();

  /** The entityID of the last selected IdP. */
  readonly lastIdpEntityId = input<string | null>(null);

  /** List of recently selected entityIDs. */
  readonly recentIdpEntityIds = input<string[]>([]);

  /** Emits when an IdP is selected via shortcut. */
  readonly idpSelected = output<IdpEntry>();

  /** The full IdP entry for the last selection. */
  readonly lastEntry = computed(() => {
    const lastId = this.lastIdpEntityId();
    if (!lastId) {
      return null;
    }
    return this.allEntries().find(e => e.entityID === lastId) ?? null;
  });

  /** Recent IdP entries (resolved from entityIDs). */
  readonly recentEntries = computed(() => {
    const ids = this.recentIdpEntityIds();
    const all = this.allEntries();
    return ids
      .map(id => all.find(e => e.entityID === id))
      .filter((e): e is IdpEntry => e !== undefined);
  });

  readonly lastDisplayName = computed(() => {
    const entry = this.lastEntry();
    if (!entry) {
      return '';
    }
    return this.searchService.resolveDisplayName(entry.DisplayNames, this.i18n.lang());
  });

  resolveName(entry: IdpEntry): string {
    return this.searchService.resolveDisplayName(entry.DisplayNames, this.i18n.lang());
  }
}
