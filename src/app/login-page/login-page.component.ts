import {
  Component,
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
import { IdpEntry } from '../clarin-wayf/models/idp-entry.model';
import { HardRedirectService } from '../core/services/hard-redirect.service';

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
              private hardRedirectService: HardRedirectService) {}

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

  onIdpSelected(entry: IdpEntry): void {
    // Redirect to /Shibboleth.sso/Login with the chosen IdP entityID.
    // The SP handles the actual SAML AuthnRequest.
    const origin = window.location.origin;
    const returnUrl = encodeURIComponent(`${origin}/login`);
    const ssoUrl = `${origin}/Shibboleth.sso/Login?entityID=${encodeURIComponent(entry.entityID)}&target=${returnUrl}`;
    this.hardRedirectService.redirect(ssoUrl);
  }
}
