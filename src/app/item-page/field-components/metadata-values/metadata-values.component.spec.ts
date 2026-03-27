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
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';

import { APP_CONFIG } from '../../../../config/app-config.interface';
import { environment } from '../../../../environments/environment';
import { MetadataValue } from '../../../core/shared/metadata.models';
import { TranslateLoaderMock } from '../../../shared/mocks/translate-loader.mock';
import { MetadataValuesComponent } from './metadata-values.component';

let comp: MetadataValuesComponent;
let fixture: ComponentFixture<MetadataValuesComponent>;

const mockMetadata = [
  {
    language: 'en_US',
    value: '1234',
  },
  {
    language: 'en_US',
    value: 'a publisher',
  },
  {
    language: 'en_US',
    value: 'desc',
  }] as MetadataValue[];
const mockSeperator = '<br/>';
const mockLabel = 'fake.message';

describe('MetadataValuesComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock,
        },
      }), MetadataValuesComponent],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(MetadataValuesComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MetadataValuesComponent);
    comp = fixture.componentInstance;
    comp.mdValues = mockMetadata;
    comp.separator = mockSeperator;
    comp.label = mockLabel;
    comp.urlRegex = /^.*test.*$/;
    fixture.detectChanges();
  }));

  it('should display all metadata values', () => {
    const innerHTML = fixture.nativeElement.innerHTML;
    for (const metadatum of mockMetadata) {
      expect(innerHTML).toContain(metadatum.value);
    }
  });

  it('should contain separators equal to the amount of metadata values minus one', () => {
    const separators = fixture.debugElement.queryAll(By.css('span.separator'));
    expect(separators.length).toBe(mockMetadata.length - 1);
  });

  it('should correctly detect a pattern on string containing "test"', () => {
    const mdValue = { value: 'This is a test value' } as MetadataValue;
    expect(comp.hasLink(mdValue)).toBe(true);
  });

  it('should return correct target and rel for internal links', () => {
    spyOn(comp, 'hasInternalLink').and.returnValue(true);
    const urlValue = '/internal-link';
    const result = comp.getLinkAttributes(urlValue);
    expect(result.target).toBe('_self');
    expect(result.rel).toBe('');
  });

  it('should return correct target and rel for external links', () => {
    spyOn(comp, 'hasInternalLink').and.returnValue(false);
    const urlValue = 'https://www.dspace.org';
    const result = comp.getLinkAttributes(urlValue);
    expect(result.target).toBe('_blank');
    expect(result.rel).toBe('noopener noreferrer');
  });

  it('should correctly detect ORCID authority pattern', () => {
    const orcidMdValue = {
      value: 'John Doe',
      authority: '0000-0002-1825-0097',
      confidence: 600,
    } as MetadataValue;
    expect(comp.isOrcidAuthority(orcidMdValue)).toBe(true);
  });

  it('should return false for non-ORCID authority patterns', () => {
    const nonOrcidMdValue = {
      value: 'Jane Smith',
      authority: 'not-an-orcid',
      confidence: 600,
    } as MetadataValue;
    expect(comp.isOrcidAuthority(nonOrcidMdValue)).toBe(false);
  });

  it('should return false for metadata values without authority', () => {
    const noAuthorityMdValue = {
      value: 'Anonymous Author',
      authority: null,
      confidence: -1,
    } as MetadataValue;
    expect(comp.isOrcidAuthority(noAuthorityMdValue)).toBe(false);
  });

  it('should generate correct ORCID profile URL', () => {
    const orcidId = '0000-0002-1825-0097';
    const expectedUrl = 'https://orcid.org/0000-0002-1825-0097';
    expect(comp.getOrcidUrl(orcidId)).toBe(expectedUrl);
  });

  it('should render ORCID link and badge for metadata with ORCID authority', () => {
    const orcidMetadata = [
      {
        language: 'en_US',
        value: 'John Doe',
        authority: '0000-0002-1825-0097',
        confidence: 600,
      },
    ] as MetadataValue[];
    comp.mdValues = orcidMetadata;
    fixture.detectChanges();
    const orcidLink = fixture.debugElement.query(By.css('a.ds-orcid-link'));
    expect(orcidLink).toBeTruthy();
    expect(orcidLink.nativeElement.getAttribute('href')).toBe('https://orcid.org/0000-0002-1825-0097');
    expect(orcidLink.nativeElement.textContent).toContain('John Doe');
    const orcidBadge = fixture.debugElement.query(By.css('a.orcid-badge'));
    expect(orcidBadge).toBeTruthy();
  });

});
