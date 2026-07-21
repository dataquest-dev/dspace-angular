import {
  AsyncPipe,
  isPlatformBrowser,
} from '@angular/common';
import {
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  select,
  Store,
} from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  Observable,
  shareReplay,
} from 'rxjs';
import {
  filter,
  map,
} from 'rxjs/operators';

import {
  getForgotPasswordRoute,
  getRegisterRoute,
} from '../../../../app-routing-paths';
import {
  AuthenticateAction,
  ResetAuthenticationMessagesAction,
} from '../../../../core/auth/auth.actions';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthMethod } from '../../../../core/auth/models/auth.method';
import {
  getAuthenticationError,
  getAuthenticationInfo,
} from '../../../../core/auth/selectors';
import { CoreState } from '../../../../core/core-state.model';
import { AuthorizationDataService } from '../../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../../core/data/feature-authorization/feature-id';
import { CookieService } from '../../../../core/services/cookie.service';
import { HardRedirectService } from '../../../../core/services/hard-redirect.service';
import { fadeOut } from '../../../animations/fade';
import { BtnDisabledDirective } from '../../../btn-disabled.directive';
import {
  isEmpty,
  isNotEmpty,
} from '../../../empty.util';
import { BrowserOnlyPipe } from '../../../utils/browser-only.pipe';

export const SHOW_DISCOJUICE_POPUP_CACHE_NAME = 'SHOW_DISCOJUICE_POPUP';

/**
 * /users/sign-in
 * @class LogInPasswordComponent
 */
@Component({
  selector: 'ds-log-in-password',
  templateUrl: './log-in-password.component.html',
  styleUrls: ['./log-in-password.component.scss'],
  animations: [fadeOut],
  imports: [
    AsyncPipe,
    BrowserOnlyPipe,
    BtnDisabledDirective,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
  ],
})
export class LogInPasswordComponent implements OnInit, OnDestroy {

  /**
   * Handle of the pending DiscoJuice popup-open timer so it can be cancelled on destroy.
   */
  private discoJuiceTimer: ReturnType<typeof setTimeout> = null;

  /**
   * The authentication method data.
   * @type {AuthMethod}
   */
  public authMethod: AuthMethod;

  /**
   * The error if authentication fails.
   * @type {Observable<string>}
   */
  public error: Observable<string>;

  /**
   * Has authentication error.
   * @type {boolean}
   */
  public hasError = false;

  /**
   * The authentication info message.
   * @type {Observable<string>}
   */
  public message: Observable<string>;

  /**
   * Has authentication message.
   * @type {boolean}
   */
  public hasMessage = false;

  /**
   * The authentication form.
   * @type {UntypedFormGroup}
   */
  public form: UntypedFormGroup;

  /**
   * Whether the current user (or anonymous) is authorized to register an account
   */
  public canRegister$: Observable<boolean>;

  /**
   * Whether or not the current user (or anonymous) is authorized to register an account
   */
  canForgot$: Observable<boolean>;

  /**
   * Shows the divider only if contains at least one link to show
   */
  canShowDivider$: Observable<boolean>;


  constructor(
    @Inject('authMethodProvider') public injectedAuthMethodModel: AuthMethod,
    @Inject('isStandalonePage') public isStandalonePage: boolean,
    private authService: AuthService,
    private hardRedirectService: HardRedirectService,
    private formBuilder: UntypedFormBuilder,
    protected store: Store<CoreState>,
    protected authorizationService: AuthorizationDataService,
    @Inject(PLATFORM_ID) protected platformId: object,
    protected storage: CookieService,
    protected zone: NgZone,
  ) {
    this.authMethod = injectedAuthMethodModel;
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * @method ngOnInit
   */
  public ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeDiscoJuiceCache();
      this.toggleDiscojuiceLogin();
    }

    // set formGroup
    this.form = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });

    // set error
    this.error = this.store.pipe(select(
      getAuthenticationError),
    map((error) => {
      this.hasError = (isNotEmpty(error));
      return error;
    }),
    );

    // set error
    this.message = this.store.pipe(
      select(getAuthenticationInfo),
      map((message) => {
        this.hasMessage = (isNotEmpty(message));
        return message;
      }),
    );

    this.canRegister$ = this.authorizationService.isAuthorized(FeatureID.EPersonRegistration).pipe(
      shareReplay({ refCount: false, bufferSize: 1 }),
    );
    this.canForgot$ = this.authorizationService.isAuthorized(FeatureID.EPersonForgotPassword).pipe(
      shareReplay({ refCount: false, bufferSize: 1 }),
    );
    this.canShowDivider$ =
      combineLatest([this.canRegister$, this.canForgot$])
        .pipe(
          map(([canRegister, canForgot]) => canRegister || canForgot),
          filter(Boolean),
        );
  }

  getRegisterRoute() {
    return getRegisterRoute();
  }

  getForgotRoute() {
    return getForgotPasswordRoute();
  }

  /**
   * Reset error or message.
   */
  public resetErrorOrMessage() {
    if (this.hasError || this.hasMessage) {
      this.store.dispatch(new ResetAuthenticationMessagesAction());
      this.hasError = false;
      this.hasMessage = false;
    }
  }

  /**
   * Submit the authentication form.
   * @method submit
   */
  public submit() {
    this.resetErrorOrMessage();
    // get email and password values
    const email: string = this.form.get('email').value;
    const password: string = this.form.get('password').value;

    // trim values
    email.trim();
    password.trim();

    if (!this.isStandalonePage) {
      this.authService.setRedirectUrl(this.hardRedirectService.getCurrentRoute());
    } else {
      this.authService.setRedirectUrlIfNotSet('/');
    }

    // dispatch AuthenticationAction
    this.store.dispatch(new AuthenticateAction(email, password));

    // clear form
    this.form.reset();
  }

  /**
   * Toggle Discojuice login. Show it every time except the case when the user click
   * on the `local` button in the discojuice box.
   * @private
   */
  private toggleDiscojuiceLogin() {
    if (this.storage.get(SHOW_DISCOJUICE_POPUP_CACHE_NAME) === true) {
      this.popUpDiscoJuiceLogin();
    }
    this.storage.set(SHOW_DISCOJUICE_POPUP_CACHE_NAME, true);
  }

  /**
   * Trigger the DiscoJuice popup by programmatically clicking the sign-on link that the AAI script
   * binds DiscoJuice to (rendered in the CLARIN top navbar).
   *
   * The AAI/DiscoJuice scripts are loaded asynchronously (and in parallel) by the navbar component,
   * so on a cold load DiscoJuice may not have bound its click handler by the time this component
   * initialises. Clicking too early is a silent no-op and the popup never opens. We therefore poll
   * (bounded) until DiscoJuice has created its popup markup (`div.discojuice`, built when it binds
   * to the sign-on link) and only then click, which reliably opens the popup regardless of how long
   * the scripts take to load.
   *
   * The polling runs OUTSIDE the Angular zone so it never keeps the application unstable (which
   * would stall SSR rendering and `fixture.whenStable()` in tests). A programmatic `click()` also
   * bypasses the sign-on link's `pointer-events: none` guard (that guard only blocks real pointer
   * input), so the popup opens even while the link is still visually disabled for the mouse.
   * @private
   */
  private popUpDiscoJuiceLogin() {
    const maxAttempts = 40; // ~10s at 250ms intervals — well beyond a normal script load
    let attempts = 0;
    this.zone.runOutsideAngular(() => {
      const tryOpen = () => {
        const signOnLink = document?.getElementById('clarin-signon-discojuice');
        // `div.discojuice` is created (hidden) when DiscoJuice binds to the sign-on link, so its
        // presence means the click handler is wired and a click will actually open the popup.
        if (signOnLink && document?.querySelector('div.discojuice')) {
          signOnLink.click();
          return;
        }
        if (++attempts < maxAttempts) {
          this.discoJuiceTimer = setTimeout(tryOpen, 250);
        }
      };
      this.discoJuiceTimer = setTimeout(tryOpen, 250);
    });
  }

  ngOnDestroy(): void {
    if (this.discoJuiceTimer) {
      clearTimeout(this.discoJuiceTimer);
    }
  }

  /**
   * Set SHOW_DISCOJUICE_POPUP_CACHE_NAME to true because the discojuice login must be popped up on init
   * if it is loaded for the first time.
   * @private
   */
  private initializeDiscoJuiceCache() {
    if (isEmpty(this.storage.get(SHOW_DISCOJUICE_POPUP_CACHE_NAME))) {
      this.storage.set(SHOW_DISCOJUICE_POPUP_CACHE_NAME, true);
    }
  }

}
