import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { combineLatest as observableCombineLatest, of, Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AppState } from '../app.reducer';
import {
  AddAuthenticationMessageAction,
  AuthenticatedAction,
  AuthenticationSuccessAction,
  ResetAuthenticationMessagesAction
} from '../core/auth/auth.actions';
import { hasValue, isNotEmpty } from '../shared/empty.util';
import { AuthTokenInfo } from '../core/auth/models/auth-token-info.model';
import { isAuthenticated } from '../core/auth/selectors';
import { AuthService } from '../core/auth/auth.service';
import { EPerson } from '../core/eperson/models/eperson.model';
/**
 * This component represents the login page
 */
@Component({
  selector: 'ds-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html'
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
   * @param authService
   */
  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private authService: AuthService
  ) {}

  /**
   * Initialize instance variables
   */
  ngOnInit() {
    // initializing the auth state
    this.initializeTheAuthenticationState();

    const queryParamsObs = this.route.queryParams;
    const authenticated = this.store.select(isAuthenticated);

    this.subs.push(
      observableCombineLatest(queryParamsObs, authenticated).pipe(
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
      })
    );

  }

  /**
   * Initializes the authentication state by checking if the user is authenticated.
   * If authenticated, retrieves the authenticated user from the store and updates the `authenticatedUser` property.
   * If not authenticated or an error occurs, sets `authenticatedUser` to null.
   *
   * @returns {void}
   * @sideeffect Updates the `authenticatedUser` property of the component.
   */
  initializeTheAuthenticationState() {
    this.subs.push(
      this.authService
      .isAuthenticated()
      .pipe(
        take(1),
        switchMap((isUserAuthenticated: boolean) => {
          if (isUserAuthenticated) {
            return this.authService
              .getAuthenticatedUserFromStore()
              .pipe(take(1));
          } else {
            return of(null);
          }
        }),
      )
      .subscribe({
        next: (user: EPerson | null) => {
          this.authenticatedUser = user;
        },
        error: () => {
          this.authenticatedUser = null;
        },
      })
    );
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
