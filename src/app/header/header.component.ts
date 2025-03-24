import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuService } from '../shared/menu/menu.service';
import { MenuID } from '../shared/menu/menu-id.model';
import { HostWindowService } from '../shared/host-window.service';
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
  public isXsOrSm$: Observable<boolean>;
  menuID = MenuID.PUBLIC;

  constructor(
    protected menuService: MenuService,
    protected windowService: HostWindowService,
    private localeService: LocaleService,
  ) {
  }

  ngOnInit(): void {
    this.isXsOrSm$ = this.windowService.isXsOrSm();
  }

  public toggleNavbar(): void {
    this.menuService.toggleMenu(this.menuID);
  }

  getLangCode(): string {
    return this.localeService.getCurrentLanguageCode();
  }

  getLangCodeIfCzech(): string {
    return this.localeService.getCurrentLanguageCode() === 'cs' ? this.localeService.getCurrentLanguageCode() : '';
  }

  translateSlug(slug: string): string {
    if (this.localeService.getCurrentLanguageCode() === 'en') {
      return slug;
    }

    const translations = {
      'partners': 'partneri',
      'integration': 'integrace',
      'partnership': 'partnerstvi',
      'services': 'sluzby'
    };

    return translations[slug] || '';
  }
}
