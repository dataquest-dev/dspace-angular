import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
  SecurityContext,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  By,
  DomSanitizer,
} from '@angular/platform-browser';

import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../../../../core/shared/configuration-property.model';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/remote-data.utils';
import { ItemPageCitationFieldComponent } from './item-page-citation.component';

const CITACE_PRO_URL = 'https://www.citacepro.com/api/dspace/citace/oai';
const CITACE_PRO_UNIVERSITY = 'dspace.jcu.cz';

describe('ItemPageCitationFieldComponent', () => {
  let component: ItemPageCitationFieldComponent;
  let fixture: ComponentFixture<ItemPageCitationFieldComponent>;
  const mockHandle = '123456789/3';

  function mockConfigurationDataService(allowed: string) {
    const valuesByName: { [name: string]: string[] } = {
      'citace.pro.url': [CITACE_PRO_URL],
      'citace.pro.university': [CITACE_PRO_UNIVERSITY],
      'citace.pro.allowed': [allowed],
    };
    return {
      findByPropertyName: (name: string) => createSuccessfulRemoteDataObject$(
        Object.assign(new ConfigurationProperty(), { name, values: valuesByName[name] ?? [] }),
      ),
    };
  }

  async function init(allowed: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ItemPageCitationFieldComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: mockConfigurationDataService(allowed) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ItemPageCitationFieldComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ItemPageCitationFieldComponent);
    component = fixture.componentInstance;
    component.handle = mockHandle;
    fixture.detectChanges();
  }

  describe('when citace.pro.allowed is true', () => {
    beforeEach(async () => {
      await init('true');
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should enable the widget and compose the CitacePRO URL', () => {
      expect(component.citaceProStatus$.getValue()).toBeTrue();
      const sanitizer = TestBed.inject(DomSanitizer);
      expect(sanitizer.sanitize(SecurityContext.RESOURCE_URL, component.citaceProURL$.getValue()))
        .toBe(`${CITACE_PRO_URL}:${CITACE_PRO_UNIVERSITY}:${mockHandle}`);
    });

    it('should render the iframe with a title', () => {
      const iframe = fixture.debugElement.query(By.css('iframe'));
      expect(iframe).not.toBeNull();
      expect(iframe.nativeElement.getAttribute('title')).toBe('Citace PRO');
    });
  });

  describe('when citace.pro.allowed is false', () => {
    beforeEach(async () => {
      await init('false');
    });

    it('should keep the widget hidden', () => {
      expect(component.citaceProStatus$.getValue()).toBeFalse();
      expect(fixture.debugElement.query(By.css('iframe'))).toBeNull();
    });
  });

  describe('makeCitaceProURL', () => {
    beforeEach(async () => {
      await init('true');
    });

    it('should reject a non-http(s) base URL', () => {
      expect(component.makeCitaceProURL('javascript:alert(1)//', CITACE_PRO_UNIVERSITY)).toBeNull();
    });

    it('should reject missing config values', () => {
      expect(component.makeCitaceProURL(undefined, CITACE_PRO_UNIVERSITY)).toBeNull();
      expect(component.makeCitaceProURL(CITACE_PRO_URL, undefined)).toBeNull();
    });
  });
});
