import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { ClarinGenericItemFieldComponent } from './clarin-generic-item-field.component';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';
import { Item } from '../../../../core/shared/item.model';

describe('ClarinGenericItemFieldComponent', () => {
  let component: ClarinGenericItemFieldComponent;
  let fixture: ComponentFixture<ClarinGenericItemFieldComponent>;

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(true),
  });
  const dsoNameServiceSpy = jasmine.createSpyObj('dsoNameService', ['getName']);

  /** Build an Item carrying a single dc.publisher value with the given authority. */
  function itemWithPublisher(authority: string | null): Item {
    const item = new Item();
    item.metadata = {
      'dc.publisher': [
        {
          value: 'ACME Press',
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
      declarations: [ClarinGenericItemFieldComponent],
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
    // Avoid ngOnInit (detectChanges) so we can exercise getLinkToSearch in isolation.
    component.baseUrl = 'http://localhost:4000';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getLinkToSearch', () => {
    it('uses the authority operator and key when the metadata value has an authority', () => {
      component.item = itemWithPublisher('02mhbdp94');
      component.fields = ['dc.publisher'];
      expect(component.getLinkToSearch(0))
        .toBe('http://localhost:4000/search?f.publisher=02mhbdp94,authority');
    });

    it('uses the equals operator and plain value when the metadata value has no authority', () => {
      component.item = itemWithPublisher(null);
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
      component.item = itemWithPublisher(null);
      component.fields = ['dc.publisher'];
      expect(component.getLinkToSearch(5)).toBe('http://localhost:4000/search');
    });
  });
});
