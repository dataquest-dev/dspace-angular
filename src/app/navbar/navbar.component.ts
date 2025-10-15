import {
  AsyncPipe,
  NgClass,
  NgComponentOutlet,
} from '@angular/common';
import {
  Component,
  Injector,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  select,
  Store,
} from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { AppState } from '../app.reducer';
import { isAuthenticated } from '../core/auth/selectors';
import { LocaleService } from '../core/locale/locale.service';
import { BrowseService } from '../core/browse/browse.service';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { slideMobileNav } from '../shared/animations/slide';
import { ThemedUserMenuComponent } from '../shared/auth-nav-menu/user-menu/themed-user-menu.component';
import {
  HostWindowService,
  WidthCategory,
} from '../shared/host-window.service';
import { MenuComponent } from '../shared/menu/menu.component';
import { MenuService } from '../shared/menu/menu.service';
import { MenuID } from '../shared/menu/menu-id.model';
import { ThemeService } from '../shared/theme-support/theme.service';

/**
 * Component representing the public navbar
 */
@Component({
  selector: 'ds-base-navbar',
  styleUrls: ['./navbar.component.scss'],
  templateUrl: './navbar.component.html',
  animations: [slideMobileNav],
  standalone: true,
  imports: [
    AsyncPipe,
    NgbDropdownModule,
    NgClass,
    NgComponentOutlet,
    ThemedUserMenuComponent,
    TranslateModule,
  ],
})
export class NavbarComponent extends MenuComponent implements OnInit {
  /**
   * The menu ID of the Navbar is PUBLIC
   * @type {MenuID.PUBLIC}
   */
  menuID = MenuID.PUBLIC;
  maxMobileWidth = WidthCategory.SM;

  /**
   * Whether user is authenticated.
   * @type {Observable<string>}
   */
  public isAuthenticated$: Observable<boolean>;

  public isMobile$: Observable<boolean>;

  public logoSrc: string;

  constructor(protected menuService: MenuService,
    protected injector: Injector,
              public windowService: HostWindowService,
              public browseService: BrowseService,
              public authorizationService: AuthorizationDataService,
              public route: ActivatedRoute,
              protected themeService: ThemeService,
              private store: Store<AppState>,
              private localeService: LocaleService
  ) {
    super(menuService, injector, authorizationService, route, themeService);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isMobile$ = this.windowService.isUpTo(this.maxMobileWidth);
    this.isAuthenticated$ = this.store.pipe(select(isAuthenticated));
    this.setLogo();
  }

  /**
   * Sets the logo source based on the current language code
   */
  setLogo() {
    this.logoSrc = this.localeService.getCurrentLanguageCode() === 'cs'
      ? '/assets/images/mendel-uni-logo-w-cs.svg'
      : '/assets/images/mendel-uni-logo-w-en.svg';
  }
}
