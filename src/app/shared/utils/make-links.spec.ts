import {
  getMetadataLink,
  makeLinks,
} from './make-links';

describe('makeLinks', () => {
  it('should convert https URLs to clickable links', () => {
    expect(makeLinks('https://example.com')).toContain('<a href="https://example.com"');
    expect(makeLinks('https://example.com')).toContain('target="_blank"');
  });

  it('should convert http URLs to clickable links', () => {
    expect(makeLinks('http://example.com')).toContain('<a href="http://example.com"');
  });

  it('should convert ftp URLs to clickable links', () => {
    expect(makeLinks('ftp://files.example.com/resource')).toContain('<a href="ftp://files.example.com/resource"');
  });

  it('should convert www. URLs to clickable links with https:// prefix in href', () => {
    const result = makeLinks('www.example.com');
    expect(result).toContain('<a href="https://www.example.com"');
    expect(result).toContain('>www.example.com</a>');
  });

  it('should return plain text unchanged (HTML-escaped)', () => {
    expect(makeLinks('just some text')).toBe('just some text');
  });

  it('should handle null/undefined gracefully', () => {
    expect(makeLinks(null)).toBeUndefined();
    expect(makeLinks(undefined)).toBeUndefined();
  });

  it('should handle empty string', () => {
    expect(makeLinks('')).toBe('');
  });

  it('should convert URLs embedded in text', () => {
    const result = makeLinks('Visit https://example.com for details');
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('Visit');
    expect(result).toContain('for details');
  });

  it('should handle DOI / handle redirect URLs', () => {
    const result = makeLinks('https://hdl.handle.net/123456789/1');
    expect(result).toContain('<a href="https://hdl.handle.net/123456789/1"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('should handle DOI resolver URLs', () => {
    const result = makeLinks('https://doi.org/10.1234/test');
    expect(result).toContain('<a href="https://doi.org/10.1234/test"');
  });

  it('should not create links for javascript: URIs', () => {
    const result = makeLinks('javascript:alert(1)');
    expect(result).not.toContain('<a');
  });

  it('should not create links for data: URIs', () => {
    const result = makeLinks('data:text/html,<script>alert(1)</script>');
    expect(result).not.toContain('<a');
  });

  it('should handle multiple URLs in one string', () => {
    const result = makeLinks('See https://a.com and https://b.com');
    expect(result).toContain('<a href="https://a.com"');
    expect(result).toContain('<a href="https://b.com"');
  });

  it('should handle URLs with query parameters', () => {
    const result = makeLinks('https://example.com/search?q=test&page=1');
    expect(result).toContain('href="https://example.com/search?q=test&amp;page=1"');
  });

  it('should handle URLs with fragments', () => {
    const result = makeLinks('https://example.com/page#section');
    expect(result).toContain('<a href="https://example.com/page#section"');
  });

  it('should handle URLs with paths', () => {
    const result = makeLinks('https://example.com/path/to/resource');
    expect(result).toContain('<a href="https://example.com/path/to/resource"');
  });

  it('should stop URL at closing parenthesis', () => {
    const result = makeLinks('(https://example.com)');
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('(');
    expect(result).toMatch(/\)$/);
  });

  it('should HTML-escape non-URL parts to prevent markup injection', () => {
    const result = makeLinks('<b>bold</b> https://example.com');
    expect(result).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(result).toContain('<a href="https://example.com"');
  });

  it('should HTML-escape ampersands in plain text', () => {
    const result = makeLinks('A & B');
    expect(result).toBe('A &amp; B');
  });
});

describe('getMetadataLink', () => {
  it('should return DOI resolver link for bare DOI', () => {
    const link = getMetadataLink('local.identifier.doi', '10.1234/test');
    expect(link).toBeTruthy();
    expect(link.external).toBeTrue();
    expect(link.href).toBe('https://doi.org/10.1234%2Ftest');
  });

  it('should return null for DOI that is already a full URL', () => {
    expect(getMetadataLink('local.identifier.doi', 'https://doi.org/10.1234/test')).toBeNull();
  });

  it('should return Scopus link for Scopus ID', () => {
    const link = getMetadataLink('local.identifier.scopus', '2-s2.0-85012345678');
    expect(link).toBeTruthy();
    expect(link.external).toBeTrue();
    expect(link.href).toBe('https://www.scopus.com/record/display.uri?eid=2-s2.0-85012345678');
  });

  it('should return WOS link for WOS ID', () => {
    const link = getMetadataLink('local.identifier.wos', 'WOS:000123456789');
    expect(link).toBeTruthy();
    expect(link.external).toBeTrue();
    expect(link.href).toBe('https://www.webofscience.com/wos/woscc/full-record/WOS%3A000123456789');
  });

  it('should return internal search link for dc.subject', () => {
    const link = getMetadataLink('dc.subject', 'Mathematics');
    expect(link).toBeTruthy();
    expect(link.external).toBeFalse();
    expect(link.routerLink).toBe('/search');
    expect(link.queryParams).toEqual({ 'f.subject': 'Mathematics,equals' });
  });

  it('should return internal search link for dc.contributor.author', () => {
    const link = getMetadataLink('dc.contributor.author', 'Novák, Jan');
    expect(link).toBeTruthy();
    expect(link.external).toBeFalse();
    expect(link.routerLink).toBe('/search');
    expect(link.queryParams).toEqual({ 'f.author': 'Nov\u00e1k, Jan,equals' });
  });

  it('should return null for non-special metadata fields', () => {
    expect(getMetadataLink('dc.title', 'some title')).toBeNull();
    expect(getMetadataLink('dc.description', 'some description')).toBeNull();
  });

  it('should return null for empty or null values', () => {
    expect(getMetadataLink('local.identifier.doi', '')).toBeNull();
    expect(getMetadataLink('local.identifier.doi', null)).toBeNull();
    expect(getMetadataLink('local.identifier.doi', undefined)).toBeNull();
  });

  it('should trim whitespace from values', () => {
    const link = getMetadataLink('local.identifier.doi', '  10.1234/test  ');
    expect(link.href).toBe('https://doi.org/10.1234%2Ftest');
  });

  it('should not double-append operator if value already has one', () => {
    const link = getMetadataLink('dc.subject', 'Mathematics,equals');
    expect(link.queryParams['f.subject']).toBe('Mathematics,equals');
  });
});
