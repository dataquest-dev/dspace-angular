import { Injectable } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
} from '@angular/router';
import {
  combineLatest,
  Observable,
  of,
  ReplaySubject,
} from 'rxjs';
import {
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';

import {
  hasNoValue,
  hasValue,
  isUndefined,
} from '../shared/empty.util';
import { Breadcrumb } from './breadcrumb/breadcrumb.model';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbsService {

  /**
   * Observable of the list of breadcrumbs for this page
   */
  breadcrumbs$: ReplaySubject<Breadcrumb[]> = new ReplaySubject(1);

  /**
   * Whether or not to show breadcrumbs on this page
   */
  showBreadcrumbs$: ReplaySubject<boolean> = new ReplaySubject(1);

  /**
   * Path (without query params) of the page the current breadcrumbs belong to
   */
  private currentPath: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  /**
   * Called by {@link AppComponent#constructor} (i.e. before routing)
   * such that no routing events are missed.
   */
  listenForRouteChanges() {
    // supply events to this.breadcrumbs$
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      tap((event: NavigationEnd) => this.reset(event)),
      switchMap(() => this.resolveBreadcrumbs(this.route.root)),
    ).subscribe(this.breadcrumbs$);
  }

  /**
   * Method that recursively resolves breadcrumbs
   * @param route The route to get the breadcrumb from
   */
  private resolveBreadcrumbs(route: ActivatedRoute): Observable<Breadcrumb[]> {
    const data = route.snapshot.data;
    const routeConfig = route.snapshot.routeConfig;

    const last: boolean = hasNoValue(route.firstChild);
    if (last) {
      if (hasValue(data.showBreadcrumbs)) {
        this.showBreadcrumbs$.next(data.showBreadcrumbs);
      } else if (isUndefined(data.breadcrumb)) {
        this.showBreadcrumbs$.next(false);
      }
    }

    if (
      hasValue(data) && hasValue(data.breadcrumb) &&
      hasValue(routeConfig) && hasValue(routeConfig.resolve) && hasValue(routeConfig.resolve.breadcrumb)
    ) {
      const { provider, key, url } = data.breadcrumb;
      if (!last) {
        return combineLatest(provider.getBreadcrumbs(key, url), this.resolveBreadcrumbs(route.firstChild))
          .pipe(map((crumbs) => [].concat.apply([], crumbs)));
      } else {
        return provider.getBreadcrumbs(key, url);
      }
    }
    return !last ? this.resolveBreadcrumbs(route.firstChild) : of([]);
  }

  /**
   * Resets the state of the breadcrumbs
   *
   * The breadcrumb providers resolved below are asynchronous, so between arriving on a page and
   * its breadcrumbs being resolved there is a gap - on a cold cache, seconds. `breadcrumbs$` is a
   * ReplaySubject, so for the whole of that gap it keeps replaying the *previous* page's trail,
   * and the new page renders a breadcrumb belonging to somewhere else entirely.
   *
   * Clearing it here means the trail is empty until the new one arrives; the component still
   * renders the "Home" crumb on its own, so the bar keeps its height and nothing jumps.
   *
   * Only done when the path actually changed: paging and filtering re-emit NavigationEnd for the
   * same page, and dropping the trail on those would make it flicker on every click.
   */
  private reset(event?: NavigationEnd) {
    this.showBreadcrumbs$.next(true);

    const path = (event?.urlAfterRedirects ?? '').split('?')[0];
    if (path !== this.currentPath) {
      this.currentPath = path;
      this.breadcrumbs$.next([]);
    }
  }

}
