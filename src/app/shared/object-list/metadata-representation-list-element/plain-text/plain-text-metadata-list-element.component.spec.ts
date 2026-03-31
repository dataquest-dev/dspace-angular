import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { createSuccessfulRemoteDataObject$ } from '../../../remote-data.utils';
import { createFailedRemoteDataObject$ } from '../../../remote-data.utils';
import { ActivatedRouteStub } from '../../../testing/active-router.stub';
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
  value: 'Orcid Author',
  authority: '0000-0002-1825-0097',
});

const mockNonOrcidAuthorityRepresentation = Object.assign(new MetadatumRepresentation('type'), {
  key: 'dc.contributor.author',
  value: 'Authority Author',
  authority: 'some-non-orcid-authority-key',
});

const mockOrcidWithWhitespaceRepresentation = Object.assign(new MetadatumRepresentation('type'), {
  key: 'dc.contributor.author',
  value: 'Whitespace Orcid Author',
  authority: '  0000-0002-1825-0097  ',
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
      imports: [PlainTextMetadataListElementComponent],
      providers: [
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
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
      expect(link.nativeElement.getAttribute('href')).toBe('https://orcid.org/0000-0002-1825-0097');
      expect(link.nativeElement.textContent).toContain('Orcid Author');
    });

    it('should render an ORCID icon', () => {
      const icon = fixture.debugElement.query(By.css('a.orcid-author-link i.fa-orcid'));
      expect(icon).toBeTruthy();
    });

    it('isOrcidAuthority should return true', () => {
      expect(comp.isOrcidAuthority()).toBeTrue();
    });

    it('getOrcidUrl should return full ORCID URL', () => {
      expect(comp.getOrcidUrl()).toBe('https://orcid.org/0000-0002-1825-0097');
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
      expect(span.nativeElement.textContent).toContain('Authority Author');
    });

    it('isOrcidAuthority should return false', () => {
      expect(comp.isOrcidAuthority()).toBeFalse();
    });
  });

  describe('getOrcidUrl with trailing slash handling', () => {
    it('should not double-slash when domain URL ends with /', () => {
      comp.orcidDomainUrl = 'https://orcid.org/';
      comp.mdRepresentation = mockOrcidRepresentation;
      expect(comp.getOrcidUrl()).toBe('https://orcid.org/0000-0002-1825-0097');
    });

    it('should add slash when domain URL does not end with /', () => {
      comp.orcidDomainUrl = 'https://sandbox.orcid.org';
      comp.mdRepresentation = mockOrcidRepresentation;
      expect(comp.getOrcidUrl()).toBe('https://sandbox.orcid.org/0000-0002-1825-0097');
    });
  });

  describe('when backend config is not available', () => {
    beforeEach(() => {
      comp.orcidDomainUrl = null;
      comp.mdRepresentation = mockOrcidRepresentation;
      fixture.detectChanges();
    });

    it('should not render ORCID link even if authority is ORCID', () => {
      const link = fixture.debugElement.query(By.css('a.orcid-author-link'));
      expect(link).toBeFalsy();
    });

    it('isOrcidAuthority should return false', () => {
      expect(comp.isOrcidAuthority()).toBeFalse();
    });
  });

  describe('when authority has leading/trailing whitespace', () => {
    beforeEach(() => {
      comp.orcidDomainUrl = 'https://orcid.org';
      comp.mdRepresentation = mockOrcidWithWhitespaceRepresentation;
      fixture.detectChanges();
    });

    it('isOrcidAuthority should return true after trimming', () => {
      expect(comp.isOrcidAuthority()).toBeTrue();
    });

    it('getOrcidUrl should return trimmed ORCID URL', () => {
      expect(comp.getOrcidUrl()).toBe('https://orcid.org/0000-0002-1825-0097');
    });
  });

});
