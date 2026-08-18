import {
  Component,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { ClarinNavbarTopComponent } from 'src/app/clarin-navbar-top/clarin-navbar-top.component';

import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ImpersonateNavbarComponent } from '../../../../app/shared/impersonate-navbar/impersonate-navbar.component';

/**
 * Represents the LINDAT/CLARIAH-CZ header: the CLARIN top bar (language flags + AAI/DiscoJuice
 * sign-on) followed by the dark lindat-common navigation bar with the LINDAT/CLARIAH-CZ branding
 * and the main site menu. Ported from the LINDAT v7 production theme
 * (lindat-merge-dtq-dev-2025-03-07).
 */
@Component({
  selector: 'ds-themed-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
  imports: [
    ClarinNavbarTopComponent,
    ImpersonateNavbarComponent,
    RouterLink,
    TranslateModule,
  ],
})
export class HeaderComponent extends BaseComponent {

  private readonly translate = inject(TranslateService);

  /**
   * The UI language normalized to the two languages the LINDAT/CLARIAH-CZ portal supports:
   * 'cs' for Czech, 'en' for anything else. Read synchronously from TranslateService so it can be
   * used directly in the template href bindings (in v9 LocaleService#getCurrentLanguageCode is
   * asynchronous). Normalizing keeps the portal links well-formed even when the UI is shown in
   * another active language (e.g. a browser-negotiated 'de'/'fr'), which would otherwise produce
   * broken targets such as '/de/sluzby'; it also guarantees a non-empty value before a language is set.
   */
  getLangCode(): string {
    return this.translate.currentLang === 'cs' ? 'cs' : 'en';
  }

  /**
   * Returns the current language code only if it's Czech ('cs'), otherwise an empty string.
   * Used to prefix the LINDAT portal links with the locale segment ('' for English, 'cs' for Czech).
   */
  getLangCodeIfCzech(): string {
    return this.getLangCode() === 'cs' ? 'cs' : '';
  }

  /**
   * Translates the English portal slug to its Czech equivalent when the current language is Czech.
   * Returns the original slug in English, or an empty string when no translation is known.
   */
  translateSlug(slug: string): string {
    if (this.getLangCode() === 'en') {
      return slug;
    }

    const translations = {
      'partners': this.getLangCodeIfCzech() + '/' + 'partneri',
      'integration': this.getLangCodeIfCzech() + '/' + 'integrace',
      'partnership': this.getLangCodeIfCzech() + '/' + 'partnerstvi',
      'services': 'sluzby',
    };

    return translations[slug] || '';
  }
}
