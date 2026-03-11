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

import { IdpEntry } from './models/idp-entry.model';
import { SamldsParams } from './models/wayf-config.model';
import { WayfFeedService } from './services/feed.service';
import { WayfI18nService } from './services/i18n.service';
import { WayfPersistenceService } from './services/persistence.service';
import { WayfSearchService } from './services/search.service';
import { WayfSearchBarComponent } from './components/search-bar/wayf-search-bar.component';
import { WayfIdpListComponent } from './components/idp-list/wayf-idp-list.component';
import { WayfRecentIdpsComponent } from './components/recent-idps/wayf-recent-idps.component';

/**
 * Main CLARIN WAYF (Where Are You From) component.
 *
 * Implements the SAML Discovery Service protocol:
 * - Reads entityID, return, returnIDParam, isPassive from query params
 * - Lets the user search and select an IdP
 * - Redirects to: {return}?{returnIDParam}={selectedIdP.entityID}
 *
 * Can also be used standalone (without SAMLDS params) as an IdP picker
 * that emits the selected IdP.
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
      <h2 class="wayf-container__title h5 mb-3">{{ i18n.t('wayf.title') }}</h2>

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
        <!-- Recent / Continue-with shortcut -->
        <ds-wayf-recent-idps
          [allEntries]="feedService.entries()"
          [lastIdpEntityId]="persistence.lastIdp()"
          [recentIdpEntityIds]="persistence.recentIdps()"
          (idpSelected)="onIdpSelected($event)"
        />

        <!-- Search bar -->
        <ds-wayf-search-bar
          [value]="searchQuery()"
          [hasResults]="filteredEntries().length > 0"
          (queryChange)="onQueryChange($event)"
          (arrowDown)="onArrowDown()"
          (escaped)="onEscaped()"
        />

        <!-- Result count -->
        @if (searchQuery().length > 0) {
          <div class="wayf-container__count small text-muted mb-2">
            {{ i18n.t('wayf.search.results', { count: filteredEntries().length }) }}
          </div>
        }

        <!-- IdP list -->
        <ds-wayf-idp-list
          [entries]="displayEntries()"
          [loading]="feedService.loading()"
          [hubEntityIds]="hubEntityIdSet()"
          (idpSelected)="onIdpSelected($event)"
          (focusSearch)="onFocusSearch()"
        />
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

  // --- Inputs (configurable via route data or parent binding) ---

  /** URL to the IdP JSON feed. */
  readonly feedUrl = input<string>('');

  /** Tag to filter IdPs by. */
  readonly categoryFilter = input<string | null>(null);

  /** JSON-stringified array of proxy/hub entityIDs. */
  readonly proxyEntities = input<string>('[]');

  /** Language override. */
  readonly lang = input<string>('');

  /** Emits the selected IdP entry (for embedded/overlay usage). */
  readonly idpSelected = output<IdpEntry>();

  // --- Internal state ---

  readonly searchQuery = signal('');

  /** SAMLDS params parsed from the URL. */
  readonly samldsParams = signal<SamldsParams>({
    entityID: null,
    return: null,
    returnIDParam: 'entityID',
    isPassive: false,
  });

  /** Parsed set of proxy entity IDs. */
  readonly hubEntityIdSet = computed(() => {
    try {
      const parsed: unknown = JSON.parse(this.proxyEntities());
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      // Invalid JSON
    }
    return new Set<string>();
  });

  /** Entries filtered by search query. */
  readonly filteredEntries = computed(() =>
    this.searchService.filterEntries(
      this.feedService.entries(),
      this.searchQuery(),
      this.i18n.lang(),
    ),
  );

  /** Final display order: hub entries pinned first, then filtered results. */
  readonly displayEntries = computed(() => {
    const filtered = this.filteredEntries();
    const hubs = this.hubEntityIdSet();

    if (hubs.size === 0) {
      return filtered;
    }

    const pinnedHub = filtered.filter(e => hubs.has(e.entityID));
    const rest = filtered.filter(e => !hubs.has(e.entityID));
    return [...pinnedHub, ...rest];
  });

  private readonly searchBar = viewChild(WayfSearchBarComponent);
  private readonly idpList = viewChild(WayfIdpListComponent);

  constructor() {
    // Set language when input changes
    effect(() => {
      const langInput = this.lang();
      if (langInput) {
        this.i18n.setLang(langInput);
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

  onIdpSelected(entry: IdpEntry): void {
    this.persistence.selectIdp(entry.entityID);

    // Always emit so parent components (e.g. login overlay) can handle redirect
    this.idpSelected.emit(entry);

    const params = this.samldsParams();
    if (params.return) {
      // SAMLDS redirect
      const separator = params.return.includes('?') ? '&' : '?';
      const redirectUrl = `${params.return}${separator}${encodeURIComponent(params.returnIDParam)}=${encodeURIComponent(entry.entityID)}`;
      window.location.href = redirectUrl;
    }
    // If no SAMLDS return URL, the selection is just persisted.
    // A parent component or DSpace can read it from localStorage.
  }

  onArrowDown(): void {
    // Move focus from search bar into the list
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

    // isPassive: if we have a last-used IdP, auto-select without UI
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
    // Prefer input binding, fallback to ?feedUrl= query param, then default mock feed
    const url = this.feedUrl()
      || this.route.snapshot.queryParams['feedUrl']
      || 'assets/mock/wayf-feed.json';
    this.feedService.loadFeed(url, this.categoryFilter());
  }
}
