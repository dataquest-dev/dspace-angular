import { AsyncPipe } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ThemedSearchNavbarComponent } from '../search-navbar/themed-search-navbar.component';
import { ThemedAuthNavMenuComponent } from '../shared/auth-nav-menu/themed-auth-nav-menu.component';
import {
  HostWindowService,
  WidthCategory,
} from '../shared/host-window.service';
import { ImpersonateNavbarComponent } from '../shared/impersonate-navbar/impersonate-navbar.component';
import { ThemedLangSwitchComponent } from '../shared/lang-switch/themed-lang-switch.component';
import { MenuService } from '../shared/menu/menu.service';
import { MenuID } from '../shared/menu/menu-id.model';
import { ContextHelpToggleComponent } from './context-help-toggle/context-help-toggle.component';

/**
 * Represents the header with the logo and simple navigation
 */
@Component({
  selector: 'ds-base-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
  imports: [
    AsyncPipe,
    ContextHelpToggleComponent,
    ImpersonateNavbarComponent,
    NgbDropdownModule,
    RouterLink,
    ThemedAuthNavMenuComponent,
    ThemedLangSwitchComponent,
    ThemedSearchNavbarComponent,
    TranslateModule,
  ],
})
export class HeaderComponent implements OnInit {
  /**
   * Whether user is authenticated.
   * @type {Observable<string>}
   */
  public isAuthenticated: Observable<boolean>;
  public isMobile$: Observable<boolean>;

  menuID = MenuID.PUBLIC;
  maxMobileWidth = WidthCategory.SM;

  private readonly translate = inject(TranslateService);

  constructor(
    protected menuService: MenuService,
    protected windowService: HostWindowService,
  ) {
  }

  ngOnInit(): void {
    this.isMobile$ = this.windowService.isUpTo(this.maxMobileWidth);
  }

  public toggleNavbar(): void {
    this.menuService.toggleMenu(this.menuID);
  }

  // Current UI language, read synchronously for the themed LINDAT portal links (in v9 LocaleService is async).
  getLangCode(): string {
    return this.translate.currentLang || environment.fallbackLanguage;
  }

  // Locale segment for the portal links: 'cs' in Czech, '' otherwise.
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
