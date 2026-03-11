import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { WayfI18nService } from '../../services/i18n.service';

/**
 * Search input bar for filtering IdP entries.
 */
@Component({
  selector: 'ds-wayf-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wayf-search-bar" role="search">
      <label [attr.for]="inputId" class="visually-hidden">{{ i18n.t('wayf.a11y.search-label') }}</label>
      <div class="input-group">
        <span class="input-group-text">
          <i class="fas fa-search" aria-hidden="true"></i>
        </span>
        <input
          #searchInput
          [id]="inputId"
          type="search"
          class="form-control form-control-lg"
          [placeholder]="i18n.t('wayf.search.placeholder')"
          [value]="value()"
          (input)="onInput($event)"
          (keydown.arrowdown)="arrowDown.emit()"
          (keydown.escape)="escaped.emit()"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="hasResults()"
          aria-controls="wayf-idp-listbox"
        >
      </div>
    </div>
  `,
  styles: [`
    .wayf-search-bar {
      margin-bottom: 0.75rem;
    }
    .input-group-text {
      background-color: var(--bs-body-bg, #fff);
    }
  `],
})
export class WayfSearchBarComponent {
  protected readonly i18n = inject(WayfI18nService);

  readonly inputId = 'wayf-search-input';

  /** Current search value (two-way via parent). */
  readonly value = input('');

  /** Whether the result list has entries. */
  readonly hasResults = input(false);

  /** Emits the new query string on input. */
  readonly queryChange = output<string>();

  /** Emits when arrow-down is pressed (to move focus into list). */
  readonly arrowDown = output<void>();

  /** Emits when Escape is pressed. */
  readonly escaped = output<void>();

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  focusInput(): void {
    this.searchInput()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.queryChange.emit(value);
  }
}
