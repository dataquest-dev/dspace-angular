import { TestBed } from '@angular/core/testing';

import { IdpEntry } from '../models/idp-entry.model';
import { WayfSearchService } from './search.service';

/**
 * Helper: build a minimal IdpEntry for testing.
 */
function makeEntry(overrides: Partial<IdpEntry> & { entityID: string }): IdpEntry {
  return {
    DisplayNames: [],
    Logos: [],
    Keywords: [],
    InformationURLs: [],
    PrivacyStatementURLs: [],
    Tags: [],
    ...overrides,
  };
}

describe('WayfSearchService', () => {
  let service: WayfSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
    const names = [
      { value: 'Masaryk University', lang: 'en' },
      { value: 'Masarykova univerzita', lang: 'cs' },
    ];

    it('should prefer the requested language', () => {
      expect(service.resolveDisplayName(names, 'cs')).toBe('Masarykova univerzita');
    });

    it('should fallback to English when requested lang not present', () => {
      expect(service.resolveDisplayName(names, 'de')).toBe('Masaryk University');
    });

    it('should fallback to first entry if no English', () => {
      const noEn = [{ value: 'LMU München', lang: 'de' }];
      expect(service.resolveDisplayName(noEn, 'fr')).toBe('LMU München');
    });

    it('should return empty string for empty array', () => {
      expect(service.resolveDisplayName([], 'en')).toBe('');
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
      // Single char → 0 bigrams, so the denominator is 0
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
      DisplayNames: [
        { value: 'Masaryk University', lang: 'en' },
        { value: 'Masarykova univerzita', lang: 'cs' },
      ],
      Keywords: [{ value: 'masaryk brno czech republic muni', lang: 'en' }],
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
      // "masarky" is a plausible typo for "masaryk"
      const score = service.scoreEntry(masaryk, 'masarky');
      expect(score).toBeGreaterThan(0);
    });
  });

  // ── filterEntries() ────────────────────────────────────────

  describe('filterEntries()', () => {
    const entries: IdpEntry[] = [
      makeEntry({
        entityID: 'https://idp.example.org/shibboleth',
        DisplayNames: [{ value: 'Example University', lang: 'en' }],
        Keywords: [{ value: 'example research', lang: 'en' }],
      }),
      makeEntry({
        entityID: 'https://shibboleth.muni.cz/idp/shibboleth',
        DisplayNames: [
          { value: 'Masaryk University', lang: 'en' },
          { value: 'Masarykova univerzita', lang: 'cs' },
        ],
        Keywords: [{ value: 'masaryk brno czech republic', lang: 'en' }],
      }),
      makeEntry({
        entityID: 'https://idp.cuni.cz/idp/shibboleth',
        DisplayNames: [
          { value: 'Charles University', lang: 'en' },
          { value: 'Univerzita Karlova', lang: 'cs' },
        ],
        Keywords: [{ value: 'charles prague', lang: 'en' }],
      }),
    ];

    it('should return all entries for empty query', () => {
      expect(service.filterEntries(entries, '', 'en').length).toBe(3);
    });

    it('should filter to matching entries only', () => {
      const result = service.filterEntries(entries, 'Masaryk', 'en');
      expect(result.length).toBe(1);
      expect(result[0].entityID).toBe('https://shibboleth.muni.cz/idp/shibboleth');
    });

    it('should match case-insensitively', () => {
      const result = service.filterEntries(entries, 'masaryk', 'en');
      expect(result.length).toBe(1);
    });

    it('should match diacritics-insensitively', () => {
      // Searching "univerzita" matches both Czech names exactly,
      // and also fuzzy-matches "University" via Dice coefficient
      const result = service.filterEntries(entries, 'univerzita', 'en');
      expect(result.length).toBe(3);
    });

    it('should return "University" entries for the generic term "University"', () => {
      const result = service.filterEntries(entries, 'University', 'en');
      expect(result.length).toBe(3);
    });

    it('should rank exact matches higher than partial matches', () => {
      const result = service.filterEntries(entries, 'charles', 'en');
      expect(result[0].entityID).toBe('https://idp.cuni.cz/idp/shibboleth');
    });

    it('should give a language bonus for matching the active language', () => {
      // "univerzita karlova" in Czech → Charles University should rank first when lang=cs
      const result = service.filterEntries(entries, 'Karlova', 'cs');
      expect(result[0].entityID).toBe('https://idp.cuni.cz/idp/shibboleth');
    });

    it('should return empty array when nothing matches', () => {
      const result = service.filterEntries(entries, 'zzzzxxxx', 'en');
      expect(result.length).toBe(0);
    });
  });
});
