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
 * Renders a single IdP entry card with logo, display name, and optional hub badge.
 */
@Component({
  selector: 'ds-wayf-idp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wayf-idp-card d-flex align-items-center p-2"
         role="option"
         [attr.aria-selected]="isActive()"
         [class.wayf-idp-card--active]="isActive()"
         [class.wayf-idp-card--hub]="isHub()"
         tabindex="-1"
         (click)="selected.emit(entry())"
         (keydown.enter)="selected.emit(entry())"
         (keydown.space)="$event.preventDefault(); selected.emit(entry())">

      @if (logo(); as logoUrl) {
        <div class="wayf-idp-card__logo me-3">
          <img [src]="logoUrl" [alt]="displayName()" class="wayf-idp-card__logo-img" loading="lazy">
        </div>
      } @else {
        <div class="wayf-idp-card__logo wayf-idp-card__logo--placeholder me-3">
          <span class="wayf-idp-card__initials">{{ initials() }}</span>
        </div>
      }

      <div class="wayf-idp-card__info flex-grow-1">
        <div class="wayf-idp-card__name fw-semibold">{{ displayName() }}</div>
        <div class="wayf-idp-card__entity-id text-muted small text-truncate">{{ entry().entityID }}</div>
      </div>

      @if (isHub()) {
        <span class="badge bg-info text-dark ms-2">{{ i18n.t('wayf.hub.badge') }}</span>
      }
    </div>
  `,
  styles: [`
    .wayf-idp-card {
      cursor: pointer;
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 0.375rem;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .wayf-idp-card:hover,
    .wayf-idp-card--active {
      background-color: var(--bs-primary-bg-subtle, #e7f1ff);
      border-color: var(--bs-primary, #0d6efd);
    }
    .wayf-idp-card--hub {
      border-left: 3px solid var(--bs-info, #0dcaf0);
    }
    .wayf-idp-card__logo {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .wayf-idp-card__logo-img {
      max-width: 40px;
      max-height: 40px;
      object-fit: contain;
    }
    .wayf-idp-card__logo--placeholder {
      background-color: var(--bs-secondary-bg, #e9ecef);
      border-radius: 0.25rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--bs-secondary-color, #6c757d);
    }
    .wayf-idp-card__entity-id {
      max-width: 300px;
    }
  `],
})
export class WayfIdpCardComponent {
  protected readonly i18n = inject(WayfI18nService);
  private readonly searchService = inject(WayfSearchService);

  /** The IdP entry to display. */
  readonly entry = input.required<IdpEntry>();

  /** Whether this card is currently active/focused. */
  readonly isActive = input(false);

  /** Whether this IdP is a hub/proxy entity. */
  readonly isHub = input(false);

  /** Emits when the user selects this IdP. */
  readonly selected = output<IdpEntry>();

  /** Resolved display name in the active language. */
  readonly displayName = computed(() =>
    this.searchService.resolveDisplayName(this.entry().DisplayNames, this.i18n.lang()),
  );

  /** First suitable logo URL. */
  readonly logo = computed(() => {
    const logos = this.entry().Logos;
    return logos?.[0]?.value ?? null;
  });

  /** Initials fallback when no logo is available. */
  readonly initials = computed(() => {
    const name = this.displayName();
    const parts = name.split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.substring(0, 2)).toUpperCase();
  });
}
