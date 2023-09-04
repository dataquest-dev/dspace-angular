import { map } from 'rxjs/operators';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  AuthenticateAction,
  ResetAuthenticationMessagesAction
} from '../../../../core/auth/auth.actions';

import { getAuthenticationError, getAuthenticationInfo, } from '../../../../core/auth/selectors';
import { isNotEmpty } from '../../../empty.util';
import { fadeOut } from '../../../animations/fade';
import { AuthMethodType } from '../../../../core/auth/models/auth.method-type';
import { renderAuthMethodFor } from '../log-in.methods-decorator';
import { AuthMethod } from '../../../../core/auth/models/auth.method';
import { AuthService, LOGIN_ROUTE } from '../../../../core/auth/auth.service';
import { HardRedirectService } from '../../../../core/services/hard-redirect.service';
import { CoreState } from '../../../../core/core-state.model';
import { ActivatedRoute , Router} from '@angular/router';
import { getBaseUrl } from '../../../clarin-shared-util';
import { ConfigurationProperty } from '../../../../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import {ScriptLoaderService} from '../../../../clarin-navbar-top/script-loader-service';

/**
 * /users/sign-in
 * @class LogInPasswordComponent
 */
@Component({
  selector: 'ds-log-in-password',
  templateUrl: './log-in-password.component.html',
  styleUrls: ['./log-in-password.component.scss'],
  animations: [fadeOut]
})
@renderAuthMethodFor(AuthMethodType.Password)
export class LogInPasswordComponent implements OnInit {

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
   * @type {FormGroup}
   */
  public form: FormGroup;

  /**
   * The page from where the local login was initiated.
   */
  public redirectUrl = '';

  /**
   * `dspace.ui.url` property fetched from the server.
   */
  public baseUrl = '';

  /**
   * @constructor
   * @param {AuthMethod} injectedAuthMethodModel
   * @param {boolean} isStandalonePage
   * @param {AuthService} authService
   * @param {HardRedirectService} hardRedirectService
   * @param {FormBuilder} formBuilder
   * @param {Store<State>} store
   * @param route
   * @param router
   * @param configurationService
   */
  constructor(
    @Inject('authMethodProvider') public injectedAuthMethodModel: AuthMethod,
    @Inject('isStandalonePage') public isStandalonePage: boolean,
    private authService: AuthService,
    private hardRedirectService: HardRedirectService,
    private formBuilder: FormBuilder,
    private store: Store<CoreState>,
    private route: ActivatedRoute,
    protected router: Router,
    protected configurationService: ConfigurationDataService,
    private scriptLoader: ScriptLoaderService,
  ) {
    this.authMethod = injectedAuthMethodModel;
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * @method ngOnInit
   */
  public async ngOnInit() {
    // set formGroup
    this.form = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    // set error
    this.error = this.store.pipe(select(
      getAuthenticationError),
      map((error) => {
        this.hasError = (isNotEmpty(error));
        return error;
      })
    );

    // set error
    this.message = this.store.pipe(
      select(getAuthenticationInfo),
      map((message) => {
        this.hasMessage = (isNotEmpty(message));
        return message;
      })
    );

    // Load `dspace.ui.url` into `baseUrl` property.
    await this.assignBaseUrl();

    // At first load DiscoJuice, second AAI and at last AAIConfig
    this.loadDiscoJuice().then(() => {
      this.loadAAI().then(() => {
        this.loadAAIConfig().catch(error => console.log(error));
      }).catch(error => console.log(error));
    }).catch(error => console.log(error));

    // Store the `redirectUrl` value from the url and then remove that value from url.
    if (isNotEmpty(this.route.snapshot.queryParams?.redirectUrl)) {
      console.log('this.redirectUrl', this.redirectUrl);
      this.redirectUrl = this.route.snapshot.queryParams?.redirectUrl;
      void this.router.navigate([LOGIN_ROUTE]);
    } else {
      // Pop up discojuice login.
      console.log('document',document.getElementById('clarin-signon-discojuice'));
      // document.getElementsByClassName('signon').item(0).firstElementChild.parentElement.click();
      // document.querySelector('.signon').click();
      setTimeout(() => {
        // click to refresh table data because without click it still shows wrong data
        document.getElementById('clarin-signon-discojuice').click();
      }, 250);
    }
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

    // Local authentication redirects to /login page and the user should be redirected to the page from where
    // was the login initiated.
    if (!this.isStandalonePage || isNotEmpty(this.redirectUrl)) {
      this.authService.setRedirectUrl(this.redirectUrl.replace(this.baseUrl, ''));
    } else {
      this.authService.setRedirectUrlIfNotSet('/');
    }

    // dispatch AuthenticationAction
    this.store.dispatch(new AuthenticateAction(email, password));

    // clear form
    this.form.reset();
  }

  /**
   * Load the `dspace.ui.url` into `baseUrl` property.
   */
  async assignBaseUrl() {
    this.baseUrl = await getBaseUrl(this.configurationService)
      .then((baseUrlResponse: ConfigurationProperty) => {
        return baseUrlResponse?.values?.[0];
      });
  }

  private loadDiscoJuice = (): Promise<any> => {
    return this.scriptLoader.load('discojuice');
  };

  private loadAAI = (): Promise<any> => {
    return this.scriptLoader.load('aai');
  };

  private loadAAIConfig = (): Promise<any> => {
    return this.scriptLoader.load('aaiConfig');
  };

}
