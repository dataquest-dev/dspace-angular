import { Injectable } from '@angular/core';
import {
  combineLatest,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
  shareReplay,
} from 'rxjs/operators';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import { MetadataLink } from './make-links';

/**
 * Configuration property names exposed by the DSpace backend (via rest.properties.exposed).
 */
const RESOLVER_PROPERTIES = {
  doi: 'identifier.doi.resolver',
  scopus: 'identifier.scopus.resolver',
  wos: 'identifier.wos.resolver',
  openPolicyFinder: 'identifier.sherpa.resolver',
  jcr: 'identifier.jcr.resolver',
};

/**
 * Resolver base URLs loaded from the backend.
 * A null value means the property is not configured — the corresponding
 * metadata link will simply not be rendered.
 */
interface ResolverConfig {
  doi: string | null;
  scopus: string | null;
  wos: string | null;
  openPolicyFinder: string | null;
  jcr: string | null;
}

const HTTP_URL_PATTERN = /^https?:\/\//i;

/**
 * Service that builds hyperlinks for specific metadata fields.
 *
 * Resolver base URLs are fetched from the DSpace backend configuration
 * endpoint (/api/config/properties/{name}) and cached for the lifetime
 * of the service (singleton).
 */
@Injectable({ providedIn: 'root' })
export class MetadataLinkService {

  /** Cached observable of resolver configuration from the backend. */
  private resolvers$: Observable<ResolverConfig>;

  constructor(private configService: ConfigurationDataService) {
    this.resolvers$ = this.loadResolvers();
  }

  /**
   * Fetch all resolver base URLs from the backend in parallel.
   * When a property is not configured, the value is null and the
   * corresponding metadata link will not be rendered.
   * The result is shared and replayed so it is only fetched once.
   */
  private loadResolvers(): Observable<ResolverConfig> {
    const fetch = (key: keyof typeof RESOLVER_PROPERTIES): Observable<string | null> =>
      this.configService.findByPropertyName(RESOLVER_PROPERTIES[key]).pipe(
        getFirstCompletedRemoteData(),
        map(rd => {
          if (rd.hasSucceeded && rd.payload?.values?.length > 0) {
            let url = rd.payload.values[0];
            // The DOI resolver from backend may lack the trailing slash
            if (key === 'doi' && !url.endsWith('/')) {
              url += '/';
            }
            return url;
          }
          return null;
        }),
        catchError(() => of(null)),
      );

    return combineLatest({
      doi: fetch('doi'),
      scopus: fetch('scopus'),
      wos: fetch('wos'),
      openPolicyFinder: fetch('openPolicyFinder'),
      jcr: fetch('jcr'),
    }).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /**
   * For a given metadata field and value, return an Observable that emits the
   * appropriate hyperlink descriptor, or null when no special link applies.
   */
  getMetadataLink(key: string, value: string | null | undefined): Observable<MetadataLink | null> {
    const trimmed = value?.trim();
    if (!trimmed) {
      return of(null);
    }

    // dc.rights.uri — value is already a URL
    if (key === 'dc.rights.uri') {
      return HTTP_URL_PATTERN.test(trimmed)
        ? of({ external: true, href: trimmed })
        : of(null);
    }

    // DOI: bare identifiers → resolver; full URLs fall through to makeLinks
    if (key === 'local.identifier.doi') {
      if (HTTP_URL_PATTERN.test(trimmed)) {
        return of(null);
      }
      return this.resolvers$.pipe(
        map(r => r.doi ? { external: true, href: `${r.doi}${encodeURIComponent(trimmed)}` } : null),
      );
    }

    // Scopus
    if (key === 'local.identifier.scopus') {
      return this.resolvers$.pipe(
        map(r => r.scopus ? { external: true, href: `${r.scopus}${encodeURIComponent(trimmed)}` } : null),
      );
    }

    // WOS
    if (key === 'local.identifier.wos') {
      return this.resolvers$.pipe(
        map(r => r.wos ? { external: true, href: `${r.wos}${encodeURIComponent(trimmed)}` } : null),
      );
    }

    return of(null);
  }

  /**
   * For ISSN fields (dc.identifier.issn, local.identifier.e-issn), return
   * extra links to Open policy finder and JCR displayed next to the plain ISSN value.
   *
   * Returns an empty array for non-ISSN fields.
   */
  getExtraLinks(key: string, value: string | null | undefined): Observable<{ label: string; href: string }[]> {
    const trimmed = value?.trim();
    if (!trimmed) {
      return of([]);
    }

    if (key === 'dc.identifier.issn' || key === 'local.identifier.e-issn') {
      return this.resolvers$.pipe(
        map(r => [
          ...(r.openPolicyFinder ? [{ label: 'Open policy finder', href: `${r.openPolicyFinder}${encodeURIComponent(trimmed)}` }] : []),
          ...(r.jcr ? [{ label: 'JCR', href: `${r.jcr}${encodeURIComponent(trimmed)}` }] : []),
        ]),
      );
    }

    return of([]);
  }
}
