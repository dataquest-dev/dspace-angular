import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { IdentityProvider } from '../../models/idp-entry.model';
import { WayfI18nService } from '../../services/i18n.service';

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

      <div class="wayf-idp-card__logo-box me-3">
        @if (entry().logoUrl && !logoFailed()) {
          <img class="wayf-idp-card__logo"
               [src]="entry().logoUrl"
               alt=""
               loading="lazy"
               (error)="logoFailed.set(true)" />
        } @else {
          <div class="wayf-idp-card__logo wayf-idp-card__logo--placeholder">
            <i class="fas fa-university" aria-hidden="true"></i>
          </div>
        }
      </div>

      <div class="wayf-idp-card__info min-w-0 flex-grow-1">
        <div class="wayf-idp-card__name fw-semibold text-truncate">{{ entry().title }}</div>
        <div class="wayf-idp-card__entity-id text-muted small text-truncate">{{ entry().entityID }}</div>
      </div>

      @if (isHub()) {
        <span class="badge bg-info text-dark ms-2 flex-shrink-0">{{ i18n.t('wayf.hub.badge') }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
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
    .wayf-idp-card__logo-box {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .wayf-idp-card__logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
      display: block;
    }
    .wayf-idp-card__logo--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bs-secondary-bg, #e9ecef);
      border-radius: 0.25rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--bs-secondary-color, #6c757d);
    }
    .min-w-0 {
      min-width: 0;
    }
  `],
})
export class WayfIdpCardComponent {
  protected readonly i18n = inject(WayfI18nService);

  /** The IdP entry to display. */
  readonly entry = input.required<IdentityProvider>();

  /** Whether this card is currently active/focused. */
  readonly isActive = input(false);

  /** Whether this IdP is a hub/proxy entity. */
  readonly isHub = input(false);

  /** Emits when the user selects this IdP. */
  readonly selected = output<IdentityProvider>();

  /** Flips to true when the logo <img> fires an error (404, invalid URL, etc.). */
  readonly logoFailed = signal(false);
}
