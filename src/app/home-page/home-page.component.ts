import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Site } from '../core/shared/site.model';
import { environment } from '../../environments/environment';
@Component({
  selector: 'ds-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html'
})
export class HomePageComponent implements OnInit {

  site$: Observable<Site>;
  recentSubmissionspageSize: number;
  constructor(
    private route: ActivatedRoute,
  ) {
    this.recentSubmissionspageSize = environment.homePage.recentSubmissions.pageSize;
  }

  ngOnInit(): void {
    this.site$ = this.route.data.pipe(
      map((data) => data.site as Site),
    );
  }

  /**
   * Load the most used subjects.
   * @private
   */
  private loadSubject() {
    const facetName = 'subject';
    this.getFastSearchLinks(facetName, this.subjects$);
  }

  /**
   * Load the most used languages.
   * @private
   */
  private loadLanguages() {
    const facetName = 'language';
    this.getFastSearchLinks(facetName, this.languages$);
  }

  /**
   * Get the `authors/subjects/languages` from the Solr statistics.
   * @param facetName
   * @param behaviorSubject
   */
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
          let updatedSearchUrl = facetValue?._links?.search?.href?.replace(this.halService.getRootHref() +
            '/discover', this.baseUrl);
          // remove `/objects` from the updatedSearchUrl
          updatedSearchUrl = updatedSearchUrl.replace('/objects', '');
          const fastSearchLink: FastSearchLink = Object.assign(new FastSearchLink(), {
            name: facetValue.value,
            occurrences: facetValue.count,
            url: updatedSearchUrl
          });
          behaviorSubject.value.push(fastSearchLink);
        });
      });
  }

  /**
   * Load the UI url from the server configuration.
   */
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

  redirectToSearch(searchValue) {
    this.router.navigateByUrl('/search?query=' + searchValue);
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
