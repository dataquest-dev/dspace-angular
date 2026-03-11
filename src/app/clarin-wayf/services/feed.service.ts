import {
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IdpEntry } from '../models/idp-entry.model';

/**
 * Service to fetch and cache the IdP feed from a DiscoFeed JSON endpoint.
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
   */
  async loadFeed(feedUrl: string, categoryFilter: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await firstValueFrom(
        this.http.get<IdpEntry[]>(feedUrl),
      );

      let filtered = raw ?? [];

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
