import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  Optional,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
} from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';

import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { CookieService } from '../../../../../core/services/cookie.service';
import { getFirstCompletedRemoteData } from '../../../../../core/shared/operators';
import { OrejimeService } from '../../../../../shared/cookies/orejime.service';
import { CITACE_PRO_OREJIME_KEY } from '../../../../../shared/cookies/orejime-configuration';

@Component({
  selector: 'ds-item-page-citation-field',
  templateUrl: './item-page-citation.component.html',
  imports: [
    CommonModule,
    TranslateModule,
  ],
})
export class ItemPageCitationFieldComponent implements OnInit {
  @Input() handle: string;

  citaceProStatus$ = new BehaviorSubject<boolean>(false);
  citaceProURL$ = new BehaviorSubject<SafeResourceUrl | null>(null);

  /**
   * Whether the visitor has consented to loading the third-party CitacePRO iframe.
   * Until they have, the widget must not be rendered at all — an iframe in the DOM is already
   * a request to citacepro.com.
   */
  hasConsent$: Observable<boolean>;

  constructor(
    private sanitizer: DomSanitizer,
    private configService: ConfigurationDataService,
    @Optional() private orejimeService: OrejimeService,
    @Optional() private cookieService: CookieService,
  ) {}


  ngOnInit() {
    const citaceProUrl$ = this.configService.findByPropertyName('citace.pro.url').pipe(
      getFirstCompletedRemoteData(),
      catchError(() => of(null)),
    );
    const universityUsingDspace$ = this.configService.findByPropertyName('citace.pro.university').pipe(
      getFirstCompletedRemoteData(),
      catchError(() => of(null)),
    );
    const citaceProAllowed$ = this.configService.findByPropertyName('citace.pro.allowed').pipe(
      getFirstCompletedRemoteData(),
      catchError(() => of(null)),
    );

    this.hasConsent$ = this.watchConsent();

    combineLatest([citaceProUrl$, universityUsingDspace$, citaceProAllowed$]).pipe(
      take(1),
    ).subscribe(([citaceProUrlData, universityData, citaceProAllowedData]) => {
      const citaceProBaseUrl = citaceProUrlData?.payload?.values?.[0];
      const universityUsingDspace = universityData?.payload?.values?.[0];
      this.citaceProURL$.next(this.makeCitaceProURL(citaceProBaseUrl, universityUsingDspace));

      const citaceProAllowed = citaceProAllowedData?.payload?.values?.[0];
      this.citaceProStatus$.next(citaceProAllowed === 'true');
    });
  }

  /**
   * Opens the cookie preferences dialog so the visitor can grant consent from where the widget
   * would have been, instead of having to hunt for the link in the footer.
   */
  showCookieSettings(): void {
    this.orejimeService?.showSettings();
  }

  makeCitaceProURL(
    citaceProBaseUrl: string,
    universityUsingDspace: string,
  ): SafeResourceUrl | null {
    if (!citaceProBaseUrl || !universityUsingDspace || !this.handle) {
      return null;
    }
    // Only http(s) bases may bypass Angular's resource-URL sanitization;
    // anything else (javascript:, data:, ...) must not be trusted as iframe src.
    if (!/^https?:\/\//i.test(citaceProBaseUrl)) {
      return null;
    }
    const url = `${citaceProBaseUrl}:${universityUsingDspace}:${this.handle}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Re-reads the stored consent whenever a cookie changes, so accepting in the consent dialog
   * reveals the widget without a page reload. Without the OrejimeService (server-side rendering)
   * we cannot know the visitor's choice, so we withhold consent.
   */
  private watchConsent(): Observable<boolean> {
    if (!this.orejimeService) {
      return of(false);
    }

    const cookieChanges$ = this.cookieService?.cookies$ ?? of(null);

    return cookieChanges$.pipe(
      startWith(null),
      switchMap(() => this.orejimeService.getSavedPreferences()),
      map((preferences: any) => preferences?.[CITACE_PRO_OREJIME_KEY] === true),
      catchError(() => of(false)),
    );
  }
}
