import {
  ActivatedRouteSnapshot,
  ResolveEnd,
  RouterStateSnapshot,
} from '@angular/router';
import { Angulartics2 } from 'angulartics2';
import {
  of,
  Subject,
} from 'rxjs';

import { ReferrerService } from '../../../core/services/referrer.service';
import { ViewTrackerResolverService } from './view-tracker-resolver.service';

describe('ViewTrackerResolverService', () => {
  const mockReferrer = 'https://www.referrer.com';
  const stateSnapshot = {} as RouterStateSnapshot;

  let service: ViewTrackerResolverService;
  let angulartics2: Angulartics2;
  let referrerService: jasmine.SpyObj<ReferrerService>;
  let router: any;
  let routerEvents$: Subject<any>;
  let mockDso: { firstMetadataValue: jasmine.Spy };

  /**
   * Resolve the route, then let the router emit the ResolveEnd the service waits for, and return
   * the tracked event.
   */
  const track = (routeSnapshot: ActivatedRouteSnapshot): any => {
    let emittedEvent: any;
    (angulartics2.eventTrack as Subject<any>).subscribe(event => emittedEvent = event);

    service.resolve(routeSnapshot, stateSnapshot);
    routerEvents$.next(new ResolveEnd(1, '/', '/', {} as any));

    return emittedEvent;
  };

  beforeEach(() => {
    routerEvents$ = new Subject();
    mockDso = {
      firstMetadataValue: jasmine.createSpy('firstMetadataValue').and.returnValue('http://hdl.handle.net/123456789/1'),
    };

    angulartics2 = {
      eventTrack: new Subject(),
    } as any;

    referrerService = jasmine.createSpyObj('ReferrerService', ['getReferrer']);
    referrerService.getReferrer.and.returnValue(of(mockReferrer));

    router = {
      events: routerEvents$.asObservable(),
    };

    service = new ViewTrackerResolverService(angulartics2, referrerService, router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should include dc_identifier in event properties when dso has dc.identifier.uri metadata', () => {
    const emittedEvent = track({
      data: {
        dso: {
          payload: mockDso,
        },
      },
    } as any as ActivatedRouteSnapshot);

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent.action).toBe('page_view');
    expect(emittedEvent.properties.object).toBe(mockDso);
    expect(emittedEvent.properties.referrer).toBe(mockReferrer);
    expect(emittedEvent.properties.dc_identifier).toBe('http://hdl.handle.net/123456789/1');
    expect(mockDso.firstMetadataValue).toHaveBeenCalledWith('dc.identifier.uri');
  });

  it('should set dc_identifier to undefined when dso does not have dc.identifier.uri metadata', () => {
    const mockDsoWithoutMetadata = {
      firstMetadataValue: jasmine.createSpy('firstMetadataValue').and.returnValue(undefined),
    };

    const emittedEvent = track({
      data: {
        dso: {
          payload: mockDsoWithoutMetadata,
        },
      },
    } as any as ActivatedRouteSnapshot);

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent.action).toBe('page_view');
    expect(emittedEvent.properties.dc_identifier).toBeUndefined();
  });

  it('should handle missing dso gracefully (dc_identifier undefined)', () => {
    const emittedEvent = track({
      data: {
        dso: {
          payload: undefined,
        },
      },
    } as any as ActivatedRouteSnapshot);

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent.action).toBe('page_view');
    expect(emittedEvent.properties.dc_identifier).toBeUndefined();
  });

  it('should use custom dsoPath from route data when provided', () => {
    const mockDsoCustom = {
      firstMetadataValue: jasmine.createSpy('firstMetadataValue').and.returnValue('http://hdl.handle.net/custom/42'),
    };

    const emittedEvent = track({
      data: {
        dsoPath: 'myCustomDso',
        myCustomDso: mockDsoCustom,
      },
    } as any as ActivatedRouteSnapshot);

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent.properties.object).toBe(mockDsoCustom);
    expect(emittedEvent.properties.dc_identifier).toBe('http://hdl.handle.net/custom/42');
  });
});
