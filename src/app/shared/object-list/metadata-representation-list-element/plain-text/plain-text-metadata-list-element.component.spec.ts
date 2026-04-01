import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { createSuccessfulRemoteDataObject$ } from '../../../remote-data.utils';
import { mockData } from '../../../testing/browse-definition-data-service.stub';
import { PlainTextMetadataListElementComponent } from './plain-text-metadata-list-element.component';

// Render the mock representation with the default mock author browse definition so it is also rendered as a link
// without affecting other tests
const mockMetadataRepresentation = Object.assign(new MetadatumRepresentation('type', mockData[1]), {
  key: 'dc.contributor.author',
  value: 'Test Author',
});

const mockOrcidRepresentation = Object.assign(new MetadatumRepresentation('type'), {
  key: 'dc.contributor.author',
  value: 'Doe, John',
  authority: '1234-5678-9012-3456',
});

const mockNonOrcidAuthorityRepresentation = Object.assign(new MetadatumRepresentation('type'), {
  key: 'dc.contributor.author',
  value: 'Smith, Jane',
  authority: 'some-non-orcid-authority-key',
});

const mockOrcidWithWhitespaceRepresentation = Object.assign(new MetadatumRepresentation('type'), {
  key: 'dc.contributor.author',
  value: 'Doe, Jane',
  authority: '  1234-5678-9012-3456  ',
});

const mockConfigurationDataService = {
  findByPropertyName: jasmine.createSpy('findByPropertyName').and.returnValue(
    createSuccessfulRemoteDataObject$({ values: ['https://orcid.org'] }),
  ),
};

describe('PlainTextMetadataListElementComponent', () => {
  let comp: PlainTextMetadataListElementComponent;
  let fixture: ComponentFixture<PlainTextMetadataListElementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [PlainTextMetadataListElementComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: mockConfigurationDataService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(PlainTextMetadataListElementComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(PlainTextMetadataListElementComponent);
    comp = fixture.componentInstance;
    comp.mdRepresentation = mockMetadataRepresentation;
    fixture.detectChanges();
  }));

  it('should contain the value as plain text', () => {
    expect(fixture.debugElement.nativeElement.textContent).toContain(mockMetadataRepresentation.value);
  });

  it('should contain the browse link as plain text', () => {
    expect(fixture.debugElement.query(By.css('a.ds-browse-link')).nativeElement.innerHTML).toContain(mockMetadataRepresentation.value);
  });

  describe('when metadata has ORCID authority', () => {
    beforeEach(() => {
      comp.mdRepresentation = mockOrcidRepresentation;
      fixture.detectChanges();
    });

    it('should render an ORCID link', () => {
      const link = fixture.debugElement.query(By.css('a.orcid-author-link'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.getAttribute('href')).toBe('https://orcid.org/1234-5678-9012-3456');
      expect(link.nativeElement.textContent).toContain('Doe, John');
    });

    it('should render an ORCID icon', () => {
      const icon = fixture.debugElement.query(By.css('a.orcid-author-link i.fa-orcid'));
      expect(icon).toBeTruthy();
    });

    it('isOrcidAuthority should return true', () => {
      expect(comp.isOrcidAuthority(comp.orcidDomainUrl$.value)).toBeTrue();
    });

    it('getOrcidUrl should return full ORCID URL', () => {
      expect(comp.getOrcidUrl(comp.orcidDomainUrl$.value)).toBe('https://orcid.org/1234-5678-9012-3456');
    });
  });

  describe('when metadata has non-ORCID authority', () => {
    beforeEach(() => {
      comp.mdRepresentation = mockNonOrcidAuthorityRepresentation;
      fixture.detectChanges();
    });

    it('should render as plain text (no ORCID link)', () => {
      const link = fixture.debugElement.query(By.css('a.orcid-author-link'));
      expect(link).toBeFalsy();
    });

    it('should render the value as a span', () => {
      const span = fixture.debugElement.query(By.css('span.dont-break-out'));
      expect(span).toBeTruthy();
      expect(span.nativeElement.textContent).toContain('Smith, Jane');
    });

    it('isOrcidAuthority should return false', () => {
      expect(comp.isOrcidAuthority(comp.orcidDomainUrl$.value)).toBeFalse();
    });
  });

  describe('getOrcidUrl with trailing slash handling', () => {
    it('should not double-slash when domain URL ends with /', () => {
      comp.orcidDomainUrl$.next('https://orcid.org/');
      comp.mdRepresentation = mockOrcidRepresentation;
      expect(comp.getOrcidUrl('https://orcid.org/')).toBe('https://orcid.org/1234-5678-9012-3456');
    });

    it('should add slash when domain URL does not end with /', () => {
      comp.orcidDomainUrl$.next('https://sandbox.orcid.org');
      comp.mdRepresentation = mockOrcidRepresentation;
      expect(comp.getOrcidUrl('https://sandbox.orcid.org')).toBe('https://sandbox.orcid.org/1234-5678-9012-3456');
    });
  });

  describe('when backend config is not available', () => {
    beforeEach(() => {
      comp.orcidDomainUrl$.next(null);
      comp.mdRepresentation = mockOrcidRepresentation;
      fixture.detectChanges();
    });

    it('should not render ORCID link even if authority is ORCID', () => {
      const link = fixture.debugElement.query(By.css('a.orcid-author-link'));
      expect(link).toBeFalsy();
    });

    it('isOrcidAuthority should return false', () => {
      expect(comp.isOrcidAuthority(comp.orcidDomainUrl$.value)).toBeFalse();
    });

    it('getOrcidUrl should return empty string', () => {
      expect(comp.getOrcidUrl(comp.orcidDomainUrl$.value)).toBe('');
    });
  });

  describe('getOrcidUrl defensive behavior', () => {
    it('should return empty string when orcidDomainUrl is null', () => {
      comp.orcidDomainUrl$.next(null);
      comp.mdRepresentation = mockOrcidRepresentation;
      expect(comp.getOrcidUrl(null)).toBe('');
    });

    it('should return empty string when mdRepresentation has no authority', () => {
      comp.orcidDomainUrl$.next('https://orcid.org');
      comp.mdRepresentation = mockMetadataRepresentation;
      expect(comp.getOrcidUrl('https://orcid.org')).toBe('');
    });
  });

  describe('when authority has leading/trailing whitespace', () => {
    beforeEach(() => {
      comp.orcidDomainUrl$.next('https://orcid.org');
      comp.mdRepresentation = mockOrcidWithWhitespaceRepresentation;
      fixture.detectChanges();
    });

    it('isOrcidAuthority should return true after trimming', () => {
      expect(comp.isOrcidAuthority(comp.orcidDomainUrl$.value)).toBeTrue();
    });

    it('getOrcidUrl should return trimmed ORCID URL', () => {
      expect(comp.getOrcidUrl(comp.orcidDomainUrl$.value)).toBe('https://orcid.org/1234-5678-9012-3456');
    });
  });
});
