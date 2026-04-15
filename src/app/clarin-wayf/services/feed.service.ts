import {
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { IdentityProvider, normalizeEntry } from '../models/idp-entry.model';

/**
 * Service to fetch and cache the IdP feed.
 *
 * Uses the native `fetch()` API instead of Angular's `HttpClient` to avoid
 * DSpace's global `withCredentials` interceptor, which causes CORS failures
 * when the remote DiscoFeed server returns `Access-Control-Allow-Origin: *`.
 *
 * Accepts any JSON array of IdP entries — standard Shibboleth DiscoFeed
 * (with `DisplayNames[]`, `Logos[]`, etc.) or the flat `IdentityProvider`
 * format (with `title`, `logoUrl`, etc.). Entries are auto-detected and
 * normalized to `IdentityProvider` on load.
 */
@Injectable()
export class WayfFeedService {

  private readonly platformId = inject(PLATFORM_ID);

  /** All IdP entries loaded from the feed (normalized). */
  readonly entries = signal<IdentityProvider[]>([]);

  /** Loading state. */
  readonly loading = signal(false);

  /** Error message if feed loading fails. */
  readonly error = signal<string | null>(null);

  /**
   * Fetch the IdP feed from the given URL and normalize entries.
   *
   * @param feedUrl  URL returning a JSON array of IdP entries.
   * @param locale   Language code for resolving localized DiscoFeed values.
   */
  async loadFeed(feedUrl: string, locale = 'en'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return; // SSR — skip fetch
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(feedUrl, {
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // HTTP 204 No Content — valid but empty
      if (response.status === 204) {
        this.entries.set([]);
        return;
      }

      const data: any[] = await response.json();

      if (!Array.isArray(data)) {
        this.entries.set([]);
        return;
      }

      const normalized = data.map(raw => normalizeEntry(raw, locale));
      const seen = new Set<string>();
      const unique = normalized.filter(e => {
        if (seen.has(e.entityID)) { return false; }
        seen.add(e.entityID);
        return true;
      });
      this.entries.set(unique);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load IdP feed';
      console.warn('[WAYF] Feed load failed:', message);
      this.error.set(message);
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
