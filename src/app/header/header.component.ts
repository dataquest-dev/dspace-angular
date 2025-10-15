import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

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
import { LocaleService } from '../core/locale/locale.service';

/**
 * Represents the header with the logo and simple navigation
 */
@Component({
  selector: 'ds-base-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
  standalone: true,
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
   * Sets the logo source based on the current language code
   */
  setLogo() {
    this.logoSrc = this.localeService.getCurrentLanguageCode() === 'cs'
      ? 'assets/images/mendel-logo-cs.png'
      : 'assets/images/mendel-logo-en.png';
  }
}
