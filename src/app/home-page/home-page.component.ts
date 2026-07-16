// eslint-disable-next-line max-classes-per-file
import {
  AsyncPipe,
  isPlatformBrowser,
} from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import {
  NgbCarouselConfig,
  NgbCarouselModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
} from 'rxjs';
import {
  map,
  take,
} from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  SortDirection,
  SortOptions,
} from '../core/cache/models/sort-options.model';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { ItemDataService } from '../core/data/item-data.service';
import { SiteDataService } from '../core/data/site-data.service';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { DSpaceObjectType } from '../core/shared/dspace-object-type.model';
import { HALEndpointService } from '../core/shared/hal-endpoint.service';
import { Item } from '../core/shared/item.model';
import { getFirstSucceededRemoteDataPayload } from '../core/shared/operators';
import { SearchService } from '../core/shared/search/search.service';
import { Site } from '../core/shared/site.model';
import { UsageReport } from '../core/statistics/models/usage-report.model';
import { UsageReportDataService } from '../core/statistics/usage-report-data.service';
import { ClarinItemBoxViewComponent } from '../shared/clarin-item-box-view/clarin-item-box-view.component';
import { isUndefined } from '../shared/empty.util';
import { PaginationComponentOptions } from '../shared/pagination/pagination-component-options.model';
import { RSSComponent } from '../shared/rss-feed/rss.component';
import { FacetValue } from '../shared/search/models/facet-value.model';
import { FilterType } from '../shared/search/models/filter-type.model';
import { PaginatedSearchOptions } from '../shared/search/models/paginated-search-options.model';
import { SearchFilterConfig } from '../shared/search/models/search-filter-config.model';
import { SearchObjects } from '../shared/search/models/search-objects.model';
import { ThemedSearchFormComponent } from '../shared/search-form/themed-search-form.component';

const MAX_TRUNCATE_LENGTH = 20;

/**
 * The home page component customized for the CLARIN-DSpace.
 */
@Component({
  selector: 'ds-base-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  providers: [NgbCarouselConfig],
  imports: [
    AsyncPipe,
    ClarinItemBoxViewComponent,
    NgbCarouselModule,
    RouterLink,
    RSSComponent,
    ThemedSearchFormComponent,
    TranslateModule,
  ],
})
export class HomePageComponent implements OnInit {

  slides = [
    { name: 'Linguistic Data', short: 'LData' },
    { name: 'Deposit Free And Save', short: 'Free Deposit' },
    { name: 'Citation', short: 'Citation' },
  ];

  site$: Observable<Site>;
  recentSubmissionspageSize: number;

  authors$: BehaviorSubject<FastSearchLink[]> = new BehaviorSubject<FastSearchLink[]>([]);
  subjects$: BehaviorSubject<FastSearchLink[]> = new BehaviorSubject<FastSearchLink[]>([]);
  languages$: BehaviorSubject<FastSearchLink[]> = new BehaviorSubject<FastSearchLink[]>([]);

  newItems$: BehaviorSubject<Item[]> = new BehaviorSubject<Item[]>([]);
  topItems$: BehaviorSubject<Item[]> = new BehaviorSubject<Item[]>([]);

  siteId: string;

  baseUrl = '';

  /**
   * Link to the search page
   */
  searchLink: string;

  constructor(
    private route: ActivatedRoute, config: NgbCarouselConfig,
    protected searchService: SearchService,
    protected halService: HALEndpointService,
    protected configurationService: ConfigurationDataService,
    protected usageReportService: UsageReportDataService,
    protected siteService: SiteDataService,
    protected itemService: ItemDataService,
    protected router: Router,
    @Inject(PLATFORM_ID) protected platformId: object,
  ) {
    this.recentSubmissionspageSize = environment.homePage.recentSubmissions.pageSize;
    config.interval = 5000;
    config.keyboard = false;
    config.showNavigationArrows = false;
    config.showNavigationIndicators = false;
    config.pauseOnHover = false;
  }

  ngOnInit(): void {
    this.site$ = this.route.data.pipe(
      map((data) => data.site as Site),
    );
    this.assignSiteId();

    this.searchLink = this.searchService.getSearchLink();

    // The statistics/personalization widgets (most-used authors/subjects/languages,
    // most-viewed and newest items) rely on Solr statistics and a large number of
    // parallel REST calls. They are not needed for SSR/SEO and firing them during the
    // server render races the HAL root-endpoint resolution (crashing the home page).
    // Run them in the browser only; the server renders the static shell.
    if (isPlatformBrowser(this.platformId)) {
      // Load the most used authors, subjects and language (ISO)
      this.loadAuthors();
      this.loadSubject();
      this.loadLanguages();

      // Load the most viewed Items and the new Items
      void this.loadTopItems();
      this.loadNewItems();
    }
  }

  /**
   * Get the last added Items.
   * @private
   */
  private loadNewItems() {
    const paginationOptions = Object.assign(new PaginationComponentOptions(), {
      id: 'new-items',
      currentPage: 1,
      pageSize: 3,
    });

    const sortConfiguration = new SortOptions('dc.date.accessioned', SortDirection.DESC);
    this.searchService.search<Item>(
      new PaginatedSearchOptions({
        configuration: 'homepage',
        pagination: paginationOptions,
        sort: sortConfiguration,
        dsoTypes: [DSpaceObjectType.ITEM],
      }))
      .pipe(getFirstSucceededRemoteDataPayload())
      .subscribe((searchObjects: SearchObjects<Item>) => {
        const searchedItems: Item[] = [];
        searchObjects?.page?.forEach(searchObject => {
          searchedItems.push(searchObject?.indexableObject);
        });
        this.newItems$.next(searchedItems);
      });
  }

  /**
   * Get the most viewed Items from the Solr statistics.
   * @private
   */
  private async loadTopItems() {
    const top3ItemsId = [];
    const maxTopItemsCount = 3;

    await this.getItemUsageReports()
      .then((usageReports: UsageReport[]) => {
        const usageReport = usageReports?.[0];
        for (let i = 0; i < maxTopItemsCount; i++) {
          top3ItemsId.push(usageReport?.points?.[i]?.id);
        }
      });

    this.topItems$ = new BehaviorSubject<Item[]>([]);
    for (let i = 0; i < maxTopItemsCount; i++) {
      if (isUndefined(top3ItemsId?.[i])) {
        return;
      }
      this.itemService.findById(top3ItemsId?.[i], false)
        .pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((item: Item) => {
          this.topItems$.value.push(item);
        });
    }
  }

  /**
   * Get usage reports for the viewing The Most Viewed Items
   * @private
   */
  private getItemUsageReports(): Promise<UsageReport[]> {
    const uri = this.halService.getRootHref() + '/core/sites/' + this.siteId;

    return firstValueFrom(this.usageReportService.searchStatistics(uri, 0, 10).pipe(take(1)));
  }

  private assignSiteId() {
    this.site$
      .pipe(take(1))
      .subscribe((site: Site) => {
        this.siteId = site?.uuid;
      });
  }

  /**
   * Load the most used authors.
   * @private
   */
  private loadAuthors() {
    const facetName = 'author';
    void this.getFastSearchLinks(facetName, this.authors$);
  }

  /**
   * Load the most used subjects.
   * @private
   */
  private loadSubject() {
    const facetName = 'subjectFirstValue';
    void this.getFastSearchLinks(facetName, this.subjects$);
  }

  /**
   * Load the most used languages.
   * @private
   */
  private loadLanguages() {
    const facetName = 'language';
    void this.getFastSearchLinks(facetName, this.languages$);
  }

  /**
   * Get the `authors/subjects/languages` from the Solr statistics.
   * @param facetName
   * @param behaviorSubject
   */
  async getFastSearchLinks(facetName: string, behaviorSubject: BehaviorSubject<FastSearchLink[]>) {
    await this.assignBaseUrl();
    const searchFilter: SearchFilterConfig = Object.assign(new SearchFilterConfig(), {
      name: facetName,
      filterType: FilterType.text,
      hasFacets: false,
      isOpenByDefault: false,
      pageSize: 5,
      _links: {
        self: {
          href: this.halService.getRootHref() + '/discover/facets/' + facetName,
        },
      },
    });
    const searchOptions: PaginatedSearchOptions = new PaginatedSearchOptions({ configuration: 'homepage' });
    this.searchService.getFacetValuesFor(searchFilter, 1, searchOptions)
      .pipe(getFirstSucceededRemoteDataPayload())
      .subscribe(authorStats => {
        authorStats.page.forEach((facetValue: FacetValue) => {
          let updatedSearchUrl = facetValue?._links?.search?.href?.replace(this.halService.getRootHref() +
            '/discover', this.baseUrl);
          if (isUndefined(updatedSearchUrl)) {
            return;
          }
          // remove `/objects` from the updatedSearchUrl
          updatedSearchUrl = updatedSearchUrl.replace('/objects', '');
          const fastSearchLink: FastSearchLink = Object.assign(new FastSearchLink(), {
            name: this.truncateText(facetValue.value),
            occurrences: facetValue.count,
            url: updatedSearchUrl,
          });
          behaviorSubject.value.push(fastSearchLink);
        });
      });
  }

  /**
   * Load the UI url from the server configuration.
   */
  getBaseUrl(): Promise<ConfigurationProperty> {
    return firstValueFrom(this.configurationService.findByPropertyName('dspace.ui.url')
      .pipe(getFirstSucceededRemoteDataPayload()));
  }

  async assignBaseUrl() {
    this.baseUrl = await this.getBaseUrl()
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }

  redirectToSearch(searchValue: string) {
    void this.router.navigateByUrl('/search?query=' + searchValue);
  }

  redirectToBrowseByField(field: string) {
    void this.router.navigateByUrl('/browse/' + field);
  }

  /**
   * If the text is longer than MAX_TRUNCATE_LENGTH characters, replace the characters after
   * the MAX_TRUNCATE_LENGTHth index with '...' This method is used to truncate
   * the text in the `authors/subjects/languages` browsing section. We do not want
   * to display the full text of the author/subject/language, but only
   * the first MAX_TRUNCATE_LENGTH characters because it overflows to the next line.
   *
   * @param text
   * @private
   */
  private truncateText(text: string): string {
    if (text.length > MAX_TRUNCATE_LENGTH) {
      // Replace characters after the MAX_TRUNCATE_LENGTHth index with '...'
      return text.substring(0, MAX_TRUNCATE_LENGTH) + '...';
    } else {
      return text; // Return the original string if it's not longer than MAX_TRUNCATE_LENGTH characters
    }
  }
}

/**
 * Object for redirecting to the `authors/subjects/languages`
 */
// tslint:disable-next-line:max-classes-per-file
class FastSearchLink {
  name: string;
  occurrences: string;
  url: string;
}
