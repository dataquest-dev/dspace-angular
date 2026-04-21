import {
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Default localStorage key prefix. */
const STORAGE_KEY_PREFIX = 'wayf';

/**
 * Service for persisting IdP selections in localStorage.
 * Tracks the last selected IdP so the shortcut card can show "Continue with ...".
 *
 * Gracefully handles SSR (no `localStorage`) and quota-exceeded scenarios.
 */
@Injectable()
export class WayfPersistenceService {

  private readonly platformId = inject(PLATFORM_ID);

  /** The entityID of the last selected IdP. */
  readonly lastIdp = signal<string | null>(this.readLast());

  /** Record an IdP selection. */
  selectIdp(entityID: string): void {
    this.lastIdp.set(entityID);
    this.writeLast(entityID);
  }

  private get storageKey(): string {
    return `${STORAGE_KEY_PREFIX}:last-idp`;
  }

  private readLast(): string | null {
    if (!isPlatformBrowser(this.platformId)) { return null; }
    try {
      return localStorage.getItem(this.storageKey);
    } catch (err) {
      console.warn('[WAYF] Failed to read from localStorage', err);
      return null;
    }
  }

  private writeLast(entityID: string): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    try {
      localStorage.setItem(this.storageKey, entityID);
    } catch (err) {
      console.warn('[WAYF] Failed to write to localStorage', err);
    }
  }
}
