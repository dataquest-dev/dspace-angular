import {
  Component,
  Input,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

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
});
