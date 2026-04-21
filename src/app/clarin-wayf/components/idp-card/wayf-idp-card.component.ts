import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';

import { IdentityProvider } from '../../models/idp-entry.model';

/**
 * Renders a single IdP entry card with logo, display name, and optional hub badge.
 */
@Component({
  selector: 'ds-wayf-idp-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wayf-idp-card d-flex align-items-center p-2 rounded border"
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
          <div class="wayf-idp-card__logo wayf-idp-card__logo--placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="wayf-idp-card__logo-icon" focusable="false">
              <path d="M12 3 2 8l10 5 8-4v7h2V8L12 3Zm-6 9v6H4v2h16v-2h-2v-6h-2v6h-2v-6h-2v6h-2v-6H6Z" />
            </svg>
          </div>
        }
      </div>

      <div class="wayf-idp-card__info min-w-0 flex-grow-1">
        <div class="wayf-idp-card__name fw-semibold text-truncate">{{ entry().title }}</div>
        <div class="wayf-idp-card__entity-id text-muted small text-truncate">{{ entry().entityID }}</div>
      </div>

      @if (isHub()) {
        <span class="wayf-idp-card__badge badge bg-info text-dark ms-2 flex-shrink-0">Hub</span>
      }
    </div>
  `,
  styleUrls: ['./wayf-idp-card.component.scss'],
})
export class WayfIdpCardComponent {

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
