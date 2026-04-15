import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { IdentityProvider } from './models/idp-entry.model';
import { SamldsParams, WayfConfig, WAYF_CONFIG, WAYF_DEFAULTS } from './wayf.config';
import { WayfFeedService } from './services/feed.service';
import { WayfPersistenceService } from './services/persistence.service';
import { WayfSearchService } from './services/search.service';
import { WayfSearchBarComponent } from './components/search-bar/wayf-search-bar.component';
import { WayfIdpListComponent } from './components/idp-list/wayf-idp-list.component';
import { WayfRecentIdpsComponent } from './components/recent-idps/wayf-recent-idps.component';

/**
 * Main WAYF (Where Are You From) component — standalone IdP discovery widget.
 *
 * Supports two usage modes:
 *
 * 1. **SAMLDS Discovery Service** — reads entityID, return, returnIDParam,
 *    isPassive from query params and redirects after IdP selection.
 *
 * 2. **Embedded IdP picker** — emits `idpSelected` / `localAuthSelected` /
 *    `cancelled` events for the host application to handle.
 *
 * All IdP data, endpoints, and branding are configurable via inputs
 * or the WAYF_CONFIG injection token — no hardcoded values.
 */
@Component({
  selector: 'ds-clarin-wayf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WayfSearchBarComponent,
    WayfIdpListComponent,
    WayfRecentIdpsComponent,
  ],
  providers: [
    WayfFeedService,
    WayfPersistenceService,
    WayfSearchService,
  ],
  templateUrl: './clarin-wayf.component.html',
  styles: [`
    .wayf-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 1rem;
    }
    .wayf-container__title {
      text-align: center;
    }
  `],
})
export class ClarinWayfComponent implements OnInit {
  protected readonly feedService = inject(WayfFeedService);
  protected readonly persistence = inject(WayfPersistenceService);
  private readonly searchService = inject(WayfSearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly wayfConfig = inject(WAYF_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  // ── Required inputs ──────────────────────────────────────────

  /** URL to the JSON IdP feed. */
  readonly feedUrl = input<string>('');

  /** This Service Provider's SAML entityID. */
  readonly spEntityId = input<string>('');

  /** Shibboleth SP login URL for redirect after IdP selection. */
  readonly loginEndpoint = input<string>('');

  // ── Recommended inputs ───────────────────────────────────────

  /** Branding title shown in the overlay header. */
  readonly serviceName = input<string>('');

  /** Always-visible priority IdP entries. */
  readonly pinnedIdps = input<IdentityProvider[]>([]);

  /** Show a "Local authentication" fallback option. */
  readonly localAuthEnabled = input<boolean | undefined>(undefined);

  /** Guidance text for "Can't find my provider". */
  readonly helpText = input<string>('');

  // ── Optional inputs ──────────────────────────────────────────

  /** Enable the search bar. */
  readonly enableSearch = input<boolean | undefined>(undefined);

  /** Maximum number of results shown in the list. */
  readonly maxResults = input<number | undefined>(undefined);

  /** Remember the last-used IdP in localStorage. */
  readonly rememberSelection = input<boolean | undefined>(undefined);

  // ── Outputs ──────────────────────────────────────────────────

  /** Emits the selected IdP entry. */
  readonly idpSelected = output<IdentityProvider>();

  /** Emits when the user picks local authentication. */
  readonly localAuthSelected = output<void>();

  /** Emits when the user closes without choosing. */
  readonly cancelled = output<void>();

  // ── Internal state ───────────────────────────────────────────

  readonly searchQuery = signal('');
  /** Current display cap — grows by pageSize on each "Show more" click. */
  readonly displayLimit = signal(0);
  /** SAMLDS params parsed from the URL. */
  readonly samldsParams = signal<SamldsParams>({
    entityID: null,
    return: null,
    returnIDParam: 'entityID',
    isPassive: false,
  });

  // ── Resolved config (input → WAYF_CONFIG → default) ─────────

  /**
   * Resolve a config value with priority: input → injected token → built-in default.
   * Empty string and undefined are treated as "not set" for inputs.
   */
  private resolve<K extends keyof WayfConfig>(
    inputValue: WayfConfig[K] | '' | undefined,
    key: K,
  ): WayfConfig[K] {
    if (inputValue !== '' && inputValue !== undefined) { return inputValue as WayfConfig[K]; }
    if (key in this.wayfConfig) { return this.wayfConfig[key]; }
    return WAYF_DEFAULTS[key as keyof typeof WAYF_DEFAULTS] as WayfConfig[K];
  }

  readonly resolvedServiceName = computed(() => this.resolve(this.serviceName(), 'serviceName'));
  readonly resolvedEnableSearch = computed(() => this.resolve(this.enableSearch(), 'enableSearch'));
  readonly resolvedLocalAuthEnabled = computed(() => this.resolve(this.localAuthEnabled(), 'localAuthEnabled'));
  readonly resolvedHelpText = computed(() => this.resolve(this.helpText(), 'helpText'));
  readonly resolvedMaxResults = computed(() => this.resolve(this.maxResults(), 'maxResults'));

  /** Resolved pinned IdPs: from input first, then from injected config. */
  private readonly resolvedPinnedIdps = computed<IdentityProvider[]>(() => {
    const fromInput = this.pinnedIdps();
    return fromInput.length > 0 ? fromInput : this.wayfConfig.pinnedIdps ?? [];
  });

  /** Set of pinned IdP entityIDs for badge display. */
  readonly pinnedEntityIdSet = computed(() =>
    new Set<string>(this.resolvedPinnedIdps().map(p => p.entityID)),
  );

  /** EntityID of the first pinned IdP (for the shortcut card). */
  readonly pinnedEntityId = computed<string | null>(() => {
    const pinned = this.resolvedPinnedIdps();
    return pinned.length > 0 ? pinned[0].entityID : null;
  });

  /** All entries: feed entries + pinned entries (deduplicated). */
  readonly allDisplayEntries = computed(() => {
    const feed = this.feedService.entries();
    const pinned = this.resolvedPinnedIdps();
    const feedIds = new Set(feed.map(e => e.entityID));
    const extra = pinned.filter(p => !feedIds.has(p.entityID));
    return [...extra, ...feed];
  });

  /** Entries filtered by search query. */
  readonly filteredEntries = computed(() =>
    this.searchService.filterEntries(
      this.allDisplayEntries(),
      this.searchQuery(),
    ),
  );

  /** Visible entries, capped at displayLimit. */
  readonly displayEntries = computed(() => {
    const filtered = this.filteredEntries();
    const limit = this.displayLimit();
    return limit > 0 ? filtered.slice(0, limit) : filtered;
  });

  private readonly searchBar = viewChild(WayfSearchBarComponent);
  private readonly idpList = viewChild(WayfIdpListComponent);

  private get pageSize(): number {
    const m = this.resolvedMaxResults();
    return m > 0 ? m : 25;
  }

  ngOnInit(): void {
    this.displayLimit.set(this.pageSize);
    this.parseSamldsParams();
    this.loadFeed();
  }

  onQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.displayLimit.set(this.pageSize);
    this.idpList()?.resetActive();
  }

  showMore(): void {
    this.displayLimit.update(n => n + this.pageSize);
  }

  onIdpSelected(entry: IdentityProvider): void {
    const remember = this.resolve(this.rememberSelection(), 'rememberSelection');
    if (remember) {
      this.persistence.selectIdp(entry.entityID);
    }

    this.idpSelected.emit(entry);

    const params = this.samldsParams();
    if (params.return && isPlatformBrowser(this.platformId)) {
      const separator = params.return.includes('?') ? '&' : '?';
      const redirectUrl = `${params.return}${separator}${encodeURIComponent(params.returnIDParam)}=${encodeURIComponent(entry.entityID)}`;
      this.redirect(redirectUrl);
    }
  }

  onArrowDown(): void {
    this.idpList()?.activeIndex.set(0);
  }

  onFocusSearch(): void {
    this.searchBar()?.focusInput();
  }

  onEscaped(): void {
    this.searchQuery.set('');
  }

  private parseSamldsParams(): void {
    const queryParams = this.route.snapshot.queryParams;
    const rawReturn = queryParams['return'] ?? null;
    this.samldsParams.set({
      entityID: queryParams['entityID'] ?? null,
      return: this.sanitizeReturnUrl(rawReturn),
      returnIDParam: queryParams['returnIDParam'] ?? 'entityID',
      isPassive: queryParams['isPassive'] === 'true',
    });

    if (this.samldsParams().isPassive && isPlatformBrowser(this.platformId)) {
      const lastIdp = this.persistence.lastIdp();
      if (lastIdp && this.samldsParams().return) {
        const params = this.samldsParams();
        const separator = params.return!.includes('?') ? '&' : '?';
        const redirectUrl = `${params.return}${separator}${encodeURIComponent(params.returnIDParam)}=${encodeURIComponent(lastIdp)}`;
        this.redirect(redirectUrl);
      }
    }
  }

  /** Perform a full-page redirect. Extracted for testability. */
  protected redirect(url: string): void {
    window.location.href = url;
  }

  /**
   * Validate a SAMLDS return URL to prevent open-redirect attacks.
   * Only allows http: and https: schemes; rejects everything else.
   */
  private sanitizeReturnUrl(url: string | null): string | null {
    if (!url) { return null; }
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return url;
      }
    } catch {
      // Malformed URL — fall through to reject
    }
    return null;
  }

  private loadFeed(): void {
    const url = this.resolve(this.feedUrl(), 'feedUrl');
    if (!url) { return; }
    // Reject non-HTTP(S) feed URLs (e.g. javascript:, data:)
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return;
      }
    } catch {
      return;
    }
    const loc = 'en';
    this.feedService.loadFeed(url, loc);
  }
}
