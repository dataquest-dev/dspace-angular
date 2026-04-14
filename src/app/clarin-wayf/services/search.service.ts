import {
  Injectable,
  signal,
} from '@angular/core';

import { IdentityProvider } from '../models/idp-entry.model';

/**
 * Fuzzy search service for filtering IdP entries.
 * Handles diacritics normalization, typo tolerance via bigram similarity,
 * and display name resolution.
 */
@Injectable({ providedIn: 'root' })
export class WayfSearchService {

  /** Current search query. */
  readonly query = signal('');

  /**
   * Normalize a string for comparison: lowercase, strip diacritics, collapse whitespace.
   */
  normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Extract a readable domain hint from an entityID URL.
   * e.g. "https://idp.example.org/shibboleth" → "idp example org"
   */
  extractDomain(entityID: string): string {
    try {
      const host = new URL(entityID).hostname;
      return host.replace(/\./g, ' ');
    } catch {
      return '';
    }
  }

  /**
   * Resolve the display name for an IdP entry.
   * Returns the `title` field directly (already resolved during normalization).
   */
  resolveDisplayName(entry: IdentityProvider): string {
    return entry.title;
  }

  /**
   * Collect all searchable text for an IdP entry.
   */
  getSearchableText(entry: IdentityProvider): string {
    const parts: string[] = [entry.title];
    if (entry.keywords?.length) {
      parts.push(...entry.keywords);
    }
    if (entry.description) {
      parts.push(entry.description);
    }
    if (entry.country) {
      parts.push(entry.country);
    }
    parts.push(this.extractDomain(entry.entityID));
    parts.push(entry.entityID);
    return parts.join(' ');
  }

  /**
   * Generate character bigrams from a string.
   */
  private bigrams(text: string): Set<string> {
    const result = new Set<string>();
    for (let i = 0; i < text.length - 1; i++) {
      result.add(text.substring(i, i + 2));
    }
    return result;
  }

  /**
   * Sørensen–Dice coefficient for two strings (bigram similarity).
   * Returns a value between 0 (no match) and 1 (identical).
   */
  diceCoefficient(a: string, b: string): number {
    const bigramsA = this.bigrams(a);
    const bigramsB = this.bigrams(b);
    if (bigramsA.size === 0 && bigramsB.size === 0) {
      return 1;
    }
    let intersection = 0;
    for (const bg of bigramsA) {
      if (bigramsB.has(bg)) {
        intersection++;
      }
    }
    return (2 * intersection) / (bigramsA.size + bigramsB.size);
  }

  /**
   * Score an IdP entry against the current query.
   * Returns a score between 0 (no match) and 1+ (strong match).
   * A score of 0 means the entry should be filtered out.
   */
  scoreEntry(entry: IdentityProvider, query: string): number {
    if (!query) {
      return 1; // No query = show all
    }

    const normalizedQuery = this.normalize(query);
    const searchableText = this.normalize(this.getSearchableText(entry));

    // Exact substring match → highest score
    if (searchableText.includes(normalizedQuery)) {
      return 2;
    }

    // Check individual query words against searchable text
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);
    let wordMatchCount = 0;
    for (const word of queryWords) {
      if (searchableText.includes(word)) {
        wordMatchCount++;
      }
    }
    if (wordMatchCount > 0) {
      return 1 + (wordMatchCount / queryWords.length);
    }

    // Fuzzy match via Dice coefficient on individual words
    const textWords = searchableText.split(' ');
    let bestDice = 0;
    for (const qWord of queryWords) {
      if (qWord.length < 2) {
        continue;
      }
      for (const tWord of textWords) {
        const dice = this.diceCoefficient(qWord, tWord);
        if (dice > bestDice) {
          bestDice = dice;
        }
      }
    }

    // Threshold: only return fuzzy matches above 0.4 similarity
    return bestDice >= 0.4 ? bestDice : 0;
  }

  /**
   * Filter and rank IdP entries by the current query.
   */
  filterEntries(entries: IdentityProvider[], query: string): IdentityProvider[] {
    if (!query || query.trim().length === 0) {
      return entries;
    }

    const scored = entries
      .map(entry => {
        let score = this.scoreEntry(entry, query);

        // Bonus for matching the title directly
        const title = entry.title;
        if (title) {
          const normalizedTitle = this.normalize(title);
          const normalizedQuery = this.normalize(query);
          if (normalizedTitle.includes(normalizedQuery)) {
            score += 0.5;
          }
        }

        return { entry, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.entry);
  }
}
