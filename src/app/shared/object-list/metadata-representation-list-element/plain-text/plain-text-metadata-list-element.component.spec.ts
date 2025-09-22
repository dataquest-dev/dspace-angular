import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { PlainTextMetadataListElementComponent } from './plain-text-metadata-list-element.component';
import { MetadatumRepresentation } from '../../../../core/shared/metadata-representation/metadatum/metadatum-representation.model';
import { By } from '@angular/platform-browser';
import { mockData } from '../../../testing/browse-definition-data-service.stub';

// Render the mock representation with the default mock author browse definition so it is also rendered as a link
// without affecting other tests
const mockMetadataRepresentation = Object.assign(new MetadatumRepresentation('type', mockData[1]), {
  key: 'dc.contributor.author',
  value: 'Test Author'
});

describe('PlainTextMetadataListElementComponent', () => {
  let comp: PlainTextMetadataListElementComponent;
  let fixture: ComponentFixture<PlainTextMetadataListElementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [PlainTextMetadataListElementComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(PlainTextMetadataListElementComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
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

  it('should correctly detect ORCID authority', () => {
    const orcidRepresentation = Object.assign(new MetadatumRepresentation('type'), {
      key: 'dc.contributor.author',
      value: 'John Doe',
      authority: '0000-0002-1825-0097',
      confidence: 600
    });
    comp.mdRepresentation = orcidRepresentation;
    expect(comp.isOrcidAuthority()).toBe(true);
  });

  it('should return false for non-ORCID authority', () => {
    const nonOrcidRepresentation = Object.assign(new MetadatumRepresentation('type'), {
      key: 'dc.contributor.author',
      value: 'Jane Smith',
      authority: 'not-an-orcid',
      confidence: 600
    });
    comp.mdRepresentation = nonOrcidRepresentation;
    expect(comp.isOrcidAuthority()).toBe(false);
  });

  it('should generate correct ORCID profile URL', () => {
    const orcidRepresentation = Object.assign(new MetadatumRepresentation('type'), {
      key: 'dc.contributor.author',
      value: 'John Doe',
      authority: '0000-0002-1825-0097',
      confidence: 600
    });
    comp.mdRepresentation = orcidRepresentation;
    const expectedUrl = 'https://orcid.org/0000-0002-1825-0097';
    expect(comp.getOrcidUrl()).toBe(expectedUrl);
  });

});
