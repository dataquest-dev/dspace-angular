import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
} from '@angular/router';
import { cold } from 'jasmine-marbles';
import {
  Observable,
  of,
  Subject,
} from 'rxjs';

import { BreadcrumbsProviderService } from '../core/breadcrumbs/breadcrumbsProviderService';
import { Breadcrumb } from './breadcrumb/breadcrumb.model';
import { BreadcrumbConfig } from './breadcrumb/breadcrumb-config.model';
import { BreadcrumbsService } from './breadcrumbs.service';

class TestBreadcrumbsService implements BreadcrumbsProviderService<string> {
  getBreadcrumbs(key: string, url: string): Observable<Breadcrumb[]> {
    return of([new Breadcrumb(key, url)]);
  }
}

describe('BreadcrumbsService', () => {
  let service: BreadcrumbsService;
  let routerEventsObs: Subject<any>;
  let routerMock: Router;
  let activatedRouteMock: Partial<ActivatedRoute>;
  let currentRootRoute: Partial<ActivatedRoute>;
  let breadcrumbProvider;
  let breadcrumbConfigA: BreadcrumbConfig<string>;
  let breadcrumbConfigB: BreadcrumbConfig<string>;

  /**
   * Init breadcrumb variables, see beforeEach
   */
  const initBreadcrumbs = () => {
    breadcrumbProvider = new TestBreadcrumbsService();
    breadcrumbConfigA = { provider: breadcrumbProvider, key: 'example.path', url: 'example.com' };
    breadcrumbConfigB = { provider: breadcrumbProvider, key: 'another.path', url: 'another.com' };
  };

  const changeActivatedRoute = (newRootRoute: any, url = '') => {
    // update the ActivatedRoute that the service will receive
    currentRootRoute = newRootRoute;

    // the pipeline of BreadcrumbsService#listenForRouteChanges needs a NavigationEnd event.
    // Its url only matters for tests that care whether we moved to a different page, since
    // ActivatedRoute is mocked too.
    routerEventsObs.next(new NavigationEnd(0, url, url));
  };

  /**
   * A breadcrumb provider that only resolves once you tell it to, so a test can inspect what
   * breadcrumbs$ holds while a page is still resolving.
   *
   * A factory rather than a class: this file already declares TestBreadcrumbsService, and
   * max-classes-per-file allows one.
   */
  const deferredBreadcrumbsProvider = (): BreadcrumbsProviderService<string> & { subject: Subject<Breadcrumb[]> } => {
    const subject: Subject<Breadcrumb[]> = new Subject();

    return {
      subject,
      getBreadcrumbs: (): Observable<Breadcrumb[]> => subject,
    };
  };

  const routeWith = (config: BreadcrumbConfig<string>) => ({
    snapshot: {
      data: { breadcrumb: config },
      routeConfig: { resolve: { breadcrumb: {} } },
    },
  });

  beforeEach(() => {
    initBreadcrumbs();

    routerEventsObs = new Subject<any>();

    // BreadcrumbsService uses Router#events
    routerMock = jasmine.createSpyObj([], {
      events: routerEventsObs,
    });

    // BreadcrumbsService uses ActivatedRoute#root
    activatedRouteMock = {
      get root() {
        return currentRootRoute as ActivatedRoute;
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    });
    service = TestBed.inject(BreadcrumbsService);

    // this is done by AppComponent under regular circumstances
    service.listenForRouteChanges();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('breadcrumbs$', () => {
    it('should return a breadcrumb corresponding to the current route', () => {
      const route1 = {
        snapshot: {
          data: { breadcrumb: breadcrumbConfigA },
          routeConfig: { resolve: { breadcrumb: {} } },
        },
      };

      const expectation1 = [
        new Breadcrumb(breadcrumbConfigA.key, breadcrumbConfigA.url),
      ];

      changeActivatedRoute(route1);
      expect(service.breadcrumbs$).toBeObservable(cold('a', { a: expectation1 }));

      const route2 = {
        snapshot: {
          data: { breadcrumb: breadcrumbConfigA },
          routeConfig: { resolve: { breadcrumb: {} } },
        },
        firstChild: {
          snapshot: {
            // Example without resolver should be ignored
            data: { breadcrumb: breadcrumbConfigA },
          },
          firstChild: {
            snapshot: {
              data: { breadcrumb: breadcrumbConfigB },
              routeConfig: { resolve: { breadcrumb: {} } },
            },
          },
        },
      };

      const expectation2 = [
        new Breadcrumb(breadcrumbConfigA.key, breadcrumbConfigA.url),
        new Breadcrumb(breadcrumbConfigB.key, breadcrumbConfigB.url),
      ];

      changeActivatedRoute(route2);
      expect(service.breadcrumbs$).toBeObservable(cold('a', { a: expectation2 }));
    });

    describe('while a newly opened page is still resolving its breadcrumbs', () => {
      let deferred: ReturnType<typeof deferredBreadcrumbsProvider>;
      let emissions: Breadcrumb[][];

      beforeEach(() => {
        deferred = deferredBreadcrumbsProvider();
        emissions = [];
        service.breadcrumbs$.subscribe((breadcrumbs: Breadcrumb[]) => emissions.push(breadcrumbs));
      });

      it('should not keep showing the previous page\'s breadcrumbs', () => {
        changeActivatedRoute(routeWith(breadcrumbConfigA), '/items/aaa');
        expect(emissions[emissions.length - 1])
          .toEqual([new Breadcrumb(breadcrumbConfigA.key, breadcrumbConfigA.url)]);

        // navigate somewhere else; its provider has not resolved yet
        changeActivatedRoute(routeWith({ provider: deferred, key: 'slow.path', url: 'slow.com' }), '/items/bbb');
        expect(emissions[emissions.length - 1]).toEqual([]);

        // once it resolves, the new page's breadcrumbs show up
        deferred.subject.next([new Breadcrumb('slow.path', 'slow.com')]);
        expect(emissions[emissions.length - 1]).toEqual([new Breadcrumb('slow.path', 'slow.com')]);
      });

      it('should keep the breadcrumbs when only the query params changed', () => {
        changeActivatedRoute(routeWith(breadcrumbConfigA), '/search');
        const resolved = [new Breadcrumb(breadcrumbConfigA.key, breadcrumbConfigA.url)];
        expect(emissions[emissions.length - 1]).toEqual(resolved);
        const emittedSoFar = emissions.length;

        // paging/filtering on the same page must not blank the trail out
        changeActivatedRoute(routeWith({ provider: deferred, key: 'slow.path', url: 'slow.com' }), '/search?page=2');
        expect(emissions[emissions.length - 1]).toEqual(resolved);
        expect(emissions.slice(emittedSoFar)).not.toContain([]);
      });
    });
  });

  describe('showBreadcrumbs$', () => {
    describe('when the last part of the route has showBreadcrumbs in its data', () => {
      it('should return that value', () => {
        const route1 = {
          snapshot: {
            data: {
              breadcrumb: breadcrumbConfigA,
              showBreadcrumbs: false, // explicitly hide breadcrumbs
            },
            routeConfig: { resolve: { breadcrumb: {} } },
          },
        };

        changeActivatedRoute(route1);
        expect(service.showBreadcrumbs$).toBeObservable(cold('a', { a: false }));

        const route2 = {
          snapshot: {
            data: {
              breadcrumb: breadcrumbConfigA,
              showBreadcrumbs: true, // explicitly show breadcrumbs
            },
            routeConfig: { resolve: { breadcrumb: {} } },
          },
        };

        changeActivatedRoute(route2);
        expect(service.showBreadcrumbs$).toBeObservable(cold('a', { a: true }));
      });
    });

    describe('when the last part of the route has no breadcrumb in its data', () => {
      it('should return false', () => {
        const route1 = {
          snapshot: {
            data: {
              // no breadcrumbs set - always hide
            },
            routeConfig: { resolve: { breadcrumb: {} } },
          },
        };

        changeActivatedRoute(route1);
        expect(service.showBreadcrumbs$).toBeObservable(cold('a', { a: false }));
      });
    });
  });

});
