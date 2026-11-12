import { MatomoConfig } from '../../config/matomo-config';
import { hasValue, isNotEmpty } from '../shared/empty.util';

/**
 * Window function through which the Klaro Matomo service reports the visitor's consent
 */
export const MATOMO_CONSENT_CALLBACK = 'changeMatomoConsent';

const MATOMO_SCRIPT = 'matomo.js';
const MATOMO_TRACKER_ENDPOINT = 'matomo.php';
const PAGE_VIEW_ACTION = 'page_view';
const DISCARDED_REQUEST = '';

/**
 * A page view and the item identifier of its page, if any
 */
interface PageView {
  path: string;
  dimension?: string;
}

/**
 * Forwards Angulartics page tracking to Matomo only while the visitor consents to Matomo.
 * The tracker is loaded on the first consent. Without consent nothing is queued except the current page,
 * which is tracked once consent is given, so pages and clicks from a declined period are never sent.
 */
export class MatomoConsentTracker {

  private consent = false;
  private loaded = false;
  private dimension: string;
  private pendingPageView: PageView;

  /**
   * @param window          the browser window holding the Matomo command queue
   * @param document        the document to add the Matomo script to
   * @param config          the Matomo configuration
   * @param sendPageView    sends a page view to Matomo (the original Angulartics2Matomo pageTrack)
   * @param consentRequired false when the cookie consent popup is disabled, so tracking needs no consent
   */
  constructor(private window: any,
              private document: Document,
              private config: MatomoConfig,
              private sendPageView: (path: string) => void,
              consentRequired: boolean) {
    this.window[MATOMO_CONSENT_CALLBACK] = (consent: boolean) => this.setConsent(consent);
    if (!consentRequired) {
      this.setConsent(true);
    }
  }

  /**
   * Apply the visitor's Matomo consent. Revoking it stops tracking, and every request Matomo builds
   * meanwhile is emptied, so Matomo's consent queue cannot send it after a later consent.
   * @param consent whether the visitor consents to Matomo
   */
  setConsent(consent: boolean): void {
    if (consent === this.consent || !this.isConfigured()) {
      return;
    }
    this.consent = consent;
    this.dimension = undefined;
    if (consent) {
      this.load();
      // A function keeps its queue position; a queued 'setConsentGiven' name would run before 'forgetConsentGiven'
      this.push(function () {
        this.setConsentGiven();
      });
      this.trackPendingPageView();
    } else {
      this.push('forgetConsentGiven');
    }
  }

  /**
   * Remember the item identifier of a page_view event, if any, for the next page view
   * @param action     the Angulartics event action
   * @param properties the Angulartics event properties
   */
  eventTrack(action: string, properties?: any): void {
    if (action === PAGE_VIEW_ACTION) {
      this.dimension = properties?.dc_identifier;
    }
  }

  /**
   * Track a page view, or keep it as the current page until the visitor consents
   * @param path the path of the page
   */
  trackPage(path: string): void {
    const pageView: PageView = { path, dimension: this.dimension };
    this.dimension = undefined;
    if (this.consent) {
      this.track(pageView);
    } else {
      this.pendingPageView = pageView;
    }
  }

  private trackPendingPageView(): void {
    if (hasValue(this.pendingPageView)) {
      this.track(this.pendingPageView);
      this.pendingPageView = undefined;
    }
  }

  private track(pageView: PageView): void {
    if (isNotEmpty(pageView.dimension)) {
      this.push('setCustomDimension', this.config.dimensionId, pageView.dimension);
    }
    this.sendPageView(pageView.path);
    this.push('deleteCustomDimension', this.config.dimensionId);
  }

  private load(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.push('setTrackerUrl', this.config.hostUrl + MATOMO_TRACKER_ENDPOINT);
    this.push('setSiteId', this.config.siteId);
    this.push('setCustomRequestProcessing', (request: string) => this.consent ? request : DISCARDED_REQUEST);
    this.push('enableLinkTracking');
    this.addScript();
  }

  private addScript(): void {
    const script = this.document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = this.config.hostUrl + MATOMO_SCRIPT;
    this.document.head.appendChild(script);
  }

  private isConfigured(): boolean {
    return [this.config?.hostUrl, this.config?.siteId].every((value) => isNotEmpty(`${value ?? ''}`.trim()));
  }

  private push(...command: unknown[]): void {
    this.window._paq = this.window._paq || [];
    this.window._paq.push(command);
  }
}
