import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterReducerState } from '@ngrx/router-store';
import {
  select,
  Store,
} from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable,
  of,
  Subscription,
} from 'rxjs';
import {
  filter,
  map,
} from 'rxjs/operators';

import { APP_CONFIG, AppConfig } from '../../../config/app-config.interface';

import {
  AppState,
  routerStateSelector,
} from '../../app.reducer';
import {
  AuthService,
  LOGIN_ROUTE,
  LOGOUT_ROUTE,
} from '../../core/auth/auth.service';
import {
  isAuthenticated,
  isAuthenticationLoading,
} from '../../core/auth/selectors';
import { EPerson } from '../../core/eperson/models/eperson.model';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { ClarinWayfComponent } from '../../clarin-wayf/clarin-wayf.component';
import { IdentityProvider } from '../../clarin-wayf/models/idp-entry.model';
import { WayfConfig, WAYF_CONFIG } from '../../clarin-wayf/wayf.config';
import {
  fadeInOut,
  fadeOut,
} from '../animations/fade';
import { isNotUndefined } from '../empty.util';
import { HostWindowService } from '../host-window.service';
import { ThemedLogInComponent } from '../log-in/themed-log-in.component';
import { BrowserOnlyPipe } from '../utils/browser-only.pipe';
import { ThemedUserMenuComponent } from './user-menu/themed-user-menu.component';

@Component({
  selector: 'ds-base-auth-nav-menu',
  templateUrl: './auth-nav-menu.component.html',
  styleUrls: ['./auth-nav-menu.component.scss'],
  animations: [fadeInOut, fadeOut],
  imports: [
    AsyncPipe,
    BrowserOnlyPipe,
    ClarinWayfComponent,
    NgbDropdownModule,
    NgClass,
    RouterLink,
    RouterLinkActive,
    ThemedLogInComponent,
    ThemedUserMenuComponent,
    TranslateModule,
  ],
})
export class AuthNavMenuComponent implements OnInit {
  /**
   * Whether user is authenticated.
   * @type {Observable<string>}
   */
  public isAuthenticated$: Observable<boolean>;

  /**
   * True if the authentication is loading.
   * @type {boolean}
   */
  public loading: Observable<boolean>;

  public isMobile$: Observable<boolean>;

  public showAuth$ = of(false);

  public user: Observable<EPerson>;

  public sub: Subscription;

  /** Active login tab: 'local' for password form, 'institution' for WAYF picker. */
  readonly activeLoginTab = signal<'local' | 'institution'>('local');

  constructor(private store: Store<AppState>,
              private windowService: HostWindowService,
              private authService: AuthService,
              protected hardRedirectService: HardRedirectService,
              @Inject(APP_CONFIG) private appConfig: AppConfig,
              @Inject(WAYF_CONFIG) private wayfConfig: WayfConfig,
  ) {
    this.isMobile$ = this.windowService.isMobile();
  }

  ngOnInit(): void {
    // set isAuthenticated
    this.isAuthenticated$ = this.store.pipe(select(isAuthenticated));

    // set loading
    this.loading = this.store.pipe(select(isAuthenticationLoading));

    this.user = this.authService.getAuthenticatedUserFromStore();

    this.showAuth$ = this.store.pipe(
      select(routerStateSelector),
      filter((router: RouterReducerState) => isNotUndefined(router) && isNotUndefined(router.state)),
      map((router: RouterReducerState) => (!router.state.url.startsWith(LOGIN_ROUTE)
        && !router.state.url.startsWith(LOGOUT_ROUTE)),
      ),
    );
  }

  switchLoginTab(tab: 'local' | 'institution'): void {
    this.activeLoginTab.set(tab);
  }

  onIdpSelected(entry: IdentityProvider): void {
    // Build the Shibboleth redirect following the LINDAT pattern:
    // {spUrl}/Shibboleth.sso/Login?SAMLDS=1&target={restBase}/api/authn/shibboleth?redirectUrl={appUrl}&entityID={idp}
    const loginEndpoint = this.wayfConfig.loginEndpoint;
    const restBaseUrl = this.appConfig.rest.baseUrl;
    const currentUrl = this.hardRedirectService.getCurrentRoute();
    const redirectUrl = encodeURIComponent(window.location.origin + currentUrl);
    const target = `${restBaseUrl}/api/authn/shibboleth?redirectUrl=${redirectUrl}`;
    const ssoUrl = `${loginEndpoint}?SAMLDS=1&target=${target}&entityID=${encodeURIComponent(entry.entityID)}`;
    this.hardRedirectService.redirect(ssoUrl);
  }
}
