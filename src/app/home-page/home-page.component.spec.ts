import {
  NO_ERRORS_SCHEMA,
  PLATFORM_ID,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  provideRouter,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { ItemDataService } from '../core/data/item-data.service';
import { SiteDataService } from '../core/data/site-data.service';
import { HALEndpointService } from '../core/shared/hal-endpoint.service';
import { SearchService } from '../core/shared/search/search.service';
import { UsageReportDataService } from '../core/statistics/usage-report-data.service';
import { ClarinItemBoxViewComponent } from '../shared/clarin-item-box-view/clarin-item-box-view.component';
import { RSSComponent } from '../shared/rss-feed/rss.component';
import { ThemedSearchFormComponent } from '../shared/search-form/themed-search-form.component';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: of({}) } },
        { provide: SearchService, useValue: { getSearchLink: () => '/search' } },
        { provide: HALEndpointService, useValue: {} },
        { provide: ConfigurationDataService, useValue: {} },
        { provide: UsageReportDataService, useValue: {} },
        { provide: SiteDataService, useValue: {} },
        { provide: ItemDataService, useValue: {} },
        // render as the server does: the boxes stay empty
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    })
      .overrideComponent(HomePageComponent, {
        remove: { imports: [ClarinItemBoxViewComponent, RSSComponent, ThemedSearchFormComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function minHeight(selector: string): number {
    return parseFloat(getComputedStyle(fixture.nativeElement.querySelector(selector)).minHeight) || 0;
  }

  it('should keep space for the boxes the browser fills after load', () => {
    expect(minHeight('.fast-search-links')).toBeGreaterThan(0);
    expect(minHeight('.new-items')).toBeGreaterThan(0);
  });

  it('should drop that space once a box has content', () => {
    component.authors$.next([{ name: 'Smith', occurrences: '3', url: '/search' }]);
    fixture.detectChanges();
    expect(minHeight('.fast-search-links')).toBe(0);
  });
});
