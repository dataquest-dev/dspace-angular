import { Component, OnInit } from '@angular/core';
import {map, startWith, switchMap, take} from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import {BehaviorSubject, combineLatest as observableCombineLatest, Observable} from 'rxjs';
import { Site } from '../core/shared/site.model';
import {NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';
import {SearchService} from '../core/shared/search/search.service';
import {SearchFilterConfig} from '../shared/search/models/search-filter-config.model';
import {SearchOptions} from '../shared/search/models/search-options.model';
import {
  getFirstSucceededRemoteData,
  getFirstSucceededRemoteDataPayload,
  toDSpaceObjectListRD
} from '../core/shared/operators';
import {PaginationComponentOptions} from '../shared/pagination/pagination-component-options.model';
import {FilterType} from '../shared/search/models/filter-type.model';
import {HALEndpointService} from '../core/shared/hal-endpoint.service';
import {FacetValue} from '../shared/search/models/facet-value.model';
import {environment} from '../../environments/environment';
import {ConfigurationDataService} from '../core/data/configuration-data.service';
import {ConfigurationProperty} from '../core/shared/configuration-property.model';
import {Item} from '../core/shared/item.model';
import {UsageReportService} from '../core/statistics/usage-report-data.service';
import {SiteDataService} from '../core/data/site-data.service';
import {UsageReport} from '../core/statistics/models/usage-report.model';
import {ItemDataService} from '../core/data/item-data.service';
import {PaginatedSearchOptions} from '../shared/search/models/paginated-search-options.model';
import {DSpaceObjectType} from '../core/shared/dspace-object-type.model';
import {RemoteData} from '../core/data/remote-data';
import {PaginatedList} from '../core/data/paginated-list.model';
import {SortDirection, SortOptions} from '../core/cache/models/sort-options.model';
import {paginationID} from '../handle-page/handle-table/handle-table-pagination';
import {SearchObjects} from '../shared/search/models/search-objects.model';
import {ItemSearchResult} from '../shared/object-collection/shared/item-search-result.model';
import {SearchResult} from '../shared/search/models/search-result.model';

@Component({
  selector: 'ds-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  providers: [NgbCarouselConfig]
})
export class HomePageComponent implements OnInit {

  slides = [
    {name: 'Citation', short: 'Citation'},
    {name: 'Deposit Free And Save', short: 'Free Deposit'},
    {name: 'Linguistic Data', short: 'LData'}
  ];

  site$: Observable<Site>;

  authors$: BehaviorSubject<FastSearchLink[]> = new BehaviorSubject<FastSearchLink[]>([]);
  subjects$: BehaviorSubject<FastSearchLink[]> = new BehaviorSubject<FastSearchLink[]>([]);
  languages$: BehaviorSubject<FastSearchLink[]> = new BehaviorSubject<FastSearchLink[]>([]);

  newItems$: BehaviorSubject<Item[]> = new BehaviorSubject<Item[]>([]);
  topItems$: BehaviorSubject<Item[]> = new BehaviorSubject<Item[]>([]);

  siteId: string;

  baseUrl = '';

  constructor(
    private route: ActivatedRoute, config: NgbCarouselConfig,
    protected searchService: SearchService,
    protected halService: HALEndpointService,
    protected configurationService: ConfigurationDataService,
    protected usageReportService: UsageReportService,
    protected siteService: SiteDataService,
    protected itemService: ItemDataService
  ) {
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

    // Load the most used authors, subjects and language (ISO)
    this.loadAuthors();
    this.loadSubject();
    this.loadLanguages();

    // Load the most viewed Items and the new Items
    this.loadTopItems();
    this.loadNewItems();
  }

  private getItemUsageReports(): Promise<any> {
    const uri = this.halService.getRootHref() + '/core/sites/' + this.siteId;

    return this.usageReportService.searchStatistics(uri, 0, 10)
      .pipe(take(1)).toPromise();
  }

  private loadNewItems() {
    // this.searchService.search()
    // const currentPagination$ = this.paginationService.getCurrentPagination(this.paginationConfig.id, this.paginationConfig);
    // const currentSort$ = this.paginationService.getCurrentSort(this.paginationConfig.id, this.sortConfig);
    const paginationOptions = Object.assign(new PaginationComponentOptions(), {
      id: 'new-items',
      currentPage: 1,
      pageSize: 3
    });

    const sortConfiguration = new SortOptions('dc.date.accessioned', SortDirection.DESC);

    this.searchService.search(
      new PaginatedSearchOptions({
        pagination: paginationOptions,
        sort: sortConfiguration,
        dsoTypes: [DSpaceObjectType.ITEM]
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

  private async loadTopItems() {
    const top3ItemsId = [];
    const maxTopItemsCount = 3;

    await this.getItemUsageReports()
      .then((usageReports: UsageReport[]) => {
        const usageReport = usageReports?.[0];
        for (let i = 0; i < maxTopItemsCount; i++) {
          top3ItemsId.push(usageReport.points?.[i].id);
        }
      });

    this.topItems$ = new BehaviorSubject<Item[]>([]);
    for (let i = 0; i < maxTopItemsCount; i++) {
      this.itemService.findById(top3ItemsId?.[i], false)
        .pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((item: Item) => {
          this.topItems$.value.push(item);
        });
    }
  }

  private assignSiteId() {
    this.site$
      .pipe(take(1))
      .subscribe((site: Site) => {
        this.siteId = site.uuid;
      });
  }

  private loadAuthors() {
    const facetName = 'author';
    this.getFastSearchLinks(facetName, this.authors$);
  }

  private loadSubject() {
    const facetName = 'subject';
    this.getFastSearchLinks(facetName, this.subjects$);
  }

  private loadLanguages() {
    const facetName = 'language';
    this.getFastSearchLinks(facetName, this.languages$);
  }

  async getFastSearchLinks(facetName, behaviorSubject: BehaviorSubject<any>) {
    await this.assignBaseUrl();
    const authorFilter: SearchFilterConfig = Object.assign(new SearchFilterConfig(), {
      name: facetName,
      filterType: FilterType.text,
      hasFacets: false,
      isOpenByDefault: false,
      pageSize: 5,
      _links: {
        self: {
          href: this.halService.getRootHref() + '/discover/facets/' + facetName
        },
      },
    });
    const authorFilterOptions: SearchOptions = new SearchOptions({configuration: 'default'});
    this.searchService.getFacetValuesFor(authorFilter, 1, authorFilterOptions)
      .pipe(getFirstSucceededRemoteDataPayload())
      .subscribe(authorStats => {
        authorStats.page.forEach((facetValue: FacetValue) => {
          const updatedSearchUrl = facetValue?._links?.search?.href?.replace(this.halService.getRootHref() +
            '/discover', this.baseUrl);
          const fastSearchLink: FastSearchLink = Object.assign(new FastSearchLink(), {
            name: facetValue.value,
            occurrences: facetValue.count,
            url: updatedSearchUrl
          });
          behaviorSubject.value.push(fastSearchLink);
        });
      });
  }

  async getBaseUrl(): Promise<any> {
    return this.configurationService.findByPropertyName('dspace.ui.url')
      .pipe(getFirstSucceededRemoteDataPayload())
      .toPromise();
  }

  async assignBaseUrl() {
    this.baseUrl = await this.getBaseUrl()
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }
}

// tslint:disable-next-line:max-classes-per-file
class FastSearchLink {
  name: string;
  occurrences: string;
  url: string;
}
