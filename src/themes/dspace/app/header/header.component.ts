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

  // UI language for the LINDAT portal links, normalized to the two it supports: 'cs' for Czech, 'en' otherwise.
  getLangCode(): string {
    return this.translate.currentLang === 'cs' ? 'cs' : 'en';
  }

  // Locale segment for portal links: 'cs' in Czech, '' in English.
  getLangCodeIfCzech(): string {
    return this.getLangCode() === 'cs' ? 'cs' : '';
  }

  // Czech portal slug for an English slug; English keeps the original.
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
