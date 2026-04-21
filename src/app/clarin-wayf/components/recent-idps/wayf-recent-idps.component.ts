import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { IdentityProvider } from '../../models/idp-entry.model';

/**
 * Shows a single shortcut button for quick IdP selection:
 *  - If a static default IdP is configured → shows it as "Default institution".
 *  - Otherwise, if the user has a last-used IdP → shows it as "Continue with".
 *  - If neither exists → nothing is rendered.
 */
@Component({
  selector: 'ds-wayf-recent-idps',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shortcutEntry(); as entry) {
      <div class="wayf-shortcut mb-3">
        <div
          class="wayf-shortcut__card d-flex align-items-center p-3 rounded border"
          role="button"
          tabindex="0"
          (click)="idpSelected.emit(entry)"
          (keydown.enter)="idpSelected.emit(entry)"
          (keydown.space)="$event.preventDefault(); idpSelected.emit(entry)">
          <div class="me-3">
            <i class="fas fa-arrow-right text-primary" aria-hidden="true"></i>
          </div>
          <div>
            <div class="wayf-shortcut__label small text-muted">{{ shortcutLabel() }}</div>
            <div class="wayf-shortcut__name fw-semibold">{{ shortcutDisplayName() }}</div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./wayf-recent-idps.component.scss'],
})
export class WayfRecentIdpsComponent {

  /** All entries from the feed (needed to resolve names). */
  readonly allEntries = input.required<IdentityProvider[]>();

  /** The entityID of the last selected IdP. */
  readonly lastIdpEntityId = input<string | null>(null);

  /**
   * EntityID of the statically configured default IdP (from WAYF_CONFIG or input).
   * When set, this takes priority over the last-used IdP.
   */
  readonly defaultEntityId = input<string | null>(null);

  /** Emits when the shortcut IdP is selected. */
  readonly idpSelected = output<IdentityProvider>();

  /** Whether we are showing a static default (true) or a last-used entry (false). */
  private readonly isStaticDefault = computed(() => {
    const defId = this.defaultEntityId();
    return !!defId && this.allEntries().some(e => e.entityID === defId);
  });

  /** The single IdP entry to show: static default wins, then last-used. */
  readonly shortcutEntry = computed<IdentityProvider | null>(() => {
    const all = this.allEntries();

    // Priority 1: static default
    const defId = this.defaultEntityId();
    if (defId) {
      const found = all.find(e => e.entityID === defId);
      if (found) { return found; }
    }

    // Priority 2: last-used
    const lastId = this.lastIdpEntityId();
    if (lastId) {
      return all.find(e => e.entityID === lastId) ?? null;
    }

    return null;
  });

  /** Label shown above the institution name. */
  readonly shortcutLabel = computed(() =>
    this.isStaticDefault()
      ? 'Default institution'
      : 'Continue with',
  );

  /** Resolved display name for the shortcut entry. */
  readonly shortcutDisplayName = computed(() => {
    const entry = this.shortcutEntry();
    if (!entry) { return ''; }
    return entry.title;
  });
}
