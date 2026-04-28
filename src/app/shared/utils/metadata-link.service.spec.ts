import { TestBed } from '@angular/core/testing';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../remote-data.utils';
import { MetadataLinkService } from './metadata-link.service';

describe('MetadataLinkService', () => {
  let service: MetadataLinkService;
  let configService: jasmine.SpyObj<ConfigurationDataService>;

  /**
   * Helper: build a successful RemoteData$ wrapping a ConfigurationProperty with the given value.
   */
  function configPropertyRD$(value: string) {
    const prop = Object.assign(new ConfigurationProperty(), { values: [value] });
    return createSuccessfulRemoteDataObject$(prop);
  }

  beforeEach(() => {
    configService = jasmine.createSpyObj('ConfigurationDataService', ['findByPropertyName']);

    // Simulate what the backend would return for each resolver property.
    configService.findByPropertyName.and.callFake((name: string) => {
      switch (name) {
        case 'identifier.doi.resolver':
          return configPropertyRD$('https://doi.org');
        case 'identifier.scopus.resolver':
          return configPropertyRD$('https://www.scopus.com/record/display.uri?eid=');
        case 'identifier.wos.resolver':
          return configPropertyRD$('https://www.webofscience.com/wos/woscc/full-record/');
        case 'identifier.sherpa.resolver':
          return configPropertyRD$('https://openpolicyfinder.jisc.ac.uk/search?search=');
        case 'identifier.jcr.resolver':
          return configPropertyRD$('https://jcr.clarivate.com/jcr/browse-journals?search=');
        default:
          return createFailedRemoteDataObject$('not found', 404);
      }
    });

    TestBed.configureTestingModule({
      providers: [
        MetadataLinkService,
        { provide: ConfigurationDataService, useValue: configService },
      ],
    });

    service = TestBed.inject(MetadataLinkService);
  });

  describe('getMetadataLink', () => {
    it('should return DOI resolver link for bare DOI', (done) => {
      service.getMetadataLink('local.identifier.doi', '10.1234/test').subscribe(link => {
        expect(link).toBeTruthy();
        expect(link.external).toBeTrue();
        // DOI resolver should append trailing slash (added by service) + encoded DOI
        expect(link.href).toBe('https://doi.org/10.1234%2Ftest');
        done();
      });
    });

    it('should return null for DOI that is already a full URL', (done) => {
      service.getMetadataLink('local.identifier.doi', 'https://doi.org/10.1234/test').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should return Scopus link for Scopus ID', (done) => {
      service.getMetadataLink('local.identifier.scopus', '2-s2.0-85012345678').subscribe(link => {
        expect(link).toBeTruthy();
        expect(link.external).toBeTrue();
        expect(link.href).toBe('https://www.scopus.com/record/display.uri?eid=2-s2.0-85012345678');
        done();
      });
    });

    it('should return WOS link for WOS ID', (done) => {
      service.getMetadataLink('local.identifier.wos', 'WOS:000123456789').subscribe(link => {
        expect(link).toBeTruthy();
        expect(link.external).toBeTrue();
        expect(link.href).toBe('https://www.webofscience.com/wos/woscc/full-record/WOS%3A000123456789');
        done();
      });
    });

    it('should return direct link for dc.rights.uri', (done) => {
      service.getMetadataLink('dc.rights.uri', 'https://creativecommons.org/licenses/by/4.0/').subscribe(link => {
        expect(link).toBeTruthy();
        expect(link.external).toBeTrue();
        expect(link.href).toBe('https://creativecommons.org/licenses/by/4.0/');
        done();
      });
    });

    it('should return null for dc.rights.uri with non-URL value', (done) => {
      service.getMetadataLink('dc.rights.uri', 'Some rights text').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should return null for non-special metadata fields', (done) => {
      service.getMetadataLink('dc.title', 'some title').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should return null for empty or null values', (done) => {
      service.getMetadataLink('local.identifier.doi', '').subscribe(link1 => {
        expect(link1).toBeNull();
        service.getMetadataLink('local.identifier.doi', null).subscribe(link2 => {
          expect(link2).toBeNull();
          service.getMetadataLink('local.identifier.doi', undefined).subscribe(link3 => {
            expect(link3).toBeNull();
            done();
          });
        });
      });
    });

    it('should trim whitespace from values', (done) => {
      service.getMetadataLink('local.identifier.doi', '  10.1234/test  ').subscribe(link => {
        expect(link.href).toBe('https://doi.org/10.1234%2Ftest');
        done();
      });
    });

    it('should NOT return links for dc.subject', (done) => {
      service.getMetadataLink('dc.subject', 'Mathematics').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should NOT return links for dc.contributor.author', (done) => {
      service.getMetadataLink('dc.contributor.author', 'Novák, Jan').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });
  });

  describe('getExtraLinks', () => {
    it('should return Open policy finder and JCR links for dc.identifier.issn', (done) => {
      service.getExtraLinks('dc.identifier.issn', '1234-5678').subscribe(extras => {
        expect(extras.length).toBe(2);
        expect(extras[0].label).toBe('Open policy finder');
        expect(extras[0].href).toBe('https://openpolicyfinder.jisc.ac.uk/search?search=1234-5678');
        expect(extras[1].label).toBe('JCR');
        expect(extras[1].href).toBe('https://jcr.clarivate.com/jcr/browse-journals?search=1234-5678');
        done();
      });
    });

    it('should return Open policy finder and JCR links for local.identifier.e-issn', (done) => {
      service.getExtraLinks('local.identifier.e-issn', '8765-4321').subscribe(extras => {
        expect(extras.length).toBe(2);
        expect(extras[0].label).toBe('Open policy finder');
        expect(extras[1].label).toBe('JCR');
        done();
      });
    });

    it('should return empty array for non-ISSN fields', (done) => {
      service.getExtraLinks('dc.title', 'some title').subscribe(extras => {
        expect(extras).toEqual([]);
        done();
      });
    });

    it('should return empty array for empty values', (done) => {
      service.getExtraLinks('dc.identifier.issn', '').subscribe(extras => {
        expect(extras).toEqual([]);
        done();
      });
    });
  });

  describe('when backend config is missing', () => {
    beforeEach(() => {
      // All config lookups fail
      configService.findByPropertyName.and.returnValue(
        createFailedRemoteDataObject$('not found', 404),
      );
      // Recreate service so it re-fetches (and gets nulls)
      service = new MetadataLinkService(configService as any);
    });

    it('should return null for DOI when resolver is not configured', (done) => {
      service.getMetadataLink('local.identifier.doi', '10.9999/test').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should return null for Scopus when resolver is not configured', (done) => {
      service.getMetadataLink('local.identifier.scopus', '2-s2.0-000000').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should return null for WOS when resolver is not configured', (done) => {
      service.getMetadataLink('local.identifier.wos', 'WOS:000000').subscribe(link => {
        expect(link).toBeNull();
        done();
      });
    });

    it('should return empty array for ISSN when resolvers are not configured', (done) => {
      service.getExtraLinks('dc.identifier.issn', '0000-0001').subscribe(extras => {
        expect(extras).toEqual([]);
        done();
      });
    });

    it('should still return direct link for dc.rights.uri (no resolver needed)', (done) => {
      service.getMetadataLink('dc.rights.uri', 'https://creativecommons.org/licenses/by/4.0/').subscribe(link => {
        expect(link).toBeTruthy();
        expect(link.href).toBe('https://creativecommons.org/licenses/by/4.0/');
        done();
      });
    });
  });
});
