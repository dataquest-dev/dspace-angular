import { Component, Inject, Input, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Item } from '../../../../core/shared/item.model';
import { getItemPageRoute } from '../../../item-page-routing-paths';
import { RouteService } from '../../../../core/services/route.service';
import { Observable } from 'rxjs';
import { getDSpaceQuery, isIiifEnabled, isIiifSearchEnabled } from './item-iiif-utils';
import { map, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { isAuthenticated } from 'src/app/core/auth/selectors';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';

@Component({
  selector: 'ds-item',
  template: ''
})
/**
 * A generic component for displaying metadata and relations of an item
 */
export class ItemComponent implements OnInit {
  @Input() object: Item;

  /**
   * Session storage key for storing the previous URL before entering item page
   */
  private readonly ITEM_PREVIOUS_URL_SESSION_KEY = 'item-previous-url';

  /**
   * This regex matches previous routes. The button is shown
   * for matching paths and hidden in other cases.
   */
  previousRoute = /^(\/home|\/search|\/browse|\/collections|\/admin\/search|\/mydspace)/;

  /**
   * Used to show or hide the back to results button in the view.
   */
  showBackButton: Observable<boolean>;

  /**
   * Route to the item page
   */
  itemPageRoute: string;

  /**
   * Enables the mirador component.
   */
  iiifEnabled: boolean;

  /**
   * Used to configure search in mirador.
   */
  iiifSearchEnabled: boolean;

  /**
   * The query term from the previous dspace search.
   */
  iiifQuery$: Observable<string>;

  mediaViewer;

  isAuthenticated$: Observable<boolean>;

  /**
   * Stores the previous URL retrieved either from RouteService or sessionStorage
   */
  private storedPreviousUrl: string;

  constructor(protected routeService: RouteService,
              protected router: Router,
              private store: Store<AppState>,
              @Inject(APP_CONFIG) private appConfig: AppConfig) {
    this.mediaViewer = environment.mediaViewer;
  }

  /**
   * The function used to return to list from the item.
   * Uses stored previous URL if available, otherwise falls back to browser history.
   */
  back = () => {
    this.router.navigateByUrl(this.storedPreviousUrl);
  };

  ngOnInit(): void {
    this.itemPageRoute = getItemPageRoute(this.object);
    // hide/show the back button
    this.showBackButton = this.routeService.getPreviousUrl().pipe(
      take(1),
      map(url => {
        const fromRoute = this.pickAllowedPrevious(url);

        if (fromRoute) {
          this.routeService.storeUrlInSession(this.ITEM_PREVIOUS_URL_SESSION_KEY, fromRoute);
          this.storedPreviousUrl = fromRoute;
          return true;
        }

        const storedUrl = this.routeService.getUrlFromSession(this.ITEM_PREVIOUS_URL_SESSION_KEY);
        if (this.pickAllowedPrevious(storedUrl)) {
          this.storedPreviousUrl = storedUrl;
          return true;
        }

        return false;
      })
    );

    // check to see if iiif viewer is required.
    this.iiifEnabled = isIiifEnabled(this.object);
    this.iiifSearchEnabled = isIiifSearchEnabled(this.object);
    if (this.iiifSearchEnabled) {
      this.iiifQuery$ = getDSpaceQuery(this.object, this.routeService);
    }
    this.isAuthenticated$ = this.store.pipe(select(isAuthenticated));
  }

  /**
   * Helper to check if a URL is from an allowed previous route and return it, otherwise null
   */
  private pickAllowedPrevious(url?: string | null): string | null {
    return url && this.previousRoute.test(url) ? url : null;
  }

  get hasConfiguredStatistics(): boolean {
    return !!this.appConfig.statistics?.baseUrl && !!this.appConfig.statistics?.endpoint;
  }
}
