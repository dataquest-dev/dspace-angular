import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest as observableCombineLatest,
  Subscription,
} from 'rxjs';
import {
  filter,
  take,
} from 'rxjs/operators';

import { AppState } from '../app.reducer';
import {
  AddAuthenticationMessageAction,
  AuthenticatedAction,
  AuthenticationSuccessAction,
  ResetAuthenticationMessagesAction,
} from '../core/auth/auth.actions';
import { AuthTokenInfo } from '../core/auth/models/auth-token-info.model';
import { isAuthenticated } from '../core/auth/selectors';
import {
  hasValue,
  isNotEmpty,
} from '../shared/empty.util';
import { ThemedLogInComponent } from '../shared/log-in/themed-log-in.component';
import { ClarinWayfComponent } from '../clarin-wayf/clarin-wayf.component';
import { IdentityProvider } from '../clarin-wayf/models/idp-entry.model';
import { WayfConfig, WAYF_CONFIG } from '../clarin-wayf/wayf.config';
import { HardRedirectService } from '../core/services/hard-redirect.service';
import { APP_CONFIG, AppConfig } from '../../config/app-config.interface';

/**
 * This component represents the login page
 */
@Component({
  selector: 'ds-base-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html',
  imports: [
    ThemedLogInComponent,
    TranslateModule,
    ClarinWayfComponent,
  ],
})
export class LoginPageComponent implements OnDestroy, OnInit {

  /**
   * Whether the WAYF institution picker is visible.
   */
  readonly wayfOpen = signal(false);

  /**
   * Subscription to unsubscribe onDestroy
   * @type {Subscription}
   */
  sub: Subscription;

  /**
   * Initialize instance variables
   *
   * @param {ActivatedRoute} route
   * @param {Store<AppState>} store
   * @param {HardRedirectService} hardRedirectService
   */
  constructor(private route: ActivatedRoute,
              private store: Store<AppState>,
              private hardRedirectService: HardRedirectService,
              @Inject(APP_CONFIG) private appConfig: AppConfig,
              @Inject(WAYF_CONFIG) private wayfConfig: WayfConfig) {
  }

  /**
   * Initialize instance variables
   */
  ngOnInit() {
    const queryParamsObs = this.route.queryParams;
    const authenticated = this.store.select(isAuthenticated);
    this.sub = observableCombineLatest(queryParamsObs, authenticated).pipe(
      filter(([params, auth]) => isNotEmpty(params.token) || isNotEmpty(params.expired)),
      take(1),
    ).subscribe(([params, auth]) => {
      const token = params.token;
      let authToken: AuthTokenInfo;
      if (!auth) {
        if (isNotEmpty(token)) {
          authToken = new AuthTokenInfo(token);
          this.store.dispatch(new AuthenticatedAction(authToken));
        } else if (isNotEmpty(params.expired)) {
          this.store.dispatch(new AddAuthenticationMessageAction('auth.messages.expired'));
        }
      } else {
        if (isNotEmpty(token)) {
          authToken = new AuthTokenInfo(token);
          this.store.dispatch(new AuthenticationSuccessAction(authToken));
        }
      }
    });
  }

  /**
   * Unsubscribe from subscription
   */
  ngOnDestroy() {
    if (hasValue(this.sub)) {
      this.sub.unsubscribe();
    }
    // Clear all authentication messages when leaving login page
    this.store.dispatch(new ResetAuthenticationMessagesAction());
  }

  toggleWayf(): void {
    this.wayfOpen.update(v => !v);
  }

  onIdpSelected(entry: IdentityProvider): void {
    // Build the Shibboleth redirect following the LINDAT pattern:
    // {spUrl}/Shibboleth.sso/Login?SAMLDS=1&target={restBase}/api/authn/shibboleth?redirectUrl={appUrl}&entityID={idp}
    const loginEndpoint = this.wayfConfig.loginEndpoint;
    const restBaseUrl = this.appConfig.rest.baseUrl;
    const redirectUrl = encodeURIComponent(window.location.origin + '/home');
    const target = `${restBaseUrl}/api/authn/shibboleth?redirectUrl=${redirectUrl}`;
    const ssoUrl = `${loginEndpoint}?SAMLDS=1&target=${target}&entityID=${encodeURIComponent(entry.entityID)}`;
    this.hardRedirectService.redirect(ssoUrl);
  }
}
