import { metadataLangToBcp47 } from './metadata-language.util';

describe('metadataLangToBcp47', () => {
  it('should return null for nullish values', () => {
    expect(metadataLangToBcp47(null)).toBeNull();
    expect(metadataLangToBcp47(undefined)).toBeNull();
  });

  it('should return null for an empty string', () => {
    expect(metadataLangToBcp47('')).toBeNull();
  });

  it('should return null for the wildcard language', () => {
    expect(metadataLangToBcp47('*')).toBeNull();
  });

  it('should convert Java-style locale separators to BCP 47 hyphens', () => {
    expect(metadataLangToBcp47('en_US')).toEqual('en-US');
    expect(metadataLangToBcp47('cs_CZ')).toEqual('cs-CZ');
    expect(metadataLangToBcp47('de_DE')).toEqual('de-DE');
  });

  it('should leave a bare language subtag unchanged', () => {
    expect(metadataLangToBcp47('en')).toEqual('en');
  });

  it('should leave already-hyphenated tags unchanged', () => {
    expect(metadataLangToBcp47('en-US')).toEqual('en-US');
  });
});
