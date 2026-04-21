import {
  Component,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  select,
  Store,
} from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { AuthMethod } from '../../../../core/auth/models/auth.method';
import {
  isAuthenticated,
  isAuthenticationLoading,
} from '../../../../core/auth/selectors';
import { CoreState } from '../../../../core/core-state.model';
import { HardRedirectService } from '../../../../core/services/hard-redirect.service';
import {
  NativeWindowRef,
  NativeWindowService,
} from '../../../../core/services/window.service';
import { isEmpty } from '../../../empty.util';
import { IdentityProvider } from '../../../../clarin-wayf/models/idp-entry.model';
import { ClarinWayfComponent } from '../../../../clarin-wayf/clarin-wayf.component';

/**
 * Shibboleth login method that shows the CLARIN WAYF (Where Are You From)
 * identity provider picker as an overlay within the login page.
 *
 * Instead of hard-redirecting to the SP's Shibboleth handler,
 * this component opens an inline WAYF panel where the user can search
 * and select their identity provider. After selection, the user is
 * redirected to the Shibboleth handler with the chosen IdP's entityID.
 */
@Component({
  selector: 'ds-log-in-shibboleth-wayf',
  imports: [
    TranslateModule,
    ClarinWayfComponent,
  ],
  template: `
    <!-- Toggle button: show/hide WAYF overlay -->
    @if (!wayfOpen()) {
      <button
        class="btn btn-lg btn-primary w-100 text-white"
        (click)="openWayf()"
        tabindex="0"
      >
        <i class="fas fa-university me-2" aria-hidden="true"></i>
        {{ getButtonLabel() | translate }}
      </button>
    }

    <!-- WAYF overlay panel -->
    @if (wayfOpen()) {
      <div class="wayf-overlay" role="dialog" aria-modal="false" aria-label="Select your institution">
        <div class="wayf-overlay__header d-flex justify-content-between align-items-center mb-2">
          <h3 class="h6 mb-0">{{ 'login.wayf.header' | translate }}</h3>
          <button
            class="btn btn-sm btn-outline-secondary"
            (click)="closeWayf()"
            [attr.aria-label]="'login.wayf.close' | translate"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <ds-clarin-wayf
          [feedUrl]="feedUrl"
          (idpSelected)="onIdpSelected($event)"
        />
      </div>
    }
  `,
  styles: [`
    .wayf-overlay {
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 0.375rem;
      padding: 1rem;
      margin-top: 0.5rem;
      background-color: var(--bs-body-bg, #fff);
      max-height: 500px;
      overflow-y: auto;
    }
  `],
})
export class LogInShibbolethWayfComponent implements OnInit {

  public authMethod: AuthMethod;

  public loading: Observable<boolean>;

  /** The Shibboleth handler location URL from the backend. */
  public location: string;

  public isAuthenticated: Observable<boolean>;

  /** Whether the WAYF overlay is open. */
  readonly wayfOpen = signal(false);

  /** Feed URL for the WAYF component. Falls back to mock for development. */
  feedUrl = 'assets/mock/wayf-feed.json';

  constructor(
    @Inject('authMethodProvider') public injectedAuthMethodModel: AuthMethod,
    @Inject('isStandalonePage') public isStandalonePage: boolean,
    @Inject(NativeWindowService) protected _window: NativeWindowRef,
    private authService: AuthService,
    private hardRedirectService: HardRedirectService,
    private store: Store<CoreState>,
  ) {
    this.authMethod = injectedAuthMethodModel;
  }

  ngOnInit(): void {
    this.isAuthenticated = this.store.pipe(select(isAuthenticated));
    this.loading = this.store.pipe(select(isAuthenticationLoading));
    this.location = decodeURIComponent(this.injectedAuthMethodModel.location);
  }

  openWayf(): void {
    this.wayfOpen.set(true);
  }

  closeWayf(): void {
    this.wayfOpen.set(false);
  }

  /**
   * Called when the user selects an IdP from the WAYF component.
   * Constructs the Shibboleth handler redirect URL with the chosen entityID,
   * similar to the original SAMLDS protocol flow.
   */
  onIdpSelected(entry: IdentityProvider): void {
    this.authService.getRedirectUrl().pipe(take(1)).subscribe((redirectRoute) => {
      if (!this.isStandalonePage) {
        redirectRoute = this.hardRedirectService.getCurrentRoute();
      } else if (isEmpty(redirectRoute)) {
        redirectRoute = '/';
      }

      // Build the Shibboleth redirect URL.
      // The location from the backend is the SP's Shibboleth SSO endpoint.
      // We append the chosen IdP's entityID so the SP knows which IdP to use.
      const externalServerUrl = this.authService.getExternalServerRedirectUrl(
        this._window.nativeWindow.origin,
        redirectRoute,
        this.location,
      );

      // Append entityID parameter to the redirect URL
      const separator = externalServerUrl.includes('?') ? '&' : '?';
      const finalUrl = `${externalServerUrl}${separator}entityID=${encodeURIComponent(entry.entityID)}`;

      this.hardRedirectService.redirect(finalUrl);
    });
  }

  getButtonLabel(): string {
    return `login.form.${this.authMethod.authMethodType}`;
  }
}
