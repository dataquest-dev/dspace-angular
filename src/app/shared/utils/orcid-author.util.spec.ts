import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { createFailedRemoteDataObject$, createSuccessfulRemoteDataObject$ } from '../remote-data.utils';
import {
  AUTHOR_ORCID_LINK_TARGET_PROPERTY,
  AuthorOrcidLinkTarget,
  buildOrcidProfileUrl,
  loadAuthorOrcidLinkTarget,
  loadOrcidDomainUrl,
  ORCID_DOMAIN_URL_PROPERTY,
} from './orcid-author.util';

describe('orcid-author.util', () => {
  const ORCID_ID = '0000-0002-1825-0097';

  describe('buildOrcidProfileUrl', () => {
    it('builds the profile URL from a bare ORCID iD and the configured domain', () => {
      expect(buildOrcidProfileUrl(ORCID_ID, 'https://orcid.org')).toBe(`https://orcid.org/${ORCID_ID}`);
    });

    it('accepts an iD ending with the X checksum, in either case', () => {
      expect(buildOrcidProfileUrl('0000-0002-1694-233X', 'https://orcid.org'))
        .toBe('https://orcid.org/0000-0002-1694-233X');
      expect(buildOrcidProfileUrl('0000-0002-1694-233x', 'https://orcid.org'))
        .toBe('https://orcid.org/0000-0002-1694-233x');
    });

    it('trims the authority and a trailing slash of the domain', () => {
      expect(buildOrcidProfileUrl(` ${ORCID_ID} `, 'https://sandbox.orcid.org/'))
        .toBe(`https://sandbox.orcid.org/${ORCID_ID}`);
    });

    it('keeps a full ORCID URL authority on the configured host', () => {
      expect(buildOrcidProfileUrl(`https://orcid.org/${ORCID_ID}`, 'https://orcid.org'))
        .toBe(`https://orcid.org/${ORCID_ID}`);
    });

    it('rejects a full ORCID-shaped URL on another host', () => {
      expect(buildOrcidProfileUrl(`https://evil.example/${ORCID_ID}`, 'https://orcid.org')).toBeNull();
    });

    it('returns null without a configured domain', () => {
      expect(buildOrcidProfileUrl(ORCID_ID, null)).toBeNull();
      expect(buildOrcidProfileUrl(`https://orcid.org/${ORCID_ID}`, null)).toBeNull();
    });

    it('returns null for a missing or non-ORCID authority', () => {
      expect(buildOrcidProfileUrl(undefined, 'https://orcid.org')).toBeNull();
      expect(buildOrcidProfileUrl('', 'https://orcid.org')).toBeNull();
      expect(buildOrcidProfileUrl('will be generated::orcid::42', 'https://orcid.org')).toBeNull();
      expect(buildOrcidProfileUrl('1-7893-272XR', 'https://orcid.org')).toBeNull();
      expect(buildOrcidProfileUrl('000-0002-5109-6693', 'https://orcid.org')).toBeNull();
    });
  });

  describe('backend property loaders', () => {
    function configurationServiceWith(properties: { [name: string]: string }): jasmine.SpyObj<ConfigurationDataService> {
      const service = jasmine.createSpyObj('configurationService', ['findByPropertyName']);
      service.findByPropertyName.and.callFake((name: string) => name in properties
        ? createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { name, values: [properties[name]] }))
        : createFailedRemoteDataObject$('No such configuration property', 404));
      return service;
    }

    describe('loadOrcidDomainUrl', () => {
      it('reads orcid.domain-url', async () => {
        const service = configurationServiceWith({ [ORCID_DOMAIN_URL_PROPERTY]: ' https://orcid.org ' });
        expect(await loadOrcidDomainUrl(service)).toBe('https://orcid.org');
        expect(service.findByPropertyName).toHaveBeenCalledWith(ORCID_DOMAIN_URL_PROPERTY);
      });

      it('resolves to null when the property is not exposed', async () => {
        expect(await loadOrcidDomainUrl(configurationServiceWith({}))).toBeNull();
      });

      it('resolves to null when the value is not an http(s) URL', async () => {
        const service = configurationServiceWith({ [ORCID_DOMAIN_URL_PROPERTY]: 'orcid.org' });
        expect(await loadOrcidDomainUrl(service)).toBeNull();
      });
    });

    describe('loadAuthorOrcidLinkTarget', () => {
      it('reads orcid.author.link-target', async () => {
        const service = configurationServiceWith({ [AUTHOR_ORCID_LINK_TARGET_PROPERTY]: ' ORCID ' });
        expect(await loadAuthorOrcidLinkTarget(service)).toBe(AuthorOrcidLinkTarget.Orcid);
        expect(service.findByPropertyName).toHaveBeenCalledWith(AUTHOR_ORCID_LINK_TARGET_PROPERTY);
      });

      it('defaults to browse when the property is not exposed', async () => {
        expect(await loadAuthorOrcidLinkTarget(configurationServiceWith({}))).toBe(AuthorOrcidLinkTarget.Browse);
      });

      it('defaults to browse for an unknown value', async () => {
        const service = configurationServiceWith({ [AUTHOR_ORCID_LINK_TARGET_PROPERTY]: 'profile' });
        expect(await loadAuthorOrcidLinkTarget(service)).toBe(AuthorOrcidLinkTarget.Browse);
      });
    });
  });
});
