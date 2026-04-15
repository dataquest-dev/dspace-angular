import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import { IdentityProvider } from '../../models/idp-entry.model';
import { WayfIdpCardComponent } from '../idp-card/wayf-idp-card.component';

/**
 * Scrollable list of IdP cards with keyboard navigation.
 */
@Component({
  selector: 'ds-wayf-idp-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WayfIdpCardComponent],
  template: `
    <div
      id="wayf-idp-listbox"
      class="wayf-idp-list"
      role="listbox"
      [attr.aria-label]="'List of identity providers'"
      tabindex="0"
      (keydown)="onKeydown($event)">

      @for (entry of entries(); track entry.entityID; let i = $index) {
        <ds-wayf-idp-card
          [entry]="entry"
          [isActive]="i === activeIndex()"
          [isHub]="hubEntityIds().has(entry.entityID)"
          (selected)="idpSelected.emit($event)"
        />
      }

      @if (entries().length === 0 && !loading()) {
        <div class="wayf-idp-list__empty text-center text-muted py-4">
          No institutions match your search
        </div>
      }
    </div>

    <div class="visually-hidden" aria-live="polite" aria-atomic="true">
      {{ entries().length }} results available
    </div>
  `,
  styles: [`
    .wayf-idp-list {
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
  `],
})
export class WayfIdpListComponent {

  /** Sorted/filtered entries to display. */
  readonly entries = input.required<IdentityProvider[]>();

  /** Whether the feed is still loading. */
  readonly loading = input(false);

  /** Set of hub/proxy entityIDs for badge display. */
  readonly hubEntityIds = input<Set<string>>(new Set());

  /** Emits when an IdP is selected. */
  readonly idpSelected = output<IdentityProvider>();

  /** Emits when focus should return to the search bar. */
  readonly focusSearch = output<void>();

  /** Currently keyboard-focused index. */
  readonly activeIndex = signal(-1);

  onKeydown(event: KeyboardEvent): void {
    const list = this.entries();
    const current = this.activeIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(current + 1, list.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (current <= 0) {
          this.activeIndex.set(-1);
          this.focusSearch.emit();
        } else {
          this.activeIndex.set(current - 1);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (current >= 0 && current < list.length) {
          this.idpSelected.emit(list[current]);
        }
        break;
      case 'Escape':
        this.focusSearch.emit();
        break;
    }
  }

  /** Reset active index (e.g., when results change). */
  resetActive(): void {
    this.activeIndex.set(-1);
  }
}
