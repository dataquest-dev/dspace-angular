import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { Item } from '../../../../core/shared/item.model';
import { ClarinGenericItemFieldComponent } from './clarin-generic-item-field.component';

describe('ClarinGenericItemFieldComponent', () => {
  let component: ClarinGenericItemFieldComponent;
  let fixture: ComponentFixture<ClarinGenericItemFieldComponent>;

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(true),
  });
  const dsoNameServiceSpy = jasmine.createSpyObj('dsoNameService', ['getName']);

  /** Build an Item carrying a single metadata value (dc.publisher by default) with the given authority. */
  function itemWith(authority: string | null, field = 'dc.publisher', value = 'ACME Press'): Item {
    const item = new Item();
    item.metadata = {
      [field]: [
        {
          value,
          authority,
          confidence: authority ? 600 : -1,
          place: 0,
          language: null,
          uuid: 'mock-uuid',
          isVirtual: false,
          virtualValue: null,
        } as any,
      ],
    };
    return item;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        ClarinGenericItemFieldComponent,
      ],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: DSONameService, useValue: dsoNameServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinGenericItemFieldComponent);
    component = fixture.componentInstance;
    // Avoid ngOnInit (detectChanges) for the isolation tests so we can exercise getLinkToSearch directly.
    component.baseUrl = 'http://localhost:4000';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getLinkToSearch', () => {
    it('uses the authority operator and key when the metadata value has an authority', () => {
      component.item = itemWith('02mhbdp94');
      component.fields = ['dc.publisher'];
      expect(component.getLinkToSearch(0))
        .toBe('http://localhost:4000/search?f.publisher=02mhbdp94,authority');
    });

    it('uses the equals operator and plain value when the metadata value has no authority', () => {
      component.item = itemWith(null);
      component.fields = ['dc.publisher'];
      expect(component.getLinkToSearch(0))
        .toBe('http://localhost:4000/search?f.publisher=ACME%20Press,equals');
    });

    it('uses the explicitly provided value (e.g. a split subject) with the equals operator', () => {
      const item = new Item();
      item.metadata = {
        'dc.subject': [
          { value: 'history;art', authority: null, confidence: -1, place: 0, language: null } as any,
        ],
      };
      component.item = item;
      component.fields = ['dc.subject'];
      expect(component.getLinkToSearch(-1, 'history'))
        .toBe('http://localhost:4000/search?f.subject=history,equals');
    });

    it('falls back to the bare search endpoint when the index is out of range', () => {
      component.item = itemWith(null);
      component.fields = ['dc.publisher'];
      expect(component.getLinkToSearch(5)).toBe('http://localhost:4000/search');
    });
  });

  describe('ROR icon rendering (guard scope)', () => {
    it('renders the ROR icon for an authority-bearing dc.publisher search field', () => {
      component.item = itemWith('02mhbdp94', 'dc.publisher');
      component.fields = ['dc.publisher'];
      component.type = 'search';
      fixture.detectChanges();
      const img = fixture.debugElement.query(By.css('img.ror-icon'));
      expect(img).not.toBeNull();
      expect(img.nativeElement.getAttribute('src')).toContain('ror-icon.svg');
    });

    it('does NOT render the ROR icon for an authority-bearing NON-publisher field (dc.subject)', () => {
      component.item = itemWith('some-authority', 'dc.subject', 'History');
      component.fields = ['dc.subject'];
      component.type = 'search';
      fixture.detectChanges();
      const imgs = fixture.debugElement.queryAll(By.css('img'))
        .filter((de) => (de.nativeElement.getAttribute('src') || '').includes('ror-icon.svg'));
      expect(imgs.length).toBe(0);
    });
  });
});
