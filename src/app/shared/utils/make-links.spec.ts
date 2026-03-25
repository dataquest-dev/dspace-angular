import { makeLinks } from './make-links';

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
