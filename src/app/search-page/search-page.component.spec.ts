import {
  Component,
  Input,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import JSON5 from 'json5';

import { ThemedSearchComponent } from '../shared/search/themed-search.component';
import { SearchPageComponent } from './search-page.component';

@Component({
  selector: 'ds-search',
  template: '',
})
class SearchStubComponent {
  @Input() configuration: string;
  @Input() showCsvExport: boolean;
  @Input() trackStatistics: boolean;
}

describe('SearchPageComponent', () => {
  let fixture: ComponentFixture<SearchPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
    })
      .overrideComponent(SearchPageComponent, {
        remove: {
          imports: [ThemedSearchComponent],
        },
        add: {
          imports: [SearchStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    fixture.detectChanges();
  });

  it('should search with the items configuration', () => {
    const search: SearchStubComponent = fixture.debugElement.query(By.directive(SearchStubComponent)).componentInstance;
    expect(search.configuration).toBe('items');
  });

  // The results heading is translated as '<configuration>.search.results.head'.
  it('should have a results heading for its configuration in en.json5 and cs.json5', async () => {
    const search: SearchStubComponent = fixture.debugElement.query(By.directive(SearchStubComponent)).componentInstance;
    const key = `${search.configuration}.search.results.head`;
    for (const lang of ['en', 'cs']) {
      const response = await fetch(`assets/i18n/${lang}.json5`);
      expect(response.ok).withContext(`cannot read assets/i18n/${lang}.json5`).toBeTrue();
      const catalogue = JSON5.parse(await response.text());
      expect(catalogue[key]).withContext(`${key} is missing from src/assets/i18n/${lang}.json5`).toBeTruthy();
    }
  });
});
