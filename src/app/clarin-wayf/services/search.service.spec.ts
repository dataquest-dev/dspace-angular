import { TestBed } from '@angular/core/testing';

import { IdentityProvider } from '../models/idp-entry.model';
import { WayfSearchService } from './search.service';

/**
 * Helper: build a minimal IdentityProvider for testing.
 */
function makeEntry(overrides: Partial<IdentityProvider> & { entityID: string }): IdentityProvider {
  return {
    title: overrides.entityID,
    ...overrides,
  } as IdentityProvider;
}

describe('WayfSearchService', () => {
  let service: WayfSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayfSearchService],
    });
    service = TestBed.inject(WayfSearchService);
  });

  // ── normalize() ──────────────────────────────────────────────

  describe('normalize()', () => {
    it('should lowercase text', () => {
      expect(service.normalize('HELLO')).toBe('hello');
    });

    it('should strip diacritics', () => {
      expect(service.normalize('Příkladová Univerzita')).toBe('prikladova univerzita');
    });

    it('should strip accented characters (café → cafe)', () => {
      expect(service.normalize('café')).toBe('cafe');
    });

    it('should handle German umlauts', () => {
      expect(service.normalize('München')).toBe('munchen');
    });

    it('should collapse multiple spaces', () => {
      expect(service.normalize('  foo   bar  ')).toBe('foo bar');
    });

    it('should handle empty string', () => {
      expect(service.normalize('')).toBe('');
    });
  });

  // ── extractDomain() ─────────────────────────────────────────

  describe('extractDomain()', () => {
    it('should extract hostname words from a URL', () => {
      expect(service.extractDomain('https://idp.example.org/shibboleth')).toBe('idp example org');
    });

    it('should return empty string for invalid URL', () => {
      expect(service.extractDomain('not-a-url')).toBe('');
    });
  });

  // ── resolveDisplayName() ────────────────────────────────────

  describe('resolveDisplayName()', () => {
    it('should return the title field directly', () => {
      const entry = makeEntry({
        entityID: 'e1',
        title: 'Masaryk University',
      });
      expect(service.resolveDisplayName(entry)).toBe('Masaryk University');
    });

    it('should return the title regardless of locale', () => {
      const entry = makeEntry({
        entityID: 'e1',
        title: 'Masarykova univerzita',
      });
      expect(service.resolveDisplayName(entry)).toBe('Masarykova univerzita');
    });

    it('should return entityID as fallback when title equals entityID', () => {
      const entry = makeEntry({ entityID: 'https://idp.example.org' });
      expect(service.resolveDisplayName(entry)).toBe('https://idp.example.org');
    });
  });

  // ── diceCoefficient() ──────────────────────────────────────

  describe('diceCoefficient()', () => {
    it('should return 1 for identical strings', () => {
      expect(service.diceCoefficient('night', 'night')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(service.diceCoefficient('abc', 'xyz')).toBe(0);
    });

    it('should return a value between 0 and 1 for similar strings', () => {
      const score = service.diceCoefficient('night', 'nacht');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should return 1 for two empty strings', () => {
      expect(service.diceCoefficient('', '')).toBe(1);
    });

    it('should handle single character strings (no bigrams)', () => {
      expect(service.diceCoefficient('a', 'a')).toBe(1);
    });

    it('should score "masarky" vs "masaryk" highly (typo tolerance)', () => {
      const score = service.diceCoefficient('masarky', 'masaryk');
      expect(score).toBeGreaterThanOrEqual(0.6);
    });
  });

  // ── scoreEntry() ───────────────────────────────────────────

  describe('scoreEntry()', () => {
    const masaryk = makeEntry({
      entityID: 'https://shibboleth.muni.cz/idp/shibboleth',
      title: 'Masaryk University',
      keywords: ['masaryk', 'brno', 'czech republic', 'muni', 'masarykova univerzita'],
    });

    it('should return 1 for empty query (show all)', () => {
      expect(service.scoreEntry(masaryk, '')).toBe(1);
    });

    it('should return 2 for exact substring match', () => {
      expect(service.scoreEntry(masaryk, 'Masaryk')).toBe(2);
    });

    it('should return 2 for diacritics-normalized match', () => {
      expect(service.scoreEntry(masaryk, 'masarykova')).toBe(2);
    });

    it('should match by entityID domain', () => {
      const score = service.scoreEntry(masaryk, 'muni.cz');
      expect(score).toBeGreaterThan(0);
    });

    it('should match by keyword', () => {
      const score = service.scoreEntry(masaryk, 'brno');
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for completely unrelated query', () => {
      expect(service.scoreEntry(masaryk, 'zzzzxxxx')).toBe(0);
    });

    it('should score a fuzzy typo above 0 when close enough', () => {
      const score = service.scoreEntry(masaryk, 'masarky');
      expect(score).toBeGreaterThan(0);
    });
  });

  // ── filterEntries() ────────────────────────────────────────

  describe('filterEntries()', () => {
    const entries: IdentityProvider[] = [
      makeEntry({
        entityID: 'https://idp.example.org/shibboleth',
        title: 'Example University',
        keywords: ['example', 'research'],
      }),
      makeEntry({
        entityID: 'https://shibboleth.muni.cz/idp/shibboleth',
        title: 'Masaryk University',
        keywords: ['masaryk', 'brno', 'czech republic', 'masarykova univerzita'],
      }),
      makeEntry({
        entityID: 'https://idp.cuni.cz/idp/shibboleth',
        title: 'Charles University',
        keywords: ['charles', 'prague', 'univerzita karlova'],
      }),
    ];

    it('should return all entries for empty query', () => {
      expect(service.filterEntries(entries, '').length).toBe(3);
    });

    it('should filter to matching entries only', () => {
      const result = service.filterEntries(entries, 'Masaryk');
      expect(result.length).toBe(1);
      expect(result[0].entityID).toBe('https://shibboleth.muni.cz/idp/shibboleth');
    });

    it('should match case-insensitively', () => {
      const result = service.filterEntries(entries, 'masaryk');
      expect(result.length).toBe(1);
    });

    it('should match diacritics-insensitively', () => {
      const result = service.filterEntries(entries, 'univerzita');
      // All 3 match: "univerzita" appears in keywords of entries 2 & 3,
      // and fuzzy/normalized scoring also matches "University" in entry 1
      expect(result.length).toBe(3);
    });

    it('should return "University" entries for the generic term "University"', () => {
      const result = service.filterEntries(entries, 'University');
      expect(result.length).toBe(3);
    });

    it('should rank exact matches higher than partial matches', () => {
      const result = service.filterEntries(entries, 'charles');
      expect(result[0].entityID).toBe('https://idp.cuni.cz/idp/shibboleth');
    });

    it('should match by keywords', () => {
      const result = service.filterEntries(entries, 'Karlova');
      expect(result[0].entityID).toBe('https://idp.cuni.cz/idp/shibboleth');
    });

    it('should return empty array when nothing matches', () => {
      const result = service.filterEntries(entries, 'zzzzxxxx');
      expect(result.length).toBe(0);
    });
  });
});
