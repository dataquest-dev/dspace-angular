import {
  EnvironmentInjector,
  inject,
  Injectable,
  runInInjectionContext,
} from '@angular/core';
import {
  MatomoInitializerService,
  MatomoTracker,
} from 'ngx-matomo-client';
import {
  combineLatest,
  from as fromPromise,
  Observable,
  of,
  ReplaySubject,
} from 'rxjs';
import {
  map,
  take,
} from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { RemoteData } from '../core/data/remote-data';
import { NativeWindowService } from '../core/services/window.service';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { getFirstCompletedRemoteData } from '../core/shared/operators';
import { OrejimeService } from '../shared/cookies/orejime.service';
import { isNotEmpty } from '../shared/empty.util';

export const MATOMO_TRACKER_URL = 'matomo.tracker.url';
export const MATOMO_SITE_ID = 'matomo.request.siteid';

export const MATOMO_ENABLED = 'matomo.enabled';

/**
 * Service to manage Matomo analytics integration.
 * Handles initialization and consent management for Matomo tracking.
 */
@Injectable({
  providedIn: 'root',
})
/**
 * Service responsible for managing Matomo analytics tracking and consent.
 * Provides methods for initializing tracking, managing consent, and appending visitor identifiers.
 */
export class MatomoService {
  /** Injects the MatomoInitializerService to initialize the Matomo tracker. */
  matomoInitializer: MatomoInitializerService;

  /** Injects the MatomoTracker to manage Matomo tracking operations. */
  matomoTracker: MatomoTracker;

  /** Injects the OrejimeService to manage cookie consent preferences. */
  orejimeService = inject(OrejimeService);

  /** Injects the NativeWindowService to access the native window object. */
  _window = inject(NativeWindowService);

  /** Injects the ConfigurationService. */
  configService = inject(ConfigurationDataService);

  /** Handle of the item whose page view is about to be tracked, when the current page has one. */
  private itemHandle: string;

  /** Whether the visitor's consent to Matomo is applied. */
  private consent = false;

  /** The consent in force at the point Matomo has reached in its command queue. */
  private consentInQueue = false;

  /** Whether the router queued the current page view without consent. */
  private pageViewWithoutConsent = false;

  /** Site id and tracker URL, once Matomo is enabled and configured. */
  private trackerConfig: { siteId: string, trackerUrl: string };

  private scriptInjected = false;

  private statusSubject = new ReplaySubject<'loading' | 'loaded' | 'error'>(1);
  private status$ = this.statusSubject.asObservable();

  constructor(private injector: EnvironmentInjector) {
    this.statusSubject.next('loading');
  }

  /**
   * This method indicates that the Matomo script loaded successfully thus we set state to loaded
   */
  markAsLoaded() {
    this.statusSubject.next('loaded');
  }

  /**
   * This method indicates that the Matomo script failed to download or execute and sets state to error
   */
  markAsError() {
    this.statusSubject.next('error');
  }

  /**
   * Initializes the Matomo tracker if in production environment.
   * Sets up the changeMatomoConsent function on the native window object.
   * Subscribes to cookie consent preferences and applies them once Matomo is configured.
   */
  init() {
    if (this._window.nativeWindow) {
      this._window.nativeWindow.changeMatomoConsent = this.changeMatomoConsent;
    }

    if (environment.production) {
      this.matomoTracker = runInInjectionContext(this.injector, () => inject(MatomoTracker));
      // Set before the router queues its first page view. Matomo then empties, and never sends, every request
      // queued without consent, even when it runs the queue after a later consent.
      this.matomoTracker.setCustomRequestProcessing((request: string) => this.consentInQueue ? request : '');

      const preferences$ = this.orejimeService.getSavedPreferences();

      combineLatest([preferences$, this.isMatomoEnabled$(), this.getSiteId$(), this.getTrackerUrl$()])
        .subscribe(([preferences, isMatomoEnabled, siteId, trackerUrl]) => {
          if (isMatomoEnabled && siteId && trackerUrl) {
            this.matomoInitializer = runInInjectionContext(this.injector, () => inject(MatomoInitializerService));
            this.trackerConfig = { siteId, trackerUrl };
            this.changeMatomoConsent(environment.info?.enableCookieConsentPopup === false || preferences?.matomo);
          }
        });
    }
  }

  /**
   * Applies the visitor's Matomo consent once Matomo is configured. The first consent loads the Matomo script.
   * A consent tracks the current page if the router queued it without consent. A revocation stops tracking,
   * and Matomo deletes its cookies.
   * @param consent - A boolean indicating whether consent is given for Matomo tracking.
   */
  changeMatomoConsent = (consent: boolean) => {
    const given = !!consent;
    if (!this.trackerConfig || given === this.consent) {
      return;
    }
    this.consent = given;
    if (given && !this.scriptInjected) {
      this.scriptInjected = true;
      this.matomoInitializer.initializeTracker(this.trackerConfig);
    }
    this.runInQueue((matomo) => {
      this.consentInQueue = given;
      if (given) {
        matomo.setConsentGiven();
      } else {
        matomo.forgetConsentGiven();
      }
    });
    if (given && this.pageViewWithoutConsent) {
      this.pageViewWithoutConsent = false;
      this.matomoTracker.trackPageView();
    }
  };

  /**
   * Remembers whether the router queues the coming page view without consent, so that page is tracked once
   * consent is given.
   */
  notePageView() {
    this.pageViewWithoutConsent = !this.consent;
  }

  /**
   * Appends the Matomo visitor ID to the given URL, while the visitor consents to Matomo.
   * @param url - The original URL to which the visitor ID will be added.
   * @returns An Observable that emits the URL with the visitor ID appended, or the URL unchanged without consent.
   */
  appendVisitorId(url: string): Observable<string> {
    if (!this.consent) {
      return of(url);
    }
    return fromPromise(this.matomoTracker?.getVisitorId())
      .pipe(
        map(visitorId => this.appendTrackerId(url, visitorId)),
        take(1),
      );
  }

  /**
   * Remembers the item handle the view tracker reported for the page view that follows.
   */
  setItemHandle(handle: string) {
    this.itemHandle = handle;
  }

  /**
   * Reports the remembered handle in the configured custom dimension and forgets it, so the next
   * page view is not attributed to the previous item. No dimension id configured, nothing is sent.
   */
  applyItemCustomDimension() {
    const handle = this.itemHandle;
    this.itemHandle = undefined;

    const dimensionId = environment.matomo?.dimensionId;
    if (!dimensionId) {
      return;
    }

    // the tracker queues commands until the script is initialised, so the first page view of a
    // session keeps its dimension even though init() has not run yet
    const tracker = this.matomoTracker ?? runInInjectionContext(this.injector, () => inject(MatomoTracker));
    if (isNotEmpty(handle)) {
      tracker.setCustomDimension(dimensionId, handle);
    } else {
      tracker.deleteCustomDimension(dimensionId);
    }
  }

  /**
   * Retrieves the Matomo tracker URL from the configuration service.
   * @returns An Observable that emits the Matomo tracker URL if available.
   */
  getTrackerUrl$() {

    if (isNotEmpty(environment.matomo?.trackerUrl)) {
      return of(environment.matomo.trackerUrl);
    }

    return this.configService.findByPropertyName(MATOMO_TRACKER_URL)
      .pipe(
        getFirstCompletedRemoteData(),
        map((res: RemoteData<ConfigurationProperty>) => {
          return res.hasSucceeded && res.payload && isNotEmpty(res.payload.values) && res.payload.values[0];
        }),
      );
  }

  /**
   * Retrieves the Matomo site ID from the configuration service.
   * @returns An Observable that emits the Matomo site ID if available.
   */
  getSiteId$() {
    return this.configService.findByPropertyName(MATOMO_SITE_ID)
      .pipe(
        getFirstCompletedRemoteData(),
        map((res: RemoteData<ConfigurationProperty>) => {
          return res.hasSucceeded && res.payload && isNotEmpty(res.payload.values) && res.payload.values[0];
        }),
      );
  }

  /**
   * Checks if Matomo tracking is enabled by retrieving the configuration property.
   * @returns An Observable that emits a boolean indicating whether Matomo tracking is enabled.
   */
  isMatomoEnabled$(): Observable<boolean> {
    return this.configService.findByPropertyName(MATOMO_ENABLED)
      .pipe(
        getFirstCompletedRemoteData(),
        map((res: RemoteData<ConfigurationProperty>) => {
          return res.hasSucceeded && res.payload && isNotEmpty(res.payload.values) &&
            res.payload.values[0]?.toLowerCase() === 'true';
        }),
      );
  }

  /**
   * Checks if Matomo script loaded correctly
   * @returns An Observable that emits a boolean indicating whether Matomo script loaded correctly.
   */
  isMatomoScriptLoaded$(): Observable<boolean> {
    return this.status$.pipe(
      map(status => status === 'loaded'),
    );
  }

  /**
   * Appends the visitor ID as a query parameter to the given URL.
   * @param url - The original URL to modify
   * @param visitorId - The visitor ID to append to the URL
   * @returns The updated URL with the visitor ID added as a 'trackerId' query parameter
   */
  private appendTrackerId(url: string, visitorId: string) {
    const updatedURL = new URL(url);
    if (isNotEmpty(visitorId)) {
      updatedURL.searchParams.append('trackerId', visitorId);
    }
    return updatedURL.toString();
  }

  /**
   * Runs fn on the Matomo tracker when Matomo reaches it in its command queue. Matomo would run a queued
   * 'setConsentGiven' name before the commands queued ahead of it, so consent changes go through here.
   */
  private runInQueue(fn: (matomo: any) => void) {
    this._window.nativeWindow._paq.push([function () {
      fn(this);
    }]);
  }
}

/**
 * Matomo router interceptor, run by ngx-matomo right before it sends a page view.
 */
export function matomoItemDimensionInterceptor(): void {
  inject(MatomoService).applyItemCustomDimension();
}

/**
 * Matomo router interceptor that notes whether the coming page view is queued without consent.
 */
export function matomoConsentInterceptor(): void {
  inject(MatomoService).notePageView();
}
