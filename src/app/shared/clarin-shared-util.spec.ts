import { BehaviorSubject } from 'rxjs';

import { loadItemAuthors, ORCID_ID_PATTERN, ORCID_URL_PATTERN } from './clarin-shared-util';
import { AuthorNameLink } from './clarin-item-box-view/clarin-author-name-link.model';
import { MetadataValue } from '../core/shared/metadata.models';

function mv(value: string, authority?: string): MetadataValue {
  return Object.assign(new MetadataValue(), { value, authority });
}

function itemWithAuthors(values: MetadataValue[]): any {
  return {
    allMetadata: () => values,
  };
}

describe('clarin-shared-util ORCID helpers', () => {

  describe('ORCID_ID_PATTERN', () => {
    it('matches a bare ORCID iD', () => {
      expect(ORCID_ID_PATTERN.test('0000-0001-2345-6789')).toBeTrue();
      expect(ORCID_ID_PATTERN.test('0000-0001-2345-678X')).toBeTrue();
    });

    it('does not match a full URL or arbitrary text', () => {
      expect(ORCID_ID_PATTERN.test('https://orcid.org/0000-0001-2345-6789')).toBeFalse();
      expect(ORCID_ID_PATTERN.test('not-an-orcid')).toBeFalse();
    });
  });

  describe('ORCID_URL_PATTERN', () => {
    it('matches the production and sandbox ORCID URLs', () => {
      expect(ORCID_URL_PATTERN.test('https://orcid.org/0000-0001-2345-6789')).toBeTrue();
      expect(ORCID_URL_PATTERN.test('https://sandbox.orcid.org/0000-0001-2345-678X')).toBeTrue();
    });

    it('does not match a bare ORCID iD or non-URL strings', () => {
      expect(ORCID_URL_PATTERN.test('0000-0001-2345-6789')).toBeFalse();
      expect(ORCID_URL_PATTERN.test('not-an-orcid')).toBeFalse();
    });
  });

  describe('loadItemAuthors', () => {
    const baseUrl = 'http://localhost:4000';
    const fields = ['dc.contributor.author'];

    it('builds the search link for every author with the equals operator', () => {
      const subject = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(itemWithAuthors([mv('Doe, John')]), subject, baseUrl, fields);
      expect(subject.value.length).toBe(1);
      expect(subject.value[0].url)
        .toBe('http://localhost:4000/search?f.author=Doe%2C%20John,equals');
      expect(subject.value[0].isOrcid).toBeFalse();
    });

    it('expands a bare ORCID iD using the orcid.domain-url from the backend', () => {
      const subject = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(
        itemWithAuthors([mv('Doe, John', '0000-0001-2345-6789')]),
        subject, baseUrl, fields, 'https://sandbox.orcid.org',
      );
      expect(subject.value[0].isOrcid).toBeTrue();
      expect(subject.value[0].orcidUrl).toBe('https://sandbox.orcid.org/0000-0001-2345-6789');
    });

    it('strips a trailing slash from the orcid.domain-url before composing the URL', () => {
      const subject = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(
        itemWithAuthors([mv('Doe, John', '0000-0001-2345-6789')]),
        subject, baseUrl, fields, 'https://orcid.org/',
      );
      expect(subject.value[0].orcidUrl).toBe('https://orcid.org/0000-0001-2345-6789');
    });

    it('passes through an authority that already is a full ORCID URL', () => {
      const subject = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(
        itemWithAuthors([mv('Doe, John', 'https://orcid.org/0000-0001-2345-6789')]),
        subject, baseUrl, fields, null,
      );
      expect(subject.value[0].isOrcid).toBeTrue();
      expect(subject.value[0].orcidUrl).toBe('https://orcid.org/0000-0001-2345-6789');
    });

    it('does not flag a bare ORCID iD when orcid.domain-url is missing', () => {
      const subject = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(
        itemWithAuthors([mv('Doe, John', '0000-0001-2345-6789')]),
        subject, baseUrl, fields, null,
      );
      expect(subject.value[0].isOrcid).toBeFalse();
      expect(subject.value[0].orcidUrl).toBeUndefined();
    });

    it('does not flag a non-ORCID authority', () => {
      const subject = new BehaviorSubject<AuthorNameLink[]>([]);
      loadItemAuthors(
        itemWithAuthors([mv('Smith, Jane', 'some-internal-authority')]),
        subject, baseUrl, fields, 'https://orcid.org',
      );
      expect(subject.value[0].isOrcid).toBeFalse();
      expect(subject.value[0].isAuthority).toBeTrue();
    });
  });
});
