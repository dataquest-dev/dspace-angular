import {
  computed,
  Injectable,
  signal,
} from '@angular/core';

const STORAGE_KEY_LAST = 'clarin-wayf-last-idp';
const STORAGE_KEY_RECENT = 'clarin-wayf-recent-idps';
const MAX_RECENT = 5;

/**
 * Service for persisting IdP selections in localStorage.
 * Tracks the last selected IdP and a history of recent selections.
 */
@Injectable({ providedIn: 'root' })
export class WayfPersistenceService {

  /** The entityID of the last selected IdP. */
  readonly lastIdp = signal<string | null>(this.readLast());

  /** List of recently selected entityIDs (most recent first). */
  readonly recentIdps = signal<string[]>(this.readRecent());

  /**
   * Record an IdP selection: update last + push to recent list.
   */
  selectIdp(entityID: string): void {
    // Update last
    this.lastIdp.set(entityID);
    this.writeLast(entityID);

    // Update recent: remove if already present, prepend, trim to max
    const recent = [entityID, ...this.recentIdps().filter(id => id !== entityID)].slice(0, MAX_RECENT);
    this.recentIdps.set(recent);
    this.writeRecent(recent);
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

  private readRecent(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT);
        }
      }
    } catch {
      // Corrupted or unavailable
    }
    return [];
  }

  private writeRecent(entityIDs: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(entityIDs));
    } catch {
      // localStorage unavailable
    }
  }
}
