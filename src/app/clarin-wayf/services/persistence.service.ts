import {
  Injectable,
  signal,
} from '@angular/core';

const STORAGE_KEY_LAST = 'clarin-wayf-last-idp';

/**
 * Service for persisting IdP selections in localStorage.
 * Tracks the last selected IdP so the shortcut card can show "Continue with ...".
 */
@Injectable({ providedIn: 'root' })
export class WayfPersistenceService {

  /** The entityID of the last selected IdP. */
  readonly lastIdp = signal<string | null>(this.readLast());

  /** Record an IdP selection. */
  selectIdp(entityID: string): void {
    this.lastIdp.set(entityID);
    this.writeLast(entityID);
  }

  private readLast(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST);
    } catch {
      return null;
    }
  }

  private writeLast(entityID: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_LAST, entityID);
    } catch {
      // localStorage unavailable (SSR or quota exceeded)
    }
  }
}
