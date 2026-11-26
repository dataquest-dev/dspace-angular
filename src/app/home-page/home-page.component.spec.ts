import {
  NO_ERRORS_SCHEMA,
  PLATFORM_ID,
  Provider,
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
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../shared/remote-data.utils';
import { RSSComponent } from '../shared/rss-feed/rss.component';
import { ThemedSearchFormComponent } from '../shared/search-form/themed-search-form.component';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  async function setup(platformId: string, providers: Provider[]) {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: of({ site: { uuid: 'site-uuid' } }) } },
        { provide: SiteDataService, useValue: {} },
        { provide: ItemDataService, useValue: {} },
        { provide: PLATFORM_ID, useValue: platformId },
        ...providers,
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
  }

  function minHeight(selector: string): number {
    return parseFloat(getComputedStyle(fixture.nativeElement.querySelector(selector)).minHeight) || 0;
  }

  describe('on the server', () => {
    beforeEach(async () => {
      await setup('server', [
        { provide: SearchService, useValue: { getSearchLink: () => '/search' } },
        { provide: HALEndpointService, useValue: {} },
        { provide: ConfigurationDataService, useValue: {} },
        { provide: UsageReportDataService, useValue: {} },
      ]);
    });

    it('should keep space for the boxes the browser fills after load', () => {
      expect(minHeight('.fast-search-links')).toBeGreaterThan(0);
      expect(minHeight('.new-items')).toBeGreaterThan(0);
    });
  });

  describe('in the browser', () => {
    beforeEach(async () => {
      await setup('browser', [
        {
          provide: SearchService, useValue: {
            getSearchLink: () => '/search',
            search: () => createFailedRemoteDataObject$(),
            getFacetValuesFor: () => createFailedRemoteDataObject$(),
          },
        },
        { provide: HALEndpointService, useValue: { getRootHref: () => 'http://rest' } },
        { provide: ConfigurationDataService, useValue: { findByPropertyName: () => createSuccessfulRemoteDataObject$({ values: ['http://ui'] }) } },
        { provide: UsageReportDataService, useValue: { searchStatistics: () => of([]) } },
      ]);
    });

    it('should drop that space when the requests fail', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.loading.size).toBe(0);
      expect(minHeight('.fast-search-links')).toBe(0);
      expect(minHeight('.new-items')).toBe(0);
    });
  });
});
