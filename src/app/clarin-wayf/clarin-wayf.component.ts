import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IdentityProvider } from './models/idp-entry.model';
import { SamldsParams, WayfConfig, WAYF_CONFIG, WAYF_DEFAULTS } from './wayf.config';
import { WayfFeedService } from './services/feed.service';
import { WayfI18nService } from './services/i18n.service';
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
  template: `
    <div class="wayf-container">
      @if (resolvedServiceName()) {
        <h2 class="wayf-container__title h5 mb-1">{{ resolvedServiceName() }}</h2>
      }
      <p class="wayf-container__subtitle text-muted text-center mb-3">{{ resolvedSubtitle() }}</p>

      @if (feedService.loading()) {
        <div class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ i18n.t('wayf.loading') }}</span>
          </div>
          <div class="mt-2 text-muted">{{ i18n.t('wayf.loading') }}</div>
        </div>
      }

      @if (feedService.error()) {
        <div class="alert alert-danger" role="alert">
          {{ i18n.t('wayf.error.feed') }}
        </div>
      }

      @if (!feedService.loading() && !feedService.error()) {
        <!-- Quick-select shortcut (pinned or last-used) -->
        <ds-wayf-recent-idps
          [allEntries]="allDisplayEntries()"
          [lastIdpEntityId]="persistence.lastIdp()"
          [defaultEntityId]="pinnedEntityId()"
          (idpSelected)="onIdpSelected($event)"
        />

        <!-- Search bar -->
        @if (resolvedEnableSearch()) {
          <ds-wayf-search-bar
            [value]="searchQuery()"
            [hasResults]="filteredEntries().length > 0"
            (queryChange)="onQueryChange($event)"
            (arrowDown)="onArrowDown()"
            (escaped)="onEscaped()"
          />

          @if (searchQuery().length > 0) {
            <div class="wayf-container__count small text-muted mb-2">
              {{ i18n.t('wayf.search.results', { count: filteredEntries().length }) }}
            </div>
          }
        }

        <!-- IdP list -->
        <ds-wayf-idp-list
          [entries]="displayEntries()"
          [loading]="feedService.loading()"
          [hubEntityIds]="pinnedEntityIdSet()"
          (idpSelected)="onIdpSelected($event)"
          (focusSearch)="onFocusSearch()"
        />

        <!-- Local auth fallback -->
        @if (resolvedLocalAuthEnabled()) {
          <div class="wayf-container__local-auth mt-3 text-center">
            <button
              class="btn btn-outline-secondary btn-sm"
              (click)="localAuthSelected.emit()">
              {{ i18n.t('wayf.local-auth') }}
            </button>
          </div>
        }

        <!-- Help text -->
        @if (resolvedHelpText()) {
          <div class="wayf-container__help mt-3 small text-muted text-center">
            {{ resolvedHelpText() }}
          </div>
        }
      }
    </div>
  `,
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
  protected readonly i18n = inject(WayfI18nService);
  protected readonly feedService = inject(WayfFeedService);
  protected readonly persistence = inject(WayfPersistenceService);
  private readonly searchService = inject(WayfSearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly wayfConfig = inject(WAYF_CONFIG);

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

  /** Subtitle text shown below the title. */
  readonly subtitle = input<string>('');

  /** UI locale / language code. */
  readonly locale = input<string>('');

  // ── Outputs ──────────────────────────────────────────────────

  /** Emits the selected IdP entry. */
  readonly idpSelected = output<IdentityProvider>();

  /** Emits when the user picks local authentication. */
  readonly localAuthSelected = output<void>();

  /** Emits when the user closes without choosing. */
  readonly cancelled = output<void>();

  // ── Internal state ───────────────────────────────────────────

  readonly searchQuery = signal('');

  /** SAMLDS params parsed from the URL. */
  readonly samldsParams = signal<SamldsParams>({
    entityID: null,
    return: null,
    returnIDParam: 'entityID',
    isPassive: false,
  });

  // ── Resolved config (input → WAYF_CONFIG → default) ─────────

  private resolve<K extends keyof WayfConfig>(
    inputValue: any,
    key: K,
  ) {
    if (inputValue !== '' && inputValue !== undefined) { return inputValue; }
    return (this.wayfConfig as any)[key] ?? (WAYF_DEFAULTS as any)[key];
  }

  readonly resolvedServiceName = computed(() => this.resolve(this.serviceName(), 'serviceName'));
  readonly resolvedSubtitle = computed(() => this.resolve(this.subtitle(), 'subtitle'));
  readonly resolvedEnableSearch = computed(() => this.resolve(this.enableSearch(), 'enableSearch'));
  readonly resolvedLocalAuthEnabled = computed(() => this.resolve(this.localAuthEnabled(), 'localAuthEnabled'));
  readonly resolvedHelpText = computed(() => this.resolve(this.helpText(), 'helpText'));
  readonly resolvedMaxResults = computed(() => this.resolve(this.maxResults(), 'maxResults') as number);
  readonly resolvedLocale = computed(() => this.resolve(this.locale(), 'locale') as string);

  /** Set of pinned IdP entityIDs for badge display. */
  readonly pinnedEntityIdSet = computed(() => {
    const pinned = this.pinnedIdps().length > 0
      ? this.pinnedIdps()
      : (this.wayfConfig as any).pinnedIdps ?? [];
    return new Set<string>(pinned.map((p: IdentityProvider) => p.entityID));
  });

  /** EntityID of the first pinned IdP (for the shortcut card). */
  readonly pinnedEntityId = computed<string | null>(() => {
    const pinned = this.pinnedIdps().length > 0
      ? this.pinnedIdps()
      : (this.wayfConfig as any).pinnedIdps ?? [];
    return pinned.length > 0 ? pinned[0].entityID : null;
  });

  /** All entries: feed entries + pinned entries (deduplicated). */
  readonly allDisplayEntries = computed(() => {
    const feed = this.feedService.entries();
    const pinned = this.pinnedIdps().length > 0
      ? this.pinnedIdps()
      : (this.wayfConfig as any).pinnedIdps ?? [];
    const feedIds = new Set(feed.map(e => e.entityID));
    const extra = pinned.filter((p: IdentityProvider) => !feedIds.has(p.entityID));
    return [...extra, ...feed];
  });

  /** Entries filtered by search query. */
  readonly filteredEntries = computed(() =>
    this.searchService.filterEntries(
      this.allDisplayEntries(),
      this.searchQuery(),
    ),
  );

  /** Final display order with maxResults limit. */
  readonly displayEntries = computed(() => {
    const filtered = this.filteredEntries();
    const max = this.resolvedMaxResults();
    return max > 0 ? filtered.slice(0, max) : filtered;
  });

  private readonly searchBar = viewChild(WayfSearchBarComponent);
  private readonly idpList = viewChild(WayfIdpListComponent);

  constructor() {
    // Sync locale to i18n service
    effect(() => {
      const loc = this.resolvedLocale();
      if (loc) {
        this.i18n.setLang(loc);
      }
    });
  }

  ngOnInit(): void {
    this.parseSamldsParams();
    this.loadFeed();
  }

  onQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.idpList()?.resetActive();
  }

  onIdpSelected(entry: IdentityProvider): void {
    const remember = this.resolve(this.rememberSelection(), 'rememberSelection');
    if (remember) {
      this.persistence.selectIdp(entry.entityID);
    }

    this.idpSelected.emit(entry);

    const params = this.samldsParams();
    if (params.return) {
      const separator = params.return.includes('?') ? '&' : '?';
      const redirectUrl = `${params.return}${separator}${encodeURIComponent(params.returnIDParam)}=${encodeURIComponent(entry.entityID)}`;
      window.location.href = redirectUrl;
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
    this.samldsParams.set({
      entityID: queryParams['entityID'] ?? null,
      return: queryParams['return'] ?? null,
      returnIDParam: queryParams['returnIDParam'] ?? 'entityID',
      isPassive: queryParams['isPassive'] === 'true',
    });

    if (this.samldsParams().isPassive) {
      const lastIdp = this.persistence.lastIdp();
      if (lastIdp && this.samldsParams().return) {
        const params = this.samldsParams();
        const separator = params.return!.includes('?') ? '&' : '?';
        const redirectUrl = `${params.return}${separator}${encodeURIComponent(params.returnIDParam)}=${encodeURIComponent(lastIdp)}`;
        window.location.href = redirectUrl;
      }
    }
  }

  private loadFeed(): void {
    const url = this.resolve(this.feedUrl(), 'feedUrl');
    if (!url) { return; }
    const loc = this.resolvedLocale();
    this.feedService.loadFeed(url, loc);
  }
}
