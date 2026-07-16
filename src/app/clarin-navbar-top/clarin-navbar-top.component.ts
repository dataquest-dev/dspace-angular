import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs/operators';

import { AuthService } from '../core/auth/auth.service';
import { EPerson } from '../core/eperson/models/eperson.model';
import { LocaleService } from '../core/locale/locale.service';
import { HALEndpointService } from '../core/shared/hal-endpoint.service';
import { ScriptLoaderService } from './script-loader-service';

/**
 * The component which wraps `language` and `login`/`logout + profile` operations in the top navbar.
 */
@Component({
  selector: 'ds-clarin-navbar-top',
  templateUrl: './clarin-navbar-top.component.html',
  styleUrls: ['./clarin-navbar-top.component.scss'],
  imports: [
    RouterLink,
    TranslateModule,
  ],
  providers: [ScriptLoaderService],
})
export class ClarinNavbarTopComponent implements OnInit, AfterViewInit {

  constructor(private authService: AuthService,
              private halService: HALEndpointService,
              private scriptLoader: ScriptLoaderService,
              private localeService: LocaleService,
              @Inject(PLATFORM_ID) private platformId: object) { }

  /**
   * The current authenticated user. It is null if the user is not authenticated.
   */
  authenticatedUser = null;

  /**
   * Becomes true once the AAI/DiscoJuice scripts have loaded and DiscoJuice has bound its click
   * handler to the sign-on link. Until then the sign-on link is not clickable, so a click can never
   * race ahead of the (asynchronously loaded) DiscoJuice binding and be silently dropped.
   */
  scriptsReady = false;

  /**
   * The server path e.g., `http://localhost:8080/server/api/`
   */
  repositoryPath = '';

  ngOnInit(): void {
    let authenticated = false;
    this.loadRepositoryPath();
    this.authService.isAuthenticated()
      .pipe(take(1))
      .subscribe( auth => {
        authenticated = auth;
      });

    if (authenticated) {
      this.authService.getAuthenticatedUserFromStore().subscribe((user: EPerson) => {
        this.authenticatedUser = user;
      });
    } else {
      this.authenticatedUser = null;
    }
  }

  ngAfterViewInit(): void {
    // Load scripts only in the browser and not SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadScripts();
    }
  }

  loadScripts() {
    // DiscoJuice and AAI have no ordering dependency between them (both only need jQuery, which is
    // loaded up-front in index.html), so load them in parallel; AAIConfig must run last because it
    // calls aai.setup() which uses both. Once AAIConfig has run, DiscoJuice is bound to the sign-on
    // link, so mark the link ready (see scriptsReady).
    Promise.all([this.loadDiscoJuice(), this.loadAAI()])
      .then(() => this.loadAAIConfig())
      .then(() => {
        this.scriptsReady = true;
      })
      .catch(error => console.log(error));
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

  private loadRepositoryPath() {
    this.repositoryPath = this.halService.getRootHref();
  }

  setLanguage(language) {
    this.localeService.setCurrentLanguageCode(language);
    this.localeService.refreshAfterChangeLanguage();
  }
}
