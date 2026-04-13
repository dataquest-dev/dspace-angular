import {
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IdpEntry } from '../models/idp-entry.model';

/**
 * Service to fetch and cache the IdP feed from the DSpace backend
 * endpoint (`/api/discojuice/feeds`).
 *
 * The backend returns a JSON array of "shrunk" IdP entries
 * (title, keywords[], country, Tags[]).
 * A 204 response means feeds have not loaded yet on the server side.
 */
@Injectable({ providedIn: 'root' })
export class WayfFeedService {

  private readonly http = inject(HttpClient);

  /** All IdP entries loaded from the feed (raw, unfiltered). */
  readonly entries = signal<IdpEntry[]>([]);

  /** Loading state. */
  readonly loading = signal(false);

  /** Error message if feed loading fails. */
  readonly error = signal<string | null>(null);

  /**
   * Fetch the IdP feed from the given URL, optionally filtering by tag.
   * The URL should point to the backend `/api/discojuice/feeds` endpoint
   * (or a compatible JSON array).
   */
  async loadFeed(feedUrl: string, categoryFilter: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<IdpEntry[]>(feedUrl, { observe: 'response' }),
      );

      // Backend returns 204 when the feeds haven't been cached yet
      if (response.status === 204 || !response.body) {
        this.entries.set([]);
        return;
      }

      let filtered = response.body;

      if (categoryFilter) {
        const tag = categoryFilter.toLowerCase();
        filtered = filtered.filter(entry =>
          entry.Tags?.some(t => t.toLowerCase() === tag),
        );
      }

      this.entries.set(filtered);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load IdP feed';
      this.error.set(message);
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
