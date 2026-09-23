import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest as observableCombineLatest,
  of,
  Subscription,
} from 'rxjs';
import {
  filter,
  switchMap,
  take,
} from 'rxjs/operators';

import { AppState } from '../app.reducer';
import {
  AddAuthenticationMessageAction,
  AuthenticatedAction,
  AuthenticationSuccessAction,
  ResetAuthenticationMessagesAction,
} from '../core/auth/auth.actions';
import { AuthService } from '../core/auth/auth.service';
import { AuthTokenInfo } from '../core/auth/models/auth-token-info.model';
import { isAuthenticated } from '../core/auth/selectors';
import { EPerson } from '../core/eperson/models/eperson.model';
import {
  hasValue,
  isNotEmpty,
} from '../shared/empty.util';
import { ThemedLogInComponent } from '../shared/log-in/themed-log-in.component';

/**
 * This component represents the login page
 */
@Component({
  selector: 'ds-base-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html',
  imports: [
    RouterLink,
    ThemedLogInComponent,
    TranslateModule,
  ],
})
export class LoginPageComponent implements OnDestroy, OnInit {

  /**
   * Array to track all subscriptions and unsubscribe them onDestroy
   */
  private subs: Subscription[] = [];

  /**
   * The current authenticated user. It is null if the user is not authenticated.
   */
  authenticatedUser: EPerson | null = null;

  /**
   * Initialize instance variables
   *
   * @param {ActivatedRoute} route
   * @param {Store<AppState>} store
   * @param {AuthService} authService
   */
  constructor(private route: ActivatedRoute,
              private store: Store<AppState>,
              private authService: AuthService) {}

  /**
   * Initialize instance variables
   */
  ngOnInit() {
    this.initializeTheAuthenticationState();

    const queryParamsObs = this.route.queryParams;
    const authenticated = this.store.select(isAuthenticated);
    this.subs.push(observableCombineLatest(queryParamsObs, authenticated).pipe(
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
    }));
  }

  /**
   * Resolves the authenticated user from the store, or null when nobody is logged in.
   */
  initializeTheAuthenticationState() {
    this.subs.push(this.authService.isAuthenticated().pipe(
      take(1),
      switchMap((isUserAuthenticated: boolean) => {
        if (isUserAuthenticated) {
          return this.authService.getAuthenticatedUserFromStore().pipe(take(1));
        } else {
          return of(null);
        }
      }),
    ).subscribe({
      next: (user: EPerson | null) => {
        this.authenticatedUser = user;
      },
      error: () => {
        this.authenticatedUser = null;
      },
    }));
  }

  /**
   * Unsubscribe from subscription
   */
  ngOnDestroy() {
    this.subs
      .filter((sub) => hasValue(sub))
      .forEach((sub) => sub.unsubscribe());
    // Clear all authentication messages when leaving login page
    this.store.dispatch(new ResetAuthenticationMessagesAction());
  }
}
