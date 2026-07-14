import { buildAuthoritySearchFilter, convertMetadataFieldIntoSearchType } from './clarin-shared-util';

describe('clarin-shared-util', () => {
  describe('buildAuthoritySearchFilter', () => {
    it('uses the authority operator and key when an authority is present', () => {
      expect(buildAuthoritySearchFilter('publisher', { value: 'ACME Press', authority: '02mhbdp94' }))
        .toBe('f.publisher=02mhbdp94,authority');
    });

    it('uses the equals operator and value when no authority is present', () => {
      expect(buildAuthoritySearchFilter('publisher', { value: 'ACME Press', authority: null }))
        .toBe('f.publisher=ACME%20Press,equals');
    });

    it('treats an empty-string authority as absent', () => {
      expect(buildAuthoritySearchFilter('author', { value: 'Doe, J', authority: '' }))
        .toBe('f.author=Doe%2C%20J,equals');
    });

    it('url-encodes both the filter name and the value', () => {
      expect(buildAuthoritySearchFilter('publisher', { value: 'A&B', authority: null }))
        .toBe('f.publisher=A%26B,equals');
    });
  });

  describe('convertMetadataFieldIntoSearchType', () => {
    it('maps dc.publisher to the publisher filter', () => {
      expect(convertMetadataFieldIntoSearchType(['dc.publisher'])).toBe('publisher');
    });

    it('maps creativework.publisher to the publisher filter', () => {
      expect(convertMetadataFieldIntoSearchType(['creativework.publisher'])).toBe('publisher');
    });

    it('maps dc.type to the type filter', () => {
      expect(convertMetadataFieldIntoSearchType(['dc.type'])).toBe('type');
    });
  });
});
