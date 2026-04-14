import {
  DiscoFeedEntry,
  normalizeDiscoFeedEntry,
  normalizeEntry,
  resolveLocalized,
} from './idp-entry.model';

describe('idp-entry.model', () => {
  // ── resolveLocalized() ────────────────────────────────────────

  describe('resolveLocalized()', () => {
    it('should return exact lang match', () => {
      const values = [
        { value: 'Czech Name', lang: 'cs' },
        { value: 'English Name', lang: 'en' },
      ];
      expect(resolveLocalized(values, 'cs')).toBe('Czech Name');
    });

    it('should fall back to en when lang not found', () => {
      const values = [
        { value: 'French Name', lang: 'fr' },
        { value: 'English Name', lang: 'en' },
      ];
      expect(resolveLocalized(values, 'de')).toBe('English Name');
    });

    it('should fall back to first entry when neither lang nor en found', () => {
      const values = [
        { value: 'French Name', lang: 'fr' },
      ];
      expect(resolveLocalized(values, 'de')).toBe('French Name');
    });

    it('should return fallback for undefined array', () => {
      expect(resolveLocalized(undefined, 'en', 'fallback')).toBe('fallback');
    });

    it('should return fallback for empty array', () => {
      expect(resolveLocalized([], 'en', 'fallback')).toBe('fallback');
    });

    it('should return empty string as default fallback', () => {
      expect(resolveLocalized(undefined, 'en')).toBe('');
    });
  });

  // ── normalizeDiscoFeedEntry() ─────────────────────────────────

  describe('normalizeDiscoFeedEntry()', () => {
    it('should normalize a DiscoFeed entry', () => {
      const raw: DiscoFeedEntry = {
        entityID: 'https://idp.example.org',
        DisplayNames: [{ value: 'Test University', lang: 'en' }],
        Logos: [{ value: 'https://example.org/logo.png', height: 40 }],
        Keywords: [{ value: 'test' }, { value: 'university' }],
      };

      const result = normalizeDiscoFeedEntry(raw, 'en');

      expect(result.entityID).toBe('https://idp.example.org');
      expect(result.title).toBe('Test University');
      expect(result.logoUrl).toBe('https://example.org/logo.png');
      expect(result.keywords).toEqual(['test', 'university']);
    });

    it('should use entityID as title fallback when no DisplayNames', () => {
      const raw: DiscoFeedEntry = {
        entityID: 'https://idp.example.org',
      };
      const result = normalizeDiscoFeedEntry(raw, 'en');
      expect(result.title).toBe('https://idp.example.org');
    });

    it('should prefer small logos (height <= 60)', () => {
      const raw: DiscoFeedEntry = {
        entityID: 'e1',
        Logos: [
          { value: 'https://example.org/big.png', height: 100 },
          { value: 'https://example.org/small.png', height: 40 },
        ],
      };
      const result = normalizeDiscoFeedEntry(raw, 'en');
      expect(result.logoUrl).toBe('https://example.org/small.png');
    });
  });

  // ── normalizeEntry() ─────────────────────────────────────────

  describe('normalizeEntry()', () => {
    it('should detect and normalize DiscoFeed entries', () => {
      const raw = {
        entityID: 'e1',
        DisplayNames: [{ value: 'Disco Entry', lang: 'en' }],
      };
      const result = normalizeEntry(raw, 'en');
      expect(result.title).toBe('Disco Entry');
    });

    it('should pass through IdentityProvider-like entries', () => {
      const raw = {
        entityID: 'e1',
        title: 'Already Normalized',
        country: 'CZ',
      };
      const result = normalizeEntry(raw, 'en');
      expect(result.title).toBe('Already Normalized');
      expect(result.country).toBe('CZ');
    });

    it('should use entityID as title fallback for flat entries', () => {
      const raw = { entityID: 'e1' };
      const result = normalizeEntry(raw, 'en');
      expect(result.title).toBe('e1');
    });
  });
});
