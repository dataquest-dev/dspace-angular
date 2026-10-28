import { BehaviorSubject } from 'rxjs';

import { buildAuthoritySearchFilter, convertMetadataFieldIntoSearchType, loadItemAuthors } from './clarin-shared-util';
import { AuthorNameLink } from './clarin-item-box-view/clarin-author-name-link.model';
import { MetadataValue } from '../core/shared/metadata.models';

describe('clarin-shared-util', () => {
  describe('loadItemAuthors', () => {
    const baseUrl = 'http://localhost:4000';
    const fields = ['dc.contributor.author'];
    const orcidId = '0000-0002-1825-0097';

    function loadAuthors(authors: Partial<MetadataValue>[], orcidDomainUrl?: string): AuthorNameLink[] {
      const item = { allMetadata: () => authors };
      const itemAuthors = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(item, itemAuthors, baseUrl, fields, orcidDomainUrl);
      return itemAuthors.value;
    }

    it('links an ORCID authority to the profile on the configured domain', () => {
      const [author] = loadAuthors([{ value: 'Doe, Jane', authority: orcidId }], 'https://orcid.org');
      expect(author.orcidUrl).toBe(`https://orcid.org/${orcidId}`);
    });

    it('keeps the authority search link for an ORCID author', () => {
      const [author] = loadAuthors([{ value: 'Doe, Jane', authority: orcidId }], 'https://orcid.org');
      expect(author.url).toBe(`${baseUrl}/search?f.author=${orcidId},authority`);
      expect(author.isAuthority).toBeTrue();
    });

    it('does not link an ORCID authority without a configured domain', () => {
      const [author] = loadAuthors([{ value: 'Doe, Jane', authority: orcidId }]);
      expect(author.orcidUrl).toBeNull();
      expect(author.isAuthority).toBeTrue();
    });

    it('does not link a non-ORCID authority', () => {
      const [author] = loadAuthors([{ value: 'ACME', authority: 'local-authority-1' }], 'https://orcid.org');
      expect(author.orcidUrl).toBeNull();
      expect(author.url).toBe(`${baseUrl}/search?f.author=local-authority-1,authority`);
    });

    it('builds the equals search link for an author without authority', () => {
      const [author] = loadAuthors([{ value: 'Doe, John', authority: null }], 'https://orcid.org');
      expect(author.url).toBe(`${baseUrl}/search?f.author=Doe%2C%20John,equals`);
      expect(author.isAuthority).toBeFalse();
      expect(author.orcidUrl).toBeNull();
    });
  });

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
