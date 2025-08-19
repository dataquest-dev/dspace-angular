import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuService } from '../shared/menu/menu.service';
import { MenuID } from '../shared/menu/menu-id.model';
import { HostWindowService, WidthCategory } from '../shared/host-window.service';
import { LocaleService } from '../core/locale/locale.service';

/**
 * Represents the header with the logo and simple navigation
 */
@Component({
  selector: 'ds-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
})
export class HeaderComponent implements OnInit {
  /**
   * Whether user is authenticated.
   * @type {Observable<string>}
   */
  public isAuthenticated: Observable<boolean>;
  public isMobile$: Observable<boolean>;

  public logoSrc: string;

  menuID = MenuID.PUBLIC;
  maxMobileWidth = WidthCategory.SM;

  constructor(
    protected menuService: MenuService,
    protected windowService: HostWindowService,
    private localeService: LocaleService,
  ) {
  }

  ngOnInit(): void {
    this.isMobile$ = this.windowService.isUpTo(this.maxMobileWidth);
    this.setLogo();
  }

  public toggleNavbar(): void {
    this.menuService.toggleMenu(this.menuID);
  }

  /**
  * Returns the current language code from the locale service
  * @returns {string} The current language code
  */
  getLangCode(): string {
    return this.localeService.getCurrentLanguageCode();
  }

  /**
  * Returns the current language code only if it's Czech ('cs'), otherwise returns an empty string
  * @returns {string} The language code if Czech, empty string otherwise
  */
  getLangCodeIfCzech(): string {
    return this.localeService.getCurrentLanguageCode() === 'cs' ? 'cs' : '';
  }

  /**
  * Translates English slugs to their Czech equivalents when the current language is Czech
  * @param {string} slug - The English slug to translate
  * @returns {string} The translated slug if in Czech, the original slug if in English, or empty string if translation not found
  */
  translateSlug(slug: string): string {
    const currentLang = this.localeService.getCurrentLanguageCode();
    if (currentLang === 'en') {
      return slug;
    }

    const translations = {
      'partners': this.getLangCodeIfCzech() + '/' + 'partneri',
      'integration': this.getLangCodeIfCzech() + '/' + 'integrace',
      'partnership': this.getLangCodeIfCzech() + '/' + 'partnerstvi',
      'services': 'sluzby'
    };

    return translations[slug] || '';
  }

  /**
   * Sets the logo source based on the current language code
   */
  setLogo() {
    this.logoSrc = this.localeService.getCurrentLanguageCode() === 'cs'
      ? 'assets/images/vsb-cs-logo-w.svg'
      : 'assets/images/vsb-en-logo-w.svg';
  }
}
